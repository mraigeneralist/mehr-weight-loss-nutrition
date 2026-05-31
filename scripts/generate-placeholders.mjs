// Generates SVG placeholder tiles for category banners and product images.
// Run once during scaffold; safe to re-run.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CAT_DIR = path.join(ROOT, "public", "categories");
const PROD_DIR = path.join(ROOT, "public", "products");

const PALETTE = {
  cream: "#FAF7F2",
  sand: "#E8DFD0",
  sage: "#87A878",
  sageDeep: "#5F7A52",
  terracotta: "#C97B5C",
  butter: "#E8C66F",
  ink: "#2C2C2C",
};

const categories = [
  {
    slug: "snacks",
    name: "Snacks",
    blurb: "Roasted, baked, never fried.",
    bg: PALETTE.terracotta,
    fg: "#FFF7E8",
  },
  {
    slug: "beverages",
    name: "Beverages",
    blurb: "Cold-pressed and herbal.",
    bg: PALETTE.sageDeep,
    fg: "#F2EFE6",
  },
  {
    slug: "superfoods",
    name: "Superfoods",
    blurb: "Nutrient-dense staples.",
    bg: PALETTE.butter,
    fg: PALETTE.ink,
  },
];

const products = [
  // Snacks
  { slug: "roasted-makhana", name: "Roasted Makhana", category: "snacks", motif: "lotus" },
  { slug: "baked-ragi-chips", name: "Baked Ragi Chips", category: "snacks", motif: "wave" },
  { slug: "almond-energy-bars", name: "Almond Energy Bars", category: "snacks", motif: "bar" },
  { slug: "quinoa-puff-mix", name: "Quinoa Puff Mix", category: "snacks", motif: "dots" },
  { slug: "multigrain-khakhra", name: "Multigrain Khakhra", category: "snacks", motif: "circle" },

  // Beverages
  { slug: "cold-pressed-amla-juice", name: "Cold-Pressed Amla Juice", category: "beverages", motif: "drop" },
  { slug: "tulsi-ginger-green-tea", name: "Tulsi-Ginger Green Tea", category: "beverages", motif: "leaf" },
  { slug: "coconut-water-sachets", name: "Coconut Water", category: "beverages", motif: "wave" },
  { slug: "almond-milk-unsweetened", name: "Almond Milk", category: "beverages", motif: "drop" },
  { slug: "beetroot-carrot-shot", name: "Beetroot-Carrot Shot", category: "beverages", motif: "circle" },

  // Superfoods
  { slug: "raw-forest-honey", name: "Raw Forest Honey", category: "superfoods", motif: "hex" },
  { slug: "organic-chia-seeds", name: "Organic Chia Seeds", category: "superfoods", motif: "dots" },
  { slug: "moringa-leaf-powder", name: "Moringa Leaf Powder", category: "superfoods", motif: "leaf" },
  { slug: "a2-cow-ghee", name: "A2 Cow Ghee", category: "superfoods", motif: "circle" },
  { slug: "cold-pressed-flaxseed-oil", name: "Cold-Pressed Flaxseed Oil", category: "superfoods", motif: "drop" },
];

const productPalette = {
  snacks: { bg: "#F4E4D2", accent: PALETTE.terracotta, ink: PALETTE.ink },
  beverages: { bg: "#DCE8D8", accent: PALETTE.sageDeep, ink: PALETTE.ink },
  superfoods: { bg: "#F4EAD0", accent: "#B89234", ink: PALETTE.ink },
};

