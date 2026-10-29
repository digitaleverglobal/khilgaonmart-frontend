// "use client";
// import { useState } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { Product } from "@/data/products";
// import { useCart } from "@/context/CartContext";

// const PRIMARY   = "#0E4A5F";
// const SECONDARY = "#F07A22";
// const fmt = (v: number) => v.toLocaleString("en-US");

// interface Props {
//   product: Product;
//   whatsappUrl: string | null;
//   phone: string | null;
// }

// export default function ProductDetailClient({ product, whatsappUrl, phone }: Props) {
//   const router = useRouter();
//   const { addToCart } = useCart();

//   const allImages = [product.image, ...(product.gallery || [])].filter(Boolean);
//   const [activeIdx, setActiveIdx] = useState(0);
//   const [thumbStart, setThumbStart] = useState(0);

//   const [selectedColor, setSelectedColor] = useState(product.colors?.[0] ?? "");
//   const [selectedSize, setSelectedSize]   = useState(product.sizes?.[0] ?? "");
//   const [qty, setQty] = useState(1);
//   const [addedMsg, setAddedMsg] = useState(false);

//   const THUMB_VISIBLE = 4;
//   const canPrev = thumbStart > 0;
//   const canNext = thumbStart + THUMB_VISIBLE < allImages.length;
//   const prevThumb = () => setThumbStart((s) => Math.max(0, s - 1));
//   const nextThumb = () => setThumbStart((s) => Math.min(allImages.length - THUMB_VISIBLE, s + 1));

//   const handleAddToCart = () => {
//     addToCart(product, qty, selectedSize || undefined, selectedColor || undefined);
//     setAddedMsg(true);
//     setTimeout(() => setAddedMsg(false), 1500);
//   };

//   const handleOrderNow = () => {
//     addToCart(product, qty, selectedSize || undefined, selectedColor || undefined);
//     router.push("/checkout");
//   };

//   const waPhone = phone ? phone.replace(/\D/g, "").replace(/^0/, "880") : null;
//   const waHref  = whatsappUrl || (waPhone ? `https://wa.me/${waPhone}` : null);
//   const displayPhone = phone || "";

//   return (
//     <div className="product-detail-grid">

//       {/* Left: Image Gallery */}
//       <div className="product-gallery">

//         {/* Main image */}
//         <div className="product-main-image">
//           {product.discount > 0 && (
//             <span
//               className="absolute top-2 left-2 z-10 text-white text-sm font-bold px-3 py-1 rounded-full"
//               style={{ background: SECONDARY }}
//             >
//               {product.discount}% Discount
//             </span>
//           )}
//           <Image
//             src={allImages[activeIdx] || "/placeholder.jpg"}
//             alt={product.name}
//             fill
//             className="object-contain"
//
//           />
//         </div>

//         {/* Thumbnails */}
//         {allImages.length > 1 && (
//           <div className="flex items-center gap-2 mt-3">
//             {canPrev && (
//               <button
//                 onClick={prevThumb}
//                 className="w-7 h-7 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100 flex-shrink-0"
//               >
//                 ‹
//               </button>
//             )}
//             <div className="flex gap-2 flex-1 overflow-hidden">
//               {allImages.slice(thumbStart, thumbStart + THUMB_VISIBLE).map((img, i) => {
//                 const realIdx = thumbStart + i;
//                 return (
//                   <button
//                     key={realIdx}
//                     onClick={() => setActiveIdx(realIdx)}
//                     className="product-thumb"
//                     style={{
//                       borderColor: activeIdx === realIdx ? PRIMARY : "#e5e7eb",
//                     }}
//                   >
//                     <Image src={img} alt="" fill className="object-contain" />
//                   </button>
//                 );
//               })}
//             </div>
//             {canNext && (
//               <button
//                 onClick={nextThumb}
//                 className="w-7 h-7 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100 flex-shrink-0"
//               >
//                 ›
//               </button>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Right: Product Info */}
//       <div className="product-info">

