import { afterEach, describe, expect, it, vi } from "vitest";

const modulePath = "../../src/features/site/config";
const loadModule = async () => {
  vi.resetModules();
  return import(modulePath);
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("site config", () => {
  it("builds canonical hrefs from relative paths", async () => {
    const { canonicalHref } = await loadModule();
    expect(canonicalHref("/blog/hello/")).toBe(
      "https://alexandersumer.com/blog/hello/",
    );
  });

  it("returns undefined when no canonical path provided", async () => {
    const { canonicalHref } = await loadModule();
    expect(canonicalHref()).toBeUndefined();
  });

  it("normalizes base URL overrides from environment", async () => {
    vi.stubEnv("PUBLIC_SITE_URL", "https://preview.alexandersumer.com");
    const { siteConfig } = await loadModule();
    expect(siteConfig.site.baseUrl).toBe("https://preview.alexandersumer.com");
  });

  it("creates absolute URLs from paths and absolute inputs", async () => {
    const { absoluteUrl } = await loadModule();
    expect(absoluteUrl("/blog/")).toBe("https://alexandersumer.com/blog/");
    expect(absoluteUrl("https://example.com/custom")).toBe(
      "https://example.com/custom",
    );
  });
});
