import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Heart } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";
import type { Product } from "@/data/products";
import { formatPrice, useI18n } from "@/lib/i18n";
import { getCustomerSession } from "@/lib/auth";
import { toggleWishlist, isWishlisted } from "@/lib/wishlist";
import "@/styles/wearo-product-card-v1.scss";

export function ProductCard({ product }: { product: Product }) {
  const { language } = useI18n();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const tags = product.tags?.slice(0, 2) ?? [];
  const secondaryImage = product.gallery?.[1];
  const hasSale = typeof product.originalPrice === "number" && product.originalPrice > product.price;
  const specs = [product.sizes.filter(Boolean).join(" / "), product.colors.filter(Boolean).slice(0, 2).join(" / ")].filter(Boolean).join(" · ");

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
    try {
      const next = await toggleWishlist(product.id, userId);
      setSaved(next);
    } catch (error) {
      console.error("Wishlist update failed:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="fashion-product-card">
      <Link to="/product/$id" params={{ id: product.id }} className={`fashion-product-image${secondaryImage ? " has-hover-gallery" : ""}`}>
        <img src={product.image} alt={product.name} loading="lazy" decoding="async" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="fashion-product-image__primary" />
        {secondaryImage && <img src={secondaryImage} alt="" aria-hidden="true" loading="lazy" decoding="async" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="fashion-product-image__secondary" />}
        <div className="fashion-product-labels" aria-label="Product labels">
          {product.badge && <span className={`fashion-product-badge${product.badge.toLowerCase().includes("new arrival") ? " fashion-product-badge--new-arrival" : ""}`}>{product.badge}</span>}
          {product.fashionStyle && <span className={`fashion-product-style fashion-product-style--${product.fashionStyle.toLowerCase().replace(/\s+/g, "-")}`}>{product.fashionStyle}</span>}
          {hasSale && <span className="fashion-product-badge fashion-product-badge--sale">SALE</span>}
          {tags.map((tag) => <span key={tag} className="fashion-product-tag">{tag}</span>)}
        </div>
        <span className="fashion-product-arrow" aria-hidden="true"><ArrowUpRight size={16} /></span>
      </Link>
      <div className="fashion-product-meta">
        <div className="min-w-0">
          <p className="fashion-product-category">{product.category}</p>
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
    </article>
  );
}
