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
  id: string; name: string; description: string | null; short_description: string | null;
  price: number; category: Product["category"]; image: string | null; new_arrival: boolean;
};
type DbVariant = { product_id: string; size: string; color: string; stock: number };
type DbImage = { product_id: string; image_url: string; sort_order: number; is_primary: boolean };

const getNewArrivals = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseRequest } = await import("@/lib/supabase.server");
  const rows = await supabaseRequest<DbCatalogProduct[]>(
    "products?select=id,name,description,short_description,price,category,image,new_arrival&new_arrival=eq.true&status=eq.published&active=eq.true&order=created_at.desc",
    { method: "GET" },
  );
  if (!rows.length) return [];

  const ids = rows.map((product) => product.id);
  const filter = `in.(${ids.join(",")})`;
  const [variants, images] = await Promise.all([
    supabaseRequest<DbVariant[]>(`product_variants?select=product_id,size,color,stock&product_id=${filter}&order=size.asc,color.asc`, { method: "GET" }),
    supabaseRequest<DbImage[]>(`product_images?select=product_id,image_url,sort_order,is_primary&product_id=${filter}&order=sort_order.asc`, { method: "GET" }),
  ]);
  return rows.map((product): Product => {
    const productVariants = variants.filter((variant) => variant.product_id === product.id);
    const productImages = images.filter((image) => image.product_id === product.id).sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
    const gallery = [...new Set(productImages.map((image) => image.image_url).filter(Boolean))];
    const primaryImage = gallery[0] ?? product.image ?? "";
    return {
      id: product.id, name: product.name, price: Number(product.price),
      category: product.category, image: primaryImage,
      gallery: gallery.length ? gallery : [primaryImage],
      sizes: [...new Set(productVariants.map((variant) => variant.size))],
      colors: [...new Set(productVariants.map((variant) => variant.color))],
      description: product.description ?? product.short_description ?? "",
      shortDescription: product.short_description ?? undefined,
      badge: "NEW ARRIVAL",
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
