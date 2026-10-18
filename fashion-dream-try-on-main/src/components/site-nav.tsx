import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { CATEGORIES } from "@/data/products";
import { useCart } from "@/lib/cart";
import { getCustomerUser } from "@/lib/auth";
import { useI18n, type Language } from "@/lib/i18n";
import "@/styles/components/header-enhancements.scss";
import "@/styles/wearo-language-modal.scss";

const DISCOVERY_LINKS = [
  { label: "Casual", vi: "CASUAL", to: "/collections/casual" },
  { label: "Basic", vi: "BASIC", to: "/collections/basic" },
  { label: "Streetwear", vi: "STREETWEAR", to: "/collections/streetwear" },
  { label: "Outing Style", vi: "OUTING STYLE", to: "/collections/outing-style" },
] as const;

export function SiteNav() {
  const { count } = useCart();
  const { language, setLanguage, t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
  const [query, setQuery] = useState("");
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const sync = async () => {
      const user = await getCustomerUser();
      if (mounted) setCustomerEmail(user?.email ?? null);
    };
    void sync();
    const onLogin = () => void sync();
    const onLogout = () => setCustomerEmail(null);
    window.addEventListener("upthink:auth:login", onLogin);
    window.addEventListener("upthink:auth:logout", onLogout);
    return () => {
      mounted = false;
      window.removeEventListener("upthink:auth:login", onLogin);
      window.removeEventListener("upthink:auth:logout", onLogout);
    };
  }, []);

  useEffect(() => {
    if (!searchOpen && !mobileOpen && !languageModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSearchOpen(false);
      setMobileOpen(false);
      setShopOpen(false);
      setLanguageModalOpen(false);
      setQuery("");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchOpen, mobileOpen, languageModalOpen]);

  useEffect(() => {
    if (!languageModalOpen) return;
    setSelectedLanguage(language);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [languageModalOpen, language]);

  const closeMenus = () => {
    setMobileOpen(false);
    setSearchOpen(false);
    setShopOpen(false);
    setLanguageModalOpen(false);
  };

  const openLanguageModal = () => {
    setSelectedLanguage(language);
    setMobileOpen(false);
    setSearchOpen(false);
    setShopOpen(false);
    setLanguageModalOpen(true);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    window.location.href = `/shop?search=${encodeURIComponent(value)}`;
    closeMenus();
  };

  const toggleSearch = () => {
    setSearchOpen((value) => !value);
    setMobileOpen(false);
    setShopOpen(false);
    setLanguageModalOpen(false);
  };

  const languageFlag = language === "vi" ? "/flags/vietnam.svg" : "/flags/united-kingdom.svg";

  return (
    <nav className="fashion-nav" aria-label={t("Điều hướng chính", "Main navigation")}>
      <div className="fashion-nav__announcement" role="status">
        <span>WEARO / 2026</span>
        <span>{t("MIỄN PHÍ VẬN CHUYỂN — ĐƠN TỪ 700K", "FREE SHIPPING — ORDERS FROM 700K")}</span>
        <span>AI VIRTUAL TRY-ON / BETA</span>
      </div>

      <div className="fashion-nav__inner">
        <Link to="/" className="fashion-brand" aria-label="WEARO home" onClick={closeMenus}>
          <img className="fashion-brand__logo" src="/brand/wearo-logo-header.svg" alt="WEARO" />
        </Link>

        <div className="fashion-nav__links" aria-label={t("Điều hướng trang chính", "Primary navigation")}>
          <div
            className={`fashion-shop-nav ${shopOpen ? "is-open" : ""}`}
            onMouseEnter={() => setShopOpen(true)}
            onMouseLeave={() => setShopOpen(false)}
            onFocus={() => setShopOpen(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setShopOpen(false);
              }
            }}
          >
            <Link to="/shop" className="fashion-nav-link fashion-shop-trigger" activeProps={{ className: "fashion-nav-link fashion-shop-trigger is-active" }} aria-expanded={shopOpen} aria-haspopup="true" onClick={() => { setSearchOpen(false); setMobileOpen(false); }}>
              <span>{t("Cửa hàng", "Shop")}</span><ChevronDown size={15} strokeWidth={2} aria-hidden="true" />
            </Link>
            {shopOpen && (
              <div className="fashion-shop-mega" role="dialog" aria-label={t("Danh mục sản phẩm", "Shop categories")}>
                <div className="fashion-shop-mega__intro"><span className="fashion-menu-kicker">WEARO / COLLECTIONS</span><h2>{t("Mua theo phong cách", "Shop your style")}</h2><Link to="/shop" onClick={closeMenus} className="fashion-shop-all">{t("Xem tất cả sản phẩm", "View all products")} <ChevronRight size={15} /></Link></div>
                <div className="fashion-shop-discovery-grid">{DISCOVERY_LINKS.map((link) => <Link key={link.label} to={link.to} onClick={closeMenus} className="fashion-shop-all"><span>{t(link.vi, link.label)}</span><ChevronRight size={15} /></Link>)}</div>
                <div className="fashion-shop-category-grid">{CATEGORIES.map((category) => <Link key={category.slug} to="/shop" search={{ category: category.slug }} onClick={closeMenus} className="fashion-shop-category"><span className="fashion-shop-category__image"><img src={category.image} alt="" loading="lazy" /></span><span className="fashion-shop-category__meta"><strong>{category.name}</strong><span>{t("Khám phá danh mục", "Explore category")}</span></span><ChevronRight size={15} aria-hidden="true" /></Link>)}</div>
              </div>
            )}
          </div>

          <Link to="/ai" className="fashion-ai-nav" activeProps={{ className: "fashion-ai-nav is-active" }} aria-label="AI Studio — Beta">
            <span className="fashion-ai-nav__label">AI Studio</span><span className="fashion-ai-nav__beta" aria-hidden="true"><span>BETA</span></span>
          </Link>

          <Link to="/journal" className="fashion-nav-link" activeProps={{ className: "fashion-nav-link is-active" }}>JOURNAL</Link>
          <Link to="/about" className="fashion-nav-link" activeProps={{ className: "fashion-nav-link is-active" }}>{t("Giới thiệu", "About")}</Link>
        </div>

        <div className="fashion-nav__actions">
          <button type="button" className={`fashion-icon-btn fashion-search-toggle ${searchOpen ? "is-active" : ""}`} aria-label={searchOpen ? t("Đóng tìm kiếm", "Close search") : t("Tìm kiếm sản phẩm", "Search products")} aria-expanded={searchOpen} onClick={toggleSearch}>{searchOpen ? <X size={20} /> : <Search size={20} />}</button>
          <Link to="/account/wishlist" className="fashion-icon-btn" aria-label={t("Yêu thích", "Wishlist")}><Heart size={20} /></Link>
          <Link to="/account" className="fashion-icon-btn fashion-account-btn" aria-label={customerEmail ? `${t("Tài khoản", "Account")} ${customerEmail}` : t("Tài khoản", "Account")}><UserRound size={20} /></Link>
          <Link to="/cart" className="fashion-cart-btn" aria-label={t("Giỏ hàng", "Cart")}><ShoppingBag size={20} />{count > 0 && <span>{count}</span>}</Link>
          <button type="button" className={`fashion-language-switcher ${languageModalOpen ? "is-active" : ""}`} aria-label={t("Lựa chọn ngôn ngữ và vị trí", "Language and location selection")} aria-expanded={languageModalOpen} aria-haspopup="dialog" onClick={openLanguageModal}>
            <img className="fashion-language-flag" src={languageFlag} alt="" width={24} height={24} aria-hidden="true" />
            <span className="fashion-language-code">{language === "vi" ? "VIE" : "ENG"}</span>
          </button>
          <button type="button" className={`fashion-mobile-btn ${mobileOpen ? "is-active" : ""}`} aria-label={mobileOpen ? t("Đóng menu", "Close menu") : t("Mở menu", "Open menu")} aria-expanded={mobileOpen} onClick={() => { setMobileOpen((value) => !value); setSearchOpen(false); setShopOpen(false); setLanguageModalOpen(false); }}>{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>

      {searchOpen && <div className="fashion-search-panel" role="dialog" aria-label={t("Tìm kiếm nhanh", "Quick search")}><div className="fashion-search-panel__header"><div><span className="fashion-menu-kicker">WEARO / SEARCH</span><h2>{t("Tìm sản phẩm", "Find your style")}</h2></div><button type="button" className="fashion-icon-btn" onClick={() => { setSearchOpen(false); setQuery(""); }} aria-label={t("Đóng tìm kiếm", "Close search")}><X size={18} /></button></div><form onSubmit={submitSearch} className="fashion-search-form"><label htmlFor="site-search" className="sr-only">{t("Tìm kiếm sản phẩm", "Search products")}</label><Search size={18} aria-hidden="true" /><input id="site-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Tìm sản phẩm, phong cách...", "Search products, styles...")} autoFocus /><button type="submit" disabled={!query.trim()}>{t("Tìm", "Search")}</button></form><div className="fashion-search-panel__body"><div><span className="fashion-menu-label">01 / QUICK ACCESS</span><div className="fashion-search-links"><Link to="/shop" onClick={closeMenus}><span>{t("Tất cả sản phẩm", "All products")}</span><ChevronRight size={15} /></Link><Link to="/ai" onClick={closeMenus}><span>AI Studio</span><ChevronRight size={15} /></Link><Link to="/account" onClick={closeMenus}><span>{t("Tài khoản", "My Account")}</span><ChevronRight size={15} /></Link></div></div><div><span className="fashion-menu-label">02 / CATEGORIES</span><div className="fashion-search-tags">{CATEGORIES.map((category) => <Link key={category.slug} to="/shop" search={{ category: category.slug }} onClick={closeMenus}>{category.name}</Link>)}</div></div></div><div className="fashion-search-hint"><span>{t("Enter để tìm · Esc để đóng", "Enter to search · Esc to close")}</span><span>WEARO / SEARCH</span></div></div>}

      {mobileOpen && <div className="fashion-mobile-menu" role="dialog" aria-label="WEARO menu"><div className="fashion-menu-header"><div><span className="fashion-menu-kicker">WEARO / NAVIGATION</span><h2>{t("Khám phá", "Discover")}</h2></div><span className="fashion-menu-status">MODERN EVERYDAY</span></div><div className="fashion-menu-grid"><section className="fashion-menu-section"><span className="fashion-menu-label">01 / SHOP</span><Link to="/shop" onClick={closeMenus}><span><strong>{t("Cửa hàng", "Shop")}</strong><small>{t("Khám phá bộ sưu tập", "Browse the collection")}</small></span><ChevronRight size={17} /></Link><Link to="/ai" onClick={closeMenus}><span><strong>AI Studio</strong><small>Virtual try-on / Beta</small></span><ChevronRight size={17} /></Link><Link to="/journal" onClick={closeMenus}><span><strong>Journal</strong><small>{t("Phong cách & cảm hứng", "Style & inspiration")}</small></span><ChevronRight size={17} /></Link><Link to="/about" onClick={closeMenus}><span><strong>{t("Giới thiệu", "About")}</strong><small>{t("Về WEARO", "About WEARO")}</small></span><ChevronRight size={17} /></Link></section><section className="fashion-menu-section"><span className="fashion-menu-label">02 / ACCOUNT</span><Link to="/account/wishlist" onClick={closeMenus}><span><strong>{t("Yêu thích", "Wishlist")}</strong><small>{t("Lưu sản phẩm bạn thích", "Saved pieces")}</small></span><Heart size={17} /></Link><Link to="/account" onClick={closeMenus}><span><strong>{t("Tài khoản", "Account")}</strong><small>{customerEmail ?? t("Đăng nhập / Đăng ký", "Sign in / Register")}</small></span><UserRound size={17} /></Link><Link to="/cart" onClick={closeMenus}><span><strong>{t("Giỏ hàng", "Cart")}</strong><small>{count} {t("sản phẩm", "items")}</small></span><ShoppingBag size={17} /></Link></section></div></div>}

      {languageModalOpen && (
        <div className="wearo-language-modal" role="dialog" aria-modal="true" aria-labelledby="wearo-language-title">
          <button type="button" className="wearo-language-modal__backdrop" aria-label={t("Đóng", "Close")} onClick={() => setLanguageModalOpen(false)} />
          <div className="wearo-language-modal__panel">
            <div className="wearo-language-modal__header">
              <div>
                <span className="fashion-menu-kicker">WEARO / LANGUAGE</span>
                <h2 id="wearo-language-title">{t("Chọn ngôn ngữ", "Choose language")}</h2>
                <p>{t("Ngôn ngữ ảnh hưởng đến giao diện và đơn vị tiền tệ hiển thị.", "Language affects the interface and displayed currency.")}</p>
              </div>
              <button type="button" className="wearo-language-modal__close" onClick={() => setLanguageModalOpen(false)} aria-label={t("Đóng", "Close")}>
                <X size={18} />
              </button>
            </div>

            <div className="wearo-language-modal__options" role="listbox" aria-label={t("Ngôn ngữ", "Language")}>
              <button
                type="button"
                role="option"
                aria-selected={selectedLanguage === "vi"}
                className={`wearo-language-option ${selectedLanguage === "vi" ? "is-active" : ""}`}
                onClick={() => setSelectedLanguage("vi")}
              >
                <span className="wearo-language-option__flag">
                  <img src="/flags/vietnam.svg" alt="" width={32} height={32} />
                </span>
                <span className="wearo-language-option__text">
                  <strong>Tiếng Việt</strong>
                  <small>VIE · Việt Nam</small>
                </span>
                <span className="wearo-language-option__meta">VND</span>
                <span className="wearo-language-option__check" aria-hidden="true" />
              </button>

              <button
                type="button"
                role="option"
                aria-selected={selectedLanguage === "en"}
                className={`wearo-language-option ${selectedLanguage === "en" ? "is-active" : ""}`}
                onClick={() => setSelectedLanguage("en")}
              >
                <span className="wearo-language-option__flag">
                  <img src="/flags/united-kingdom.svg" alt="" width={32} height={32} />
                </span>
                <span className="wearo-language-option__text">
                  <strong>English</strong>
                  <small>ENG · International</small>
                </span>
                <span className="wearo-language-option__meta">USD</span>
                <span className="wearo-language-option__check" aria-hidden="true" />
              </button>
            </div>

            <div className="wearo-language-modal__footer">
              <p className="wearo-language-modal__hint">
                {selectedLanguage === "vi"
                  ? "Tiền tệ hiển thị: VND"
                  : "Display currency: USD"}
              </p>
              <button
                type="button"
                className="wearo-language-modal__confirm"
                onClick={() => {
                  setLanguage(selectedLanguage);
                  setLanguageModalOpen(false);
                }}
              >
                {t("Xác nhận", "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
