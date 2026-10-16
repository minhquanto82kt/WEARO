// Admin products route
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getSession } from "@/lib/upthink-supabase";
import { archiveAdminProduct, listAdminProducts, updateAdminProduct, type AdminProduct } from "@/lib/product-admin.functions";

export const Route = createFileRoute("/admin/products/")({
  component: ProductAdminPage,
  head: () => ({ meta: [{ title: "Products Admin — UpThink" }] }),
});

const categories = ["hoodies", "tees", "outerwear", "pants", "cap", "sunglass", "accessories"];
const PRODUCTS_PER_PAGE = 8;
function money(value: number) { return new Intl.NumberFormat("vi-VN").format(value) + " ₫"; }

function ProductAdminPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [query, setQuery] = useState(""); const [statusFilter, setStatusFilter] = useState("all"); const [categoryFilter, setCategoryFilter] = useState("all");
  const [message, setMessage] = useState(""); const [loading, setLoading] = useState(true); const [archivingId, setArchivingId] = useState<string | null>(null); const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null); const [currentPage, setCurrentPage] = useState(1);

  async function loadProducts() {
    setLoading(true); setMessage("");
    try {
      const accessToken = getSession()?.access_token;
      if (!accessToken) throw new Error("Phiên admin đã hết hạn. Vui lòng đăng nhập lại.");
      setProducts(await listAdminProducts({ data: { accessToken } }));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể tải danh sách sản phẩm."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadProducts(); }, []);

  const filtered = useMemo(() => products.filter((product) => { const text = `${product.name} ${product.slug}`.toLowerCase(); return (!query || text.includes(query.toLowerCase())) && (statusFilter === "all" || (statusFilter === "hidden" ? product.status === "published" && !product.active : statusFilter === "published" ? product.status === "published" && product.active : product.status === statusFilter)) && (categoryFilter === "all" || product.category === categoryFilter); }), [products, query, statusFilter, categoryFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE)); const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => filtered.slice((safeCurrentPage - 1) * PRODUCTS_PER_PAGE, safeCurrentPage * PRODUCTS_PER_PAGE), [filtered, safeCurrentPage]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);

  async function handleStatusChange(product: AdminProduct, nextStatus: string) {
    setStatusUpdatingId(product.id); setMessage("");
    try {
      const accessToken = getSession()?.access_token;
      if (!accessToken) throw new Error("Phiên admin đã hết hạn. Vui lòng đăng nhập lại.");
      if (nextStatus === "published") {
        await updateAdminProduct({ data: { accessToken, id: product.id, product: { status: "published", active: true } } });
        setMessage(`Đã bật hiển thị "${product.name}" tại cửa hàng.`);
      } else if (nextStatus === "hidden") {
        await updateAdminProduct({ data: { accessToken, id: product.id, product: { active: false } } });
        setMessage(`Đã ẩn "${product.name}" khỏi cửa hàng.`);
      } else if (nextStatus === "draft") {
        await updateAdminProduct({ data: { accessToken, id: product.id, product: { status: "draft", active: false } } });
        setMessage(`Đã chuyển "${product.name}" về bản nháp.`);
      }
      await loadProducts();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể cập nhật trạng thái sản phẩm."); }
    finally { setStatusUpdatingId(null); }
  }

  async function handleTrash(product: AdminProduct) {
    if (!window.confirm(`Chuyển "${product.name}" vào thùng rác? Sản phẩm sẽ bị ẩn khỏi cửa hàng và có thể khôi phục sau này.`)) return;
    setArchivingId(product.id); setMessage("");
    try {
      const accessToken = getSession()?.access_token;
      if (!accessToken) throw new Error("Phiên admin đã hết hạn. Vui lòng đăng nhập lại.");
      if (product.status === "archived") {
        await updateAdminProduct({ data: { accessToken, id: product.id, product: { status: "published", active: true } } });
        setMessage(`Đã khôi phục "${product.name}" và bật hiển thị tại cửa hàng.`);
      } else {
        await archiveAdminProduct({ data: { accessToken, id: product.id } });
        setMessage(`Đã chuyển "${product.name}" vào thùng rác.`);
      }
      await loadProducts();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể cập nhật sản phẩm."); }
    finally { setArchivingId(null); }
  }

  return <div className="up-products-admin">
    <header className="up-admin-topbar"><div><div className="up-admin-kicker">CATALOG / CMS</div><h1 className="up-products-page-title">Products</h1><p className="up-products-page-description">Quản lý sản phẩm của cửa hàng</p></div><Link className="up-admin-primary" to="/admin/products/new">＋ THÊM SẢN PHẨM</Link></header>
    <section className="up-admin-toolbar"><input className="up-products-filter-input" placeholder="⌕  Tìm kiếm sản phẩm…" value={query} onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }} /><select className="up-products-filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}><option value="all">Tất cả trạng thái</option><option value="published">Đang hoạt động</option><option value="hidden">Đã ẩn</option><option value="draft">Bản nháp</option><option value="archived">Thùng rác</option></select><select className="up-products-filter-select" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}><option value="all">Tất cả danh mục</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></section>
    <section className="up-admin-stats"><div><span>TỔNG SẢN PHẨM</span><strong>{products.filter((p) => p.status !== "archived").length}</strong></div><div><span>ĐANG HOẠT ĐỘNG</span><strong>{products.filter((p) => p.status === "published" && p.active).length}</strong></div><div><span>ĐÃ ẨN</span><strong>{products.filter((p) => p.status === "published" && !p.active).length}</strong></div><button type="button" className={`up-products-trash-stat ${statusFilter === "archived" ? "is-active" : ""}`} aria-label={`Xem thùng rác, ${products.filter((p) => p.status === "archived").length} sản phẩm`} aria-pressed={statusFilter === "archived"} onClick={() => { setStatusFilter((current) => current === "archived" ? "all" : "archived"); setQuery(""); setCategoryFilter("all"); setCurrentPage(1); }}><span>THÙNG RÁC</span><strong>{products.filter((p) => p.status === "archived").length}</strong><small>{statusFilter === "archived" ? "ĐANG XEM · NHẤN ĐỂ BỎ LỌC" : "NHẤN ĐỂ XEM SẢN PHẨM ĐÃ XÓA"}</small></button></section>
    <section className="up-admin-table-wrap"><table className="up-admin-table up-products-table"><thead><tr><th>SẢN PHẨM</th><th>DANH MỤC</th><th>GIÁ</th><th>TRẠNG THÁI</th><th>NỔI BẬT</th><th className="up-products-actions-heading">THAO TÁC</th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="up-admin-empty">Đang tải sản phẩm…</td></tr> : paginatedProducts.map((product) => <tr key={product.id}><td><div className="up-product-cell">{product.image ? <img src={product.image} alt="" /> : <div className="up-product-placeholder">U</div>}<div><strong>{product.name}</strong><small>/{product.slug}</small></div></div></td><td>{product.category}</td><td><strong>{money(product.price)}</strong></td><td><select aria-label={`Trạng thái ${product.name}`} className={`up-status-select up-status ${product.status === "archived" ? "archived" : product.status === "draft" ? "draft" : product.active ? "published" : "hidden"}`} value={product.status === "archived" ? "archived" : product.status === "draft" ? "draft" : product.active ? "published" : "hidden"} disabled={statusUpdatingId === product.id || product.status === "archived"} onChange={(event) => void handleStatusChange(product, event.target.value)}><option value="published">Đang hoạt động</option><option value="hidden">Đã ẩn</option><option value="draft">Bản nháp</option>{product.status === "archived" && <option value="archived">Thùng rác</option>}</select></td><td>{product.featured ? "●" : "—"}</td><td><details className="up-product-actions-menu"><summary className="up-product-actions-trigger" aria-label={`Mở thao tác cho ${product.name}`} title="Thao tác"><span aria-hidden="true">⋯</span></summary><div className="up-product-actions-popover"><Link className="up-row-action" to="/admin/products/$id" params={{ id: product.id }}>CHI TIẾT / SỬA</Link><Link className="up-row-action" to="/admin/products/$id/tags" params={{ id: product.id }}>TAGS</Link><button type="button" className="up-row-action" disabled={archivingId === product.id} onClick={() => void handleTrash(product)}>{archivingId === product.id ? "ĐANG CẬP NHẬT…" : product.status === "archived" ? "KHÔI PHỤC VỀ CỬA HÀNG" : "CHUYỂN VÀO THÙNG RÁC"}</button></div></details></td></tr>)}</tbody></table>{!loading && !filtered.length && <div className="up-admin-empty">Không có sản phẩm phù hợp.</div>}</section>
    {!loading && filtered.length > PRODUCTS_PER_PAGE && totalPages > 1 && <nav className="up-products-pagination" aria-label="Phân trang sản phẩm"><button type="button" className="up-products-pagination-button" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>← TRANG TRƯỚC</button><div className="up-products-pagination-current" aria-live="polite"><strong>{safeCurrentPage}</strong><span>/</span><strong>{totalPages}</strong><small>{filtered.length} sản phẩm</small></div><button type="button" className="up-products-pagination-button" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>TRANG SAU →</button></nav>}
    {message && <div className="up-admin-toast">{message}</div>}
  </div>;
}
