"use client";
import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed right-4 z-[100] w-10 h-10 bg-[#0E4A5F] hover:bg-[#F07A22] text-white rounded-full shadow-lg flex items-center justify-center transition-all"
      title="Back to top"
      style={{ bottom: "calc(5rem + var(--bottom-bar-h, 0px) + var(--mobile-nav-h, 0px))" }}
    >
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path d="M18 15l-6-6-6 6"/>
      </svg>
    </button>
  );
}
