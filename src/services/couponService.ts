import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

export interface AppliedCoupon {
  Id: number;
  code: string;
  type: string;
  amount: number;
  buyAmount: number;
  discount: number;
  subtotal: number;
  totalAfterDiscount: number;
}

export async function validateCoupon(code: string, subtotal: number): Promise<AppliedCoupon> {
  const res = await apiFetch<ApiResponse<AppliedCoupon>>("/coupon-codes/validate", {
    method: "POST",
    body: JSON.stringify({ code, subtotal }),
  });
  return res.data;
}

export interface PublicCoupon {
  Id: number;
  code: string;
  /** Expiry date (YYYY-MM-DD); null means no expiry. */
  date: string | null;
  type: "Fixed" | "Percentage";
  amount: number;
  buyAmount: number;
  image: string | null;
}

// Active, unexpired coupons for the Get Coupon page.
export async function fetchPublicCoupons(): Promise<PublicCoupon[]> {
  const res = await apiFetch<ApiResponse<PublicCoupon[]>>("/coupon-codes/public", {
    next: { revalidate: 60 },
  });
  return Array.isArray(res.data) ? res.data : [];
}
