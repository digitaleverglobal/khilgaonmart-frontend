import PopularProductRow from "@/components/PopularProductRow";
import type { Product } from "@/data/products";

// Picks products for the product page's side panel: the ones marked
// "Best Deals" in admin first, topped up with the newest products.
export function pickPopularProducts(all: Product[], excludeId: number, limit = 6): Product[] {
  const others = all.filter((p) => p.id !== excludeId);
  const flagged = others.filter((p) => p.bestDeals);
  const rest = others.filter((p) => !p.bestDeals);
  return [...flagged, ...rest].slice(0, limit);
}

export default function PopularProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <div className="delivery-card">
      <div className="delivery-card-head">
        <p>Popular Products</p>
      </div>
      <div style={{ padding: "0 16px 8px" }}>
        {products.map((p, idx) => (
          <PopularProductRow key={p.id} product={p} last={idx === products.length - 1} />
        ))}
      </div>
    </div>
  );
}
