export type AppearanceContent = {
  id: string;
  dark_logo_url: string | null;
  monogram_url: string | null;
  social_image_url: string | null;
  announcement_enabled: boolean;
  announcement_text: string;
  hero_eyebrow: string;
  hero_title: string;
  hero_description: string;
  hero_primary_cta: string;
  hero_secondary_cta: string;
  updated_at: string;
};

const ENDPOINT = "/rest/v1/appearance_branding";
const BUCKET = "site-branding";
const ADMIN_SESSION_KEY = "upthink_admin_session";

const DEFAULTS: Omit<AppearanceContent, "id" | "updated_at"> = {
  dark_logo_url: null,
  monogram_url: null,
  social_image_url: null,
  announcement_enabled: true,
  announcement_text: "AI TRY-ON (BETA) · WEAR IT YOUR WAY",
  hero_eyebrow: "WEARO / AI FASHION SYSTEM",
  hero_title: "WEAR YOUR OWN STORY.",
  hero_description: "Virtual try-on and personalized styling for a more confident way to shop fashion online.",
  hero_primary_cta: "START AI TRY-ON",
  hero_secondary_cta: "EXPLORE COLLECTION",
};

function config() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string | undefined;
  if (!url || !key) throw new Error("Supabase appearance content configuration is missing.");
  return { url, key };
}

function token() {
  if (typeof window === "undefined") throw new Error("Appearance content is browser-only.");
  const raw = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) throw new Error("Admin session expired. Please sign in again.");
  const session = JSON.parse(raw) as { access_token?: unknown };
  if (typeof session.access_token !== "string" || !session.access_token) throw new Error("Admin session expired. Please sign in again.");
  return session.access_token;
}

function mapRow(row?: Record<string, unknown>): AppearanceContent {
  return {
    id: typeof row?.id === "string" ? row.id : "global",
    dark_logo_url: typeof row?.dark_logo_url === "string" ? row.dark_logo_url : DEFAULTS.dark_logo_url,
    monogram_url: typeof row?.monogram_url === "string" ? row.monogram_url : DEFAULTS.monogram_url,
    social_image_url: typeof row?.social_image_url === "string" ? row.social_image_url : DEFAULTS.social_image_url,
    announcement_enabled: typeof row?.announcement_enabled === "boolean" ? row.announcement_enabled : DEFAULTS.announcement_enabled,
    announcement_text: typeof row?.announcement_text === "string" ? row.announcement_text : DEFAULTS.announcement_text,
    hero_eyebrow: typeof row?.hero_eyebrow === "string" ? row.hero_eyebrow : DEFAULTS.hero_eyebrow,
    hero_title: typeof row?.hero_title === "string" ? row.hero_title : DEFAULTS.hero_title,
    hero_description: typeof row?.hero_description === "string" ? row.hero_description : DEFAULTS.hero_description,
    hero_primary_cta: typeof row?.hero_primary_cta === "string" ? row.hero_primary_cta : DEFAULTS.hero_primary_cta,
    hero_secondary_cta: typeof row?.hero_secondary_cta === "string" ? row.hero_secondary_cta : DEFAULTS.hero_secondary_cta,
    updated_at: typeof row?.updated_at === "string" ? row.updated_at : "",
  };
}

export async function loadAppearanceContent(): Promise<AppearanceContent> {
  const { url, key } = config();
  const response = await fetch(`${url}${ENDPOINT}?id=eq.global&select=*`, { headers: { apikey: key } });
  if (!response.ok) throw new Error(`Appearance content read failed (${response.status}).`);
  const rows = await response.json() as Record<string, unknown>[];
  return mapRow(rows[0]);
}

export async function saveAppearanceContent(value: Omit<AppearanceContent, "id" | "updated_at">): Promise<AppearanceContent> {
  const { url, key } = config();
  const accessToken = token();
  const payload = { id: "global", ...value, updated_at: new Date().toISOString() };
  const response = await fetch(`${url}${ENDPOINT}?id=eq.global`, {
    method: "PATCH",
    headers: { apikey: key, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Appearance content save failed (${response.status}).`);
  const rows = await response.json() as Record<string, unknown>[];
  const result = mapRow(rows[0]);
  window.dispatchEvent(new CustomEvent("upthink:appearance:content", { detail: result }));
  return result;
}

export async function uploadAppearanceAsset(file: File, path: "dark-logo" | "monogram" | "social-preview"): Promise<string> {
  const { url, key } = config();
  const accessToken = token();
  if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) throw new Error("Asset chỉ hỗ trợ PNG, JPEG, WebP hoặc SVG.");
  if (file.size > 2 * 1024 * 1024) throw new Error("Asset phải có dung lượng tối đa 2 MB.");
  const upload = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${accessToken}`, "Content-Type": file.type, "x-upsert": "true", "cache-control": "0" },
    body: file,
  });
  if (!upload.ok) throw new Error(`Asset upload failed (${upload.status}).`);
  const publicUrl = `${url}/storage/v1/object/public/${BUCKET}/${path}?v=${Date.now()}`;
  const column = path === "dark-logo" ? "dark_logo_url" : path === "monogram" ? "monogram_url" : "social_image_url";
  const response = await fetch(`${url}${ENDPOINT}?id=eq.global`, {
    method: "PATCH",
    headers: { apikey: key, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ [column]: publicUrl, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error(`Asset setting save failed (${response.status}).`);
  return publicUrl;
}
