import { NextRequest, NextResponse } from "next/server";
import { promises as dns } from "dns";
import tls from "tls";
import net from "net";
import { DomainSnapshot, addDomain, updateDomain, getDomains } from "@/lib/storage";

interface ExtendedPeerCertificate extends tls.PeerCertificate {
  subjectaltname?: string;
}

interface RdapResponse {
  handle?: string;
  port43?: string;
  ldhName?: string;
  secureDNS?: {
    delegationSigned?: boolean;
  };
  entities?: Array<{
    objectClassName: string;
    handle?: string;
    publicIds?: Array<{
      type: string;
      identifier: string;
    }>;
    vcardArray?: Array<unknown>;
  }>;
  nameservers?: Array<{ ldhName?: string }>;
  status?: string[];
  events?: Array<{ eventAction: string; eventDate: string }>;
}

async function fetchRdapData(domain: string): Promise<Partial<DomainSnapshot>> {
  const result: Partial<DomainSnapshot> = {};

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (response && response.ok) {
      const data: RdapResponse = await response.json();

      // Extract registrar and IANA ID from entities
      if (data.entities) {
        for (const entity of data.entities) {
          if (
            entity.objectClassName === "entity" &&
            entity.handle &&
            entity.handle.toLowerCase().includes("registrar")
          ) {
            result.registrar = entity.handle;
            
            // Extract IANA ID from publicIds array
            if (entity.publicIds) {
              for (const publicId of entity.publicIds) {
                if (publicId.type === "IANA Registrar ID") {
                  result.registrarIanaId = publicId.identifier;
                  break;
                }
              }
            }
            break;
          }
        }
      }

      // Extract DNSSEC status from RDAP
      if (data.secureDNS?.delegationSigned !== undefined) {
        result.dnssec = data.secureDNS.delegationSigned;
      }

      // Extract nameservers
      if (data.nameservers && data.nameservers.length > 0) {
        result.nameservers = data.nameservers
          .filter((ns) => ns.ldhName)
          .map((ns) => ns.ldhName!);
      }

      // Extract status
      if (data.status) {
        result.status = data.status;
      }

      // Extract dates from events
      if (data.events) {
        for (const event of data.events) {
          if (event.eventAction === "registration") {
            result.created = event.eventDate;
          } else if (event.eventAction === "expiration") {
            result.expires = event.eventDate;
          } else if (event.eventAction === "last changed" || event.eventAction === "lastUpdate") {
            result.lastUpdated = event.eventDate;
          }
        }
      }
    }
  } catch (error) {
    console.error(`RDAP fetch error for ${domain}:`, error);
  }

  return result;
}

async function fetchDnsData(domain: string): Promise<Partial<DomainSnapshot>> {
  const result: Partial<DomainSnapshot> = {};

  try {
    // Resolve A records
    try {
      result.aRecords = await dns.resolve4(domain);
    } catch {
      // Silent fail - domain may not have A records
    }

    // Resolve MX records
    try {
      const mxRecords = await dns.resolveMx(domain);
      result.mxRecords = mxRecords.map((mx) => `${mx.priority} ${mx.exchange}`);
    } catch {
      // Silent fail
    }

    // Resolve TXT records
    try {
      const txtRecords = await dns.resolveTxt(domain);
      result.txtRecords = txtRecords.map((txt) => txt.join(""));
    } catch {
      // Silent fail
    }

    // Resolve SOA records
    try {
      const soaRecords = await dns.resolveSoa(domain);
      if (soaRecords) {
        result.soa = `${soaRecords.nsname} ${soaRecords.hostmaster} ${soaRecords.serial} ${soaRecords.refresh} ${soaRecords.retry} ${soaRecords.expire} ${soaRecords.minttl}`;
      }
    } catch {
      // Silent fail
    }

    // Note: nameservers might already be set from RDAP, but try DNS too
    if (!result.nameservers) {
      try {
        result.nameservers = await dns.resolveNs(domain);
      } catch {
        // Silent fail
      }
    }

    // Check DNSSEC via DS records if not already set from RDAP
    if (result.dnssec === undefined) {
      try {
        await dns.resolve(domain, "DS");
        result.dnssec = true;
      } catch {
        result.dnssec = false;
      }
    }
  } catch (error) {
    console.error(`DNS fetch error for ${domain}:`, error);
  }

  return result;
}

async function fetchSslData(domain: string): Promise<Partial<DomainSnapshot>> {
  const result: Partial<DomainSnapshot> = {};

  try {
    const certificate = await new Promise<ExtendedPeerCertificate>((resolve, reject) => {
      const socket = tls.connect(443, domain, { servername: domain }, function () {
        const cert = socket.getPeerCertificate() as ExtendedPeerCertificate;
        socket.destroy();
        if (cert && Object.keys(cert).length > 0) {
          resolve(cert);
        } else {
          reject(new Error("No certificate"));
        }
      });

      socket.on("error", reject);
      socket.setTimeout(5000, () => {
        socket.destroy();
        reject(new Error("Timeout"));
      });
    });

    result.httpsReachable = true;

    if (certificate.issuer?.O) {
      result.sslIssuer = Array.isArray(certificate.issuer.O)
        ? certificate.issuer.O[0]
        : certificate.issuer.O;
    } else if (certificate.issuer?.CN) {
      result.sslIssuer = Array.isArray(certificate.issuer.CN)
        ? certificate.issuer.CN[0]
        : certificate.issuer.CN;
    }

    if (certificate.valid_to) {
      result.sslExpires = certificate.valid_to;
    }

    // Extract Subject Alternative Names (SANs)
    if (certificate.subjectaltname) {
      const sanArray = certificate.subjectaltname.split(", ").map((san: string) => san.trim());
      result.sslSans = sanArray;
    }

    // Extract certificate fingerprint (prefer SHA256)
    if (certificate.fingerprint256) {
      result.sslFingerprint = certificate.fingerprint256;
    } else if (certificate.fingerprint) {
      result.sslFingerprint = certificate.fingerprint;
    }
  } catch (error) {
    console.error(`SSL fetch error for ${domain}:`, error);
    result.httpsReachable = false;
  }

  return result;
}

