/**
 * Callback OAuth GitHub (mobile).
 *
 * GitHub hanya menerima redirect HTTPS. App menangkap code lewat custom
 * scheme per env:
 *   staging    sambasku-staging://app/oauth/github?...
 *   production sambasku://app/oauth/github?...
 *
 * Resource route: HTML minimal langsung, tanpa React hydrate.
 */
export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const q = url.search; // ?code=...&state=...
  const host = url.hostname.toLowerCase();
  const isStaging =
    host.includes('staging') || host.endsWith('.workers.dev');
  const scheme = isStaging ? 'sambasku-staging' : 'sambasku';
  const deepLink = `${scheme}://app/oauth/github${q}`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="noindex"/>
<title>Kembali ke SambasKu</title>
<script>
(function () {
  location.replace(${JSON.stringify(deepLink)});
})();
</script>
</head>
<body>
<p>Mengembalikan ke SambasKu…</p>
<p><a href="${deepLink}">Buka SambasKu</a></p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
