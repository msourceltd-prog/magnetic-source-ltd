import { describe, expect, it } from "vitest";
import { DEFAULT_HERO_SLIDES, normalizeHomepageSettings, parseHomepageSettings } from "./homepageAdmin";

describe("homepage admin settings", () => {
  it("keeps exactly three complete hero images", () => {
    const settings = normalizeHomepageSettings({
      heroSlides: [
        { src: "https://example.com/one.jpg", label: "One" },
        { src: "https://example.com/two.jpg", label: "Two" },
        { src: "https://example.com/three.jpg", label: "Three" },
      ],
    });
    expect(settings.heroSlides).toHaveLength(3);
    expect(settings.heroSlides[1].label).toBe("Two");
  });

  it("falls back safely when saved settings are incomplete or malformed", () => {
    expect(parseHomepageSettings("not json").heroSlides).toEqual(DEFAULT_HERO_SLIDES);
    expect(normalizeHomepageSettings({ heroSlides: [{ src: "https://example.com/only.jpg", label: "Only" }] }).heroSlides).toEqual(DEFAULT_HERO_SLIDES);
  });
});
