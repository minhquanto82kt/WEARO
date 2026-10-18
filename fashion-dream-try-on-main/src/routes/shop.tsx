import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { ArrowUpRight, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { CATEGORIES, type Product } from "@/data/products";
import { canonicalLink } from "@/lib/seo";
import "@/styles/wearo-shop-page.scss";

type DbCatalogProduct = { id: string; name: string; description: string; price: number; category: Product["category"]; image: string | null; featured: boolean; sizes: string[]; colors: string[]; gallery: string[]; total_stock: number; };

const getShopProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseRequest } = await import("@/lib/supabase.server");
  const rows = await supabaseRequest<DbCatalogProduct[]>("rpc/get_published_catalog", { method: "POST", body: "{}" });
  return rows.map((product): Product => { const gallery = product.gallery ?? []; const primaryImage = gallery[0] ?? product.image ?? ""; return { id: product.id, name: product.name, price: Number(product.price), category: product.category, image: primaryImage, gallery: gallery.length > 0 ? gallery : [primaryImage], sizes: product.sizes ?? [], colors: product.colors ?? [], badge: product.featured ? "Featured" : undefined, description: product.description }; });
});

export const Route = createFileRoute("/shop")({
  staleTime: 30_000,
  loader: () => getShopProducts(),
  head: () => ({ meta: [
    { title: "Cửa hàng WEARO — Casual, Modern & Unisex" },
    { name: "description", content: "Khám phá catalogue WEARO: thời trang casual, hiện đại và unisex cho nam và nữ. Chọn size, thử đồ ảo bằng AI và hoàn thiện outfit theo phong cách riêng." },
    { property: "og:title", content: "Cửa hàng WEARO — Casual, Modern & Unisex" },
    { property: "og:description", content: "WEARO / Modern everyday fashion for everyone — khám phá sản phẩm, AI Virtual Try-On và AI Personal Stylist." },
  ], links: [canonicalLink("/shop")] }),
  component: ShopPage,
});

const SORTS = [{ id: "featured", label: "Nổi bật" }, { id: "price-asc", label: "Giá thấp → cao" }, { id: "price-desc", label: "Giá cao → thấp" }] as const;