async function fetchWhoisData(ip: string): Promise<{ asn?: string; hostingProvider?: string }> {
  return new Promise((resolve) => {
    const whoisServer = "whois.iana.org";
    const socket = new net.Socket();
    let data = "";

    socket.setTimeout(5000);

    socket.on("data", (chunk) => {
      data += chunk.toString();
    });

    socket.on("close", () => {
      const result: { asn?: string; hostingProvider?: string } = {};

      // Parse ASN from "origin:" or "OriginAS:" lines
      const asnMatch = data.match(/(?:origin|OriginAS):\s*(?:AS)?(\d+)/i);
      if (asnMatch && asnMatch[1]) {
        result.asn = `AS${asnMatch[1]}`;
      }

      // Parse organization name from "OrgName:" or "org-name:" lines
      const orgMatch = data.match(/(?:OrgName|org-name):\s*(.+)/i);
      if (orgMatch && orgMatch[1]) {
        result.hostingProvider = orgMatch[1].trim();
      }

      resolve(result);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({});
    });

    socket.on("error", () => {
      resolve({});
    });

    socket.connect(43, whoisServer, () => {
      socket.write(`${ip}\r\n`);
    });
  });
}

async function fetchInfrastructureData(domain: string): Promise<Partial<DomainSnapshot>> {
  const result: Partial<DomainSnapshot> = {};

  try {
    // Attempt to get A records if not already fetched
    let aRecords: string[] = [];
    try {
      aRecords = await dns.resolve4(domain);
    } catch {
      // Silent fail
    }

    if (aRecords.length > 0) {
      const ip = aRecords[0];

      // Try WHOIS lookup for ASN and hosting provider
      try {
        const whoisData = await fetchWhoisData(ip);
        if (whoisData.asn) {
          result.asn = whoisData.asn;
        }
        if (whoisData.hostingProvider) {
          result.hostingProvider = whoisData.hostingProvider;
        }
      } catch (error) {
        console.error(`WHOIS lookup error:`, error);
      }

      // Fallback to ipwho.is if WHOIS didn't provide data
      if (!result.asn || !result.hostingProvider) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const response = await fetch(`https://ipwho.is/${ip}`, {
            signal: controller.signal,
          }).catch(() => null);

          clearTimeout(timeoutId);

          if (response && response.ok) {
            const data = await response.json();

            if (data.asn && !result.asn) {
              result.asn = data.asn;
            }

            if (data.isp && !result.hostingProvider) {
              result.hostingProvider = data.isp;
            }
          }
        } catch (error) {
          console.error(`Infrastructure lookup error:`, error);
        }
      }

      // Detect CDN based on common CDN ISPs
      const cdnProviders = [
        "cloudflare",
        "akamai",
        "fastly",
        "cloudfront",
        "stackpath",
        "cachefly",
        "bunnycdn",
        "incapsula",
      ];
      const hostingProviderLower = (result.hostingProvider || "").toLowerCase();
      result.cdnDetected = cdnProviders.some((cdn) => hostingProviderLower.includes(cdn));
    }
  } catch (error) {
    console.error(`Infrastructure fetch error for ${domain}:`, error);
  }

  return result;
}

async function createSnapshot(domain: string): Promise<DomainSnapshot> {
  const timestamp = new Date().toISOString();

  // Fetch data from all sources in parallel
  const [rdapData, dnsData, sslData, infrastructureData] = await Promise.all([
    fetchRdapData(domain),
    fetchDnsData(domain),
    fetchSslData(domain),
    fetchInfrastructureData(domain),
  ]);

  // Merge all data
  const snapshot: DomainSnapshot = {
    domain,
    timestamp,
    ...rdapData,
    ...dnsData,
    ...sslData,
    ...infrastructureData,
  };

  return snapshot;
}

export async function POST(request: NextRequest) {
  try {
    const { domain, action } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    const normalizedDomain = domain.toLowerCase().trim();

    if (action === "delete") {
      const { deleteDomain } = await import("@/lib/storage");
      const success = await deleteDomain(normalizedDomain);

      if (!success) {
        return NextResponse.json({ error: "Domain not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: "Domain deleted" });
    }

    // Default action: create/update snapshot
    const snapshot = await createSnapshot(normalizedDomain);

    const domains = await getDomains();
    if (domains.includes(normalizedDomain)) {
      await updateDomain(normalizedDomain, snapshot);
    } else {
      await addDomain(normalizedDomain, snapshot);
    }

    return NextResponse.json(snapshot, { status: 201 });
  } catch (error) {
    console.error("Snapshot API error:", error);
    return NextResponse.json(
      { error: "Failed to create snapshot", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { getDomains, getDomainSnapshot } = await import("@/lib/storage");
    const domains = await getDomains();

    const domainsList = await Promise.all(
      domains.map(async (domain) => {
        const snapshot = await getDomainSnapshot(domain);
        return { domain, snapshot };
      })
    );

    return NextResponse.json({ domains: domainsList });
  } catch (error) {
    console.error("GET snapshot error:", error);
    return NextResponse.json({ error: "Failed to fetch domains" }, { status: 500 });
  }
}
