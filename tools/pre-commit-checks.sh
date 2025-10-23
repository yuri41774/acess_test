#!/bin/sh
# Reject commits containing files larger than 50MB
MAX_SIZE=$((50 * 1024 * 1024))
echo "Checking staged files for large sizes (>$MAX_SIZE bytes)..."
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)
if [ -z "$STAGED_FILES" ]; then
  echo "No staged files"
  exit 0
fi

EXIT_CODE=0
for f in $STAGED_FILES; do
  if [ -f "$f" ]; then
    size=$(wc -c <"$f" | tr -d ' ')
    if [ "$size" -gt "$MAX_SIZE" ]; then
      echo "ERROR: Staged file '$f' is $size bytes which exceeds limit of $MAX_SIZE bytes."
      EXIT_CODE=1
    fi
  fi
done

if [ "$EXIT_CODE" -ne 0 ]; then
  echo "Aborting commit due to large file(s). Remove them from staging or add to .gitignore/Git LFS."
  exit 1
fi

echo "Staged files size check passed."
exit 0
