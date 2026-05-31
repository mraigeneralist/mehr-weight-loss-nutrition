/**
 * Data backend switch.
 *
 * Set the env var DATA_BACKEND to choose where the catalog (and, in "sheets"
 * mode, the orders) live:
 *   DATA_BACKEND=supabase   → Postgres via Supabase (default)
 *   DATA_BACKEND=sheets     → a Google Sheet (service-account, read + write)
 *
 * Auth, customer addresses and the admin dashboard always require Supabase —
 * Google Sheets cannot replace those. In "sheets" mode the storefront runs as
 * a guest-checkout store: catalog from the sheet, each paid order appended to
 * the sheet's "Orders" tab.
 */
import { isSupabaseConfigured } from "@/lib/supabase/check";

export type DataBackend = "supabase" | "sheets";

export const DATA_BACKEND: DataBackend =
  process.env.DATA_BACKEND === "sheets" ? "sheets" : "supabase";

/** True when all Google Sheets service-account env vars are present. */
export function isSheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  );
}

/**
 * True when the active backend is fully configured. When false, pages fall
 * back to static seed data and show the demo banner.
 */
export function isDataConfigured(): boolean {
  return DATA_BACKEND === "sheets"
    ? isSheetsConfigured()
    : isSupabaseConfigured();
}
