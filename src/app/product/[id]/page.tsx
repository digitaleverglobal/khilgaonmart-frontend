import { notFound, permanentRedirect } from "next/navigation";
import MarqueeBanner from "@/components/MarqueeBanner";
import Header from "@/components/Header";
import { SiteFooter } from "@/components/SiteChrome";
import FloatingContact from "@/components/FloatingContact";
import ScrollToTop from "@/components/ScrollToTop";
import ProductDetailClient from "@/components/ProductDetailClient";
import Container from "@/components/Container";
import CategorySidebar from "@/components/CategorySidebar";
import { fetchProductById, fetchStorefrontProducts } from "@/services/productService";
import PopularProducts, { pickPopularProducts } from "@/components/PopularProducts";
import type { Product } from "@/data/products";
import ProductSection from "@/components/ProductSection";
import { categoryHref } from "@/lib/storeNav";

const sameName = (a?: string | null, b?: string | null) =>
  Boolean(a && b && a.toLowerCase() === b.toLowerCase());

// Products from the same child category; when it has none, widen to the
// subcategory and then the category so the section isn't empty.
function pickRelatedProducts(all: Product[], product: Product, limit = 12): Product[] {
  const others = all.filter((p) => p.id !== product.id && sameName(p.category, product.category));
  const levels = [
    others.filter((p) => sameName(p.subCategory, product.subCategory) && sameName(p.childCategory, product.childCategory)),
    others.filter((p) => sameName(p.subCategory, product.subCategory)),
    others,
  ];
  return (levels.find((list) => list.length > 0) ?? []).slice(0, limit);
}
import { parseProductId, productHref, productPathSegment, safeDecode } from "@/lib/productUrl";
import { fetchSiteSettings, type SiteSetting } from "@/services/settingService";
import { fetchNavItems } from "@/services/menuService";
import {
  fetchDeliveryCharges,
  getDeliveryChargeLines,
} from "@/services/shippingChargeService";

// Render each product on its first visit, then serve it from the cache and
// re-render in the background at most once a minute.
export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // The segment is "<slug>-<id>" (or the old bare "<id>"); only the id is
  // used for the lookup.
  const { id } = await params;
  const productId = parseProductId(safeDecode(id));
  if (productId === null) notFound();

  const [product, settings, deliveryCharges, navItems, allProducts] = await Promise.all([
    fetchProductById(productId),
    fetchSiteSettings().catch(() => ({}) as Partial<SiteSetting>),
    fetchDeliveryCharges().catch(() => []),
    fetchNavItems().catch(() => []),
    // Same cached request the homepage makes.
    fetchStorefrontProducts({ limit: 200, page: 1 })
      .then((r) => r.products)
      .catch(() => [] as Product[]),
  ]);

  if (!product) notFound();

  const related = pickRelatedProducts(allProducts, product);

  // Old /product/<id> links and outdated slugs move to the current URL.
  if (safeDecode(id) !== productPathSegment(product)) {
    permanentRedirect(productHref(product));
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <MarqueeBanner text={(settings as SiteSetting).marqueeText ?? null} />
      <Header
        logoUrl={(settings as SiteSetting).logoUrl ?? null}
        navItems={navItems}
      />

      <div className="store-body flex-1">
      <CategorySidebar
        navItems={navItems}
        current={{
          menu: product.category ?? undefined,
          sub: product.subCategory ?? undefined,
          child: product.childCategory ?? undefined,
        }}
      />
      <main className="product-page-main">
        <Container>
          <div className="product-page-surface">
            {/* Left+Center: product detail */}
            <div className="flex-1">
              <ProductDetailClient
                product={product}
                whatsappUrl={(settings as SiteSetting).whatsappUrl ?? null}
                whatsappNumber={(settings as SiteSetting).whatsappNumber ?? null}
                phone={(settings as SiteSetting).phone ?? null}
                rewardSettings={(settings as SiteSetting).reward ?? null}
                deliveryLines={getDeliveryChargeLines(deliveryCharges)}
              />
            </div>

            {/* Right: Popular products (delivery info lives in the tabs) */}
            <div className="delivery-panel">
              <PopularProducts products={pickPopularProducts(allProducts, product.id)} />
            </div>
          </div>
        </Container>

        {related.length > 0 && (
          <ProductSection
            title="Related Products"
            products={related}
            viewAllHref={
              product.category
                ? categoryHref(product.category, product.subCategory ?? undefined, product.childCategory ?? undefined)
                : "/shop"
            }
          />
        )}
      </main>
      </div>

      <SiteFooter />
      <FloatingContact settings={settings as Partial<SiteSetting>} />
      <ScrollToTop />
    </div>
  );
}
