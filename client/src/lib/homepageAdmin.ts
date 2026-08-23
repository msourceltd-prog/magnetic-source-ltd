export type HeroSlide = {
  src: string;
  label: string;
};

export type HomepageSettings = {
  heroSlides: HeroSlide[];
};

export const HOMEPAGE_SETTINGS_CATEGORY_SLUG = "__homepage-settings";

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  { src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663870447287/bydqoXXLZqEZstwD.jpg", label: "Wholesale packing supplies" },
  { src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663870447287/GttUoRTVYguFzBlE.jpeg", label: "Wholesale warehouse interior" },
  { src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663870447287/iJutMmvQCbHMVuva.jpg", label: "Wholesale stock boxes" },
];

export const defaultHomepageSettings = (): HomepageSettings => ({
  heroSlides: DEFAULT_HERO_SLIDES.map((slide) => ({ ...slide })),
});

export function normalizeHomepageSettings(value: unknown): HomepageSettings {
  if (!value || typeof value !== "object" || !Array.isArray((value as HomepageSettings).heroSlides)) return defaultHomepageSettings();

  const heroSlides = (value as HomepageSettings).heroSlides
    .map((slide) => ({
      src: typeof slide?.src === "string" ? slide.src.trim() : "",
      label: typeof slide?.label === "string" ? slide.label.trim() : "",
    }))
    .filter((slide) => Boolean(slide.src))
    .slice(0, 3);

  return heroSlides.length === 3
    ? { heroSlides }
    : defaultHomepageSettings();
}

export function parseHomepageSettings(summary: string | null | undefined): HomepageSettings {
  if (!summary) return defaultHomepageSettings();
  try {
    return normalizeHomepageSettings(JSON.parse(summary));
  } catch {
    return defaultHomepageSettings();
  }
}

export function serializeHomepageSettings(settings: HomepageSettings): string {
  return JSON.stringify(normalizeHomepageSettings(settings));
}
