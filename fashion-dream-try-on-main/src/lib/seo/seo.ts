const DEFAULT_SITE_URL = "https://fashion-dream-try-on-main.vercel.app";

export const SITE_URL = (import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function canonicalLink(path = "/") {
  return {
    rel: "canonical",
    href: absoluteUrl(path),
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "WEARO",
    url: SITE_URL,
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "WEARO",
    url: SITE_URL,
    description: "WEARO — cửa hàng thời trang trực tuyến kết hợp AI Virtual Try-On, AI Personal Stylist và Hybrid Stylist 1:1.",
    publisher: {
      "@type": "Organization",
      name: "WEARO",
      url: SITE_URL,
    },
  };
}

export function jsonLdScript(schema: unknown) {
  return {
    type: "application/ld+json",
    children: JSON.stringify(schema).replace(/</g, "\\u003c"),
  };
}