//         <nav className="text-base text-gray-500 mb-5 flex items-center flex-wrap gap-1">
//           <Link href="/" className="hover:text-[#F07A22] transition">Home</Link>
//           {product.category && (
//             <>
//               <span>/</span>
//               <Link
//                 href={`/?menu=${encodeURIComponent(product.category)}`}
//                 className="hover:text-[#F07A22] transition capitalize"
//               >
//                 {product.category}
//               </Link>
//             </>
//           )}
//           {product.subCategory && (
//             <>
//               <span>/</span>
//               <Link
//                 href={`/?menu=${encodeURIComponent(product.category ?? "")}&sub=${encodeURIComponent(product.subCategory)}`}
//                 className="hover:text-[#F07A22] transition capitalize"
//               >
//                 {product.subCategory}
//               </Link>
//             </>
//           )}
//         </nav>

//         {/* Name */}
//         <h1 className="text-xl lg:text-[23px] font-bold text-black mb-4 leading-snug">
//           {product.name}
//         </h1>

//         {/* Price */}
//         <div className="flex items-baseline gap-1 mb-3">
//           {product.discount > 0 && (
//             <span className="text-gray-400 line-through text-xl font-bold">৳ {fmt(product.originalPrice)}</span>
//           )}
//           <span className="font-extrabold text-[26px] text-black">
//             ৳ {fmt(product.discountedPrice)}
//           </span>
//         </div>

//         {/* SKU */}
//         {product.sku && (
//           <div className="mb-5">
//             <span
//               className="inline-flex items-center text-white text-sm font-bold px-3 py-[7px]"
//               style={{
//                 background: "#fb7d3a",
//                 clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)",
//                 paddingRight: 24,
//               }}
//             >
//               SKU : {product.sku}
//             </span>
//           </div>
//         )}

//         {/* Features */}
//         {product.features && product.features.length > 0 && (
//           <ul className="mb-4 space-y-1">
//             {product.features.map((f, i) => (
//               <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
//                 <span className="font-bold flex-shrink-0" style={{ color: PRIMARY }}>✓</span>
//                 {f}
//               </li>
//             ))}
//           </ul>
//         )}

//         {/* Color selector */}
//         {product.colors && product.colors.length > 0 && (
//           <div className="mb-5">
//             <p className="text-sm font-bold text-black mb-2">Select Color</p>
//             <div className="flex flex-wrap gap-2">
//               {product.colors.map((c) => (
//                 <button
//                   key={c}
//                   onClick={() => setSelectedColor(c)}
//                   className="h-[47px] px-3 border text-sm font-bold transition bg-white"
//                   style={{
//                     borderColor: selectedColor === c ? PRIMARY : "#d1d5db",
//                     color: selectedColor === c ? PRIMARY : "#111",
//                   }}
//                 >
//                   {c}
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Size selector */}
//         {product.sizes && product.sizes.length > 0 && (
//           <div className="mb-5">
//             <p className="text-sm font-bold text-black mb-2">Select Size</p>
//             <div className="flex flex-wrap gap-2">
//               {product.sizes.map((s) => (
//                 <button
//                   key={s}
//                   onClick={() => setSelectedSize(s)}
//                   className="min-w-12 h-[47px] px-2 border text-sm font-bold transition bg-white"
//                   style={{
//                     borderColor: selectedSize === s ? PRIMARY : "#d1d5db",
//                     color: selectedSize === s ? PRIMARY : "#111",
//                   }}
//                 >
//                   {s}
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Quantity */}
//         <div className="inline-flex items-center mb-2 border border-gray-300 rounded overflow-hidden">
//           <button
//             onClick={() => setQty((q) => Math.max(1, q - 1))}
//             className="w-10 h-10 text-gray-700 hover:bg-gray-50 text-xl font-bold transition flex items-center justify-center"
//           >
//             -
//           </button>
//           <span className="w-12 h-10 border-x border-gray-300 flex items-center justify-center text-base font-medium text-black">{qty}</span>
//           <button
//             onClick={() => setQty((q) => q + 1)}
//             className="w-10 h-10 text-gray-700 hover:bg-gray-50 text-2xl font-medium transition flex items-center justify-center"
//           >
//             +
//           </button>
//         </div>

//         {/* Add to Cart + Order Now */}
//         <div className="product-action-row">
//           <button
//             onClick={handleAddToCart}
//             disabled={product.inStock === false}
//             className="flex-1 h-[45px] font-bold text-white rounded-[5px] transition disabled:opacity-50 text-lg"
//             style={{ background: addedMsg ? "#16a34a" : PRIMARY }}
//           >
//             {addedMsg ? "Added to Cart!" : "Add To Cart"}
//           </button>
//           <button
//             onClick={handleOrderNow}
//             disabled={product.inStock === false}
//             className="flex-1 h-[45px] font-bold text-white rounded-[5px] transition disabled:opacity-50 text-lg"
//             style={{ background: SECONDARY }}
//           >
//             Order Now
//           </button>
//         </div>

