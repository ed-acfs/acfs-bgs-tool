/**
 * The table's own address, without query or fragment: `https://flottastellare.it/acfs-bgs-tool/`
 * on the site, `http://localhost:4200/` locally. From the document's base href, so it's right
 * whatever page the user is on.
 */
export function pageBaseUrl(): string {
  const url = new URL(document.baseURI);
  return url.origin + url.pathname;
}
