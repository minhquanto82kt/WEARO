import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getSession } from "@/lib/upthink-supabase";
import { deleteAdminJournalArticle, listAdminJournalArticles, type JournalArticle, type JournalStatus } from "@/lib/journal.functions";
import "@/styles/journal-admin.scss";

export const Route = createFileRoute("/admin/journal/")({
  component: JournalAdminPage,
  head: () => ({ meta: [{ title: "Journal Admin — WEARO" }] }),
});

const STATUS_TABS: Array<{ value: "all" | JournalStatus; label: string }> = [
  { value: "all", label: "TẤT CẢ" },
  { value: "published", label: "ĐÃ ĐĂNG" },
  { value: "draft", label: "ĐĂNG NHÁP" },
  { value: "scheduled", label: "ĐÃ ĐẶT LỊCH" },
];

function statusLabel(status: JournalStatus) {
  if (status === "published") return "Đã đăng";
  if (status === "scheduled") return "Đã đặt lịch";
  return "Đăng nháp";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function JournalAdminPage() {
  const [articles, setArticles] = useState<JournalArticle[]>([]);
  const [status, setStatus] = useState<"all" | JournalStatus>("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"updated" | "published" | "title">("updated");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const accessToken = getSession()?.access_token;
      if (!accessToken) throw new Error("Phiên admin đã hết hạn. Vui lòng đăng nhập lại.");
      setArticles(await listAdminJournalArticles({ data: { accessToken } }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tải Journal.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = articles.filter((article) => {
      const matchesStatus = status === "all" || article.status === status;
      const matchesQuery = !q || `${article.title} ${article.slug} ${article.category}`.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });

    return [...matches].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "title") {
        comparison = a.title.localeCompare(b.title, "vi", { sensitivity: "base" });
      } else {
        const aDate = sortBy === "published" ? a.published_at ?? a.scheduled_at : a.updated_at;
        const bDate = sortBy === "published" ? b.published_at ?? b.scheduled_at : b.updated_at;
        comparison = (aDate ? new Date(aDate).getTime() : 0) - (bDate ? new Date(bDate).getTime() : 0);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [articles, query, sortBy, sortDirection, status]);

  async function handleDelete(article: JournalArticle) {
    if (!window.confirm(`Bạn sắp xóa vĩnh viễn bài viết “${article.title}” (/${article.slug}). Bài viết sẽ bị xóa khỏi hệ thống và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?`)) return;
    setDeletingId(article.id);
    try {
      const accessToken = getSession()?.access_token;
      if (!accessToken) throw new Error("Phiên admin đã hết hạn. Vui lòng đăng nhập lại.");
      await deleteAdminJournalArticle({ data: { accessToken, id: article.id } });
      setArticles((current) => current.filter((item) => item.id !== article.id));
      setMessage("Đã xóa bài viết.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể xóa bài viết.");
    } finally {
      setDeletingId(null);
    }
  }

  const counts = {
    all: articles.length,
    published: articles.filter((a) => a.status === "published").length,
    draft: articles.filter((a) => a.status === "draft").length,
    scheduled: articles.filter((a) => a.status === "scheduled").length,
  };

  return (
    <div className="wearo-journal-admin">
      <header className="up-admin-topbar">
        <div>
          <div className="up-admin-kicker">NỘI DUNG / SEO CMS</div>
          <h1>Journal</h1>
          <p>Quản lý bài viết SEO, trạng thái xuất bản và lịch đăng của WEARO.</p>
        </div>
        <Link className="up-admin-primary" to="/admin/journal/$id" params={{ id: "new" }}>＋ BÀI VIẾT MỚI</Link>
      </header>

      <section className="up-admin-stats">
        <div><span>TỔNG BÀI VIẾT</span><strong>{counts.all}</strong></div>
        <div><span>ĐÃ ĐĂNG</span><strong>{counts.published}</strong></div>
        <div><span>ĐĂNG NHÁP</span><strong>{counts.draft}</strong></div>
        <div><span>ĐÃ ĐẶT LỊCH</span><strong>{counts.scheduled}</strong></div>
      </section>

      <section className="wearo-journal-admin-toolbar">
        <div className="wearo-journal-admin-tabs">
          {STATUS_TABS.map((tab) => (
            <button key={tab.value} type="button" className={status === tab.value ? "is-active" : ""} aria-pressed={status === tab.value} onClick={() => setStatus(tab.value)}>
              {tab.label}<b>{counts[tab.value]}</b>
            </button>
          ))}
        </div>
        <div className="wearo-journal-admin-controls">
          <label className="wearo-journal-search">
            <span>Tìm kiếm bài viết</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tiêu đề, slug, danh mục…" aria-label="Tìm theo tiêu đề, slug hoặc danh mục" />
          </label>
          <label className="wearo-journal-sort">
            <span>Sắp xếp theo</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}>
              <option value="updated">Ngày cập nhật</option>
              <option value="published">Ngày đăng / lịch đăng</option>
              <option value="title">Tiêu đề</option>
            </select>
          </label>
          <button type="button" className="wearo-journal-sort-direction" onClick={() => setSortDirection((current) => current === "desc" ? "asc" : "desc")} aria-label={sortDirection === "desc" ? "Đang giảm dần; bấm để chuyển sang tăng dần" : "Đang tăng dần; bấm để chuyển sang giảm dần"}>
            {sortBy === "title" ? (sortDirection === "asc" ? "↑ A–Z" : "↓ Z–A") : (sortDirection === "desc" ? "↓ Mới trước" : "↑ Cũ trước")}
          </button>
          {(query || status !== "all") && <button type="button" className="wearo-journal-clear-filters" onClick={() => { setQuery(""); setStatus("all"); }}>Xóa bộ lọc</button>}
        </div>
      </section>
      <div className="wearo-journal-results-meta" aria-live="polite">
        {loading ? "Đang tải danh sách…" : `Hiển thị ${filtered.length} / ${articles.length} bài viết`}
      </div>

      <section className="up-admin-table-wrap">
        <table className="up-admin-table wearo-journal-admin-table">
          <thead><tr><th>BÀI VIẾT</th><th>DANH MỤC</th><th>TRẠNG THÁI</th><th>LỊCH / NGÀY ĐĂNG</th><th>CẬP NHẬT</th><th aria-label="Thao tác bài viết">THAO TÁC</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="up-admin-empty">Đang tải Journal…</td></tr>
            ) : filtered.length ? filtered.map((article) => (
              <tr key={article.id}>
                <td>
                  <div className="wearo-journal-admin-article">
                    {article.image_url ? <img src={article.image_url} alt="" /> : <div className="wearo-journal-admin-placeholder">J</div>}
                    <div><strong>{article.title}</strong><small>/{article.slug}</small></div>
                  </div>
                </td>
                <td>{article.category}</td>
                <td><span className={`wearo-journal-status ${article.status}`}>{statusLabel(article.status)}</span></td>
                <td>{article.status === "scheduled" ? formatDate(article.scheduled_at) : formatDate(article.published_at)}</td>
                <td>{formatDate(article.updated_at)}</td>
                <td>
                  <div className="wearo-journal-row-actions">
                    <Link aria-label={`Sửa bài viết: ${article.title}`} to="/admin/journal/$id" params={{ id: article.id }}>Sửa</Link>
                    <Link aria-label={`Xem bài viết: ${article.title} (mở tab mới)`} to="/journal/$slug" params={{ slug: article.slug }} target="_blank" rel="noreferrer">Xem</Link>
                    <button aria-label={`Xóa vĩnh viễn bài viết: ${article.title}`} type="button" disabled={deletingId === article.id} onClick={() => void handleDelete(article)}>{deletingId === article.id ? "Đang xóa…" : "Xóa"}</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="up-admin-empty"><div className="wearo-journal-empty-state"><strong>{articles.length ? "Không tìm thấy bài viết phù hợp" : "Chưa có bài viết Journal"}</strong><span>{articles.length ? "Thử đổi từ khóa hoặc bộ lọc trạng thái." : "Tạo bài viết đầu tiên để bắt đầu quản lý nội dung."}</span>{articles.length > 0 && (query || status !== "all") && <button type="button" onClick={() => { setQuery(""); setStatus("all"); }}>Xóa bộ lọc</button>}{!articles.length && <Link to="/admin/journal/$id" params={{ id: "new" }}>＋ Tạo bài viết</Link>}</div></td></tr>
            )}
          </tbody>
        </table>
      </section>

      {message && <div className="up-admin-toast">{message}</div>}
    </div>
  );
}
