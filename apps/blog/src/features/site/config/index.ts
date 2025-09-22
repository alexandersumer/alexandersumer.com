import siteConfigJson from "../../../../site.config.json";

type MaybeEnvValue = string | number | boolean | undefined;

type RuntimeEnv = Record<string, MaybeEnvValue>;

const readImportMetaEnv = (): RuntimeEnv => {
  try {
    const meta = import.meta as { env?: RuntimeEnv };
    return meta.env ?? {};
  } catch {
    return {};
  }
};

const processEnv = (() => {
  if (typeof process === "undefined") {
    return {} as RuntimeEnv;
  }
  return process.env as RuntimeEnv;
})();

const runtimeEnv: RuntimeEnv = {
  ...processEnv,
  ...readImportMetaEnv(),
};

const coerceBoolean = (value: MaybeEnvValue): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on", "prod", "production"].includes(normalized)) {
      return true;
    }
    if (
      ["false", "0", "no", "off", "dev", "development", "test"].includes(
        normalized,
      )
    ) {
      return false;
    }
  }
  return undefined;
};

const coerceNumber = (value: MaybeEnvValue): number | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const coerceString = (value: MaybeEnvValue): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
};

export interface SiteMetadata {
  name: string;
  tagline: string;
  author: string;
  baseUrl: string;
  contactEmail: string;
  defaultOgImage: string | null;
}

export interface Branding {
  headerLabel: string;
  accentColor: string;
  ogBackground: string;
  ogForeground: string;
}

export interface PagefindConfig {
  enabled: boolean;
  minItems: number;
  assetPath: string;
  translations: {
    placeholder: string;
  };
}

export interface GiscusConfig {
  enabled: boolean;
  repo?: string;
  repoId?: string;
  category?: string;
  categoryId?: string;
  mapping: "pathname" | "url" | "title";
  reactionsEnabled: "0" | "1";
  emitMetadata: "0" | "1";
  theme: string;
  lang: string;
}

export interface OgImageConfig {
  background: string;
  foreground: string;
  accent: string;
  fallbackTitle: string;
}

export interface IntegrationsConfig {
  pagefind: PagefindConfig;
  giscus: GiscusConfig;
  ogImage: OgImageConfig;
}

export interface SiteConfig {
  site: SiteMetadata;
  branding: Branding;
}

export interface AppConfig {
  site: SiteMetadata;
  branding: Branding;
  integrations: IntegrationsConfig;
}

const normalizeBaseUrl = (maybeUrl: string) => {
  const normalized = new URL(maybeUrl);
  normalized.pathname = "/";
  const result = normalized.toString();
  return result.endsWith("/") ? result.slice(0, -1) : result;
};

const resolvedBaseUrl = (() => {
  const provided =
    coerceString(runtimeEnv.PUBLIC_SITE_URL) ?? siteConfigJson.site.baseUrl;
  try {
    return normalizeBaseUrl(provided);
  } catch (error) {
    throw new Error(`Invalid site base URL provided: ${provided}`);
  }
})();

const defaultProdFlag =
  coerceBoolean(runtimeEnv.PROD) ?? coerceBoolean(runtimeEnv.NODE_ENV) ?? false;

const resolvedPagefindEnabled = () => {
  const explicit = coerceBoolean(runtimeEnv.PUBLIC_ENABLE_PAGEFIND);
  if (typeof explicit === "boolean") {
    return explicit;
  }
  return defaultProdFlag;
};

const pagefind: PagefindConfig = {
  enabled: resolvedPagefindEnabled(),
  minItems: coerceNumber(runtimeEnv.PUBLIC_PAGEFIND_MIN_ITEMS) ?? 1,
  assetPath: "/pagefind",
  translations: {
    placeholder:
      coerceString(runtimeEnv.PUBLIC_PAGEFIND_PLACEHOLDER) ?? "Search posts",
  },
};

const hasGiscusConfig = Boolean(
  coerceString(runtimeEnv.PUBLIC_GISCUS_REPO) &&
    coerceString(runtimeEnv.PUBLIC_GISCUS_REPO_ID) &&
    coerceString(runtimeEnv.PUBLIC_GISCUS_CATEGORY) &&
    coerceString(runtimeEnv.PUBLIC_GISCUS_CATEGORY_ID),
);

const giscus: GiscusConfig = {
  enabled: Boolean(
    coerceBoolean(runtimeEnv.PUBLIC_ENABLE_GISCUS) && hasGiscusConfig,
  ),
  repo: coerceString(runtimeEnv.PUBLIC_GISCUS_REPO),
  repoId: coerceString(runtimeEnv.PUBLIC_GISCUS_REPO_ID),
  category: coerceString(runtimeEnv.PUBLIC_GISCUS_CATEGORY),
  categoryId: coerceString(runtimeEnv.PUBLIC_GISCUS_CATEGORY_ID),
  mapping: "pathname",
  reactionsEnabled: "1",
  emitMetadata: "0",
  theme: "preferred_color_scheme",
  lang: "en",
};

const ogImage: OgImageConfig = {
  background:
    coerceString(runtimeEnv.PUBLIC_OG_BACKGROUND) ??
    siteConfigJson.branding.ogBackground,
  foreground:
    coerceString(runtimeEnv.PUBLIC_OG_FOREGROUND) ??
    siteConfigJson.branding.ogForeground,
  accent:
    coerceString(runtimeEnv.PUBLIC_OG_ACCENT) ??
    siteConfigJson.branding.accentColor,
  fallbackTitle: siteConfigJson.site.name,
};

export const siteConfig: SiteConfig = {
  site: {
    ...siteConfigJson.site,
    baseUrl: resolvedBaseUrl,
  },
  branding: siteConfigJson.branding,
};

export const integrations: IntegrationsConfig = {
  pagefind,
  giscus,
  ogImage,
};

export const appConfig: AppConfig = {
  ...siteConfig,
  integrations,
};

export const absoluteUrl = (pathOrUrl: string): string => {
  if (!pathOrUrl) {
    return siteConfig.site.baseUrl;
  }

  try {
    const url = new URL(pathOrUrl, `${siteConfig.site.baseUrl}/`).toString();
    if (pathOrUrl.endsWith("/") || /\/$/.test(pathOrUrl)) {
      return url.endsWith("/") ? url : `${url}/`;
    }
    return url.endsWith("/") ? url.slice(0, -1) : url;
  } catch (error) {
    throw new Error(`Failed to construct absolute URL from: ${pathOrUrl}`);
  }
};

export const canonicalHref = (relativePath?: string): string | undefined => {
  if (!relativePath) {
    return undefined;
  }
  const normalized = relativePath.startsWith("/")
    ? relativePath
    : `/${relativePath}`;
  return absoluteUrl(normalized);
};

export const mailtoHref = (): string =>
  `mailto:${siteConfig.site.contactEmail}`;
