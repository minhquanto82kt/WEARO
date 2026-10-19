import type { ThemeColors } from "@/lib/theme";

export type ThemeWorkflowStatus = "draft" | "published" | "archived";

export type AppearanceTheme = {
  id: string;
  name: string;
  scope: "global";
  status: ThemeWorkflowStatus;
  theme_data: ThemeColors;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

const ENDPOINT = "/rest/v1/appearance_themes";
const ADMIN_SESSION_KEY = "upthink_admin_session";

function config(): { url: string; key: string } {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string | undefined;
  if (!url || !key) throw new Error("Supabase appearance configuration is missing.");
  return { url, key };
}

function accessToken(): string {
  if (typeof window === "undefined") throw new Error("Appearance workflow is browser-only.");
  const raw = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) throw new Error("Admin session expired. Please sign in again.");
  try {
    const session = JSON.parse(raw) as { access_token?: unknown };
    if (typeof session.access_token !== "string" || !session.access_token) throw new Error();
    return session.access_token;
  } catch {
    throw new Error("Admin session expired. Please sign in again.");
  }
}

function headers(auth = false): HeadersInit {
  const { key } = config();
  return auth
    ? { apikey: key, Authorization: `Bearer ${accessToken()}`, "Content-Type": "application/json", Prefer: "return=representation" }
    : { apikey: key };
}

async function parse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!response.ok) throw new Error(`Theme request failed (${response.status}). ${text.slice(0, 180)}`);
  return text ? JSON.parse(text) as T : (undefined as T);
}

function mapRow(row: Record<string, unknown>): AppearanceTheme {
  const data = (row.theme_data && typeof row.theme_data === "object" ? row.theme_data : {}) as Partial<ThemeColors>;
  return {
    id: String(row.id),
    name: String(row.name),
    scope: "global",
    status: row.status === "published" ? "published" : row.status === "archived" ? "archived" : "draft",
    theme_data: {
      primary: String(data.primary ?? "#F0A500"),
      secondary: String(data.secondary ?? "#E6D5B8"),
      background: String(data.background ?? "#1B1A17"),
      surface: String(data.surface ?? "#24221E"),
      accent: String(data.accent ?? "#E45826"),
      foreground: String(data.foreground ?? "#F7F1E7"),
    },
    created_by: row.created_by ? String(row.created_by) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    published_at: row.published_at ? String(row.published_at) : null,
  };
}

export async function loadPublishedAppearanceTheme(): Promise<AppearanceTheme | null> {
  try {
    const { url } = config();
    const response = await fetch(`${url}${ENDPOINT}?scope=eq.global&status=eq.published&select=*&limit=1`, { headers: headers(false) });
    const rows = await parse<Record<string, unknown>[]>(response);
    return rows[0] ? mapRow(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function listAppearanceThemes(): Promise<AppearanceTheme[]> {
  const { url } = config();
  const response = await fetch(`${url}${ENDPOINT}?scope=eq.global&select=*&order=updated_at.desc`, { headers: headers(true) });
  const rows = await parse<Record<string, unknown>[]>(response);
  return rows.map(mapRow);
}

export async function createAppearanceTheme(name: string, themeData: ThemeColors): Promise<AppearanceTheme> {
  const { url } = config();
  const response = await fetch(`${url}${ENDPOINT}`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({ name: name.trim() || "WEARO Draft", scope: "global", status: "draft", theme_data: themeData, created_by: getAdminUserId() }),
  });
  const rows = await parse<Record<string, unknown>[]>(response);
  return mapRow(rows[0]);
}

export async function updateAppearanceTheme(id: string, name: string, themeData: ThemeColors): Promise<AppearanceTheme> {
  const { url } = config();
  const response = await fetch(`${url}${ENDPOINT}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: headers(true),
    body: JSON.stringify({ name: name.trim() || "WEARO Draft", theme_data: themeData, status: "draft", published_at: null, updated_at: new Date().toISOString() }),
  });
  const rows = await parse<Record<string, unknown>[]>(response);
  return mapRow(rows[0]);
}

export async function deleteAppearanceTheme(id: string): Promise<void> {
  const { url } = config();
  const response = await fetch(`${url}${ENDPOINT}?id=eq.${encodeURIComponent(id)}&status=eq.draft`, { method: "DELETE", headers: headers(true) });
  await parse<unknown>(response);
}

export async function publishAppearanceTheme(id: string): Promise<AppearanceTheme> {
  const { url } = config();
  const response = await fetch(`${url}/rest/v1/rpc/publish_appearance_theme`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({ p_draft_id: id }),
  });
  const row = await parse<Record<string, unknown> | Record<string, unknown>[]>(response);
  return mapRow(Array.isArray(row) ? row[0] : row);
}

function getAdminUserId(): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as { user?: { id?: unknown } };
    return typeof session.user?.id === "string" ? session.user.id : null;
  } catch {
    return null;
  }
}
