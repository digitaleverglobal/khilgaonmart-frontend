"use client";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { usePathname, useRouter } from "next/navigation";
import { NavItem, Product } from "@/data/products";
import { STORE_LINKS, categoryHref } from "@/lib/storeNav";
import { productHref } from "@/lib/productUrl";
import StoreLinkIcon from "@/components/StoreLinkIcon";
import { fetchNavItems } from "@/services/menuService";
import { fetchStorefrontProducts } from "@/services/productService";
import { fetchSiteSettings } from "@/services/settingService";
import { useCart } from "@/context/CartContext";
import { useCustomer } from "@/context/CustomerContext";
import AccountMenu from "@/components/AccountMenu";
import CartDrawer from "@/components/CartDrawer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { trackPixelEvent } from "@/lib/pixel";

const PRIMARY   = "#0E4A5F";   // logo deep teal
const SECONDARY = "#F07A22";   // logo sunset orange

// Opens the ১ ক্লিকে বাজার list builder (pick products category by category).
function BazarButton() {
  return (
    <Link
      href="/one-click-bazar"
      className="flex items-center justify-center text-white font-bold hover:opacity-90 transition-opacity"
      style={{
        background: `linear-gradient(135deg, ${SECONDARY}, #D7262E)`,
        borderRadius: 8,
        height: 42,
        padding: "0 14px",
        gap: 6,
        fontSize: 13,
        whiteSpace: "nowrap",
        flexShrink: 0,
        textDecoration: "none",
      }}
    >
      <svg width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M3 3h2l2.4 12.2a2 2 0 002 1.6h8.8a2 2 0 002-1.6L22 7H6" /><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
      </svg>
      ১ ক্লিকে বাজার
    </Link>
  );
}

interface HeaderProps {
  logoUrl?: string | null;
  // When the parent is a Server Component it can fetch this once (cached,
  // deduped against any other /menu/public call in the same render) and
  // pass it down, skipping the extra client round-trip below.
  navItems?: NavItem[];
}

function applyFavicon(url: string | null) {
  if (!url) return;
  const existing = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  const link = existing || document.createElement("link");
  link.rel = "icon";
  link.href = url;
  if (!existing) document.head.appendChild(link);
}

