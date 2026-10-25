import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createServerFn } from "@tanstack/react-start";
import { type Product } from "@/data/products";
import { getCustomerSession } from "@/lib/auth";
import { isMockUserMode } from "@/lib/mock-user";
import { GROWTH_EVENTS, trackGrowthEvent } from "@/lib/analytics/analytics";
import { addServerCartItem, clearServerCart, getServerCart, removeServerCartItem, updateServerCartItem } from "@/lib/cart.server.functions";

export type CartLine = { variantId: string; qty: number; cartItemId?: string };
type LegacyCartLine = { productId: string; size: string; color: string; qty: number; variantId?: string; cartItemId?: string };
type CartVariant = { id: string; product_id: string; size: string; color: string; stock: number };
type CartProduct = Product & { variants: CartVariant[] };
type DbProduct = { id: string; name: string; description: string; price: number; category: Product["category"]; image: string | null; active: boolean; status: string; featured: boolean };
type DbImage = { id: string; product_id: string; image_url: string; sort_order: number; is_primary: boolean };
type ServerCart = Awaited<ReturnType<typeof getServerCart>>;

const getCartProducts = createServerFn({ method: "GET" })
  .validator((variantIds: string[]) => variantIds)
  .handler(async ({ data: variantIds }) => {
    if (variantIds.length === 0) return [] as CartProduct[];
    const { supabaseRequest } = await import("@/lib/supabase.server");
    const encodedVariantIds = variantIds.map((id) => encodeURIComponent(id)).join(",");
    const variants = await supabaseRequest<CartVariant[]>(
      `product_variants?id=in.(${encodedVariantIds})&select=id,product_id,size,color,stock`,
    );
    if (variants.length === 0) return [] as CartProduct[];

    const productIds = Array.from(new Set(variants.map((variant) => variant.product_id)));
    const encodedProductIds = productIds.map((id) => encodeURIComponent(id)).join(",");
    const [products, images] = await Promise.all([
      supabaseRequest<DbProduct[]>(
        `products?id=in.(${encodedProductIds})&active=eq.true&status=eq.published&select=id,name,description,price,category,image,active,status,featured`,
      ),
      supabaseRequest<DbImage[]>(
        `product_images?product_id=in.(${encodedProductIds})&select=id,product_id,image_url,sort_order,is_primary&order=sort_order.asc`,
      ),
    ]);

    return products.map((product): CartProduct => {
      const productImages = images
        .filter((image) => image.product_id === product.id)
        .sort((a, b) => a.sort_order - b.sort_order);
      const gallery = productImages.map((image) => image.image_url);
      const primaryImage =
        productImages.find((image) => image.is_primary)?.image_url ??
        gallery[0] ??
        product.image ??
        "";
      return {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        category: product.category,
        image: primaryImage,
        gallery: gallery.length > 0 ? gallery : [primaryImage],
        sizes: [],
        colors: [],
        badge: product.featured ? "Featured" : undefined,
        description: product.description,
        variants: variants.filter((variant) => variant.product_id === product.id),
      };
    });
  });

const migrateLegacyCart = createServerFn({ method: "GET" })
  .validator((lines: LegacyCartLine[]) => lines)
  .handler(async ({ data: lines }) => {
    const legacy = lines.filter((line) => !line.variantId && line.productId && line.size && line.color);
    if (legacy.length === 0) {
      return lines
        .filter((line): line is LegacyCartLine & { variantId: string } => Boolean(line.variantId))
        .map((line) => ({ variantId: line.variantId, qty: clampQty(line.qty), cartItemId: line.cartItemId }));
    }

    const { supabaseRequest } = await import("@/lib/supabase.server");
    const productIds = Array.from(new Set(legacy.map((line) => line.productId)));
    const encodedProductIds = productIds.map((id) => encodeURIComponent(id)).join(",");
    const variants = await supabaseRequest<CartVariant[]>(
      `product_variants?product_id=in.(${encodedProductIds})&select=id,product_id,size,color,stock`,
    );

    const migrated: CartLine[] = [];
    for (const line of lines) {
      if (line.variantId) {
        migrated.push({ variantId: line.variantId, qty: clampQty(line.qty), cartItemId: line.cartItemId });
        continue;
      }
      const variant = variants.find(
        (candidate) =>
          candidate.product_id === line.productId &&
          candidate.size === line.size &&
          candidate.color === line.color,
      );
      if (variant) migrated.push({ variantId: variant.id, qty: clampQty(line.qty), cartItemId: line.cartItemId });
    }
    return migrated;
  });

type CartItem = CartLine & { product: CartProduct; variant: CartVariant; stock: number };
type CartContextValue = {
  lines: CartLine[];
  items: CartItem[];
  count: number;
  subtotal: number;
  loading: boolean;
  hasStockIssues: boolean;
  add: (line: CartLine) => Promise<void>;
  setQty: (index: number, qty: number) => void;
  remove: (index: number) => void;
  clear: () => void;
};

