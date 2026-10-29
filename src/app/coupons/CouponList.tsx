"use client";

import { useState } from "react";
import Link from "next/link";
import type { PublicCoupon } from "@/services/couponService";
import styles from "./CouponList.module.css";

const taka = (value: number) => `৳${Number(value || 0).toLocaleString("en-US")}`;

function discountLabel(coupon: PublicCoupon) {
  return coupon.type === "Percentage" ? `${coupon.amount}%` : taka(coupon.amount);
}

function expiryText(date: string | null) {
  if (!date) return { text: "মেয়াদ সীমাহীন", urgent: false };
  const end = new Date(`${String(date).slice(0, 10)}T23:59:59`);
  if (Number.isNaN(end.getTime())) return { text: "", urgent: false };
  const days = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
  const pretty = end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  if (days <= 1) return { text: "আজই শেষ!", urgent: true };
  if (days <= 7) return { text: `আর ${days} দিন বাকি · ${pretty}`, urgent: true };
  return { text: `মেয়াদ: ${pretty}`, urgent: false };
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

function CouponCard({ coupon, copied, onCopy }: { coupon: PublicCoupon; copied: boolean; onCopy: () => void }) {
  const expiry = expiryText(coupon.date);
  return (
    <div className={styles.card}>
      <div className={styles.stub}>
        <span className={styles.stubLabel}>ছাড়</span>
        <span className={styles.stubValue}>{discountLabel(coupon)}</span>
        <span className={styles.stubOff}>OFF</span>
      </div>
      <span className={styles.notchTop} />
      <span className={styles.notchBottom} />

      <div className={styles.body}>
        <div>
          <p className={styles.title}>
            {coupon.type === "Percentage" ? `${coupon.amount}% ছাড় পুরো অর্ডারে` : `${taka(coupon.amount)} ফ্ল্যাট ছাড়`}
          </p>
          <div className={styles.meta}>
            <span>
              {coupon.buyAmount > 0 ? `সর্বনিম্ন ${taka(coupon.buyAmount)} এর অর্ডারে প্রযোজ্য` : "যেকোনো অর্ডারে প্রযোজ্য"}
            </span>
            {expiry.text && (
              <span className={`${styles.expiry} ${expiry.urgent ? styles.urgent : ""}`}>{expiry.text}</span>
            )}
          </div>
        </div>

        <div className={styles.codeRow}>
          <span className={styles.code} title={coupon.code}>{coupon.code}</span>
          <button type="button" onClick={onCopy} className={`${styles.copy} ${copied ? styles.copied : ""}`}>
            {copied ? "কপি হয়েছে ✓" : "কপি করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CouponList({ coupons }: { coupons: PublicCoupon[] }) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  if (!coupons.length) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🎟️</div>
        <p>এই মুহূর্তে কোনো কুপন নেই। নতুন কুপন শীঘ্রই আসছে।</p>
        <Link href="/shop" className={styles.emptyLink}>
          সব পণ্য দেখুন →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.hero}>
        <div>
          <p className={styles.heroTitle}>🎉 আপনার জন্য বিশেষ ছাড়!</p>
          <p className={styles.heroText}>কোড কপি করে চেকআউটে &ldquo;Apply Coupon&rdquo; ঘরে বসিয়ে দিন।</p>
        </div>
        <Link href="/shop" className={styles.heroButton}>
          এখনই কিনুন →
        </Link>
      </div>

      <div className={styles.grid}>
        {coupons.map((coupon) => (
          <CouponCard
            key={coupon.Id}
            coupon={coupon}
            copied={copiedId === coupon.Id}
            onCopy={async () => {
              if (await copyText(coupon.code)) {
                setCopiedId(coupon.Id);
                window.setTimeout(() => setCopiedId((id) => (id === coupon.Id ? null : id)), 2000);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
