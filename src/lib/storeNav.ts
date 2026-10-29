// Fixed storefront links shown in the header nav bar and at the top of the
// category sidebar. Categories themselves come from the admin menu API.

export type StoreLinkIcon = "shop" | "combo" | "flash" | "offer" | "delivery" | "coupon";

export interface StoreLink {
  label: string;
  href: string;
  icon: StoreLinkIcon;
}

export const STORE_LINKS: StoreLink[] = [
  { label: "Shop",          href: "/shop",          icon: "shop" },
  { label: "Combo Offer",   href: "/combo-offer",   icon: "combo" },
  { label: "Flash Sale",    href: "/flash-sale",    icon: "flash" },
  { label: "Offers",        href: "/offers",        icon: "offer" },
  { label: "Free Delivery", href: "/free-delivery", icon: "delivery" },
  { label: "Get Coupon",    href: "/coupons",       icon: "coupon" },
];

// Category links still use the homepage query format; keep them built in one
// place so the planned /category/[id] route only has to change this helper.
export function categoryHref(menu: string, sub?: string, child?: string): string {
  const qs = new URLSearchParams({ menu });
  if (sub) qs.set("sub", sub);
  if (sub && child) qs.set("child", child);
  return `/?${qs.toString()}`;
}
