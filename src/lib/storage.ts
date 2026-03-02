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
const SAMPLE_FILE = path.join(process.cwd(), "data", "domains.sample.json");

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
    // Runtime datastore does not exist; initialize from sample template
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    try {
      // Attempt to copy from sample template
      const sampleData = await fs.readFile(SAMPLE_FILE, "utf-8");
      await fs.writeFile(DATA_FILE, sampleData, "utf-8");
    } catch {
      // Fallback: create empty store if sample doesn't exist
      const defaultStore: DomainStore = { domains: {} };
      await fs.writeFile(DATA_FILE, JSON.stringify(defaultStore, null, 2), "utf-8");
    }
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

// ============================================================================
// v0.1.1 Snapshot History & Persistence Engine
// ============================================================================

const SNAPSHOTS_DIR = path.join(process.cwd(), "data", "snapshots");

/**
 * Converts ISO timestamp to filesystem-safe format: YYYY-MM-DDTHH-mm-ssZ
 * Uses hyphens instead of colons in time portion for filesystem compatibility.
 */
function timestampToFilename(timestamp: string): string {
  // Convert ISO 8601 (2026-03-02T14:30:45.123Z) to (2026-03-02T14-30-45Z)
  // Remove milliseconds, then replace all colons with hyphens in the time portion
  return timestamp.split(".")[0].replace(/:/g, "-") + "Z";
}

/**
 * Writes snapshot to disk with atomic rename (write to temp file, then rename).
 * Ensures file is fully written before being visible.
 */
