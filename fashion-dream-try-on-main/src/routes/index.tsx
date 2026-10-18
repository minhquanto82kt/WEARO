import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { WandSparkles } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { type Product } from "@/data/products";
import { readPublishedSiteContent, type SiteContentFields } from "@/lib/site-content";
import { canonicalLink } from "@/lib/seo";
import { listPublishedJournalArticles, type JournalArticle } from "@/lib/journal.functions";

const REFERENCE_IMAGES = {
  hero: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
  journal1: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
  journal2: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop",
  journal3: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=800&auto=format&fit=crop",
};

const DEFAULT_CONTENT: SiteContentFields = {
  announcement_enabled: false,
  announcement_text: "",
  hero_eyebrow: "WEARO / IUH / SAIGON — 2026",
  hero_title: "WEAR IT YOUR WAY.",
  hero_description: "WEARO kết hợp thời trang, AI Virtual Try-On và AI Personal Stylist để bạn hình dung đúng outfit trên chính mình, chọn trọn bộ và mặc theo cách riêng.",
  hero_cta_label: "Khám phá cửa hàng",
  hero_cta_url: "/shop",
  social_title: "WEARO — Mặc theo cách của riêng bạn",
  social_description: "Thử đồ ảo AI trên ảnh thật và nhận gợi ý outfit trọn bộ theo vóc dáng, bối cảnh và gu cá nhân.",
  favicon_url: null,
  social_image_url: REFERENCE_IMAGES.hero,
};

type DbHomeProduct = { id: string; name: string; description: string; price: number; category: Product["category"]; image: string | null; featured: boolean; sizes: string[]; colors: string[]; gallery: string[]; total_stock: number; };

const getHomeProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseRequest } = await import("@/lib/supabase.server");
  const rows = await supabaseRequest<DbHomeProduct[]>("rpc/get_published_catalog", { method: "POST", body: "{}" });
  return rows.map((product): Product => {
    const gallery = product.gallery ?? [];
    const primaryImage = gallery[0] ?? product.image ?? "";
    const categoryTags = product.category === "hoodies" || product.category === "tees" || product.category === "outerwear"
      ? ["Streetwear", "Casual", "Unisex"]
      : ["Casual", "Unisex"];
    return {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      category: product.category,
      image: primaryImage,
      gallery: gallery.length > 0 ? gallery : [primaryImage],
      sizes: product.sizes ?? [],
      colors: product.colors ?? [],
      badge: product.featured ? "Featured" : undefined,
      tags: categoryTags,
      description: product.description,
    };
  });
});

const CATEGORIES = [
  { slug: "all", label: "Tất cả" },
  { slug: "streetwear", label: "Streetwear" },
  { slug: "casual", label: "Casual" },
  { slug: "unisex", label: "Unisex" },
  { slug: "new", label: "Hàng mới về" },
] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WEARO — Mặc theo cách của riêng bạn" },
      { name: "description", content: DEFAULT_CONTENT.social_description },
      { property: "og:title", content: DEFAULT_CONTENT.social_title },
      { property: "og:description", content: DEFAULT_CONTENT.social_description },
      { property: "og:image", content: DEFAULT_CONTENT.social_image_url ?? REFERENCE_IMAGES.hero },
      { name: "twitter:image", content: DEFAULT_CONTENT.social_image_url ?? REFERENCE_IMAGES.hero },
    ],
    links: [canonicalLink("/")],
  }),
  component: Index,
});

