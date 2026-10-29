"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import SafeImage from "@/components/SafeImage";
import { useCart } from "@/context/CartContext";

const PRIMARY   = "#0E4A5F";
const SECONDARY = "#F07A22";
const formatPrice = (value: number) => value.toLocaleString("en-US");

export default function CartDrawer({ onClose, onCheckout }: { onClose: () => void; onCheckout: () => void }) {
  const { items, removeFromCart, updateQty, clearCart, totalPrice } = useCart();

  // Lock page scroll and close on Escape while the drawer is open.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[10000]">
      <style>{`
        @keyframes cartFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cartSlide { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>

      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,.45)", animation: "cartFade .2s ease-out" }}
        onClick={onClose}
      />

      <aside
        className="absolute right-0 top-0 flex h-full flex-col bg-white shadow-2xl"
        style={{ width: "min(580px, 100vw)", animation: "cartSlide .25s ease-out" }}
        role="dialog"
        aria-label="Shopping Cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200" style={{ padding: "16px clamp(16px, 4vw, 24px)" }}>
          <h2 className="font-semibold text-[#222]" style={{ fontSize: 20 }}>Shopping Cart</h2>
          <div className="flex items-center gap-5">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="flex items-center gap-1 text-gray-400 transition-colors hover:text-[#D7262E]"
                style={{ fontSize: 14 }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
                Clear All
              </button>
            )}
            <button onClick={onClose} className="text-[#222] transition-colors hover:text-[#D7262E]" aria-label="Close cart">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "8px clamp(16px, 4vw, 24px)" }}>
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
              <svg width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
              </svg>
              <p style={{ fontSize: 14 }}>Your cart is empty</p>
            </div>
          ) : (
            items.map((item, idx) => {
              const variant = item.variant || [item.size, item.color].filter(Boolean).join(", ");
              return (
                <div key={idx} className="flex items-center gap-3 border-b border-gray-100" style={{ padding: "14px 0" }}>
                  <SafeImage
                    sources={[item.image, ...(item.images || [])]}
                    alt={item.name}
                    width={48}
                    height={48}
                    style={{ objectFit: "contain", flexShrink: 0 }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[#222]" style={{ margin: 0, fontSize: 14, lineHeight: "20px" }}>
                      {item.name}{variant ? ` - ${variant}` : ""}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                      <div className="flex min-w-0 items-center gap-2" style={{ fontSize: 14 }}>
                        <span className="whitespace-nowrap font-semibold" style={{ color: SECONDARY }}>৳ {formatPrice(item.price)}</span>
                        {variant && <span className="truncate border-l border-gray-300 pl-2 text-gray-500">{variant}</span>}
                      </div>
                      <div className="ml-auto flex flex-shrink-0 items-center gap-3">
                        <span className="whitespace-nowrap font-semibold text-[#222]" style={{ fontSize: 14, marginRight: 8 }}>
                          ৳ {formatPrice(item.price * item.qty)}
                        </span>
                        <button
                          onClick={() => removeFromCart(idx)}
                          className="text-gray-500 transition-colors hover:text-[#D7262E]"
                          title="Remove"
                        >
                          <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
                        </button>
                        <button
                          onClick={() => updateQty(idx, item.qty - 1)}
                          disabled={item.qty <= 1}
                          className="flex items-center justify-center rounded-full border border-gray-300 text-[#222] transition-colors hover:border-[#0E4A5F] disabled:cursor-not-allowed disabled:opacity-40"
                          style={{ width: 24, height: 24 }}
                          aria-label="Decrease quantity"
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M5 12h14" /></svg>
                        </button>
                        <span className="text-center text-[#222]" style={{ minWidth: 18, fontSize: 15 }}>{item.qty}</span>
                        <button
                          onClick={() => updateQty(idx, item.qty + 1)}
                          className="flex items-center justify-center rounded-full border border-gray-300 text-[#222] transition-colors hover:border-[#0E4A5F]"
                          style={{ width: 24, height: 24 }}
                          aria-label="Increase quantity"
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200" style={{ padding: "16px clamp(16px, 4vw, 24px) 24px" }}>
            <div className="flex items-center justify-between text-[#222]" style={{ marginBottom: 20 }}>
              <span className="font-semibold" style={{ fontSize: 16 }}>Total:</span>
              <span className="font-semibold" style={{ fontSize: 18 }}>৳ {formatPrice(totalPrice)}</span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: PRIMARY, borderRadius: 6, height: 40, fontSize: 14 }}
            >
              Proceed To Checkout
            </button>
          </div>
        )}
      </aside>
    </div>,
    document.body,
  );
}
