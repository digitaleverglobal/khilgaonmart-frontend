import Link from "next/link";
import { Product } from "@/data/products";
import { ProductTile } from "./ProductCarouselSection";
import Container from "./Container";

interface ProductSectionProps {
  title: string;
  products: Product[];
  menuParam?: string;
  // Overrides the default "View All" link (/?menu=<menuParam or title>).
  viewAllHref?: string;
}

export default function ProductSection({
  title,
  products,
  menuParam,
  viewAllHref,
}: ProductSectionProps) {
  if (products.length === 0) return null;

  return (
    <section style={{ paddingTop: 6, paddingBottom: 6 }}>
      <Container>
        <div
          className="flex items-center justify-between"
          style={{ marginTop: 22, marginBottom: 12 }}
        >
          <h2
            className="uppercase text-gray-800"
            style={{ fontSize: 14, fontWeight: 700 }}
          >
            {title}
          </h2>
          <Link
            href={viewAllHref ?? `/?menu=${encodeURIComponent(menuParam ?? title)}`}
            className="border text-[#0E4A5F] border-[#0E4A5F] hover:bg-[#0E4A5F] hover:text-white transition-colors font-semibold whitespace-nowrap"
            style={{ borderRadius: 2, padding: "3px 10px", fontSize: 11 }}
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6" style={{ gap: 10 }}>
          {products.map((product) => (
            <ProductTile key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
}
