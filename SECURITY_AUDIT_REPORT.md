# Security Audit Report: Gitleaks Configuration Issue

**Date:** 2026-02-14  
**Issue:** Gitleaks failed to block commit of `.env.coolify` containing secrets  
**Severity:** 🔴 **CRITICAL**

## Executive Summary

Gitleaks did NOT fail - it was never given the opportunity to scan the `.env.coolify` file because:
1. The file was committed **before** the pre-commit hook was installed
2. The file was not in `.gitignore`
3. The gitleaks pre-commit hook only scans **staged changes**, not existing repository history

## Secrets Exposed

The `.env.coolify` file contains the following sensitive information:
- **Database Password:** `Ach@1169` (in connection string)
- **Secret Key:** `465ggyr3`
- **Algorithm:** HS256
- **Database User:** `db_user`
- **Database Name:** `adamus_kpi`

## Root Cause Analysis

### 1. File Committed Before Gitleaks Setup
```bash
$ git log --oneline -- .env.coolify
f83572b feat: Add initial frontend application logic, including user authentication and deployment configuration.
```

The file was committed in `f83572b`, which appears to be before the gitleaks pre-commit hook was configured.

### 2. Missing from .gitignore
The `.gitignore` file only included `.env` but not `.env.*` or `.env.coolify` specifically.

**Original .gitignore:**
```
.env
__pycache__/
*.pyc
*.db
.venv/
```

### 3. Gitleaks Pre-Commit Hook Behavior
The gitleaks pre-commit hook uses this command:
```bash
gitleaks git --pre-commit --redact --staged --verbose
```

The `--pre-commit --staged` flags mean it ONLY scans:
- Files that are currently staged for commit
- Changes in the current commit being created

It does NOT scan:
- Files already committed to the repository
- The entire git history
- Unstaged files

## Test Results

### Test 1: Scanning Committed File
```bash
$ python -m pre_commit run gitleaks --files .env.coolify
Detect hardcoded secrets.................................................Passed
INF 0 commits scanned.
INF no leaks found
```
**Result:** ❌ No secrets detected (file already committed)

### Test 2: Scanning All Files
```bash
$ python -m pre_commit run gitleaks --all-files --verbose
Detect hardcoded secrets.................................................Passed
INF 0 commits scanned.
INF no leaks found
```
**Result:** ❌ No secrets detected (scans commits, not file content)

### Test 3: Staging the File
```bash
$ echo "# test" >> .env.coolify
$ git add .env.coolify
$ python -m pre_commit run gitleaks --files .env.coolify
Detect hardcoded secrets.................................................Passed
INF 1 commits scanned.
INF no leaks found
```
**Result:** ❌ No secrets detected (WHY? See issue #4 below)

## Additional Issues Discovered

### Issue #4: Gitleaks Not Detecting Secrets Even in Staged Files
This is the MOST CONCERNING finding. Even when the file is staged, gitleaks is not detecting the obvious secrets. This suggests:

**Possible Causes:**
1. The `gitleaks.toml` configuration might be too restrictive or empty
2. The gitleaks version might have a bug
3. The file might be excluded by a path pattern
4. The default gitleaks rules might not be loading properly

**Current gitleaks.toml:**
- Has empty `allowlist.regexes`
- Has empty `stopwords`
- Has NO custom rules defined
- Extends NO base configuration

## Immediate Actions Taken

### ✅ 1. Updated .gitignore
Added `.env.*` pattern to prevent future commits of environment files:
```diff
 .env
+.env.*
 __pycache__/
 *.pyc
 *.db
 .venv/
```

## Required Actions

### 🔴 CRITICAL - Remove Secrets from Git History

The `.env.coolify` file with secrets is in your git history and potentially pushed to remote. You need to:

#### Option A: Remove File from History (Recommended if not widely shared)
```bash
# Remove the file from git tracking but keep it locally
git rm --cached .env.coolify

# Commit the removal
git commit -m "Remove .env.coolify from version control"

# If already pushed, you'll need to force push (DANGEROUS - coordinate with team)
# git push --force
```

#### Option B: Use BFG Repo-Cleaner or git-filter-repo (If widely shared)
For repositories that have been shared or cloned by others, use specialized tools:
```bash
# Using git-filter-repo (recommended)
git filter-repo --path .env.coolify --invert-paths

# Or using BFG Repo-Cleaner
bfg --delete-files .env.coolify
```

### 🔴 CRITICAL - Rotate All Exposed Credentials

**ALL** credentials in `.env.coolify` must be considered compromised:

1. **Database Password:** Change `Ach@1169` immediately
2. **Secret Key:** Generate new `SECRET_KEY` (use: `python -c "import secrets; print(secrets.token_hex(32))"`)
3. **Update all systems** using these credentials

### 🟡 HIGH - Fix Gitleaks Configuration

The `gitleaks.toml` file needs to be properly configured. The current file has no rules defined.

**Recommended Fix:**
```toml
# Remove or rename the current gitleaks.toml to use default rules
# OR properly configure it with the base config

title = "Gitleaks Configuration"

# Use the default gitleaks configuration as base
[extend]
useDefault = true

[allowlist]
description = "Global allowlist"
paths = [
    '''^\.git/''',
    '''^\.venv/''',
    '''^node_modules/''',
]
```

### 🟡 HIGH - Test Gitleaks Detection

After fixing the configuration, test that gitleaks can actually detect secrets:

```bash
# Create a test file with a fake secret
echo "password=SuperSecret123" > test_secret.txt

# Stage it
git add test_secret.txt

# Try to commit (should fail)
git commit -m "test"

# Clean up
git reset HEAD test_secret.txt
rm test_secret.txt
```

### 🟢 MEDIUM - Add .env.example

Create a template file for environment variables:
```bash
# Copy .env.coolify structure without secrets
cp .env.coolify .env.example

# Edit .env.example to replace all values with placeholders
# Then commit .env.example
```

## Prevention Measures

1. ✅ **Updated .gitignore** to include `.env.*`
2. ⏳ **Remove secrets from git history** (pending)
3. ⏳ **Rotate all compromised credentials** (pending)
4. ⏳ **Fix gitleaks configuration** (pending)
5. ⏳ **Test gitleaks detection** (pending)
6. ⏳ **Add .env.example template** (pending)
7. ⏳ **Team training** on secret management (recommended)

## Recommendations

1. **Use a secrets manager** (e.g., Azure Key Vault, AWS Secrets Manager, HashiCorp Vault)
2. **Never commit environment files** - always use `.env.example` templates
3. **Scan repository history** regularly with `gitleaks detect` command
4. **Enable branch protection** rules requiring status checks
5. **Add GitHub Actions** workflow to scan PRs with gitleaks

## References

- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [Pre-commit Documentation](https://pre-commit.com/)
- [Git Filter-Repo](https://github.com/newren/git-filter-repo)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
