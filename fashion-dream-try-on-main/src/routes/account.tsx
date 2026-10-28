import { createFileRoute, Link } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Copy, Eye, EyeOff, Heart, LogOut, Package, ShoppingBag, UserRound, WandSparkles } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { getCustomerSession, requestPasswordReset, signInCustomer, signInWithGoogle, signOutCustomer, updateCustomerPassword } from "@/lib/auth";
import { supabaseConfig } from "@/lib/upthink-supabase";
import { useCart } from "@/lib/cart";
import { listWishlistProductIds } from "@/lib/wishlist";
import { listMyOrders, type CustomerOrder } from "@/lib/order.functions";
import { formatVnd } from "@/data/products";

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

function signInWithFacebook() {
  if (typeof window === "undefined") return;
  const url = new URL(`${supabaseConfig.url}/auth/v1/authorize`);
  url.searchParams.set("provider", "facebook");
  url.searchParams.set("redirect_to", `${window.location.origin}/account`);
  window.location.assign(url.toString());
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
    const onAuth = () => void loadUser();
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
          await loadUser();
        } else {
          setRequiresEmailConfirmation(true);
          setMessage("Đăng ký thành công. Kiểm tra email để xác nhận tài khoản trước khi đăng nhập.");
        }
      } else {
        await signInCustomer(email, password); setPassword(""); setMessage("Đăng nhập thành công."); await loadUser();
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
      if (!user) { setWishlistCount(0); setLatestOrder(null); return; }
      try {
        const session = getCustomerSession();
        const wishlistPromise = listWishlistProductIds(user.id);
        const ordersPromise = session?.access_token
          ? listMyOrders({ data: { accessToken: session.access_token, limit: 1 } })
          : Promise.resolve({ orders: [] as CustomerOrder[] });
        const [wishlistIds, orderResult] = await Promise.all([wishlistPromise, ordersPromise]);
        if (active) { setWishlistCount(wishlistIds.length); setLatestOrder(orderResult.orders[0] ?? null); }
      } catch {
        if (active) { setWishlistCount(0); setLatestOrder(null); }
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
    <style>{`
      .account-page{--cream:#f7f1e7;--orange:#f0a500;--ink:#1b1a17;min-height:100vh;background:var(--ink);color:var(--cream);isolation:isolate}.account-content{position:relative;min-height:calc(100svh - 96px);overflow:hidden;background:var(--ink)}.account-content:before{content:"";position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1763328719057-ff6b03c816d0?auto=format&fit=crop&w=2400&q=85') center top/cover no-repeat;z-index:0}.account-content:after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,transparent 45%,rgba(27,26,23,.08) 58%,rgba(27,26,23,.28) 78%,rgba(27,26,23,.82) 100%);z-index:1;pointer-events:none}.account-shell{position:relative;z-index:2;width:min(1180px,calc(100vw - 48px));min-height:calc(100svh - 96px);margin:auto;padding:30px 0 42px;display:flex;flex-direction:column}.account-main{flex:1;display:flex;align-items:center;padding:34px 0 12px}.account-loading{min-height:calc(100svh - 96px);display:grid;place-items:center;color:var(--orange);font:800 9px Arial;letter-spacing:.22em}.account-auth-grid{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center}.account-kicker,.account-kicker-small{color:var(--orange);font:800 10px/1.3 Arial;letter-spacing:.2em}.account-title{margin:12px 0 0;font-family:"Be Vietnam Pro","Space Grotesk",Arial,sans-serif;font-size:clamp(58px,8vw,112px);font-weight:900;line-height:.9;letter-spacing:-.055em;text-transform:uppercase}.account-title span{display:block}.account-title .accent{color:var(--orange)}.account-copy{max-width:430px;margin:28px 0 0;color:rgba(247,241,231,.78);font-size:13px;line-height:1.7}.account-card{background:rgba(27,26,23,.88);border:1px solid rgba(247,241,231,.18);border-left:3px solid var(--orange);padding:32px;box-shadow:18px 18px 0 rgba(0,0,0,.22)}.account-card-head{display:flex;justify-content:space-between;gap:20px;margin-bottom:22px}.account-card h2{margin:7px 0 0;font:600 30px/1.1 Georgia,serif}.account-number{display:grid;place-items:center;width:32px;height:32px;border:1px solid rgba(240,165,0,.65);color:var(--orange);font:800 8px Arial}.account-switch{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid rgba(247,241,231,.18);border-bottom:1px solid rgba(247,241,231,.18);margin-bottom:24px}.account-switch button{position:relative;padding:12px;border:0;background:transparent;color:rgba(247,241,231,.45);font:800 8px Arial;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}.account-switch button[aria-selected=true]{color:var(--cream)}.account-switch button[aria-selected=true]:after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;background:var(--orange)}.account-form{display:flex;flex-direction:column;gap:16px}.account-field{display:flex;flex-direction:column;gap:7px}.account-field label{font:800 8px Arial;letter-spacing:.14em;text-transform:uppercase;color:rgba(247,241,231,.68)}.account-field input{height:46px;width:100%;padding:0 12px;border:1px solid rgba(247,241,231,.18);background:rgba(0,0,0,.22);color:var(--cream);outline:none;border-radius:0}.account-field input:focus{border-color:var(--orange)}.account-password{position:relative}.account-password input{padding-right:46px}.account-eye{position:absolute;right:3px;top:3px;width:40px;height:40px;border:0;background:transparent;color:rgba(247,241,231,.55);cursor:pointer}.account-feedback{margin:0;font:9px/1.55 Arial}.account-feedback--error{color:#ffc5a8}.account-feedback--success{color:var(--cream)}.account-submit{min-height:48px;border:0;background:var(--orange);color:var(--ink);font:900 9px Arial;letter-spacing:.16em;text-transform:uppercase;cursor:pointer}.account-submit:disabled{opacity:.55;cursor:wait}.account-resend,.account-link{border:0;background:transparent;color:var(--orange);font:800 8px Arial;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;text-align:left}.account-link{display:inline-block;margin-top:-5px;text-decoration:none}.account-back{margin-top:4px}.account-google-wrap{display:flex;align-items:center;gap:10px;margin:24px 0 12px;color:rgba(247,241,231,.35);font:700 7px Arial;letter-spacing:.16em}.account-google-wrap:before,.account-google-wrap:after{content:"";height:1px;flex:1;background:rgba(247,241,231,.15)}.account-socials{display:grid;grid-template-columns:1fr 1fr;gap:10px}.account-social{height:46px;display:flex;align-items:center;justify-content:center;gap:9px;border:1px solid rgba(247,241,231,.22);background:rgba(0,0,0,.16);color:var(--cream);font:800 8px Arial;letter-spacing:.1em;text-transform:uppercase;cursor:pointer}.account-social:hover{border-color:var(--orange);background:rgba(240,165,0,.06)}.account-social img{width:20px;height:20px;object-fit:contain}.account-dashboard{width:100%}.account-welcome{display:flex;justify-content:space-between;align-items:flex-end;gap:30px;border-bottom:1px solid rgba(247,241,231,.18);padding-bottom:26px}.account-welcome h1{margin:8px 0 0;font-family:"Be Vietnam Pro","Space Grotesk",Arial,sans-serif;font-size:clamp(42px,6vw,78px);font-weight:900;line-height:.94;letter-spacing:-.045em;text-transform:uppercase}.account-welcome h1 span{color:var(--orange)}.account-welcome p{max-width:460px;color:rgba(247,241,231,.72);font-size:12px;line-height:1.7}.account-logout{display:inline-flex;align-items:center;gap:7px;margin-top:12px;border:1px solid rgba(247,241,231,.2);background:transparent;color:rgba(247,241,231,.78);padding:10px 13px;font:800 8px Arial;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}.account-modules{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-top:18px}.account-module{min-height:150px;padding:20px;border:1px solid rgba(247,241,231,.15);background:rgba(27,26,23,.6);color:var(--cream);text-decoration:none;display:flex;flex-direction:column;justify-content:space-between}.account-module:hover{border-color:rgba(240,165,0,.55);background:rgba(240,165,0,.07)}.account-module-icon{color:var(--orange)}.account-module strong{font-size:13px}.account-module small{display:block;margin-top:6px;color:rgba(247,241,231,.52);font:800 8px Arial;letter-spacing:.12em;text-transform:uppercase}.account-profile{margin-top:18px;display:grid;grid-template-columns:1.3fr .7fr;gap:12px}.account-profile-card{padding:22px;border:1px solid rgba(247,241,231,.15);background:rgba(27,26,23,.66)}.account-profile-card h3{display:flex;align-items:center;margin:0 0 16px;color:var(--orange);font:800 12px/1.3 Arial;letter-spacing:.14em;text-transform:uppercase}.account-profile-row{display:flex;justify-content:space-between;gap:20px;padding:11px 0;border-bottom:1px solid rgba(247,241,231,.1);font-size:13px}.account-profile-row:last-child{border-bottom:0}.account-profile-row span{color:rgba(247,241,231,.5)}.account-profile-row strong{font-weight:600;text-align:right}.account-note{color:rgba(247,241,231,.72);font-size:14px;line-height:1.8}.account-bottom{padding-top:20px;color:rgba(247,241,231,.4);font:800 8px Arial;letter-spacing:.15em;text-transform:uppercase}.account-bottom b{color:var(--orange)}
      @media(max-width:900px){.account-shell{width:min(100% - 40px,720px)}.account-auth-grid{grid-template-columns:1fr;gap:30px}.account-profile{grid-template-columns:1fr}.account-welcome{align-items:flex-start;flex-direction:column}.account-title{font-size:clamp(54px,15vw,84px)}}@media(max-width:560px){.account-shell{width:calc(100vw - 28px);padding:24px 0 30px}.account-main{padding:30px 0}.account-card{padding:22px 18px}.account-socials{gap:8px}.account-welcome h1{font-size:clamp(38px,11vw,60px)}}
      .account-main:has(.account-dashboard){align-items:flex-start}.account-dashboard{max-width:1120px;margin:0 auto}.account-welcome{align-items:center;gap:28px;padding:28px 0 24px}.account-welcome h1{max-width:760px;font-size:clamp(36px,5.2vw,64px);line-height:1.02;overflow-wrap:anywhere}.account-welcome h1 span{display:block;margin-top:5px;color:#f2ad94}.account-welcome p{font-size:14px;margin:0;max-width:360px}.account-logout{min-height:44px;font-size:10px;border-radius:10px;padding:0 15px}.account-hub-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px;margin-top:22px}.account-hub-card{min-width:0;position:relative;display:flex;flex-direction:column;gap:16px;padding:22px;border:1px solid rgba(247,241,231,.16);border-radius:14px;background:rgba(25,29,32,.82);color:var(--cream);text-decoration:none;box-shadow:0 12px 32px rgba(0,0,0,.12);transition:transform .18s ease,border-color .18s ease,background .18s ease}.account-hub-card:hover{transform:translateY(-2px);border-color:rgba(242,173,148,.68);background:rgba(39,45,49,.94)}.account-hub-card:focus-visible,.account-copy-id:focus-visible{outline:2px solid #f2ad94;outline-offset:3px}.account-hub-card--tryon{grid-column:span 7;min-height:250px;justify-content:space-between;overflow:hidden;background:linear-gradient(125deg,rgba(34,48,57,.96),rgba(25,29,32,.93) 65%,rgba(84,114,140,.55))}.account-hub-card--tryon:after{content:"AI";position:absolute;right:22px;top:8px;color:rgba(242,173,148,.10);font-size:clamp(100px,17vw,210px);font-weight:900;line-height:1;pointer-events:none}.account-hub-card--order{grid-column:span 5;min-height:250px}.account-hub-card--small{grid-column:span 4;min-height:174px}.account-hub-card--style{grid-column:span 5;min-height:174px}.account-hub-card--profile{grid-column:span 7;min-height:174px;cursor:default}.account-hub-card--profile:hover{transform:none;border-color:rgba(247,241,231,.16);background:rgba(25,29,32,.82)}.account-hub-eyebrow{position:relative;z-index:1;color:#f2ad94;font:800 10px/1.4 Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase}.account-hub-title{position:relative;z-index:1;margin:0;font-size:clamp(21px,2.4vw,30px);line-height:1.15;font-weight:750;letter-spacing:-.025em}.account-hub-copy{position:relative;z-index:1;margin:0;color:rgba(247,241,231,.78);font-size:14px;line-height:1.65;max-width:480px}.account-hub-meta{display:flex;align-items:center;gap:10px;color:rgba(247,241,231,.84);font-size:13px;line-height:1.5}.account-hub-meta svg{flex:none;color:#f2ad94}.account-hub-topline{display:flex;align-items:center;justify-content:space-between;gap:12px}.account-hub-icon{display:grid;place-items:center;flex:none;width:42px;height:42px;border:1px solid rgba(242,173,148,.35);border-radius:12px;color:#f2ad94;background:rgba(242,173,148,.07)}.account-hub-arrow{display:flex;align-items:center;gap:8px;min-height:44px;align-self:flex-start;margin-top:auto;color:#f2ad94;font-size:13px;font-weight:700}.account-hub-arrow svg{transition:transform .18s ease}.account-hub-card:hover .account-hub-arrow svg{transform:translateX(3px)}.account-hub-value{font-size:26px;font-weight:800;line-height:1.1;letter-spacing:-.03em}.account-hub-subvalue{color:rgba(247,241,231,.7);font-size:13px;line-height:1.5}.account-hub-status{display:inline-flex;align-items:center;gap:7px;align-self:flex-start;padding:7px 10px;border:1px solid rgba(242,173,148,.3);border-radius:999px;color:#f2c6b6;font-size:11px;font-weight:700}.account-profile-card{padding:22px;border-radius:14px;background:rgba(25,29,32,.82);border-color:rgba(247,241,231,.16)}.account-profile-card h3{font-size:13px;letter-spacing:.1em}.account-profile-row{gap:16px;font-size:14px}.account-profile-row span{color:rgba(247,241,231,.72)}.account-profile-row strong{overflow-wrap:anywhere}.account-profile-row:last-child{align-items:center}.account-copy-id{display:inline-flex;align-items:center;gap:7px;min-height:36px;padding:6px 9px;border:1px solid rgba(247,241,231,.2);border-radius:8px;background:transparent;color:#f2ad94;cursor:pointer;font-size:11px}.account-style-tags{display:flex;flex-wrap:wrap;gap:8px}.account-style-tags span{padding:7px 10px;border:1px solid rgba(247,241,231,.2);border-radius:999px;color:rgba(247,241,231,.88);font-size:12px}.account-empty-state{color:rgba(247,241,231,.72);font-size:13px;line-height:1.6}.account-hub-link{color:inherit;text-decoration:none}.account-hub-link:focus-visible{outline:2px solid #f2ad94;outline-offset:3px}@media(max-width:800px){.account-hub-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.account-hub-card--tryon,.account-hub-card--order,.account-hub-card--small,.account-hub-card--style,.account-hub-card--profile{grid-column:span 1}.account-hub-card--tryon{grid-column:1/-1;min-height:220px}.account-hub-card--order{grid-column:1/-1;min-height:190px}.account-hub-card--profile{grid-column:1/-1}.account-welcome{align-items:flex-start}.account-welcome>div:last-child{max-width:none}.account-hub-card{padding:18px}}@media(max-width:520px){.account-hub-grid{grid-template-columns:1fr}.account-hub-card--tryon,.account-hub-card--order,.account-hub-card--small,.account-hub-card--style,.account-hub-card--profile{grid-column:1}.account-hub-card--tryon{min-height:220px}.account-hub-card--order{min-height:190px}.account-welcome h1{font-size:clamp(34px,10vw,48px)}.account-hub-card{min-height:150px;padding:18px}.account-profile-row{align-items:flex-start;flex-direction:column}.account-profile-row strong{text-align:left}}
    `}</style>
    <SiteNav />
    <main className="account-content"><div className="account-shell"><section className="account-main">
      {user && mode !== "reset" ? <div className="account-dashboard">
        <div className="account-welcome"><div><div className="account-kicker">WEARO / PERSONAL FASHION SYSTEM</div><h1>CHÀO MỪNG <span>{user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "BẠN"}</span></h1></div><div><p>Không gian cá nhân của bạn đã sẵn sàng. Quản lý tài khoản, khám phá sản phẩm và tiếp tục hành trình AI TRY-ON theo phong cách riêng.</p><button className="account-logout" type="button" onClick={handleLogout} disabled={loading}><LogOut size={13}/> Đăng xuất</button></div></div>
        <div className="account-hub-grid">
          <Link className="account-hub-card account-hub-card--tryon" to="/ai">
            <span className="account-hub-eyebrow">Tính năng chủ lực · WEARO AI</span>
            <div><h2 className="account-hub-title" style={{fontSize:"clamp(28px,4vw,44px)",maxWidth:460}}>Thử outfit lên chính bạn.</h2><p className="account-hub-copy" style={{marginTop:12}}>Tiếp tục với AI Virtual Try-On hoặc mở AI Stylist để tìm cách phối đồ hợp dịp và phong cách của bạn.</p></div>
            <span className="account-hub-arrow">Mở AI Studio <ArrowRight size={17}/></span>
          </Link>
          <Link className="account-hub-card account-hub-card--order" to="/account/orders">
            <div className="account-hub-topline"><span className="account-hub-eyebrow">Đơn hàng</span><span className="account-hub-icon"><Package size={20}/></span></div>
            {latestOrder ? <><div><h2 className="account-hub-title">{latestOrder.order_code || "Đơn hàng gần đây"}</h2><p className="account-hub-copy" style={{marginTop:8}}>Đặt ngày {new Date(latestOrder.created_at).toLocaleDateString("vi-VN")} · {formatVnd(latestOrder.total)}</p></div><span className="account-hub-status">{getOrderStatusLabel(latestOrder.order_status)}</span></> : <><h2 className="account-hub-title">Theo dõi đơn mua</h2><p className="account-empty-state">Xem trạng thái giao hàng và chi tiết các đơn hàng của bạn tại đây.</p></>}
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
            <h2 className="account-hub-title">Phối đồ theo dịp của bạn</h2><div className="account-style-tags"><span>Casual</span><span>Basic</span><span>Streetwear</span><span>Đi chơi</span></div>
            <span className="account-hub-arrow">Nhận gợi ý phối đồ <ArrowRight size={17}/></span>
          </Link>
          <div className="account-hub-card account-hub-card--profile">
            <div className="account-hub-topline"><span className="account-hub-eyebrow">Hồ sơ tài khoản</span><span className="account-hub-icon"><UserRound size={20}/></span></div>
            <div className="account-profile-row"><span>Tên tài khoản</span><strong>{user.user_metadata?.full_name || user.user_metadata?.name || "Chưa cập nhật"}</strong></div>
            <div className="account-profile-row"><span>Email</span><strong>{user.email || "—"}</strong></div>
            <div className="account-profile-row"><span>Mã tài khoản</span><button className="account-copy-id" type="button" onClick={() => void copyAccountId()}>{copiedAccountId ? <Check size={14}/> : <Copy size={14}/>} {copiedAccountId ? "Đã sao chép" : "Sao chép ID"}</button></div>
            <button className="account-hub-arrow" type="button" style={{border:0,background:"transparent",padding:0,cursor:"pointer"}} onClick={() => { setEmail(user.email || ""); switchMode("recover"); }}>Đặt lại mật khẩu qua email <ArrowRight size={17}/></button>
          </div>
        </div>
      </div> : <div className="account-auth-grid"><div><div className="account-kicker">WEARO / MEMBER ACCESS</div><h1 className="account-title"><span>YOUR</span><span>STYLE.</span><span className="accent">YOUR ID.</span></h1><p className="account-copy">Đăng nhập để lưu phong cách, quản lý trải nghiệm mua sắm và tiếp tục hành trình thử đồ AI của bạn.</p></div>
        <div className="account-card"><div className="account-card-head"><div><div className="account-kicker-small">Account / Access</div><h2>{mode === "login" ? "Welcome back" : mode === "register" ? "Create account" : mode === "recover" ? "Recover account" : "Set new password"}</h2></div><span className="account-number">{mode === "login" ? "01" : mode === "register" ? "02" : mode === "recover" ? "03" : "04"}</span></div>
          {mode === "login" || mode === "register" ? <div className="account-switch" role="tablist" aria-label="Account mode"><button type="button" role="tab" aria-selected={mode === "login"} onClick={()=>switchMode("login")}>Đăng nhập</button><button type="button" role="tab" aria-selected={mode === "register"} onClick={()=>switchMode("register")}>Đăng ký</button></div> : null}
          <form className="account-form" onSubmit={handleSubmit}>
            {mode === "register" && <div className="account-field"><label htmlFor="account-name">Tên tài khoản</label><input id="account-name" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Tên hiển thị của bạn" autoComplete="name" disabled={loading} required/></div>}
            {mode !== "reset" && <div className="account-field"><label htmlFor="account-email">Email</label><input id="account-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" disabled={loading} required/></div>}
            {mode !== "recover" && <div className="account-field"><label htmlFor="account-password">{mode === "reset" ? "Mật khẩu mới" : "Mật khẩu"}</label><div className="account-password"><input id="account-password" type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === "login" ? "current-password" : "new-password"} disabled={loading} required minLength={6}/><button className="account-eye" type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"Ẩn mật khẩu":"Hiện mật khẩu"} disabled={loading}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></div>}
            {(mode === "register" || mode === "reset") && <div className="account-field"><label htmlFor="account-confirm-password">Xác nhận mật khẩu</label><div className="account-password"><input id="account-confirm-password" type={showConfirmPassword?"text":"password"} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" disabled={loading} required minLength={6}/><button className="account-eye" type="button" onClick={()=>setShowConfirmPassword(v=>!v)} aria-label={showConfirmPassword?"Ẩn mật khẩu xác nhận":"Hiện mật khẩu xác nhận"} disabled={loading}>{showConfirmPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></div>}
            {error && <p className="account-feedback account-feedback--error" role="alert">{error}</p>}{message && <p className="account-feedback account-feedback--success" role="status">{message}</p>}
            {mode === "login" && <button className="account-link" type="button" onClick={()=>switchMode("recover")}>Quên mật khẩu?</button>}
            {mode === "register" && requiresEmailConfirmation && message && !user && <button className="account-resend" type="button" onClick={handleResend} disabled={resending}>{resending?"Đang gửi…":"Gửi lại email xác nhận"}</button>}
            <button className="account-submit" type="submit" disabled={loading}>{loading?"Đang xử lý…":mode === "login"?"Đăng nhập":mode === "register"?"Tạo tài khoản":mode === "recover"?"Gửi email khôi phục":"Cập nhật mật khẩu"}</button>
            {mode === "recover" && <button className="account-link account-back" type="button" onClick={()=>switchMode("login")}>← Quay lại đăng nhập</button>}{mode === "reset" && <button className="account-link account-back" type="button" onClick={()=>{switchMode("login");clearAccountQuery();}}>← Quay lại đăng nhập</button>}
          </form>
          {(mode === "login" || mode === "register") && <><div className="account-google-wrap"><span>OR CONTINUE WITH</span></div><div className="account-socials"><button className="account-social" type="button" onClick={signInWithGoogle} disabled={loading}><img src="/brand/google-g.svg" alt="Google"/><span>Google</span></button><button className="account-social" type="button" onClick={signInWithFacebook} disabled={loading}><img src="/brand/facebook.svg" alt="Facebook"/><span>Facebook</span></button></div></>}
        </div>
      </div>}
    </section><div className="account-bottom"><b>●</b> SYSTEM ONLINE / CUSTOMER ACCOUNT / WEARO 2026</div></div></main><SiteFooter />
  </div>;
}
