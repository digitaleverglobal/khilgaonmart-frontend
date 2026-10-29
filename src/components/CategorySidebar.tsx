"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { NavItem } from "@/data/products";
import { STORE_LINKS, categoryHref } from "@/lib/storeNav";
import StoreLinkIcon from "@/components/StoreLinkIcon";

const PRIMARY   = "#0E4A5F";
const SECONDARY = "#F07A22";

// Each quick link gets its own accent so the list scans like Chaldal's.
const QUICK_LINK_COLORS: Record<string, string> = {
  "/coupons":       "#16A34A",
  "/offers":        "#2563EB",
  "/flash-sale":    "#DC2626",
  "/combo-offer":   "#9333EA",
  "/free-delivery": "#F07A22",
};

const lower = (s: string) => s.toLowerCase();

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width={12} height={12} viewBox="0 0 12 12" fill="none" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} aria-hidden>
      <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface RowProps {
  href: string;
  label: string;
  depth: number;
  active: boolean;
  expandable: boolean;
  expanded: boolean;
  onToggle: () => void;
}

function Row({ href, label, depth, active, expandable, expanded, onToggle }: RowProps) {
  return (
    <div className="cat-sidebar-row" style={{ display: "flex", alignItems: "center", paddingLeft: 10 + depth * 11 }}>
      <Link
        href={href}
        onClick={() => expandable && !expanded && onToggle()}
        style={{
          flex: 1,
          minWidth: 0,
          padding: "10px 0",
          fontSize: depth === 0 ? 15 : 14,
          fontWeight: active ? 700 : 400,
          color: active ? SECONDARY : "#1f2937",
          textDecoration: "none",
          lineHeight: 1.3,
        }}
      >
        {label}
      </Link>
      {expandable && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
          aria-expanded={expanded}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "10px 12px", color: active ? SECONDARY : "#6b7280", display: "flex" }}
        >
          <Chevron open={expanded} />
        </button>
      )}
    </div>
  );
}

// The category a page belongs to when it isn't in the URL (e.g. a product page).
interface CurrentCategory {
  menu?: string;
  sub?: string;
  child?: string;
}

function CategorySidebarInner({ navItems, current }: { navItems: NavItem[]; current?: CurrentCategory }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onHome = pathname === "/";
  const activeMenu  = onHome ? searchParams.get("menu")  || "" : current?.menu  || "";
  const activeSub   = onHome ? searchParams.get("sub")   || "" : current?.sub   || "";
  const activeChild = onHome ? searchParams.get("child") || "" : current?.child || "";

  // The current category's branch is open by default; the user's own
  // toggles override that per row.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const activeKeys = new Set<string>();
  if (activeMenu) {
    activeKeys.add(lower(activeMenu));
    if (activeSub) activeKeys.add(`${lower(activeMenu)}/${lower(activeSub)}`);
  }
  const expanded = { has: (key: string) => toggled[key] ?? activeKeys.has(key) };

  const toggle = (key: string) =>
    setToggled((prev) => ({ ...prev, [key]: !(prev[key] ?? activeKeys.has(key)) }));

  const quickLinks = STORE_LINKS.filter((l) => l.href !== "/shop");

  return (
    <nav aria-label="Product categories" className="cat-sidebar">
      <div style={{ padding: "8px 0", borderBottom: "1px solid #eef0f2" }}>
        {quickLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              title={link.label}
              className="cat-sidebar-row cat-sidebar-quick"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                fontSize: 14,
                fontWeight: active ? 700 : 400,
                color: active ? SECONDARY : "#1f2937",
                textDecoration: "none",
              }}
            >
              <span style={{ color: QUICK_LINK_COLORS[link.href] ?? PRIMARY, display: "flex" }}>
                <StoreLinkIcon name={link.icon} />
              </span>
              <span className="cat-sidebar-label">{link.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="cat-sidebar-cats" style={{ padding: "8px 0" }}>
        <Link
          href="/shop"
          className="cat-sidebar-row"
          style={{
            display: "block",
            padding: "10px",
            fontSize: 15,
            fontWeight: pathname === "/shop" ? 700 : 400,
            color: pathname === "/shop" ? SECONDARY : "#1f2937",
            textDecoration: "none",
          }}
        >
          All Products
        </Link>

        {navItems.map((item) => {
          const menuKey = lower(item.label);
          const subItems = Array.isArray(item.sub) ? item.sub : [];
          const isMenuActive = lower(activeMenu) === menuKey;
          const isMenuOpen = expanded.has(menuKey);

          return (
            <div key={item.label}>
              <Row
                href={categoryHref(item.label)}
                label={item.label}
                depth={0}
                active={isMenuActive}
                expandable={subItems.length > 0}
                expanded={isMenuOpen}
                onToggle={() => toggle(menuKey)}
              />

              {isMenuOpen && subItems.map((sub) => {
                const subKey = `${menuKey}/${lower(sub.label)}`;
                const childItems = Array.isArray(sub.childItems) ? sub.childItems : [];
                const isSubActive = isMenuActive && lower(activeSub) === lower(sub.label);
                const isSubOpen = expanded.has(subKey);

                return (
                  <div key={sub.label}>
                    <Row
                      href={categoryHref(item.label, sub.label)}
                      label={sub.label}
                      depth={1}
                      active={isSubActive && !activeChild}
                      expandable={childItems.length > 0}
                      expanded={isSubOpen}
                      onToggle={() => toggle(subKey)}
                    />

                    {isSubOpen && childItems.map((child) => (
                      <Row
                        key={child.label}
                        href={categoryHref(item.label, sub.label, child.label)}
                        label={child.label}
                        depth={2}
                        active={isSubActive && lower(activeChild) === lower(child.label)}
                        expandable={false}
                        expanded={false}
                        onToggle={() => {}}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

// Tablet/desktop (md+) category tree; on phones the header's hamburger menu
// lists the same categories.
export default function CategorySidebar({ navItems, current }: { navItems: NavItem[]; current?: CurrentCategory }) {
  return (
    <aside className="cat-sidebar-wrap hidden md:block">
      <Suspense>
        <CategorySidebarInner navItems={navItems} current={current} />
      </Suspense>
    </aside>
  );
}
