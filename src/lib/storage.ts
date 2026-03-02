import fs from "fs/promises";
import path from "path";

export interface DomainSnapshot {
  domain: string;
  timestamp: string;

  // Registration Layer
  registrar?: string;
  registrarIanaId?: string;
  created?: string;
  expires?: string;
  lastUpdated?: string;
  status?: string[];
  dnssec?: boolean;

  // DNS Layer
  nameservers?: string[];
  aRecords?: string[];
  mxRecords?: string[];
  txtRecords?: string[];
  soa?: string;

  // Infrastructure Layer
  asn?: string;
  hostingProvider?: string;
  cdnDetected?: boolean;

  // Security Layer
  sslIssuer?: string;
  sslExpires?: string;
  sslSans?: string[];
  sslFingerprint?: string;
  httpsReachable?: boolean;

  // Optional Internal Governance Metadata
  internalOwner?: string;
  licensedTo?: string;
  notes?: string;
}

interface DomainStore {
  domains: {
    [domain: string]: {
      lastSnapshot: DomainSnapshot;
    };
  };
}

const DATA_FILE = path.join(process.cwd(), "data", "domains.json");

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

export async function addDomain(domain: string, snapshot: DomainSnapshot): Promise<void> {
  const store = await readStore();
  store.domains[domain] = { lastSnapshot: snapshot };
  await writeStore(store);
}

export async function updateDomain(domain: string, snapshot: DomainSnapshot): Promise<void> {
  const store = await readStore();
  if (store.domains[domain]) {
    store.domains[domain].lastSnapshot = snapshot;
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
