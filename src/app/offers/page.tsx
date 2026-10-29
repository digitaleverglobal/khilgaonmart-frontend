import type { Metadata } from "next";
import CollectionPage from "@/components/CollectionPage";

export const revalidate = 60;

export const metadata: Metadata = { title: "Offers - Khilgaon Mart" };

export default function OffersPage() {
  return (
    <CollectionPage
      title="Offers"
      filter={(p) => p.discount > 0}
      emptyText="এই মুহূর্তে কোনো অফার নেই।"
    />
  );
}
