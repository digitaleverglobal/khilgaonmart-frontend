import type { Metadata } from "next";
import CollectionPage from "@/components/CollectionPage";

export const revalidate = 60;

export const metadata: Metadata = { title: "Flash Sale - Khilgaon Mart" };

export default function FlashSalePage() {
  return (
    <CollectionPage
      title="Flash Sale"
      filter={(p) => Boolean(p.flashSale)}
      emptyText="এই মুহূর্তে ফ্ল্যাশ সেলের কোনো পণ্য নেই।"
    />
  );
}
