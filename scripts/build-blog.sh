#!/usr/bin/env bash
# Render the Quarto blog in _blog/ and publish it at /blog/.
# Uses quarto from PATH if present; otherwise downloads a pinned copy into
# node_modules/.cache (which Vercel keeps between builds).
set -euo pipefail
cd "$(dirname "$0")/.."

QUARTO_VERSION=1.8.25

if command -v quarto >/dev/null 2>&1; then
  QUARTO=quarto
else
  dir="node_modules/.cache/quarto-${QUARTO_VERSION}"
  QUARTO="${dir}/bin/quarto"
  if [ ! -x "$QUARTO" ] && [ "$(uname -s)" != "Linux" ]; then
    echo "Quarto isn't installed. Get it from https://quarto.org/docs/get-started/ and run this again." >&2
    exit 1
  fi
  if [ ! -x "$QUARTO" ]; then
    echo "Downloading Quarto ${QUARTO_VERSION}..."
    mkdir -p "$dir"
    curl -fsSL "https://github.com/quarto-dev/quarto-cli/releases/download/v${QUARTO_VERSION}/quarto-${QUARTO_VERSION}-linux-amd64.tar.gz" \
      | tar -xz -C "$dir" --strip-components=1
  fi
fi

# Drafts are visible everywhere except production.
profile=(--profile preview)
if [ "${VERCEL_ENV:-}" = "production" ]; then profile=(); fi

rm -rf _blog/_site
"$QUARTO" render _blog "${profile[@]}"
rm -rf blog
cp -R _blog/_site blog
# Quarto leaves an empty page behind for each draft it skips; drop those so they 404.
find blog -name index.html -size -200c -print0 | while IFS= read -r -d '' f; do rm -rf "$(dirname "$f")"; done
