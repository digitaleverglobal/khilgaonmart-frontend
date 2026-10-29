import type { Metadata } from "next";
import CollectionPage from "@/components/CollectionPage";
import ComboCard from "@/components/ComboCard";
import { fetchCombos, type ComboOffer } from "@/services/comboService";

export const revalidate = 60;

export const metadata: Metadata = { title: "Combo Offer - Khilgaon Mart" };

export default async function ComboOfferPage() {
  const combos = await fetchCombos().catch(() => [] as ComboOffer[]);

  return (
    <CollectionPage title="Combo Offer">
      {combos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5" style={{ gap: 10 }}>
          {combos.map((combo) => (
            <ComboCard key={combo.Id} combo={combo} />
          ))}
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 8, padding: "60px 20px", textAlign: "center", color: "#6b7280" }}>
          <p style={{ fontSize: 16, margin: 0 }}>এই মুহূর্তে কোনো কম্বো অফার নেই।</p>
        </div>
      )}
    </CollectionPage>
  );
}
