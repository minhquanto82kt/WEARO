import { createFileRoute, Link } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Copy, Eye, EyeOff, Heart, LogOut, Package, ShoppingBag, UserRound, WandSparkles } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { getCustomerSession, requestPasswordReset, signInCustomer, signOutCustomer, updateCustomerPassword } from "@/lib/auth";
import { supabaseConfig } from "@/lib/upthink-supabase";
import { useCart } from "@/lib/cart";
import { listWishlistProductIds } from "@/lib/wishlist";
import { listMyOrders, type CustomerOrder } from "@/lib/order.functions";
import { formatVnd } from "@/data/products";
import "./account.scss";

export const Route = createFileRoute("/account")({ component: AccountPage });
type Mode = "login" | "register" | "recover" | "reset";
type AccountUser = { id: string; email?: string; user_metadata?: { full_name?: string; name?: string } };

function getOrderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Chờ xác nhận", confirmed: "Đã xác nhận", processing: "Đang chuẩn bị",
    packed: "Đang chuẩn bị", shipped: "Đang giao", shipping: "Đang giao",
    delivered: "Đã giao", completed: "Hoàn tất", cancelled: "Đã hủy", canceled: "Đã hủy",
    returned: "Đã hoàn trả", refunded: "Đã hoàn tiền",
  };
  return labels[status.trim().toLowerCase()] ?? status;
}

function getAccountPreviewUser(): AccountUser | null {
  if (typeof window === "undefined") return null;
  if (new URLSearchParams(window.location.search).get("preview") !== "1") return null;
  const hostname = window.location.hostname;
  if (!(hostname === "localhost" || hostname === "127.0.0.1" || hostname.includes("-git-feature-product-admin-"))) return null;
  return { id: "preview-account-user", email: "preview@wearo.local", user_metadata: { full_name: "WEARO Preview User", name: "WEARO Preview User" } };
}

function getFriendlyAuthCallbackError() {
  if (typeof window === "undefined" || !window.location.hash) return "";
  const params = new URLSearchParams(window.location.hash.slice(1));
  const code = params.get("error_code");
  const description = params.get("error_description");
  if (!code && !description) return "";
  if (code === "otp_expired" || /expired|invalid/i.test(description || "")) return "Liên kết đã hết hạn hoặc không còn hợp lệ. Hãy yêu cầu một email mới.";
  return "Xác thực tài khoản chưa hoàn tất. Vui lòng thử lại bằng liên kết mới nhất.";
}

function clearAccountQuery() {
  if (typeof window !== "undefined") window.history.replaceState({}, document.title, window.location.pathname);
}

