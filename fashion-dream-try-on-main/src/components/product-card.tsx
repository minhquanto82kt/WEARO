import { Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { ArrowUpRight, ChevronRight, Heart, LoaderCircle, ShoppingCart } from "lucide-react";
import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import type { Product } from "@/data/products";
import { formatPrice, useI18n } from "@/lib/i18n";
import { getCustomerSession } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { toggleWishlist, isWishlisted } from "@/lib/wishlist";
import "@/styles/wearo-product-card.scss";

type ProductVariant = { id: string; product_id: string; size: string; color: string; stock: number };

const getProductVariants = createServerFn({ method: "GET" })
  .validator((productId: string) => productId)
  .handler(async ({ data: productId }) => {
    const { supabaseRequest } = await import("@/lib/supabase.server");
    return supabaseRequest<ProductVariant[]>(
      `product_variants?product_id=eq.${encodeURIComponent(productId)}&select=id,product_id,size,color,stock&order=size.asc`,
    );
  });

export function ProductCard({ product }: { product: Product }) {
  const { language } = useI18n();
  const { add } = useCart();
  const [saved, setSaved] = useState(false);
  const [showSecondaryImage, setShowSecondaryImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wishlistMessage, setWishlistMessage] = useState("");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantsLoaded, setVariantsLoaded] = useState(false);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const hasSale = typeof product.originalPrice === "number" && product.originalPrice > product.price;
  const badgeLabel =
    product.badge?.toLowerCase() === "featured"
      ? language === "vi"
        ? "Nổi bật"
        : "Featured"
      : product.badge?.toLowerCase().includes("new arrival")
        ? language === "vi"
          ? "Mới"
          : product.badge
        : product.badge;
  const secondaryImage = product.gallery?.[1];
  const primarySrc = product.image?.trim() || "";
  const showFallback = !primarySrc || imageError;

  const normalizedLabel = (label: string) => label.trim().toLocaleLowerCase();
  const visibleLabels = [product.badge, product.fashionStyle].filter(
    (label): label is string => Boolean(label?.trim()),
  );
  const seenLabels = new Set(visibleLabels.map(normalizedLabel));
  const tags = (product.tags ?? [])
    .filter((tag) => {
      const normalized = normalizedLabel(tag);
      if (!normalized || seenLabels.has(normalized)) return false;
      seenLabels.add(normalized);
      return true;
    })
    .slice(0, 2);

  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "FREESIZE"];
  const sortedSizes = [...new Set(product.sizes.filter(Boolean))].sort((a, b) => {
    const aIndex = sizeOrder.indexOf(a.trim().toUpperCase());
    const bIndex = sizeOrder.indexOf(b.trim().toUpperCase());
    return (aIndex < 0 ? sizeOrder.length : aIndex) - (bIndex < 0 ? sizeOrder.length : bIndex) || a.localeCompare(b);
  });

  const categoryLabels: Record<string, string> = {
    tees: "Áo thun",
    pants: "Quần",
    outerwear: "Áo khoác",
    hoodies: "Áo hoodie",
    sunglass: "Kính râm",
    sunglasses: "Kính râm",
    cap: "Mũ",
    accessories: "Phụ kiện",
    shirts: "Áo sơ mi",
    tops: "Áo",
    dresses: "Đầm / Váy",
  };

  const colorLabels: Record<string, string> = {
    black: "Đen",
    white: "Trắng",
    ivory: "Trắng ngà",
    beige: "Be",
    cream: "Kem",
    charcoal: "Xám than",
    grey: "Xám",
    gray: "Xám",
    cement: "Xám xi măng",
    electric: "Xanh dương",
    blue: "Xanh dương",
    brown: "Nâu",
    red: "Đỏ",
    green: "Xanh lá",
    pink: "Hồng",
    navy: "Xanh navy",
    "#141414": "Đen",
    "#000000": "Đen",
    "#ffffff": "Trắng",
    "#fff": "Trắng",
    "#f5f5dc": "Be",
    "#f2ceae": "Kem",
  };

  const displayColor = (color: string) => {
    const value = color.trim();
    return colorLabels[value.toLowerCase()] ?? (/^#[0-9a-f]{3,8}$/i.test(value) ? "Màu tùy chỉnh" : value);
  };

  const specs = sortedSizes.join(" / ");
  const productColors = [...new Set(product.colors.filter(Boolean))].slice(0, 5);

  const colorHex = (color: string) => {
    const value = color.trim().toLowerCase();
    const known: Record<string, string> = {
      black: "#222222",
      white: "#F8F7F2",
      ivory: "#F1EBDD",
      beige: "#CDB99B",
      cream: "#E9DDC9",
      charcoal: "#424443",
      grey: "#929493",
      gray: "#929493",
      cement: "#A6A7A2",
      electric: "#4C83D1",
      blue: "#729FC4",
      brown: "#735043",
      red: "#B83D42",
      green: "#527A5B",
      pink: "#D9A0B1",
      navy: "#263A58",
      moss: "#69745A",
      "#141414": "#141414",
      "#000000": "#000000",
      "#ffffff": "#FFFFFF",
      "#fff": "#FFFFFF",
      "#f5f5dc": "#F5F5DC",
      "#f2ceae": "#F2CEAE",
    };
    if (/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) return value;
    return known[value] ?? "#D9BBA9";
  };

  const selectedVariant = variants.find(
    (variant) => variant.size === selectedSize && variant.color === selectedColor,
  );
  const sizeOptions = [...new Set(variants.map((variant) => variant.size))];
  const colorOptions = [...new Set(variants.map((variant) => variant.color))];
  const categoryLabel = categoryLabels[product.category.toLowerCase()] ?? product.category;
  const genderLabel =
    product.gender === "Male"
      ? "Nam"
      : product.gender === "Female"
        ? "Nữ"
        : product.gender === "Unisex"
          ? "Unisex"
          : "";

  useEffect(() => {
    let mounted = true;
    const sync = async () => {
      const userId = getCustomerSession()?.user?.id;
      if (!userId) {
        if (mounted) setSaved(false);
        return;
      }
      try {
        const value = await isWishlisted(product.id, userId);
        if (mounted) setSaved(value);
      } catch {
        if (mounted) setSaved(false);
      }
    };
    void sync();
    const onChanged = () => void sync();
    window.addEventListener("wearo:wishlist:changed", onChanged);
    window.addEventListener("upthink:auth:login", onChanged);
    window.addEventListener("upthink:auth:logout", onChanged);
    return () => {
      mounted = false;
      window.removeEventListener("wearo:wishlist:changed", onChanged);
      window.removeEventListener("upthink:auth:login", onChanged);
      window.removeEventListener("upthink:auth:logout", onChanged);
    };
  }, [product.id]);

  // Reset image state when product changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [product.id, product.image]);

  const handleQuickAddOpen = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setQuickAddOpen((open) => !open);
    if (quickAddOpen || variantsLoaded || variantsLoading) return;
    setVariantsLoading(true);
    try {
      const result = await getProductVariants({ data: product.id });
      setVariants(result);
      setVariantsLoaded(true);
      const available = result.find((variant) => variant.stock > 0) ?? result[0];
      setSelectedSize(available?.size ?? "");
      setSelectedColor(available?.color ?? "");
      if (result.length === 0) {
        toast.error(
          language === "vi"
            ? "Sản phẩm chưa có biến thể size/màu để thêm vào giỏ."
            : "This product has no size/color variants available.",
        );
      }
    } catch {
      toast.error(
        language === "vi"
          ? "Không tải được size và màu sản phẩm. Vui lòng thử lại."
          : "Could not load product variants. Please try again.",
      );
      setQuickAddOpen(false);
    } finally {
      setVariantsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || selectedVariant.stock <= 0 || addingToCart) return;
    setAddingToCart(true);
    try {
      await add({ variantId: selectedVariant.id, qty: 1 });
      toast.success(
        language === "vi"
          ? `Đã thêm ${product.name} (${selectedVariant.size} / ${displayColor(selectedVariant.color)}) vào giỏ.`
          : `${product.name} added to your cart.`,
      );
      setQuickAddOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : language === "vi"
            ? "Không thể thêm sản phẩm vào giỏ."
            : "Could not add this product to your cart.",
      );
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const userId = getCustomerSession()?.user?.id;
    if (!userId) {
      window.location.href = `/account?returnTo=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (saving) return;
    setSaving(true);
    setWishlistMessage("");
    try {
      const next = await toggleWishlist(product.id, userId);
      setSaved(next);
      setWishlistMessage(
        next
          ? language === "vi"
            ? "Đã lưu vào danh sách yêu thích."
            : "Saved to your wishlist."
          : language === "vi"
            ? "Đã bỏ khỏi danh sách yêu thích."
            : "Removed from your wishlist.",
      );
    } catch {
      setWishlistMessage(
        language === "vi"
          ? "Chưa thể cập nhật yêu thích. Vui lòng thử lại."
          : "Could not update your wishlist. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className={`fashion-product-card ${showSecondaryImage ? "is-gallery-secondary" : ""}`}>
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className={`fashion-product-image${secondaryImage && !showFallback ? " has-hover-gallery" : ""}${showFallback ? " is-fallback" : ""}`}
      >
        {/* Skeleton while loading */}
        {!imageLoaded && !showFallback && (
          <div className="fashion-product-image__skeleton" aria-hidden="true" />
        )}

        {/* Primary image */}
        {!showFallback && (
          <img
            src={primarySrc}
            alt={product.name}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`fashion-product-image__primary${imageLoaded ? " is-loaded" : ""}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
          />
        )}

        {/* Branded fallback when image is missing or failed */}
        {showFallback && (
          <div className="fashion-product-image__fallback" aria-hidden="true">
            <span className="fashion-product-image__fallback-mark">W</span>
            <span className="fashion-product-image__fallback-text">{product.name}</span>
          </div>
        )}

        {/* Secondary image (hover gallery) */}
        {secondaryImage && !showFallback && (
          <img
            src={secondaryImage}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="fashion-product-image__secondary"
          />
        )}

        <div className="fashion-product-labels" aria-label="Product labels">
          {badgeLabel && (
            <span
              className={`fashion-product-badge${product.badge?.toLowerCase().includes("new arrival") ? " fashion-product-badge--new-arrival" : ""}`}
            >
              {badgeLabel}
            </span>
          )}
          {product.fashionStyle && (
            <span
              className={`fashion-product-style fashion-product-style--${product.fashionStyle.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {product.fashionStyle}
            </span>
          )}
          {hasSale && <span className="fashion-product-badge fashion-product-badge--sale">SALE</span>}
          {tags.map((tag) => (
            <span key={normalizedLabel(tag)} className="fashion-product-tag">
              {tag}
            </span>
          ))}
        </div>
        <span className="fashion-product-arrow" aria-hidden="true">
          <ArrowUpRight size={16} />
        </span>
      </Link>

      {secondaryImage && !showFallback && (
        <button
          type="button"
          className="fashion-product-mobile-gallery"
          onClick={() => setShowSecondaryImage((show) => !show)}
          aria-label={
            showSecondaryImage
              ? language === "vi"
                ? "Xem ảnh sản phẩm đầu tiên"
                : "View first product image"
              : language === "vi"
                ? "Xem ảnh sản phẩm tiếp theo"
                : "View next product image"
          }
          aria-pressed={showSecondaryImage}
        >
          <ChevronRight size={15} aria-hidden="true" />
          <span>{showSecondaryImage ? "2 / 2" : "1 / 2"}</span>
        </button>
      )}

      <div className="fashion-product-meta">
        <div className="min-w-0">
          <p className="fashion-product-category">
            {categoryLabel}
            {genderLabel ? ` · ${genderLabel}` : ""}
          </p>
          <Link to="/product/$id" params={{ id: product.id }} className="fashion-product-title">
            {product.name}
          </Link>
          {product.shortDescription && (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-silver">{product.shortDescription}</p>
          )}
          {specs && <p className="fashion-product-spec mt-2">{specs}</p>}
          {productColors.length > 0 && (
            <div
              className="fashion-product-colors"
              aria-label={language === "vi" ? "Màu sắc sản phẩm" : "Product colors"}
            >
              <span className="fashion-product-colors__label">
                {language === "vi" ? "MÀU" : "COLORS"}
              </span>
              <div className="fashion-product-swatches">
                {productColors.map((color) => (
                  <span
                    key={color}
                    className="fashion-product-swatch"
                    style={{ "--swatch-color": colorHex(color) } as CSSProperties}
                    title={displayColor(color)}
                    aria-label={displayColor(color)}
                  />
                ))}
                {product.colors.length > productColors.length && (
                  <span className="fashion-product-colors__more">
                    +{product.colors.length - productColors.length}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="fashion-product-price-wrap shrink-0">
          <span className="fashion-product-price">{formatPrice(product.price, language)}</span>
          {hasSale && (
            <span className="fashion-product-price-old">
              {formatPrice(product.originalPrice!, language)}
            </span>
          )}
          <div className="fashion-product-actions">
            <button
              type="button"
              aria-label={
                language === "vi"
                  ? `Thêm ${product.name} vào giỏ`
                  : `Add ${product.name} to cart`
              }
              aria-expanded={quickAddOpen}
              aria-controls={`quick-add-${product.id}`}
              disabled={variantsLoading || addingToCart}
              className={`fashion-cart-icon${quickAddOpen ? " is-active" : ""}`}
              onClick={handleQuickAddOpen}
            >
              {variantsLoading ? (
                <LoaderCircle size={18} className="fashion-icon-spin" />
              ) : (
                <ShoppingCart size={18} />
              )}
            </button>
            <button
              type="button"
              aria-label={
                saved
                  ? language === "vi"
                    ? `Bỏ lưu ${product.name}`
                    : `Remove ${product.name}`
                  : language === "vi"
                    ? `Lưu ${product.name}`
                    : `Save ${product.name}`
              }
              aria-pressed={saved}
              disabled={saving}
              className={`fashion-heart ${saved ? "is-saved" : ""}`}
              onClick={handleWishlist}
            >
              <Heart size={18} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>

      {quickAddOpen && (
        <section
          id={`quick-add-${product.id}`}
          className="fashion-quick-add"
          aria-label={
            language === "vi"
              ? `Chọn biến thể ${product.name}`
              : `Choose ${product.name} options`
          }
        >
          {variantsLoading ? (
            <p className="fashion-quick-add__status">
              <LoaderCircle size={15} className="fashion-icon-spin" />{" "}
              {language === "vi" ? "Đang tải size và màu..." : "Loading sizes and colors..."}
            </p>
          ) : variants.length > 0 ? (
            <>
              <div className="fashion-quick-add__group">
                <span className="fashion-quick-add__label">
                  {language === "vi" ? "CHỌN SIZE" : "SELECT SIZE"}
                </span>
                <div className="fashion-quick-add__sizes">
                  {sizeOptions.map((size) => {
                    const available = variants.some(
                      (variant) => variant.size === size && variant.stock > 0,
                    );
                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={!available}
                        aria-pressed={selectedSize === size}
                        className={`fashion-quick-add__size${selectedSize === size ? " is-selected" : ""}`}
                        onClick={() => {
                          setSelectedSize(size);
                          const matching =
                            variants.find(
                              (variant) =>
                                variant.size === size &&
                                variant.color === selectedColor &&
                                variant.stock > 0,
                            ) ??
                            variants.find(
                              (variant) => variant.size === size && variant.stock > 0,
                            );
                          if (matching) setSelectedColor(matching.color);
                        }}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="fashion-quick-add__group">
                <span className="fashion-quick-add__label">
                  {language === "vi" ? "CHỌN MÀU" : "SELECT COLOR"}
                </span>
                <div className="fashion-quick-add__colors">
                  {colorOptions.map((color) => {
                    const available = variants.some(
                      (variant) => variant.color === color && variant.stock > 0,
                    );
                    return (
                      <button
                        key={color}
                        type="button"
                        disabled={!available}
                        aria-label={displayColor(color)}
                        aria-pressed={selectedColor === color}
                        title={displayColor(color)}
                        className={`fashion-quick-add__color${selectedColor === color ? " is-selected" : ""}`}
                        style={{ "--swatch-color": colorHex(color) } as CSSProperties}
                        onClick={() => {
                          setSelectedColor(color);
                          const matching =
                            variants.find(
                              (variant) =>
                                variant.color === color &&
                                variant.size === selectedSize &&
                                variant.stock > 0,
                            ) ??
                            variants.find(
                              (variant) => variant.color === color && variant.stock > 0,
                            );
                          if (matching) setSelectedSize(matching.size);
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="fashion-quick-add__footer">
                <span
                  className={`fashion-quick-add__stock${selectedVariant && selectedVariant.stock > 0 ? "" : " is-unavailable"}`}
                >
                  {selectedVariant && selectedVariant.stock > 0
                    ? language === "vi"
                      ? `Còn ${selectedVariant.stock}`
                      : `${selectedVariant.stock} in stock`
                    : language === "vi"
                      ? "Hết hàng"
                      : "Out of stock"}
                </span>
                <button
                  type="button"
                  disabled={!selectedVariant || selectedVariant.stock <= 0 || addingToCart}
                  className="fashion-quick-add__submit"
                  onClick={() => void handleAddToCart()}
                >
                  {addingToCart ? (
                    <LoaderCircle size={16} className="fashion-icon-spin" />
                  ) : (
                    <>
                      <ShoppingCart size={16} />
                      <span>{language === "vi" ? "Thêm vào giỏ" : "Add to cart"}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <p className="fashion-quick-add__status">
              {language === "vi"
                ? "Sản phẩm chưa có biến thể khả dụng."
                : "No variants are available for this product."}
            </p>
          )}
        </section>
      )}

      {wishlistMessage ? (
        <p className="mt-2 text-xs leading-5 text-[#54728C]" role="status" aria-live="polite">
          {wishlistMessage}
        </p>
      ) : null}
    </article>
  );
}
