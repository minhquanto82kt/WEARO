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
    return articles.filter((article) => {
      const matchesStatus = status === "all" || article.status === status;
      const matchesQuery = !q || `${article.title} ${article.slug} ${article.category}`.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [articles, query, status]);

  async function handleDelete(article: JournalArticle) {
    if (!window.confirm(`Xóa vĩnh viễn bài “${article.title}”? Thao tác này không thể hoàn tác.`)) return;
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
          <div className="up-admin-kicker">CONTENT / SEO CMS</div>
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
            <button key={tab.value} type="button" className={status === tab.value ? "is-active" : ""} onClick={() => setStatus(tab.value)}>
              {tab.label}<b>{counts[tab.value]}</b>
            </button>
          ))}
        </div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="⌕  Tìm tiêu đề, slug, danh mục…" />
      </section>

      <section className="up-admin-table-wrap">
        <table className="up-admin-table wearo-journal-admin-table">
          <thead><tr><th>BÀI VIẾT</th><th>DANH MỤC</th><th>TRẠNG THÁI</th><th>LỊCH / NGÀY ĐĂNG</th><th>CẬP NHẬT</th><th>THAO TÁC</th></tr></thead>
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
                    <Link to="/admin/journal/$id" params={{ id: article.id }}>SỬA</Link>
                    <Link to="/journal/$slug" params={{ slug: article.slug }} target="_blank">XEM</Link>
                    <button type="button" disabled={deletingId === article.id} onClick={() => void handleDelete(article)}>{deletingId === article.id ? "…" : "XÓA"}</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="up-admin-empty">Không có bài viết phù hợp.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {message && <div className="up-admin-toast">{message}</div>}
    </div>
  );
}
