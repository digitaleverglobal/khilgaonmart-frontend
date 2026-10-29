"use client";
import { useState } from "react";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import OrderModal from "@/components/OrderModal";
import { useCart } from "@/context/CartContext";
import { trackPixelEvent } from "@/lib/pixel";
import { productHref } from "@/lib/productUrl";
import type { Product, ProductVariant } from "@/data/products";

const PRIMARY = "#0E4A5F";
const SECONDARY = "#F07A22";
const MAX_CHIPS = 3;
const fmt = (v: number) => v.toLocaleString("en-US");
const chipLabel = (variant: ProductVariant) => Object.values(variant.options || {}).join(" / ");

// One row of the product page's Popular Products panel: weight chips + add / quantity stepper.
export default function PopularProductRow({ product, last }: { product: Product; last: boolean }) {
  const variants = (product.variants || []).filter((variant) => variant.newPrice > 0);
  const firstAvailable = variants.find((variant) => variant.inStock) || variants[0] || null;
  const [selected, setSelected] = useState<ProductVariant | null>(firstAvailable);
  const [showModal, setShowModal] = useState(false);
  const { items, addToCart, updateQty, removeFromCart } = useCart();

  const price = selected?.newPrice ?? product.discountedPrice;
  const oldPrice = selected?.oldPrice ?? product.originalPrice;
  const inStock = selected ? selected.inStock : product.inStock !== false;
  const chips = variants.filter((variant) => chipLabel(variant));

  const cartIndex = items.findIndex(
    (i) => !i.comboOfferId && i.id === product.id && i.variantId === selected?.id,
  );
  const cartQty = cartIndex === -1 ? 0 : items[cartIndex].qty;

  const handleAdd = () => {
    if (!inStock) return;
    // Variants without a readable label can't be picked from a chip; let the modal ask.
    if (product.hasVariants && !chips.length) {
      setShowModal(true);
      return;
    }
    addToCart(product, 1, selected);
    trackPixelEvent("AddToCart", {
      content_ids: [product.id],
      content_name: product.name,
      content_type: "product",
      value: price,
      currency: "BDT",
      num_items: 1,
    });
  };

  const handleDecrease = () => {
    if (cartIndex === -1) return;
    if (cartQty <= 1) removeFromCart(cartIndex);
    else updateQty(cartIndex, cartQty - 1);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "12px 0",
          borderBottom: last ? "none" : "1px solid #eef0f2",
        }}
      >
        <Link
          href={productHref(product)}
          className="transition hover:opacity-80"
          style={{
            position: "relative",
            width: 64,
            height: 64,
            flexShrink: 0,
            borderRadius: 6,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
          }}
        >
          <SafeImage sources={[selected?.image, product.image, ...(product.gallery || [])]} alt={product.name} fill className="object-contain" />
        </Link>

        <div style={{ flex: 1, minWidth: 0 }}>
          <Link
            href={productHref(product)}
            className="transition-colors hover:text-[#0E4A5F]"
            style={{
              margin: 0,
              padding: "3px 0",
              fontSize: 14,
              fontWeight: 600,
              color: "#1f2937",
              lineHeight: 1.35,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textDecoration: "none",
            }}
          >
            {product.name}
          </Link>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: PRIMARY }}>৳{fmt(price)}</span>
              {oldPrice > price && (
                <span style={{ fontSize: 12, color: "#9ca3af", textDecoration: "line-through" }}>৳{fmt(oldPrice)}</span>
              )}
              {!inStock && <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 700 }}>Stock Out</span>}
            </div>

            {cartQty > 0 ? (
              <div
                className="flex flex-shrink-0 items-center text-white font-bold"
                style={{ height: 26, borderRadius: 999, background: PRIMARY }}
              >
                <button
                  type="button"
                  onClick={handleDecrease}
                  className="flex h-full items-center justify-center"
                  style={{ width: 28 }}
                  aria-label={`Decrease ${product.name} quantity`}
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24"><path d="M5 12h14" /></svg>
                </button>
                <span className="text-center" style={{ minWidth: 20, fontSize: 13 }}>{cartQty}</span>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!inStock}
                  className="flex h-full items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ width: 28 }}
                  aria-label={`Increase ${product.name} quantity`}
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                disabled={!inStock}
                title="Add to Cart"
                aria-label={`Add ${product.name} to cart`}
                className="flex flex-shrink-0 items-center justify-center text-white shadow transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ width: 26, height: 26, borderRadius: "50%", background: PRIMARY }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
              </button>
            )}
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5" style={{ marginTop: 6 }}>
              {chips.slice(0, MAX_CHIPS).map((variant) => {
                const active = selected?.id === variant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelected(variant)}
                    className="transition-colors"
                    style={{
                      fontSize: 11,
                      lineHeight: "16px",
                      padding: "4px 8px",
                      borderRadius: 3,
                      border: `1px solid ${active ? PRIMARY : "#d1d5db"}`,
                      color: active ? PRIMARY : variant.inStock ? "#6b7280" : "#c0c4cc",
                      background: active ? "#eef6f9" : "#fff",
                      textDecoration: variant.inStock ? "none" : "line-through",
                    }}
                  >
                    {chipLabel(variant)}
                  </button>
                );
              })}
              {chips.length > MAX_CHIPS && (
                <Link href={productHref(product)} style={{ fontSize: 11, lineHeight: "16px", padding: "5px 6px", color: SECONDARY, fontWeight: 700 }}>
                  +{chips.length - MAX_CHIPS}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && <OrderModal product={product} onClose={() => setShowModal(false)} />}
    </>
  );
}
