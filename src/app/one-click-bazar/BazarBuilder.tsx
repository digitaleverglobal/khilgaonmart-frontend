"use client";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import { useCart } from "@/context/CartContext";
import { variantLabel } from "@/lib/useVariantSelection";
import type { Product, ProductVariant } from "@/data/products";
import BazarInvoice, { INVOICE_CAPTURE_EVENT, INVOICE_ID, type BazarStore } from "./BazarInvoice";

export interface BazarSection {
  key: string;
  /** Category name, shown as the bar above its subcategory rows. */
  group: string;
  label: string;
  imageUrl: string | null;
  products: Product[];
}

interface BazarLine {
  productId: number;
  variantId: number | null;
  qty: number;
  /** Set once the line went to the cart; later qty changes here are mirrored to that cart line. */
  inCart?: boolean;
}

const PRIMARY = "#0E4A5F";
const SECONDARY = "#F07A22";
const ACCENT = "#D7262E";
// The list is kept between visits so a regular weekly bazar is one click.
const LIST_KEY = "khilgaonmart_bazar_list";
const MAX_QTY = 99;

const formatPrice = (value: number) => value.toLocaleString("en-US");
const lineKey = (productId: number, variantId: number | null) => `${productId}:${variantId ?? ""}`;
const variantsOf = (product: Product) => (product.variants || []).filter((variant) => variant.newPrice > 0);
const findVariant = (product: Product, variantId: number | null) =>
  variantId ? variantsOf(product).find((variant) => variant.id === variantId) ?? null : null;
const priceOf = (product: Product, variant: ProductVariant | null) => (variant ? variant.newPrice : product.discountedPrice);
const isAvailable = (product: Product, variant: ProductVariant | null) =>
  variant ? variant.inStock : product.inStock !== false;

// Cheapest in-stock variant, like the price shown on product cards.
function defaultVariant(product: Product): ProductVariant | null {
  const variants = variantsOf(product);
  if (!variants.length) return null;
  const pool = variants.some((variant) => variant.inStock) ? variants.filter((variant) => variant.inStock) : variants;
  return pool.reduce((best, variant) => (variant.newPrice < best.newPrice ? variant : best));
}

