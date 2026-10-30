import { createServerFn } from "@tanstack/react-start";
import { supabaseRequest } from "./supabase.server";

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  long_description: string | null;
  price: number;
  category: string;
  image: string | null;
  active: boolean;
  status: "draft" | "published" | "archived";
  featured: boolean;
  new_arrival: boolean;
  fashion_style: string | null;
  gender: "Male" | "Female" | "Unisex";
  created_at: string;
  updated_at: string;
};

export type AdminProductVariant = {
  id: string;
  product_id: string;
  size: string;
  color: string;
  sku: string | null;
  stock: number;
  created_at: string;
};

export type AdminProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at?: string;
};

type AdminContext = { accessToken: string };

function getServerConfig() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) throw new Error("Thiếu cấu hình Supabase trên server.");
  return { url, secretKey };
}

async function requireAdmin(accessToken: string) {
  const token = accessToken.trim();
  if (!token) throw new Error("UNAUTHORIZED");

  const { url, secretKey } = getServerConfig();
  const userResponse = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: secretKey, Authorization: `Bearer ${token}` },
  });
  if (!userResponse.ok) throw new Error("UNAUTHORIZED");

  const user = (await userResponse.json()) as { id?: string };
  if (!user.id) throw new Error("UNAUTHORIZED");

  const admins = await supabaseRequest<Array<{ user_id: string }>>(
    `admin_users?user_id=eq.${encodeURIComponent(user.id)}&select=user_id&limit=1`,
    { method: "GET" },
  );
  if (!admins.length) throw new Error("FORBIDDEN");

  return user.id;
}

