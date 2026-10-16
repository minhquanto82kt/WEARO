import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { signOut } from "@/lib/upthink-supabase";

export function AdminShell() {
  const location = useLocation();

  return (
    <div className="up-admin-root">


      <div className="up-admin-app">
        <aside className="up-admin-sidebar">
          <div className="up-admin-logo">
            UPTHINK
            <span>COMMERCE ADMIN</span>
          </div>

          <nav>
            <div className="up-admin-nav-section">OVERVIEW</div>
            <Link to="/admin" className={location.pathname === "/admin" ? "active" : ""}>Dashboard</Link>

            <div className="up-admin-nav-section">MANAGE</div>
            <Link to="/admin/products" className={location.pathname.startsWith("/admin/products") ? "active" : ""}>Products</Link>
            <Link to="/admin/tags" className={location.pathname.startsWith("/admin/tags") ? "active" : ""}>Tags</Link>
            <Link to="/admin/orders" className={location.pathname.startsWith("/admin/orders") ? "active" : ""}>Orders</Link>
            <button type="button" className="up-admin-nav-disabled" disabled>Customers<span>SOON</span></button>
            <Link to="/admin/inventory" className={location.pathname.startsWith("/admin/inventory") ? "active" : ""}>Inventory</Link>

            <div className="up-admin-nav-section">DESIGN</div>
            <Link to="/admin/ai-studio" className={location.pathname.startsWith("/admin/ai-studio") ? "active" : ""}>AI Studio</Link>
            <Link to="/admin/appearance" className={location.pathname === "/admin/appearance" ? "active" : ""}>Appearance</Link>
            <Link to="/admin/appearance/workflow" className={location.pathname.startsWith("/admin/appearance/workflow") ? "active" : ""}>Theme Workflow</Link>
            <Link to="/admin/design-system" className={location.pathname.startsWith("/admin/design-system") ? "active" : ""}>Design System</Link>

            <div className="up-admin-nav-section">CONTENT</div>
            <Link to="/admin/content" className={location.pathname.startsWith("/admin/content") ? "active" : ""}>Content</Link>
            <Link to="/admin/journal" className={location.pathname.startsWith("/admin/journal") ? "active" : ""}>Journal</Link>
            <button type="button" className="up-admin-nav-disabled" disabled>Settings<span>SOON</span></button>
          </nav>

          <button className="up-admin-logout" onClick={() => { signOut(); window.location.href = "/admin"; }}>
            Đăng xuất
          </button>
        </aside>

        <main className="up-admin-main"><Outlet /></main>
      </div>
    </div>
  );
}