const GUEST_STORAGE_KEY = "wearo-cart";
const LEGACY_GUEST_STORAGE_KEY = "upthink-cart";
const MOCK_STORAGE_KEY = "wearo-mock-cart";
const REAL_EVENT = "wearo:cart:changed";
const MOCK_EVENT = "wearo:mock-cart:changed";
const CartContext = createContext<CartContextValue | null>(null);

function clampQty(qty: number) {
  return Math.max(1, Math.min(99, Number(qty) || 1));
}

function readLocalCart(key: string): LegacyCartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((line) => line && typeof line === "object")
      .map((line) => ({
        ...line,
        qty: clampQty(Number(line.qty)),
      }))
      .filter((line) => typeof line.variantId === "string" || (
        typeof line.productId === "string" &&
        typeof line.size === "string" &&
        typeof line.color === "string"
      ));
  } catch {
    return [];
  }
}

function mergeLines(primary: CartLine[], secondary: CartLine[]) {
  const merged = primary.map((line) => ({ ...line, qty: clampQty(line.qty) }));
  for (const incoming of secondary) {
    const index = merged.findIndex((line) => line.variantId === incoming.variantId);
    if (index === -1) {
      merged.push({ ...incoming, qty: clampQty(incoming.qty) });
    } else {
      merged[index] = {
        ...merged[index],
        qty: clampQty(Math.max(merged[index].qty, incoming.qty)),
        cartItemId: incoming.cartItemId ?? merged[index].cartItemId,
      };
    }
  }
  return merged;
}

function serverCartToLines(cart: ServerCart): CartLine[] {
  return cart.items.flatMap((item) =>
    item.variant
      ? [{ variantId: item.variant.id, qty: item.quantity, cartItemId: item.id }]
      : [],
  );
}

function storageKey(mockMode: boolean) {
  return mockMode ? MOCK_STORAGE_KEY : GUEST_STORAGE_KEY;
}

