"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { trackPixelEvent } from "@/lib/pixel";
import type { ComboOffer } from "@/services/comboService";

export default function ComboOrderButton({ combo }: { combo: ComboOffer }) {
  const [qty, setQty] = useState(1);
  const { addComboToCart } = useCart();
  const router = useRouter();

  const handleOrder = () => {
    if (!combo.inStock) return;
    addComboToCart(combo, qty);
    trackPixelEvent("AddToCart", {
      content_ids: combo.items.map((item) => item.productId),
      content_name: combo.title,
      content_type: "product",
      value: combo.offerPrice * qty,
      currency: "BDT",
      num_items: qty,
    });
    router.push("/checkout");
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center" style={{ border: "1.5px solid #ccc", borderRadius: 4, overflow: "hidden" }}>
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold text-xl"
          style={{ width: 42, height: 42 }}
        >−</button>
        <span className="text-center font-bold text-base select-none" style={{ width: 42, borderLeft: "1px solid #ccc", borderRight: "1px solid #ccc", lineHeight: "42px" }}>
          {qty}
        </span>
        <button
          onClick={() => setQty((q) => q + 1)}
          className="flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold text-xl"
          style={{ width: 42, height: 42 }}
        >+</button>
      </div>
      <button
        onClick={handleOrder}
        disabled={!combo.inStock}
        className="flex-1 text-white font-bold tracking-wide transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: "#0E4A5F", borderRadius: 4, height: 42, fontSize: 15 }}
      >
        {combo.inStock ? "ORDER NOW" : "STOCK OUT"}
      </button>
    </div>
  );
}
