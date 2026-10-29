"use client";
import { useState } from "react";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import Container from "@/components/Container";
import HorizontalCarousel from "@/components/HorizontalCarousel";
import OrderModal from "@/components/OrderModal";
import { useCart } from "@/context/CartContext";
import { trackPixelEvent } from "@/lib/pixel";
import { productHref } from "@/lib/productUrl";
import type { Product, ProductVariant } from "@/data/products";

const PRIMARY = "#0E4A5F";
const SECONDARY = "#F07A22";
const MAX_CHIPS = 3;
const formatPrice = (value: number) => value.toLocaleString("en-US");
const chipLabel = (variant: ProductVariant) => Object.values(variant.options || {}).join(" / ");

export function ProductTile({ product }: { product: Product }) {
  const variants = (product.variants || []).filter((variant) => variant.newPrice > 0);
  const firstAvailable = variants.find((variant) => variant.inStock) || variants[0] || null;
  const [selected, setSelected] = useState<ProductVariant | null>(firstAvailable);
  const [added, setAdded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { items, addToCart, updateQty, removeFromCart } = useCart();

  // Cart line for the product + currently selected variant; while it exists the + turns into a stepper.
  const cartIndex = items.findIndex(
    (i) => !i.comboOfferId && i.id === product.id && i.variantId === selected?.id,
  );
  const cartQty = cartIndex === -1 ? 0 : items[cartIndex].qty;

  const price = selected?.newPrice ?? product.discountedPrice;
  const oldPrice = selected?.oldPrice ?? product.originalPrice;
  const inStock = selected ? selected.inStock : product.inStock !== false;
  const chips = variants.filter((variant) => chipLabel(variant));

  const handleAdd = () => {
    if (!inStock) return;
    // Variants without a readable label can't be picked from a chip; let the modal ask.
    if (product.hasVariants && !chips.length) {
      setShowModal(true);
      return;
    }
    addToCart(product, 1, selected);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
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
      <div className="flex h-full flex-col bg-white border border-[#e5e7eb] transition-shadow hover:shadow-md" style={{ borderRadius: 6, padding: "clamp(8px, 1.6vw, 14px)" }}>
        <div className="relative">
          <Link href={productHref(product)} className="block">
            <div className="relative w-full" style={{ aspectRatio: "1 / 1" }}>
              <SafeImage
                sources={[selected?.image, product.image, ...(product.gallery || [])]}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                className="object-contain"
                draggable={false}
              />
            </div>
          </Link>
          {!inStock && (
            <span className="absolute text-white font-bold" style={{ top: 0, left: 0, background: "#6b7280", borderRadius: 999, padding: "2px 7px", fontSize: 11 }}>
              Stock Out
            </span>
          )}
          {inStock && oldPrice > price && (
            <span className="absolute text-white font-bold" style={{ top: 0, left: 0, background: "#D7262E", borderRadius: 999, padding: "2px 7px", fontSize: 11 }}>
              -{Math.round(((oldPrice - price) / oldPrice) * 100)}%
            </span>
          )}
          {cartQty > 0 ? (
            <div
              className="absolute left-1/2 flex -translate-x-1/2 items-center text-white font-bold shadow"
              style={{ bottom: 0, height: 30, borderRadius: 999, background: PRIMARY }}
            >
              <button
                type="button"
                onClick={handleDecrease}
                className="flex h-full items-center justify-center"
                style={{ width: 32 }}
                aria-label={`Decrease ${product.name} quantity`}
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24"><path d="M5 12h14" /></svg>
              </button>
              <span className="text-center" style={{ minWidth: 24, fontSize: 14 }}>{cartQty}</span>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!inStock}
                className="flex h-full items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
                style={{ width: 32 }}
                aria-label={`Increase ${product.name} quantity`}
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              disabled={!inStock}
              title="Add to Cart"
              aria-label={`Add ${product.name} to cart`}
              className="absolute flex items-center justify-center text-white shadow transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ right: 0, bottom: 0, width: 30, height: 30, borderRadius: "50%", background: added ? "#16a34a" : PRIMARY }}
            >
              {added ? (
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
              ) : (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
              )}
            </button>
          )}
        </div>

        <Link
          href={productHref(product)}
          className="block text-[#222] hover:text-[#0E4A5F] transition-colors"
          style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: 13, lineHeight: "18px", minHeight: 36, marginTop: 10 }}
        >
          {product.name}
        </Link>

        <div className="flex items-baseline gap-1.5" style={{ marginTop: 6 }}>
          <span className="font-bold text-gray-900" style={{ fontSize: 15 }}>৳{formatPrice(price)}</span>
          {oldPrice > price && (
            <span className="text-gray-400 line-through" style={{ fontSize: 11 }}>৳{formatPrice(oldPrice)}</span>
          )}
        </div>

        {chips.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5" style={{ paddingTop: 8 }}>
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

      {showModal && <OrderModal product={product} onClose={() => setShowModal(false)} />}
    </>
  );
}

interface ProductCarouselSectionProps {
  title: string;
  products: Product[];
  /** Emoji shown before the title, e.g. 🔥 */
  icon?: string;
  viewAllHref?: string;
}

// Homepage product row: heading + View All, and an auto-playing carousel of product tiles.
export default function ProductCarouselSection({ title, products, icon, viewAllHref = "/shop" }: ProductCarouselSectionProps) {
  if (products.length === 0) return null;

  return (
    <section style={{ paddingTop: 6, paddingBottom: 6 }}>
      <Container>
        <div className="flex items-center justify-between" style={{ marginTop: 22, marginBottom: 12 }}>
          <h2 className="flex items-center gap-2 text-gray-800" style={{ fontSize: "clamp(16px, 2.2vw, 22px)", fontWeight: 700, margin: 0 }}>
            {icon && <span aria-hidden="true">{icon}</span>}
            {title}
          </h2>
          <Link
            href={viewAllHref}
            className="border text-[#0E4A5F] border-[#0E4A5F] hover:bg-[#0E4A5F] hover:text-white transition-colors font-semibold whitespace-nowrap"
            style={{ borderRadius: 2, padding: "3px 10px", fontSize: 11 }}
          >
            View All
          </Link>
        </div>

        <HorizontalCarousel
          itemWidthClass="w-[calc(50%-5px)] sm:w-[calc(33.333%-7px)] md:w-[calc(25%-8px)] lg:w-[calc(20%-8px)] 2xl:w-[calc(16.666%-9px)]"
          gap={10}
          autoplay
          interval={5000}
          showArrows
        >
          {products.map((product) => (
            <ProductTile key={product.id} product={product} />
          ))}
        </HorizontalCarousel>
      </Container>
    </section>
  );
}
