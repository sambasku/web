#!/usr/bin/env bash
# Assertion PERILAKU cache edge pasca-deploy (pentest BH-05).
#
# Workflow lama hanya memeriksa header (CSP, x-cache, no-cache). Header bisa
# benar sementara cache-nya mati total - persis yang terjadi pada G-01/G-02:
# `Set-Cookie` membuat `cache.put()` jadi no-op diam-diam, semua respons tetap
# `x-cache: miss`, tapi tidak ada assertion yang gagal. Skrip ini
# menguji hasilnya: apakah request kedua benar-benar `hit`.
#
# Semua probe hanya GET/HEAD ke halaman publik yang sudah ada - tidak ada
# request yang mengubah state.
#
# Pakai: scripts/assert-live-behavior.sh <base-url> [prod|staging]
set -euo pipefail

BASE="${1:?Pakai: assert-live-behavior.sh <base-url> [prod|staging]}"
BASE="${BASE%/}"
PROFILE="${2:-prod}"

# Halaman kata yang dijamin ada (dipakai juga di 04-BUG-HUNTER.md).
LEMMA="${LEMMA:-capal}"

failures=0

fail() {
  echo "::error::$1"
  failures=$((failures + 1))
}

# x-cache dari GET tanpa body: header ke stdout, body di-/dev/null.
# --path-as-is: jangan biarkan curl menggabungkan /./ atau /../ sebelum
# request - assertion BH-04 harus menguji normalisasi di worker.
get_headers() {
  curl -fsS -D - -o /dev/null --path-as-is --max-time 30 "$BASE$1" 2>/dev/null || true
}

# curl -w sudah mencetak 000 saat koneksi gagal. Jangan tambah `|| echo 000`:
# hasilnya jadi 000000, tidak sama dengan 000, dan guard "belum live" tidak
# pernah menyala.
get_status() {
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' --path-as-is --max-time 30 "$BASE$1" 2>/dev/null)" || true
  if [ -z "$code" ] || [ "$code" = "000" ]; then
    echo "000"
  else
    echo "$code"
  fi
}

xcache_of() {
  get_headers "$1" | tr -d '\r' | awk 'tolower($1) == "x-cache:" { print $2 }' | tail -1
}

# Satu GET: cetak "status x-cache" (status 000 jika gagal koneksi).
status_and_xcache() {
  local path="$1"
  local tmp hdrs code xc
  tmp="$(mktemp)"
  hdrs="$(curl -sS -D - -o "$tmp" --path-as-is --max-time 30 "$BASE$path" 2>/dev/null | tr -d '\r')" || true
  rm -f "$tmp"
  code="$(printf '%s\n' "$hdrs" | awk 'NR==1{print $2}')"
  xc="$(printf '%s\n' "$hdrs" | awk 'tolower($1)=="x-cache:"{print $2}' | tail -1)"
  if [ -z "$code" ] || [ "$code" = "000" ]; then
    echo "000 "
  else
    echo "$code ${xc:-}"
  fi
}

assert_xcache() {
  local path="$1" expect="$2" reason="$3"
  local got
  got="$(xcache_of "$path")"
  if [ "$got" = "$expect" ]; then
    echo "ok   $path -> x-cache: $got"
  else
    fail "$path: x-cache '$got', diharapkan '$expect' ($reason)"
  fi
}

# BH-04: varian path harus berbagi entry yang sudah di-warm. Cache API
# Cloudflare bersifat per-colo: curl baru tiap assertion bisa pindah anycast
# ke colo yang belum punya entry → `miss` palsu. Setelah worker
# `withCanonicalPath`, miss di colo baru merender 200 (bukan 404 beracun);
# request berikutnya di colo itu wajib hit. Terima hit langsung ATAU
# miss→hit dalam satu colo, dan status harus 200.
assert_shared_cache() {
  local path="$1" reason="$2"
  local got status
  read -r status got <<<"$(status_and_xcache "$path")"
  if { [ "$got" = "hit" ] || [ "$got" = "swr" ]; } && [ "$status" = "200" ]; then
    echo "ok   $path -> x-cache: $got"
    return
  fi
  # Miss di colo dingin: entry kanonik baru saja ditulis; coba lagi.
  if [ "$got" = "miss" ] && [ "$status" = "200" ]; then
    read -r status got <<<"$(status_and_xcache "$path")"
    if { [ "$got" = "hit" ] || [ "$got" = "swr" ]; } && [ "$status" = "200" ]; then
      echo "ok   $path -> x-cache: $got (colo dihangatkan)"
      return
    fi
  fi
  fail "$path: x-cache '$got' status '$status', diharapkan hit/swr + 200 ($reason)"
}

