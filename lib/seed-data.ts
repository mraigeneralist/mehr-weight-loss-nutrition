/**
 * Static fallback for the catalog. Mirrors `supabase/seed.sql` exactly so
 * the storefront renders something useful before Supabase is configured.
 * Once env vars are set, queries hit the real DB and these go unused.
 *
 * Keep in sync with seed.sql when you edit either.
 *
 * Images are served from `public/`:
 *   /products/N.webp            product shots (from mehrnutrition.in)
 *   /product-info/<area>.jpeg   benefit/ingredient info cards (gallery)
 *
 * Prices are the MRP supplied by the owner (public/product-mrp.jpeg), stored
 * as paise.
 */
import type { Category, ProductWithCategory } from "@/lib/types";

const CAT_WEIGHT = "00000000-0000-0000-0000-000000000001";
const CAT_DAILY = "00000000-0000-0000-0000-000000000002";
const CAT_TARGET = "00000000-0000-0000-0000-000000000003";
const CAT_SPORTS = "00000000-0000-0000-0000-000000000004";
const CAT_SKIN = "00000000-0000-0000-0000-000000000005";

export const SEED_CATEGORIES: Category[] = [
  {
    id: CAT_WEIGHT,
    slug: "weight-management",
    name: "Weight Management",
    description:
      "Meal-replacement shakes and herbal support to manage weight the healthy way.",
    image_url: "/products/2.webp",
    sort_order: 0,
  },
  {
    id: CAT_DAILY,
    slug: "daily-wellness",
    name: "Daily Wellness",
    description:
      "Everyday nutrition — multivitamins, fibre, digestive and immune support.",
    image_url: "/products/6.webp",
    sort_order: 1,
  },
  {
    id: CAT_TARGET,
    slug: "targeted-health",
    name: "Targeted Health",
    description:
      "Focused support for heart, brain, bones, eyes, sleep and more.",
    image_url: "/products/18.webp",
    sort_order: 2,
  },
  {
    id: CAT_SPORTS,
    slug: "sports-energy",
    name: "Sports & Energy",
    description: "H24 hydration and recovery for active bodies and athletes.",
    image_url: "/products/23.webp",
    sort_order: 3,
  },
  {
    id: CAT_SKIN,
    slug: "skin-care",
    name: "Skin Care & Beauty",
    description:
      "Collagen boosters and a daily facial routine for healthy, glowing skin.",
    image_url: "/products/25.webp",
    sort_order: 4,
  },
];

const cat = (id: string) => {
  const c = SEED_CATEGORIES.find((c) => c.id === id)!;
  return { id: c.id, slug: c.slug, name: c.name };
};

const NOW = "2026-05-31T00:00:00.000Z";

const product = (
  id: string,
  category_id: string,
  slug: string,
  name: string,
  description: string,
  price_paise: number,
  weight_grams: number | null,
  image_url: string,
  gallery_image_urls: string[] = [],
): ProductWithCategory => ({
  id,
  category_id,
  slug,
  name,
  description,
  price_paise,
  weight_grams,
  stock: 100,
  image_url,
  gallery_image_urls,
  is_active: true,
  created_at: NOW,
  category: cat(category_id),
});

const P = (n: number) => `/products/${n}.webp`;
const INFO = (name: string) => `/product-info/${name}.jpeg`;

