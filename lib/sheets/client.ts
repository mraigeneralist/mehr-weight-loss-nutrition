import "server-only";
import { JWT } from "google-auth-library";

/**
 * Low-level Google Sheets v4 client backed by a service account.
 * The spreadsheet must be shared (Editor) with GOOGLE_SERVICE_ACCOUNT_EMAIL.
 *
 * Env:
 *   GOOGLE_SHEETS_SPREADSHEET_ID         the id from the sheet URL
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL         ...@...iam.gserviceaccount.com
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY   the PEM key ("\n" newlines allowed)
 */
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

let jwtClient: JWT | null = null;

function getClient(): JWT {
  if (jwtClient) return jwtClient;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );
  if (!email || !key) {
    throw new Error("Google service-account env vars are not set");
  }
  jwtClient = new JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return jwtClient;
}

function spreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!id) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not set");
  return id;
}

async function authHeader(): Promise<string> {
  const { token } = await getClient().getAccessToken();
  if (!token) throw new Error("Could not obtain Google access token");
  return `Bearer ${token}`;
}

/** Read a whole tab (or A1 range) as a 2-D array of cell strings. */
export async function readRange(range: string): Promise<string[][]> {
  const url = `${SHEETS_API}/${spreadsheetId()}/values/${encodeURIComponent(
    range,
  )}`;
  const res = await fetch(url, {
    headers: { Authorization: await authHeader() },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `Sheets read "${range}" failed: ${res.status} ${await res.text()}`,
    );
  }
  const json = (await res.json()) as { values?: string[][] };
  return json.values ?? [];
}

/** Append one row to the bottom of a tab. */
export async function appendRow(
  tab: string,
  row: (string | number)[],
): Promise<void> {
  const url =
    `${SHEETS_API}/${spreadsheetId()}/values/${encodeURIComponent(`${tab}!A1`)}` +
    `:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: await authHeader(),
      "content-type": "application/json",
    },
    body: JSON.stringify({ values: [row] }),
  });
  if (!res.ok) {
    throw new Error(
      `Sheets append "${tab}" failed: ${res.status} ${await res.text()}`,
    );
  }
}
