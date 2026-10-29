"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { variantLabel } from "@/lib/useVariantSelection";
import type { Product, ProductVariant } from "@/data/products";

export interface BazarStore {
  name: string;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

interface InvoiceLine {
  sectionKey: string;
  product: Product;
  variant: ProductVariant | null;
  qty: number;
  price: number;
  available: boolean;
}

interface InvoiceGroup {
  name: string;
  sections: { key: string; label: string }[];
}

export const INVOICE_ID = "bazar-invoice";
/** Fired right before the Screenshot button captures the sheet, so the time stamp is current. */
export const INVOICE_CAPTURE_EVENT = "bazar-invoice-capture";
const PRINT_TITLE = "বাজারের লিস্ট";
const BORDER = "1px solid #c9ced6";
const ACCENT = "#F07A22";
const formatPrice = (value: number) => value.toLocaleString("en-US");
const formatDate = (date: Date) =>
  date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const noopSubscribe = () => () => {};

const cell: React.CSSProperties = { border: BORDER, padding: "5px 8px", fontSize: 12, verticalAlign: "top" };
const head: React.CSSProperties = { ...cell, background: "#f3f4f6", fontWeight: 700, color: "#374151", textAlign: "left" };

/**
 * Printable bazar list (shown only when printing, like a shop's "Print PC" sheet): store header,
 * then every subcategory as a row with the picked products, quantities and prices.
 * Rendered straight into <body> so the print CSS can hide the rest of the site.
 */
export default function BazarInvoice({
  store,
  groups,
  lines,
  onlyPicked,
}: {
  store: BazarStore;
  groups: InvoiceGroup[];
  lines: InvoiceLine[];
  onlyPicked: boolean;
}) {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [printedAt, setPrintedAt] = useState(() => new Date());

  // Fresh time stamp, and a readable title for the browser's print header, whenever the page is printed.
  useEffect(() => {
    let previousTitle = "";
    const before = () => {
      setPrintedAt(new Date());
      previousTitle = document.title;
      document.title = `${PRINT_TITLE} - ${store.name}`;
    };
    const after = () => {
      if (previousTitle) document.title = previousTitle;
    };
    const stamp = () => setPrintedAt(new Date());
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    window.addEventListener(INVOICE_CAPTURE_EVENT, stamp);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
      window.removeEventListener(INVOICE_CAPTURE_EVENT, stamp);
    };
  }, [store.name]);

  if (!isClient) return null;

  const orderable = lines.filter((line) => line.available);
  const totalQty = orderable.reduce((sum, line) => sum + line.qty, 0);
  const totalPrice = orderable.reduce((sum, line) => sum + line.price * line.qty, 0);
  const siteUrl = window.location.origin.replace(/^https?:\/\//, "");

  return createPortal(
    <div id={INVOICE_ID} style={{ color: "#111827", fontFamily: "inherit", background: "#fff" }}>
      {/* Store header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 18 }}>
        {store.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={store.logoUrl}
            alt={store.name}
            onError={(e) => (e.currentTarget.style.display = "none")}
            style={{ height: 64, width: "auto", objectFit: "contain" }}
          />
        )}
        <div>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: ACCENT, borderBottom: `2px solid ${ACCENT}`, paddingBottom: 2 }}>
            {store.name}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12 }}>
            {store.phone && (
              <>
                <b>Phone:</b> {store.phone}
              </>
            )}
            {store.phone && store.email && ", "}
            {store.email && (
              <>
                <b>Email:</b> {store.email}
              </>
            )}
          </p>
          {store.address && <p style={{ margin: "2px 0 0", fontSize: 12 }}>{store.address}</p>}
          <p style={{ margin: "2px 0 0", fontSize: 12 }}>{siteUrl}/one-click-bazar</p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{PRINT_TITLE}</p>
        <p style={{ margin: 0, fontSize: 11, color: "#4b5563" }}>তারিখ: {formatDate(printedAt)}</p>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${ACCENT}` }}>
        <thead>
          <tr>
            <th style={{ ...head, width: "24%" }}>ক্যাটাগরি</th>
            <th style={head}>পণ্যের নাম</th>
            <th style={{ ...head, width: "8%", textAlign: "center" }}>পরিমাণ</th>
            <th style={{ ...head, width: "12%", textAlign: "right" }}>দাম</th>
            <th style={{ ...head, width: "13%", textAlign: "right" }}>মোট</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const rows = group.sections
              .map((section) => ({ section, picks: lines.filter((line) => line.sectionKey === section.key) }))
              .filter(({ picks }) => !onlyPicked || picks.length > 0);
            if (!rows.length) return null;
            return [
              <tr key={`g-${group.name}`} style={{ breakInside: "avoid" }}>
                <td colSpan={5} style={{ ...cell, background: "#FFF4EB", fontWeight: 800, color: "#9a3f0b" }}>
                  {group.name}
                </td>
              </tr>,
              ...rows.flatMap(({ section, picks }) =>
                picks.length === 0
                  ? [
                      <tr key={section.key} style={{ breakInside: "avoid" }}>
                        <td style={{ ...cell, fontWeight: 600 }}>{section.label}</td>
                        <td style={cell} />
                        <td style={cell} />
                        <td style={cell} />
                        <td style={cell} />
                      </tr>,
                    ]
                  : picks.map((line, i) => (
                      <tr key={`${section.key}-${line.product.id}-${line.variant?.id ?? ""}`} style={{ breakInside: "avoid" }}>
                        {i === 0 && (
                          <td rowSpan={picks.length} style={{ ...cell, fontWeight: 600 }}>
                            {section.label}
                          </td>
                        )}
                        <td style={cell}>
                          {line.product.name}
                          {line.variant && <span style={{ color: "#4b5563" }}> ({variantLabel(line.variant.options)})</span>}
                          {!line.available && <span style={{ color: "#D7262E", fontWeight: 700 }}> · Stock Out</span>}
                        </td>
                        <td style={{ ...cell, textAlign: "center" }}>{line.qty}</td>
                        <td style={{ ...cell, textAlign: "right" }}>৳{formatPrice(line.price)}</td>
                        <td style={{ ...cell, textAlign: "right", textDecoration: line.available ? "none" : "line-through" }}>
                          ৳{formatPrice(line.price * line.qty)}
                        </td>
                      </tr>
                    )),
              ),
            ];
          })}
          <tr style={{ breakInside: "avoid" }}>
            <td colSpan={2} style={{ ...cell, textAlign: "right", fontWeight: 800 }}>সর্বমোট:</td>
            <td style={{ ...cell, textAlign: "center", fontWeight: 800 }}>{totalQty}</td>
            <td style={cell} />
            <td style={{ ...cell, textAlign: "right", fontWeight: 800, color: ACCENT }}>৳{formatPrice(totalPrice)}</td>
          </tr>
        </tbody>
      </table>

      <p style={{ margin: "8px 0 0", fontSize: 11, color: "#6b7280" }}>
        * ডেলিভারি চার্জ চেকআউটে যোগ হবে। দাম পরিবর্তন হতে পারে।
      </p>
    </div>,
    document.body,
  );
}