export const SEED_PRODUCTS: ProductWithCategory[] = [
  // ---------- Weight Management ----------
  product(
    "10000000-0000-0000-0000-000000000001",
    CAT_WEIGHT,
    "formula-1-nutritional-shake",
    "Formula 1 Nutritional Shake Mix",
    "The healthy meal in a glass. A balanced shake with 19 vitamins & minerals, 9 g protein and fibre — just 220 calories per serving. Available in 10 flavours from Mango to Kulfi.",
    217900,
    500,
    P(2),
    [INFO("formula-1")],
  ),
  product(
    "10000000-0000-0000-0000-000000000002",
    CAT_WEIGHT,
    "personalized-protein-powder",
    "Personalized Protein Powder",
    "A soy & whey protein blend that helps control hunger and build lean muscle. Provides all 9 essential amino acids — add a scoop to your Formula 1 shake.",
    129500,
    200,
    P(3),
    [INFO("protein")],
  ),
  product(
    "10000000-0000-0000-0000-000000000003",
    CAT_WEIGHT,
    "shakemate",
    "ShakeMate",
    "A milk & soy-based protein drink mix that makes your Formula 1 shake creamier and tastier. Low GI, lower lactose, no added sugar — with calcium and vitamin D.",
    65300,
    550,
    P(4),
    [INFO("shakemate")],
  ),
  product(
    "10000000-0000-0000-0000-000000000004",
    CAT_WEIGHT,
    "cell-u-loss",
    "Cell-U-Loss",
    "A herbal tablet that supports healthy fluid balance and helps reduce bloating, with electrolyte minerals — corn silk, dandelion, parsley and potassium.",
    170500,
    null,
    P(8),
    [INFO("cell-u-lose")],
  ),
  product(
    "10000000-0000-0000-0000-000000000005",
    CAT_WEIGHT,
    "herbal-control",
    "Herbal Control",
    "A metabolism and energy booster with antioxidants from green, black and oolong tea. Helps improve alertness and supports weight management alongside diet and exercise.",
    343300,
    null,
    P(9),
    [INFO("herbal-control")],
  ),

  // ---------- Daily Wellness ----------
  product(
    "20000000-0000-0000-0000-000000000001",
    CAT_DAILY,
    "afresh-energy-drink-mix",
    "Afresh Energy Drink Mix",
    "A refreshing low-calorie energy drink (just 4 calories) with green tea and natural caffeine for alertness. Enjoy hot or cold in 7 flavours — Lemon, Ginger, Tulsi and more.",
    81200,
    50,
    P(1),
    [INFO("afresh")],
  ),
  product(
    "20000000-0000-0000-0000-000000000002",
    CAT_DAILY,
    "dinoshake-childrens-drink",
    "Dinoshake Children's Nutritional Drink",
    "A tasty nutritional drink mix for kids that supports healthy growth, bones and energy. Good-quality protein with vitamins A, C, D & E, calcium and iron. Chocolate & Strawberry.",
    111500,
    200,
    P(5),
    [INFO("kids-nurtition")],
  ),
  product(
    "20000000-0000-0000-0000-000000000003",
    CAT_DAILY,
    "formula-2-multivitamin",
    "Formula 2 Multivitamin Complex",
    "A daily multivitamin, mineral and herbal tablet that supports energy, immunity and bone health. With vitamins A, C, D, E, B-complex, calcium, iron, zinc and selenium.",
    200400,
    null,
    P(6),
    [INFO("multivitamin")],
  ),
  product(
    "20000000-0000-0000-0000-000000000004",
    CAT_DAILY,
    "cell-activator",
    "Cell Activator",
    "An antioxidant tablet with alpha lipoic acid and aloe vera that supports nutrient absorption and cellular energy production — for vitality and healthy aging.",
    221500,
    null,
    P(7),
    [INFO("cell-activator")],
  ),
  product(
    "20000000-0000-0000-0000-000000000005",
    CAT_DAILY,
    "aloe-plus",
    "Aloe Plus",
    "Aloe vera capsules that support healthy digestion, soothe the stomach and aid nutrient absorption — helping maintain digestive balance naturally.",
    105900,
    null,
    P(10),
    [INFO("digestive-health")],
  ),
  product(
    "20000000-0000-0000-0000-000000000006",
    CAT_DAILY,
    "activated-fiber",
    "Activated Fibre",
    "Dietary fibre tablets that help you feel full longer, support gut health and healthy blood-sugar levels. A blend of oat, citrus, pea and soluble fibre.",
    163600,
    null,
    P(11),
    [INFO("digestive-health")],
  ),
  product(
    "20000000-0000-0000-0000-000000000007",
    CAT_DAILY,
    "active-fiber-complex",
    "Active Fibre Complex",
    "An unflavoured fibre powder that adds daily fibre to any drink — supports digestion, satiety and weight management with citrus fibre and inulin.",
    255900,
    null,
    P(12),
    [INFO("digestive-health")],
  ),
  product(
    "20000000-0000-0000-0000-000000000008",
    CAT_DAILY,
    "simply-probiotic",
    "Simply Probiotic",
    "A convenient probiotic powder with clinically studied Bacillus coagulans that supports a healthy gut microbiome, digestion and immunity. No added sugar.",
    220900,
    null,
    P(13),
    [INFO("digestive-health-2")],
  ),
  product(
    "20000000-0000-0000-0000-000000000009",
    CAT_DAILY,
    "herbal-aloe-concentrate",
    "Herbal Aloe Concentrate",
    "A refreshing aloe vera drink concentrate to mix with water. Supports healthy digestion, soothes the stomach and helps maintain hydration. Low calorie.",
    269600,
    null,
    P(14),
    [INFO("digestive-health-2")],
  ),
  product(
    "20000000-0000-0000-0000-000000000010",
    CAT_DAILY,
    "triphala",
    "Triphala",
    "The classic Ayurvedic blend of Amla, Haritaki and Bibhitaki. Supports digestion, regular bowel movements, natural detox and overall wellbeing.",
    108900,
    null,
    P(29),
    [INFO("digestive-health-2")],
  ),
  product(
    "20000000-0000-0000-0000-000000000011",
    CAT_DAILY,
    "immune-health",
    "Immune Health",
    "An Ayurvedic-inspired tablet with Tulsi, Kalmegh and Katuki that supports natural immune function and respiratory wellness through seasonal changes. Vegetarian.",
    152800,
    null,
    P(27),
    [INFO("immune-health")],
  ),

  // ---------- Targeted Health ----------
  product(
    "30000000-0000-0000-0000-000000000001",
    CAT_TARGET,
    "calcium-tablets",
    "Herbalife Calcium Tablets",
    "Calcium, magnesium and vitamin D tablets that help maintain strong bones and healthy teeth, and support muscle and nerve function — ideal for active adults and women.",
    120300,
    null,
    P(15),
    [INFO("bone-health")],
  ),
  product(
    "30000000-0000-0000-0000-000000000002",
    CAT_TARGET,
    "joint-support",
    "Joint Support",
    "Glucosamine tablets that help maintain healthy joint function, comfort and flexibility — supporting cartilage and reducing stiffness during daily activity.",
    245500,
    null,
    P(16),
    [INFO("bone-health")],
  ),
  product(
    "30000000-0000-0000-0000-000000000003",
    CAT_TARGET,
    "herbalifeline",
    "Herbalifeline",
    "Highly purified marine lipid capsules rich in Omega-3 fatty acids (EPA & DHA) that help maintain a healthy cardiovascular system and normal triglyceride levels.",
    266700,
    null,
    P(17),
    [INFO("heart-health")],
  ),
  product(
    "30000000-0000-0000-0000-000000000004",
    CAT_TARGET,
    "beta-heart",
    "Beta Heart",
    "A natural vanilla powder with 3 g of oat beta-glucan per serving that helps maintain healthy blood cholesterol levels. No added sugar — single-serve, on-the-go.",
    224200,
    null,
    P(18),
    [INFO("heart-health")],
  ),
  product(
    "30000000-0000-0000-0000-000000000005",
    CAT_TARGET,
    "niteworks",
    "Niteworks",
    "A refreshing lemon-flavour powder with L-Arginine that helps produce nitric oxide overnight to support cardiovascular and circulatory health. With vitamins C, E and folic acid.",
    712800,
    null,
    P(19),
    [INFO("heart-health")],
  ),
  product(
    "30000000-0000-0000-0000-000000000006",
    CAT_TARGET,
    "womens-choice",
    "Woman's Choice",
    "Soy isoflavone and chasteberry tablets that support women's hormonal balance and comfort through monthly cycles and menopause — plant-derived daily wellness.",
    124500,
    null,
    P(20),
    [INFO("women-halth")],
  ),
  product(
    "30000000-0000-0000-0000-000000000007",
    CAT_TARGET,
    "male-factor-plus",
    "Male Factor +",
    "Fenugreek, pine bark extract and L-Citrulline tablets that support male vitality, healthy circulation and stamina — designed for adult men above 25.",
    341000,
    null,
    P(21),
    [INFO("mens-health")],
  ),
  product(
    "30000000-0000-0000-0000-000000000008",
    CAT_TARGET,
    "ocular-defense",
    "Ocular Defense",
    "Lutein and zeaxanthin capsules that support healthy eyesight and macular health, protecting eyes from oxidative and blue-light stress — for those on screens all day.",
    192700,
    null,
    P(22),
    [INFO("eye-health")],
  ),
  product(
    "30000000-0000-0000-0000-000000000009",
    CAT_TARGET,
    "sleep-enhancer",
    "Sleep Enhancer",
    "A caffeine-free nighttime drink with saffron extract (Affron®) and vitamin B6 that helps improve sleep quality and supports calm — wake up refreshed. Vegan & gluten free.",
    169700,
    null,
    P(26),
    [INFO("sleep-enhance")],
  ),
  product(
    "30000000-0000-0000-0000-000000000010",
    CAT_TARGET,
    "brain-health",
    "Brain Health",
    "Brahmi (Bacopa monnieri) tablets that support memory, focus and concentration — traditionally used in Ayurveda for cognitive performance and mental alertness.",
    146400,
    null,
    P(28),
    [INFO("brain-health")],
  ),

  // ---------- Sports & Energy ----------
  product(
    "40000000-0000-0000-0000-000000000001",
    CAT_SPORTS,
    "h24-hydrate",
    "H24 Hydrate",
    "A low-calorie electrolyte drink that replenishes minerals lost through sweat and supports endurance and energy metabolism with B vitamins. Convenient sachets for any workout.",
    163600,
    null,
    "/products/h24-hydrate/img1.jpg",
    [
      "/products/h24-hydrate/img2.jpg",
      "/products/h24-hydrate/img4.jpg",
      "/products/h24-hydrate/img5.jpg",
      "/products/h24-hydrate/img3.jpg",
    ],
  ),
  product(
    "40000000-0000-0000-0000-000000000002",
    CAT_SPORTS,
    "h24-rebuild-strength",
    "H24 Rebuild Strength",
    "A post-workout recovery shake with 24–25 g protein, BCAAs and L-glutamine that helps rebuild muscle and reduce soreness after strength training and intense exercise.",
    261600,
    null,
    P(24),
    [INFO("sports-nutrition")],
  ),

  // ---------- Skin Care & Beauty ----------
  product(
    "50000000-0000-0000-0000-000000000001",
    CAT_SKIN,
    "skin-booster",
    "HN Skin Booster",
    "An orange-flavour collagen powder with vitamins A, C, E and biotin that helps improve skin elasticity, hydration and glow — and supports healthy hair and nails.",
    391000,
    null,
    P(25),
    [INFO("skin-health")],
  ),
  product(
    "50000000-0000-0000-0000-000000000002",
    CAT_SKIN,
    "facial-cleanser",
    "Facial Cleanser",
    "A gentle daily cleanser with jojoba beads, aloe vera and vitamins B3, C & E that removes dirt, oil and makeup, leaving skin clean, smooth and refreshed.",
    116500,
    null,
    P(30),
    [INFO("skin-health")],
  ),
  product(
    "50000000-0000-0000-0000-000000000003",
    CAT_SKIN,
    "facial-toner",
    "Facial Toner",
    "An alcohol-free toner with aloe vera, mandarin citrus extracts and vitamins B3, C & E that refreshes skin and preps it to better absorb serum and moisturizer. All skin types.",
    132200,
    null,
    P(31),
    [INFO("skin-health-2")],
  ),
  product(
    "50000000-0000-0000-0000-000000000004",
    CAT_SKIN,
    "moisturizer",
    "Moisturizer",
    "A lightweight daily moisturizer with aloe vera, macadamia and olive oils that delivers deep hydration — clinically shown to improve skin softness and luminosity in 7 days.",
    147300,
    null,
    P(32),
    [INFO("skin-health-2")],
  ),
  product(
    "50000000-0000-0000-0000-000000000005",
    CAT_SKIN,
    "facial-serum",
    "Facial Serum",
    "A concentrated serum with peptides, botanical extracts and vitamins B3, C & E that helps reduce fine lines, brighten and firm skin for a fresh, youthful glow.",
    302200,
    null,
    P(33),
    [INFO("skin-health-2")],
  ),
];

export function seedCategoryBySlug(slug: string): Category | null {
  return SEED_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function seedProductBySlug(slug: string): ProductWithCategory | null {
  return SEED_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export function seedProductsByCategoryId(
  categoryId: string,
): ProductWithCategory[] {
  return SEED_PRODUCTS.filter((p) => p.category_id === categoryId);
}
