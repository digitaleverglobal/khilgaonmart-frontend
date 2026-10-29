import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

// Rates set in admin › Website › Customer Reward.
export interface RewardTier {
  name: string;
  minSpend: number;
  multiplier: number;
  freeDelivery: boolean;
}

export interface RewardSettings {
  enabled: boolean;
  earnAmount: number;
  earnPoints: number;
  pointValue: number;
  minRedeemPoints: number;
  maxRedeemPercent: number;
  expiryMonths: number;
  expiryReminderDays: number;
  signupBonus: number;
  firstOrderBonus: number;
  reviewBonus: number;
  referralBonus: number;
  smsEnabled: boolean;
  tiersEnabled: boolean;
  tiers: RewardTier[];
}

export type RewardTransactionType =
  | "earn" | "earn_reversal" | "redeem" | "redeem_refund" | "adjust" | "expire"
  | "bonus_signup" | "bonus_first_order" | "bonus_review" | "bonus_referral";

export interface RewardTransaction {
  Id: number;
  type: RewardTransactionType;
  points: number;
  note: string | null;
  invoiceId: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface MyRewards {
  settings: RewardSettings;
  balance: number;
  balanceValue: number;
  // Membership level by delivered spend over the last 12 months (null when tiers are off).
  tier: {
    current: RewardTier;
    next: RewardTier | null;
    spend: number;
    remainingToNext: number;
    tiers: RewardTier[];
  } | null;
  expiringSoon: { points: number; date: string } | null;
  // Share this; new customers enter it when signing up.
  referralCode: string | null;
  transactions: RewardTransaction[];
}

// Points a product price earns at the base rate (before any tier multiplier).
export function pointsForPrice(settings: RewardSettings | null | undefined, price: number): number {
  if (!settings?.enabled || settings.earnAmount <= 0) return 0;
  return Math.floor(price / settings.earnAmount) * settings.earnPoints;
}

export async function fetchMyRewards(token: string, signal?: AbortSignal): Promise<MyRewards> {
  const res = await apiFetch<ApiResponse<MyRewards>>("/customer/rewards", {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  return res.data;
}

// The most points usable on an order whose products cost `payableProducts`
// (after other discounts). Mirrors the backend's planRedemption.
export function maxRedeemablePoints(rewards: MyRewards, payableProducts: number): number {
  const { settings, balance } = rewards;
  if (!settings.enabled || settings.pointValue <= 0) return 0;
  const maxDiscount = Math.max(0, payableProducts) * (settings.maxRedeemPercent / 100);
  const points = Math.min(balance, Math.floor(maxDiscount / settings.pointValue));
  return points >= settings.minRedeemPoints ? points : 0;
}
