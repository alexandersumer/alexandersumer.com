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

describe("integrations config", () => {
  it("disables pagefind in development by default", async () => {
    const { integrations } = await loadModule();
    expect(integrations.pagefind.enabled).toBe(false);
  });

  it("enables pagefind when overridden via env", async () => {
    vi.stubEnv("PUBLIC_ENABLE_PAGEFIND", "true");
    const { integrations } = await loadModule();
    expect(integrations.pagefind.enabled).toBe(true);
  });

  it("disables giscus without complete configuration", async () => {
    const { integrations } = await loadModule();
    expect(integrations.giscus.enabled).toBe(false);
  });

  it("enables giscus when all identifiers are set", async () => {
    vi.stubEnv("PUBLIC_ENABLE_GISCUS", "true");
    vi.stubEnv("PUBLIC_GISCUS_REPO", "alexander/discussions");
    vi.stubEnv("PUBLIC_GISCUS_REPO_ID", "R_123");
    vi.stubEnv("PUBLIC_GISCUS_CATEGORY", "Announcements");
    vi.stubEnv("PUBLIC_GISCUS_CATEGORY_ID", "DIC_456");

    const { integrations } = await loadModule();
    expect(integrations.giscus.enabled).toBe(true);
  });

  it("provides OG image branding defaults", async () => {
    const { integrations } = await loadModule();
    expect(integrations.ogImage.background).toBe("#0f172a");
    expect(integrations.ogImage.accent).toBe("#6E44FF");
  });
});