function loadList(): BazarLine[] {
  try {
    const saved = JSON.parse(localStorage.getItem(LIST_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((line) => Number(line?.productId) > 0) : [];
  } catch {
    return [];
  }
}

// The list lives in memory and is mirrored to localStorage; the server render always sees an empty list.
const EMPTY_LIST: BazarLine[] = [];
let memoryList: BazarLine[] | null = null;
const listeners = new Set<() => void>();
const listStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => (memoryList ??= loadList()),
  getServer: () => EMPTY_LIST,
  set(update: (prev: BazarLine[]) => BazarLine[]) {
    memoryList = update(listStore.get());
    try {
      localStorage.setItem(LIST_KEY, JSON.stringify(memoryList));
    } catch {
      // Private mode / storage full: the list just isn't remembered.
    }
    listeners.forEach((listener) => listener());
  },
};

function QtyStepper({ qty, onChange }: { qty: number; onChange: (qty: number) => void }) {
  const btn = "w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40";
  return (
    <div className="flex items-center border border-gray-300 rounded overflow-hidden shrink-0 bg-white">
      <button type="button" className={`${btn} no-capture print:hidden`} onClick={() => onChange(qty - 1)} aria-label="কমান">−</button>
      <span className="w-7 text-center text-sm font-semibold text-gray-800 print:w-auto print:px-2">
        <span className="hidden print:inline">Qty: </span>{qty}
      </span>
      <button type="button" className={`${btn} no-capture print:hidden`} onClick={() => onChange(qty + 1)} disabled={qty >= MAX_QTY} aria-label="বাড়ান">+</button>
    </div>
  );
}

function ProductPicker({
  section,
  list,
  onAdd,
  onQty,
  onClose,
}: {
  section: BazarSection;
  list: BazarLine[];
  onAdd: (product: Product, variant: ProductVariant | null) => void;
  onQty: (productId: number, variantId: number | null, qty: number) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [sub, setSub] = useState("");
  const [chosenVariant, setChosenVariant] = useState<Record<number, number>>({});

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const childCategories = useMemo(
    () => [...new Set(section.products.map((product) => product.childCategory).filter((name): name is string => Boolean(name)))],
    [section.products],
  );
  const term = search.trim().toLowerCase();
  const products = section.products.filter(
    (product) => (!sub || product.childCategory === sub) && (!term || product.name.toLowerCase().includes(term)),
  );

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-[720px] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden" style={{ maxHeight: "88vh" }}>
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5" style={{ background: PRIMARY, minHeight: 54 }}>
          <span className="text-white font-semibold text-base truncate">{section.label} — পণ্য বাছাই করুন</span>
          <button type="button" onClick={onClose} className="text-white text-2xl leading-none px-1" aria-label="বন্ধ করুন">×</button>
        </div>

        <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-gray-100">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="পণ্য খুঁজুন..."
            className="w-full h-10 px-3 rounded border border-gray-300 text-sm outline-none focus:border-[#0E4A5F]"
            autoFocus
          />
          {childCategories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pt-2 pb-1">
              {["", ...childCategories].map((name) => (
                <button
                  key={name || "all"}
                  type="button"
                  onClick={() => setSub(name)}
                  className="shrink-0 rounded-full border px-3 py-1 text-xs font-semibold"
                  style={sub === name ? { background: PRIMARY, borderColor: PRIMARY, color: "#fff" } : { borderColor: "#d1d5db", color: "#4b5563" }}
                >
                  {name || "সব"}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {products.length === 0 && <p className="text-center text-gray-400 text-sm py-12">কোনো পণ্য পাওয়া যায়নি</p>}
          {products.map((product) => {
            const variants = variantsOf(product);
            const variant = findVariant(product, chosenVariant[product.id] ?? null) ?? defaultVariant(product);
            const variantId = variant?.id ?? null;
            const line = list.find((item) => lineKey(item.productId, item.variantId) === lineKey(product.id, variantId));
            const price = priceOf(product, variant);
            const oldPrice = variant ? variant.oldPrice : product.originalPrice;
            const available = isAvailable(product, variant);
            return (
              <div key={product.id} className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-gray-100">
                <div className="relative shrink-0 rounded border border-gray-200 overflow-hidden bg-gray-50" style={{ width: 56, height: 56 }}>
                  <SafeImage sources={[variant?.image, product.image, ...(product.gallery || [])]} alt={product.name} fill className="object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="m-0 text-sm font-medium text-gray-800 line-clamp-2">{product.name}</p>
                  {variants.length > 1 && (
                    <select
                      value={variantId ?? ""}
                      onChange={(e) => setChosenVariant((prev) => ({ ...prev, [product.id]: Number(e.target.value) }))}
                      className="mt-1 max-w-full h-7 px-1 rounded border border-gray-300 text-xs text-gray-700 bg-white"
                    >
                      {variants.map((item) => (
                        <option key={item.id} value={item.id} disabled={!item.inStock}>
                          {variantLabel(item.options) || `Variant ${item.id}`} — ৳{formatPrice(item.newPrice)}{item.inStock ? "" : " (Stock Out)"}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm font-bold" style={{ color: SECONDARY }}>৳{formatPrice(price)}</span>
                    {oldPrice > price && <span className="text-xs text-gray-400 line-through">৳{formatPrice(oldPrice)}</span>}
                  </div>
                </div>
                {!available ? (
                  <span className="text-xs font-bold shrink-0" style={{ color: ACCENT }}>Stock Out</span>
                ) : line ? (
                  <QtyStepper qty={line.qty} onChange={(qty) => onQty(product.id, variantId, qty)} />
                ) : (
                  <button
                    type="button"
                    onClick={() => onAdd(product, variant)}
                    className="shrink-0 rounded border-2 px-4 py-1.5 text-sm font-semibold hover:text-white"
                    style={{ borderColor: PRIMARY, color: PRIMARY }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = PRIMARY)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-gray-200 bg-gray-50">
          <span className="text-sm text-gray-600">
            এই ক্যাটাগরিতে {list.filter((line) => section.products.some((product) => product.id === line.productId)).length} টি পণ্য বাছাই হয়েছে
          </span>
          <button type="button" onClick={onClose} className="rounded px-5 py-2 text-sm font-bold text-white" style={{ background: SECONDARY }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ label, icon, onClick, disabled }: { label: string; icon: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 py-2.5 text-[11px] font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-[84px] sm:text-xs"
    >
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

const today = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function BazarBuilder({ sections, store }: { sections: BazarSection[]; store: BazarStore }) {
  const { items: cartItems, addToCart, updateQty, removeFromCart } = useCart();
  const router = useRouter();
  const list = useSyncExternalStore(listStore.subscribe, listStore.get, listStore.getServer);
  const setList = listStore.set;
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [hideEmpty, setHideEmpty] = useState(false);
  const [notice, setNotice] = useState("");
  const [capturing, setCapturing] = useState(false);
  const noticeTimer = useRef<number | undefined>(undefined);
  const bottomBarRef = useRef<HTMLDivElement>(null);

  const flash = (message: string) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 2500);
  };

  const productsById = useMemo(() => {
    const map = new Map<number, { product: Product; sectionKey: string }>();
    sections.forEach((section) => section.products.forEach((product) => map.set(product.id, { product, sectionKey: section.key })));
    return map;
  }, [sections]);

  // Lines whose product is still sold, with their current price.
  const lines = list.flatMap((line) => {
    const entry = productsById.get(line.productId);
    if (!entry) return [];
    const variant = findVariant(entry.product, line.variantId);
    if (line.variantId && !variant) return [];
    return [{ ...line, ...entry, variant, price: priceOf(entry.product, variant), available: isAvailable(entry.product, variant) }];
  });
  const orderable = lines.filter((line) => line.available);
  const hasBottomBar = orderable.length > 0;

  // Publishes the phone bottom bar's height as --bottom-bar-h so the site's floating buttons sit above it.
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => root.style.setProperty("--bottom-bar-h", `${bottomBarRef.current?.offsetHeight ?? 0}px`);
    apply();
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      root.style.removeProperty("--bottom-bar-h");
    };
  }, [hasBottomBar]);
  const totalPrice = orderable.reduce((sum, line) => sum + line.price * line.qty, 0);
  const totalQty = orderable.reduce((sum, line) => sum + line.qty, 0);

  const addLine = (product: Product, variant: ProductVariant | null) =>
    setList((prev) => [...prev, { productId: product.id, variantId: variant?.id ?? null, qty: 1 }]);
  const cartIndexOf = (productId: number, variantId: number | null) =>
    cartItems.findIndex((item) => !item.comboOfferId && item.id === productId && (item.variantId ?? null) === variantId);

  const setQty = (productId: number, variantId: number | null, qty: number) => {
    const key = lineKey(productId, variantId);
    const line = list.find((l) => lineKey(l.productId, l.variantId) === key);
    // Quantity changes on a line already in the cart update that cart line too (removing it here leaves the cart alone).
    if (line?.inCart && qty >= 1) {
      const idx = cartIndexOf(productId, variantId);
      if (idx !== -1) updateQty(idx, Math.min(qty, MAX_QTY));
    }
    setList((prev) =>
      qty < 1
        ? prev.filter((l) => lineKey(l.productId, l.variantId) !== key)
        : prev.map((l) => (lineKey(l.productId, l.variantId) === key ? { ...l, qty: Math.min(qty, MAX_QTY) } : l)),
    );
  };

  // Switches a picked line to another variant (merging into a line that already has it).
  // A line already in the cart moves its cart line along to the new variant.
  const changeVariant = (product: Product, fromVariantId: number | null, toVariantId: number) => {
    if (fromVariantId === toVariantId) return;
    const fromKey = lineKey(product.id, fromVariantId);
    const toKey = lineKey(product.id, toVariantId);
    const line = list.find((l) => lineKey(l.productId, l.variantId) === fromKey);
    if (!line) return;
    if (line.inCart) {
      const idx = cartIndexOf(product.id, fromVariantId);
      const qty = idx !== -1 ? cartItems[idx].qty : line.qty;
      if (idx !== -1) removeFromCart(idx);
      addToCart(product, qty, findVariant(product, toVariantId));
    }
    setList((prev) => {
      const target = prev.find((l) => lineKey(l.productId, l.variantId) === toKey);
      if (target) {
        return prev
          .filter((l) => lineKey(l.productId, l.variantId) !== fromKey)
          .map((l) =>
            l === target ? { ...l, qty: Math.min(l.qty + line.qty, MAX_QTY), inCart: l.inCart || line.inCart } : l,
          );
      }
      return prev.map((l) => (lineKey(l.productId, l.variantId) === fromKey ? { ...l, variantId: toVariantId } : l));
    });
  };

  const addAllToCart = (goToCheckout: boolean) => {
    if (!orderable.length) return;
    // Sets each cart line to the list's qty (adding it if missing), so clicking again doesn't add the list twice.
    orderable.forEach((line) => {
      const idx = cartIndexOf(line.productId, line.variantId);
      if (idx !== -1) updateQty(idx, line.qty);
      else addToCart(line.product, line.qty, line.variant);
    });
    const added = new Set(orderable.map((line) => lineKey(line.productId, line.variantId)));
    setList((prev) => prev.map((l) => (added.has(lineKey(l.productId, l.variantId)) ? { ...l, inCart: true } : l)));
    if (goToCheckout) {
      router.push("/checkout");
      return;
    }
    flash(`${orderable.length} টি পণ্য কার্টে যোগ হয়েছে`);
  };

  // The list already autosaves; Save writes it again and confirms, like "Save PC".
  const saveList = () => {
    setList((prev) => [...prev]);
    flash("আপনার বাজারের লিস্ট সেভ হয়েছে — পরে এসে আবার পাবেন");
  };

  // Downloads the printable invoice sheet (same layout as Print) as a PNG.
  const takeScreenshot = async () => {
    const node = document.getElementById(INVOICE_ID);
    if (!node || capturing) return;
    setCapturing(true);
    // The sheet is display:none on screen; lay it out off-screen while it's captured.
    window.dispatchEvent(new Event(INVOICE_CAPTURE_EVENT));
    const previousStyle = node.getAttribute("style") ?? "";
    node.style.cssText += ";display:block;position:fixed;left:-10000px;top:0;width:820px;padding:28px;";
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const options = {
      backgroundColor: "#ffffff",
      pixelRatio: 2,
      style: { position: "static", left: "0", top: "0" },
      // Images whose server blocks cross-origin reads are left blank instead of failing the capture.
      imagePlaceholder: "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
    };
    try {
      const { toBlob } = await import("html-to-image");
      // If embedding the web fonts fails (blocked/offline font CSS), retry with the browser's own fonts.
      const blob = (await toBlob(node, options).catch(() => null)) ?? (await toBlob(node, { ...options, skipFonts: true }));
      if (!blob) throw new Error("empty capture");
      // A Blob URL, not a data: URL — Chrome silently drops downloads of very long data: URLs.
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `khilgaonmart-bazar-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      flash("স্ক্রিনশট নেওয়া যায়নি, আবার চেষ্টা করুন");
    } finally {
      node.setAttribute("style", previousStyle);
      setCapturing(false);
    }
  };

  const openSection = sections.find((section) => section.key === openKey) ?? null;
  const visibleSections = hideEmpty ? sections.filter((section) => lines.some((line) => line.sectionKey === section.key)) : sections;
  const groups = visibleSections.reduce<{ name: string; sections: BazarSection[] }[]>((acc, section) => {
    const last = acc[acc.length - 1];
    if (last && last.name === section.group) last.sections.push(section);
    else acc.push({ name: section.group, sections: [section] });
    return acc;
  }, []);

  if (!sections.length) {
    return <div className="bazar-root rounded-2xl bg-white py-16 text-center text-gray-400">এই মুহূর্তে কোনো পণ্য পাওয়া যায়নি।</div>;
  }

  return (
    <div className="bazar-root pb-24 lg:pb-0">
      {/* Hero + actions (Add to Cart / Save / Print / Screenshot) */}
      <section
        className="no-capture print:hidden relative overflow-hidden rounded-2xl p-5 text-white shadow-sm sm:p-7"
        style={{ background: `linear-gradient(120deg, ${PRIMARY} 0%, #13627d 60%, #1a7a96 100%)` }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-20 right-40 h-44 w-44 rounded-full" style={{ background: "rgba(240,122,34,0.18)" }} />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ background: SECONDARY }}>
              ⚡ ১ ক্লিকে বাজার
            </span>
            <h2 className="mt-3 text-xl font-extrabold leading-snug sm:text-2xl">আপনার পুরো বাজার, এক লিস্টে</h2>
            <p className="mt-1.5 text-sm text-white/75">ক্যাটাগরি থেকে পণ্য বাছাই করুন, পরিমাণ ঠিক করুন — তারপর এক ক্লিকে অর্ডার।</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              {["ক্যাটাগরি বেছে নিন", "পণ্য যোগ করুন", "অর্ডার করুন"].map((step, index) => (
                <span key={step} className="inline-flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3 ring-1 ring-white/15">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-extrabold" style={{ color: PRIMARY }}>
                    {index + 1}
                  </span>
                  {step}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:flex">
            <ActionButton
              label="Add to Cart"
              onClick={() => addAllToCart(false)}
              disabled={!orderable.length}
              icon={<><path d="M5 9h14l-1.5 10.5a1 1 0 01-1 .5h-9a1 1 0 01-1-.5L5 9z" /><path d="M9 9l3-5 3 5" /><path d="M10 13v3M14 13v3" /></>}
            />
            <ActionButton
              label="Save List"
              onClick={saveList}
              disabled={!list.length}
              icon={<><path d="M5 3h11l3 3v14a1 1 0 01-1 1H6a1 1 0 01-1-1V3z" /><path d="M8 3v5h7V3M8 21v-7h8v7" /></>}
            />
            <ActionButton
              label="Print"
              onClick={() => window.print()}
              disabled={!orderable.length}
              icon={<><path d="M7 8V3h10v5" /><rect x="3" y="8" width="18" height="9" rx="1" /><path d="M7 14h10v7H7z" /></>}
            />
            <ActionButton
              label={capturing ? "Wait..." : "Screenshot"}
              onClick={takeScreenshot}
              disabled={!orderable.length || capturing}
              icon={<><path d="M4 8a2 2 0 012-2h2l1.5-2h5L16 6h2a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" /><circle cx="12" cy="13" r="3.5" /></>}
            />
          </div>
        </div>
      </section>

      {notice && (
        <div className="no-capture print:hidden mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs text-white">✓</span>
          {notice}
        </div>
      )}

      <div id="bazar-sheet" className="mt-5 grid items-start gap-5 bg-gray-100 lg:grid-cols-[minmax(0,1fr)_320px] print:block print:bg-white">
        {/* Categories (min-w-0: a wide row must not stretch the grid column past a phone screen) */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="no-capture print:hidden flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-gray-700">
              ক্যাটাগরি <span className="font-medium text-gray-400">({visibleSections.length})</span>
            </p>
            <div className="flex items-center gap-4">
              <label className="flex min-h-[32px] cursor-pointer select-none items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="h-5 w-5 accent-[#0E4A5F]" checked={hideEmpty} onChange={(e) => setHideEmpty(e.target.checked)} />
                শুধু বাছাই করাগুলো
              </label>
              {list.length > 0 && (
                <button type="button" className="text-sm font-semibold text-red-600 hover:underline" onClick={() => setList(() => [])}>
                  লিস্ট খালি করুন
                </button>
              )}
            </div>
          </div>

          {groups.map((group) => {
            const groupPicks = lines.filter((line) => group.sections.some((section) => section.key === line.sectionKey)).length;
            return (
              <section key={group.name} className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${groupPicks ? "" : "bazar-empty print:hidden"}`}>
                <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
                  <h3 className="flex items-center gap-2.5 text-[15px] font-extrabold text-gray-800">
                    <span className="h-5 w-1.5 rounded-full" style={{ background: SECONDARY }} />
                    {group.name}
                  </h3>
                  {groupPicks > 0 && (
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: "#FFF1E6", color: SECONDARY }}>
                      {groupPicks} টি বাছাই
                    </span>
                  )}
                </header>

                <div className="divide-y divide-gray-100">
                  {group.sections.map((section) => {
                    const sectionLines = lines.filter((line) => line.sectionKey === section.key);
                    const picked = sectionLines.length > 0;
                    return (
                      <div key={section.key} className={`px-4 py-3.5 sm:px-5 ${picked ? "" : "bazar-empty print:hidden"}`}>
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl" style={{ background: "#F4F7F8" }}>
                            <SafeImage sources={[section.imageUrl, section.products[0]?.image]} alt={section.label} fill className="object-contain p-1.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-bold text-gray-800">{section.label}</p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {picked ? (
                                <span className="font-semibold text-green-700">✓ {sectionLines.length} টি পণ্য বাছাই হয়েছে</span>
                              ) : (
                                `${section.products.length} টি পণ্য আছে`
                              )}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOpenKey(section.key)}
                            className={`no-capture print:hidden shrink-0 rounded-full px-4 py-2 text-sm font-bold transition sm:px-5 ${
                              picked ? "bg-[#E8F1F4] text-[#0E4A5F] hover:bg-[#d9e9ee]" : "bg-[#0E4A5F] text-white hover:bg-[#0b3b4c]"
                            }`}
                          >
                            {picked ? "+ আরো" : "Choose"}
                          </button>
                        </div>

                        {picked && (
                          <div className="mt-3 flex flex-col gap-2 sm:pl-[72px]">
                            {sectionLines.map((line) => (
                              <div key={lineKey(line.productId, line.variantId)} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-gray-100 bg-gray-50/70 p-2 pr-3">
                                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-white">
                                  <SafeImage sources={[line.variant?.image, line.product.image]} alt={line.product.name} fill className="object-contain" />
                                </div>
                                <div className="min-w-[140px] flex-1">
                                  <p className="truncate text-sm font-medium text-gray-800">{line.product.name}</p>
                                  {variantsOf(line.product).length > 1 ? (
                                    <div className="mt-0.5 flex items-center gap-1.5">
                                      <select
                                        value={line.variantId ?? ""}
                                        onChange={(e) => changeVariant(line.product, line.variantId, Number(e.target.value))}
                                        className="h-7 w-full max-w-[220px] rounded border border-gray-300 bg-white px-1 text-xs text-gray-700"
                                        aria-label={`${line.product.name} variant`}
                                      >
                                        {variantsOf(line.product).map((item) => (
                                          <option key={item.id} value={item.id} disabled={!item.inStock && item.id !== line.variantId}>
                                            {variantLabel(item.options) || `Variant ${item.id}`} — ৳{formatPrice(item.newPrice)}{item.inStock ? "" : " (Stock Out)"}
                                          </option>
                                        ))}
                                      </select>
                                      {!line.available && <span className="text-xs font-bold" style={{ color: ACCENT }}>Stock Out</span>}
                                    </div>
                                  ) : (
                                    <p className="truncate text-xs text-gray-500">
                                      {line.variant ? variantLabel(line.variant.options) : `৳${formatPrice(line.price)} / পিস`}
                                      {!line.available && <span className="font-bold" style={{ color: ACCENT }}> · Stock Out</span>}
                                    </p>
                                  )}
                                </div>
                                {/* Stepper, line total and remove drop to their own line on narrow phones */}
                                <div className="ml-auto flex shrink-0 items-center gap-3">
                                <QtyStepper qty={line.qty} onChange={(qty) => setQty(line.productId, line.variantId, qty)} />
                                <span className="w-16 shrink-0 text-right text-sm font-extrabold text-gray-800 sm:w-20">৳{formatPrice(line.price * line.qty)}</span>
                                <button
                                  type="button"
                                  onClick={() => setQty(line.productId, line.variantId, 0)}
                                  className="no-capture print:hidden flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                  title="Remove"
                                >
                                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
                                </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {groups.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center text-sm text-gray-400">
              এখনো কোনো পণ্য বাছাই করা হয়নি।
            </div>
          )}
        </div>

        {/* Summary */}
        <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-40 print:mt-4 print:shadow-none">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-extrabold" style={{ color: PRIMARY }}>বাজারের লিস্ট</p>
              <p className="mt-0.5 text-xs text-gray-500">Khilgaon Mart · {today()}</p>
            </div>
            <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: "#E8F1F4", color: PRIMARY }}>
              {orderable.length} Items
            </span>
          </div>

          <dl className="mt-5 flex flex-col gap-2.5 border-t border-dashed border-gray-200 pt-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <dt>পণ্য</dt>
              <dd className="font-semibold text-gray-800">{orderable.length} টি</dd>
            </div>
            <div className="flex justify-between text-gray-600">
              <dt>মোট পরিমাণ</dt>
              <dd className="font-semibold text-gray-800">{totalQty} পিস</dd>
            </div>
            {lines.length > orderable.length && (
              <div className="flex justify-between" style={{ color: ACCENT }}>
                <dt>Stock Out (বাদ যাবে)</dt>
                <dd className="font-semibold">{lines.length - orderable.length} টি</dd>
              </div>
            )}
          </dl>

          <div className="mt-4 flex items-end justify-between rounded-xl px-4 py-3" style={{ background: "#FFF6EE" }}>
            <span className="text-sm font-bold text-gray-700">সর্বমোট</span>
            <span className="text-2xl font-extrabold" style={{ color: SECONDARY }}>৳{formatPrice(totalPrice)}</span>
          </div>
          <p className="mt-2 text-xs text-gray-400">ডেলিভারি চার্জ চেকআউটে যোগ হবে।</p>

          <div className="no-capture print:hidden mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => addAllToCart(true)}
              disabled={!orderable.length}
              className="h-12 rounded-xl text-[15px] font-extrabold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: SECONDARY }}
            >
              Order Now →
            </button>
            <button
              type="button"
              onClick={() => addAllToCart(false)}
              disabled={!orderable.length}
              className="h-11 rounded-xl border-2 text-sm font-bold transition hover:bg-[#E8F1F4] disabled:cursor-not-allowed disabled:opacity-40"
              style={{ borderColor: PRIMARY, color: PRIMARY }}
            >
              Add to Cart
            </button>
          </div>
        </aside>
      </div>

      {/* Bottom bar on phones/tablets so the order button is always reachable */}
      {orderable.length > 0 && (
        <div ref={bottomBarRef} style={{ bottom: "var(--mobile-nav-h, 0px)" }} className="no-capture print:hidden fixed inset-x-0 z-40 flex items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-6px_16px_rgba(0,0,0,0.08)] lg:hidden">
          <div>
            <p className="text-lg font-extrabold leading-tight" style={{ color: SECONDARY }}>৳{formatPrice(totalPrice)}</p>
            <p className="text-xs text-gray-500">{orderable.length} টি পণ্য · {totalQty} পিস</p>
          </div>
          <button type="button" onClick={() => addAllToCart(true)} className="h-11 rounded-xl px-6 text-sm font-extrabold text-white" style={{ background: SECONDARY }}>
            Order Now →
          </button>
        </div>
      )}

      {/* What the Print button prints (hidden on screen) */}
      <BazarInvoice store={store} groups={groups} lines={lines} onlyPicked={hideEmpty} />

      {openSection && (
        <ProductPicker section={openSection} list={list} onAdd={addLine} onQty={setQty} onClose={() => setOpenKey(null)} />
      )}
    </div>
  );
}
