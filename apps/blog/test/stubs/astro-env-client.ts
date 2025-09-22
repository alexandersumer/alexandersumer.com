const getString = (key: string): string | undefined => {
  const raw = process.env[key];
  if (typeof raw !== "string") {
    return undefined;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const getBoolean = (key: string): boolean | undefined => {
  const value = getString(key)?.toLowerCase();
  if (value == null) {
    return undefined;
  }
  if (["true", "1", "yes", "on"].includes(value)) {
    return true;
  }
  if (["false", "0", "no", "off"].includes(value)) {
    return false;
  }
  return undefined;
};

const getNumber = (key: string): number | undefined => {
  const value = getString(key);
  if (value == null) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const PUBLIC_SITE_URL = getString("PUBLIC_SITE_URL");
export const PUBLIC_ENABLE_PAGEFIND = getBoolean("PUBLIC_ENABLE_PAGEFIND");
export const PUBLIC_PAGEFIND_MIN_ITEMS = getNumber("PUBLIC_PAGEFIND_MIN_ITEMS");
export const PUBLIC_PAGEFIND_PLACEHOLDER = getString(
  "PUBLIC_PAGEFIND_PLACEHOLDER",
);
export const PUBLIC_ENABLE_GISCUS = getBoolean("PUBLIC_ENABLE_GISCUS");
export const PUBLIC_GISCUS_REPO = getString("PUBLIC_GISCUS_REPO");
export const PUBLIC_GISCUS_REPO_ID = getString("PUBLIC_GISCUS_REPO_ID");
export const PUBLIC_GISCUS_CATEGORY = getString("PUBLIC_GISCUS_CATEGORY");
export const PUBLIC_GISCUS_CATEGORY_ID = getString("PUBLIC_GISCUS_CATEGORY_ID");
export const PUBLIC_OG_BACKGROUND = getString("PUBLIC_OG_BACKGROUND");
export const PUBLIC_OG_FOREGROUND = getString("PUBLIC_OG_FOREGROUND");
export const PUBLIC_OG_ACCENT = getString("PUBLIC_OG_ACCENT");
