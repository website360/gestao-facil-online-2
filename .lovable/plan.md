

## Fix: Build Failure - package-lock.json Out of Sync

The DigitalOcean deploy is failing because `package-lock.json` is out of sync with `package.json`. The error says `picomatch@2.3.1` in the lock file doesn't match `picomatch@4.0.3` expected by dependencies.

### Root Cause
When the `qz-tray` package was added, the lock file was not properly regenerated, causing a mismatch.

### Solution
Delete and regenerate `package-lock.json` so it matches the current `package.json` exactly. This will resolve the `npm ci` failure on DigitalOcean.

### Technical Steps

1. **Delete** `package-lock.json`
2. **Recreate** `package-lock.json` by triggering a fresh dependency resolution (Lovable will auto-generate it on next build)

This is a one-step fix that should immediately resolve the deploy failure.

