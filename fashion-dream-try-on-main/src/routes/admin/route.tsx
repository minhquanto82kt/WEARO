import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { checkAdmin, getSession, signIn, signOut, supabaseConfig } from "@/lib/upthink-supabase";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Admin — Fashion Dream" }] }),
});

function AdminLayout() {
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  async function verifySession() {
    setReady(false);
    setLoginError("");
    try {
      if (!supabaseConfig.url || !supabaseConfig.key || !getSession()) {
        setAuthorized(false);
        return;
      }

      setAuthorized(Boolean(await checkAdmin()));
    } catch (error) {
      setAuthorized(false);
      setLoginError(error instanceof Error ? error.message : "Không thể xác thực admin.");
    } finally {
      setReady(true);
    }
  }

  useEffect(() => {
    void verifySession();
  }, []);

  function getLoginErrorMessage(error: unknown) {
    const message = error instanceof Error ? error.message : "";
    const normalized = message.toLowerCase();

    if (normalized.includes("chưa được cấp quyền admin")) {
      return "Tài khoản hợp lệ nhưng chưa được cấp quyền Admin. Hãy liên hệ người quản trị để được cấp quyền truy cập.";
    }
    if (!supabaseConfig.url || !supabaseConfig.key) {
      return "Hệ thống đăng nhập chưa được cấu hình. Vui lòng báo quản trị viên kiểm tra cấu hình Supabase.";
    }
    if (
      normalized.includes("invalid login credentials") ||
      normalized.includes("invalid email or password") ||
      normalized.includes("email not confirmed") ||
      normalized.includes("user not found") ||
      normalized.includes("invalid email")
    ) {
      return "Email hoặc mật khẩu chưa chính xác. Vui lòng kiểm tra và thử lại.";
    }
    if (
      normalized.includes("network") ||
      normalized.includes("fetch") ||
      normalized.includes("timeout")
    ) {
      return "Không thể kết nối tới dịch vụ đăng nhập. Kiểm tra kết nối mạng rồi thử lại.";
    }
    return "Đăng nhập chưa thành công. Vui lòng thử lại; nếu vẫn gặp lỗi, hãy liên hệ quản trị viên.";
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    if (loggingIn) return;
    setLoginError("");
    setLoggingIn(true);

    try {
      if (!supabaseConfig.url || !supabaseConfig.key) {
        throw new Error("Supabase chưa được cấu hình.");
      }

      await signIn(loginEmail.trim(), loginPassword);
      const isAdmin = await checkAdmin();

      if (!isAdmin) {
        await signOut();
        throw new Error("Tài khoản đã đăng nhập nhưng chưa được cấp quyền Admin.");
      }

      setAuthorized(true);
      setLoginPassword("");
    } catch (error) {
      setAuthorized(false);
      setLoginPassword("");
      setLoginError(getLoginErrorMessage(error));
    } finally {
      setLoggingIn(false);
      setReady(true);
    }
  }

  if (!ready) {
    return (
      <div className="fd-admin-login-page fd-admin-login-page--loading">
        <div className="fd-admin-loading-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p>Đang xác thực tài khoản admin…</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <>
        <style>{`
          .fd-admin-login-page {
            --fd-ink: #11100f;
            --fd-paper: #f2eee7;
            --fd-paper-soft: #e8e1d8;
            --fd-accent: #d7ff3f;
            --fd-muted: #8c8780;
            position: relative;
            min-height: 100vh;
            min-height: 100dvh;
            overflow: hidden;
            display: grid;
            grid-template-columns: minmax(0, 1.08fr) minmax(420px, .92fr);
            background: var(--fd-ink);
            color: var(--fd-paper);
            font-family: var(--ft-body, "Space Grotesk", sans-serif);
          }

          .fd-admin-login-page::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            opacity: .3;
            background-image:
              linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px);
            background-size: 64px 64px;
            mask-image: linear-gradient(90deg, black 0%, transparent 75%);
          }

          .fd-admin-login-page::after {
            content: "ADMIN / 01";
            position: absolute;
            top: 28px;
            right: 32px;
            z-index: 4;
            color: rgba(255,255,255,.35);
            font: 500 9px/1 var(--ft-meta, "Oswald", sans-serif);
            letter-spacing: .2em;
          }

          .fd-admin-login-page--loading {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 18px;
          }

          .fd-admin-login-page--loading p {
            margin: 0;
            color: rgba(255,255,255,.55);
            font-size: 11px;
            letter-spacing: .14em;
            text-transform: uppercase;
          }

          .fd-admin-loading-mark {
            display: flex;
            gap: 5px;
          }

          .fd-admin-loading-mark span {
            width: 7px;
            height: 7px;
            background: var(--fd-accent);
            animation: fd-admin-pulse 1s ease-in-out infinite;
          }

          .fd-admin-loading-mark span:nth-child(2) { animation-delay: .12s; }
          .fd-admin-loading-mark span:nth-child(3) { animation-delay: .24s; }

          @keyframes fd-admin-pulse {
            0%, 100% { transform: translateY(0); opacity: .35; }
            50% { transform: translateY(-6px); opacity: 1; }
          }

          .fd-admin-login-visual {
            position: relative;
            min-height: 100vh;
            padding: 46px 7vw 42px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            border-right: 1px solid rgba(255,255,255,.12);
            isolation: isolate;
          }

          .fd-admin-login-visual::before {
            content: "";
            position: absolute;
            width: min(48vw, 620px);
            height: min(48vw, 620px);
            left: 5%;
            top: 17%;
            z-index: -1;
            border-radius: 50%;
            background:
              radial-gradient(circle at 36% 32%, rgba(215,255,63,.9), transparent 2%),
              radial-gradient(circle at 58% 48%, rgba(215,255,63,.22), transparent 32%),
              radial-gradient(circle at center, rgba(215,255,63,.08), transparent 66%);
            filter: blur(.2px);
            transform: rotate(-18deg);
          }

          .fd-admin-login-visual::after {
            content: "FD";
            position: absolute;
            left: 7%;
            top: 24%;
            z-index: -1;
            color: transparent;
            -webkit-text-stroke: 1px rgba(255,255,255,.12);
            font: 400 clamp(180px, 25vw, 390px)/.75 var(--ft-display, "Anton", sans-serif);
            letter-spacing: -.08em;
          }

          .fd-admin-brand {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            width: fit-content;
            color: var(--fd-paper);
            text-decoration: none;
          }

          .fd-admin-brand__mark {
            width: 34px;
            height: 34px;
            display: grid;
            place-items: center;
            background: var(--fd-accent);
            color: var(--fd-ink);
            font: 400 16px/1 var(--ft-display, "Anton", sans-serif);
          }

          .fd-admin-brand__name {
            font: 400 19px/1 var(--ft-display, "Anton", sans-serif);
            letter-spacing: .12em;
          }

          .fd-admin-brand__meta {
            display: block;
            margin-top: 4px;
            color: var(--fd-accent);
            font: 500 8px/1 var(--ft-meta, "Oswald", sans-serif);
            letter-spacing: .22em;
          }

          .fd-admin-editorial {
            position: relative;
            max-width: 760px;
            margin-top: auto;
            margin-bottom: auto;
            padding-top: 10vh;
          }

          .fd-admin-editorial__eyebrow {
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--fd-accent);
            font: 500 10px/1 var(--ft-meta, "Oswald", sans-serif);
            letter-spacing: .22em;
            text-transform: uppercase;
          }

          .fd-admin-editorial__eyebrow::before {
            content: "";
            width: 32px;
            height: 1px;
            background: var(--fd-accent);
          }

          .fd-admin-editorial h1 {
            max-width: 760px;
            margin: 22px 0 22px;
            font: 400 clamp(72px, 9vw, 142px)/.78 var(--ft-display, "Anton", sans-serif);
            letter-spacing: -.035em;
            text-transform: uppercase;
          }

          .fd-admin-editorial h1 em {
            display: block;
            color: var(--fd-accent);
            font-style: normal;
          }

          .fd-admin-editorial p {
            max-width: 430px;
            margin: 0;
            color: rgba(242,238,231,.62);
            font-size: 13px;
            line-height: 1.7;
          }

          .fd-admin-stats {
            display: flex;
            gap: 36px;
            margin-top: 38px;
          }

          .fd-admin-stat {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .fd-admin-stat strong {
            color: var(--fd-paper);
            font: 400 25px/1 var(--ft-display, "Anton", sans-serif);
          }

          .fd-admin-stat span {
            color: rgba(242,238,231,.4);
            font: 500 8px/1 var(--ft-meta, "Oswald", sans-serif);
            letter-spacing: .16em;
            text-transform: uppercase;
          }

          .fd-admin-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            color: rgba(242,238,231,.3);
            font: 500 8px/1 var(--ft-meta, "Oswald", sans-serif);
            letter-spacing: .15em;
            text-transform: uppercase;
          }

          .fd-admin-footer__line {
            flex: 1;
            height: 1px;
            background: rgba(255,255,255,.12);
          }

          .fd-admin-login-panel {
            position: relative;
            z-index: 2;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 90px clamp(28px, 6vw, 92px);
            background: var(--fd-paper);
            color: var(--fd-ink);
          }

          .fd-admin-login-panel::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: linear-gradient(135deg, rgba(255,255,255,.7), transparent 45%);
          }

          .fd-admin-login-card {
            position: relative;
            width: min(100%, 430px);
          }

          .fd-admin-login-card__topline {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 46px;
            padding-bottom: 13px;
            border-bottom: 1px solid rgba(17,16,15,.16);
            color: rgba(17,16,15,.46);
            font: 500 8px/1 var(--ft-meta, "Oswald", sans-serif);
            letter-spacing: .18em;
            text-transform: uppercase;
          }

          .fd-admin-login-card__status {
            display: inline-flex;
            align-items: center;
            gap: 7px;
          }

          .fd-admin-login-card__status::before {
            content: "";
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #78a900;
            box-shadow: 0 0 0 4px rgba(120,169,0,.1);
          }

          .fd-admin-login-card h2 {
            margin: 0;
            font: 400 clamp(48px, 5vw, 68px)/.88 var(--ft-display, "Anton", sans-serif);
            letter-spacing: -.025em;
            text-transform: uppercase;
          }

          .fd-admin-login-card__intro {
            max-width: 390px;
            margin: 18px 0 38px;
            color: rgba(17,16,15,.56);
            font-size: 12px;
            line-height: 1.7;
          }

          .fd-admin-login-card__intro code {
            padding: 2px 5px;
            background: rgba(17,16,15,.06);
            color: rgba(17,16,15,.72);
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 10px;
          }

          .fd-admin-login-form {
            display: grid;
            gap: 22px;
          }

          .fd-admin-field {
            display: grid;
            gap: 9px;
          }

          .fd-admin-field > span {
            color: rgba(17,16,15,.58);
            font: 500 9px/1 var(--ft-meta, "Oswald", sans-serif);
            letter-spacing: .17em;
            text-transform: uppercase;
          }

          .fd-admin-field input {
            width: 100%;
            min-height: 52px;
            box-sizing: border-box;
            padding: 0 15px;
            border: 1px solid rgba(17,16,15,.18);
            border-radius: 0;
            outline: none;
            background: rgba(255,255,255,.28);
            color: var(--fd-ink);
            font: 500 13px/1 var(--ft-body, "Space Grotesk", sans-serif);
            transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
          }

          .fd-admin-field input::placeholder {
            color: rgba(17,16,15,.28);
          }

          .fd-admin-field input:focus {
            border-color: var(--fd-ink);
            background: #fff;
            box-shadow: 4px 4px 0 rgba(17,16,15,.08);
          }

          .fd-admin-password-wrap {
            position: relative;
          }

          .fd-admin-password-wrap input {
            padding-right: 54px;
          }

          .fd-admin-password-toggle {
            position: absolute;
            top: 50%;
            right: 6px;
            width: 40px;
            height: 40px;
            display: grid;
            place-items: center;
            transform: translateY(-50%);
            border: 0;
            border-radius: 0;
            background: transparent;
            color: rgba(17,16,15,.5);
            cursor: pointer;
          }

          .fd-admin-password-toggle:hover {
            color: var(--fd-ink);
            background: rgba(17,16,15,.05);
          }

          .fd-admin-password-toggle svg {
            width: 18px;
            height: 18px;
            fill: none;
            stroke: currentColor;
            stroke-width: 1.6;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .fd-admin-error {
            padding: 13px 14px;
            border-left: 2px solid #9b2c2c;
            background: rgba(155,44,44,.07);
            color: #7f2424;
            font-size: 11px;
            line-height: 1.55;
          }

          .fd-admin-submit {
            position: relative;
            width: 100%;
            min-height: 56px;
            margin-top: 2px;
            border: 1px solid var(--fd-ink);
            border-radius: 0;
            background: var(--fd-ink);
            color: var(--fd-paper);
            cursor: pointer;
            font: 400 12px/1 var(--ft-display, "Anton", sans-serif);
            letter-spacing: .12em;
            text-transform: uppercase;
            transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
          }

          .fd-admin-submit:hover:not(:disabled) {
            transform: translate(4px, 4px);
            box-shadow: -4px -4px 0 var(--fd-accent);
          }

          .fd-admin-submit:disabled {
            cursor: wait;
            opacity: .55;
          }

          .fd-admin-secure-note {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-top: 24px;
            color: rgba(17,16,15,.38);
            font-size: 10px;
            line-height: 1.55;
          }

          .fd-admin-secure-note svg {
            flex: 0 0 auto;
            width: 15px;
            height: 15px;
            margin-top: 1px;
            fill: none;
            stroke: currentColor;
            stroke-width: 1.5;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          @media (max-width: 900px) {
            .fd-admin-login-page {
              display: flex;
              flex-direction: column;
              overflow-y: auto;
            }

            .fd-admin-login-panel {
              order: 1;
            }

            .fd-admin-login-visual {
              order: 2;
              min-height: auto;
              padding: 28px 28px 24px;
              border-right: 0;
              border-bottom: 0;
              border-top: 1px solid rgba(255,255,255,.12);
            }

            .fd-admin-editorial {
              padding-top: 55px;
            }

            .fd-admin-editorial h1 {
              font-size: clamp(60px, 14vw, 96px);
            }

            .fd-admin-editorial p,
            .fd-admin-stats {
              display: none;
            }

            .fd-admin-footer {
              margin-top: 50px;
            }

            .fd-admin-login-visual {
              min-height: 280px;
              padding: 26px 28px;
            }

            .fd-admin-editorial {
              padding-top: 34px;
            }

            .fd-admin-editorial h1 {
              margin: 14px 0;
              font-size: clamp(58px, 12vw, 82px);
            }

            .fd-admin-login-panel {
              min-height: auto;
              padding: 48px 28px 44px;
            }

            .fd-admin-login-card__topline {
              margin-bottom: 26px;
            }

            .fd-admin-login-card__intro {
              margin: 14px 0 24px;
            }

            .fd-admin-login-form {
              gap: 16px;
            }
          }

          /* Keep the complete sign-in flow comfortably visible on shorter laptop screens. */
          @media (min-width: 901px) and (max-height: 820px) {
            .fd-admin-login-visual {
              min-height: 100dvh;
              padding: 28px 5vw 24px;
            }

            .fd-admin-editorial {
              padding-top: 0;
            }

            .fd-admin-editorial h1 {
              margin: 16px 0;
              font-size: clamp(64px, 7vw, 100px);
              line-height: .84;
            }

            .fd-admin-editorial p {
              font-size: 12px;
              line-height: 1.5;
            }

            .fd-admin-stats {
              margin-top: 20px;
            }

            .fd-admin-login-panel {
              min-height: 100dvh;
              padding: 54px clamp(28px, 4vw, 64px);
            }

            .fd-admin-login-card__topline {
              margin-bottom: 24px;
            }

            .fd-admin-login-card h2 {
              font-size: clamp(44px, 4vw, 58px);
            }

            .fd-admin-login-card__intro {
              margin: 12px 0 22px;
              line-height: 1.55;
            }

            .fd-admin-login-form {
              gap: 16px;
            }

            .fd-admin-field {
              gap: 7px;
            }

            .fd-admin-field input {
              min-height: 48px;
            }

            .fd-admin-submit {
              min-height: 50px;
            }

            .fd-admin-secure-note {
              margin-top: 16px;
            }
          }

          @media (max-width: 520px) {
            .fd-admin-login-page::after {
              top: 19px;
              right: 20px;
            }

            .fd-admin-login-visual {
              min-height: auto;
              padding: 24px 20px;
            }

            .fd-admin-editorial {
              padding-top: 28px;
            }

            .fd-admin-editorial h1 {
              margin: 14px 0;
              font-size: clamp(50px, 16vw, 70px);
            }

            .fd-admin-footer {
              margin-top: 26px;
            }

            .fd-admin-login-panel {
              padding: 54px 20px 40px;
            }

            .fd-admin-login-card__topline {
              margin-bottom: 26px;
            }

            .fd-admin-login-card__intro {
              margin: 14px 0 24px;
            }

            .fd-admin-login-card h2 {
              font-size: 48px;
            }
          }
        `}</style>

        <div className="fd-admin-login-page">
          <section className="fd-admin-login-visual" aria-label="Fashion Dream Admin">
            <div className="fd-admin-brand">
              <div className="fd-admin-brand__mark">FD</div>
              <div>
                <div className="fd-admin-brand__name">FASHION DREAM</div>
                <span className="fd-admin-brand__meta">TRY-ON SHOP / CONTROL</span>
              </div>
            </div>

            <div className="fd-admin-editorial">
              <div className="fd-admin-editorial__eyebrow">Commerce control room</div>
              <h1>
                RUN THE
                <em>COLLECTION.</em>
              </h1>
              <p>
                Không gian quản trị dành cho vận hành sản phẩm, tồn kho và đơn hàng của Fashion Dream Try-On Shop.
              </p>

              <div className="fd-admin-stats" aria-hidden="true">
                <div className="fd-admin-stat">
                  <strong>01</strong>
                  <span>Catalog</span>
                </div>
                <div className="fd-admin-stat">
                  <strong>02</strong>
                  <span>Inventory</span>
                </div>
                <div className="fd-admin-stat">
                  <strong>03</strong>
                  <span>Orders</span>
                </div>
              </div>
            </div>

            <div className="fd-admin-footer">
              <span>Fashion Dream / 2026</span>
              <span className="fd-admin-footer__line" />
              <span>Private area</span>
            </div>
          </section>

          <section className="fd-admin-login-panel">
            <div className="fd-admin-login-card">
              <div className="fd-admin-login-card__topline">
                <span>Administrator access</span>
                <span className="fd-admin-login-card__status">System ready</span>
              </div>

              <h2>Đăng nhập<br />quản trị</h2>

              <p className="fd-admin-login-card__intro">
                Đăng nhập bằng email và mật khẩu của tài khoản đã được cấp quyền quản trị.
                Nếu chưa có quyền truy cập, hãy liên hệ quản trị viên WEARO để được cấp quyền.
              </p>

              <form onSubmit={handleLogin} className="fd-admin-login-form">
                <label className="fd-admin-field">
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    placeholder="admin@example.com"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-label="Email quản trị"
                    required
                  />
                </label>

                <label className="fd-admin-field">
                  <span>Mật khẩu</span>
                  <div className="fd-admin-password-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      placeholder="Nhập mật khẩu"
                      autoComplete="current-password"
                      aria-label="Mật khẩu quản trị"
                      required
                    />
                    <button
                      type="button"
                      className="fd-admin-password-toggle"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M3 3l18 18" />
                          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                          <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.2 0 10 7 10 7a18 18 0 0 1-3.1 3.8" />
                          <path d="M6.1 6.1C3.7 7.7 2 12 2 12s3.8 7 10 7a10.7 10.7 0 0 0 4-.8" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7S2 12 2 12Z" />
                          <circle cx="12" cy="12" r="2.5" />
                        </svg>
                      )}
                    </button>
                  </div>
                </label>

                {loginError && (
                  <div className="fd-admin-error" role="alert" aria-live="assertive">
                    {loginError}
                  </div>
                )}

                <button className="fd-admin-submit" type="submit" disabled={loggingIn}>
                  {loggingIn ? "ĐANG ĐĂNG NHẬP…" : "ĐĂNG NHẬP →"}
                </button>
              </form>

              <div className="fd-admin-secure-note">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="5" y="10" width="14" height="10" rx="1" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <span>
                  Đăng nhập an toàn qua Supabase Auth. Tài khoản cần được cấp quyền Admin riêng;
                  trang này không hỗ trợ tự đăng ký hoặc tự nâng quyền.
                </span>
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }

  return <AdminShell />;
}
