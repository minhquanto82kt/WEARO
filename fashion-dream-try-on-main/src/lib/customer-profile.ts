import { getCustomerSession } from "@/lib/auth";
import { supabaseConfig } from "@/lib/upthink-supabase";

export type CustomerProfile = {
  user_id: string;
  full_name: string;
  phone: string | null;
  birth_date: string | null;
  created_at: string;
  updated_at: string;
};

export type UpdateCustomerProfileInput = {
  full_name: string;
  phone?: string | null;
  birth_date?: string | null;
};

const PREVIEW_USER_ID = "preview-account-user";

function requireCustomerIdentity(userId: string) {
  if (!userId || userId === PREVIEW_USER_ID) {
    throw new Error("Hồ sơ Preview không kết nối dữ liệu tài khoản thật.");
  }
  const session = getCustomerSession();
  if (!session?.access_token || session.user?.id !== userId) {
    throw new Error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
  }
  return session.access_token;
}

function customerHeaders(accessToken: string, extra?: Record<string, string>) {
  return {
    apikey: supabaseConfig.key,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.text();
  if (!response.ok) {
    let message = body || `Profile request failed (${response.status})`;
    try {
      const error = JSON.parse(body) as { message?: string; details?: string; hint?: string; code?: string };
      message = error.message || error.details || error.hint || message;
    } catch {}
    throw new Error(message);
  }
  if (!body) return undefined as T;
  return JSON.parse(body) as T;
}

function profileUrl(userId: string) {
  return `${supabaseConfig.url}/rest/v1/customer_profiles?user_id=eq.${encodeURIComponent(userId)}&select=user_id,full_name,phone,birth_date,created_at,updated_at`;
}

/** Read only the signed-in customer's profile. RLS remains the final ownership boundary. */
export async function getCustomerProfile(userId: string): Promise<CustomerProfile | null> {
  const token = requireCustomerIdentity(userId);
  const rows = await parseResponse<CustomerProfile[]>(
    await fetch(profileUrl(userId), { headers: customerHeaders(token) }),
  );
  return rows[0] ?? null;
}

/** Create the row if absent, otherwise update the same user_id row. */
export async function updateCustomerProfile(
  userId: string,
  input: UpdateCustomerProfileInput,
): Promise<CustomerProfile> {
  const token = requireCustomerIdentity(userId);
  const fullName = input.full_name.trim();
  const phone = input.phone?.trim() || null;
  const birthDate = input.birth_date || null;

  if (!fullName || fullName.length > 120) {
    throw new Error("Họ tên phải có từ 1 đến 120 ký tự.");
  }
  if (phone && phone.length > 30) {
    throw new Error("Số điện thoại không được vượt quá 30 ký tự.");
  }
  if (birthDate && (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || birthDate > new Date().toISOString().slice(0, 10))) {
    throw new Error("Ngày sinh không hợp lệ.");
  }

  const rows = await parseResponse<CustomerProfile[]>(
    await fetch(profileUrl(userId), {
      method: "POST",
      headers: customerHeaders(token, {
        Prefer: "resolution=merge-duplicates,return=representation",
      }),
      body: JSON.stringify({
        user_id: userId,
        full_name: fullName,
        phone,
        birth_date: birthDate,
      }),
    }),
  );
  const profile = rows[0];
  if (!profile) throw new Error("Không nhận được hồ sơ sau khi lưu. Vui lòng tải lại và thử lại.");
  return profile;
}
