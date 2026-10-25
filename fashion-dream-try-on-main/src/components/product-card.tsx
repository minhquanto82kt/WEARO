import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ChevronRight, Heart } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";
import type { Product } from "@/data/products";
import { formatPrice, useI18n } from "@/lib/i18n";
import { getCustomerSession } from "@/lib/auth";
import { toggleWishlist, isWishlisted } from "@/lib/wishlist";
import "@/styles/wearo-product-card-v1.scss";

export function ProductCard({ product }: { product: Product }) {
  const { language } = useI18n();
  const [saved, setSaved] = useState(false);
  const [showSecondaryImage, setShowSecondaryImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wishlistMessage, setWishlistMessage] = useState("");
  const hasSale = typeof product.originalPrice === "number" && product.originalPrice > product.price;
  const secondaryImage = product.gallery?.[1];
  const normalizedLabel = (label: string) => label.trim().toLocaleLowerCase();
  const visibleLabels = [product.badge, product.fashionStyle]
    .filter((label): label is string => Boolean(label?.trim()));
  const seenLabels = new Set(visibleLabels.map(normalizedLabel));
  const tags = (product.tags ?? []).filter((tag) => {
    const normalized = normalizedLabel(tag);
    if (!normalized || seenLabels.has(normalized)) return false;
    seenLabels.add(normalized);
    return true;
  }).slice(0, 2);
  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "FREESIZE"];
  const sortedSizes = [...new Set(product.sizes.filter(Boolean))].sort((a, b) => {
    const aIndex = sizeOrder.indexOf(a.trim().toUpperCase());
    const bIndex = sizeOrder.indexOf(b.trim().toUpperCase());
    return (aIndex < 0 ? sizeOrder.length : aIndex) - (bIndex < 0 ? sizeOrder.length : bIndex) || a.localeCompare(b);
  });
  const categoryLabels: Record<string, string> = {
    tees: "Áo thun", pants: "Quần", outerwear: "Áo khoác", hoodies: "Áo hoodie",
    sunglass: "Kính râm", sunglasses: "Kính râm", cap: "Mũ", accessories: "Phụ kiện",
    shirts: "Áo sơ mi", tops: "Áo", dresses: "Đầm / Váy",
  };
  const colorLabels: Record<string, string> = {
    black: "Đen", white: "Trắng", ivory: "Trắng ngà", beige: "Be", cream: "Kem",
    charcoal: "Xám than", grey: "Xám", gray: "Xám", cement: "Xám xi măng",
    electric: "Xanh dương", blue: "Xanh dương", brown: "Nâu", red: "Đỏ",
    green: "Xanh lá", pink: "Hồng", navy: "Xanh navy",
    "#141414": "Đen", "#000000": "Đen", "#ffffff": "Trắng", "#fff": "Trắng",
    "#f5f5dc": "Be", "#f2ceae": "Kem",
  };
  const displayColor = (color: string) => {
    const value = color.trim();
    return colorLabels[value.toLowerCase()] ?? (/^#[0-9a-f]{3,8}$/i.test(value) ? "Màu tùy chỉnh" : value);
  };
  const specs = [
    sortedSizes.join(" / "),
    [...new Set(product.colors.filter(Boolean))].slice(0, 2).map(displayColor).join(" / "),
  ].filter(Boolean).join(" · ");
  const categoryLabel = categoryLabels[product.category.toLowerCase()] ?? product.category;
  const genderLabel = product.gender === "Male" ? "Nam" : product.gender === "Female" ? "Nữ" : product.gender === "Unisex" ? "Unisex" : "";

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
      setWishlistMessage(next
        ? (language === "vi" ? "Đã lưu vào danh sách yêu thích." : "Saved to your wishlist.")
        : (language === "vi" ? "Đã bỏ khỏi danh sách yêu thích." : "Removed from your wishlist."));
    } catch {
      setWishlistMessage(language === "vi"
        ? "Chưa thể cập nhật yêu thích. Vui lòng thử lại."
        : "Could not update your wishlist. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className={`fashion-product-card ${showSecondaryImage ? "is-gallery-secondary" : ""}`}>
      <Link to="/product/$id" params={{ id: product.id }} className={`fashion-product-image${secondaryImage ? " has-hover-gallery" : ""}`}>
        <img src={product.image} alt={product.name} loading="lazy" decoding="async" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="fashion-product-image__primary" />
        {secondaryImage && <img src={secondaryImage} alt="" aria-hidden="true" loading="lazy" decoding="async" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="fashion-product-image__secondary" />}
        <div className="fashion-product-labels" aria-label="Product labels">
          {product.badge && <span className={`fashion-product-badge${product.badge.toLowerCase().includes("new arrival") ? " fashion-product-badge--new-arrival" : ""}`}>{product.badge}</span>}
          {product.fashionStyle && <span className={`fashion-product-style fashion-product-style--${product.fashionStyle.toLowerCase().replace(/\s+/g, "-")}`}>{product.fashionStyle}</span>}
          {hasSale && <span className="fashion-product-badge fashion-product-badge--sale">SALE</span>}
          {tags.map((tag) => <span key={normalizedLabel(tag)} className="fashion-product-tag">{tag}</span>)}
        </div>
        <span className="fashion-product-arrow" aria-hidden="true"><ArrowUpRight size={16} /></span>
      </Link>
      {secondaryImage && <button type="button" className="fashion-product-mobile-gallery" onClick={() => setShowSecondaryImage((show) => !show)} aria-label={showSecondaryImage ? "Xem ảnh sản phẩm đầu tiên" : "Xem ảnh sản phẩm tiếp theo"} aria-pressed={showSecondaryImage}><ChevronRight size={15} aria-hidden="true" /><span>{showSecondaryImage ? "2 / 2" : "1 / 2"}</span></button>}
      <div className="fashion-product-meta">
        <div className="min-w-0">
          <p className="fashion-product-category">{categoryLabel}{genderLabel ? ` · ${genderLabel}` : ""}</p>
          <Link to="/product/$id" params={{ id: product.id }} className="fashion-product-title">{product.name}</Link>
          {product.shortDescription && <p className="mt-2 line-clamp-2 text-xs leading-5 text-silver">{product.shortDescription}</p>}
          {specs && <p className="fashion-product-spec mt-2">{specs}</p>}
        </div>
        <div className="fashion-product-price-wrap shrink-0">
          <span className="fashion-product-price">{formatPrice(product.price, language)}</span>
          {hasSale && <span className="fashion-product-price-old">{formatPrice(product.originalPrice!, language)}</span>}
          <button type="button" aria-label={saved ? (language === "vi" ? `Bỏ lưu ${product.name}` : `Remove ${product.name}`) : (language === "vi" ? `Lưu ${product.name}` : `Save ${product.name}`)} aria-pressed={saved} disabled={saving} className={`fashion-heart ${saved ? "is-saved" : ""}`} onClick={handleWishlist}>
            <Heart size={16} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      {wishlistMessage ? <p className="mt-2 text-xs leading-5 text-[#54728C]" role="status" aria-live="polite">{wishlistMessage}</p> : null}
    </article>
  );
}
