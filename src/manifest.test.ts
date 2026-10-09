import manifestRaw from "../public/manifest.webmanifest?raw";
import indexHtml from "../index.html?raw";

const manifest = JSON.parse(manifestRaw);
const publicFiles = Object.keys(import.meta.glob("../public/*.png", { query: "?url" }));

describe("web app manifest", () => {
  it("uses the brand theme and a light background colour", () => {
    expect(manifest.theme_color).toBe("#6D5DFC");
    expect(manifest.background_color).toBe("#F7F7FB");
    expect(indexHtml).toContain('content="#6D5DFC"');
  });

  it("ships maskable 192 and 512 icons", () => {
    for (const size of [192, 512]) {
      const icon = manifest.icons.find((i: { sizes: string }) => i.sizes === `${size}x${size}`);
      expect(icon.purpose).toContain("maskable");
      expect(publicFiles).toContain(`../public/${icon.src}`);
    }
  });
});
