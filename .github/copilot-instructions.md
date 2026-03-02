<!-- Finnoybu Organization — Domain Snapshot Tool -->

# Finnoybu Domain Governance Snapshot Tool

**Project:** Finnoybu Organization — Domain Snapshot Tool  
**Framework:** Next.js 14 (App Router + TypeScript)  
**Location:** D:\dev\finnoybu-org  
**Purpose:** Query and snapshot domain RDAP, DNS, and TLS/SSL information locally

---

## Setup Progress

- [x] Project Structure
  - Next.js 14 with App Router and TypeScript
  - Local JSON file storage (data/domains.json)
  - Server-side network queries (RDAP, DNS, SSL/TLS)
  - No database required
  - No external paid APIs
  - Minimal UI with inline styles
  - Single page application

- [x] Create Storage Layer
  - Created lib/storage.ts with domain and snapshot management
  - Functions: readStore(), writeStore(), addDomain(), updateDomain(), deleteDomain(), getDomains(), getDomainSnapshot()
  - Automatic file creation on first run
  - Type-safe DomainSnapshot interface

- [x] Create Snapshot API
  - POST /api/snapshot - Create/refresh domain snapshot
  - GET /api/snapshot - List all stored domains
  - RDAP integration for registrar and date information
  - DNS queries: A, MX, TXT, NS records
  - SSL/TLS certificate queries for issuer and expiration
  - DNSSEC stub support
  - Parallel async queries with individual error handling
  - Partial failure support

- [x] Update UI
  - Single page domain management interface
  - Domain selection dropdown
  - Add domain functionality
  - Refresh snapshot button
  - Delete domain button
  - JSON output display with timestamp
  - Error handling and loading states
  - Minimal styling with no frameworks

- [x] Environment Configuration
  - Created .env.local
  - NODE_ENV=development

- [x] Documentation
  - Updated README.md with full tool description
  - Documented API endpoints
  - Described data storage format
  - Documented DomainSnapshot interface
  - Added usage instructions

- [x] Build and Verify
  - Project compiles successfully
  - No TypeScript errors
  - No build errors
  - Ready for development

---

## Project Configuration

- **TypeScript:** Enabled
- **App Router:** Enabled  
- **Framework:** Next.js 14
- **Storage:** Local JSON (data/domains.json)
- **Network:** Node.js native (dns.promises, tls)
- **External APIs:** RDAP (https://rdap.org) - read-only
- **Styling:** Inline styles only
- **Package Manager:** npm
- **Node Requirements:** 20+

---

## API Endpoints

### GET /api/snapshot
Retrieve all stored domains and their latest snapshots.

### POST /api/snapshot  
Create or refresh a domain snapshot with RDAP, DNS, and SSL queries.

### POST /api/snapshot (Delete)
Delete a domain by sending action="delete" parameter.

---

## Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5
- **Storage:** Node.js fs/promises
- **DNS:** Node.js dns.promises
- **SSL/TLS:** Node.js tls module
- **RDAP:** https://rdap.org (public API)
- **Styling:** Inline CSS only

---

## Completion Summary

✅ **Domain Snapshot Tool successfully created and ready for use**

✅ **v0.0.2 Data Model Extension - IMPLEMENTED**

✅ **v0.0.3 Backend Completion and Schema Enforcement - IMPLEMENTED**

The Finnoybu Domain Governance Snapshot Tool is now fully configured with:
- A working Next.js 14 development environment
- Local JSON-based domain and snapshot storage system
- Extended API for RDAP, DNS, and SSL/TLS queries
- Infrastructure detection (ASN, hosting provider, CDN detection)
- Enhanced SSL data capture (SANs, fingerprints, HTTPS reachability)
- DNSSEC detection via DS record queries
- WHOIS lookup for ASN and hosting provider information
- Schema validation ensuring all fields are present
- Canonical example.com boilerplate record
- Single-page UI for managing domains
- Server-side network queries only
- Development server ready on localhost:3000
- Production build capability

### Extended Data Model (v0.0.2)

The DomainSnapshot interface now includes:

**Registration Layer**
- registrarIanaId - Registrar IANA identifier
- lastUpdated - Last modification date

**DNS Layer**
- soa - SOA record information

**Infrastructure Layer**
- asn - Autonomous System Number
- hostingProvider - Detected hosting provider/ISP
- cdnDetected - Boolean flag for CDN detection

**Security Layer**
- sslSans - Subject Alternative Names array
- sslFingerprint - Certificate fingerprint (SHA256)
- httpsReachable - HTTPS connectivity indicator

**Governance Metadata**
- internalOwner - Internal owner/team
- licensedTo - Licensed division/department
- notes - Internal notes/annotations

### Backend Completion (v0.0.3)

**Enhanced RDAP Integration**
- registrarIanaId extracted from publicIds array with type "IANA Registrar ID"
- DNSSEC status from secureDNS.delegationSigned field

**DNSSEC Detection**
- Primary: RDAP secureDNS field
- Fallback: DNS DS record lookup

**WHOIS Lookup**
- Native net.Socket connection to port 43
- Parses "origin:" or "OriginAS:" for ASN
- Parses "OrgName:" or "org-name:" for hosting provider
- Fallback to ipwho.is API if WHOIS unavailable

**SSL Enhancements**
- Uses fingerprint256 (SHA256) instead of fingerprint (SHA1)
- Fallback to SHA1 if SHA256 not available

**Schema Validation**
- validateSnapshot() function ensures all 26 DomainSnapshot keys exist
- Missing keys populated with type-appropriate defaults (empty strings, empty arrays, false booleans)
- Validation runs before every addDomain() and updateDomain() operation

**Canonical Boilerplate**
- example.com record with all fields present and empty/default values
- Anchors datastore schema for reference

All implementation steps have been completed successfully. The application is ready for production deployment or further development.


