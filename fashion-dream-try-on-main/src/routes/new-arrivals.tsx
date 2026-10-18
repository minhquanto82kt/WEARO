import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { ArrowUpRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { type Product } from "@/data/products";
import { canonicalLink } from "@/lib/seo";
import "@/styles/wearo-new-arrivals.scss";

type DbCatalogProduct = {
  id: string; name: string; description: string; price: number;
  category: Product["category"]; image: string | null; featured: boolean;
  sizes: string[]; colors: string[]; gallery: string[]; total_stock: number;
};

const getNewArrivals = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseRequest } = await import("@/lib/supabase.server");
  // This RPC filters to active, published products and orders them by products.created_at DESC.
  const rows = await supabaseRequest<DbCatalogProduct[]>("rpc/get_published_catalog", { method: "POST", body: "{}" });
  return rows.map((product): Product => {
    const gallery = product.gallery ?? [];
    const primaryImage = gallery[0] ?? product.image ?? "";
    return {
      id: product.id, name: product.name, price: Number(product.price),
      category: product.category, image: primaryImage,
      gallery: gallery.length ? gallery : [primaryImage],
      sizes: product.sizes ?? [], colors: product.colors ?? [],
      description: product.description,
    };
  });
});

export const Route = createFileRoute("/new-arrivals")({
  staleTime: 30_000,
  loader: async () => {
    try { return { products: await getNewArrivals(), error: null }; }
    catch { return { products: [], error: "Không thể tải danh sách hàng mới về. Vui lòng thử lại sau." }; }
  },
  head: () => ({
    meta: [
      { title: "New Arrivals — Hàng mới về | WEARO" },
      { name: "description", content: "Khám phá những sản phẩm thời trang WEARO mới được bổ sung." },
      { property: "og:title", content: "New Arrivals — Hàng mới về | WEARO" },
      { property: "og:description", content: "Khám phá những sản phẩm thời trang WEARO mới được bổ sung." },
    ],
    links: [canonicalLink("/new-arrivals")],
  }),
  component: NewArrivalsPage,
});

function NewArrivalsPage() {
  const { products, error } = Route.useLoaderData();
  return (
    <div className="wearo-page wearo-new-arrivals-page min-h-screen">
      <SiteNav />
      <main className="wearo-new-arrivals-main mx-auto max-w-7xl px-5 pb-20 pt-28 sm:px-10 lg:px-16">
        <header className="wearo-new-arrivals-heading">
          <p className="wearo-new-arrivals-eyebrow">WEARO / LATEST DROP</p>
          <h1>NEW ARRIVALS <span>— Hàng mới về</span></h1>
          <p>Khám phá những sản phẩm vừa được bổ sung.</p>
          <span className="wearo-new-arrivals-rule" aria-hidden="true" />
        </header>
        {error ? (
          <section className="wearo-new-arrivals-state" role="alert">
            <h2>Chưa thể tải sản phẩm</h2><p>{error}</p>
            <button type="button" onClick={() => window.location.reload()}>Thử tải lại</button>
          </section>
        ) : products.length === 0 ? (
          <section className="wearo-new-arrivals-state">
            <h2>Đang chuẩn bị những sản phẩm mới.</h2>
            <p>Hiện chưa có sản phẩm nào được công bố. Hãy quay lại sau nhé.</p>
            <Link to="/shop">Khám phá tất cả sản phẩm <ArrowUpRight size={16} /></Link>
          </section>
        ) : (
          <>
            <div className="wearo-new-arrivals-toolbar">
              <p><strong>{products.length}</strong> sản phẩm mới nhất</p>
              <Link to="/shop">Xem tất cả sản phẩm <ArrowUpRight size={15} /></Link>
            </div>
            <div className="wearo-new-arrivals-grid">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