function applyContentMeta(content: SiteContentFields) {
  if (typeof document === "undefined") return;
  if (content.social_title) document.title = content.social_title;
  const setMeta = (selector: string, attribute: string, value: string) => {
    let node = document.head.querySelector(selector) as HTMLMetaElement | null;
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute(attribute, selector.includes("property=") ? selector.match(/property=\"([^\"]+)/)?.[1] ?? "" : selector.match(/name=\"([^\"]+)/)?.[1] ?? "");
      document.head.appendChild(node);
    }
    node.content = value;
  };
  if (content.social_description) setMeta('meta[name="description"]', "name", content.social_description);
  if (content.social_title) setMeta('meta[property="og:title"]', "property", content.social_title);
  if (content.social_description) setMeta('meta[property="og:description"]', "property", content.social_description);
  if (content.social_image_url) setMeta('meta[property="og:image"]', "property", content.social_image_url);
  if (content.social_image_url) setMeta('meta[name="twitter:image"]', "name", content.social_image_url);
  if (content.favicon_url) {
    let icon = document.head.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    if (!icon) {
      icon = document.createElement("link");
      icon.rel = "icon";
      document.head.appendChild(icon);
    }
    icon.href = content.favicon_url;
  }
}

function Index() {
  const [content, setContent] = useState<SiteContentFields>(DEFAULT_CONTENT);
  const [journal, setJournal] = useState<JournalArticle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]["slug"]>("all");
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % 4);
    }, 5000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    void getHomeProducts()
      .then((publishedProducts) => {
        if (mounted) setProducts(publishedProducts);
      })
      .catch(() => {
        if (mounted) setProducts([]);
      })
      .finally(() => {
        if (mounted) setProductsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    void listPublishedJournalArticles()
      .then((articles) => {
        if (mounted) setJournal(articles.slice(0, 3));
      })
      .catch(() => {
        // Keep the homepage usable if the journal service is unavailable.
        if (mounted) setJournal([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const params = new URLSearchParams(window.location.search);
    const previewRaw = params.get("content_data");
    if (params.get("content_preview") === "1" && previewRaw) {
      try {
        const preview = JSON.parse(previewRaw) as SiteContentFields;
        if (mounted) {
          const next = { ...DEFAULT_CONTENT, ...preview };
          setContent(next);
          applyContentMeta(next);
        }
      } catch {
        // Keep the local fallback.
      }
    } else {
      void readPublishedSiteContent().then((published) => {
        if (mounted && published) {
          const next = { ...DEFAULT_CONTENT, ...published };
          setContent(next);
          applyContentMeta(next);
        }
      }).catch(() => {
        // Static fallback keeps the landing page available.
      });
    }
    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = products.filter((product) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "streetwear") return product.tags?.some((tag) => /street|utility/i.test(tag)) ?? false;
    if (activeCategory === "casual") return product.tags?.some((tag) => /casual|everyday/i.test(tag)) ?? false;
    if (activeCategory === "unisex") return product.tags?.some((tag) => /unisex/i.test(tag)) ?? false;
    return Boolean(product.badge?.toLowerCase().includes("new"));
  });

  return (
    <div className="wearo-reference-page">
      {content.announcement_enabled && content.announcement_text && <div className="wearo-reference-announcement">{content.announcement_text}</div>}
      <SiteNav />

      <section className="wearo-reference-hero wearo-home-hero" aria-label="WEARO — Wear your own way">
        <div className="wearo-home-hero-desktop">
          <div className="wearo-home-hero-slider" aria-label="Bộ sưu tập hình ảnh WEARO">
            {[1, 2, 3, 4].map((slide, index) => (
              <img
                key={slide}
                className={`wearo-home-hero-banner${activeHeroSlide === index ? " is-active" : ""}`}
                src={`/images/hero-slider/wearo-banner-variation-${slide}.webp`}
                alt={`WEARO — Bộ sưu tập thời trang unisex, hình ${slide} trên 4`}
                fetchPriority={index === 0 ? "high" : "auto"}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                aria-hidden={activeHeroSlide !== index}
              />
            ))}
            <Link
              to="/shop"
              className="wearo-home-hero-desktop-cta"
              aria-label="Khám phá phong cách WEARO"
            />
            <button
              type="button"
              className="wearo-home-hero-arrow wearo-home-hero-arrow--prev"
              onClick={() => setActiveHeroSlide((current) => (current + 3) % 4)}
              aria-label="Ảnh trước"
            >‹</button>
            <button
              type="button"
              className="wearo-home-hero-arrow wearo-home-hero-arrow--next"
              onClick={() => setActiveHeroSlide((current) => (current + 1) % 4)}
              aria-label="Ảnh tiếp theo"
            >›</button>
            <div className="wearo-home-hero-dots" aria-label="Chọn ảnh banner">
              {[0, 1, 2, 3].map((slide) => (
                <button
                  key={slide}
                  type="button"
                  className={activeHeroSlide === slide ? "is-active" : ""}
                  onClick={() => setActiveHeroSlide(slide)}
                  aria-label={`Chuyển đến ảnh ${slide + 1}`}
                  aria-current={activeHeroSlide === slide ? "true" : undefined}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="wearo-home-hero-mobile">
          <div className="wearo-home-hero-mobile-brand" aria-label="WEARO">
            <span className="wearo-home-hero-mobile-mark" aria-hidden="true">W</span>
            <span>WEARO</span>
          </div>
          <p className="wearo-home-hero-mobile-eyebrow">UNISEX FASHION · PERSONAL STYLE</p>
          <h1>WEAR YOUR<br /><span>OWN WAY.</span></h1>
          <p className="wearo-home-hero-mobile-description">
            Thời trang không có giới hạn. Chỉ có phong cách của bạn.
          </p>
          <div className="wearo-home-hero-mobile-features">
            <span>AI Virtual Try-On</span>
            <span>AI Personal Stylist</span>
            <span>Thiết kế độc quyền</span>
          </div>
          <Link to="/shop" className="wearo-home-hero-mobile-cta">
            Khám phá phong cách <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section id="ai-studio" className="wearo-reference-ai-banner">
        <div className="wearo-reference-container">
          <div className="wearo-reference-ai-panel">
            <div className="wearo-reference-ai-grid">
              <div>
                <span className="wearo-reference-section-label">ĐỘT PHÁ TRẢI NGHIỆM</span>
                <h2>WEARO AI STUDIO 2.0</h2>
                <p>Không còn e ngại mua hàng online không hợp form hay tốn thời gian suy nghĩ cách phối đồ. Hãy để AI Virtual Try-On giúp bạn thử trang phục lên chính ảnh chụp của mình chỉ trong vài giây.</p>
                <div className="wearo-reference-actions">
                  <Link to="/ai" className="wearo-reference-btn wearo-reference-btn--accent"><WandSparkles size={14} /> Tải Ảnh Cá Nhân Thử Đồ</Link>
                  <Link to="/ai" className="wearo-reference-btn wearo-reference-btn--dark">AI Personal Stylist</Link>
                </div>
              </div>
              <div className="wearo-reference-ai-features">
                <article><strong>◈</strong><h3>Virtual Try-On 2D</h3><p>Mô phỏng chân thực dáng áo, phom quần trực tiếp trên cơ thể bạn.</p></article>
                <article><strong>✦</strong><h3>Full-Set Outfits</h3><p>Gợi ý phối sẵn trọn bộ chuẩn phong cách Streetwear & Casual.</p></article>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main id="storefront" className="wearo-reference-container wearo-reference-storefront">
        <div className="wearo-reference-storefront-head">
          <div><span className="wearo-reference-section-label">WEARO COLLECTION</span><h2>CỬA HÀNG SẢN PHẨM</h2><p>Khám phá các thiết kế Streetwear & Unisex mới nhất hỗ trợ AI Try-On</p></div>
          <div className="wearo-reference-category-tabs" aria-label="Danh mục sản phẩm">
            {CATEGORIES.map((category) => <button key={category.slug} type="button" className={activeCategory === category.slug ? "is-active" : ""} onClick={() => setActiveCategory(category.slug)}>{category.label}</button>)}
          </div>
        </div>
        <div className="wearo-reference-product-grid">{productsLoading ? <div className="wearo-reference-empty-state" role="status"><p>Đang tải sản phẩm...</p></div> : filteredProducts.length > 0 ? filteredProducts.map((product) => <ProductCard key={product.id} product={product} />) : <div className="wearo-reference-empty-state" role="status"><p className="wearo-reference-section-label">COLLECTION / 0 ITEMS</p><h3>Chưa có sản phẩm trong danh mục này.</h3><p>WEARO đang cập nhật bộ sưu tập. Bạn có thể xem tất cả sản phẩm hoặc quay lại sau.</p><button type="button" onClick={() => setActiveCategory("all")}>Xem tất cả sản phẩm</button></div>}</div>
        <div className="wearo-reference-view-all"><Link to="/shop">XEM TẤT CẢ SẢN PHẨM</Link></div>
      </main>

      <section id="journal" className="wearo-reference-journal">
        <div className="wearo-reference-container">
          <div className="wearo-reference-journal-head"><div><span className="wearo-reference-section-label">INSIGHTS & STYLES</span><h2>WEARO JOURNAL</h2></div><Link to="/journal">ĐỌC THÊM →</Link></div>
          <div className="wearo-reference-journal-grid">{journal.map((article) => <article key={article.id}><Link to="/journal/$slug" params={{ slug: article.slug }} className="wearo-reference-journal-image" aria-label={article.title}>{article.image_url ? <img src={article.image_url} alt={article.title} loading="lazy" /> : <span>WEARO / JOURNAL</span>}<div className="wearo-reference-journal-overlay"><span>{article.category}</span><h3>{article.title}</h3><p>{article.excerpt}</p><span className="wearo-reference-journal-read">ĐỌC BÀI <span aria-hidden="true">↗</span></span></div></Link></article>)}</div>
        </div>
      </section>

      <section id="about" className="wearo-reference-about">
        <div className="wearo-reference-container"><h2>VỀ THƯƠNG HIỆU WEARO</h2><p>WEARO ra đời với sứ mệnh mang đến giải pháp thời trang casual, streetwear & unisex hiện đại tiên phong tại Việt Nam. Bằng việc kết hợp tư duy thiết kế tối giản và sức mạnh của công nghệ AI, WEARO giúp bạn tự tin làm chủ phong cách cá nhân mọi lúc, mọi nơi.</p></div>
      </section>

      <SiteFooter />
    </div>
  );
}
