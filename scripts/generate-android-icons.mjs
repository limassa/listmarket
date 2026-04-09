/**
 * Gera ic_launcher*.png a partir de public/lista-mercado-app-logo.svg
 * (tamanhos adaptativos + legacy por densidade).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public", "lista-mercado-app-logo.svg");
const svg = readFileSync(svgPath);

/** Foreground 108dp em px; legacy 48dp launcher em px */
const DENSITIES = [
  { dir: "mipmap-mdpi", foregroundPx: 108, legacyPx: 48 },
  { dir: "mipmap-hdpi", foregroundPx: 162, legacyPx: 72 },
  { dir: "mipmap-xhdpi", foregroundPx: 216, legacyPx: 96 },
  { dir: "mipmap-xxhdpi", foregroundPx: 324, legacyPx: 144 },
  { dir: "mipmap-xxxhdpi", foregroundPx: 432, legacyPx: 192 },
];

async function main() {
  for (const { dir, foregroundPx, legacyPx } of DENSITIES) {
    const base = join(root, "android", "app", "src", "main", "res", dir);
    await sharp(svg)
      .resize(foregroundPx, foregroundPx)
      .png()
      .toFile(join(base, "ic_launcher_foreground.png"));
    await sharp(svg)
      .resize(legacyPx, legacyPx)
      .png()
      .toFile(join(base, "ic_launcher.png"));
    await sharp(svg)
      .resize(legacyPx, legacyPx)
      .png()
      .toFile(join(base, "ic_launcher_round.png"));
  }
  console.log("Android launcher icons updated from lista-mercado-app-logo.svg");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
