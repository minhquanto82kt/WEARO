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
  const [message, setMessage] = useState(""); const [loading, setLoading] = useState(true); const [archivingId, setArchivingId] = useState<string | null>(null); const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null); const [currentPage, setCurrentPage] = useState(1); const [selectedIds, setSelectedIds] = useState<string[]>([]); const [bulkBusy, setBulkBusy] = useState(false);

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

  const archivedSlugs = useMemo(() => new Set(products.filter((product) => product.status === "archived").map((product) => product.slug.trim().toLowerCase())), [products]);
  const filtered = useMemo(() => products.filter((product) => { const text = `${product.name} ${product.slug}`.toLowerCase(); return (!query || text.includes(query.toLowerCase())) && (statusFilter === "all" || (statusFilter === "hidden" ? product.status === "published" && !product.active : statusFilter === "published" ? product.status === "published" && product.active : product.status === statusFilter)) && (categoryFilter === "all" || product.category === categoryFilter); }), [products, query, statusFilter, categoryFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE)); const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => filtered.slice((safeCurrentPage - 1) * PRODUCTS_PER_PAGE, safeCurrentPage * PRODUCTS_PER_PAGE), [filtered, safeCurrentPage]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);
  const selectedProducts = products.filter((product) => selectedIds.includes(product.id));
  const visibleIds = paginatedProducts.map((product) => product.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  function toggleProductSelection(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]);
  }

  function toggleVisibleSelection() {
    setSelectedIds((current) => allVisibleSelected
      ? current.filter((id) => !visibleIds.includes(id))
      : [...new Set([...current, ...visibleIds])]);
  }

  async function handleBulkAction(action: "published" | "hidden" | "draft" | "archived") {
    if (!selectedProducts.length || bulkBusy) return;
    const actionLabel = action === "published" ? "bật hiển thị" : action === "hidden" ? "ẩn" : action === "draft" ? "chuyển về bản nháp" : "chuyển vào thùng rác";
    if (action === "archived" && !window.confirm(`Chuyển ${selectedProducts.length} sản phẩm đã chọn vào thùng rác? Bạn có thể khôi phục từng sản phẩm sau này.`)) return;
    setBulkBusy(true);
    setMessage("");
    let succeeded = 0;
    const failures: Array<{ id: string; name: string }> = [];
    try {
      const accessToken = getSession()?.access_token;
      if (!accessToken) throw new Error("Phiên admin đã hết hạn. Vui lòng đăng nhập lại.");
      for (const product of selectedProducts) {
        try {
          if (action === "archived") await archiveAdminProduct({ data: { accessToken, id: product.id } });
          else if (action === "published") await updateAdminProduct({ data: { accessToken, id: product.id, product: { status: "published", active: true } } });
          else if (action === "hidden") await updateAdminProduct({ data: { accessToken, id: product.id, product: { active: false } } });
          else await updateAdminProduct({ data: { accessToken, id: product.id, product: { status: "draft", active: false } } });
          succeeded += 1;
        } catch {
          failures.push({ id: product.id, name: product.name });
        }
      }
      setSelectedIds(failures.map((failure) => failure.id));
      await loadProducts();
      setMessage(failures.length
        ? `Đã ${actionLabel} ${succeeded}/${selectedProducts.length} sản phẩm. Thất bại: ${failures.map((failure) => failure.name).join(", ")}.`
        : `Đã ${actionLabel} thành công ${succeeded} sản phẩm.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể thực hiện thao tác hàng loạt.");
    } finally {
      setBulkBusy(false);
    }
  }

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
        await updateAdminProduct({ data: { accessToken, id: product.id, product: { status: "draft", active: false } } });
        setMessage(`Đã khôi phục "${product.name}" về bản nháp. Sản phẩm chưa hiển thị tại cửa hàng; hãy bật hiển thị khi đã kiểm tra xong.`);
      } else {
        await archiveAdminProduct({ data: { accessToken, id: product.id } });
        setMessage(`Đã chuyển "${product.name}" vào thùng rác.`);
      }
      await loadProducts();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể cập nhật sản phẩm."); }
    finally { setArchivingId(null); }
  }

  return <div className={`up-products-admin ${selectedIds.length ? "has-selection" : ""}`}>
    {selectedIds.length > 0 && <div className="up-products-bulk-bar" role="region" aria-label="Thao tác hàng loạt sản phẩm">
      <div className="up-products-bulk-summary"><strong>{selectedIds.length}</strong><span>sản phẩm đã chọn</span></div>
      <button type="button" className="up-products-bulk-action" disabled={bulkBusy} onClick={toggleVisibleSelection}>{allVisibleSelected ? "BỎ CHỌN TRANG NÀY" : "CHỌN THÊM TRANG NÀY"}</button>
      <button type="button" className="up-products-bulk-action" disabled={bulkBusy} onClick={() => void handleBulkAction("published")}>BẬT HIỂN THỊ</button>
      <button type="button" className="up-products-bulk-action" disabled={bulkBusy} onClick={() => void handleBulkAction("hidden")}>ẨN SẢN PHẨM</button>
      <button type="button" className="up-products-bulk-action" disabled={bulkBusy} onClick={() => void handleBulkAction("draft")}>VỀ BẢN NHÁP</button>
      <button type="button" className="up-products-bulk-action up-products-bulk-danger" disabled={bulkBusy} onClick={() => void handleBulkAction("archived")}>VÀO THÙNG RÁC</button>
      <button type="button" className="up-products-bulk-clear" disabled={bulkBusy} onClick={() => setSelectedIds([])}>BỎ CHỌN ×</button>
      {bulkBusy && <span className="up-products-bulk-progress" aria-live="polite">ĐANG XỬ LÝ…</span>}
    </div>}
    <header className="up-admin-topbar"><div><div className="up-admin-kicker">CATALOG / CMS</div><h1 className="up-products-page-title">Products</h1><p className="up-products-page-description">Quản lý sản phẩm của cửa hàng</p></div><Link className="up-admin-primary" to="/admin/products/new">＋ THÊM SẢN PHẨM</Link></header>
    <section className="up-admin-toolbar"><input className="up-products-filter-input" placeholder="⌕  Tìm kiếm sản phẩm…" value={query} onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }} /><select className="up-products-filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}><option value="all">Tất cả trạng thái</option><option value="published">Đang hoạt động</option><option value="hidden">Đã ẩn</option><option value="draft">Bản nháp</option><option value="archived">Thùng rác</option></select><select className="up-products-filter-select" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}><option value="all">Tất cả danh mục</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></section>
    <section className="up-admin-stats"><div><span>TỔNG SẢN PHẨM</span><strong>{products.filter((p) => p.status !== "archived").length}</strong></div><div><span>ĐANG HOẠT ĐỘNG</span><strong>{products.filter((p) => p.status === "published" && p.active).length}</strong></div><div><span>ĐÃ ẨN</span><strong>{products.filter((p) => p.status === "published" && !p.active).length}</strong></div><button type="button" className={`up-products-trash-stat ${statusFilter === "archived" ? "is-active" : ""}`} aria-label={`Xem thùng rác, ${products.filter((p) => p.status === "archived").length} sản phẩm`} aria-pressed={statusFilter === "archived"} onClick={() => { setStatusFilter((current) => current === "archived" ? "all" : "archived"); setQuery(""); setCategoryFilter("all"); setCurrentPage(1); }}><span>THÙNG RÁC</span><strong>{products.filter((p) => p.status === "archived").length}</strong><small>{statusFilter === "archived" ? "ĐANG XEM · NHẤN ĐỂ BỎ LỌC" : "NHẤN ĐỂ XEM SẢN PHẨM ĐÃ XÓA"}</small></button></section>
    <section className="up-admin-table-wrap"><table className="up-admin-table up-products-table"><thead><tr><th className="up-products-select-cell"><input type="checkbox" aria-label="Chọn tất cả sản phẩm trên trang hiện tại" checked={allVisibleSelected} onChange={toggleVisibleSelection} disabled={loading || !visibleIds.length} /></th><th>SẢN PHẨM</th><th>DANH MỤC</th><th>GIÁ</th><th>TRẠNG THÁI</th><th>NỔI BẬT</th><th>NEW ARRIVAL</th><th className="up-products-actions-heading">THAO TÁC</th></tr></thead><tbody>{loading ? <tr><td colSpan={8} className="up-admin-empty">Đang tải sản phẩm…</td></tr> : paginatedProducts.map((product) => <tr key={product.id} className={selectedIds.includes(product.id) ? "is-selected" : ""}><td className="up-products-select-cell"><input type="checkbox" aria-label={`Chọn ${product.name}`} checked={selectedIds.includes(product.id)} onChange={() => toggleProductSelection(product.id)} /></td><td><div className="up-product-cell">{product.image ? <img src={product.image} alt="" /> : <div className="up-product-placeholder">U</div>}<div><strong>{product.name}</strong><small>/{product.slug}</small>{product.status !== "archived" && archivedSlugs.has(product.slug.trim().toLowerCase()) && <small className="up-product-duplicate-warning" role="status">Trùng slug với sản phẩm trong thùng rác — cần đổi slug trước khi xuất bản.</small>}</div></div></td><td>{product.category}</td><td><strong>{money(product.price)}</strong></td><td><select aria-label={`Trạng thái ${product.name}`} className={`up-status-select up-status ${product.status === "archived" ? "archived" : product.status === "draft" ? "draft" : product.active ? "published" : "hidden"}`} value={product.status === "archived" ? "archived" : product.status === "draft" ? "draft" : product.active ? "published" : "hidden"} disabled={statusUpdatingId === product.id || product.status === "archived"} onChange={(event) => void handleStatusChange(product, event.target.value)}><option value="published">Đang hoạt động</option><option value="hidden">Đã ẩn</option><option value="draft">Bản nháp</option>{product.status === "archived" && <option value="archived">Thùng rác</option>}</select></td><td>{product.featured ? "●" : "—"}</td><td>{product.new_arrival ? <span className="up-admin-new-arrival-pill">NEW ARRIVAL</span> : "—"}</td><td><details className="up-product-actions-menu"><summary className="up-product-actions-trigger" aria-label={`Mở thao tác cho ${product.name}`} title="Thao tác"><span aria-hidden="true">⋯</span></summary><div className="up-product-actions-popover"><Link className="up-row-action" to="/admin/products/$id" params={{ id: product.id }}>CHI TIẾT / SỬA</Link><Link className="up-row-action" to="/admin/products/$id/tags" params={{ id: product.id }}>TAGS</Link><button type="button" className="up-row-action" disabled={archivingId === product.id} onClick={() => void handleTrash(product)}>{archivingId === product.id ? "ĐANG CẬP NHẬT…" : product.status === "archived" ? "KHÔI PHỤC VỀ CỬA HÀNG" : "CHUYỂN VÀO THÙNG RÁC"}</button></div></details></td></tr>)}</tbody></table>{!loading && !filtered.length && <div className="up-admin-empty">Không có sản phẩm phù hợp.</div>}</section>
    {!loading && filtered.length > PRODUCTS_PER_PAGE && totalPages > 1 && <nav className="up-products-pagination" aria-label="Phân trang sản phẩm"><button type="button" className="up-products-pagination-button" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>← TRANG TRƯỚC</button><div className="up-products-pagination-current" aria-live="polite"><strong>{safeCurrentPage}</strong><span>/</span><strong>{totalPages}</strong><small>{filtered.length} sản phẩm</small></div><button type="button" className="up-products-pagination-button" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>TRANG SAU →</button></nav>}
    {message && <div className="up-admin-toast">{message}</div>}
  </div>;
}