async function atomicWriteSnapshot(domain: string, snapshot: DomainSnapshot): Promise<string> {
  const domainDir = path.join(SNAPSHOTS_DIR, domain);
  
  // Ensure domain snapshot directory exists
  await fs.mkdir(domainDir, { recursive: true });

  const filename = timestampToFilename(snapshot.timestamp);
  const filepath = path.join(domainDir, `${filename}.json`);
  
  // Write to temporary file in the same directory to avoid cross-device link errors on Windows
  const tempfile = path.join(
    domainDir,
    `.${filename}.tmp.${Math.random().toString(36).slice(2, 9)}`
  );

  try {
    // Write to temp file
    await fs.writeFile(tempfile, JSON.stringify(snapshot, null, 2), "utf-8");
    
    // Atomic rename (same directory = safe on all platforms)
    await fs.rename(tempfile, filepath);
    
    return filepath;
  } catch (error) {
    // Clean up temp file if rename failed
    try {
      await fs.unlink(tempfile);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Lists snapshots for a domain, sorted by timestamp (newest first).
 */
async function listSnapshotsForDomain(domain: string): Promise<DomainSnapshot[]> {
  const domainDir = path.join(SNAPSHOTS_DIR, domain);
  
  try {
    await fs.mkdir(domainDir, { recursive: true });
    const files = await fs.readdir(domainDir);
    
    // Filter JSON files and sort by modification time (newest first)
    const jsonFiles = files.filter((f) => f.endsWith(".json"));
    const snapshots: DomainSnapshot[] = [];

    for (const file of jsonFiles) {
      try {
        const filepath = path.join(domainDir, file);
        const content = await fs.readFile(filepath, "utf-8");
        const snapshot = JSON.parse(content) as DomainSnapshot;
        snapshots.push(snapshot);
      } catch (error) {
        console.error(`Error reading snapshot file ${file}:`, error);
      }
    }

    // Sort by timestamp, newest first
    snapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return snapshots;
  } catch (error) {
    console.error(`Error listing snapshots for ${domain}:`, error);
    return [];
  }
}

/**
 * Enforces 2-snapshot retention policy: keeps only the 2 most recent snapshots.
 * Deletes older snapshots if count exceeds 2.
 */
async function enforceSnapshotRetention(domain: string): Promise<void> {
  const domainDir = path.join(SNAPSHOTS_DIR, domain);
  
  try {
    const files = await fs.readdir(domainDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json")).sort();

    // If more than 2 snapshots exist, delete the oldest ones
    if (jsonFiles.length > 2) {
      const filesToDelete = jsonFiles.slice(0, jsonFiles.length - 2);
      
      for (const file of filesToDelete) {
        const filepath = path.join(domainDir, file);
        await fs.unlink(filepath);
      }
    }
  } catch (error) {
    console.error(`Error enforcing retention for ${domain}:`, error);
  }
}

/**
 * Persists a snapshot: writes to disk, enforces retention, and updates store.
 * Returns the filepath of the written snapshot.
 */
export async function persistSnapshot(domain: string, snapshot: DomainSnapshot): Promise<string> {
  const validatedSnapshot = validateSnapshot(snapshot);
  
  // Write to disk with atomic rename
  const filepath = await atomicWriteSnapshot(domain, validatedSnapshot);
  
  // Enforce retention policy (keep max 2 snapshots)
  await enforceSnapshotRetention(domain);
  
  // Also update the legacy store for backward compatibility
  const store = await readStore();
  store.domains[domain] = { lastSnapshot: validatedSnapshot };
  await writeStore(store);
  
  return filepath;
}

/**
 * Gets the most recent snapshot for a domain from disk.
 * Falls back to legacy store if not found in filesystem.
 */
export async function getLatestSnapshot(domain: string): Promise<DomainSnapshot | null> {
  const snapshots = await listSnapshotsForDomain(domain);
  
  if (snapshots.length > 0) {
    return snapshots[0]; // Already sorted newest first
  }
  
  // Fallback to legacy store
  return getDomainSnapshot(domain);
}

/**
 * Gets all snapshots for a domain (max 2), sorted newest first.
 */
export async function getSnapshotHistory(domain: string): Promise<DomainSnapshot[]> {
  return listSnapshotsForDomain(domain);
}

// ============================================================================
// v0.1.2 Deterministic Diff Engine
// ============================================================================

export interface DiffEntry {
  path: string;
  from: unknown;
  to: unknown;
}

/**
 * Recursively compares two objects and returns a flat list of changes.
 * Ignores the 'timestamp' field.
 * Sorts object keys before comparing for deterministic output.
 * Normalizes arrays before comparing (by value, not index).
 */
function createDiff(
  previous: unknown,
  latest: unknown,
  prefix = "",
  ignoreFields = new Set(["timestamp"])
): DiffEntry[] {
  const diffs: DiffEntry[] = [];

  // Handle null/undefined
  if (previous === null || previous === undefined || latest === null || latest === undefined) {
    if (previous !== latest) {
      diffs.push({ path: prefix || "root", from: previous, to: latest });
    }
    return diffs;
  }

  // Handle arrays: normalize and compare by value
  if (Array.isArray(previous) && Array.isArray(latest)) {
    const prevSorted = JSON.parse(JSON.stringify(previous)).sort((a: unknown, b: unknown) =>
      JSON.stringify(a).localeCompare(JSON.stringify(b))
    );
    const latestSorted = JSON.parse(JSON.stringify(latest)).sort((a: unknown, b: unknown) =>
      JSON.stringify(a).localeCompare(JSON.stringify(b))
    );

    // Compare sorted arrays
    if (JSON.stringify(prevSorted) !== JSON.stringify(latestSorted)) {
      diffs.push({ path: prefix, from: prevSorted, to: latestSorted });
    }
    return diffs;
  }

  // Handle objects: sort keys before comparing
  if (typeof previous === "object" && typeof latest === "object") {
    const prevKeys = Object.keys(previous as Record<string, unknown>).sort();
    const latestKeys = Object.keys(latest as Record<string, unknown>).sort();

    // Get union of all keys
    const allKeys = new Set([...prevKeys, ...latestKeys]);

    for (const key of Array.from(allKeys).sort()) {
      // Skip ignored fields
      if (ignoreFields.has(key)) {
        continue;
      }

      const prevVal = (previous as Record<string, unknown>)[key];
      const latestVal = (latest as Record<string, unknown>)[key];

      const newPrefix = prefix ? `${prefix}.${key}` : key;

      // Recursively compare nested structures
      if (typeof prevVal === "object" && typeof latestVal === "object") {
        diffs.push(...createDiff(prevVal, latestVal, newPrefix, ignoreFields));
      } else if (prevVal !== latestVal) {
        diffs.push({ path: newPrefix, from: prevVal, to: latestVal });
      }
    }

    return diffs;
  }

  // Handle primitives
  if (previous !== latest) {
    diffs.push({ path: prefix, from: previous, to: latest });
  }

  return diffs;
}

/**
 * Computes the deterministic diff between latest and previous snapshots for a domain.
 * Returns empty array if fewer than 2 snapshots exist.
 * Output is sorted by path (deterministic).
 */
export async function getDomainDiff(domain: string): Promise<DiffEntry[]> {
  const snapshots = await getSnapshotHistory(domain);

  // Need at least 2 snapshots to compute a diff
  if (snapshots.length < 2) {
    return [];
  }

  // snapshots are sorted newest first, so:
  // snapshots[0] = latest
  // snapshots[1] = previous
  const latest = snapshots[0];
  const previous = snapshots[1];

  const diffs = createDiff(previous, latest);

  // Sort by path for deterministic output
  diffs.sort((a, b) => a.path.localeCompare(b.path));

  return diffs;
}

// ============================================================================
// v0.1.3 Stability Classification Engine
// ============================================================================

export interface StatusSignal {
  rule: string;
  path: string;
}

export interface StatusResult {
  status: "stable" | "drift" | "risk";
  signals: StatusSignal[];
}

/**
 * Applies deterministic classification rules to a list of diffs.
 * Returns status and list of triggered signals.
 *
 * Rules:
 * - risk: registrar_change, nameserver_change, mx_change, spf_removed, dmarc_removed, asn_change
 * - drift: tls_expiration_changed, soa_serial_change
 * - stable: no_changes_detected
 *
 * Priority: risk > drift > stable
 */
export function applyClassificationRules(diffs: DiffEntry[]): StatusResult {
  const signals: StatusSignal[] = [];
  let riskDetected = false;
  let driftDetected = false;

  // No diffs means stable
  if (diffs.length === 0) {
    return {
      status: "stable",
      signals: [{ rule: "no_changes_detected", path: "" }],
    };
  }

  // Evaluate each diff against classification rules
  for (const diff of diffs) {
    const path = diff.path.toLowerCase();

    // RISK RULES
    if (path === "registrar") {
      signals.push({ rule: "registrar_change", path: diff.path });
      riskDetected = true;
    } else if (path === "nameservers") {
      signals.push({ rule: "nameserver_change", path: diff.path });
      riskDetected = true;
    } else if (path === "mxrecords") {
      signals.push({ rule: "mx_change", path: diff.path });
      riskDetected = true;
    } else if (path === "spfrecord") {
      // SPF removed if from has value and to is empty
      if (diff.from && !diff.to) {
        signals.push({ rule: "spf_removed", path: diff.path });
        riskDetected = true;
      }
    } else if (path === "dmarcrecord") {
      // DMARC removed if from has value and to is empty
      if (diff.from && !diff.to) {
        signals.push({ rule: "dmarc_removed", path: diff.path });
        riskDetected = true;
      }
    } else if (path === "asn") {
      signals.push({ rule: "asn_change", path: diff.path });
      riskDetected = true;
    }
    // DRIFT RULES
    else if (path === "sslexpires") {
      signals.push({ rule: "tls_expiration_changed", path: diff.path });
      driftDetected = true;
    } else if (path === "soa.serial") {
      signals.push({ rule: "soa_serial_change", path: diff.path });
      driftDetected = true;
    }
  }

  // Determine final status based on priority: risk > drift > stable
  const status: StatusResult["status"] = riskDetected ? "risk" : driftDetected ? "drift" : "stable";

  return {
    status,
    signals,
  };
}

/**
 * Gets the stability status for a domain by computing the diff and applying classification rules.
 * Returns stable status if fewer than 2 snapshots exist.
 */
export async function getDomainStatus(domain: string): Promise<StatusResult> {
  try {
    const diffs = await getDomainDiff(domain);
    return applyClassificationRules(diffs);
  } catch (error) {
    console.error(`Error computing status for ${domain}:`, error);
    // Return stable on error
    return {
      status: "stable",
      signals: [{ rule: "error_fallback", path: "" }],
    };
  }
}
