import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { ArrowUpRight, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
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
        <section className="wearo-shop-hero">
          <div>
            <p className="wearo-shop-kicker">WEARO / SHOP / COLLECTION 2026</p>
            <h1 className="wearo-shop-title">
              {normalizedSearch ? <>Tìm thấy <span className="wearo-shop-title-accent">phong cách.</span></> : cat === "all" ? <>Mặc theo <span className="wearo-shop-title-accent">cách riêng.</span></> : <>{categoryName ?? "Bộ sưu tập"} <span className="wearo-shop-title-accent">WEARO.</span></>}
            </h1>
            <p className="wearo-shop-description">
              Thời trang everyday hiện đại, dễ phối và dành cho mọi giới tính. Tìm món đồ phù hợp với bạn — sau đó khám phá cách AI giúp bạn hình dung outfit trước khi chọn mua.
            </p>
          </div>
          <aside className="wearo-shop-ai-card">
            <span className="wearo-shop-ai-card-label">01 / WEARO AI STUDIO</span>
            <h2>Thử outfit trên chính ảnh của bạn.</h2>
            <p>Khám phá trải nghiệm AI Virtual Try-On và nhận gợi ý phối đồ theo phong cách cá nhân.</p>
            <Link to="/ai" className="wearo-shop-ai-link">Khám phá AI Studio <ArrowUpRight size={15} aria-hidden="true" /></Link>
          </aside>
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
