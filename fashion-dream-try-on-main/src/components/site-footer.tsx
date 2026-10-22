import { Clock, Facebook, Mail, MapPin, Phone } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

const linkClass = "wearo-footer__link";
const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61595224420277&open_field=address&sk=directory_basic_info";

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
        <div className="wearo-footer__panel">
          <div className="wearo-footer__grid">
            <section className="wearo-footer__brand" aria-label={t("Giới thiệu WEARO", "About WEARO")}>
              <Link to="/" className="wearo-footer__logo" aria-label={t("Về trang chủ WEARO", "Go to WEARO homepage")}>
                <img src="/brand/OG-logo.webp" alt="WEARO" />
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
                    <span className="wearo-footer__newsletter-kicker">WEARO LETTER / 01</span>
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
                  <p className="wearo-footer__newsletter-status">
                    {t(
                      "Tính năng đăng ký nhận tin đang được hoàn thiện. Hiện tại WEARO chưa thu thập email qua website.",
                      "Email sign-up is being prepared. WEARO does not currently collect email addresses through this website.",
                    )}
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
                <Link to="/ai" className={linkClass}>AI Stylist</Link>
              </nav>
            </section>

            <section className="wearo-footer__section">
              <p className="wearo-footer__kicker">02 / {t("Hỗ trợ", "SUPPORT")}</p>
              <nav className="wearo-footer__links" aria-label={t("Hỗ trợ khách hàng", "Customer support")}>
                <Link to="/track-order" className={linkClass}>{t("Tra cứu đơn hàng", "Track your order")}</Link>
                <Link to="/account" className={linkClass}>{t("Tài khoản của tôi", "My account")}</Link>
                <Link to="/about" className={linkClass}>{t("Về WEARO", "About WEARO")}</Link>
                <a href="mailto:support@wearo.vn" className={linkClass}>{t("Liên hệ bộ phận hỗ trợ", "Contact customer support")}</a>
              </nav>
              <p className="wearo-footer__support-note">
                {t(
                  "Chính sách mua hàng và bảo mật sẽ được cập nhật khi hoàn tất.",
                  "Shopping and privacy policies will be added when finalized.",
                )}
              </p>
            </section>

            <section className="wearo-footer__section wearo-footer__contact">
              <p className="wearo-footer__kicker">03 / {t("Liên hệ", "CONTACT")}</p>
              <div className="wearo-footer__contact-list">
                <a href="tel:0901246824" className="wearo-footer__contact-item">
                  <Phone size={15} aria-hidden="true" />
                  <span>{t("Hotline", "Hotline")}: 0901 246 824</span>
                </a>
                <a href="mailto:support@wearo.vn" className="wearo-footer__contact-item">
                  <Mail size={15} aria-hidden="true" />
                  <span>{t("Email", "Email")}: support@wearo.vn</span>
                </a>
                <span className="wearo-footer__contact-item">
                  <MapPin size={15} aria-hidden="true" />
                  <span>{t("12 Nguyễn Văn Bảo, Phường Hạnh Thông, TP.HCM", "12 Nguyen Van Bao, Hanh Thong Ward, Ho Chi Minh City, Vietnam")}</span>
                </span>
                <span className="wearo-footer__contact-item">
                  <Clock size={15} aria-hidden="true" />
                  <span>{t("08:00 — 22:00 / Thứ 2 — Chủ Nhật", "08:00 — 22:00 / Monday — Sunday")}</span>
                </span>
              </div>
              <p className="wearo-footer__social-label">{t("KẾT NỐI", "CONNECT")}</p>
              <nav className="wearo-footer__socials" aria-label={t("Mạng xã hội", "Social media")}>
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("Facebook (mở trong tab mới)", "Facebook (opens in a new tab)")}
                >
                  <Facebook size={17} aria-hidden="true" />
                </a>
              </nav>
            </section>
          </div>
        </div>

        <div className="wearo-footer__payment-bar" aria-label={t("Phương thức thanh toán", "Payment methods")}>
          <span className="wearo-footer__payment-label">{t("PHƯƠNG THỨC THANH TOÁN", "PAYMENT METHODS")}</span>
          <div className="wearo-footer__payment-logos">
            <span className="wearo-footer__payment-method">COD</span>
            <span className="wearo-footer__payment-method">VietQR</span>
            <span className="wearo-footer__payment-method">MoMo</span>
            <span className="wearo-footer__payment-method">Mastercard</span>
          </div>
        </div>

        <div className="wearo-footer__bottom">
          <p>© 2026 WEARO — Đại học Công nghiệp TP.HCM / IUH. {t("Bảo lưu mọi quyền.", "All rights reserved.")}</p>
          <span>{t("Thời trang có cá tính. Trải nghiệm có công nghệ.", "Fashion with identity. Experience with technology.")}</span>
        </div>
      </div>
    </footer>
  );
}
