import { haversineMiles } from "@/lib/distance";
import { Adventure } from "@/lib/types";

// A "patch": a group of memories that sit within a radius of each other.
export type Cluster = {
  id: string;
  lat: number;
  lng: number;
  items: Adventure[];
};

// Greedy geographic grouping: each memory joins the first patch whose center
// is within radiusMiles, otherwise it starts a new patch.
export function clusterAdventures(
  adventures: Adventure[],
  radiusMiles = 10
): Cluster[] {
  const clusters: Cluster[] = [];
  for (const a of adventures) {
    let placed = false;
    for (const c of clusters) {
      if (haversineMiles(c.lat, c.lng, a.lat, a.lng) <= radiusMiles) {
        c.items.push(a);
        c.lat = c.items.reduce((s, x) => s + x.lat, 0) / c.items.length;
        c.lng = c.items.reduce((s, x) => s + x.lng, 0) / c.items.length;
        c.id = c.items[0].id;
        placed = true;
        break;
      }
    }
    if (!placed) clusters.push({ id: a.id, lat: a.lat, lng: a.lng, items: [a] });
  }
  return clusters;
}
