# Deployment

This document defines deployment expectations for Domain Integrity Engine.

## Scope

- Production deployment posture for reverse proxy + Node runtime
- Environment variable requirements
- Operational controls and validation

## Recommended Topology

1. Edge DNS and TLS policy via Cloudflare
2. Reverse proxy via Caddy
3. Next.js Node application process
4. Persistent filesystem for snapshot retention (`data/snapshots`)

## Required Environment Variables

- `NODE_ENV=production`
- `AUTH_ENABLED=true`
- `AUTH_TOKEN=<strong-random-token>`
- `RATE_LIMIT_ENABLED=true` (recommended)

## Runtime Requirements

- Node.js 20+
- Writable storage path for runtime snapshot files
- Outbound network access for RDAP, DNS, and TLS remote checks

## Operational Controls

- Run behind reverse proxy; do not expose internal process directly
- Restrict inbound traffic to expected ports
- Rotate `AUTH_TOKEN` on a regular interval
- Monitor API status and error rates
- Keep host and runtime patched

## Verification

- `npm run lint`
- `npm run build`
- Confirm authenticated access to protected endpoints
- Confirm deterministic response behavior for `401`, `429`, and `5xx` paths

## Release Discipline

- Feature branch → pull request → squash merge to `main`
- Annotated version tag created on `main` only
- Tag pushed after merge and verification
