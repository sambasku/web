#!/usr/bin/env bash
# Unggah sitemap.xml ke R2 tanpa wrangler-action.
# Action itu melihat pnpm-lock.yaml dan memasang wrangler lewat npm,
# yang bentrok dengan dependency proyek.
set -euo pipefail

FILE="${1:?butuh path sitemap.xml}"
BUCKET=sambasku-web-sitemap

wrangler() {
  npx --yes wrangler@4.146.0 "$@"
}

wrangler whoami || true

if wrangler r2 bucket info "$BUCKET"; then
  echo "Bucket $BUCKET sudah ada"
else
  wrangler r2 bucket create "$BUCKET"
  echo "Bucket $BUCKET dibuat"
fi

wrangler r2 object put "${BUCKET}/sitemap.xml" --file "$FILE" --remote
echo "sitemap.xml terunggah"