function eventName(mockMode: boolean) {
  return mockMode ? MOCK_EVENT : REAL_EVENT;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [mockMode, setMockMode] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sync = () => {
      setMockMode(isMockUserMode());
      setAuthenticated(Boolean(getCustomerSession()?.access_token));
    };
    sync();
    const onAuth = () => sync();
    window.addEventListener("wearo:mock-user:changed", sync);
    window.addEventListener("upthink:auth:login", onAuth);
    window.addEventListener("upthink:auth:logout", onAuth);
    window.addEventListener("upthink:auth:recovery", onAuth);
    return () => {
      window.removeEventListener("wearo:mock-user:changed", sync);
      window.removeEventListener("upthink:auth:login", onAuth);
      window.removeEventListener("upthink:auth:logout", onAuth);
      window.removeEventListener("upthink:auth:recovery", onAuth);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setHydrated(false);
      const rawLocal = mockMode
        ? readLocalCart(MOCK_STORAGE_KEY)
        : [...readLocalCart(GUEST_STORAGE_KEY), ...readLocalCart(LEGACY_GUEST_STORAGE_KEY)];

      try {
        const local = await migrateLegacyCart({ data: rawLocal });
        if (!cancelled) {
          setLines(local);
          setHydrated(true);
        }
      } catch (error) {
        console.warn("Không thể chuẩn hóa giỏ hàng cũ; tiếp tục với các dòng đã có variantId:", error);
        const fallback = rawLocal
          .filter((line): line is LegacyCartLine & { variantId: string } => Boolean(line.variantId))
          .map((line) => ({ variantId: line.variantId, qty: clampQty(line.qty), cartItemId: line.cartItemId }));
        if (!cancelled) {
          setLines(fallback);
          setHydrated(true);
        }
      }

      if (!authenticated || mockMode) return;
      const session = getCustomerSession();
      if (!session?.access_token) return;
      try {
        const serverCart = await getServerCart({ data: { accessToken: session.access_token } });
        const serverLines = serverCartToLines(serverCart);
        if (!cancelled) setLines((current) => mergeLines(current, serverLines));
      } catch (error) {
        console.warn("Không thể đồng bộ giỏ hàng server; tiếp tục dùng giỏ hàng cục bộ:", error);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [mockMode, authenticated]);

  useEffect(() => {
    if (!hydrated) return;
    const key = storageKey(mockMode);
    localStorage.setItem(key, JSON.stringify(lines));
    if (!mockMode) localStorage.removeItem(LEGACY_GUEST_STORAGE_KEY);
  }, [lines, hydrated, mockMode]);

  useEffect(() => {
    if (authenticated) return;
    const key = storageKey(mockMode);
    const sync = () =>
      setLines(
        mockMode
          ? readLocalCart(MOCK_STORAGE_KEY).filter((line): line is LegacyCartLine & { variantId: string } => Boolean(line.variantId)).map((line) => ({ variantId: line.variantId, qty: clampQty(line.qty), cartItemId: line.cartItemId }))
          : readLocalCart(GUEST_STORAGE_KEY).filter((line): line is LegacyCartLine & { variantId: string } => Boolean(line.variantId)).map((line) => ({ variantId: line.variantId, qty: clampQty(line.qty), cartItemId: line.cartItemId })),
      );
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || (!mockMode && event.key === LEGACY_GUEST_STORAGE_KEY)) sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(eventName(mockMode), sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(eventName(mockMode), sync);
    };
  }, [authenticated, mockMode]);

  useEffect(() => {
    let cancelled = false;
    async function loadProducts() {
      const variantIds = Array.from(new Set(lines.map((line) => line.variantId)));
      if (variantIds.length === 0) {
        setProducts([]);
        return;
      }
      setLoading(true);
      try {
        const result = await getCartProducts({ data: variantIds });
        if (!cancelled) setProducts(result);
      } catch (error) {
        console.error("Không thể tải sản phẩm trong giỏ hàng:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, [lines]);

  const items = useMemo<CartItem[]>(() =>
    lines
      .map((line) => {
        const product = products.find((item) =>
          item.variants.some((variant) => variant.id === line.variantId),
        );
        const variant = product?.variants.find((item) => item.id === line.variantId);
        if (!product || !variant) return null;
        return { ...line, product, variant, stock: variant.stock };
      })
      .filter((item): item is CartItem => item !== null),
  [lines, products]);

  const hasStockIssues = useMemo(
    () => items.length !== lines.length || items.some((item) => item.stock <= 0 || item.qty > item.stock),
    [items, lines],
  );
  const count = useMemo(() => lines.reduce((sum, line) => sum + line.qty, 0), [lines]);
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.qty, 0),
    [items],
  );

  async function add(line: CartLine) {
    if (!line.variantId) throw new Error("Không xác định được biến thể sản phẩm.");
    trackGrowthEvent({ name: GROWTH_EVENTS.ADD_TO_CART });
    const normalized: CartLine = { variantId: line.variantId, qty: clampQty(line.qty), cartItemId: line.cartItemId };

    setLines((current) => {
      const index = current.findIndex((item) => item.variantId === normalized.variantId);
      if (index === -1) return [...current, normalized];
      return current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, qty: clampQty(item.qty + normalized.qty) }
          : item,
      );
    });

    if (mockMode || !authenticated) return;
    const session = getCustomerSession();
    if (!session?.access_token) return;

    setLoading(true);
    try {
      const serverCart = await addServerCartItem({
        data: {
          accessToken: session.access_token,
          variantId: normalized.variantId,
          quantity: normalized.qty,
        },
      });
      const serverLines = serverCartToLines(serverCart);
      if (serverLines.length > 0) {
        setLines((current) => mergeLines(current, serverLines));
      }
    } catch (error) {
      console.warn("Không thể đồng bộ sản phẩm lên giỏ server; sản phẩm vẫn được giữ trong giỏ cục bộ:", error);
    } finally {
      setLoading(false);
    }
  }

  function setQty(index: number, qty: number) {
    const nextQty = clampQty(qty);
    const item = lines[index];
    if (!item) return;
    setLines((current) =>
      current.map((line, itemIndex) =>
        itemIndex === index ? { ...line, qty: nextQty } : line,
      ),
    );
    if (mockMode || !authenticated) return;
    const session = getCustomerSession();
    if (!session?.access_token) return;
    setLoading(true);
    const operation = item.cartItemId
      ? updateServerCartItem({
          data: {
            accessToken: session.access_token,
            itemId: item.cartItemId,
            quantity: nextQty,
          },
        })
      : addServerCartItem({
          data: {
            accessToken: session.access_token,
            variantId: item.variantId,
            quantity: nextQty,
          },
        });
    void operation
      .then((cart) => {
        const serverLines = serverCartToLines(cart);
        if (serverLines.length) setLines((current) => mergeLines(current, serverLines));
      })
      .catch((error) => console.warn("Không thể cập nhật giỏ server:", error))
      .finally(() => setLoading(false));
  }

  function remove(index: number) {
    const item = lines[index];
    if (!item) return;
    setLines((current) => current.filter((_, itemIndex) => itemIndex !== index));
    if (mockMode || !authenticated || !item.cartItemId) return;
    const session = getCustomerSession();
    if (!session?.access_token) return;
    setLoading(true);
    void removeServerCartItem({
      data: { accessToken: session.access_token, itemId: item.cartItemId },
    })
      .catch((error) => console.warn("Không thể xóa sản phẩm khỏi giỏ server:", error))
      .finally(() => setLoading(false));
  }

  function clear() {
    setLines([]);
    setProducts([]);
    if (mockMode || !authenticated) return;
    const session = getCustomerSession();
    if (!session?.access_token) return;
    setLoading(true);
    void clearServerCart({ data: { accessToken: session.access_token } })
      .catch((error) => console.warn("Không thể xóa giỏ server:", error))
      .finally(() => setLoading(false));
  }

  const value = useMemo<CartContextValue>(
    () => ({ lines, items, count, subtotal, loading, hasStockIssues, add, setQty, remove, clear }),
    [lines, items, count, subtotal, loading, hasStockIssues],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart phải được sử dụng bên trong CartProvider.");
  return context;
}
