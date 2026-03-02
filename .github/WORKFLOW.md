# Git Workflow for Finnoybu-Org

## Initial GitHub Setup (One-time)

If remote repository is not yet configured:

```bash
# Check if remote exists
git remote -v

# If no output, add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/finnoybu-org.git

# Verify remote was added
git remote -v

# Push initial commit and tags to GitHub
git push -u origin main
git push origin --tags
```

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
   git pull origin main  # Only if remote is configured
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

4. **Push Feature Branch to GitHub** (BEFORE merging)
   ```bash
   git push origin feature/vX.X.X-feature-description
   ```

5. **Merge to Main**
   ```bash
   git checkout main
   git merge feature/vX.X.X-feature-description --no-ff
   ```

6. **Tag Release**
   ```bash
   git tag -a vX.X.X -m "vX.X.X - Feature description"
   ```

7. **Push Main and Tags to GitHub**
   ```bash
   git push origin main
   git push origin --tags
   ```

8. **Clean Up Feature Branch** (optional - after confirming merge)
   ```bash
   git branch -d feature/vX.X.X-feature-description
   git push origin --delete feature/vX.X.X-feature-description
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
3. **Push feature branch to GitHub before merging** (for backup and visibility)
4. Merge to main with `--no-ff` (preserves feature branch history)
5. Tag the release version
6. **Push main and tags to GitHub immediately after merge**
7. Delete feature branch locally and remotely (optional cleanup)

This ensures:
- Clear version history and easy rollback if needed
- Remote backup of all feature branches before merging
- Visibility of work-in-progress on GitHub
- Clean merge history with feature branch context

---

**Last Updated:** 2026-03-02
**Current Version:** v0.0.2
**Current Branch:** main
**Remote Status:** Not configured (local-only repository)
