import fs from "fs/promises";
import path from "path";

export interface DomainSOA {
  primaryNs: string;
  hostmaster: string;
  serial: number;
  refresh: number;
  retry: number;
  expire: number;
  minimum: number;
}

export interface DomainSnapshot {
  // Core Identity
  domain: string;
  timestamp: string;

  // Registration Layer (RDAP)
  registrar?: string;
  registrarIanaId?: string;
  registrantOrganization?: string;
  created?: string;
  expires?: string;
  lastUpdated?: string;
  status?: string[];
  dnssec?: boolean;

  // DNS Layer
  nameservers?: string[];
  soa?: DomainSOA | null;
  aRecords?: string[];
  aaaaRecords?: string[];
  cnameRecords?: string[];
  mxRecords?: string[];
  txtRecords?: string[];
  srvRecords?: string[];

  // Infrastructure Layer
  ipAddresses?: string[];
  asn?: string;
  asnName?: string;
  hostingProvider?: string;
  cdnDetected?: boolean;
  ipCountry?: string;

  // TLS / Security Layer
  httpsReachable?: boolean;
  sslIssuer?: string;
  sslSubject?: string;
  sslSans?: string[];
  sslValidFrom?: string;
  sslExpires?: string;
  sslFingerprint?: string;
  hstsEnabled?: boolean;

  // Email Security Layer
  spfRecord?: string;
  dmarcRecord?: string;
  dkimSelectors?: string[];

  // Internal Governance Metadata
  internalOwner?: string;
  licensedTo?: string;
  notes?: string;

  // Level 3: Advanced Registration / RDAP
  rdapEntities?: Record<string, unknown>[];
  rdapRaw?: Record<string, unknown> | null;
  registrantContactEmail?: string;
  registrantCountry?: string;
  registryOperator?: string;

  // Level 3: Advanced DNS Security
  dnskeyRecords?: string[];
  dsRecords?: string[];
  caaRecords?: string[];
  zoneTransferAllowed?: boolean;

  // Level 3: Advanced TLS Analysis
  sslChainValid?: boolean;
  sslChainDepth?: number;
  sslSignatureAlgorithm?: string;
  sslPublicKeyAlgorithm?: string;
  sslKeySize?: number;
  sslOcspStapled?: boolean;

  // Level 3: HTTP Security Headers
  hstsMaxAge?: number;
  hstsPreload?: boolean;
  cspHeaderPresent?: boolean;
  xFrameOptionsPresent?: boolean;
  referrerPolicyPresent?: boolean;

  // Level 3: IP Intelligence
  ipReputationScore?: number;
  ipBlacklistHits?: string[];
  ipRir?: string;
  ipAllocationDate?: string;

  // Level 3: Snapshot Integrity / Monitoring
  snapshotHash?: string;
  previousSnapshotHash?: string;
  changeSummary?: Array<Record<string, unknown>>;
  riskScore?: number;
}

interface DomainStore {
  domains: {
    [domain: string]: {
      lastSnapshot: DomainSnapshot;
    };
  };
}

const DATA_FILE = path.join(process.cwd(), "data", "domains.json");

/**
 * Returns a canonical base DomainSnapshot with all fields present (v0.0.7 schema).
 * Level 1-2 fields are populated by snapshot queries.
 * Level 3 fields are future-proofing for audit/compliance and remain empty in v0.0.x.
 * All values are initialized to empty/default values appropriate for their type.
 * This serves as the foundation for all snapshot generation.
 */
