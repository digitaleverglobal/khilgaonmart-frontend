import { redirect } from "next/navigation";
import MarqueeBanner from "@/components/MarqueeBanner";
import Header from "@/components/Header";
import CategorySidebar from "@/components/CategorySidebar";
import HeroBanner from "@/components/HeroBanner";
import PopupBanner from "@/components/PopupBanner";
import TopCategories from "@/components/TopCategories";
import CategoryHero from "@/components/CategoryHero";
import ProductSection from "@/components/ProductSection";
import ProductCarouselSection from "@/components/ProductCarouselSection";
import { categoryHref } from "@/lib/storeNav";
import BrandsSection from "@/components/BrandsSection";
import { SiteFooter } from "@/components/SiteChrome";
import FloatingContact from "@/components/FloatingContact";
import ScrollToTop from "@/components/ScrollToTop";
import { fetchBestSellingProducts, fetchStorefrontProducts } from "@/services/productService";
import { fetchSiteSettings, type SiteSetting } from "@/services/settingService";
import { fetchBanners } from "@/services/bannerService";
import { fetchBrands } from "@/services/brandService";
import { fetchCategoryMenus, fetchNavItems, type CategoryMenuItem } from "@/services/menuService";
import type { NavItem, Product } from "@/data/products";
import type { BannerItem } from "@/services/bannerService";
import type { BrandItem } from "@/services/brandService";

// The storefront API returns the newest products first.
const NEW_ARRIVAL_COUNT = 12;

function groupByCategory(products: Product[]): { title: string; products: Product[] }[] {
  const map = new Map<string, Product[]>();
  for (const p of products) {
    if (!p.category) continue;
    const key = p.category;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return [...map.entries()].map(([title, products]) => ({ title, products }));
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ menu?: string; sub?: string; child?: string; landingPageId?: string }>;
}) {
  const { menu, sub, child, landingPageId } = await searchParams;
  if (landingPageId) {
    redirect(`/landing-page/${encodeURIComponent(landingPageId)}`);
  }

  let allProducts: Product[] = [];
  let settings: Partial<SiteSetting> = {};
  let banners: { slides: BannerItem[]; sideBanners: BannerItem[]; popupBanners: BannerItem[] } = { slides: [], sideBanners: [], popupBanners: [] };
  let brands: BrandItem[] = [];
  let categoryMenus: CategoryMenuItem[] = [];
  let navItems: NavItem[] = [];

  const [productsResult, settingsResult, bannersResult, brandsResult, categoryMenusResult, navItemsResult, bestSelling] = await Promise.all([
    // A category page asks the API for just that category, so it isn't limited
    // to whichever products happen to be in the newest 200.
    fetchStorefrontProducts(
      menu
        ? { limit: 500, page: 1, category: menu, subCategory: sub, childCategory: child }
        : { limit: 200, page: 1 },
    ).catch(() => ({ products: [] as Product[] })),
    fetchSiteSettings().catch(() => ({} as Partial<SiteSetting>)),
    fetchBanners().catch(() => ({ slides: [] as BannerItem[], sideBanners: [] as BannerItem[], popupBanners: [] as BannerItem[] })),
    fetchBrands().catch(() => [] as BrandItem[]),
    fetchCategoryMenus().catch(() => [] as CategoryMenuItem[]),
    // Shares the per-render menu request with fetchCategoryMenus above.
    fetchNavItems().catch(() => [] as NavItem[]),
    menu ? Promise.resolve([] as Product[]) : fetchBestSellingProducts(12).catch(() => [] as Product[]),
  ]);
  allProducts   = productsResult.products;
  settings      = settingsResult;
  banners       = bannersResult;
  brands        = brandsResult;
  categoryMenus = categoryMenusResult;
  navItems      = navItemsResult;

  let sections: { title: string; products: Product[] }[] = [];

  if (menu) {
    const filtered = allProducts.filter((p) => {
      const catMatch = p.category?.toLowerCase() === menu.toLowerCase();
      if (!catMatch) return false;
      if (child) return p.childCategory?.toLowerCase() === child.toLowerCase();
      if (sub) return p.subCategory?.toLowerCase() === sub.toLowerCase();
      return true;
    });
    const sectionTitle = child
      ? `${menu.toUpperCase()} — ${sub ?? ""} — ${child}`
      : sub
        ? `${menu.toUpperCase()} — ${sub}`
      : menu.toUpperCase();
    sections = filtered.length > 0 ? [{ title: sectionTitle, products: filtered }] : [];
  } else {
    sections = groupByCategory(allProducts);
  }

  const isFiltered = Boolean(menu);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <MarqueeBanner text={settings.marqueeText ?? null} />
      <Header logoUrl={settings.logoUrl ?? null} navItems={navItems} />
      <div className="store-body flex-1">
      <CategorySidebar navItems={navItems} />
      <main>
        {!isFiltered && <HeroBanner slides={banners.slides} sideBanners={banners.sideBanners} />}
        {!isFiltered && <PopupBanner banners={banners.popupBanners} />}
        {!isFiltered && <ProductCarouselSection title="Best Selling Items" icon="🔥" products={bestSelling} />}
        {!isFiltered && <TopCategories items={categoryMenus} />}

        {menu && (
          <CategoryHero
            menu={menu}
            sub={sub}
            child={child}
            imageUrl={categoryMenus.find((item) => item.label.toLowerCase() === menu.toLowerCase())?.imageUrl}
            products={sections[0]?.products ?? []}
          />
        )}

        {!isFiltered && (
          <ProductCarouselSection title="New Arrival" products={allProducts.slice(0, NEW_ARRIVAL_COUNT)} />
        )}

        {sections.length > 0 ? (
          sections.map((s) =>
            isFiltered ? (
              <ProductSection key={s.title} title={s.title} products={s.products} menuParam={menu} />
            ) : (
              <ProductCarouselSection key={s.title} title={s.title} products={s.products} viewAllHref={categoryHref(s.title)} />
            ),
          )
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#999" }}>
            {isFiltered ? (
              <p>এই ক্যাটাগরিতে কোনো পণ্য পাওয়া যায়নি।</p>
            ) : (
              <p>পণ্য লোড হচ্ছে... backend চালু আছে কিনা নিশ্চিত করুন।</p>
            )}
          </div>
        )}

        {!isFiltered && <BrandsSection brands={brands} />}
      </main>
      </div>
      <SiteFooter />
      <FloatingContact settings={settings} />
      <ScrollToTop />
    </div>
  );
}
