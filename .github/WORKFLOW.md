# Git Workflow for Finnoybu-Org

## Branching Strategy

### Branch Naming Convention
- `feature/vX.X.X-feature-name` - New features or major changes
- `fix/issue-description` - Bug fixes
- `docs/update-description` - Documentation updates
- `refactor/component-name` - Code refactoring

### Workflow Process

#### For Each Instruction Set / Feature:

1. **Create Feature Branch BEFORE Starting Work**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/vX.X.X-feature-description
   ```

2. **Work on the Feature**
   - Implement changes
   - Test thoroughly
   - Ensure build passes (`npm run build`)
   - Check for TypeScript/ESLint errors

3. **Stage and Commit Changes**
   ```bash
   git add .
   git commit -m "feat: vX.X.X - Description of changes
   
   - Detailed change 1
   - Detailed change 2
   - Detailed change 3"
   ```

4. **Merge to Main**
   ```bash
   git checkout main
   git merge feature/vX.X.X-feature-description --no-ff
   ```

5. **Tag Release**
   ```bash
   git tag -a vX.X.X -m "vX.X.X - Feature description"
   ```

6. **Push to Remote** (when ready)
   ```bash
   git push origin main --tags
   ```

7. **Clean Up Feature Branch** (optional)
   ```bash
   git branch -d feature/vX.X.X-feature-description
   ```

## Commit Message Format

### Structure
```
<type>: <short summary>

<detailed description>

- Bullet point 1
- Bullet point 2
- Bullet point 3
```

### Types
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## Version History

### v0.0.2 - Domain Snapshot Tool with Extended Data Model (2026-03-02)
**Branch:** `feature/v0.0.1-domain-snapshot-tool` (combined)
**Status:** ✅ Merged to main

**Changes:**
- Converted property management app to domain snapshot tool
- Created storage layer with JSON file management
- Implemented RDAP, DNS, and SSL/TLS snapshot queries
- Extended data model with:
  - Registration layer: registrarIanaId, lastUpdated
  - DNS layer: SOA records
  - Infrastructure layer: ASN, hosting provider, CDN detection
  - Security layer: SANs, fingerprints, HTTPS reachability
  - Governance metadata: internal owner, licensed to, notes
- Fixed TypeScript errors with proper type definitions

**Note:** This release combined both v0.0.1 and v0.0.2 work into a single commit.
Going forward, we will maintain strict separation between versions.

## Future Workflow

Starting with the next instruction set, we will:
1. Create a dedicated feature branch **before** any work begins
2. Commit only changes relevant to that specific instruction set
3. Merge and tag immediately after completion
4. Start fresh branch for next instruction set

This ensures clear version history and easy rollback if needed.

---

**Last Updated:** 2026-03-02
**Current Version:** v0.0.2
**Current Branch:** main
