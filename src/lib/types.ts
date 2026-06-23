// Non-destructive photo edit values. Applied live via CSS filters,
// just like the sliders in a phone photo app.
export type PhotoFilters = {
  brightness: number; // 1 = normal
  contrast: number; // 1 = normal
  saturate: number; // 1 = normal
  warmth: number; // sepia 0..1
  blur: number; // px
  grayscale: number; // 0..1
};

export const DEFAULT_FILTERS: PhotoFilters = {
  brightness: 1,
  contrast: 1,
  saturate: 1,
  warmth: 0,
  blur: 0,
  grayscale: 0,
};

export function filtersToCss(f: Partial<PhotoFilters> | null | undefined): string {
  const v = { ...DEFAULT_FILTERS, ...(f ?? {}) };
  return [
    `brightness(${v.brightness})`,
    `contrast(${v.contrast})`,
    `saturate(${v.saturate})`,
    `sepia(${v.warmth})`,
    `grayscale(${v.grayscale})`,
    `blur(${v.blur}px)`,
  ].join(" ");
}

export type Photo = {
  id: string;
  adventure_id: string;
  storage_path: string;
  filters: PhotoFilters | null;
  sort: number;
  signedUrl?: string;
};

export type Adventure = {
  id: string;
  author: string;
  title: string;
  note: string | null;
  lat: number;
  lng: number;
  happened_on: string | null;
  created_at: string;
  photos?: Photo[];
};

export type Profile = {
  id: string;
  display_name: string | null;
  lat: number | null;
  lng: number | null;
  location_updated_at: string | null;
};
