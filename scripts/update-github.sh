#!/usr/bin/env bash
# Magnetic Source Ltd: safe helper for committing and pushing project changes.
set -euo pipefail

MESSAGE="${*:-Update Magnetic Source website}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: run this script from inside the Magnetic Source project folder."
  exit 1
fi

if ! git remote get-url github >/dev/null 2>&1; then
  echo "Error: the GitHub remote named 'github' is missing."
  exit 1
fi

mapfile -t SENSITIVE_FILES < <(git ls-files --others --exclude-standard | grep -E '(^|/)\.env($|\.)|\.(pem|key|p12|pfx)$|credentials|secret' || true)
if ((${#SENSITIVE_FILES[@]})); then
  echo "Stopped: these untracked files may contain private information:"
  printf '  - %s\n' "${SENSITIVE_FILES[@]}"
  echo "Keep them out of Git, then run this script again."
  exit 1
fi

if [[ -z "$(git status --porcelain)" ]]; then
  echo "Nothing to update. GitHub already has the latest code."
  exit 0
fi

BRANCH="$(git branch --show-current)"
git add -A

if git diff --cached --quiet; then
  echo "Nothing safe to commit."
  exit 0
fi

echo "Updating GitHub with: ${MESSAGE}"
git commit -m "${MESSAGE}"
git push github "${BRANCH}"
echo "Done. Your private GitHub repository is updated."
