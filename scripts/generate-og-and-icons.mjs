import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const PUBLIC = "public";
const BRAND = "#003399";

/**
 * Generează assets statice de branding:
 *  - public/og-default.jpg (1200x630) pentru partajare pe social
 *  - public/favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png
 *
 * Rulare: node scripts/generate-og-and-icons.mjs
 * Se rulează manual, o singură dată — rezultatele sunt commise în repo.
 */

// ---------------------------------------------------------------------------
// og:image — fundal brand, text alb centrat.
// Textul e desenat ca SVG și compus peste fundal. Folosim o stivă de fonturi
// generice: randarea se face pe mașina care rulează scriptul, nu în browser.
// ---------------------------------------------------------------------------
const W = 1200;
const H = 630;

const ogSvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .name { font-family: Arial, Helvetica, sans-serif; font-weight: 800; font-size: 96px; fill: #ffffff; letter-spacing: -2px; }
    .tag  { font-family: Arial, Helvetica, sans-serif; font-weight: 400; font-size: 38px; fill: #c7d6f5; }
    .plate{ font-family: Arial, Helvetica, sans-serif; font-weight: 700; font-size: 30px; fill: #ffffff; letter-spacing: 3px; }
  </style>

  <!-- banda albastră de plăcuță RO, în stânga -->
  <rect x="0" y="0" width="18" height="${H}" fill="#0a47c2"/>

  <text x="${W / 2}" y="285" text-anchor="middle" class="name">Zero Amenzi</text>
  <text x="${W / 2}" y="355" text-anchor="middle" class="tag">Actele auto, verificate automat.</text>
  <text x="${W / 2}" y="412" text-anchor="middle" class="tag">Alertate înainte să coste.</text>

  <!-- mică plăcuță decorativă jos -->
  <rect x="${W / 2 - 110}" y="470" width="220" height="62" rx="8" fill="#ffffff" opacity="0.12"/>
  <rect x="${W / 2 - 110}" y="470" width="30" height="62" rx="8" fill="#ffffff" opacity="0.25"/>
  <text x="${W / 2 + 18}" y="511" text-anchor="middle" class="plate">B 100 ABC</text>
</svg>`;

async function buildOgImage() {
  await sharp({
    create: {
      width: W,
      height: H,
      channels: 3,
      background: BRAND,
    },
  })
    .composite([{ input: Buffer.from(ogSvg), top: 0, left: 0 }])
    .jpeg({ quality: 88, progressive: true })
    .toFile(join(PUBLIC, "og-default.jpg"));

  console.log("  ✓ public/og-default.jpg");
}

// ---------------------------------------------------------------------------
// Favicon-uri — derivate din iconița PWA existentă, ca să nu divergă.
// ---------------------------------------------------------------------------
const SOURCE_ICON = join(PUBLIC, "icons", "icon-512.png");

const ICON_SIZES = [
  { size: 16, name: "favicon-16x16.png" },
  { size: 32, name: "favicon-32x32.png" },
  { size: 180, name: "apple-touch-icon.png" },
];

async function buildIcons() {
  for (const { size, name } of ICON_SIZES) {
    await sharp(SOURCE_ICON)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 51, b: 153, alpha: 1 } })
      .png({ compressionLevel: 9 })
      .toFile(join(PUBLIC, name));
    console.log(`  ✓ public/${name} (${size}x${size})`);
  }
}

await mkdir(PUBLIC, { recursive: true });
console.log("Generez assets de branding:");
await buildOgImage();
await buildIcons();
console.log("Gata.");
