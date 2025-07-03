#!/bin/bash

# Pulzar CLI Publishing Script
# Usage: ./publish.sh [version_type]
# version_type: patch, minor, major, or specific version like 1.0.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the CLI package directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    log_error "This script must be run from the packages/cli directory"
    exit 1
fi

# Check if package.json contains @pulzar/cli
if ! grep -q '"name": "@pulzar/cli"' package.json; then
    log_error "This doesn't appear to be the @pulzar/cli package directory"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
log_info "Current version: $CURRENT_VERSION"

# Determine version bump type
VERSION_TYPE=${1:-}

if [ -z "$VERSION_TYPE" ]; then
    echo ""
    echo "Select version bump type:"
    echo "1) patch (x.y.Z)"
    echo "2) minor (x.Y.z)"  
    echo "3) major (X.y.z)"
    echo "4) custom version"
    echo ""
    read -p "Enter choice (1-4): " choice

    case $choice in
        1) VERSION_TYPE="patch";;
        2) VERSION_TYPE="minor";;
        3) VERSION_TYPE="major";;
        4) 
            read -p "Enter custom version (e.g., 1.0.0): " custom_version
            if [[ ! $custom_version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                log_error "Invalid version format. Use x.y.z"
                exit 1
            fi
            VERSION_TYPE=$custom_version
            ;;
        *) 
            log_error "Invalid choice"
            exit 1
            ;;
    esac
fi

# Step 1: Clean dist folder
log_info "Cleaning dist folder..."
if [ -d "dist" ]; then
    rm -rf dist
    log_success "Dist folder cleaned"
else
    log_info "Dist folder doesn't exist"
fi

# Step 2: Update package.json version
log_info "Updating package.json version..."
if [[ $VERSION_TYPE =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    # Custom version
    npm version $VERSION_TYPE --no-git-tag-version > /dev/null 2>&1
    NEW_VERSION=$VERSION_TYPE
else
    # Semantic version bump
    npm version $VERSION_TYPE --no-git-tag-version > /dev/null 2>&1
    NEW_VERSION=$(node -p "require('./package.json').version")
fi

log_success "Version updated to: $NEW_VERSION"

# Step 3: Build project
log_info "Building project..."
npm run build

if [ $? -eq 0 ]; then
    log_success "Build completed successfully"
else
    log_error "Build failed"
    exit 1
fi

# Step 4: Run a quick validation
log_info "Validating build..."
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    log_error "Build validation failed - dist folder is empty"
    exit 1
fi

if [ ! -f "dist/bin/pulzar.js" ]; then
    log_error "Build validation failed - main CLI file not found"
    exit 1
fi

log_success "Build validation passed"

# Step 5: Confirm publishing
echo ""
log_warning "About to publish @pulzar/cli@$NEW_VERSION to npm"
echo ""
echo "📦 Package details:"
echo "   Name: @pulzar/cli"
echo "   Version: $NEW_VERSION (was $CURRENT_VERSION)"
echo "   Registry: https://registry.npmjs.org/"
echo ""

read -p "Do you want to proceed with publishing? (y/N): " confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    log_warning "Publishing cancelled"
    
    # Revert version change
    log_info "Reverting version change..."
    npm version $CURRENT_VERSION --no-git-tag-version
    log_info "Version reverted to $CURRENT_VERSION"
    exit 0
fi

# Step 6: Publish to npm
log_info "Publishing to npm..."
npm publish

if [ $? -eq 0 ]; then
    log_success "Successfully published @pulzar/cli@$NEW_VERSION to npm! 🎉"
    echo ""
    echo "📊 Publishing summary:"
    echo "   ✅ Version: $CURRENT_VERSION → $NEW_VERSION"
    echo "   ✅ Build: Complete"
    echo "   ✅ Published: https://www.npmjs.com/package/@pulzar/cli"
    echo ""
    echo "🚀 Users can now install with:"
    echo "   npm install -g @pulzar/cli@$NEW_VERSION"
    echo "   npm install -g @pulzar/cli@latest"
else
    log_error "Publishing failed"
    
    # Revert version change
    log_info "Reverting version change..."
    npm version $CURRENT_VERSION --no-git-tag-version
    log_info "Version reverted to $CURRENT_VERSION"
    exit 1
fi

echo ""
log_success "🎊 Publishing workflow completed successfully!" 