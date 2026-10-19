export type AppearanceBranding = {
  id: string;
  brand_name: string;
  monogram: string;
  social_title: string;
  social_description: string;
  updated_at: string;
};

const ENDPOINT = "/rest/v1/appearance_branding";
const ADMIN_SESSION_KEY = "upthink_admin_session";

const DEFAULT_BRANDING: Omit<AppearanceBranding, "id" | "updated_at"> = {
  brand_name: "WEARO",
  monogram: "WO",
  social_title: "WEARO — AI Try-On",
  social_description: "Wear it your way with AI-powered virtual try-on.",
};

function config(): { url: string; key: string } {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string | undefined;
  if (!url || !key) throw new Error("Supabase appearance branding configuration is missing.");
  return { url, key };
}

function token(): string {
  if (typeof window === "undefined") throw new Error("Appearance branding is browser-only.");
  const raw = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) throw new Error("Admin session expired. Please sign in again.");
  const session = JSON.parse(raw) as { access_token?: unknown };
  if (typeof session.access_token !== "string" || !session.access_token) throw new Error("Admin session expired. Please sign in again.");
  return session.access_token;
}

function mapRow(row?: Record<string, unknown>): AppearanceBranding {
  return {
    id: typeof row?.id === "string" ? row.id : "global",
    brand_name: typeof row?.brand_name === "string" ? row.brand_name : DEFAULT_BRANDING.brand_name,
    monogram: typeof row?.monogram === "string" ? row.monogram : DEFAULT_BRANDING.monogram,
    social_title: typeof row?.social_title === "string" ? row.social_title : DEFAULT_BRANDING.social_title,
    social_description: typeof row?.social_description === "string" ? row.social_description : DEFAULT_BRANDING.social_description,
    updated_at: typeof row?.updated_at === "string" ? row.updated_at : "",
  };
}

export async function loadAppearanceBranding(): Promise<AppearanceBranding> {
  const { url, key } = config();
  const response = await fetch(`${url}${ENDPOINT}?id=eq.global&select=*`, { headers: { apikey: key } });
  if (!response.ok) throw new Error(`Brand settings read failed (${response.status}).`);
  const rows = await response.json() as Record<string, unknown>[];
  return mapRow(rows[0]);
}

export async function saveAppearanceBranding(value: Pick<AppearanceBranding, "brand_name" | "monogram" | "social_title" | "social_description">): Promise<AppearanceBranding> {
  const { url, key } = config();
  const accessToken = token();
  const payload = {
    id: "global",
    brand_name: value.brand_name.trim() || DEFAULT_BRANDING.brand_name,
    monogram: value.monogram.trim().slice(0, 4).toUpperCase() || DEFAULT_BRANDING.monogram,
    social_title: value.social_title.trim() || DEFAULT_BRANDING.social_title,
    social_description: value.social_description.trim() || DEFAULT_BRANDING.social_description,
    updated_at: new Date().toISOString(),
  };
  const response = await fetch(`${url}${ENDPOINT}?id=eq.global`, {
    method: "PATCH",
    headers: { apikey: key, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Brand settings save failed (${response.status}).`);
  const rows = await response.json() as Record<string, unknown>[];
  const branding = mapRow(rows[0]);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("upthink:appearance:branding", { detail: branding }));
  return branding;
}