export const suggestAdminColorName = createServerFn({ method: "POST" })
  .validator((data: AdminContext & { hex: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const hexValue = data.hex.trim().replace(/^#/, "").toUpperCase();
    if (!/^[0-9A-F]{6}$/.test(hexValue)) throw new Error("Mã màu HEX không hợp lệ.");
    const hex = `#${hexValue}`;

    // Reuse a name already used by WEARO before asking the external color directory.
    const existing = await supabaseRequest<Array<{ color: string }>>(
      "product_variants?select=color&limit=1000",
      { method: "GET" },
    );
    for (const row of existing) {
      const match = row.color.match(/#([0-9a-fA-F]{6})/);
      if (match?.[1]?.toUpperCase() === hexValue) {
        const name = row.color.replace(/\s*\(#?[0-9a-fA-F]{6}\)/, "").replace(/\s*#([0-9a-fA-F]{6})/, "").trim();
        if (name && !/^màu tùy chỉnh$/i.test(name)) return { hex, name, source: "wearo" as const };
      }
    }

    const response = await fetch(`https://www.thecolorapi.com/id?hex=${hexValue}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Không lấy được tên màu lúc này. Bạn vẫn có thể nhập HEX và tự đặt tên.");
    const result = (await response.json()) as { name?: { value?: string } };
    const name = result.name?.value?.trim();
    if (!name) throw new Error("API chưa trả về tên màu. Bạn có thể tự đặt tên.");
    return { hex, name, source: "thecolorapi" as const };
  });

export const listAdminProducts = createServerFn({ method: "POST" })
  .validator((data: AdminContext) => data)
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    return supabaseRequest<AdminProduct[]>(
      "products?select=*&order=created_at.desc",
      { method: "GET" },
    );
  });

export const listAdminInventory = createServerFn({ method: "POST" })
  .validator((data: AdminContext) => data)
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);

    const [products, variants] = await Promise.all([
      supabaseRequest<AdminProduct[]>(
        "products?select=id,name,slug,description,short_description,long_description,price,category,gender,image,active,status,featured,new_arrival,fashion_style,created_at,updated_at&order=created_at.desc",
        { method: "GET" },
      ),
      supabaseRequest<AdminProductVariant[]>(
        "product_variants?select=id,product_id,size,color,sku,stock,created_at&order=size.asc,color.asc",
        { method: "GET" },
      ),
    ]);

    const productsById = new Map(products.map((product) => [product.id, product]));
    return variants.flatMap((variant) => {
      const product = productsById.get(variant.product_id);
      return product ? [{ ...variant, product }] : [];
    });
  });

export const getAdminProduct = createServerFn({ method: "POST" })
  .validator((data: AdminContext & { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const rows = await supabaseRequest<AdminProduct[]>(
      `products?select=*&id=eq.${encodeURIComponent(data.id)}&limit=1`,
      { method: "GET" },
    );
    return rows[0] ?? null;
  });

export const createAdminProduct = createServerFn({ method: "POST" })
  .validator((data: AdminContext & { product: { name: string; slug: string; price: number; category: string; description?: string | null; short_description?: string | null; long_description?: string | null; image?: string | null; active?: boolean; status?: AdminProduct["status"]; featured?: boolean; new_arrival?: boolean; fashion_style?: string | null; gender?: "Male" | "Female" | "Unisex" } }) => data)
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const name = data.product.name.trim();
    const slug = data.product.slug.trim();
    const price = Number(data.product.price);
    if (!name || !slug) throw new Error("Tên sản phẩm và slug là bắt buộc.");
    if (!Number.isSafeInteger(price) || price < 1000) throw new Error("Giá sản phẩm phải từ 1.000đ trở lên.");

    const archivedSlugMatches = await supabaseRequest<Array<{ id: string }>>(
      `products?slug=eq.${encodeURIComponent(slug)}&status=eq.archived&select=id&limit=1`,
      { method: "GET" },
    );
    if (archivedSlugMatches.length) {
      throw new Error("Slug này đang thuộc một sản phẩm trong thùng rác. Hãy đổi slug trước khi tạo sản phẩm mới.");
    }

    const rows = await supabaseRequest<AdminProduct[]>(
      "products",
      {
        method: "POST",
        body: JSON.stringify({
          ...data.product,
          name,
          slug,
          price,
          gender: data.product.gender ?? "Unisex",
          id: `product-${crypto.randomUUID()}`,
          active: data.product.status === "published",
        }),
      },
    );
    return rows[0];
  });

export const updateAdminProduct = createServerFn({ method: "POST" })
  .validator((data: AdminContext & { id: string; product: Partial<Omit<AdminProduct, "id" | "created_at" | "updated_at">> }) => data)
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const patch = { ...data.product };
    if (patch.name !== undefined) patch.name = patch.name.trim();
    if (patch.slug !== undefined) patch.slug = patch.slug.trim();
    if (patch.price !== undefined) {
      const price = Number(patch.price);
      if (!Number.isSafeInteger(price) || price < 1000) {
        throw new Error("Giá sản phẩm phải từ 1.000đ trở lên.");
      }
      patch.price = price;
    }

    const currentRows = await supabaseRequest<Array<Pick<AdminProduct, "id" | "slug" | "status">>>(
      `products?id=eq.${encodeURIComponent(data.id)}&select=id,slug,status&limit=1`,
      { method: "GET" },
    );
    const current = currentRows[0];
    if (!current) throw new Error("Không tìm thấy sản phẩm cần cập nhật.");

    if (patch.active === true && patch.status === undefined && current.status !== "published") {
      throw new Error("Không thể bật hiển thị trực tiếp cho sản phẩm chưa ở trạng thái Đang hoạt động. Hãy chọn trạng thái xuất bản một cách rõ ràng.");
    }

    if (patch.status !== undefined) {
      if (current.status === "archived" && patch.status === "published") {
        throw new Error("Không thể xuất bản trực tiếp sản phẩm trong thùng rác. Hãy khôi phục về bản nháp trước.");
      }
      patch.active = patch.status === "published";
    }

    const nextSlug = (patch.slug ?? current.slug).trim();
    const willPublish = patch.status === "published" || (patch.status === undefined && patch.active === true);
    if (willPublish || patch.slug !== undefined) {
      const archivedSlugMatches = await supabaseRequest<Array<{ id: string }>>(
        `products?slug=eq.${encodeURIComponent(nextSlug)}&status=eq.archived&id=neq.${encodeURIComponent(data.id)}&select=id&limit=1`,
        { method: "GET" },
      );
      if (archivedSlugMatches.length && (willPublish || patch.slug !== undefined)) {
        throw new Error("Slug này đang thuộc một sản phẩm trong thùng rác. Hãy đổi slug trước khi xuất bản hoặc lưu thay đổi.");
      }
    }

    const rows = await supabaseRequest<AdminProduct[]>(
      `products?id=eq.${encodeURIComponent(data.id)}`,
      { method: "PATCH", body: JSON.stringify(patch) },
    );
    return rows[0];
  });

export const archiveAdminProduct = createServerFn({ method: "POST" })
  .validator((data: AdminContext & { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const rows = await supabaseRequest<AdminProduct[]>(
      `products?id=eq.${encodeURIComponent(data.id)}`,
      { method: "PATCH", body: JSON.stringify({ status: "archived", active: false }) },
    );
    return rows[0];
  });

export const listAdminProductVariants = createServerFn({ method: "POST" })
  .validator((data: AdminContext & { productId: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    return supabaseRequest<AdminProductVariant[]>(
      `product_variants?select=*&product_id=eq.${encodeURIComponent(data.productId)}&order=size.asc,color.asc`,
      { method: "GET" },
    );
  });

export const createAdminProductVariant = createServerFn({ method: "POST" })
  .validator((data: AdminContext & { productId: string; size: string; color: string; sku?: string | null; stock?: number }) => data)
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const size = data.size.trim();
    const color = data.color.trim();
    const stock = Number(data.stock ?? 0);
    if (!size || !color) throw new Error("Size và Color là bắt buộc.");
    if (!Number.isInteger(stock) || stock < 0) throw new Error("Stock phải là số nguyên từ 0 trở lên.");
    const rows = await supabaseRequest<AdminProductVariant[]>(
      "product_variants",
      {
        method: "POST",
        body: JSON.stringify({ product_id: data.productId, size, color, sku: data.sku?.trim() || null, stock }),
      },
    );
    return rows[0];
  });

export const updateAdminProductVariant = createServerFn({ method: "POST" })
  .validator((data: AdminContext & { id: string; size?: string; color?: string; sku?: string | null; stock?: number }) => data)
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const patch: Record<string, unknown> = {};
    if (data.size !== undefined) patch.size = data.size.trim();
    if (data.color !== undefined) patch.color = data.color.trim();
    if (data.sku !== undefined) patch.sku = data.sku?.trim() || null;
    if (data.stock !== undefined) {
      const stock = Number(data.stock);
      if (!Number.isInteger(stock) || stock < 0) throw new Error("Stock phải là số nguyên từ 0 trở lên.");
      patch.stock = stock;
    }
    if (typeof patch.size === "string" && !patch.size) throw new Error("Size không được để trống.");
    if (typeof patch.color === "string" && !patch.color) throw new Error("Color không được để trống.");
    const rows = await supabaseRequest<AdminProductVariant[]>(
      `product_variants?id=eq.${encodeURIComponent(data.id)}`,
      { method: "PATCH", body: JSON.stringify(patch) },
    );
    return rows[0];
  });

export const deleteAdminProductVariant = createServerFn({ method: "POST" })
  .validator((data: AdminContext & { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const id = data.id.trim();
    if (!id) throw new Error("Variant ID không hợp lệ.");

    const [cartRefs, inventoryRefs, orderRefs] = await Promise.all([
      supabaseRequest<Array<{ id: string }>>(
        `cart_items?variant_id=eq.${encodeURIComponent(id)}&select=id&limit=1`,
        { method: "GET" },
      ),
      supabaseRequest<Array<{ id: string }>>(
        `inventory_movements?variant_id=eq.${encodeURIComponent(id)}&select=id&limit=1`,
        { method: "GET" },
      ),
      supabaseRequest<Array<{ id: string }>>(
        `order_items?variant_id=eq.${encodeURIComponent(id)}&select=id&limit=1`,
        { method: "GET" },
      ),
    ]);

    if (cartRefs.length || inventoryRefs.length || orderRefs.length) {
      throw new Error("Không thể xóa variant đã được tham chiếu bởi giỏ hàng, lịch sử tồn kho hoặc đơn hàng. Hãy ngừng bán/đặt tồn kho về 0 thay vì xóa để bảo toàn dữ liệu.");
    }

    await supabaseRequest<unknown>(
      `product_variants?id=eq.${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    return { ok: true };
  });

export const listAdminProductImages = createServerFn({ method: "POST" })
  .validator((data: AdminContext & { productId: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    return supabaseRequest<AdminProductImage[]>(
      `product_images?select=*&product_id=eq.${encodeURIComponent(data.productId)}&order=sort_order.asc,created_at.asc`,
      { method: "GET" },
    );
  });

export const createAdminProductImage = createServerFn({ method: "POST" })
  .validator((data: AdminContext & { productId: string; imageUrl: string; altText?: string | null; sortOrder?: number; isPrimary?: boolean }) => data)
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const imageUrl = data.imageUrl.trim();
    if (!imageUrl) throw new Error("Image URL là bắt buộc.");
    const rows = await supabaseRequest<AdminProductImage[]>(
      "product_images",
      {
        method: "POST",
        body: JSON.stringify({ product_id: data.productId, image_url: imageUrl, alt_text: data.altText?.trim() || null, sort_order: Number(data.sortOrder ?? 0), is_primary: Boolean(data.isPrimary) }),
      },
    );
    return rows[0];
  });

export const updateAdminProductImage = createServerFn({ method: "POST" })
  .validator((data: AdminContext & { id: string; altText?: string | null; sortOrder?: number; isPrimary?: boolean }) => data)
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const patch: Record<string, unknown> = {};
    if (data.altText !== undefined) patch.alt_text = data.altText?.trim() || null;
    if (data.sortOrder !== undefined) patch.sort_order = Number(data.sortOrder);
    if (data.isPrimary !== undefined) patch.is_primary = Boolean(data.isPrimary);
    const rows = await supabaseRequest<AdminProductImage[]>(
      `product_images?id=eq.${encodeURIComponent(data.id)}`,
      { method: "PATCH", body: JSON.stringify(patch) },
    );
    return rows[0];
  });

export const deleteAdminProductImage = createServerFn({ method: "POST" })
  .validator((data: AdminContext & { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    await supabaseRequest<unknown>(
      `product_images?id=eq.${encodeURIComponent(data.id)}`,
      { method: "DELETE" },
    );
    return { ok: true };
  });

export const setPrimaryAdminProductImage = createServerFn({ method: "POST" })
  .validator((data: AdminContext & { productId: string; imageId: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);

    const productId = data.productId.trim();
    const imageId = data.imageId.trim();
    if (!productId || !imageId) throw new Error("Sản phẩm hoặc hình ảnh không hợp lệ.");

    // Validate ownership before changing any primary-image flags.
    const target = await supabaseRequest<Pick<AdminProductImage, "id">[]>(
      `product_images?id=eq.${encodeURIComponent(imageId)}&product_id=eq.${encodeURIComponent(productId)}&select=id&limit=1`,
      { method: "GET" },
    );
    if (!target.length) throw new Error("Hình ảnh không thuộc sản phẩm đã chọn.");

    const previousPrimary = await supabaseRequest<Array<Pick<AdminProductImage, "id">>>(
      `product_images?product_id=eq.${encodeURIComponent(productId)}&is_primary=eq.true&select=id&limit=1`,
      { method: "GET" },
    );

    await supabaseRequest<unknown>(
      `product_images?product_id=eq.${encodeURIComponent(productId)}`,
      { method: "PATCH", body: JSON.stringify({ is_primary: false }) },
    );

    try {
      const rows = await supabaseRequest<AdminProductImage[]>(
        `product_images?id=eq.${encodeURIComponent(imageId)}&product_id=eq.${encodeURIComponent(productId)}`,
        { method: "PATCH", body: JSON.stringify({ is_primary: true }) },
      );
      if (!rows[0]) throw new Error("Không thể đặt hình ảnh chính.");
      return rows[0];
    } catch (error) {
      // Compensate if the second request fails. A database RPC is still required
      // for strict atomicity under concurrent requests.
      if (previousPrimary[0]?.id) {
        await supabaseRequest<unknown>(
          `product_images?id=eq.${encodeURIComponent(previousPrimary[0].id)}&product_id=eq.${encodeURIComponent(productId)}`,
          { method: "PATCH", body: JSON.stringify({ is_primary: true }) },
        );
      }
      throw error;
    }
  });