function ShopPage() {
  const products = Route.useLoaderData();
  const [cat, setCat] = useState<string>(() => { if (typeof window === "undefined") return "all"; return new URLSearchParams(window.location.search).get("category") ?? "all"; });
  const [sort, setSort] = useState<string>("featured");
  const [search, setSearch] = useState(() => { if (typeof window === "undefined") return ""; return new URLSearchParams(window.location.search).get("search") ?? ""; });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const banners = [
    {
      id: "virtual-try-on",
      eyebrow: "01 / WEARO AI STUDIO",
      title: "Thử outfit trên chính ảnh của bạn.",
      description: "Hình dung diện mạo mới với AI Virtual Try-On trước khi quyết định chọn mua.",
      image: "/images/banners/wearo-ai-virtual-try-on-banner.webp",
      alt: "WEARO AI Virtual Try-On — trải nghiệm thử outfit bằng AI",
      cta: "Trải nghiệm AI Virtual Try-On",
      href: "/ai",
    },
    {
      id: "ai-stylist",
      eyebrow: "02 / WEARO AI STYLIST",
      title: "Phối đồ theo gu riêng.",
      description: "Khám phá gợi ý outfit, phối màu và lựa chọn trang phục phù hợp với phong cách cá nhân.",
      image: "/images/banners/wearo-ai-stylist-banner.webp",
      alt: "WEARO AI Stylist — gợi ý phối đồ theo phong cách cá nhân",
      cta: "Khám phá AI Stylist",
      href: "/ai",
    },
  ];
  useEffect(() => {
    const timer = window.setInterval(() => setActiveBanner((current) => (current + 1) % banners.length), 6500);
    return () => window.clearInterval(timer);
  }, []);
  const normalizedSearch = search.trim().toLowerCase();
  const list = useMemo(() => [...products]
    .filter((product) => cat === "all" || product.category === cat)
    .filter((product) => {
      if (!normalizedSearch) return true;
      return [product.name, product.description, product.category].some((value) => value.toLowerCase().includes(normalizedSearch));
    })
    .sort((a, b) => sort === "price-asc" ? a.price - b.price : sort === "price-desc" ? b.price - a.price : 0),
  [products, cat, normalizedSearch, sort]);

  const updateUrl = (next: { category?: string; search?: string }) => {
    const params = new URLSearchParams(window.location.search);
    if (next.category !== undefined) {
      if (next.category === "all") params.delete("category");
      else params.set("category", next.category);
    }
    if (next.search !== undefined) {
      if (!next.search.trim()) params.delete("search");
      else params.set("search", next.search.trim());
    }
    window.history.replaceState({}, "", `/shop${params.toString() ? `?${params.toString()}` : ""}`);
  };
  const selectCategory = (category: string) => { setCat(category); updateUrl({ category }); };
  const clearSearch = () => { setSearch(""); updateUrl({ search: "" }); };
  const clearFilters = () => { setCat("all"); setSearch(""); setSort("featured"); window.history.replaceState({}, "", "/shop"); };
  const activeFilterCount = (cat !== "all" ? 1 : 0) + (normalizedSearch ? 1 : 0);
  const categoryName = CATEGORIES.find((item) => item.slug === cat)?.name;

  return (
    <div className="wearo-page wearo-shop-page min-h-screen">
      <SiteNav />
      <main className="wearo-shop-main mx-auto max-w-7xl px-5 pb-20 pt-28 sm:px-10 lg:px-16">
        <section className="wearo-shop-banner-slider" aria-label="Khám phá công nghệ AI của WEARO">
          <div className="wearo-shop-banner-track" aria-live="polite">
            {banners.map((banner, index) => (
              <article
                key={banner.id}
                className={`wearo-shop-banner-slide ${activeBanner === index ? "is-active" : ""}`}
                aria-hidden={activeBanner !== index}
              >
                <img className="wearo-shop-banner-image" src={banner.image} alt={banner.alt} />
                <div className="wearo-shop-banner-shade" />
                <div className="wearo-shop-banner-content">
                  <p className="wearo-shop-banner-eyebrow">{banner.eyebrow}</p>
                  <h1>{banner.title}</h1>
                  <p className="wearo-shop-banner-description">{banner.description}</p>
                  <Link to={banner.href} className="wearo-shop-banner-cta">
                    {banner.cta} <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <div className="wearo-shop-banner-controls">
            <div className="wearo-shop-banner-dots" role="group" aria-label="Chọn banner">
              {banners.map((banner, index) => (
                <button
                  key={banner.id}
                  type="button"
                  className={`wearo-shop-banner-dot ${activeBanner === index ? "is-active" : ""}`}
                  onClick={() => setActiveBanner(index)}
                  aria-label={`Hiển thị banner ${index + 1}: ${banner.id === "virtual-try-on" ? "AI Virtual Try-On" : "AI Stylist"}`}
                  aria-pressed={activeBanner === index}
                />
              ))}
            </div>
            <span className="wearo-shop-banner-count">0{activeBanner + 1} <span>/ 0{banners.length}</span></span>
            <div className="wearo-shop-banner-arrows">
              <button type="button" onClick={() => setActiveBanner((activeBanner + banners.length - 1) % banners.length)} aria-label="Banner trước"><ChevronLeft size={18} /></button>
              <button type="button" onClick={() => setActiveBanner((activeBanner + 1) % banners.length)} aria-label="Banner tiếp theo"><ChevronRight size={18} /></button>
            </div>
          </div>
        </section>

        <section className="wearo-shop-style-directory" aria-labelledby="wearo-style-directory-title">
          <div className="wearo-shop-editorial-heading">
            <div>
              <p className="wearo-shop-section-label">WEARO / FIND YOUR STYLE</p>
              <h2 id="wearo-style-directory-title">Mặc theo cách của bạn.</h2>
            </div>
            <p>Khám phá những hướng phong cách phù hợp với nhịp sống mỗi ngày.</p>
          </div>
          <div className="wearo-shop-style-grid">
            <Link to="/collections/$slug" params={{ slug: "casual" }} className="wearo-shop-style-card style-casual">
              <span className="wearo-shop-style-index">01 / EVERYDAY</span><span className="wearo-shop-style-name">CASUAL</span><span className="wearo-shop-style-description">Thoải mái, linh hoạt, dễ mặc mỗi ngày.</span><span className="wearo-shop-style-link">Khám phá <ArrowUpRight size={15} /></span>
            </Link>
            <Link to="/collections/$slug" params={{ slug: "basic" }} className="wearo-shop-style-card style-basic">
              <span className="wearo-shop-style-index">02 / ESSENTIALS</span><span className="wearo-shop-style-name">BASIC</span><span className="wearo-shop-style-description">Tối giản và dễ phối theo cách riêng.</span><span className="wearo-shop-style-link">Khám phá <ArrowUpRight size={15} /></span>
            </Link>
            <Link to="/collections/$slug" params={{ slug: "streetwear" }} className="wearo-shop-style-card style-streetwear">
              <span className="wearo-shop-style-index">03 / STREET CULTURE</span><span className="wearo-shop-style-name">STREETWEAR</span><span className="wearo-shop-style-description">Cá tính đường phố, nổi bật chất riêng.</span><span className="wearo-shop-style-link">Khám phá <ArrowUpRight size={15} /></span>
            </Link>
            <Link to="/collections/$slug" params={{ slug: "outing-style" }} className="wearo-shop-style-card style-outing">
              <span className="wearo-shop-style-index">04 / OUTSIDE LIFE</span><span className="wearo-shop-style-name">OUTING STYLE</span><span className="wearo-shop-style-description">Sẵn sàng đi chơi, dạo phố và hoạt động ngoài trời.</span><span className="wearo-shop-style-link">Khám phá <ArrowUpRight size={15} /></span>
            </Link>
          </div>
        </section>

        {products.some((product) => product.badge === "Featured") && (
          <section className="wearo-shop-featured" aria-labelledby="wearo-featured-title">
            <div className="wearo-shop-editorial-heading">
              <div>
                <p className="wearo-shop-section-label">WEARO / SELECTED PIECES</p>
                <h2 id="wearo-featured-title">Điểm nhấn của hôm nay.</h2>
              </div>
              <Link to="/shop" className="wearo-shop-text-link">Xem tất cả <ArrowUpRight size={15} /></Link>
            </div>
            <div className="wearo-shop-featured-grid">
              {products.filter((product) => product.badge === "Featured").slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </section>
        )}

        <section className="wearo-shop-outfit-story" aria-labelledby="wearo-outfit-story-title">
          <div className="wearo-shop-story-copy">
            <p className="wearo-shop-section-label">WEARO / STYLE NOTES 01</p>
            <h2 id="wearo-outfit-story-title">Một outfit tốt bắt đầu từ cảm giác của chính bạn.</h2>
            <p>Chọn những món đồ bạn thấy thoải mái, phối theo nhịp sống và để phong cách thể hiện cá tính riêng — không cần chạy theo khuôn mẫu.</p>
            <Link to="/collections/casual" className="wearo-shop-story-cta">Khám phá phong cách <ArrowUpRight size={16} /></Link>
          </div>
          <div className="wearo-shop-story-visual" role="img" aria-label="Khối hình minh họa biên tập thời trang WEARO">
            <span className="story-orbit story-orbit-one" /><span className="story-orbit story-orbit-two" />
            <span className="wearo-shop-story-mark">W.</span>
            <span className="wearo-shop-story-caption">EVERYDAY, YOUR WAY<br />WEARO STYLE JOURNAL</span>
          </div>
        </section>

        <section className="wearo-shop-brand-promise" aria-label="Cam kết trải nghiệm WEARO">
          <div><span className="wearo-shop-promise-number">01</span><h3>Khám phá theo phong cách</h3><p>Bốn hướng phong cách để bắt đầu tìm kiếm theo gu riêng.</p></div>
          <div><span className="wearo-shop-promise-number">02</span><h3>Thông tin sản phẩm rõ ràng</h3><p>Xem giá, hình ảnh, size và màu sắc trên từng sản phẩm.</p></div>
          <div><span className="wearo-shop-promise-number">03</span><h3>Khám phá AI Studio</h3><p>Tìm hiểu các trải nghiệm AI hiện có của WEARO.</p><Link to="/ai" className="wearo-shop-promise-link">Khám phá AI <ArrowUpRight size={14} /></Link></div>
        </section>

        <section className="wearo-shop-toolbar" aria-label="Tìm kiếm và lọc sản phẩm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="wearo-shop-search w-full sm:max-w-md" role="search">
                <Search size={17} className="ml-4 shrink-0 text-[#54728C]" aria-hidden="true" />
                <label htmlFor="shop-search" className="sr-only">Tìm kiếm sản phẩm</label>
                <input id="shop-search" value={search} onChange={(event) => { const value = event.target.value; setSearch(value); updateUrl({ search: value }); }} placeholder="Tìm theo tên, phong cách..." className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" />
                {search && <button type="button" onClick={clearSearch} className="mr-2 grid size-8 shrink-0 place-items-center text-[#54728C] hover:text-[#171717]" aria-label="Xóa tìm kiếm"><X size={15} /></button>}
              </div>
              <button type="button" onClick={() => setFiltersOpen((open) => !open)} className="wearo-shop-control shrink-0" aria-expanded={filtersOpen}>
                <SlidersHorizontal size={14} aria-hidden="true" /> Bộ lọc{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
              </button>
            </div>
            <p className="wearo-shop-count" aria-live="polite">{list.length} sản phẩm</p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="wearo-shop-sort-label">Sắp xếp theo</span>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1" role="group" aria-label="Sắp xếp sản phẩm">
              {SORTS.map((item) => <button key={item.id} type="button" onClick={() => setSort(item.id)} aria-pressed={sort === item.id} className={`wearo-shop-sort ${sort === item.id ? "is-active" : ""}`}>{item.label}</button>)}
            </div>
          </div>

          {filtersOpen && (
            <div className="wearo-shop-filter-panel">
              <p className="wearo-shop-sort-label mb-3">Danh mục sản phẩm</p>
              <div className="flex flex-wrap gap-2">
                {[{ slug: "all", name: "Tất cả" }, ...CATEGORIES].map((category) => <button key={category.slug} type="button" onClick={() => selectCategory(category.slug)} aria-pressed={cat === category.slug} className={`wearo-shop-category ${cat === category.slug ? "is-active" : ""}`}>{category.name}</button>)}
              </div>
              {activeFilterCount > 0 && <button type="button" onClick={clearFilters} className="mt-4 text-xs font-semibold text-[#54728C] underline underline-offset-4 hover:text-[#171717]">Xóa bộ lọc và tìm kiếm</button>}
            </div>
          )}
        </section>

        <section className="mt-9" aria-label="Danh sách sản phẩm">
          <div className="wearo-shop-results-head">
            <div>
              <p className="wearo-shop-section-label">WEARO / CURATED EVERYDAY</p>
              <h2 className="wearo-shop-results-title mt-2">{normalizedSearch ? `Kết quả cho “${search.trim()}”` : cat === "all" ? "Khám phá bộ sưu tập" : categoryName ?? "Bộ sưu tập"}</h2>
            </div>
            {(activeFilterCount > 0 || sort !== "featured") && <button type="button" onClick={clearFilters} className="text-xs font-semibold text-[#54728C] underline underline-offset-4 hover:text-[#171717]">Đặt lại</button>}
          </div>

          {list.length > 0 ? (
            <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
              {list.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="wearo-shop-empty" role="status">
              <p className="wearo-shop-section-label">COLLECTION / 0 ITEMS</p>
              <h2>Chưa tìm thấy sản phẩm phù hợp.</h2>
              <p>Thử từ khóa khác hoặc bỏ bộ lọc để xem lại toàn bộ bộ sưu tập WEARO.</p>
              <button type="button" onClick={clearFilters} className="wearo-shop-reset">Xem tất cả sản phẩm</button>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
