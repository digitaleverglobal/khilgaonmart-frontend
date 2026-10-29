import type { Metadata } from "next";
import CollectionPage from "@/components/CollectionPage";
import { fetchStorefrontProducts } from "@/services/productService";
import { fetchAllCategories, type BazarCategory } from "@/services/menuService";
import { fetchSiteSettings } from "@/services/settingService";
import type { Product } from "@/data/products";
import BazarBuilder, { type BazarSection } from "./BazarBuilder";

export const revalidate = 60;

export const metadata: Metadata = { title: "১ ক্লিকে বাজার - Khilgaon Mart" };

const OTHERS = "অন্যান্য";
const norm = (value: string | null | undefined) => (value || "").trim().toLowerCase();

// One row per subcategory that has products, grouped under its category. Categories and
// subcategories follow the admin menu order; ones only found on products come after.
function buildSections(categories: BazarCategory[], products: Product[]): BazarSection[] {
  const tree = new Map<string, { label: string; subs: Map<string, { label: string; products: Product[] }> }>();
  for (const product of products) {
    if (!(product.discountedPrice > 0)) continue;
    const category = product.category?.trim() || OTHERS;
    const sub = product.subCategory?.trim() || OTHERS;
    if (!tree.has(norm(category))) tree.set(norm(category), { label: category, subs: new Map() });
    const subs = tree.get(norm(category))!.subs;
    if (!subs.has(norm(sub))) subs.set(norm(sub), { label: sub, products: [] });
    subs.get(norm(sub))!.products.push(product);
  }

  const menuOrder = new Map(categories.map((category, index) => [norm(category.label), index]));
  const orderedCategories = [...tree.entries()].sort(
    ([a], [b]) => (menuOrder.get(a) ?? Infinity) - (menuOrder.get(b) ?? Infinity),
  );

  return orderedCategories.flatMap(([categoryKey, { label: group, subs }]) => {
    const menu = categories.find((category) => norm(category.label) === categoryKey);
    const subOrder = new Map((menu?.subLabels || []).map((label, index) => [norm(label), index]));
    const rank = (key: string) => (key === norm(OTHERS) ? Infinity : subOrder.get(key) ?? subOrder.size);
    return [...subs.entries()]
      .sort(([a], [b]) => rank(a) - rank(b))
      .map(([subKey, { label, products: list }]) => ({
        key: `${categoryKey}/${subKey}`,
        group,
        label,
        imageUrl: subs.size === 1 ? menu?.imageUrl ?? null : null,
        products: list,
      }));
  });
}

export default async function OneClickBazarPage() {
  const [productsResult, categories, settings] = await Promise.all([
    fetchStorefrontProducts({ limit: 500, page: 1 }).catch(() => ({ products: [] as Product[] })),
    fetchAllCategories().catch(() => [] as BazarCategory[]),
    fetchSiteSettings(),
  ]);
  const footer = settings.websiteFooter || {};
  // Header of the printed bazar list; same contact fallbacks as the site footer.
  const store = {
    name: "Khilgaon Mart",
    logoUrl: settings.logoUrl || footer.logoUrl || null,
    phone: footer.phone || settings.phone || null,
    email: footer.email || settings.email || null,
    address: footer.address || settings.address || null,
  };

  return (
    <CollectionPage title="১ ক্লিকে বাজার">
      <BazarBuilder sections={buildSections(categories, productsResult.products)} store={store} />
    </CollectionPage>
  );
}
