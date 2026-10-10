/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { withCsp } from "./src/csp";

// base "./" makes the build work under any GitHub Pages sub-path.
// The CSP meta is added to production builds only: the dev server relies on inline scripts for hot reload.
export default defineConfig({
  base: "./",
  plugins: [react(), { name: "csp-meta", apply: "build", transformIndexHtml: withCsp }],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
  },
});
