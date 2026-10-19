#!/usr/bin/env bash
# Bucket R2 sitemap. Nama sama dengan wrangler.jsonc (binding SITEMAP).
# Token butuh izin Workers R2 Storage: Edit.
set -euo pipefail

BUCKET=sambasku-web-sitemap

if pnpm exec wrangler r2 bucket info "$BUCKET"; then
  echo "Bucket $BUCKET sudah ada"
  exit 0
fi

if pnpm exec wrangler r2 bucket create "$BUCKET"; then
  echo "Bucket $BUCKET dibuat"
  exit 0
fi

pnpm exec wrangler r2 bucket info "$BUCKET"
