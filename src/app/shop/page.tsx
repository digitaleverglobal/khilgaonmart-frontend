import type { Metadata } from "next";
import CollectionPage from "@/components/CollectionPage";

export const revalidate = 60;

export const metadata: Metadata = { title: "Shop - Khilgaon Mart" };

export default function ShopPage() {
  return <CollectionPage title="Shop" />;
}
