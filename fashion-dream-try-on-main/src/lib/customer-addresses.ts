import { getCustomerSession } from "@/lib/auth";
import { supabaseConfig } from "@/lib/upthink-supabase";

export type CustomerAddress = {
  id: string;
  user_id: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  ward: string;
  district: string;
  city: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerAddressInput = {
  recipient_name: string;
  phone: string;
  address_line: string;
  ward: string;
  district: string;
  city: string;
  is_default?: boolean;
};

export type UpdateCustomerAddressInput = Partial<CustomerAddressInput>;

const PREVIEW_USER_ID = "preview-account-user";
const ADDRESS_COLUMNS =
  "id,user_id,recipient_name,phone,address_line,ward,district,city,is_default,created_at,updated_at";

function requireCustomerIdentity(userId: string) {
  if (!userId || userId === PREVIEW_USER_ID) {
    throw new Error("Sổ địa chỉ Preview không kết nối dữ liệu tài khoản thật.");
  }
  const session = getCustomerSession();
  if (!session?.access_token || session.user?.id !== userId) {
    throw new Error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
  }
  return session.access_token;
}

function headers(accessToken: string, extra?: Record<string, string>) {
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
    let message = body || `Address request failed (${response.status})`;
    try {
      const error = JSON.parse(body) as {
        message?: string;
        details?: string;
        hint?: string;
        code?: string;
      };
      message = error.message || error.details || error.hint || message;
      if (error.code === "42501" || response.status === 403) {
        message = "Bạn không có quyền thao tác địa chỉ này. Hãy tải lại trang và thử lại.";
      } else if (error.code === "P0002") {
        message = "Không tìm thấy địa chỉ thuộc tài khoản của bạn.";
      }
    } catch {}
    throw new Error(message);
  }
  if (!body) return undefined as T;
  return JSON.parse(body) as T;
}

function addressesUrl(userId: string, query = "") {
  const suffix = query ? `&${query}` : "";
  return `${supabaseConfig.url}/rest/v1/customer_addresses?user_id=eq.${encodeURIComponent(userId)}&select=${ADDRESS_COLUMNS}${suffix}`;
}

function normalizeAddress(input: CustomerAddressInput | UpdateCustomerAddressInput) {
  const output: Record<string, string | boolean> = {};
  const fields = ["recipient_name", "phone", "address_line", "ward", "district", "city"] as const;
  for (const field of fields) {
    const value = input[field];
    if (value !== undefined) output[field] = value.trim();
  }
  if (input.is_default !== undefined) output.is_default = input.is_default;
  return output;
}

function validateAddress(input: CustomerAddressInput | UpdateCustomerAddressInput, partial: boolean) {
  const limits = {
    recipient_name: 120,
    phone: 30,
    address_line: 300,
    ward: 120,
    district: 120,
    city: 120,
  } as const;
  const labels = {
    recipient_name: "Tên người nhận",
    phone: "Số điện thoại",
    address_line: "Địa chỉ cụ thể",
    ward: "Phường/xã",
    district: "Quận/huyện",
    city: "Tỉnh/thành phố",
  } as const;

  for (const field of Object.keys(limits) as (keyof typeof limits)[]) {
    const value = input[field];
    if (value === undefined && partial) continue;
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`${labels[field]} không được để trống.`);
    }
    if (value.trim().length > limits[field]) {
      throw new Error(`${labels[field]} không được vượt quá ${limits[field]} ký tự.`);
    }
  }
}

/** List only addresses owned by the signed-in customer. */
export async function listCustomerAddresses(userId: string): Promise<CustomerAddress[]> {
  const token = requireCustomerIdentity(userId);
  return parseResponse<CustomerAddress[]>(
    await fetch(addressesUrl(userId, "order=is_default.desc,created_at.desc"), {
      headers: headers(token),
    }),
  );
}

