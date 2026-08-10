// Rulează o singură dată (npm run generate-icons) — convertește SVG-urile
// sursă din public/icons/ în PNG-urile referențiate de public/manifest.json.
// Nu face parte din pipeline-ul de build normal.
const path = require("node:path");
const sharp = require("sharp");

const ICONS_DIR = path.join(__dirname, "..", "public", "icons");

const ICONS = [
  { svg: "icon-192.svg", png: "icon-192.png", size: 192 },
  { svg: "icon-512.svg", png: "icon-512.png", size: 512 },
];

async function main() {
  for (const { svg, png, size } of ICONS) {
    const src = path.join(ICONS_DIR, svg);
    const dest = path.join(ICONS_DIR, png);
    await sharp(src).resize(size, size).png().toFile(dest);
    console.log(`✓ ${png} (${size}×${size})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
