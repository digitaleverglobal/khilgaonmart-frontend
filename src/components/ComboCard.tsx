import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { comboHref, type ComboOffer } from "@/services/comboService";

const PRIMARY = "#0E4A5F";
const SECONDARY = "#F07A22";
const ACCENT = "#D7262E";
const formatPrice = (value: number) => value.toLocaleString("en-US");

export default function ComboCard({ combo }: { combo: ComboOffer }) {
  const href = comboHref(combo);
  const percent =
    combo.regularPrice > combo.offerPrice && combo.offerPrice > 0
      ? Math.round(((combo.regularPrice - combo.offerPrice) / combo.regularPrice) * 100)
      : 0;

  return (
    <div className="bg-white group relative flex h-full flex-col overflow-hidden border border-[#d9d9d9] transition-shadow hover:shadow-md" style={{ borderRadius: 4 }}>
      {!combo.inStock ? (
        <span className="absolute z-10 text-white font-bold leading-tight" style={{ top: 6, left: 6, background: "#6b7280", borderRadius: 999, padding: "2px 7px", fontSize: 11 }}>
          Stock Out
        </span>
      ) : percent > 0 ? (
        <span className="absolute z-10 text-white font-bold leading-tight" style={{ top: 6, left: 6, background: ACCENT, borderRadius: 999, padding: "2px 7px", fontSize: 11 }}>
          -{percent}%
        </span>
      ) : null}
      <span className="absolute z-10 text-white font-bold leading-tight" style={{ top: 6, right: 0, background: SECONDARY, padding: "2px 7px", borderRadius: "4px 0 0 4px", fontSize: 11 }}>
        {combo.items.length} টি পণ্য
      </span>

      <Link href={href} className="block overflow-hidden">
        <div className="relative w-full bg-white" style={{ aspectRatio: "1 / 1" }}>
          <SafeImage
            sources={[combo.image, ...combo.items.map((item) => item.image)]}
            alt={combo.title}
            fill
            className="object-contain object-center p-1.5 transition-transform duration-300 group-hover:scale-105"
            draggable={false}
          />
        </div>
      </Link>

      <Link
        href={href}
        className="block overflow-hidden px-2 text-center font-medium text-[#222] transition-colors hover:text-[#0E4A5F]"
        style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", minHeight: 34, lineHeight: "17px", fontSize: 12, marginTop: 6 }}
      >
        {combo.title}
      </Link>

      <div className="mt-1 flex items-center justify-center gap-1.5 px-2">
        {combo.regularPrice > combo.offerPrice && (
          <span className="text-gray-400 line-through" style={{ fontSize: 11 }}>
            ৳{formatPrice(combo.regularPrice)}
          </span>
        )}
        <span className="font-extrabold" style={{ color: SECONDARY, fontSize: 13 }}>
          ৳{formatPrice(combo.offerPrice)}
        </span>
      </div>

      <div className="mt-auto" style={{ padding: "8px 7px 7px" }}>
        <Link
          href={href}
          className="flex items-center justify-center whitespace-nowrap text-white font-bold"
          style={{ borderRadius: 3, height: 28, background: combo.inStock ? PRIMARY : "#b8bec8", fontSize: 11 }}
        >
          {combo.inStock ? "VIEW OFFER" : "STOCK OUT"}
        </Link>
      </div>
    </div>
  );
}
