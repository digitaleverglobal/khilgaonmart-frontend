// Product URLs are /product/<slug>-<id>, e.g. /product/tengra-fish-deshi-20-gm-3.
// The trailing id is what the page looks up, so a renamed slug never breaks a
// link; the slug is only there for people and search engines. The backend's
// Facebook catalogue feed builds the same format.

interface ProductRef {
  id: number;
  slug?: string | null;
}

function cleanSlug(slug: string | null | undefined): string {
  return (slug ?? "").trim().replace(/^-+|-+$/g, "");
}

export function productPathSegment({ id, slug }: ProductRef): string {
  const s = cleanSlug(slug);
  return s ? `${s}-${id}` : String(id);
}

export function productHref(product: ProductRef): string {
  return `/product/${encodeURIComponent(productPathSegment(product))}`;
}

// Accepts both "<slug>-<id>" and the old bare "<id>" form.
export function parseProductId(segment: string): number | null {
  const match = /(?:^|-)(\d+)$/.exec(segment);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
