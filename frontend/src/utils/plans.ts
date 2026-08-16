export interface CatalogPlan {
  id: number;
  name: 'free' | 'silver' | 'gold' | string;
  price: number;
  max_playlists?: number | null;
  max_streams_per_day?: number | null;
}

export function extractPlans(data: any): CatalogPlan[] {
  const raw = Array.isArray(data) ? data : data?.results || [];
  return raw.map((item: any) => ({
    id: item.id,
    name: item.name,
    price: parseFloat(item.price) || 0,
    max_playlists: item.max_playlists,
    max_streams_per_day: item.max_streams_per_day,
  }));
}

export function planPrice(plans: CatalogPlan[], name: string, fallback = 0): number {
  const match = plans.find((item) => item.name === name);
  return match ? Number(match.price) || 0 : fallback;
}
