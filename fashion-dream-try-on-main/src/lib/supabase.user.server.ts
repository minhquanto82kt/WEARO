import { fetchWithTimeoutAndRetry } from "@/lib/server-reliability";

export type SupabaseUserClient = {
  request<T>(path: string, options?: RequestInit): Promise<T>;
};

function getPublishableConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error("Thiếu cấu hình Supabase publishable key trên server.");
  return { url, publishableKey };
}

export async function supabaseUserRequest<T>(
  accessToken: string,
  request: (client: SupabaseUserClient, userId: string) => Promise<T>,
): Promise<T> {
  const token = accessToken.trim();
  if (!token) throw new Error("Authentication required");

  const { url, publishableKey } = getPublishableConfig();
  const sessionResponse = await fetchWithTimeoutAndRetry(`${url}/auth/v1/user`, {
    headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
  });

  if (sessionResponse.status === 401 || sessionResponse.status === 403) throw new Error("Authentication required");
  if (!sessionResponse.ok) throw new Error("Không thể xác minh phiên đăng nhập.");

  const user = (await sessionResponse.json()) as { id?: string };
  if (!user.id) throw new Error("Authentication required");

  const client: SupabaseUserClient = {
    async request<R>(path: string, options: RequestInit = {}) {
      const response = await fetchWithTimeoutAndRetry(`${url}/rest/v1/${path}`, {
        ...options,
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
          ...(options.headers ?? {}),
        },
      });
      if (!response.ok) throw new Error(`SUPABASE_USER_REQUEST_FAILED:${response.status}`);
      if (response.status === 204) return undefined as R;
      return response.json() as Promise<R>;
    },
  };

  return request(client, user.id);
}
