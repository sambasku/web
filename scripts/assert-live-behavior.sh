#!/usr/bin/env bash
# Assertion PERILAKU cache edge pasca-deploy (pentest BH-05).
#
# Workflow lama hanya memeriksa header (CSP, x-cache, no-cache). Header bisa
# benar sementara cache-nya mati total - persis yang terjadi pada G-01/G-02:
# `Set-Cookie` membuat `cache.put()` jadi no-op diam-diam, semua respons tetap
# `x-cache: miss`, tapi tidak ada assertion yang gagal. Skrip ini
# menguji hasilnya: apakah request kedua benar-benar `hit`.
#
# Cache API Cloudflare (caches.default) hanya ada di colo yang menulisnya.
# Dua proses curl terpisah membuka dua TCP, dan anycast bisa menaruhnya di
# colo berbeda: request kedua `miss` padahal entry di colo pertama sudah
# tertulis. Pasangan miss-lalu-hit memakai satu koneksi HTTP/1.1 (keep-alive)
# supaya keduanya mendarat di colo yang sama.
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

# Dua GET berurutan pada satu koneksi. Cetak:
# status1 xcache1 colo1 status2 xcache2 colo2
# Field kosong diganti placeholder supaya `read` tidak geser kolom.
same_colo_pair() {
  local path="$1"
  local h1 h2 clean1 clean2
  h1="$(mktemp)"
  h2="$(mktemp)"
  # URL pertama harus sebelum --next. Keep-alive HTTP/1.1 menempel di satu
  # colo. Proses curl baru membuka TCP baru, dan anycast bisa pindah colo.
  curl -sS --path-as-is --http1.1 --max-time 90 -D "$h1" -o /dev/null \
    "$BASE$path" \
    --next --path-as-is -D "$h2" -o /dev/null \
    "$BASE$path" >/dev/null 2>&1 || true
  clean1="$(tr -d '\r' < "$h1")"
  clean2="$(tr -d '\r' < "$h2")"
  rm -f "$h1" "$h2"
  local s1 c1 ray1 colo1 s2 c2 ray2 colo2
  s1="$(printf '%s\n' "$clean1" | awk 'NR==1 { print $2 }')"
  c1="$(printf '%s\n' "$clean1" | awk 'tolower($1)=="x-cache:" { print $2 }' | tail -1)"
  ray1="$(printf '%s\n' "$clean1" | awk 'tolower($1)=="cf-ray:" { print $2 }' | tail -1)"
  s2="$(printf '%s\n' "$clean2" | awk 'NR==1 { print $2 }')"
  c2="$(printf '%s\n' "$clean2" | awk 'tolower($1)=="x-cache:" { print $2 }' | tail -1)"
  ray2="$(printf '%s\n' "$clean2" | awk 'tolower($1)=="cf-ray:" { print $2 }' | tail -1)"
  colo1="${ray1##*-}"
  colo2="${ray2##*-}"
  [ -n "$s1" ] || s1=000
  [ -n "$c1" ] || c1=-
  [ -n "$ray1" ] || colo1=-
  [ -n "$colo1" ] || colo1=-
  [ -n "$s2" ] || s2=000
  [ -n "$c2" ] || c2=-
  [ -n "$ray2" ] || colo2=-
  [ -n "$colo2" ] || colo2=-
  printf '%s %s %s %s %s %s\n' "$s1" "$c1" "$colo1" "$s2" "$c2" "$colo2"
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

# Pasca-deploy, kunci cache baru (build id baru) jadi request pertama di
# colo itu `miss` dan yang kedua, pada koneksi yang sama, wajib `hit`.
assert_cache_fill() {
  local path="$1" reason="$2"
  local s1 c1 colo1 s2 c2 colo2
  read -r s1 c1 colo1 s2 c2 colo2 <<<"$(same_colo_pair "$path")"
  if [ "$c1" = "miss" ] && [ "$c2" = "hit" ]; then
    echo "ok   $path -> x-cache: miss"
    echo "ok   $path -> x-cache: hit"
    return
  fi
  fail "$path: x-cache '$c1' lalu '$c2' (colo $colo1/$colo2, status $s1/$s2), diharapkan miss lalu hit ($reason)"
}

# BH-04: varian path harus berbagi entry yang sudah di-warm. Miss di colo
# dingin merender 200 (bukan 404 beracun); request berikutnya pada koneksi
# yang sama wajib hit. Terima hit langsung ATAU miss-lalu-hit, status 200.
assert_shared_cache() {
  local path="$1" reason="$2"
  local s1 c1 colo1 s2 c2 colo2
  read -r s1 c1 colo1 s2 c2 colo2 <<<"$(same_colo_pair "$path")"
  if { [ "$c1" = "hit" ] || [ "$c1" = "swr" ]; } && [ "$s1" = "200" ]; then
    echo "ok   $path -> x-cache: $c1"
    return
  fi
  if [ "$c1" = "miss" ] && [ "$s1" = "200" ] &&
    { [ "$c2" = "hit" ] || [ "$c2" = "swr" ]; } && [ "$s2" = "200" ]; then
    echo "ok   $path -> x-cache: $c2 (colo dihangatkan)"
    return
  fi
  fail "$path: x-cache '$c1' lalu '$c2' status '$s1'/'$s2' (colo $colo1/$colo2), diharapkan hit/swr + 200 ($reason)"
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
# Request pertama mengisi entry; request kedua pada koneksi yang sama
# (build ID sama, colo sama) WAJIB hit.
if check_word_page; then
  assert_cache_fill "/id/words/$LEMMA" "cache HTML tidak berfungsi (G-01/G-02)"

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
assert_cache_fill "/id-SBS" "cache beranda per-locale tidak berfungsi"

# --- halaman huruf: cacheable, varian liar bypass -----------------------------
if check_word_page; then
  assert_cache_fill "/id/huruf/k" "cache halaman huruf tidak berfungsi"
  # Uppercase 301 ke lowercase: redirect tidak boleh melakukan lookup cache.
  assert_xcache "/id/huruf/K" "bypass" "redirect kanonik huruf tidak boleh di-cache"
  # Query cursor (halaman 2+) tidak boleh memakai entry halaman 1.
  assert_xcache "/id/huruf/k?cursor=x" "bypass" "URL ber-query tidak boleh di-cache"
fi

# --- G-02: negative cache 404 kata ------------------------------------------
MISSING="pentest-negative-cache-canary-$$"
assert_cache_fill "/id/words/$MISSING" "negative cache 404 kata tidak berfungsi (G-02)"

# --- sitemap: index 200 + cache; lokasi lama 301 bypass -----------------------
if check_sitemap; then
  # Isi kanonik: satu urlset. Request pertama mengisi; kedua wajib hit.
  # Jangan GET status dulu - itu menghangatkan cache dan merusak assert miss.
  assert_cache_fill "/sitemap.xml" "cache sitemap index tidak berfungsi"
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
  assert_cache_fill "/rss.xml" "cache feed tidak berfungsi"
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
  assert_cache_fill "/og/words/$LEMMA" "cache kartu OG tidak berfungsi"
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
