"use client";
import { useEffect, useState } from "react";
import { fetchMyRewards, type MyRewards, type RewardTransactionType } from "@/services/rewardService";

const PRIMARY   = "#0E4A5F";
const SECONDARY = "#F07A22";

const TYPE_LABELS: Record<RewardTransactionType, string> = {
  earn: "অর্ডার ডেলিভারিতে পাওয়া",
  earn_reversal: "ডেলিভারি বাতিল হওয়ায় কাটা",
  redeem: "অর্ডারে ব্যবহার করা",
  redeem_refund: "বাতিল অর্ডার থেকে ফেরত",
  adjust: "অ্যাডজাস্টমেন্ট",
  expire: "মেয়াদ শেষ",
  bonus_signup: "সাইন-আপ বোনাস",
  bonus_first_order: "প্রথম অর্ডার বোনাস",
  bonus_review: "রিভিউ বোনাস",
  bonus_referral: "রেফারেল বোনাস",
};

const TIER_COLORS: Record<string, string> = { Silver: "#94a3b8", Gold: "#eab308", Platinum: "#6366f1" };

const fmt = (v: number) => Number(v || 0).toLocaleString("en-US");
const fmtDate = (v: string) =>
  new Date(v).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" });

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: "24px 28px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
};
const heading: React.CSSProperties = { margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: "#111" };

