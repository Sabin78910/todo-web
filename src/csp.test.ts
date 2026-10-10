import indexHtml from "../index.html?raw";
import { CSP, withCsp } from "./csp";

test("policy is strict: no inline or eval scripts, no plugins, own origin by default", () => {
  expect(CSP).toContain("default-src 'self'");
  expect(CSP).toMatch(/script-src 'self'(;|$)/);
  expect(CSP).not.toContain("unsafe-eval");
  expect(CSP).not.toContain("unsafe-inline");
  expect(CSP).toContain("object-src 'none'");
  expect(CSP).not.toMatch(/\s\*(;|\s|$)/);
});

test("allows the Google Fonts stylesheet and font files the page loads", () => {
  const fontCss = /href="(https:\/\/fonts\.googleapis\.com[^"]+)"/.exec(indexHtml)?.[1];
  expect(fontCss).toContain("display=swap");
  expect(CSP).toContain("style-src 'self' https://fonts.googleapis.com");
  expect(CSP).toContain("font-src https://fonts.gstatic.com");
});

test("withCsp injects the meta tag right after the charset", () => {
  const out = withCsp(indexHtml);
  expect(out).toMatch(/<meta charset="UTF-8" \/>\n\s*<meta http-equiv="Content-Security-Policy" content="default-src 'self';/);
  expect(out.match(/Content-Security-Policy/g)).toHaveLength(1);
});
