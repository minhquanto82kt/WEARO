import { useState, type FormEvent } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Clock, Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const linkClass = "wearo-footer__link";

export function SiteFooter() {
  const { t } = useI18n();
  const pathname = useLocation({ select: (location) => location.pathname });
  const [newsletterNotice, setNewsletterNotice] = useState("");
  const hideNewsletter =
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/") ||
    pathname === "/track-order" ||
    pathname === "/account" ||
    pathname.startsWith("/account/orders");

  function handleNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNewsletterNotice(
      t(
        "Tính năng đăng ký email đang được hoàn thiện. Email của bạn chưa được lưu.",
        "Email sign-up is being set up. Your email has not been saved.",
      ),
    );
  }

  return (
    <footer className="wearo-footer" aria-label={t("Chân trang WEARO", "WEARO footer")}>
      <div className="wearo-footer__accent" aria-hidden="true" />

      <div className="wearo-footer__inner">
        <div className="wearo-footer__panel">
          <div className="wearo-footer__grid">
          <section className="wearo-footer__brand">
            <Link to="/" className="wearo-footer__logo" aria-label="WEARO home">
              <img src="/brand/wearo-logo-header.svg" alt="WEARO" />
            </Link>
            <p className="wearo-footer__description">
              {t(
                "Thương hiệu thời trang casual, streetwear & unisex hiện đại, hỗ trợ bởi AI.",
                "Modern casual, streetwear & unisex fashion supported by AI.",
              )}
            </p>

            {!hideNewsletter && (
              <section
                className="wearo-footer__newsletter wearo-footer__newsletter--brand"
                aria-labelledby="wearo-newsletter-title"
              >
                <div className="wearo-footer__newsletter-copy">
                  <span className="wearo-footer__newsletter-kicker">
                    {t("WEARO LETTER / 01", "WEARO LETTER / 01")}
                  </span>
                  <h2 id="wearo-newsletter-title">
                    {t("Đừng bỏ lỡ gu riêng của bạn.", "Stay in tune with your style.")}
                  </h2>
                  <p className="wearo-footer__newsletter-description">
                    {t(
                      "Bộ sưu tập mới, cảm hứng phối đồ và ưu đãi dành riêng cho bạn.",
                      "New collections, styling inspiration, and offers picked for you.",
                    )}
                  </p>
                </div>

                <form className="wearo-footer__newsletter-form" onSubmit={handleNewsletterSubmit}>
                  <label className="sr-only" htmlFor="wearo-newsletter-email">Email</label>
                  <div className="wearo-footer__newsletter-input-wrap">
                    <Mail size={16} aria-hidden="true" />
                    <input
                      id="wearo-newsletter-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder={t("Email của bạn", "Your email address")}
                      aria-describedby="wearo-newsletter-status"
                      required
                    />
                  </div>
                  <button type="submit">{t("ĐĂNG KÝ ↗", "SUBSCRIBE ↗")}</button>
                </form>
                <p
                  id="wearo-newsletter-status"
                  className="wearo-footer__newsletter-status"
                  role="status"
                  aria-live="polite"
                >
                  {newsletterNotice || t("Không gửi thư rác. Hủy đăng ký bất cứ lúc nào.", "No spam. Unsubscribe anytime.")}
                </p>
              </section>
            )}
          </section>

          <section className="wearo-footer__section">
            <p className="wearo-footer__kicker">01 / {t("Khám phá", "DISCOVER")}</p>
            <nav className="wearo-footer__links" aria-label={t("Khám phá", "Discover")}>
              <Link to="/shop" className={linkClass}>{t("Cửa hàng (Tất cả)", "Shop (All)")}</Link>
              <Link to="/shop" className={linkClass}>{t("Hàng mới về", "New Arrivals")}</Link>
              <Link to="/collections/$slug" params={{ slug: "casual" }} className={linkClass}>{t("Bộ sưu tập", "Collections")}</Link>
              <Link to="/about" className={linkClass}>WEARO Journal</Link>
              <Link to="/ai" className={linkClass}>AI Virtual Try-On</Link>
              <Link to="/ai" className={linkClass}>AI Personal Stylist</Link>
            </nav>
          </section>

          <section className="wearo-footer__section">
            <p className="wearo-footer__kicker">02 / {t("Hỗ trợ & pháp lý", "SUPPORT & LEGAL")}</p>
            <nav className="wearo-footer__links" aria-label={t("Hỗ trợ và pháp lý", "Support and legal")}>
              <span className={linkClass} aria-disabled="true">{t("Hướng dẫn chọn size", "Size Guide")} <small>({t("Đang cập nhật", "Coming soon")})</small></span>
              <span className={linkClass} aria-disabled="true">{t("Hướng dẫn mua hàng", "Shopping Guide")} <small>({t("Đang cập nhật", "Coming soon")})</small></span>
              <span className={linkClass} aria-disabled="true">{t("Chính sách đổi trả", "Returns & Refunds")} <small>({t("Đang cập nhật", "Coming soon")})</small></span>
              <span className={linkClass} aria-disabled="true">{t("Chính sách bảo mật", "Privacy Policy")} <small>({t("Đang cập nhật", "Coming soon")})</small></span>
              <span className={linkClass} aria-disabled="true">{t("Điều khoản dịch vụ", "Terms of Service")} <small>({t("Đang cập nhật", "Coming soon")})</small></span>
            </nav>
          </section>

          <section className="wearo-footer__section wearo-footer__contact">
            <p className="wearo-footer__kicker">03 / {t("Liên hệ", "CONTACT")}</p>
            <div className="wearo-footer__contact-list">
              <a href="tel:0901246824" className="wearo-footer__contact-item"><Phone size={15} aria-hidden="true" /><span>Hotline: 0901 246 824</span></a>
              <a href="mailto:support@wearo.vn" className="wearo-footer__contact-item"><span className="wearo-footer__contact-symbol">@</span><span>Email: support@wearo.vn</span></a>
              <span className="wearo-footer__contact-item"><MapPin size={15} aria-hidden="true" /><span>12 Nguyễn Văn Bảo, Phường Hạnh Thông, TP.HCM</span></span>
              <span className="wearo-footer__contact-item"><Clock size={15} aria-hidden="true" /><span>08:00 — 22:00 / Thứ 2 — Chủ Nhật</span></span>
            </div>
            <div className="wearo-footer__social-label">{t("KẾT NỐI", "CONNECT")}</div>
            <div className="wearo-footer__socials" aria-label={t("Mạng xã hội", "Social media")}>
              <a href="#instagram" aria-label="Instagram"><Instagram size={17} /></a>
              <a href="https://www.facebook.com/profile.php?id=61595224420277&open_field=address&sk=directory_basic_info" aria-label="Facebook"><Facebook size={17} /></a>
            </div>
          </section>
          </div>
        </div>

        <div className="wearo-footer__payment-bar" aria-label={t("Đơn vị thanh toán", "Payment methods")}>
          <span className="wearo-footer__payment-label">{t("THANH TOÁN AN TOÀN", "SECURE PAYMENTS")}</span>
          <div className="wearo-footer__payment-logos">
            <span className="wearo-footer__payment-logo wearo-footer__payment-logo--visa" aria-label="Visa">
              <svg viewBox="0 0 64 24" role="img" aria-hidden="true"><text x="2" y="19">VISA</text></svg>
            </span>
            <span className="wearo-footer__payment-logo wearo-footer__payment-logo--mastercard" aria-label="Mastercard">
              <svg viewBox="0 0 48 28" role="img" aria-hidden="true"><circle cx="18" cy="14" r="11" /><circle cx="30" cy="14" r="11" /></svg>
            </span>
            <span className="wearo-footer__payment-logo wearo-footer__payment-logo--momo" aria-label="MoMo">
              <svg viewBox="0 0 64 24" role="img" aria-hidden="true"><text x="2" y="18">MoMo</text></svg>
            </span>
            <span className="wearo-footer__payment-logo wearo-footer__payment-logo--vietqr" aria-label="VietQR">
              <svg viewBox="0 0 74 24" role="img" aria-hidden="true"><text x="2" y="17">VietQR</text><path d="M55 4h5v5h-5zM63 4h5v5h-5zM55 12h5v5h-5zM63 12h5v5h-5z" /></svg>
            </span>
          </div>
          <span className="wearo-footer__commerce-badge">BỘ CÔNG THƯƠNG</span>
        </div>

        <div className="wearo-footer__bottom">
          <p>© 2026 WEARO — Đại học Công nghiệp TP.HCM / IUH. {t("Bảo lưu mọi quyền.", "All rights reserved.")}</p>
          <span>{t("Thời trang có cá tính. Trải nghiệm có công nghệ.", "Fashion with identity. Experience with technology.")}</span>
        </div>
      </div>
    </footer>
  );
}