//         {/* WhatsApp */}
//         {waHref && (
//           <a
//             href={waHref}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="product-whatsapp-link"
//             style={{ background: "#12c64b" }}
//           >
//             <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
//               <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
//             </svg>
//             {displayPhone || "Chat on WhatsApp"}
//           </a>
//         )}

//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useMemo, useState } from "react";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useCustomer } from "@/context/CustomerContext";
import ProductReviewForm from "@/components/ProductReviewForm";
import { pointsForPrice, type RewardSettings } from "@/services/rewardService";
import { useVariantSelection } from "@/lib/useVariantSelection";
import VariantSelector from "@/components/VariantSelector";
import { trackPixelEvent } from "@/lib/pixel";
import {
  fetchProductReviews,
  type ProductReview,
} from "@/services/productService";

const PRIMARY = "#0E4A5F";
const SECONDARY = "#F07A22";
const ACCENT = "#D7262E";

const fmt = (v: number) => v.toLocaleString("en-US");

const contactBtnStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  height: 45,
  borderRadius: 5,
  color: "#fff",
  fontSize: 17,
  fontWeight: 700,
  textDecoration: "none",
};

const contactColStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
};

const contactNumberStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: "#374151",
  letterSpacing: 0.3,
};

interface Props {
  product: Product;
  whatsappUrl: string | null;
  whatsappNumber?: string | null;
  phone: string | null;
  // Delivery charge lines for the "Delivery Information" tab.
  deliveryLines?: string[];
  rewardSettings?: RewardSettings | null;
}

type InfoTab = "description" | "delivery";