// "কাস্টমার রিওয়ার্ড" tab on the account page.
export default function RewardsPanel({ token, onAuthError }: { token: string; onAuthError: (err: unknown) => boolean }) {
  const [rewards, setRewards] = useState<MyRewards | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchMyRewards(token, controller.signal)
      .then(setRewards)
      .catch((err) => {
        if (controller.signal.aborted || onAuthError(err)) return;
        setError("রিওয়ার্ড লোড করা যায়নি, আবার চেষ্টা করুন।");
      });
    return () => controller.abort();
  }, [token, onAuthError]);

  if (error) return <div style={{ ...card, textAlign: "center", color: "#dc2626", fontSize: 14 }}>{error}</div>;
  if (!rewards) return <div style={{ ...card, textAlign: "center", color: "#999" }}>লোড হচ্ছে...</div>;

  const { settings, balance, balanceValue, tier, expiringSoon, referralCode, transactions } = rewards;
  const referralLink = referralCode && typeof window !== "undefined"
    ? `${window.location.origin}/login?mode=register&ref=${encodeURIComponent(referralCode)}`
    : "";

  const copyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const tierProgress = tier?.next
    ? Math.min(100, Math.round((tier.spend / Math.max(1, tier.next.minSpend)) * 100))
    : 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Balance */}
      <div
        style={{
          ...card,
          background: `linear-gradient(135deg, ${PRIMARY}, #13627a)`,
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>
            আপনার রিওয়ার্ড পয়েন্ট
            {tier && (
              <span
                style={{
                  marginLeft: 8,
                  padding: "2px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  background: TIER_COLORS[tier.current.name] || SECONDARY,
                  color: "#fff",
                }}
              >
                {tier.current.name}
              </span>
            )}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 34, fontWeight: 900, lineHeight: 1 }}>
            {fmt(balance)} <span style={{ fontSize: 15, fontWeight: 700 }}>পয়েন্ট</span>
          </p>
          {expiringSoon && (
            <p style={{ margin: "10px 0 0", fontSize: 12, color: "#FFD29D" }}>
              ⚠️ {fmt(expiringSoon.points)} পয়েন্টের মেয়াদ {fmtDate(expiringSoon.date)} তারিখে শেষ হবে
            </p>
          )}
        </div>
        <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 16px", textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>মূল্য</p>
          <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: "#FFD29D" }}>৳{fmt(balanceValue)}</p>
        </div>
      </div>

      {!settings.enabled ? (
        <div style={card}>
          <h2 style={heading}>কীভাবে কাজ করে</h2>
          <p style={{ margin: 0, fontSize: 14, color: "#666" }}>রিওয়ার্ড প্রোগ্রাম এখন চালু নেই। চালু হলে এখানে জানানো হবে।</p>
        </div>
      ) : (
        <>
          {/* Membership tier */}
          {tier && (
            <div style={card}>
              <h2 style={heading}>মেম্বারশিপ লেভেল</h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                {tier.tiers.map((t) => {
                  const active = t.name === tier.current.name;
                  return (
                    <div
                      key={t.name}
                      style={{
                        flex: "1 1 150px",
                        borderRadius: 10,
                        padding: "10px 12px",
                        border: `2px solid ${active ? TIER_COLORS[t.name] || SECONDARY : "#eee"}`,
                        background: active ? "#fffaf3" : "#fff",
                      }}
                    >
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: TIER_COLORS[t.name] || PRIMARY }}>{t.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#666" }}>৳{fmt(t.minSpend)}+ কেনাকাটা</p>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#333" }}>
                        {t.multiplier}x পয়েন্ট{t.freeDelivery ? " · ফ্রি ডেলিভারি" : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "#f1f1f1", overflow: "hidden" }}>
                <div style={{ width: `${tierProgress}%`, height: "100%", background: SECONDARY }} />
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "#555" }}>
                গত ১২ মাসে ডেলিভারি হওয়া কেনাকাটা: <b>৳{fmt(tier.spend)}</b>
                {tier.next
                  ? ` — ${tier.next.name} হতে আর ৳${fmt(tier.remainingToNext)} কেনাকাটা বাকি`
                  : " — আপনি সর্বোচ্চ লেভেলে আছেন 🎉"}
              </p>
            </div>
          )}

          {/* Referral */}
          {referralCode && settings.referralBonus > 0 && (
            <div style={card}>
              <h2 style={heading}>বন্ধুকে রেফার করুন</h2>
              <p style={{ margin: "0 0 12px", fontSize: 14, color: "#555" }}>
                আপনার লিংক দিয়ে বন্ধু অ্যাকাউন্ট খুলে প্রথম অর্ডার ডেলিভারি পেলে আপনি ও আপনার বন্ধু দুজনেই{" "}
                <b>{fmt(settings.referralBonus)} পয়েন্ট</b> পাবেন।
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#555" }}>রেফারেল কোড:</span>
                <span style={{ fontWeight: 800, color: PRIMARY, background: "#eef4f6", borderRadius: 6, padding: "4px 10px" }}>
                  {referralCode}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input
                  readOnly
                  value={referralLink}
                  style={{ flex: 1, minWidth: 0, border: "1px solid #ddd", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#444" }}
                />
                <button
                  type="button"
                  onClick={copyReferral}
                  style={{ background: SECONDARY, color: "#fff", border: "none", borderRadius: 8, padding: "0 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  {copied ? "কপি হয়েছে ✓" : "কপি"}
                </button>
              </div>
            </div>
          )}

          {/* How it works */}
          <div style={card}>
            <h2 style={heading}>কীভাবে কাজ করে</h2>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: "#444", lineHeight: "26px" }}>
              <li>প্রতি ৳{fmt(settings.earnAmount)} কেনাকাটায় <b>{fmt(settings.earnPoints)} পয়েন্ট</b> — অর্ডার ডেলিভারি হলে জমা হবে।</li>
              <li>১ পয়েন্ট = <b>৳{fmt(settings.pointValue)}</b> ডিসকাউন্ট।</li>
              <li>
                চেকআউটে লগইন করা অবস্থায় কমপক্ষে {fmt(settings.minRedeemPoints)} পয়েন্ট ব্যবহার করা যাবে, পণ্যের দামের সর্বোচ্চ{" "}
                {fmt(settings.maxRedeemPercent)}% পর্যন্ত।
              </li>
              {settings.expiryMonths > 0 && <li>পয়েন্ট পাওয়ার {fmt(settings.expiryMonths)} মাস পরে মেয়াদ শেষ হয়।</li>}
              <li>অর্ডার বাতিল বা রিটার্ন হলে ব্যবহার করা পয়েন্ট ফেরত আসবে।</li>
            </ul>
            {(settings.signupBonus > 0 || settings.firstOrderBonus > 0 || settings.reviewBonus > 0) && (
              <>
                <p style={{ margin: "14px 0 6px", fontSize: 14, fontWeight: 800, color: "#222" }}>বোনাস পয়েন্ট</p>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: "#444", lineHeight: "26px" }}>
                  {settings.signupBonus > 0 && <li>অ্যাকাউন্ট খুললে: +{fmt(settings.signupBonus)}</li>}
                  {settings.firstOrderBonus > 0 && <li>প্রথম অর্ডার ডেলিভারি হলে: +{fmt(settings.firstOrderBonus)}</li>}
                  {settings.reviewBonus > 0 && <li>কেনা পণ্যের রিভিউ অনুমোদিত হলে: +{fmt(settings.reviewBonus)}</li>}
                  {settings.referralBonus > 0 && <li>রেফারেল: আপনি ও বন্ধু দুজনেই +{fmt(settings.referralBonus)}</li>}
                </ul>
              </>
            )}
          </div>
        </>
      )}

      {/* History */}
      <div style={card}>
        <h2 style={heading}>পয়েন্টের হিসাব</h2>
        {transactions.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: "#888" }}>এখনো কোনো পয়েন্ট জমা বা ব্যবহার হয়নি।</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {transactions.map((t) => (
              <div
                key={t.Id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom: "1px solid #f1f1f1",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#222" }}>{TYPE_LABELS[t.type] || t.type}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>
                    {t.invoiceId ? `${t.invoiceId} · ` : ""}{fmtDate(t.createdAt)}
                    {t.points > 0 && t.expiresAt ? ` · মেয়াদ ${fmtDate(t.expiresAt)}` : ""}
                  </p>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: t.points >= 0 ? "#16a34a" : SECONDARY, whiteSpace: "nowrap" }}>
                  {t.points >= 0 ? "+" : ""}{fmt(t.points)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
