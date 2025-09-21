import { afterEach, vi } from "vitest";

const booleanFromEnv = (value: string | undefined) => {
  if (value === undefined) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }
  return undefined;
};

const numberFromEnv = (value: string | undefined) => {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

vi.mock("astro:env/client", () => ({
  get PUBLIC_SITE_URL() {
    return process.env.PUBLIC_SITE_URL ?? undefined;
  },
  get PUBLIC_ENABLE_PAGEFIND() {
    return booleanFromEnv(process.env.PUBLIC_ENABLE_PAGEFIND);
  },
  get PUBLIC_PAGEFIND_MIN_ITEMS() {
    return numberFromEnv(process.env.PUBLIC_PAGEFIND_MIN_ITEMS);
  },
  get PUBLIC_PAGEFIND_PLACEHOLDER() {
    return process.env.PUBLIC_PAGEFIND_PLACEHOLDER ?? undefined;
  },
  get PUBLIC_ENABLE_GISCUS() {
    return booleanFromEnv(process.env.PUBLIC_ENABLE_GISCUS);
  },
  get PUBLIC_GISCUS_REPO() {
    return process.env.PUBLIC_GISCUS_REPO ?? undefined;
  },
  get PUBLIC_GISCUS_REPO_ID() {
    return process.env.PUBLIC_GISCUS_REPO_ID ?? undefined;
  },
  get PUBLIC_GISCUS_CATEGORY() {
    return process.env.PUBLIC_GISCUS_CATEGORY ?? undefined;
  },
  get PUBLIC_GISCUS_CATEGORY_ID() {
    return process.env.PUBLIC_GISCUS_CATEGORY_ID ?? undefined;
  },
  get PUBLIC_OG_BACKGROUND() {
    return process.env.PUBLIC_OG_BACKGROUND ?? undefined;
  },
  get PUBLIC_OG_FOREGROUND() {
    return process.env.PUBLIC_OG_FOREGROUND ?? undefined;
  },
  get PUBLIC_OG_ACCENT() {
    return process.env.PUBLIC_OG_ACCENT ?? undefined;
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
});
