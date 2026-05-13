#!/bin/bash
# Bump version across all packages in the monorepo
# Usage: ./scripts/bump-version.sh <new-version>
# Example: ./scripts/bump-version.sh 0.2.0

set -euo pipefail

if [ -z "$1" ]; then
  echo "Usage: $0 <new-version>"
  echo "Example: $0 0.2.0"
  exit 1
fi

NEW_VERSION="$1"

# Validate version format
if [[ ! "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Invalid version format. Use semver (e.g. 1.0.0)"
  exit 1
fi

echo "Bumping all packages to v${NEW_VERSION}..."

# Update root package.json
if [ -f "package.json" ]; then
  sed -i "s/\"version\": \"[^"]*\"/\"version\": \"${NEW_VERSION}\"/" package.json
  echo "  Updated package.json"
fi

# Update all packages/*
for pkg in packages/*/package.json shared/*/package.json; do
  if [ -f "$pkg" ]; then
    sed -i "s/\"version\": \"[^"]*\"/\"version\": \"${NEW_VERSION}\"/" "$pkg"
    echo "  Updated $pkg"
  fi
done

# Update CHANGELOG.md header
if [ -f "CHANGELOG.md" ]; then
  DATE=$(date +%Y-%m-%d)
  sed -i "s/## \[Unreleased\]/## [Unreleased]\n\n## [${NEW_VERSION}] - ${DATE}/" CHANGELOG.md
  echo "  Updated CHANGELOG.md"
fi

# Git operations
git add -A
git commit -m "release: v${NEW_VERSION}"
git tag "v${NEW_VERSION}"

echo ""
echo "✅ Version bumped to ${NEW_VERSION}"
echo "   Run: git push && git push --tags"
echo "   Then the CI will publish to npm automatically"