export function getCanonicalBase(domain: string, timestamp: string = new Date().toISOString()): DomainSnapshot {
  return {
    // Core Identity
    domain,
    timestamp,

    // Registration Layer
    registrar: "",
    registrarIanaId: "",
    registrantOrganization: "",
    created: "",
    expires: "",
    lastUpdated: "",
    status: [],
    dnssec: false,

    // DNS Layer
    nameservers: [],
    soa: null,
    aRecords: [],
    aaaaRecords: [],
    cnameRecords: [],
    mxRecords: [],
    txtRecords: [],
    srvRecords: [],

    // Infrastructure Layer
    ipAddresses: [],
    asn: "",
    asnName: "",
    hostingProvider: "",
    cdnDetected: false,
    ipCountry: "",

    // TLS / Security Layer
    httpsReachable: false,
    sslIssuer: "",
    sslSubject: "",
    sslSans: [],
    sslValidFrom: "",
    sslExpires: "",
    sslFingerprint: "",
    hstsEnabled: false,

    // Email Security Layer
    spfRecord: "",
    dmarcRecord: "",
    dkimSelectors: [],

    // Internal Governance Metadata
    internalOwner: "",
    licensedTo: "",
    notes: "",

    // Level 3: Advanced Registration / RDAP
    rdapEntities: [],
    rdapRaw: null,
    registrantContactEmail: "",
    registrantCountry: "",
    registryOperator: "",

    // Level 3: Advanced DNS Security
    dnskeyRecords: [],
    dsRecords: [],
    caaRecords: [],
    zoneTransferAllowed: false,

    // Level 3: Advanced TLS Analysis
    sslChainValid: false,
    sslChainDepth: 0,
    sslSignatureAlgorithm: "",
    sslPublicKeyAlgorithm: "",
    sslKeySize: 0,
    sslOcspStapled: false,

    // Level 3: HTTP Security Headers
    hstsMaxAge: 0,
    hstsPreload: false,
    cspHeaderPresent: false,
    xFrameOptionsPresent: false,
    referrerPolicyPresent: false,

    // Level 3: IP Intelligence
    ipReputationScore: 0,
    ipBlacklistHits: [],
    ipRir: "",
    ipAllocationDate: "",

    // Level 3: Snapshot Integrity / Monitoring
    snapshotHash: "",
    previousSnapshotHash: "",
    changeSummary: [],
    riskScore: 0,
  };
}

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    const defaultStore: DomainStore = { domains: {} };
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultStore, null, 2), "utf-8");
  }
}

export async function readStore(): Promise<DomainStore> {
  try {
    await ensureDataFile();
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading store:", error);
    return { domains: {} };
  }
}

export async function writeStore(store: DomainStore): Promise<void> {
  try {
    await ensureDataFile();
    await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing store:", error);
    throw error;
  }
}

/**
 * Validates that a snapshot has all required DomainSnapshot keys per v0.0.7 schema.
 * Keys may have undefined values, but the keys themselves must exist.
 * Uses canonical base to ensure completeness.
 */
function validateSnapshot(snapshot: DomainSnapshot): DomainSnapshot {
  const canonical = getCanonicalBase(snapshot.domain, snapshot.timestamp);
  const validatedSnapshot = { ...canonical };

  // Merge in provided snapshot values, preserving all canonical keys
  for (const key in snapshot) {
    const value = snapshot[key as keyof DomainSnapshot];
    if (value !== undefined) {
      (validatedSnapshot as Record<string, unknown>)[key] = value;
    }
  }

  return validatedSnapshot;
}

export async function addDomain(domain: string, snapshot: DomainSnapshot): Promise<void> {
  const validatedSnapshot = validateSnapshot(snapshot);
  const store = await readStore();
  store.domains[domain] = { lastSnapshot: validatedSnapshot };
  await writeStore(store);
}

export async function updateDomain(domain: string, snapshot: DomainSnapshot): Promise<void> {
  const validatedSnapshot = validateSnapshot(snapshot);
  const store = await readStore();
  if (store.domains[domain]) {
    store.domains[domain].lastSnapshot = validatedSnapshot;
    await writeStore(store);
  }
}

export async function deleteDomain(domain: string): Promise<boolean> {
  const store = await readStore();
  if (store.domains[domain]) {
    delete store.domains[domain];
    await writeStore(store);
    return true;
  }
  return false;
}

export async function getDomains(): Promise<string[]> {
  const store = await readStore();
  return Object.keys(store.domains);
}

export async function getDomainSnapshot(domain: string): Promise<DomainSnapshot | null> {
  const store = await readStore();
  return store.domains[domain]?.lastSnapshot || null;
}