echo "== Verifikasi perilaku cache edge: $BASE (profil: $PROFILE) =="

# Jangan assert perilaku sebelum worker yang memperbaiki cache benar-benar
# yang menjawab. Build lama tidak mengirim x-cache; mengeceknya menghasilkan
# enam kegagalan palsu ("cache mati") padahal perbaikannya belum naik.
# Worker baru selalu menset header itu (bypass/miss/hit), termasuk pada
# redirect. Tunggu sinyal itu, baru lanjut.
wait_until_fix_live() {
  local attempt=0
  local max_attempts=12
  while [ "$attempt" -lt "$max_attempts" ]; do
    local status got
    status="$(get_status "/")"
    if [ "$status" = "000" ]; then
      if [ "$PROFILE" = "staging" ]; then
        echo "::warning::$BASE tidak dapat dijangkau (DNS staging tidak dipelihara). Perbaikan belum terlihat di URL ini. Skip verifikasi staging."
        exit 0
      fi
      echo "::error::$BASE tidak dapat dijangkau (DNS/worker down). Periksa record DNS custom domain dan status deploy worker."
      exit 1
    fi
    got="$(xcache_of "/")"
    if [ -n "$got" ]; then
      echo "ok   worker baru menjawab / -> x-cache: $got"
      return 0
    fi
    attempt=$((attempt + 1))
    echo "tunggu worker baru ($attempt/$max_attempts): / menjawab tanpa x-cache"
    sleep 5
  done
  echo "::error::$BASE masih menjawab tanpa x-cache. Perbaikan cache belum naik; assertion perilaku tidak dijalankan."
  exit 1
}

wait_until_fix_live

# Staging memang 404 di /sitemap.xml (route menolak saat !isProd) dan korpus
# kata bisa berbeda dari produksi, jadi dua assertion itu khusus prod.
check_sitemap() { [ "$PROFILE" = "prod" ]; }
check_word_page() { [ "$PROFILE" = "prod" ]; }

# --- BH-08: path redirect tidak boleh melakukan lookup cache ------------------
# `/` tanpa prefix locale adalah 301 ke `/{locale}`. Dulu ditandai cacheable,
# jadi tiap request melakukan lookup dijamin kosong lalu render SSR penuh.
assert_xcache "/" "bypass" "path redirect tidak boleh di-cache (BH-08)"
assert_xcache "/words/$LEMMA" "bypass" "redirect legacy tidak boleh di-cache (BH-08)"

# --- G-01/G-02: cache harus benar-benar bekerja ------------------------------
# Request pertama mengisi entry; request kedua (build ID sama) WAJIB hit.
if check_word_page; then
  assert_xcache "/id/words/$LEMMA" "miss" "request pertama mengisi entry"
  assert_xcache "/id/words/$LEMMA" "hit" "cache HTML tidak berfungsi (G-01/G-02)"

  # --- BH-04: varian path harus berbagi satu entry ---------------------------
  # Semua varian di bawah kontennya identik. Kalau `canonicalCachePath` /
  # `withCanonicalPath` tidak bekerja, masing-masing jadi entry terpisah
  # atau merender 404 yang meracuni kunci kanonik.
  assert_shared_cache "/id/words/$LEMMA/" "trailing slash harus berbagi entry cache"
  assert_shared_cache "/id//words//$LEMMA" "slash ganda harus berbagi entry cache"
  assert_shared_cache "/id/./words/$LEMMA" "segmen '.' harus berbagi entry cache"
fi

# Beranda per-locale juga harus ikut cache. Pakai locale non-default supaya
# entry-nya belum ada di cache lama, jadi "miss" lalu "hit" deterministik.
assert_xcache "/id-SBS" "miss" "request pertama mengisi beranda id-SBS"
assert_xcache "/id-SBS" "hit" "cache beranda per-locale tidak berfungsi"

# --- halaman huruf: cacheable, varian liar bypass -----------------------------
if check_word_page; then
  assert_xcache "/id/huruf/k" "miss" "request pertama mengisi halaman huruf"
  assert_xcache "/id/huruf/k" "hit" "cache halaman huruf tidak berfungsi"
  # Uppercase 301 ke lowercase: redirect tidak boleh melakukan lookup cache.
  assert_xcache "/id/huruf/K" "bypass" "redirect kanonik huruf tidak boleh di-cache"
  # Query cursor (halaman 2+) tidak boleh memakai entry halaman 1.
  assert_xcache "/id/huruf/k?cursor=x" "bypass" "URL ber-query tidak boleh di-cache"
fi

