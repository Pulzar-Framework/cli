# Pulzar CLI Publishing Guide

This guide explains how to build and publish the `@pulzar/cli` package to npm using the automated publishing script.

## 🚀 Quick Publishing

### Method 1: Using npm scripts (Recommended)

```bash
# Patch version (0.4.0 → 0.4.1)
npm run publish:patch

# Minor version (0.4.0 → 0.5.0)
npm run publish:minor

# Major version (0.4.0 → 1.0.0)
npm run publish:major

# Interactive mode (choose version type)
npm run publish:interactive
```

### Method 2: Using the script directly

```bash
# Interactive mode
./publish.sh

# Specific version bump
./publish.sh patch
./publish.sh minor
./publish.sh major

# Custom version
./publish.sh 1.2.3
```

## 📋 What the Script Does

The publishing script automates the complete workflow:

1. **🧹 Cleans** - Removes the `dist/` folder
2. **📝 Updates** - Bumps version in `package.json`
3. **🔨 Builds** - Runs `npm run build` to compile TypeScript
4. **✅ Validates** - Checks build output integrity
5. **⚠️ Confirms** - Asks for confirmation before publishing
6. **📦 Publishes** - Uploads to npm registry
7. **🎉 Reports** - Shows success summary

## 🛡️ Safety Features

- **Validation checks** ensure you're in the correct directory
- **Build validation** verifies the output before publishing
- **Confirmation prompt** prevents accidental publishing
- **Auto-rollback** reverts version changes if publishing fails
- **Error handling** stops on any failure

## 📊 Version Bumping

| Type    | Example       | When to Use                |
| ------- | ------------- | -------------------------- |
| `patch` | 0.4.0 → 0.4.1 | Bug fixes, small updates   |
| `minor` | 0.4.0 → 0.5.0 | New features, improvements |
| `major` | 0.4.0 → 1.0.0 | Breaking changes           |

## 🎯 Example Output

```bash
$ npm run publish:patch

ℹ️  Current version: 0.4.0
ℹ️  Cleaning dist folder...
✅ Dist folder cleaned
ℹ️  Updating package.json version...
✅ Version updated to: 0.4.1
ℹ️  Building project...
✅ Build completed successfully
ℹ️  Validating build...
✅ Build validation passed

⚠️  About to publish @pulzar/cli@0.4.1 to npm

📦 Package details:
   Name: @pulzar/cli
   Version: 0.4.1 (was 0.4.0)
   Registry: https://registry.npmjs.org/

Do you want to proceed with publishing? (y/N): y

ℹ️  Publishing to npm...
✅ Successfully published @pulzar/cli@0.4.1 to npm! 🎉

📊 Publishing summary:
   ✅ Version: 0.4.0 → 0.4.1
   ✅ Build: Complete
   ✅ Published: https://www.npmjs.com/package/@pulzar/cli

🚀 Users can now install with:
   npm install -g @pulzar/cli@0.4.1
   npm install -g @pulzar/cli@latest

✅ 🎊 Publishing workflow completed successfully!
```

## ⚠️ Prerequisites

- You must be logged into npm (`npm login`)
- You must have publish permissions for `@pulzar/cli`
- Run from the `packages/cli` directory
- Ensure all changes are committed to git

## 🔧 Manual Steps (if needed)

If you prefer manual control:

```bash
# Clean
rm -rf dist

# Update version manually in package.json
# or use: npm version patch/minor/major

# Build
npm run build

# Publish
npm publish
```

## 🆘 Troubleshooting

**Build fails?**

- Check TypeScript errors: `npm run typecheck`
- Ensure dependencies are installed: `npm install`

**Publishing fails?**

- Verify npm login: `npm whoami`
- Check network connection
- Ensure version doesn't already exist

**Script permission denied?**

- Make executable: `chmod +x publish.sh`

---

🎯 **Pro Tip**: Use `publish:interactive` when unsure about version type - it will guide you through the process!
