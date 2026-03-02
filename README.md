# Finnoybu Domain Snapshot Tool

A Next.js 14 application for capturing and managing domain governance snapshots. This tool queries RDAP, DNS, and TLS/SSL information for domains and stores timestamped snapshots locally.

## Features

- **Domain Management** - Add, view, and delete domains
- **RDAP Queries** - Fetch registrar, registration dates, status, and nameservers
- **DNS Lookups** - Resolve A, MX, TXT, and NS records using Node.js dns.promises
- **SSL Certificate Info** - Extract issuer and expiration from TLS connections
- **Local Storage** - All snapshots stored in local JSON file (no database required)
- **Snapshot History** - Each domain stores its most recent snapshot with timestamp
- **Minimal UI** - Simple, clean interface with no external styling frameworks

## Getting Started

### Prerequisites

- Node.js 20+
- npm (or yarn/pnpm/bun)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Add a Domain** - Click "Add Domain" and enter a domain name (e.g., example.com)
2. **View Snapshot** - Select a domain from the dropdown to see its latest snapshot
3. **Refresh Snapshot** - Click "Refresh Snapshot" to query RDAP, DNS, and SSL data
4. **Delete Domain** - Click "Delete Domain" to remove a domain and its snapshot

## Project Structure

```
finnoybu-org/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── snapshot/
│   │   │       └── route.ts        # Snapshot API (RDAP, DNS, SSL queries)
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Single-page domain management UI
│   │   └── globals.css
│   └── lib/
│       └── storage.ts              # Local file storage functions
├── data/
│   └── domains.json                # Local domain and snapshot storage
├── .env.local                      # Environment configuration
├── .gitignore
├── package.json
└── tsconfig.json
```

## API Endpoints

### GET /api/snapshot
Returns all stored domains and their latest snapshots.

```json
{
  "domains": [
    {
      "domain": "example.com",
      "snapshot": {
        "domain": "example.com",
        "timestamp": "2026-03-02T14:30:00.000Z",
        "registrar": "EXAMPLE REGISTRAR",
        "registrarIanaId": "12345",
        "created": "2020-01-01T00:00:00Z",
        "expires": "2027-01-01T00:00:00Z",
        "lastUpdated": "2026-02-15T10:00:00Z",
        "status": ["ok"],
        "dnssec": true,
        "nameservers": ["ns1.example.com", "ns2.example.com"],
        "aRecords": ["93.184.216.34"],
        "mxRecords": ["10 mail.example.com"],
        "txtRecords": ["v=spf1 ..."],
        "soa": "ns1.example.com. hostmaster.example.com. 2026030201 3600 900 1209600 3600",
        "asn": "AS15169",
        "hostingProvider": "Google LLC",
        "cdnDetected": true,
        "sslIssuer": "Let's Encrypt",
        "sslExpires": "2027-03-02T00:00:00Z",
        "sslSans": ["example.com", "www.example.com"],
        "sslFingerprint": "AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90",
        "httpsReachable": true,
        "internalOwner": "Team A",
        "licensedTo": "Corp Division B",
        "notes": "Production domain"
      }
    }
  ]
}
```

### POST /api/snapshot
Create or refresh a domain snapshot.

**Request:**
```json
{
  "domain": "example.com"
}
```

**Response:** Returns the newly created/updated `DomainSnapshot` object.

### POST /api/snapshot (Delete)
Delete a domain.

**Request:**
```json
{
  "domain": "example.com",
  "action": "delete"
}
```

## Data Storage

Domains and snapshots are stored in `data/domains.json`:

```json
{
  "domains": {
    "example.com": {
      "lastSnapshot": {
        "domain": "example.com",
        "timestamp": "2026-03-02T14:30:00.000Z",
        "registrar": "...",
        ...
      }
    }
  }
}
```

## Snapshot Data Model

```typescript
interface DomainSnapshot {
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
```

## Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Storage:** Local JSON files
- **DNS:** Node.js `dns.promises` module
- **SSL/TLS:** Node.js `tls` module
- **API:** RDAP (https://rdap.org)
- **Styling:** Inline styles (no frameworks)

## Notes

- Network queries (RDAP, DNS, SSL) are performed server-side only
- Partial failures are allowed - snapshots will contain available data
- All network requests have timeouts to prevent hanging
- No authentication or authorization implemented
- No external paid APIs required

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## License

Private - Finnoybu Organization



## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
