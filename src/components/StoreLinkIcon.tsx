import type { StoreLinkIcon as IconName } from "@/lib/storeNav";

const PATHS: Record<IconName, React.ReactNode> = {
  shop: (
    <>
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M4 9v11h16V9" />
      <path d="M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0" />
    </>
  ),
  combo: (
    <>
      <rect x="3" y="8" width="18" height="13" rx="1" />
      <path d="M12 8v13M3 12h18" />
      <path d="M12 8C10 4 6 4 6.5 6.5S12 8 12 8zM12 8c2-4 6-4 5.5-1.5S12 8 12 8z" />
    </>
  ),
  flash: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
  offer: (
    <>
      <path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </>
  ),
  delivery: (
    <>
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </>
  ),
  coupon: (
    <>
      <path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7z" />
      <path d="M9 9l6 6M9.5 15h.01M14.5 9h.01" />
    </>
  ),
};

export default function StoreLinkIcon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      {PATHS[name]}
    </svg>
  );
}
