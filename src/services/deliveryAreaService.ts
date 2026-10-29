import { BASE } from "@/lib/api";

// Managed in admin → Website Setting → Delivery Area.
export interface DeliveryArea {
  Id: number;
  district: string;
  area: string;
  charge: string | number;
  sortOrder?: number;
}

export async function fetchDeliveryAreas(): Promise<DeliveryArea[]> {
  try {
    const res = await fetch(`${BASE}/delivery-areas/public`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

// Districts in the order the API lists them (district A→Z).
export function getDeliveryDistricts(areas: DeliveryArea[]): string[] {
  return [...new Set(areas.map((area) => area.district))];
}

export function getDeliveryAreaCharge(area: DeliveryArea | undefined): number {
  const amount = Number(area?.charge);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}
