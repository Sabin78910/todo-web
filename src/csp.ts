// Content-Security-Policy for the built app (GitHub Pages can't send headers, so it ships as a <meta>).
// Only what the app needs: its own scripts/styles, Google Fonts, data:/blob: images (backup export).
export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** Inserts the CSP meta tag right after <meta charset>, so it applies before anything else loads. */
export const withCsp = (html: string): string =>
  html.replace(/(<meta charset="[^"]*"\s*\/?>)/i, `$1\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
