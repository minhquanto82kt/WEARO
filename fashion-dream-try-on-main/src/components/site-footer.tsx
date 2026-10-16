import { Link, useLocation } from "@tanstack/react-router";
import { Clock, Facebook, Instagram, Mail, MapPin, Music2, Phone, Youtube } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const linkClass = "wearo-footer__link";

export function SiteFooter() {
  const { t } = useI18n();
  const pathname = useLocation({ select: (location) => location.pathname });
  const hideNewsletter =
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/") ||
    pathname === "/track-order" ||
    pathname === "/account" ||
    pathname.startsWith("/account/orders");

  return (
    <footer className="wearo-footer" aria-label={t("Chân trang WEARO", "WEARO footer")}>
      <div className="wearo-footer__accent" aria-hidden="true" />

      <div className="wearo-footer__inner">
        {!hideNewsletter && (
        <section className="wearo-footer__newsletter" aria-labelledby="wearo-newsletter-title">
          <div className="wearo-footer__newsletter-copy">
            <span className="wearo-footer__newsletter-kicker">[ {t("PRE-FOOTER: KHỐI ĐĂNG KÝ NHẬN TIN", "PRE-FOOTER: NEWSLETTER SIGN-UP")} ]</span>
            <h2 id="wearo-newsletter-title">
              {t(
                "Mặc theo cách của riêng bạn — Nhận ngay ưu đãi 10% cho đơn hàng đầu tiên",
                "Wear it your way — Get 10% off your first order",
              )}
            </h2>
          </div>

          <form className="wearo-footer__newsletter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="sr-only" htmlFor="wearo-newsletter-email">Email</label>
            <div className="wearo-footer__newsletter-input-wrap">
              <Mail size={16} aria-hidden="true" />
              <input id="wearo-newsletter-email" name="email" type="email" autoComplete="email" placeholder={t("Nhập địa chỉ email của bạn...", "Enter your email address...")} required />
            </div>
            <button type="submit">{t("ĐĂNG KÝ NGAY", "SUBSCRIBE NOW")}</button>
          </form>
        </section>
        )}

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
          </section>

          <section className="wearo-footer__section">
            <p className="wearo-footer__kicker">01 / {t("Khám phá", "DISCOVER")}</p>
            <nav className="wearo-footer__links" aria-label={t("Khám phá", "Discover")}>
              <Link to="/shop" className={linkClass}>{t("Cửa hàng (Tất cả)", "Shop (All)")}</Link>
              <Link to="/shop" className={linkClass}>{t("Hàng mới về", "New Arrivals")}</Link>
              <Link to="/shop" className={linkClass}>{t("Bộ sưu tập", "Collections")}</Link>
              <Link to="/about" className={linkClass}>WEARO Journal</Link>
              <Link to="/ai" className={linkClass}>AI Virtual Try-On</Link>
              <Link to="/ai" className={linkClass}>AI Personal Stylist</Link>
            </nav>
          </section>

          <section className="wearo-footer__section">
            <p className="wearo-footer__kicker">02 / {t("Hỗ trợ & pháp lý", "SUPPORT & LEGAL")}</p>
            <nav className="wearo-footer__links" aria-label={t("Hỗ trợ và pháp lý", "Support and legal")}>
              <Link to="/about" className={linkClass}>{t("Hướng dẫn chọn size", "Size Guide")}</Link>
              <Link to="/about" className={linkClass}>{t("Hướng dẫn mua hàng", "Shopping Guide")}</Link>
              <Link to="/about" className={linkClass}>{t("Chính sách đổi trả", "Returns & Refunds")}</Link>
              <Link to="/about" className={linkClass}>{t("Chính sách bảo mật", "Privacy Policy")}</Link>
              <Link to="/about" className={linkClass}>{t("Điều khoản dịch vụ", "Terms of Service")}</Link>
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

        <div className="wearo-footer__bottom">
          <p>© 2026 WEARO — Đại học Công nghiệp TP.HCM / IUH. {t("Bảo lưu mọi quyền.", "All rights reserved.")}</p>
          <div className="wearo-footer__trust">
            <span className="wearo-footer__payments" aria-label={t("Phương thức thanh toán", "Payment methods")}><b>VISA</b><b>MC</b><b>MOMO</b><b>VNPAY</b><b>ZALOPAY</b><b>COD</b></span>
            <span className="wearo-footer__commerce-badge">BỘ CÔNG THƯƠNG</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
