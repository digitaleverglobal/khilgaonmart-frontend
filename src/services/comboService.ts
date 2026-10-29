import { BASE, IMAGES } from "@/lib/api";

export interface ComboItem {
  productId: number;
  variantId: number | null;
  qty: number;
  name: string;
  slug: string | null;
  image: string | null;
  /** e.g. "Volume: 6ml, Color: Gold" */
  variant: string | null;
  price: number;
  regularPrice: number;
  freeShipping: boolean;
  available: boolean;
  inStock: boolean;
}

export interface ComboOffer {
  Id: number;
  title: string;
  image: string | null;
  description: string | null;
  regularPrice: number;
  discount: number;
  offerPrice: number;
  items: ComboItem[];
  inStock: boolean;
}

function toImgUrl(file: string | null | undefined): string | null {
  if (!file) return null;
  if (file.startsWith("http") || file.startsWith("data:") || file.startsWith("/")) return file;
  return `${IMAGES}/${file}`;
}

function mapCombo(raw: ComboOffer): ComboOffer {
  return {
    ...raw,
    image: toImgUrl(raw.image) ?? toImgUrl(raw.items?.[0]?.image),
    regularPrice: Number(raw.regularPrice || 0),
    discount: Number(raw.discount || 0),
    offerPrice: Number(raw.offerPrice || 0),
    items: (raw.items || []).map((item) => ({ ...item, image: toImgUrl(item.image) })),
  };
}

export function comboHref(combo: Pick<ComboOffer, "Id">): string {
  return `/combo-offer/${combo.Id}`;
}

export async function fetchCombos(): Promise<ComboOffer[]> {
  const res = await fetch(`${BASE}/combo-offers/public`, {
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(15_000),
  } as RequestInit);
  if (!res.ok) throw new Error("Failed to fetch combo offers");
  const json = await res.json();
  return (Array.isArray(json.data) ? json.data : []).map(mapCombo);
}

// Returns null only when the combo does not exist (or is inactive).
export async function fetchComboById(id: number): Promise<ComboOffer | null> {
  const res = await fetch(`${BASE}/combo-offers/public/${id}`, {
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(15_000),
  } as RequestInit);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch combo offer ${id}: ${res.status}`);
  const json = await res.json();
  return json.data ? mapCombo(json.data as ComboOffer) : null;
}
