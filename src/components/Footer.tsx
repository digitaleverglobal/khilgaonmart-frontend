"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchPublicPages, type WebsitePage } from "@/services/pageService";
import { fetchSiteSettings, type SiteSetting } from "@/services/settingService";
import { fetchNavItems } from "@/services/menuService";
import { categoryHref } from "@/lib/storeNav";
import type { NavItem } from "@/data/products";

const SOCIAL_DEFS = [
  {
    key: "facebookUrl" as const,
    name: "Facebook",
    color: "#1877f2",
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
      </svg>
    ),
  },
  {
    key: "instagramUrl" as const,
    name: "Instagram",
    color: "#e1306c",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: "youtubeUrl" as const,
    name: "YouTube",
    color: "#ff0000",
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
        <polygon
          fill="white"
          points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"
        />
      </svg>
    ),
  },
  {
    key: "whatsappUrl" as const,
    name: "WhatsApp",
    color: "#25d366",
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.136.563 4.14 1.544 5.876L.057 23.6a.5.5 0 00.61.666l5.878-1.54A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.888a9.87 9.87 0 01-5.032-1.378l-.36-.214-3.733.979.998-3.648-.235-.374A9.863 9.863 0 012.112 12C2.112 6.58 6.58 2.112 12 2.112c5.42 0 9.888 4.468 9.888 9.888 0 5.42-4.468 9.888-9.888 9.888z" />
      </svg>
    ),
  },
  {
    key: "messengerUrl" as const,
    name: "Messenger",
    color: "#0099ff",
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.373 0 0 5.149 0 11.5c0 3.612 1.852 6.836 4.75 8.934V24l4.333-2.375c1.16.312 2.386.48 3.66.48C20.627 22.105 24 17.044 24 11.5 24 5.15 18.627 0 12 0zm1.208 15.484l-3.093-3.28-6.054 3.28L10.98 8.516l3.168 3.28 5.98-3.28-6.92 6.968z" />
      </svg>
    ),
  },
  {
    key: "telegramUrl" as const,
    name: "Telegram",
    color: "#229ED9",
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9.78 15.43l-.37 5.2c.53 0 .76-.23 1.04-.5l2.5-2.39 5.18 3.79c.95.52 1.62.25 1.88-.88L23.41 4.7c.35-1.61-.58-2.24-1.5-1.9L1.94 10.5c-1.36.53-1.34 1.28-.23 1.62l5.1 1.59L18.67 6.3c.56-.37 1.07-.17.65.2l-9.54 8.93z" />
      </svg>
    ),
  },
  {
    key: "twitterUrl" as const,
    name: "Twitter / X",
    color: "#111827",
    icon: <span style={{ fontSize: 13, fontWeight: 900, lineHeight: 1 }}>X</span>,
  },
  {
    key: "linkedinUrl" as const,
    name: "LinkedIn",
    color: "#0A66C2",
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S.02 4.88.02 3.5 1.14 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4v15h-4V8zm7.5 0h3.83v2.05h.05c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.67 4.8 6.14V23h-4v-7.85c0-1.87-.03-4.28-2.61-4.28-2.61 0-3.01 2.04-3.01 4.15V23h-4V8z" />
      </svg>
    ),
  },
  {
    key: "tiktokUrl" as const,
    name: "TikTok",
    color: "#000000",
    icon: <span style={{ fontSize: 11, fontWeight: 900, lineHeight: 1 }}>TT</span>,
  },
];

const DEFAULT_CUSTOMER_LINKS = [
  { label: "Register", url: "/login?mode=register" },
  { label: "Login", url: "/login" },
  { label: "Forgot Password?", url: "/login" },
  { label: "Contact", url: "/contact" },
];

const DEFAULT_FOOTER_SOCIAL_KEYS = new Set([
  "facebookUrl",
  "instagramUrl",
  "youtubeUrl",
  "messengerUrl",
  "telegramUrl",
  "twitterUrl",
  "linkedinUrl",
  "tiktokUrl",
]);

