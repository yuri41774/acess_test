#!/bin/sh
set -e
echo "Installing husky hooks..."
# install husky (requires devDependency installed)
npx husky install

# create pre-commit hook that checks for large files
npx husky add .husky/pre-commit "sh tools/pre-commit-checks.sh"
chmod +x .husky/pre-commit
echo "Husky hooks installed. Run 'npm run install-hooks' to ensure hooks are created locally."
