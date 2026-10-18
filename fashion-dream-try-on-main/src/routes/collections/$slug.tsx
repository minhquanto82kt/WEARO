import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/data/products";
import { canonicalLink } from "@/lib/seo";
import "@/styles/wearo-collection-pages.scss";

type DbCatalogProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: Product["category"];
  image: string | null;
  featured: boolean;
  sizes: string[];
  colors: string[];
  gallery: string[];
  total_stock: number;
};

type ProductStyleTag = {
  product_id: string;
  tag_slug: string;
  tag_name: string;
  tag_description: string | null;
};

const getCollectionData = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseRequest } = await import("@/lib/supabase.server");
  const [catalog, styleTags] = await Promise.all([
    supabaseRequest<DbCatalogProduct[]>("rpc/get_published_catalog", { method: "POST", body: "{}" }),
    supabaseRequest<ProductStyleTag[]>("rpc/get_public_product_style_tags", { method: "POST", body: "{}" }),
  ]);

  const tagsByProduct = new Map<string, ProductStyleTag[]>();
  for (const tag of styleTags) {
    const current = tagsByProduct.get(tag.product_id) ?? [];
    current.push(tag);
    tagsByProduct.set(tag.product_id, current);
  }

  const products = catalog.map((product): Product => {
    const gallery = product.gallery ?? [];
    const primaryImage = gallery[0] ?? product.image ?? "";
    const productTags = tagsByProduct.get(product.id) ?? [];
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
      description: product.description ?? "",
      tags: productTags.map((tag) => tag.tag_name),
    };
  });

  return { products, styleTags };
});

const COLLECTIONS = {
  casual: {
    title: "CASUAL",
    subtitle: "Everyday, made easy.",
    description: "Những thiết kế unisex dễ mặc mỗi ngày — thoải mái, linh hoạt và dễ phối theo cách riêng của bạn.",
    kicker: "01 / EVERYDAY UNIFORM",
  },
  basic: {
    title: "BASIC",
    subtitle: "Less, but better.",
    description: "Những món đồ tối giản, dễ kết hợp và đủ linh hoạt để đi cùng nhiều lịch trình.",
    kicker: "02 / ESSENTIAL PIECES",
  },
  streetwear: {
    title: "STREETWEAR",
    subtitle: "Own your point of view.",
    description: "Phom dáng phóng khoáng và chi tiết cá tính cho nhịp sống đô thị.",
    kicker: "03 / CITY EXPRESSION",
  },
  outerwear: {
    title: "OUTERWEAR",
    subtitle: "Layer with intention.",
    description: "Những lớp khoác hoàn thiện outfit, cân bằng công năng và phong cách.",
    kicker: "04 / LAYERING SYSTEM",
  },
} as const;

export const Route = createFileRoute("/collections/$slug")({
  staleTime: 30_000,
  loader: () => getCollectionData(),
  head: ({ params }) => {
    const collection = COLLECTIONS[params.slug as keyof typeof COLLECTIONS];
    const title = collection ? `${collection.title} — WEARO Collections` : "Bộ sưu tập — WEARO";
    return {
      meta: [
        { title },
        { name: "description", content: collection?.description ?? "Khám phá bộ sưu tập thời trang unisex WEARO." },
      ],
      links: [canonicalLink(`/collections/${params.slug}`)],
    };
  },
  component: CollectionPage,
  notFoundComponent: () => <CollectionNotFound />,
});

function CollectionPage() {
  const { slug } = Route.useParams();
  const { products, styleTags } = Route.useLoaderData();
  const collection = COLLECTIONS[slug as keyof typeof COLLECTIONS];

  if (!collection) return <CollectionNotFound />;

  const styleProductIds = new Set(styleTags.filter((tag) => tag.tag_slug === slug).map((tag) => tag.product_id));
  const collectionProducts = products.filter((product) => styleProductIds.has(product.id));

  return (
    <div className="wearo-collection-page" data-collection={slug}>
      <SiteNav />
      <main className="wearo-collection-main">
        <div className="wearo-collection-breadcrumb">
          <Link to="/shop"><ArrowLeft size={15} /> Cửa hàng</Link>
          <span>/</span>
          <span>{collection.title}</span>
        </div>

        <section className="wearo-collection-hero" aria-labelledby="collection-title">
          <div className="wearo-collection-hero__copy">
            <p className="wearo-collection-kicker">{collection.kicker}</p>
            <h1 id="collection-title">{collection.title}<span>.</span></h1>
            <p className="wearo-collection-subtitle">{collection.subtitle}</p>
            <p className="wearo-collection-description">{collection.description}</p>
            <a className="wearo-collection-cta" href="#collection-products">
              Khám phá sản phẩm <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="wearo-collection-hero__art" aria-hidden="true">
            <span className="wearo-collection-art__index">WEARO / STYLE EDIT</span>
            <span className="wearo-collection-art__word">{collection.title}</span>
            <span className="wearo-collection-art__circle" />
            <span className="wearo-collection-art__footer">UNISEX · EVERYDAY FORM</span>
          </div>
        </section>

        <section id="collection-products" className="wearo-collection-products" aria-labelledby="collection-products-title">
          <div className="wearo-collection-products__head">
            <div>
              <p className="wearo-collection-kicker">CURATED FOR EVERYONE</p>
              <h2 id="collection-products-title">Khám phá {collection.title.toLowerCase()}</h2>
            </div>
            <p className="wearo-collection-count">{collectionProducts.length} sản phẩm</p>
          </div>

          {collectionProducts.length > 0 ? (
            <div className="wearo-collection-grid">
              {collectionProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="wearo-collection-empty" role="status">
              <span className="wearo-collection-empty__index">WEARO / COLLECTION 0{Object.keys(COLLECTIONS).indexOf(slug) + 1}</span>
              <h3>Bộ sưu tập đang được hoàn thiện.</h3>
              <p>Hiện chưa có sản phẩm đã xuất bản được gắn với phong cách này. Hãy xem toàn bộ sản phẩm hoặc quay lại sau.</p>
              <Link to="/shop">Xem tất cả sản phẩm <ArrowUpRight size={16} /></Link>
            </div>
          )}
        </section>

        <nav className="wearo-collection-switcher" aria-label="Các bộ sưu tập">
          {Object.entries(COLLECTIONS).map(([key, item]) => (
            <Link key={key} to="/collections/$slug" params={{ slug: key }} className={key === slug ? "is-active" : ""}>
              <span>{item.kicker}</span>{item.title}<ArrowUpRight size={15} />
            </Link>
          ))}
        </nav>
      </main>
      <SiteFooter />
    </div>
  );
}

function CollectionNotFound() {
  return (
    <div className="wearo-collection-page" data-collection="casual">
      <SiteNav />
      <main className="wearo-collection-not-found">
        <p className="wearo-collection-kicker">WEARO / COLLECTIONS</p>
        <h1>Không tìm thấy bộ sưu tập.</h1>
        <p>Bộ sưu tập này chưa được hỗ trợ hoặc đường dẫn không chính xác.</p>
        <Link to="/shop">Quay lại cửa hàng <ArrowUpRight size={16} /></Link>
      </main>
      <SiteFooter />
    </div>
  );
}
