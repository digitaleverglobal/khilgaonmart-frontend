import type { ReactNode } from "react";
import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import Header from "@/components/Header";
import CategorySidebar from "@/components/CategorySidebar";
import { ProductTile } from "@/components/ProductCarouselSection";
import Container from "@/components/Container";
import { SiteFooter } from "@/components/SiteChrome";
import FloatingContact from "@/components/FloatingContact";
import ScrollToTop from "@/components/ScrollToTop";
import { fetchStorefrontProducts } from "@/services/productService";
import { fetchSiteSettings, type SiteSetting } from "@/services/settingService";
import { fetchNavItems } from "@/services/menuService";
import type { NavItem, Product } from "@/data/products";

interface CollectionPageProps {
  title: string;
  // Omit to show every product. Ignored when `comingSoon` is set.
  filter?: (product: Product) => boolean;
  emptyText?: string;
  // For sections the backend can't serve yet (no product data behind them).
  comingSoon?: string;
  // Custom content in place of the product grid (e.g. the coupon list).
  children?: ReactNode;
}

// Shared shell for the store-link pages (Shop, Offers, Free Delivery, ...):
// header, category sidebar, a product grid and the footer.
export default async function CollectionPage({ title, filter, emptyText, comingSoon, children }: CollectionPageProps) {
  const [productsResult, settings, navItems] = await Promise.all([
    comingSoon || children
      ? Promise.resolve({ products: [] as Product[] })
      : fetchStorefrontProducts({ limit: 200, page: 1 }).catch(() => ({ products: [] as Product[] })),
    fetchSiteSettings().catch(() => ({} as Partial<SiteSetting>)),
    fetchNavItems().catch(() => [] as NavItem[]),
  ]);

  const products = filter ? productsResult.products.filter(filter) : productsResult.products;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <MarqueeBanner text={settings.marqueeText ?? null} />
      <Header logoUrl={settings.logoUrl ?? null} navItems={navItems} />
      <div className="store-body flex-1">
        <CategorySidebar navItems={navItems} />
        <main style={{ paddingBottom: 40 }}>
          <Container>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, margin: "22px 0 14px" }}>
              <h1 className="uppercase text-gray-800" style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                {title}
              </h1>
              {!comingSoon && !children && products.length > 0 && (
                <span style={{ fontSize: 13, color: "#6b7280" }}>{products.length} টি পণ্য</span>
              )}
            </div>

            {children ? (
              children
            ) : comingSoon ? (
              <div style={{ background: "#fff", borderRadius: 8, padding: "60px 20px", textAlign: "center", color: "#6b7280" }}>
                <p style={{ fontSize: 16, margin: "0 0 14px" }}>{comingSoon}</p>
                <Link href="/shop" style={{ fontSize: 14, color: "#F07A22", fontWeight: 700, textDecoration: "none" }}>
                  সব পণ্য দেখুন →
                </Link>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5" style={{ gap: 10 }}>
                {products.map((product) => (
                  <ProductTile key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#999" }}>
                <p>{emptyText ?? "কোনো পণ্য পাওয়া যায়নি।"}</p>
              </div>
            )}
          </Container>
        </main>
      </div>
      <SiteFooter />
      <FloatingContact settings={settings} />
      <ScrollToTop />
    </div>
  );
}
