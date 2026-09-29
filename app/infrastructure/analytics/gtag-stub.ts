/**
 * Stub `gtag` resmi. gtag.js hanya memproses objek `arguments` di dataLayer;
 * array dari rest param (`...args`) diabaikan diam-diam sehingga tidak ada hit.
 */
export function createGtag(dataLayer: unknown[]): (...args: unknown[]) => void {
  return function gtag() {
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments);
  };
}
