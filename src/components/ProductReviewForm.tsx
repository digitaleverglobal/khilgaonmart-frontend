"use client";
import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import { useCustomer } from "@/context/CustomerContext";

const SECONDARY = "#F07A22";

// Lets a logged-in customer review a product they've received. The backend
// checks the purchase; the review shows after admin approval and then earns
// the review bonus.
export default function ProductReviewForm({ productId, reviewBonus = 0 }: { productId: number | string; reviewBonus?: number }) {
  const { token, isLoggedIn } = useCustomer();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!token) return;
    setSending(true);
    setError("");
    try {
      await apiFetch<ApiResponse<unknown>>("/review/customer", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: Number(productId), rating, comment: comment.trim() }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "রিভিউ পাঠানো যায়নি");
    } finally {
      setSending(false);
    }
  };

  const box: React.CSSProperties = {
    marginTop: 16,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "18px 20px",
  };

  if (done) {
    return (
      <div style={{ ...box, color: "#166534", background: "#f0fdf4", borderColor: "#bbf7d0", fontSize: 14 }}>
        ধন্যবাদ! আপনার রিভিউ অনুমোদনের অপেক্ষায় আছে।
        {reviewBonus > 0 && ` অনুমোদিত হলে আপনি ${reviewBonus} রিওয়ার্ড পয়েন্ট পাবেন।`}
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div style={{ ...box, fontSize: 14, color: "#555" }}>
        এই পণ্য কিনে থাকলে রিভিউ দিতে{" "}
        <Link href="/login" style={{ color: SECONDARY, fontWeight: 700 }}>লগইন করুন</Link>
        {reviewBonus > 0 && ` — রিভিউ দিলে ${reviewBonus} পয়েন্ট বোনাস`}
      </div>
    );
  }

  if (!open) {
    return (
      <div style={{ ...box, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, color: "#444" }}>
          এই পণ্যটি ব্যবহার করেছেন? আপনার মতামত দিন।
          {reviewBonus > 0 && <b style={{ color: SECONDARY }}> +{reviewBonus} পয়েন্ট</b>}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ background: SECONDARY, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          রিভিউ লিখুন
        </button>
      </div>
    );
  }

  return (
    <div style={box}>
      <p style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#111" }}>আপনার রিভিউ</p>
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }} role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} star`}
            onClick={() => setRating(star)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 26, lineHeight: 1, color: star <= rating ? "#f59e0b" : "#d1d5db", padding: 0 }}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="পণ্যটি কেমন লেগেছে লিখুন..."
        style={{ width: "100%", border: "1px solid #ddd", borderRadius: 8, padding: "10px 12px", fontSize: 14, resize: "vertical", outline: "none" }}
      />
      {error && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#dc2626" }}>{error}</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          onClick={submit}
          disabled={sending || comment.trim().length < 3}
          style={{
            background: sending || comment.trim().length < 3 ? "#9ca3af" : SECONDARY,
            color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 13,
            cursor: sending ? "not-allowed" : "pointer",
          }}
        >
          {sending ? "পাঠানো হচ্ছে..." : "রিভিউ পাঠান"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          বাতিল
        </button>
      </div>
    </div>
  );
}