/** Create an address. If requested as default, set it through the transactional RPC. */
export async function createCustomerAddress(
  userId: string,
  input: CustomerAddressInput,
): Promise<CustomerAddress> {
  const token = requireCustomerIdentity(userId);
  validateAddress(input, false);
  const payload = normalizeAddress(input);

  const rows = await parseResponse<CustomerAddress[]>(
    await fetch(addressesUrl(userId), {
      method: "POST",
      headers: headers(token, { Prefer: "return=representation" }),
      body: JSON.stringify({ ...payload, user_id: userId, is_default: false }),
    }),
  );
  const created = rows[0];
  if (!created) throw new Error("Không nhận được địa chỉ sau khi lưu. Vui lòng tải lại và thử lại.");

  if (input.is_default) return setDefaultCustomerAddress(userId, created.id);
  return created;
}

/** Update by address ID; ownership is enforced by both user_id filter and RLS. */
export async function updateCustomerAddress(
  userId: string,
  addressId: string,
  input: UpdateCustomerAddressInput,
): Promise<CustomerAddress> {
  const token = requireCustomerIdentity(userId);
  if (!addressId) throw new Error("Thiếu mã địa chỉ cần cập nhật.");
  validateAddress(input, true);
  const payload = normalizeAddress(input);
  const shouldSetDefault = input.is_default === true;
  // Avoid toggling the partial unique default index directly; the RPC serializes this operation.
  if (shouldSetDefault) delete payload.is_default;

  const rows = await parseResponse<CustomerAddress[]>(
    await fetch(
      `${addressesUrl(userId)}&id=eq.${encodeURIComponent(addressId)}`,
      {
        method: "PATCH",
        headers: headers(token, { Prefer: "return=representation" }),
        body: JSON.stringify(payload),
      },
    ),
  );
  let updated = rows[0];
  if (!updated) throw new Error("Không tìm thấy địa chỉ thuộc tài khoản của bạn.");

  if (shouldSetDefault) updated = await setDefaultCustomerAddress(userId, addressId);
  if (input.is_default === false && updated.is_default) {
    // Clearing the current default is allowed; the customer may choose another later.
    const cleared = await parseResponse<CustomerAddress[]>(
      await fetch(
        `${addressesUrl(userId)}&id=eq.${encodeURIComponent(addressId)}`,
        {
          method: "PATCH",
          headers: headers(token, { Prefer: "return=representation" }),
          body: JSON.stringify({ is_default: false }),
        },
      ),
    );
    updated = cleared[0] ?? { ...updated, is_default: false };
  }
  return updated;
}

/** Hard-delete an address owned by this customer; orders must store their own address snapshot. */
export async function deleteCustomerAddress(userId: string, addressId: string): Promise<void> {
  const token = requireCustomerIdentity(userId);
  if (!addressId) throw new Error("Thiếu mã địa chỉ cần xóa.");
  const response = await fetch(
    `${supabaseConfig.url}/rest/v1/customer_addresses?user_id=eq.${encodeURIComponent(userId)}&id=eq.${encodeURIComponent(addressId)}`,
    { method: "DELETE", headers: headers(token, { Prefer: "return=minimal" }) },
  );
  await parseResponse<unknown>(response);
}

/** Atomically move the default marker to an address owned by this customer. */
export async function setDefaultCustomerAddress(
  userId: string,
  addressId: string,
): Promise<CustomerAddress> {
  const token = requireCustomerIdentity(userId);
  if (!addressId) throw new Error("Thiếu mã địa chỉ cần đặt mặc định.");
  await parseResponse<unknown>(
    await fetch(`${supabaseConfig.url}/rest/v1/rpc/set_default_customer_address`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ p_address_id: addressId }),
    }),
  );

  const rows = await parseResponse<CustomerAddress[]>(
    await fetch(
      `${addressesUrl(userId)}&id=eq.${encodeURIComponent(addressId)}`,
      { headers: headers(token) },
    ),
  );
  const address = rows[0];
  if (!address) throw new Error("Không tìm thấy địa chỉ thuộc tài khoản của bạn sau khi cập nhật.");
  return address;
}