function escape(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function motif(name, color) {
  switch (name) {
    case "leaf":
      return `<path d="M120 320 Q200 120 320 200 Q280 360 120 320 Z" fill="${color}" opacity="0.85"/><path d="M150 300 Q220 200 300 220" stroke="${color}" stroke-width="3" fill="none" opacity="0.6"/>`;
    case "drop":
      return `<path d="M220 140 Q310 240 280 320 Q220 380 160 320 Q130 240 220 140 Z" fill="${color}" opacity="0.85"/>`;
    case "wave":
      return `<path d="M40 280 Q120 220 200 280 T360 280 T520 280" stroke="${color}" stroke-width="14" fill="none" stroke-linecap="round" opacity="0.85"/><path d="M40 320 Q120 260 200 320 T360 320" stroke="${color}" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.55"/>`;
    case "dots":
      return Array.from({ length: 18 })
        .map(() => {
          const x = 60 + Math.random() * 320;
          const y = 120 + Math.random() * 220;
          const r = 6 + Math.random() * 14;
          return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(0)}" fill="${color}" opacity="0.7"/>`;
        })
        .join("");
    case "circle":
      return `<circle cx="220" cy="240" r="120" fill="${color}" opacity="0.85"/><circle cx="220" cy="240" r="78" fill="none" stroke="#fff" stroke-width="6" opacity="0.55"/>`;
    case "hex":
      return `<polygon points="220,120 320,180 320,300 220,360 120,300 120,180" fill="${color}" opacity="0.85"/>`;
    case "bar":
      return `<rect x="100" y="200" width="240" height="100" rx="20" fill="${color}" opacity="0.85"/><line x1="160" y1="200" x2="160" y2="300" stroke="#fff" stroke-width="3" opacity="0.5"/><line x1="220" y1="200" x2="220" y2="300" stroke="#fff" stroke-width="3" opacity="0.5"/><line x1="280" y1="200" x2="280" y2="300" stroke="#fff" stroke-width="3" opacity="0.5"/>`;
    case "lotus":
      return `<g opacity="0.9"><ellipse cx="220" cy="240" rx="40" ry="100" fill="${color}"/><ellipse cx="220" cy="240" rx="40" ry="100" fill="${color}" transform="rotate(60 220 240)"/><ellipse cx="220" cy="240" rx="40" ry="100" fill="${color}" transform="rotate(120 220 240)"/></g>`;
    default:
      return "";
  }
}

function categorySvg({ name, blurb, bg, fg }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" width="1200" height="600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="0.78"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="600" fill="url(#g)"/>
  <circle cx="980" cy="120" r="240" fill="${fg}" opacity="0.08"/>
  <circle cx="180" cy="500" r="180" fill="${fg}" opacity="0.08"/>
  <text x="80" y="320" font-family="Georgia, serif" font-size="120" font-weight="700" fill="${fg}" letter-spacing="-2">${escape(name)}</text>
  <text x="84" y="380" font-family="ui-sans-serif, system-ui, sans-serif" font-size="28" font-style="italic" fill="${fg}" opacity="0.85">${escape(blurb)}</text>
</svg>`;
}

function productSvg({ name, category, motif: motifName }) {
  const p = productPalette[category];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 480" width="800" height="800" preserveAspectRatio="xMidYMid meet">
  <rect width="440" height="480" fill="${p.bg}"/>
  <rect x="20" y="20" width="400" height="440" fill="none" stroke="${p.accent}" stroke-opacity="0.25" stroke-width="2" stroke-dasharray="6 6" rx="14"/>
  ${motif(motifName, p.accent)}
  <text x="220" y="430" font-family="Georgia, serif" font-size="22" font-weight="700" fill="${p.ink}" text-anchor="middle">${escape(name)}</text>
</svg>`;
}

async function main() {
  await mkdir(CAT_DIR, { recursive: true });
  await mkdir(PROD_DIR, { recursive: true });

  for (const c of categories) {
    const file = path.join(CAT_DIR, `${c.slug}.svg`);
    await writeFile(file, categorySvg(c));
    console.log(`✓ ${path.relative(ROOT, file)}`);
  }

  for (const p of products) {
    const file = path.join(PROD_DIR, `${p.slug}.svg`);
    await writeFile(file, productSvg(p));
    console.log(`✓ ${path.relative(ROOT, file)}`);
  }

  // Default OG image
  await writeFile(
    path.join(ROOT, "public", "og.svg"),
    categorySvg({
      name: "Sattva",
      blurb: "Honest, healthy food.",
      bg: PALETTE.sageDeep,
      fg: "#F2EFE6",
    }),
  );
  console.log(`✓ public/og.svg`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