function HeaderInner({ logoUrl, navItems: navItemsProp }: HeaderProps) {
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [mobileExpand,  setMobileExpand]  = useState<string | null>(null);
  const [mobileSubExpand, setMobileSubExpand] = useState<string | null>(null);
  const [search,        setSearch]        = useState("");
  const [navItems,      setNavItems]      = useState<NavItem[]>(navItemsProp ?? []);
  const [resolvedLogo,  setResolvedLogo]  = useState<string | null>(logoUrl || null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Search dropdown
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const searchRef       = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const lastSearchTrackedRef = useRef("");
  const searchSeqRef = useRef(0);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  // Expose the sticky header's height so the category sidebar can stick
  // directly below it.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () =>
      document.documentElement.style.setProperty("--site-header-h", `${el.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Category sidebar collapse state lives on <html> so the sidebar (a
  // separate component) can react via CSS; remembered across visits.
  useEffect(() => {
    try {
      setSidebarCollapsed(localStorage.getItem("sidebarCollapsed") === "1");
    } catch {}
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (sidebarCollapsed) root.dataset.sidebar = "collapsed";
    else delete root.dataset.sidebar;
    try {
      localStorage.setItem("sidebarCollapsed", sidebarCollapsed ? "1" : "0");
    } catch {}
  }, [sidebarCollapsed]);

  // If the parent (a Server Component) already fetched the menu, skip this
  // fetch entirely — otherwise fall back to fetching it here on mount.
  useEffect(() => {
    if (navItemsProp !== undefined) return;
    fetchNavItems().then((items) => {
      if (items.length > 0) setNavItems(items);
    });
  }, [navItemsProp]);

  // Sync logo from prop (server-side) or fetch from API on client
  useEffect(() => {
    if (logoUrl) { setResolvedLogo(logoUrl); return; }
    fetchSiteSettings().then((s) => {
      setResolvedLogo(s.logoUrl || null);
      applyFavicon(s.faviconUrl);
    });
  }, [logoUrl]);

  // Debounced server-side search — queries the backend directly instead of
  // bulk-loading the whole catalog into the browser and filtering locally.
  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setSearchResults([]);
      setSearchOpen(false);
      setSearchLoading(false);
      return;
    }
    setSearchOpen(true);
    setSearchLoading(true);
    const seq = ++searchSeqRef.current;
    const timer = window.setTimeout(() => {
      fetchStorefrontProducts({ searchTerm: q, limit: 10 })
        .then(({ products }) => {
          if (searchSeqRef.current === seq) setSearchResults(products);
        })
        .catch((e) => {
          console.error("Search: failed to fetch products", e);
          if (searchSeqRef.current === seq) setSearchResults([]);
        })
        .finally(() => {
          if (searchSeqRef.current === seq) setSearchLoading(false);
        });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  // Close search dropdown when clicking outside (both mobile & desktop search)
  useEffect(() => {
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      const outsideDesktop = !searchRef.current?.contains(t);
      const outsideMobile  = !mobileSearchRef.current?.contains(t);
      if (outsideDesktop && outsideMobile) setSearchOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const { totalItems, totalPrice } = useCart();
  const { customer } = useCustomer();
  const [cartOpen, setCartOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2 || lastSearchTrackedRef.current === q) return;
    const timer = window.setTimeout(() => {
      lastSearchTrackedRef.current = q;
      trackPixelEvent(
        "Search",
        {
          content_ids: searchResults.map((item) => item.id),
          content_name: q,
          content_type: "product",
          value: 0,
          currency: "BDT",
          num_items: searchResults.length,
        },
        customer ? { customerId: customer.Id, name: customer.name, phone: customer.phone } : undefined,
      );
    }, 800);
    return () => window.clearTimeout(timer);
  }, [customer, search, searchResults]);

  const handleCartCheckout = () => {
    setCartOpen(false);
    router.push("/checkout");
  };

  const closeCart = useCallback(() => setCartOpen(false), []);

  return (
    <header ref={headerRef} className="w-full sticky top-0 z-50 shadow-md">

      {/* ── Logo / Search / Cart bar ── */}
      <div className="bg-white border-b border-gray-100">

        {/* ══ MOBILE layout (< md): 2 rows ══ */}
        <div className="md:hidden">
          {/* Row 1: hamburger | logo | track order · account · cart */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 12px" }}>

            {/* Hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)} style={{ color: "#374151", background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}>
              <svg width={26} height={26} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>

            {/* Logo — centered */}
            <Link href="/" style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center" }}>
              <div style={{ position: "relative", width: "100%", maxWidth: 110, height: 44 }}>
                {resolvedLogo && (
                  <img src={resolvedLogo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                )}
              </div>
            </Link>

            {/* Right icons: same three as desktop, with labels */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            <Link href="/track-order" className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#0E4A5F] transition-colors">
              <svg width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <span style={{ fontSize: 11, whiteSpace: "nowrap" }}>Track Order</span>
            </Link>

            <AccountMenu compact />

            {/* Cart icon */}
            <div className="relative" style={{ flexShrink: 0 }}>
              <button
                onClick={() => setCartOpen(true)}
                className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#0E4A5F] transition-colors"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, position: "relative" }}
              >
                <div className="relative">
                  <svg width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
                  </svg>
                  <span
                    className="absolute -top-2 -right-2 text-white flex items-center justify-center rounded-full font-bold"
                    style={{ background: SECONDARY, width: 16, height: 16, fontSize: 10, lineHeight: "16px" }}
                  >{totalItems}</span>
                </div>
                <span style={{ fontSize: 11, whiteSpace: "nowrap" }}>৳{totalPrice.toLocaleString("en-US")}</span>
              </button>
            </div>
            </div>
          </div>

          {/* Row 2: Search bar — full width */}
          <div style={{ padding: "0 14px 10px", position: "relative" }} ref={mobileSearchRef}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", height: 40, border: `2px solid ${PRIMARY}`, borderRadius: 50, overflow: "hidden" }}>
              <button
                style={{ width: 44, height: "100%", background: "#f7f7f7", display: "flex", alignItems: "center", justifyContent: "center", border: "none", flexShrink: 0, cursor: "pointer" }}
                onClick={() => search.trim() && setSearchOpen((o) => !o)}
              >
                <svg width={18} height={18} fill="none" stroke={PRIMARY} strokeWidth={2.5} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </button>
              <input
                type="text"
                placeholder="Search Product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                style={{ flex: 1, height: "100%", background: "#f7f7f7", border: "none", outline: "none", padding: "0 10px", fontSize: 13, color: "#555" }}
              />
              {search && (
                <button onClick={() => { setSearch(""); setSearchOpen(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 10px", color: "#999", flexShrink: 0, fontSize: 18, lineHeight: 1 }}>×</button>
              )}
            </div>
            </div>

            {/* Search results */}
            {searchOpen && searchResults.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 14, right: 14, background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", borderRadius: 8, border: "1px solid #e5e7eb", zIndex: 9999, maxHeight: 400, overflowY: "auto" }}>
                {searchResults.map((p, idx) => (
                  <Link key={p.id} href={productHref(p)} onClick={() => { setSearchOpen(false); setSearch(""); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderBottom: idx < searchResults.length - 1 ? "1px solid #f3f4f6" : "none", textDecoration: "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb", flexShrink: 0, position: "relative", background: "#f9fafb" }}>
                      <SafeImage sources={[p.image, ...(p.gallery || [])]} alt={p.name} fill className="object-contain" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, color: "#1f2937", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        {p.discount > 0 && <span style={{ fontSize: 11, color: "#9ca3af", textDecoration: "line-through" }}>৳{p.originalPrice.toLocaleString("en-US")}</span>}
                        <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>৳{p.discountedPrice.toLocaleString("en-US")}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {searchOpen && search.trim() && searchResults.length === 0 && !searchLoading && (
              <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 14, right: 14, background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", borderRadius: 8, border: "1px solid #e5e7eb", zIndex: 9999, padding: "14px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                কোনো পণ্য পাওয়া যায়নি
              </div>
            )}
          </div>
        </div>

        {/* ══ DESKTOP layout (md+): logo | search | icons ══ */}
        <div className="hidden md:grid header-logo-bar" style={{ gap: 0 }}>
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div style={{ position: "relative", width: "100%", maxWidth: 260, height: 70 }}>
              {resolvedLogo && (
                <img src={resolvedLogo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "left center" }} />
              )}
            </div>
          </Link>

          {/* Search */}
          <div style={{ padding: "0 11px", position: "relative" }} ref={searchRef}>
            <div style={{ display: "flex", alignItems: "center", height: 44, border: `2px solid ${PRIMARY}`, borderRadius: 50, overflow: "hidden" }}>
              <button
                style={{ width: "12%", height: "100%", background: "#f7f7f7", display: "flex", alignItems: "center", justifyContent: "center", border: "none", flexShrink: 0, cursor: "pointer" }}
                onClick={() => search.trim() && setSearchOpen((o) => !o)}
              >
                <svg width={20} height={20} fill="none" stroke={PRIMARY} strokeWidth={2.5} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </button>
              <input
                type="text"
                placeholder="Search Product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                style={{ width: "90%", height: "100%", background: "#f7f7f7", border: "none", outline: "none", padding: "0 12px", fontSize: 12, color: "#555" }}
              />
              {search && (
                <button onClick={() => { setSearch(""); setSearchOpen(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 10px", color: "#999", flexShrink: 0, fontSize: 18, lineHeight: 1 }}>×</button>
              )}
            </div>

            {searchOpen && searchResults.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", borderRadius: 8, border: "1px solid #e5e7eb", zIndex: 9999, maxHeight: 480, overflowY: "auto" }}>
                {searchResults.map((p, idx) => (
                  <Link key={p.id} href={productHref(p)} onClick={() => { setSearchOpen(false); setSearch(""); }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: idx < searchResults.length - 1 ? "1px solid #f3f4f6" : "none", textDecoration: "none", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <div style={{ width: 50, height: 50, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb", flexShrink: 0, position: "relative", background: "#f9fafb" }}>
                      <SafeImage sources={[p.image, ...(p.gallery || [])]} alt={p.name} fill className="object-contain" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, color: "#1f2937", fontWeight: 500 }}>{p.name}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                        {p.discount > 0 && <span style={{ fontSize: 12, color: "#9ca3af", textDecoration: "line-through" }}>৳{p.originalPrice.toLocaleString("en-US")}</span>}
                        <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>৳{p.discountedPrice.toLocaleString("en-US")}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {searchOpen && search.trim() && searchResults.length === 0 && !searchLoading && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", borderRadius: 8, border: "1px solid #e5e7eb", zIndex: 9999, padding: "20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                কোনো পণ্য পাওয়া যায়নি
              </div>
            )}
          </div>

          {/* Right icons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 20 }}>
            <BazarButton />

            <Link href="/track-order" className="hidden md:flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#0E4A5F] transition-colors">
              <svg width={24} height={24} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <span style={{ fontSize: 11 }}>Track Order</span>
            </Link>

            <AccountMenu />

            {/* Cart — opens the cart drawer */}
            <div className="relative">
              <button onClick={() => setCartOpen(true)} className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#0E4A5F] transition-colors">
                <div className="relative">
                  <svg width={26} height={26} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
                  </svg>
                  <span className="absolute -top-2 -right-2 text-white flex items-center justify-center rounded-full font-bold" style={{ background: SECONDARY, width: 18, height: 18, fontSize: 11, lineHeight: "18px" }}>{totalItems}</span>
                </div>
                <span style={{ fontSize: 11 }}>৳{totalPrice.toLocaleString("en-US")}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── Navigation bar ── */}
      <nav style={{ position: "relative", backgroundColor: PRIMARY, borderBottom: "3px solid transparent", borderImage: "linear-gradient(90deg, #1BAEE4 0 33%, #F6C92C 33% 66%, #F07A22 66% 100%) 1" }}>
        {/* Shrinks/expands the desktop category sidebar */}
        <button
          type="button"
          className="sidebar-toggle hidden md:flex"
          onClick={() => setSidebarCollapsed((v) => !v)}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={sidebarCollapsed}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div style={{ width: "90%", margin: "0 auto" }}>

          {/* Desktop nav — fixed store links; categories live in the sidebar */}
          <ul className="hidden md:flex items-center justify-evenly">
            {STORE_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-white uppercase font-semibold whitespace-nowrap transition-colors hover:opacity-80"
                    style={{
                      fontSize: 13,
                      padding: "16px 6px",
                      borderBottom: isActive ? `3px solid ${SECONDARY}` : "3px solid transparent",
                    }}
                  >
                    <StoreLinkIcon name={link.icon} size={16} />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Mobile nav — store links, then the category tree */}
          {mobileOpen && (
            <div className="md:hidden">
              {STORE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 text-white border-b"
                  style={{
                    fontSize: 14,
                    padding: "12px 16px",
                    borderColor: "rgba(255,255,255,0.2)",
                    fontWeight: pathname === link.href ? 700 : 400,
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  <StoreLinkIcon name={link.icon} size={17} />
                  {link.label}
                </Link>
              ))}

              {navItems.length > 0 && (
                <p className="text-white/60 uppercase" style={{ fontSize: 11, letterSpacing: 1, padding: "14px 16px 6px", margin: 0 }}>
                  Categories
                </p>
              )}

              {navItems.map((item) => {
                const subItems = Array.isArray(item.sub) ? item.sub : [];
                const isExpanded = mobileExpand === item.label;

                return (
                  <div key={item.label}>
                    {/* The name opens the category page; the arrow expands its subcategories. */}
                    <div
                      className="flex items-center justify-between text-white border-b"
                      style={{ fontSize: 14, borderColor: "rgba(255,255,255,0.2)" }}
                    >
                      <Link
                        href={categoryHref(item.label)}
                        className="flex-1 text-white"
                        style={{ padding: "12px 16px" }}
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.label}
                      </Link>
                      {subItems.length > 0 && (
                        <button
                          type="button"
                          className="text-white/60"
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "12px 16px", fontSize: 14 }}
                          aria-label={isExpanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
                          aria-expanded={isExpanded}
                          onClick={() => {
                            setMobileExpand(isExpanded ? null : item.label);
                            setMobileSubExpand(null);
                          }}
                        >
                          {isExpanded ? "▾" : "›"}
                        </button>
                      )}
                    </div>

                    {isExpanded && subItems.length > 0 && (
                      <div style={{ backgroundColor: "rgba(0,0,0,0.25)" }}>
                        {subItems.map((sub) => {
                          const childItems = Array.isArray(sub.childItems) ? sub.childItems : [];
                          const subKey = `${item.label}/${sub.label}`;
                          const isSubExpanded = mobileSubExpand === subKey;
                          return (
                          <div key={sub.label}>
                            <div
                              className="flex items-center border-b"
                              style={{ fontSize: 13, borderColor: "rgba(255,255,255,0.1)" }}
                            >
                              <Link
                                href={categoryHref(item.label, sub.label)}
                                className="flex flex-1 items-center gap-2 text-white/90"
                                style={{ padding: "10px 0 10px 28px" }}
                                onClick={() => setMobileOpen(false)}
                              >
                                <span style={{ color: PRIMARY }}>›</span>
                                <span style={{ flex: 1 }}>{sub.label}</span>
                              </Link>
                              {childItems.length > 0 && (
                                <button
                                  type="button"
                                  className="text-white/60"
                                  style={{ background: "none", border: "none", cursor: "pointer", padding: "10px 28px 10px 16px", fontSize: 13 }}
                                  aria-label={isSubExpanded ? `Collapse ${sub.label}` : `Expand ${sub.label}`}
                                  aria-expanded={isSubExpanded}
                                  onClick={() => setMobileSubExpand(isSubExpanded ? null : subKey)}
                                >
                                  {isSubExpanded ? "▾" : "›"}
                                </button>
                              )}
                            </div>
                            {isSubExpanded && childItems.map((child) => (
                              <Link
                                key={`${sub.label}-${child.label}`}
                                href={categoryHref(item.label, sub.label, child.label)}
                                className="flex items-center gap-2 text-white/80 border-b"
                                style={{ fontSize: 12, padding: "9px 28px 9px 46px", borderColor: "rgba(255,255,255,0.08)" }}
                                onClick={() => setMobileOpen(false)}
                              >
                                <span style={{ color: PRIMARY }}>›</span>
                                {child.label}
                              </Link>
                            ))}
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <MobileBottomNav />
      {cartOpen && <CartDrawer onClose={closeCart} onCheckout={handleCartCheckout} />}
    </header>
  );
}

export default function Header({ logoUrl, navItems }: HeaderProps) {
  return (
    <Suspense>
      <HeaderInner logoUrl={logoUrl} navItems={navItems} />
    </Suspense>
  );
}
