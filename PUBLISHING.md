# Publishing Guide

## Publishing to npm

### Prerequisites

1. Create an npm account at https://www.npmjs.com/signup
2. Verify your email address
3. Login via command line: `npm login`

### Steps to Publish

1. **Check if package name is available:**
   ```bash
   npm search html-magnifier
   ```
   If the name is taken, update the `name` field in `package.json`

2. **Login to npm:**
   ```bash
   npm login
   ```
   Enter your username, password, and email

3. **Verify package.json:**
   - Make sure version is correct (currently 1.0.0)
   - Ensure all required fields are filled

4. **Publish to npm:**
   ```bash
   npm publish
   ```
   
   For the first publish, it will be public by default. For subsequent publishes, use:
   ```bash
   npm publish --access public
   ```

5. **Verify publication:**
   Visit https://www.npmjs.com/package/html-magnifier

### Updating the Package

1. Update version in `package.json` (use semantic versioning):
   - Patch: `1.0.1` (bug fixes)
   - Minor: `1.1.0` (new features, backward compatible)
   - Major: `2.0.0` (breaking changes)

2. Commit changes:
   ```bash
   git add .
   git commit -m "Bump version to X.X.X"
   git tag vX.X.X
   git push && git push --tags
   ```

3. Publish:
   ```bash
   npm publish
   ```

## Publishing to CDNJS

### Important Note

**CDNJS automatically pulls packages from npm!** Once your package is published to npm, it will automatically appear on CDNJS within a few days.

However, you can also manually submit it:

### Manual Submission to CDNJS

1. **Fork the CDNJS repository:**
   - Go to https://github.com/cdnjs/cdnjs
   - Fork the repository

2. **Add your package:**
   - Clone your fork
   - Add your package to `ajax/libs/html-magnifier/`
   - Follow their structure and naming conventions

3. **Submit a Pull Request:**
   - Create a PR with your package
   - Follow their contribution guidelines

### Alternative: jsDelivr (Recommended)

jsDelivr automatically serves packages from npm! Once published to npm, your package will be available at:

```
https://cdn.jsdelivr.net/npm/html-magnifier@1.0.0/magnifier.js
```

Or use the latest version:
```
https://cdn.jsdelivr.net/npm/html-magnifier/magnifier.js
```

### Alternative: unpkg

unpkg also automatically serves npm packages:

```
https://unpkg.com/html-magnifier@1.0.0/magnifier.js
```

Or latest:
```
https://unpkg.com/html-magnifier/magnifier.js
```

## Quick Start Commands

```bash
# 1. Login to npm (first time only)
npm login

# 2. Publish to npm
npm publish

# 3. Verify on npm
# Visit: https://www.npmjs.com/package/html-magnifier

# 4. Use via CDN (available immediately via jsDelivr/unpkg)
# https://cdn.jsdelivr.net/npm/html-magnifier/magnifier.js
```

## Version Management

Use semantic versioning (semver):
- **MAJOR** version when you make incompatible API changes
- **MINOR** version when you add functionality in a backward compatible manner
- **PATCH** version when you make backward compatible bug fixes

Example:
```bash
# Patch release (bug fix)
npm version patch  # 1.0.0 -> 1.0.1
npm publish

# Minor release (new feature)
npm version minor  # 1.0.1 -> 1.1.0
npm publish

# Major release (breaking change)
npm version major  # 1.1.0 -> 2.0.0
npm publish
```

