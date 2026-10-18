/**
 * Callback OAuth GitHub (mobile AppAuth).
 *
 * Ideal: App Link verified → Chrome Custom Tabs menyerahkan URL langsung ke
 * RedirectUriReceiverActivity (halaman ini tidak kebuka).
 *
 * Fallback: HTML minimal + intent:// ke activity AppAuth (bukan MainActivity).
 * Resource route - respons HTML langsung, tanpa React hydrate (hindari race
 * yang membuat AppAuth menganggap user batal).
 */
export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const pathAndQuery = `${url.pathname}${url.search}`;
  const host = url.host;

  // Tanpa package: Android pilih via App Links (staging = workers.dev).
  const intentGeneric =
    `intent://${host}${pathAndQuery}` + `#Intent;scheme=https;end`;

  const intentFor = (pkg: string) =>
    `intent://${host}${pathAndQuery}` +
    `#Intent;scheme=https;package=${pkg};` +
    `component=${pkg}/net.openid.appauth.RedirectUriReceiverActivity;end`;

  const staging = intentFor('com.iamutaki.sambasku.staging');
  const prod = intentFor('com.iamutaki.sambasku');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="noindex"/>
<title>Kembali ke SambasKu</title>
<script>
(function () {
  // Langsung ke AppAuth receiver - jangan buka MainActivity.
  location.replace(${JSON.stringify(intentGeneric)});
  setTimeout(function () {
    if (!document.hidden) location.href = ${JSON.stringify(staging)};
  }, 400);
})();
</script>
</head>
<body>
<p>Mengembalikan ke SambasKu…</p>
<p>
  <a href="${staging}">Buka Staging</a>
  ·
  <a href="${prod}">Buka Produksi</a>
</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
