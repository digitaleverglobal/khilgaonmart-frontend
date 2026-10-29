import type { Metadata } from "next";
import CollectionPage from "@/components/CollectionPage";
import { fetchPublicCoupons, type PublicCoupon } from "@/services/couponService";
import CouponList from "./CouponList";

export const revalidate = 60;

export const metadata: Metadata = { title: "Get Coupon - Khilgaon Mart" };

export default async function CouponsPage() {
  const coupons = await fetchPublicCoupons().catch(() => [] as PublicCoupon[]);
  return (
    <CollectionPage title="Get Coupon">
      <CouponList coupons={coupons} />
    </CollectionPage>
  );
}
