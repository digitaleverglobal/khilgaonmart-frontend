import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CollectionPage from "@/components/CollectionPage";
import SafeImage from "@/components/SafeImage";
import { fetchComboById } from "@/services/comboService";
import { productHref } from "@/lib/productUrl";
import ComboOrderButton from "./ComboOrderButton";

export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

const SECONDARY = "#F07A22";
const ACCENT = "#D7262E";
const formatPrice = (value: number) => value.toLocaleString("en-US");

const parseId = (segment: string) => {
  const id = Number(segment);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const id = parseId((await params).id);
  const combo = id ? await fetchComboById(id).catch(() => null) : null;
  return { title: `${combo?.title || "Combo Offer"} - Khilgaon Mart` };
}

export default async function ComboOfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  if (id === null) notFound();
  const combo = await fetchComboById(id);
  if (!combo) notFound();

  const discount = Math.max(0, combo.regularPrice - combo.offerPrice);

  return (
    <CollectionPage title="Combo Offer">
      <div style={{ background: "#fff", borderRadius: 8, padding: "clamp(14px, 3vw, 24px)" }}>
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-7">
          <div className="relative shrink-0 self-start border border-gray-200 overflow-hidden rounded" style={{ width: "clamp(150px, 40vw, 280px)", aspectRatio: "1 / 1" }}>
            <SafeImage sources={[combo.image, ...combo.items.map((item) => item.image)]} alt={combo.title} fill className="object-contain" />
          </div>
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <h2 className="text-gray-900" style={{ fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{combo.title}</h2>
            <div className="flex items-baseline gap-3 flex-wrap">
              {combo.regularPrice > combo.offerPrice && (
                <span className="text-gray-400 line-through text-base">৳{formatPrice(combo.regularPrice)}</span>
              )}
              <span className="font-extrabold text-3xl" style={{ color: SECONDARY }}>৳{formatPrice(combo.offerPrice)}</span>
              {discount > 0 && (
                <span className="text-white font-bold" style={{ background: ACCENT, borderRadius: 999, padding: "2px 10px", fontSize: 12 }}>
                  ৳{formatPrice(discount)} সাশ্রয়
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "#4b5563" }}>এই অফারে {combo.items.length} টি পণ্য একসাথে পাবেন।</p>
            {combo.description && (
              <p style={{ margin: 0, fontSize: 14, color: "#4b5563", whiteSpace: "pre-line" }}>{combo.description}</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 8, marginTop: 14, overflow: "hidden" }}>
        <h3 style={{ margin: 0, padding: "14px 18px", fontSize: 16, fontWeight: 800, color: "#fff", background: "#0E4A5F" }}>
          এই অফারে যা যা পাবেন
        </h3>
        <div>
          {combo.items.map((item) => (
            <div key={`${item.productId}:${item.variantId}`} className="flex items-center gap-3" style={{ padding: "12px 18px", borderBottom: "1px solid #f1f1f1" }}>
              <div className="relative shrink-0 border border-gray-200 rounded overflow-hidden" style={{ width: 64, height: 64 }}>
                <SafeImage sources={[item.image]} alt={item.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={productHref({ id: item.productId, slug: item.slug })} className="font-semibold text-gray-800 hover:text-[#0E4A5F]" style={{ fontSize: 14 }}>
                  {item.name}
                </Link>
                {item.variant && <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280" }}>{item.variant}</p>}
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280" }}>পরিমাণ: {item.qty}</p>
                {!item.inStock && <p style={{ margin: "3px 0 0", fontSize: 12, color: ACCENT, fontWeight: 700 }}>Stock Out</p>}
              </div>
              <div className="text-right shrink-0">
                {item.regularPrice > item.price && (
                  <p className="text-gray-400 line-through" style={{ margin: 0, fontSize: 12 }}>৳{formatPrice(item.regularPrice * item.qty)}</p>
                )}
                <p className="font-bold text-gray-800" style={{ margin: 0, fontSize: 14 }}>৳{formatPrice(item.price * item.qty)}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 18px", background: "#fafafa" }}>
          <div style={{ maxWidth: 420, marginLeft: "auto" }}>
            <div className="flex justify-between" style={{ fontSize: 14, color: "#4b5563", padding: "4px 0" }}>
              <span>Regular Price</span>
              <span className="line-through">৳{formatPrice(combo.regularPrice)}</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: 14, color: ACCENT, padding: "4px 0" }}>
              <span>Discount</span>
              <span>- ৳{formatPrice(discount)}</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: 17, fontWeight: 800, color: "#111827", padding: "8px 0 14px", borderTop: "1px solid #e5e7eb", marginTop: 4 }}>
              <span>Offer Price</span>
              <span style={{ color: SECONDARY }}>৳{formatPrice(combo.offerPrice)}</span>
            </div>
            <ComboOrderButton combo={combo} />
          </div>
        </div>
      </div>
    </CollectionPage>
  );
}
