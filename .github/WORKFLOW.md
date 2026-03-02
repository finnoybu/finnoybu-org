# Git Workflow for Finnoybu-Org

## Instruction Set Detection

**TRIGGER:** When you receive a markdown file with naming pattern `v#.#.#-description.md`

This signals the start of a NEW instruction set. Immediately:

1. **Commit any uncommitted changes** on current branch
   ```bash
   git add .
   git commit -m "wip: Save current work before new instruction set"
   ```

2. **Push current branch to GitHub** (if not already pushed)
   ```bash
   git push origin <current-branch-name>
   ```

3. **Switch to main and create new feature branch**
   ```bash
   git checkout main
   git pull origin main  # Sync with remote
   git checkout -b feature/v#.#.#-description
   ```

4. **Begin work on new instruction set** on the new branch

## CI/CD Pipeline

### GitHub Actions Workflows

**PR Build (`.github/workflows/pr-build.yml`)**
- **Trigger:** Pull request opened/updated to `main`
- **Purpose:** Test build validation
- **Steps:**
  1. Checkout code
  2. Setup Node.js 20
  3. Install dependencies (`npm ci`)
  4. Run ESLint (`npm run lint`)
  5. Run test build (`npm run build`)
  6. Verify build artifacts
  7. Report status

**Production Build (`.github/workflows/production-build.yml`)**
- **Trigger:** Push to `main` (PR merge)
- **Purpose:** Production build and artifact storage
- **Steps:**
  1. Checkout code with full history
  2. Setup Node.js 20
  3. Install dependencies
  4. Run ESLint
  5. Run production build
  6. Extract version from tags
  7. Upload build artifacts (30-day retention)
  8. Generate build summary

### CI Requirements
- ✅ All PRs must pass test build before merge
- ✅ ESLint must pass with no errors
- ✅ TypeScript compilation must succeed
- ✅ Build artifacts must be generated successfully

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
   git pull origin main  # Sync with remote first
   git checkout -b feature/vX.X.X-feature-description
   ```

2. **Work on the Feature**
   - Implement changes
   - Test thoroughly locally
   - Ensure build passes (`npm run build`)
   - Check for TypeScript/ESLint errors (`npm run lint`)

3. **Stage and Commit Changes**
   ```bash
   git add .
   git commit -m "feat: vX.X.X - Description of changes
   
   - Detailed change 1
   - Detailed change 2
   - Detailed change 3"
   ```

4. **Push Feature Branch to GitHub**
   ```bash
   git push origin feature/vX.X.X-feature-description
   ```

5. **Create Pull Request on GitHub**
   - Go to GitHub repository
   - Click "Pull requests" → "New pull request"
   - Select your feature branch
   - Fill in PR description with changes summary
   - **Wait for CI to pass** ✅ (automatic test build)
   - Request review if needed

6. **After CI Passes - Merge PR**
   - Merge PR on GitHub (or via command line)
   - **Production build runs automatically** on merge to main

7. **Tag Release Locally** (after merge)
   ```bash
   git checkout main
   git pull origin main  # Get merged changes
   git tag -a vX.X.X -m "vX.X.X - Feature description"
   git push origin --tags
   ```

8. **Clean Up Feature Branch**
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

### Instruction Set Recognition

When a markdown file with pattern `v#.#.#-description.md` is received:
1. **Immediately commit and push** any work on current branch
2. **Checkout main** and sync with remote
3. **Create new feature branch** matching the version number
4. **Begin implementation** of the new instruction set

### Standard Process

For each instruction set, we will:
1. Create a dedicated feature branch **before** any work begins
2. Commit only changes relevant to that specific instruction set
3. **Push feature branch to GitHub** before creating PR
4. **Create Pull Request** which triggers automatic CI test build
5. **Wait for CI to pass** before merging
6. **Merge PR** which triggers automatic production build
7. Tag the release version after merge
8. Push tags and clean up feature branch

### CI/CD Benefits

This ensures:
- ✅ **Automated testing** - Every PR gets a test build
- ✅ **Build validation** - No broken code reaches main
- ✅ **Production artifacts** - Automatic builds on merge with 30-day retention
- ✅ **Clear version history** - Easy rollback with tagged releases
- ✅ **Remote backup** - All feature branches pushed before merging
- ✅ **Code review** - PR workflow enables team review process

---

**Last Updated:** 2026-03-02
**Current Version:** v0.0.2
**Current Branch:** main
**Remote Status:** Not configured (local-only repository)
**CI/CD Status:** ✅ GitHub Actions configured and ready