export default function ProductDetailClient({
  product,
  whatsappUrl,
  whatsappNumber = null,
  phone,
  deliveryLines = [],
  rewardSettings = null,
}: Props) {
  const [infoTab, setInfoTab] = useState<InfoTab>(product.description ? "description" : "delivery");
  const router = useRouter();
  const { addToCart } = useCart();
  const { customer } = useCustomer();

  const allImages = [...new Set([product.image, ...(product.gallery || [])].filter(Boolean))];

  const [activeIdx, setActiveIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [addedMsg, setAddedMsg] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>([]);

  const selection = useVariantSelection(product);
  // Show the selected variant's image whenever the variant changes.
  const variantImage = selection.selectedVariant?.image || null;
  const [shownVariantImage, setShownVariantImage] = useState<string | null>(null);
  if (variantImage !== shownVariantImage) {
    setShownVariantImage(variantImage);
    const idx = variantImage ? allImages.indexOf(variantImage) : -1;
    if (idx >= 0) setActiveIdx(idx);
  }
  const selectedOldPrice = selection.oldPrice;
  const selectedNewPrice = selection.newPrice;
  const canBuy = selection.inStock && !selection.needsSelection;
  const selectedDiscount =
    selectedOldPrice > selectedNewPrice && selectedNewPrice > 0
      ? Math.round(((selectedOldPrice - selectedNewPrice) / selectedOldPrice) * 100)
      : 0;

  useEffect(() => {
    let active = true;
    fetchProductReviews(product).then((items) => {
      if (active) setReviews(items);
    });
    return () => {
      active = false;
    };
  }, [product.id, product.name]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
    return total / reviews.length;
  }, [reviews]);

  const pixelUserData = useMemo(
    () => customer
      ? { customerId: customer.Id, name: customer.name, phone: customer.phone }
      : undefined,
    [customer?.Id, customer?.name, customer?.phone],
  );

  useEffect(() => {
    trackPixelEvent(
      "ViewContent",
      {
        content_ids: [product.id],
        content_name: product.name,
        content_type: "product",
        value: selectedNewPrice,
        currency: "BDT",
        num_items: 1,
      },
      pixelUserData,
    );
  }, [pixelUserData, product.id, product.name, selectedNewPrice]);

  const handleAddToCart = () => {
    if (!canBuy) return;
    addToCart(product, qty, selection.selectedVariant);
    trackPixelEvent(
      "AddToCart",
      {
        content_ids: [product.id],
        content_name: product.name,
        content_type: "product",
        value: selectedNewPrice * qty,
        currency: "BDT",
        num_items: qty,
      },
      pixelUserData,
    );
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 1500);
  };

  const handleOrderNow = () => {
    if (!canBuy) return;
    addToCart(product, qty, selection.selectedVariant);
    router.push("/checkout");
  };

  // Local numbers (01XXXXXXXXX) become 8801XXXXXXXXX for wa.me.
  const waNumber = (whatsappNumber || phone || "").replace(/\D/g, "").replace(/^0/, "880");
  const waText = encodeURIComponent(`আমি এই পণ্যটি সম্পর্কে জানতে চাই: ${product.name}`);
  const waHref = whatsappUrl || (waNumber ? `https://wa.me/${waNumber}?text=${waText}` : null);
  const callNumber = (phone || "").replace(/[^\d+]/g, "");
  const callHref = callNumber ? `tel:${callNumber}` : null;
  // Numbers shown under the buttons, as entered in admin.
  const waLabel = (whatsappNumber || phone || "").trim();

  return (
    <div>
      <div className="product-detail-grid">
      {/* Left Image Gallery */}
      <div className="product-gallery">
        <div className="product-main-image">
          {selectedDiscount > 0 && (
            <span
              className="absolute left-2 top-2 z-10 rounded-full text-sm font-bold text-white"
              style={{ background: ACCENT, padding: "5px 13px" }}
            >
              {selectedDiscount}% Discount
            </span>
          )}

          <SafeImage
            sources={[allImages[activeIdx], ...allImages]}
            alt={product.name}
            fill
            className="object-contain p-4"
          />
        </div>

        {allImages.length > 1 && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className="product-thumb bg-white"
                style={{
                  borderColor: activeIdx === idx ? PRIMARY : "#e5e7eb",
                }}
              >
                <SafeImage
                  sources={[img]}
                  alt=""
                  fill
                  className="object-contain p-2"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="product-info">
        <nav
          style={{ marginBottom: "1rem" }}
          className="mb-4 flex flex-wrap items-center gap-1 text-base text-gray-500"
        >
          <Link href="/" className="transition hover:text-[#F07A22]">
            Home
          </Link>

          {product.category && (
            <>
              <span>/</span>
              <Link
                href={`/?menu=${encodeURIComponent(product.category)}`}
                className="capitalize transition hover:text-[#F07A22]"
              >
                {product.category}
              </Link>
            </>
          )}

          {product.subCategory && (
            <>
              <span>/</span>
              <Link
                href={`/?menu=${encodeURIComponent(
                  product.category ?? "",
                )}&sub=${encodeURIComponent(product.subCategory)}`}
                className="capitalize transition hover:text-[#F07A22]"
              >
                {product.subCategory}
              </Link>
            </>
          )}
        </nav>

        <h1
          style={{ marginBottom: "1rem" }}
          className="mb-4 text-xl font-bold leading-snug text-black lg:text-[23px]"
        >
          {product.name}
        </h1>

        <div
          style={{ marginBottom: "1rem" }}
          className="mb-3 flex items-baseline gap-1.5"
        >
          {selectedOldPrice > selectedNewPrice && (
            <span className="text-xl font-bold text-gray-400 line-through">
              ৳ {fmt(selectedOldPrice)}
            </span>
          )}

          <span className="text-[26px] font-extrabold text-black">
            ৳ {fmt(selectedNewPrice)}
          </span>
        </div>

        {pointsForPrice(rewardSettings, selectedNewPrice * qty) > 0 && (
          <p
            style={{
              margin: "-0.25rem 0 1rem",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              color: "#b45309",
              background: "#FFF6EE",
              border: "1px solid #fde3c8",
              borderRadius: 999,
              padding: "4px 12px",
            }}
          >
            🎁 এটি কিনলে {fmt(pointsForPrice(rewardSettings, selectedNewPrice * qty))} রিওয়ার্ড পয়েন্ট পাবেন
          </p>
        )}

        {product.sku && (
          <div style={{ marginBottom: "1rem" }} className="mb-4">
            <span
              className="inline-flex items-center px-3 py-[7px] text-sm font-bold text-white"
              style={{
                background: "#fb7d3a",
                clipPath:
                  "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)",
                padding: "6px 24px 6px 10px",
              }}
            >
              SKU : {product.sku}
            </span>
          </div>
        )}

        {selection.optionGroups.length > 0 && (
          <div style={{ marginBottom: "1rem" }} className="mb-4">
            <VariantSelector selection={selection} />
            {!selection.needsSelection && !selection.inStock && (
              <p className="mt-2 text-sm font-semibold text-red-600">এই variant-টি এখন stock-এ নেই</p>
            )}
            {selection.needsSelection && (
              <p className="mt-2 text-sm font-semibold text-red-600">এই combination পাওয়া যাচ্ছে না</p>
            )}
          </div>
        )}

        <div className="mb-3 inline-flex items-center overflow-hidden rounded border border-gray-300">
          <button
            style={{ cursor: "pointer" }}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center text-xl font-bold text-gray-700 transition hover:bg-gray-50"
          >
            -
          </button>

          <span className="flex h-10 w-12 items-center justify-center border-x border-gray-300 text-base font-medium text-black">
            {qty}
          </span>

          <button
            style={{ cursor: "pointer" }}
            onClick={() => setQty((q) => q + 1)}
            className="flex h-10 w-10 items-center justify-center text-2xl font-medium text-gray-700 transition hover:bg-gray-50"
          >
            +
          </button>
        </div>

        <div className="product-action-row">
          <button
            onClick={handleAddToCart}
            disabled={!canBuy}
            className="h-[45px] min-w-0 flex-1 whitespace-nowrap rounded-[5px] px-2 text-[15px] font-bold text-white transition disabled:opacity-50 sm:text-lg"
            style={{
              cursor: "pointer",
              background: addedMsg ? "#16a34a" : PRIMARY,
            }}
          >
            {addedMsg ? "Added to Cart!" : "Add To Cart"}
          </button>

          <button
            onClick={handleOrderNow}
            disabled={!canBuy}
            className="h-[45px] min-w-0 flex-1 whitespace-nowrap rounded-[5px] px-2 text-[15px] font-bold text-white transition disabled:opacity-50 sm:text-lg"
            style={{ cursor: "pointer", background: SECONDARY }}
          >
            Order Now
          </button>
        </div>

        {(waHref || callHref) && (
          <div className="product-action-row">
            {waHref && (
              <div style={contactColStyle}>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:opacity-90"
                style={{ ...contactBtnStyle, background: "#12c64b" }}
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
                WhatsApp
              </a>
              {waLabel && <span style={contactNumberStyle}>{waLabel}</span>}
              </div>
            )}
            {callHref && (
              <div style={contactColStyle}>
              <a
                href={callHref}
                className="transition hover:opacity-90"
                style={{ ...contactBtnStyle, background: ACCENT }}
                aria-label={`Call ${phone}`}
              >
                <svg width="19" height="19" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24 11.36 11.36 0 0 0 3.58.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z" />
                </svg>
                Call Now
              </a>
              <span style={contactNumberStyle}>{phone}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
      <section
        style={{
          marginTop: 24,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "0 26px 24px",
        }}
      >
        <div
          role="tablist"
          aria-label="Product information"
          style={{
            display: "flex",
            flexWrap: "wrap",
            columnGap: 28,
            marginBottom: 18,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          {([
            ...(product.description ? [["description", "Product Description"]] : []),
            ["delivery", "Delivery Information"],
          ] as [InfoTab, string][]).map(([key, label]) => {
            const active = infoTab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                id={`info-tab-${key}`}
                aria-selected={active}
                aria-controls={`info-panel-${key}`}
                onClick={() => setInfoTab(key)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: `3px solid ${active ? SECONDARY : "transparent"}`,
                  marginBottom: -1,
                  padding: "18px 0 12px",
                  fontSize: 18,
                  fontWeight: 800,
                  color: active ? "#111827" : "#9ca3af",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s, border-color 0.15s",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {infoTab === "description" && product.description && (
          <div role="tabpanel" id="info-panel-description" aria-labelledby="info-tab-description">
          <div
            className="product-description-content"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
          <style jsx>{`
            .product-description-content {
              color: #374151;
              font-size: 15px;
              line-height: 1.85;
              word-break: break-word;
            }
            .product-description-content :global(p) {
              margin: 0 0 14px;
            }
            .product-description-content :global(p:last-child) {
              margin-bottom: 0;
            }
            .product-description-content :global(h1),
            .product-description-content :global(h2),
            .product-description-content :global(h3),
            .product-description-content :global(h4) {
              color: #0f172a;
              font-weight: 800;
              line-height: 1.4;
              margin: 22px 0 10px;
            }
            .product-description-content :global(h1) {
              font-size: 20px;
            }
            .product-description-content :global(h2) {
              font-size: 18px;
            }
            .product-description-content :global(h3) {
              font-size: 16px;
            }
            .product-description-content :global(strong),
            .product-description-content :global(b) {
              color: #111827;
              font-weight: 700;
            }
            .product-description-content :global(ul),
            .product-description-content :global(ol) {
              margin: 0 0 16px;
              padding-left: 22px;
              display: flex;
              flex-direction: column;
              gap: 6px;
            }
            .product-description-content :global(li) {
              padding-left: 2px;
            }
            .product-description-content :global(ul li) {
              list-style: disc;
            }
            .product-description-content :global(hr) {
              border: none;
              border-top: 1px solid #e5e7eb;
              margin: 20px 0;
            }
            .product-description-content :global(a) {
              color: ${SECONDARY};
              text-decoration: underline;
            }
            .product-description-content :global(img) {
              max-width: 100%;
              border-radius: 6px;
              margin: 10px 0;
            }
            .product-description-content :global(blockquote) {
              margin: 14px 0;
              padding: 10px 16px;
              border-left: 3px solid ${SECONDARY};
              background: #FFF8F0;
              color: #4b5563;
            }
          `}</style>
          </div>
        )}

        {infoTab === "delivery" && (
          <div
            role="tabpanel"
            id="info-panel-delivery"
            aria-labelledby="info-tab-delivery"
            style={{ color: "#374151", fontSize: 15, lineHeight: 1.75 }}
          >
            {[
              { title: "Home delivery available all over Bangladesh", lines: [] as string[] },
              {
                title: "Standard Delivery",
                lines: [
                  "Inside Dhaka 24 Hours guaranteed delivery.",
                  "Outside Dhaka 48 hours guaranteed delivery after order confirmation",
                ],
              },
              ...(deliveryLines.length > 0 ? [{ title: "Regular Delivery Charge", lines: deliveryLines }] : []),
              { title: "Cash on Delivery Available", lines: [] as string[] },
            ].map((item, idx, list) => (
              <div
                key={item.title}
                style={{
                  padding: "12px 0",
                  borderBottom: idx < list.length - 1 ? "1px solid #f1f1f1" : "none",
                }}
              >
                <p style={{ margin: 0, fontWeight: 700, color: "#111827" }}>{item.title}</p>
                {item.lines.map((line) => (
                  <p key={line} style={{ margin: "2px 0 0", color: "#4b5563" }}>• {line}</p>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
      {reviews.length > 0 && (
        <ProductReviews reviews={reviews} averageRating={averageRating} />
      )}
      <ProductReviewForm
        productId={product.id}
        reviewBonus={rewardSettings?.enabled ? rewardSettings.reviewBonus : 0}
      />
    </div>
  );
}

function ProductReviews({
  reviews,
  averageRating,
}: {
  reviews: ProductReview[];
  averageRating: number;
}) {
  return (
    <section
      style={{
        marginTop: 24,
        background: "#fff",
        border: "1px solid #e5e7eb",
        padding: 22,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>
            Customer Reviews
          </h2>
          <p style={{ marginTop: 4, fontSize: 13, color: "#6b7280" }}>
            {reviews.length} approved review{reviews.length > 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#111827" }}>
            {averageRating.toFixed(1)}
          </div>
          <StarRating rating={Math.round(averageRating)} />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
        {reviews.map((review) => (
          <article
            key={review.Id}
            style={{
              border: "1px solid #eef2f7",
              background: "#f9fafb",
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>
                  {review.customerName || "Customer"}
                </h3>
                {review.productName && (
                  <p style={{ marginTop: 2, fontSize: 12, color: "#6b7280" }}>
                    {review.productName}
                  </p>
                )}
              </div>
              <StarRating rating={Number(review.rating) || 0} />
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#374151" }}>
              {review.comment || "ভালো প্রোডাক্ট, সার্ভিসও ভালো লেগেছে।"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function StarRating({ rating }: { rating: number }) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div style={{ display: "inline-flex", gap: 2, color: "#facc15" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={star <= safeRating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="m12 17.27 5.18 3.13-1.64-5.89 4.57-3.95-6.01-.24L12 4.7 9.9 10.32l-6.01.24 4.57 3.95-1.64 5.89L12 17.27Z" />
        </svg>
      ))}
    </div>
  );
}