function AccountPage() {
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === "undefined") return "login";
    return new URLSearchParams(window.location.search).get("reset") === "1" ? "reset" : "login";
  });
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState<AccountUser | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [latestOrder, setLatestOrder] = useState<CustomerOrder | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [copiedAccountId, setCopiedAccountId] = useState(false);
  const cart = useCart();

  const loadUser = async () => {
    const preview = getAccountPreviewUser();
    if (preview) { setUser(preview); setCheckingUser(false); return; }
    const session = getCustomerSession();
    if (!session?.access_token) { setUser(null); setCheckingUser(false); return; }
    try {
      const response = await fetch(`${supabaseConfig.url}/auth/v1/user`, { headers: { apikey: supabaseConfig.key, Authorization: `Bearer ${session.access_token}` } });
      if (!response.ok) throw new Error("Session không còn hợp lệ.");
      setUser((await response.json()) as AccountUser);
    } catch { setUser(null); }
    finally { setCheckingUser(false); }
  };

  useEffect(() => {
    const callbackError = getFriendlyAuthCallbackError();
    if (callbackError) { setError(callbackError); window.history.replaceState({}, document.title, window.location.pathname + window.location.search); }
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "1") { setMessage("Email đã được xác nhận. Chào mừng bạn đến với WEARO."); clearAccountQuery(); }
    const onAuth = () => { setCheckingUser(true); void loadUser(); };
    const onRecovery = () => { setMode("reset"); setMessage("Liên kết khôi phục hợp lệ. Hãy đặt mật khẩu mới."); setError(""); setCheckingUser(false); };
    void loadUser();
    window.addEventListener("upthink:auth:login", onAuth);
    window.addEventListener("upthink:auth:logout", onAuth);
    window.addEventListener("upthink:auth:recovery", onRecovery);
    return () => { window.removeEventListener("upthink:auth:login", onAuth); window.removeEventListener("upthink:auth:logout", onAuth); window.removeEventListener("upthink:auth:recovery", onRecovery); };
  }, []);

  const switchMode = (next: Mode) => { setMode(next); setMessage(""); setError(""); setPassword(""); setConfirmPassword(""); };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setMessage(""); setError(""); setRequiresEmailConfirmation(false);
    try {
      if (mode === "recover") {
        const redirectTo = `${window.location.origin}/account?reset=1`;
        await requestPasswordReset(email, redirectTo);
        setMessage("Nếu email tồn tại trong WEARO, một liên kết khôi phục đã được gửi. Hãy kiểm tra hộp thư và cả Spam.");
      } else if (mode === "reset") {
        if (password !== confirmPassword) throw new Error("Mật khẩu xác nhận không khớp.");
        await updateCustomerPassword(password);
        await signOutCustomer();
        setPassword(""); setConfirmPassword(""); setMode("login");
        setMessage("Mật khẩu đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.");
        clearAccountQuery();
      } else if (mode === "register") {
        if (!fullName.trim()) throw new Error("Vui lòng nhập tên tài khoản.");
        if (password !== confirmPassword) throw new Error("Mật khẩu xác nhận không khớp.");
        const normalizedEmail = email.trim().toLowerCase();
        const redirectTo = `${window.location.origin}/account?verified=1`;
        const response = await fetch(`${supabaseConfig.url}/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`, { method: "POST", headers: { apikey: supabaseConfig.key, "Content-Type": "application/json" }, body: JSON.stringify({ email: normalizedEmail, password, data: { full_name: fullName.trim() } }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || data.message || data.error_description || "Không thể tạo tài khoản.");
        setEmail(normalizedEmail); setPassword(""); setConfirmPassword("");
        if (data.access_token) {
          // Reuse the existing customer sign-in path so the session is persisted consistently.
          await signInCustomer(normalizedEmail, password);
          setRequiresEmailConfirmation(false);
          setMessage("Đăng ký thành công. Bạn đã đăng nhập vào WEARO.");
        } else {
          setRequiresEmailConfirmation(true);
          setMessage("Đăng ký thành công. Kiểm tra email để xác nhận tài khoản trước khi đăng nhập.");
        }
      } else {
        await signInCustomer(email, password); setPassword(""); setMessage("Đăng nhập thành công.");
      }
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Đã xảy ra lỗi. Vui lòng thử lại."); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) { setError("Nhập email để gửi lại email xác nhận."); return; }
    setResending(true); setMessage(""); setError("");
    try {
      const response = await fetch(`${supabaseConfig.url}/auth/v1/resend?redirect_to=${encodeURIComponent(`${window.location.origin}/account?verified=1`)}`, { method: "POST", headers: { apikey: supabaseConfig.key, "Content-Type": "application/json" }, body: JSON.stringify({ type: "signup", email: normalizedEmail }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || data.message || data.error_description || "Không thể gửi lại email xác nhận.");
      setMessage("Đã gửi lại email xác nhận. Hãy mở email mới nhất và chỉ nhấn xác nhận một lần.");
    } catch (resendError) { setError(resendError instanceof Error ? resendError.message : "Không thể gửi lại email xác nhận."); }
    finally { setResending(false); }
  };

  useEffect(() => {
    let active = true;
    async function loadAccountPreviews() {
      if (!user) { setWishlistCount(0); setLatestOrder(null); setOrderCount(0); return; }
      try {
        const session = getCustomerSession();
        const wishlistPromise = listWishlistProductIds(user.id);
        const ordersPromise = session?.access_token
          ? listMyOrders({ data: { accessToken: session.access_token, limit: 100 } })
          : Promise.resolve({ orders: [] as CustomerOrder[] });
        const [wishlistIds, orderResult] = await Promise.all([wishlistPromise, ordersPromise]);
        if (active) { setWishlistCount(wishlistIds.length); setLatestOrder(orderResult.orders[0] ?? null); setOrderCount(orderResult.orders.length); }
      } catch {
        if (active) { setWishlistCount(0); setLatestOrder(null); setOrderCount(0); }
      }
    }
    void loadAccountPreviews();
    return () => { active = false; };
  }, [user]);

  const copyAccountId = async () => {
    try {
      await navigator.clipboard.writeText(user?.id ?? "");
      setCopiedAccountId(true);
      window.setTimeout(() => setCopiedAccountId(false), 1800);
    } catch {
      setMessage("Không thể sao chép tự động. Bạn có thể chọn và sao chép mã tài khoản.");
    }
  };

  const handleLogout = async () => {
    if (getAccountPreviewUser()) { clearAccountQuery(); setUser(null); setMessage("Đã thoát Preview User. Đang hiển thị màn hình đăng nhập."); return; }
    setLoading(true); await signOutCustomer(); setMessage("Bạn đã đăng xuất."); setLoading(false);
  };

  if (checkingUser && mode !== "reset") return <main className="account-page"><SiteNav /><div className="account-loading">WEARO / VERIFYING ACCOUNT</div></main>;

  return <div className="account-page">
    
    <SiteNav />
    <main className={`account-content ${user && mode !== "reset" ? "account-content--hub" : "account-content--auth"}`}><div className="account-shell"><section className="account-main">
      {user && mode !== "reset" ? <div className="account-dashboard">
        <div className="account-welcome"><div><div className="account-kicker">WEARO / PERSONAL FASHION SYSTEM</div><h1>CHÀO MỪNG <span>{user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "BẠN"}</span></h1></div><div><p>Không gian cá nhân của bạn đã sẵn sàng. Quản lý tài khoản, khám phá sản phẩm và tiếp tục hành trình AI TRY-ON theo phong cách riêng.</p><button className="account-logout" type="button" onClick={handleLogout} disabled={loading}><LogOut size={13}/> Đăng xuất</button></div></div>
        <div className="account-hub-grid">
          <Link className="account-hub-card account-hub-card--tryon" to="/ai">
            <span className="account-hub-eyebrow">Tính năng chủ lực · WEARO AI</span>
            <div><h2 className="account-hub-title account-hub-title--hero">Thử outfit lên chính bạn.</h2><p className="account-hub-copy">Tiếp tục với AI Virtual Try-On hoặc mở AI Stylist để tìm cách phối đồ hợp dịp và phong cách của bạn.</p></div>
            <span className="account-hub-arrow">Mở AI Studio <ArrowRight size={17}/></span>
          </Link>
          <Link className="account-hub-card account-hub-card--order" to="/account/orders">
            <div className="account-hub-topline"><span className="account-hub-eyebrow">Đơn hàng · {orderCount} đơn gần đây</span><span className="account-hub-icon"><Package size={20}/></span></div>
            {latestOrder ? <><div><h2 className="account-hub-title">{latestOrder.order_code || "Đơn hàng gần đây"}</h2><p className="account-hub-copy account-hub-copy--order">Đặt ngày {new Date(latestOrder.created_at).toLocaleDateString("vi-VN")} · {formatVnd(latestOrder.total)}</p></div><span className="account-hub-status">{getOrderStatusLabel(latestOrder.order_status)}</span></> : <><h2 className="account-hub-title">Chưa có đơn hàng</h2><p className="account-empty-state">Bạn chưa có đơn hàng nào. Khám phá sản phẩm và đơn mua sẽ xuất hiện tại đây.</p></>}
            <span className="account-hub-arrow">{latestOrder ? "Theo dõi đơn hàng" : "Xem lịch sử đơn"} <ArrowRight size={17}/></span>
          </Link>
          <Link className="account-hub-card account-hub-card--small" to="/account/wishlist">
            <div className="account-hub-topline"><span className="account-hub-eyebrow">Đã lưu</span><span className="account-hub-icon"><Heart size={20}/></span></div>
            <div className="account-hub-value">{wishlistCount} sản phẩm</div><p className="account-hub-subvalue">Danh sách yêu thích của bạn</p>
            <span className="account-hub-arrow">Xem yêu thích <ArrowRight size={17}/></span>
          </Link>
          <Link className="account-hub-card account-hub-card--small" to="/cart">
            <div className="account-hub-topline"><span className="account-hub-eyebrow">Giỏ hàng</span><span className="account-hub-icon"><ShoppingBag size={20}/></span></div>
            <div className="account-hub-value">{cart.count} món</div><p className="account-hub-subvalue">{cart.subtotal > 0 ? `Tạm tính ${formatVnd(cart.subtotal)}` : "Chưa có sản phẩm trong giỏ"}</p>
            <span className="account-hub-arrow">{cart.count > 0 ? "Tiếp tục thanh toán" : "Khám phá sản phẩm"} <ArrowRight size={17}/></span>
          </Link>
          <Link className="account-hub-card account-hub-card--style" to="/ai">
            <div className="account-hub-topline"><span className="account-hub-eyebrow">AI Stylist</span><span className="account-hub-icon"><WandSparkles size={20}/></span></div>
            <h2 className="account-hub-title">Phối đồ theo dịp của bạn</h2><p className="account-hub-copy account-hub-copy--style">Gợi ý outfit theo phong cách và dịp bạn chọn trong AI Studio.</p>
            <span className="account-hub-arrow">Nhận gợi ý phối đồ <ArrowRight size={17}/></span>
          </Link>
          <div className="account-hub-card account-hub-card--profile">
            <div className="account-hub-topline"><span className="account-hub-eyebrow">Hồ sơ tài khoản</span><span className="account-hub-icon"><UserRound size={20}/></span></div>
            <div className="account-profile-row"><span>Tên tài khoản</span><strong>{user.user_metadata?.full_name || user.user_metadata?.name || "Chưa cập nhật"}</strong></div>
            <div className="account-profile-row"><span>Email</span><strong>{user.email || "—"}</strong></div>
            <div className="account-profile-row"><span>Mã tài khoản</span><button className="account-copy-id" type="button" onClick={() => void copyAccountId()}>{copiedAccountId ? <Check size={14}/> : <Copy size={14}/>} {copiedAccountId ? "Đã sao chép" : "Sao chép ID"}</button></div>
            <button className="account-hub-arrow account-hub-action" type="button" onClick={() => { setEmail(user.email || ""); switchMode("recover"); }}>Đặt lại mật khẩu qua email <ArrowRight size={17}/></button>
          </div>
        </div>
      </div> : <div className="account-auth-simple">
        <div className="account-auth-brand" aria-label="WEARO">
          <span className="account-brand-mark">W</span>
          <span>WEARO</span>
        </div>
        <div className="account-auth-heading">
          <h1>{mode === "login" ? "Chào mừng trở lại" : mode === "register" ? "Tạo tài khoản" : mode === "recover" ? "Khôi phục mật khẩu" : "Đặt mật khẩu mới"}</h1>
          <p>{mode === "login" ? "Đăng nhập để tiếp tục trải nghiệm WEARO." : mode === "register" ? "Tạo tài khoản để lưu sản phẩm và quản lý đơn hàng." : mode === "recover" ? "Nhập email để nhận liên kết đặt lại mật khẩu." : "Chọn mật khẩu mới cho tài khoản của bạn."}</p>
        </div>
        {mode === "login" || mode === "register" ? <div className="account-switch" role="tablist" aria-label="Chọn đăng nhập hoặc đăng ký"><button type="button" role="tab" aria-selected={mode === "login"} onClick={() => switchMode("login")}>Đăng nhập</button><button type="button" role="tab" aria-selected={mode === "register"} onClick={() => switchMode("register")}>Đăng ký</button></div> : null}
        <form className="account-form" onSubmit={handleSubmit}>
          {mode === "register" && <div className="account-field"><label htmlFor="account-name">Họ và tên</label><input id="account-name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nhập họ và tên" autoComplete="name" disabled={loading} required /></div>}
          {mode !== "reset" && <div className="account-field"><label htmlFor="account-email">Email</label><input id="account-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="email" disabled={loading} required /></div>}
          {mode !== "recover" && <div className="account-field"><label htmlFor="account-password">{mode === "reset" ? "Mật khẩu mới" : "Mật khẩu"}</label><div className="account-password"><input id="account-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Tối thiểu 6 ký tự" autoComplete={mode === "login" ? "current-password" : "new-password"} disabled={loading} required minLength={6} /><button className="account-eye" type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} disabled={loading}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>}
          {(mode === "register" || mode === "reset") && <div className="account-field"><label htmlFor="account-confirm-password">Xác nhận mật khẩu</label><div className="account-password"><input id="account-confirm-password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu" autoComplete="new-password" disabled={loading} required minLength={6} /><button className="account-eye" type="button" onClick={() => setShowConfirmPassword(v => !v)} aria-label={showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"} disabled={loading}>{showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>}
          {error && <p className="account-feedback account-feedback--error" role="alert">{error}</p>}
          {message && <p className="account-feedback account-feedback--success" role="status">{message}</p>}
          {mode === "login" && <button className="account-link" type="button" onClick={() => switchMode("recover")}>Quên mật khẩu?</button>}
          {mode === "register" && requiresEmailConfirmation && message && !user && <button className="account-resend" type="button" onClick={handleResend} disabled={resending}>{resending ? "Đang gửi…" : "Gửi lại email xác nhận"}</button>}
          <button className="account-submit" type="submit" disabled={loading}>{loading ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : mode === "register" ? "Tạo tài khoản" : mode === "recover" ? "Gửi liên kết khôi phục" : "Cập nhật mật khẩu"}</button>
          {(mode === "recover" || mode === "reset") && <button className="account-link account-back" type="button" onClick={() => { switchMode("login"); if (mode === "reset") clearAccountQuery(); }}>← Quay lại đăng nhập</button>}
        </form>
        {(mode === "login" || mode === "register") && <p className="account-auth-footnote">{mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"} <button type="button" onClick={() => switchMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Đăng ký ngay" : "Đăng nhập"}</button></p>}
      </div>}
    </section><div className="account-bottom"><b>●</b> SYSTEM ONLINE / CUSTOMER ACCOUNT / WEARO 2026</div></div></main><SiteFooter />
  </div>;
}