# --- G-02: negative cache 404 kata ------------------------------------------
MISSING="pentest-negative-cache-canary-$$"
assert_xcache "/id/words/$MISSING" "miss" "404 pertama tidak di-cache"
assert_xcache "/id/words/$MISSING" "hit" "negative cache 404 kata tidak berfungsi (G-02)"

# --- sitemap: index 200 + cache; lokasi lama 301 bypass -----------------------
if check_sitemap; then
  # Isi kanonik: satu urlset. Request pertama mengisi; kedua wajib hit.
  # Jangan GET status dulu - itu menghangatkan cache dan merusak assert miss.
  assert_xcache "/sitemap.xml" "miss" "request pertama mengisi sitemap index"
  assert_xcache "/sitemap.xml" "hit" "cache sitemap index tidak berfungsi"
  SITEMAP_STATUS="$(get_status "/sitemap.xml")"
  if [ "$SITEMAP_STATUS" != "200" ]; then
    fail "/sitemap.xml: status $SITEMAP_STATUS, diharapkan 200"
  else
    echo "ok   /sitemap.xml -> 200"
  fi

  # Lokasi lama: redirect ke index, tidak di-cache (BH-08).
  for CHILD in "/sitemap-static.xml" "/sitemap-words/a"; do
    CHILD_STATUS="$(get_status "$CHILD")"
    if [ "$CHILD_STATUS" != "301" ]; then
      fail "$CHILD: status $CHILD_STATUS, diharapkan 301 (redirect ke /sitemap.xml)"
    else
      echo "ok   $CHILD -> 301"
    fi
    CHILD_LOC="$(get_headers "$CHILD" | tr -d '\r' | awk 'tolower($1) == "location:" { print $2 }' | tail -1)"
    case "$CHILD_LOC" in
      */sitemap.xml)
        echo "ok   $CHILD -> Location …/sitemap.xml"
        ;;
      *)
        fail "$CHILD: Location '$CHILD_LOC', diharapkan …/sitemap.xml"
        ;;
    esac
    assert_xcache "$CHILD" "bypass" "redirect lokasi lama sitemap tidak boleh lookup cache (BH-08)"
  done
  # Varian liar bukan sitemap dan tidak boleh menyentuh cache.
  assert_xcache "/sitemap-words/aa" "bypass" "path sitemap invalid tidak di-cache"

  # RSS feed publik: 200, content-type benar, dan ter-cache di edge.
  # Urutan: miss→hit dulu (jangan warm), baru cek status/content-type.
  assert_xcache "/rss.xml" "miss" "request pertama mengisi feed"
  assert_xcache "/rss.xml" "hit" "cache feed tidak berfungsi"
  RSS_STATUS="$(get_status "/rss.xml")"
  if [ "$RSS_STATUS" != "200" ]; then
    fail "/rss.xml: status $RSS_STATUS, diharapkan 200"
  else
    echo "ok   /rss.xml -> 200"
  fi
  # Content-Type boleh membawa charset; bandingkan media type saja
  # (hindari awk $2 = "application/rss+xml;" karena semicolon menempel).
  RSS_CT="$(get_headers "/rss.xml" | tr -d '\r' | awk 'BEGIN{IGNORECASE=1} /^content-type:/ {
    sub(/^content-type:[[:space:]]*/, "", $0)
    sub(/;.*/, "", $0)
    gsub(/[[:space:]]/, "", $0)
    print $0
  }' | tail -1)"
  if [ "$RSS_CT" = "application/rss+xml" ]; then
    echo "ok   /rss.xml -> content-type rss"
  else
    fail "/rss.xml: content-type '$RSS_CT', diharapkan application/rss+xml"
  fi

  # Kartu OG per kata: miss→hit dulu, baru cek content-type (jangan warm).
  assert_xcache "/og/words/$LEMMA" "miss" "render pertama kartu OG"
  assert_xcache "/og/words/$LEMMA" "hit" "cache kartu OG tidak berfungsi"
  OG_CT="$(get_headers "/og/words/$LEMMA" | tr -d '\r' | awk 'BEGIN{IGNORECASE=1} /^content-type:/ {
    sub(/^content-type:[[:space:]]*/, "", $0)
    sub(/;.*/, "", $0)
    gsub(/[[:space:]]/, "", $0)
    print $0
  }' | tail -1)"
  if [ "$OG_CT" = "image/png" ]; then
    echo "ok   /og/words/$LEMMA -> content-type png"
  else
    fail "/og/words/$LEMMA: content-type '$OG_CT', diharapkan image/png"
  fi
else
  echo "skip /sitemap.xml (hanya aktif di profil prod)"
fi

echo
if [ "$failures" -gt 0 ]; then
  echo "== $failures assertion gagal =="
  exit 1
fi
echo "== Semua assertion perilaku cache lulus =="