// Fixed shop help links for the "Support" column.
const SUPPORT_LINKS = [
  { label: "Track Order", url: "/track-order" },
  { label: "Contact Us", url: "/contact" },
  { label: "My Account", url: "/account" },
  { label: "Get Coupon", url: "/coupons" },
  { label: "Free Delivery", url: "/free-delivery" },
];

const MAX_SHOP_BY = 7;

function ColHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111", marginBottom: 18 }}>
      {children}
    </h3>
  );
}

function FooterLink({
  href = "#",
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        style={{ fontSize: 14, color: "#555", lineHeight: "22px", display: "block" }}
        className="hover:text-[#F07A22] transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}

function LinkColumn({ title, links }: { title: string; links: { label: string; url: string }[] }) {
  if (links.length === 0) return null;
  return (
    <div>
      <ColHeading>{title}</ColHeading>
      <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {links.map((link) => (
          <FooterLink key={`${link.label}-${link.url}`} href={link.url}>
            {link.label}
          </FooterLink>
        ))}
      </ul>
    </div>
  );
}

const contactIconProps = {
  width: 17,
  height: 17,
  fill: "none",
  stroke: "#888",
  strokeWidth: 1.8,
  viewBox: "0 0 24 24",
  style: { flexShrink: 0, marginTop: 3 },
};

function ContactLine({ icon, href, children }: { icon: React.ReactNode; href?: string; children: React.ReactNode }) {
  const content = (
    <>
      {icon}
      <span>{children}</span>
    </>
  );
  const style = { display: "flex", gap: 10, fontSize: 15, color: "#444", lineHeight: "24px" };
  return href ? (
    <a href={href} style={style} className="hover:text-[#F07A22] transition-colors">
      {content}
    </a>
  ) : (
    <div style={style}>{content}</div>
  );
}

interface Props {
  settings?: Partial<SiteSetting> | null;
  // Fetched on the server by SiteFooter; skips the client requests below.
  pages?: WebsitePage[];
  navItems?: NavItem[];
}

export default function Footer({ settings, pages: pagesProp, navItems: navItemsProp }: Props) {
  const [resolvedSettings, setResolvedSettings] = useState<Partial<SiteSetting> | null>(settings || null);
  const [fetchedPages, setFetchedPages] = useState<WebsitePage[]>([]);
  const [fetchedNavItems, setFetchedNavItems] = useState<NavItem[]>([]);
  const pages = pagesProp ?? fetchedPages;
  const navItems = navItemsProp ?? fetchedNavItems;
  const s = settings || resolvedSettings || {};
  const logoUrl = s.logoUrl || null;
  const footerConfig = s.websiteFooter || {};
  const deliveryPartners = footerConfig.deliveryPartners?.length
    ? footerConfig.deliveryPartners
    : s.deliveryPartnerUrl
      ? [{ label: "Delivery Partner", imageUrl: s.deliveryPartnerUrl }]
      : [];
  const socialLinks = footerConfig.socialLinks?.length
    ? footerConfig.socialLinks.map((item, index) => {
      const platform = (item.platform || item.label || "").toLowerCase();
      const def =
        SOCIAL_DEFS.find((social) => social.key.toLowerCase().startsWith(platform)) ||
        SOCIAL_DEFS.find((social) => social.name.toLowerCase().includes(platform)) ||
        SOCIAL_DEFS[0];
      return { ...def, id: `${platform || def.name}-${index}`, name: item.label || def.name, url: item.url || "#" };
    })
    : SOCIAL_DEFS
      .filter((social) => DEFAULT_FOOTER_SOCIAL_KEYS.has(social.key))
      .map((social) => ({ ...social, id: social.key, url: s[social.key] || null }))
      .filter((social) => social.url);
  const configuredUsefulLinks = [
    ...(footerConfig.quickLinks || []),
    ...(footerConfig.importantLinks || []),
  ];
  const informationLinks = configuredUsefulLinks.length > 0
    ? configuredUsefulLinks
    : pages.map((page) => ({ label: page.title || page.name, url: `/page/${page.slug}` }));
  const shopByLinks = navItems
    .slice(0, MAX_SHOP_BY)
    .map((item) => ({ label: item.label, url: categoryHref(item.label) }));
  const customerLinks = footerConfig.customerLinks?.length
    ? footerConfig.customerLinks
    : DEFAULT_CUSTOMER_LINKS;
  const address = footerConfig.address || s.address || null;
  const phone = footerConfig.phone || s.phone || null;
  const email = footerConfig.email || s.email || null;
  const description = s.metaDescription || null;
  const copyright = (
    footerConfig.copyrightText || s.copyrightText || "Copyright © {year}"
  ).replaceAll("{year}", String(new Date().getFullYear()));
  const footerLogoUrl = footerConfig.logoUrl || logoUrl;
  const paymentMethods = footerConfig.paymentMethods || [];
  // Older setups uploaded one combined strip image instead of separate logos.
  const paymentImageUrl = footerConfig.paymentMethodsImageUrl || null;
  const hasPayments = paymentMethods.length > 0 || Boolean(paymentImageUrl);
  const verifiedImageUrl = footerConfig.verifiedImageUrl || null;

  // Split copyright into text + brand link if it contains "Developed By"
  const devIdx = copyright.indexOf("Developed By");
  const copyrightMain =
    devIdx >= 0 ? copyright.slice(0, devIdx + "Developed By".length) : copyright;
  const copyrightBrand =
    devIdx >= 0 ? copyright.slice(devIdx + "Developed By".length).trim() : "";

  useEffect(() => {
    if (settings) return;
    fetchSiteSettings().then(setResolvedSettings).catch(() => setResolvedSettings({}));
  }, [settings]);

  useEffect(() => {
    if (pagesProp) return;
    fetchPublicPages().then(setFetchedPages).catch(() => setFetchedPages([]));
  }, [pagesProp]);

  useEffect(() => {
    if (navItemsProp) return;
    fetchNavItems().then(setFetchedNavItems).catch(() => setFetchedNavItems([]));
  }, [navItemsProp]);

  if (footerConfig.status === false) return null;

  return (
    <footer className="site-footer mt-4">
      <div style={{ width: "90%", maxWidth: 1500, margin: "0 auto", paddingTop: 56, paddingBottom: 40 }}>
        <div className="site-footer-grid">
          {/* Brand: logo, about, contact, social, delivery partners */}
          <div>
            {footerLogoUrl && (
              <Link href="/" style={{ display: "block", marginBottom: 14 }}>
                <div className="relative" style={{ width: 150, height: 60 }}>
                  <Image src={footerLogoUrl} alt="Logo" fill className="object-contain object-left" />
                </div>
              </Link>
            )}
            {description && (
              <p style={{ fontSize: 14, color: "#555", lineHeight: "22px", maxWidth: 480, marginBottom: 20 }}>
                {description}
              </p>
            )}

            {(address || phone || email) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
                {address && (
                  <ContactLine
                    icon={
                      <svg {...contactIconProps}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    }
                  >
                    {address}
                  </ContactLine>
                )}
                {phone && (
                  <ContactLine
                    href={`tel:${phone}`}
                    icon={
                      <svg {...contactIconProps}>
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 .98h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                      </svg>
                    }
                  >
                    {phone}
                  </ContactLine>
                )}
                {email && (
                  <ContactLine
                    href={`mailto:${email}`}
                    icon={
                      <svg {...contactIconProps}>
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M22 6l-10 7L2 6" />
                      </svg>
                    }
                  >
                    {email}
                  </ContactLine>
                )}
              </div>
            )}

            {socialLinks.length > 0 && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
                {socialLinks.map((social) => (
                  <a
                    key={social.id}
                    href={social.url!}
                    target={social.url === "#" ? undefined : "_blank"}
                    rel={social.url === "#" ? undefined : "noreferrer"}
                    title={social.name}
                    aria-label={social.name}
                    className="site-footer-social flex items-center justify-center"
                    style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            )}

            {deliveryPartners.length > 0 && (
              <>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: 12 }}>
                  {footerConfig.deliveryPartnerTitle || "Delivery Partner"} :
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {deliveryPartners.map((partner, index) => (
                    <div
                      key={`${partner.imageUrl}-${index}`}
                      className="relative"
                      style={{ width: 110, height: 40, border: "1px solid #eee", borderRadius: 6, background: "#fff" }}
                    >
                      <Image
                        src={partner.imageUrl}
                        alt={partner.label || "Delivery Partner"}
                        fill
                        className="object-contain"
                        style={{ padding: 4 }}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <LinkColumn title={footerConfig.quickLinksTitle || "Information"} links={informationLinks} />
          <LinkColumn title="Shop By" links={shopByLinks} />
          <LinkColumn title="Support" links={SUPPORT_LINKS} />
          <LinkColumn title={footerConfig.customerLinksTitle || "Customer"} links={customerLinks} />
        </div>

        {/* Copyright row — set from admin › Website › Footer */}
        <div
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between"
          style={{ gap: 20, borderTop: "1px solid #d5e1e6", marginTop: 44, paddingTop: 26 }}
        >
          <p style={{ fontSize: 14, color: "#555" }}>
            {copyrightMain}{" "}
            {copyrightBrand && (
              <a href="#" className="hover:underline" style={{ color: "#F07A22" }}>
                {copyrightBrand}
              </a>
            )}
          </p>

          {hasPayments || verifiedImageUrl ? (
            <div className="flex flex-wrap items-center" style={{ gap: 16 }}>
              {hasPayments && (
                <>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#111", whiteSpace: "nowrap" }}>
                    {footerConfig.paymentTitle || "Pay With"}
                  </span>
                  <span className="hidden sm:block" style={{ alignSelf: "stretch", width: 1, background: "#cfdbe0" }} />
                  {paymentMethods.length > 0 ? (
                    <div className="site-footer-payments">
                      {paymentMethods.map((method, index) => (
                        <span key={`${method.imageUrl}-${index}`} title={method.label} className="site-footer-payment">
                          {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded logo of unknown size */}
                          <img src={method.imageUrl} alt={method.label} />
                        </span>
                      ))}
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded strip of unknown size
                    <img
                      src={paymentImageUrl!}
                      alt="Payment methods"
                      style={{ maxHeight: 96, maxWidth: "min(560px, 100%)", objectFit: "contain" }}
                    />
                  )}
                </>
              )}
              {verifiedImageUrl && (
                <>
                  {hasPayments && (
                    <span className="hidden sm:block" style={{ alignSelf: "stretch", width: 1, background: "#cfdbe0" }} />
                  )}
                  <div>
                    {footerConfig.verifiedTitle !== "" && (
                      <p style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>
                        {footerConfig.verifiedTitle || "Verified by"}
                      </p>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded badge of unknown size */}
                    <img src={verifiedImageUrl} alt={footerConfig.verifiedTitle || "Verified by"} style={{ maxHeight: 32, maxWidth: 140, objectFit: "contain" }} />
                  </div>
                </>
              )}
            </div>
          ) : (
            // Until logos are added in admin, show the SSLCommerz strip
            // (it already includes "Pay With" and the "Verified By" badge).
            <div style={{ flex: 1, maxWidth: 1000, borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(14, 74, 95, 0.1)" }}>
              <Image
                src="/images/sslcommerz-pay-with.png"
                alt="Pay with Visa, Mastercard, bKash, Nagad, Rocket and more — Verified by SSLCommerz"
                width={4096}
                height={458}
                sizes="(max-width: 1024px) 100vw, 1000px"
                style={{ display: "block", width: "100%", height: "auto" }}
              />
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
