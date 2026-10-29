"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCustomer } from "@/context/CustomerContext";
import { fetchSiteSettings } from "@/services/settingService";

const SECONDARY = "#F07A22";

const iconProps = {
  width: 22,
  height: 22,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  viewBox: "0 0 24 24",
};

function NavItem({ href, label, active, icon }: { href: string; label: string; active: boolean; icon: ReactNode }) {
  const external = href.startsWith("http");
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="flex flex-1 flex-col items-center justify-center gap-0.5"
      style={{ color: active ? SECONDARY : "#4B5563", fontSize: 11, fontWeight: active ? 700 : 500 }}
    >
      {icon}
      <span style={{ whiteSpace: "nowrap" }}>{label}</span>
    </Link>
  );
}

// Phone-only bottom tab bar. Its height is published as --mobile-nav-h (globals.css)
// so floating buttons and page bottom bars sit above it.
export default function MobileBottomNav() {
  const pathname = usePathname();
  const { customer } = useCustomer();
  const [chatHref, setChatHref] = useState("/contact");

  useEffect(() => {
    fetchSiteSettings()
      .then((s) => {
        const href = s.whatsappUrl || s.messengerUrl || (s.phone ? `tel:${s.phone}` : null);
        if (href) setChatHref(href);
      })
      .catch(() => {});
  }, []);

  const ordersHref = customer ? "/account?tab=orders" : "/track-order";
  const bazarActive = pathname.startsWith("/one-click-bazar");

  return (
    <nav
      className="mobile-bottom-nav md:hidden print:hidden fixed inset-x-0 bottom-0 z-[90] flex items-stretch bg-white"
      style={{
        height: "var(--mobile-nav-h)",
        borderTop: "1px solid #eee",
        boxShadow: "0 -4px 14px rgba(0,0,0,0.08)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <NavItem
        href="/"
        label="Home"
        active={pathname === "/"}
        icon={
          <svg {...iconProps}>
            <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z" />
          </svg>
        }
      />
      <NavItem
        href="/offers"
        label="Offer"
        active={pathname.startsWith("/offers")}
        icon={
          <svg {...iconProps}>
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
            <circle cx="7" cy="7" r="1.5" />
          </svg>
        }
      />

      {/* Raised ১ ক্লিকে বাজার button in the middle */}
      <Link
        href="/one-click-bazar"
        className="flex flex-1 flex-col items-center gap-0.5"
        style={{
          color: bazarActive ? SECONDARY : "#4B5563",
          fontSize: 11,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        <span
          className="flex items-center justify-center text-white"
          style={{
            width: 52,
            height: 52,
            marginTop: -18,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${SECONDARY}, #D7262E)`,
            border: "4px solid #fff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
          }}
        >
          <svg {...iconProps} width={22} height={22} strokeWidth={2}>
            <path d="M3 3h2l2.4 12.2a2 2 0 002 1.6h8.8a2 2 0 002-1.6L22 7H6" />
            <circle cx="9" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
          </svg>
        </span>
        <span style={{ whiteSpace: "nowrap" }}>১ ক্লিকে বাজার</span>
      </Link>

      <NavItem
        href={ordersHref}
        label="My Orders"
        active={pathname.startsWith("/account") || pathname.startsWith("/track-order")}
        icon={
          <svg {...iconProps}>
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
          </svg>
        }
      />
      <NavItem
        href={chatHref}
        label="Chat"
        active={pathname.startsWith("/contact")}
        icon={
          <svg {...iconProps}>
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
            <path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" strokeWidth={2.6} strokeLinecap="round" />
          </svg>
        }
      />
    </nav>
  );
}
