/**
 * Editorial benefit bullets per product, keyed by slug. Sourced from the
 * product info cards in public/product-info/*. Rendered on the product detail
 * page. Kept in code (not the DB) so it shows on every backend without a
 * schema change — add a slug entry to surface benefits for more products.
 */
export const PRODUCT_BENEFITS: Record<string, string[]> = {
  "h24-hydrate": [
    "Helps maintain proper body hydration",
    "Replenishes essential electrolytes lost through sweat",
    "Supports endurance during workouts and physical activity",
    "Helps reduce tiredness and fatigue",
    "Provides low-calorie hydration support",
    "Supports normal energy metabolism with B vitamins",
    "Ideal for gym workouts, sports, walking, running and outdoor activities",
    "Convenient sachet format for easy daily use",
    "Main ingredients: electrolytes (calcium, sodium, magnesium, potassium, phosphorus) and vitamins B1, B2, B5, B12 & C",
  ],
  "h24-rebuild-strength": [
    "Helps rebuild tired muscles after workouts",
    "Supports lean muscle growth and maintenance",
    "Contains about 24–25 g protein per serving",
    "Includes BCAAs and L-glutamine for muscle recovery",
    "Helps reduce post-workout muscle soreness",
    "Supports faster recovery after gym or strength training",
    "Provides carbohydrates to restore energy levels",
    "Supports endurance and athletic performance",
    "Contains iron for oxygen transport and energy metabolism",
    "Useful after weight training, CrossFit, HIIT, football or intense exercise",
    "Main ingredients: whey & casein protein, BCAAs (leucine, isoleucine, valine), L-glutamine, carbohydrates, iron and B vitamins",
  ],
};
