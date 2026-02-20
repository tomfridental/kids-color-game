#!/usr/bin/env bash
set -euo pipefail

echo "=== Running checks ==="

echo "→ Lint..."
npx eslint .

echo "→ TypeScript..."
npx tsc --noEmit

echo "→ Build..."
npx vite build

echo ""
echo "All checks passed!"
echo ""

current=$(node -p "require('./package.json').version")
echo "Current version: $current"
echo ""
echo "Select release type:"
echo "  1) patch  (x.x.X)"
echo "  2) minor  (x.X.0)"
echo "  3) major  (X.0.0)"
echo ""
read -rp "Choice [1/2/3]: " choice

case $choice in
  1) bump="patch" ;;
  2) bump="minor" ;;
  3) bump="major" ;;
  *) echo "Invalid choice"; exit 1 ;;
esac

new_version=$(npm version "$bump" --no-git-tag-version)
echo ""
echo "Bumped to $new_version"

git add -A
git commit -m "release: $new_version"
git tag "$new_version"
git push && git push --tags

echo ""
echo "Released $new_version"
