import siteConfigJson from "../../../../site.config.json";

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

interface RuntimeOptions {
  defaultProduction?: boolean;
}

export interface RuntimeEnvInput {
  [key: string]: unknown;
  PUBLIC_SITE_URL?: unknown;
  PUBLIC_ENABLE_PAGEFIND?: unknown;
  PUBLIC_PAGEFIND_MIN_ITEMS?: unknown;
  PUBLIC_PAGEFIND_PLACEHOLDER?: unknown;
  PUBLIC_ENABLE_GISCUS?: unknown;
  PUBLIC_GISCUS_REPO?: unknown;
  PUBLIC_GISCUS_REPO_ID?: unknown;
  PUBLIC_GISCUS_CATEGORY?: unknown;
  PUBLIC_GISCUS_CATEGORY_ID?: unknown;
  PUBLIC_OG_BACKGROUND?: unknown;
  PUBLIC_OG_FOREGROUND?: unknown;
  PUBLIC_OG_ACCENT?: unknown;
  NODE_ENV?: unknown;
  PROD?: unknown;
}

export interface SiteRuntime {
  siteConfig: SiteConfig;
  integrations: IntegrationsConfig;
  appConfig: AppConfig;
  absoluteUrl: (pathOrUrl: string) => string;
  canonicalHref: (relativePath?: string) => string | undefined;
  mailtoHref: () => string;
}

const optionalString = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
};

const optionalBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }
  const stringValue = optionalString(value)?.toLowerCase();
  if (!stringValue) {
    return undefined;
  }
  if (["true", "1", "yes", "on", "prod", "production"].includes(stringValue)) {
    return true;
  }
  if (
    ["false", "0", "no", "off", "dev", "development", "test"].includes(
      stringValue,
    )
  ) {
    return false;
  }
  return undefined;
};

const optionalNumber = (value: unknown): number | undefined => {
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

const normalizeBaseUrl = (maybeUrl: string) => {
  const normalized = new URL(maybeUrl);
  normalized.pathname = "/";
  const result = normalized.toString();
  return result.endsWith("/") ? result.slice(0, -1) : result;
};

export const createSiteRuntime = (
  env: RuntimeEnvInput,
  options: RuntimeOptions = {},
): SiteRuntime => {
  const defaultProduction =
    optionalBoolean(env.PROD) ??
    optionalBoolean(env.NODE_ENV) ??
    options.defaultProduction ??
    false;

  const resolvedBaseUrl = (() => {
    const provided =
      optionalString(env.PUBLIC_SITE_URL) ?? siteConfigJson.site.baseUrl;
    try {
      return normalizeBaseUrl(provided);
    } catch (error) {
      throw new Error(`Invalid site base URL provided: ${provided}`);
    }
  })();

  const pagefind: PagefindConfig = {
    enabled: optionalBoolean(env.PUBLIC_ENABLE_PAGEFIND) ?? defaultProduction,
    minItems: optionalNumber(env.PUBLIC_PAGEFIND_MIN_ITEMS) ?? 1,
    assetPath: "/pagefind",
    translations: {
      placeholder:
        optionalString(env.PUBLIC_PAGEFIND_PLACEHOLDER) ?? "Search posts",
    },
  };

  const giscusEnv = {
    repo: optionalString(env.PUBLIC_GISCUS_REPO),
    repoId: optionalString(env.PUBLIC_GISCUS_REPO_ID),
    category: optionalString(env.PUBLIC_GISCUS_CATEGORY),
    categoryId: optionalString(env.PUBLIC_GISCUS_CATEGORY_ID),
  };

  const hasGiscusConfig = Boolean(
    giscusEnv.repo &&
      giscusEnv.repoId &&
      giscusEnv.category &&
      giscusEnv.categoryId,
  );

  const giscus: GiscusConfig = {
    enabled: Boolean(
      (optionalBoolean(env.PUBLIC_ENABLE_GISCUS) ?? false) && hasGiscusConfig,
    ),
    repo: giscusEnv.repo,
    repoId: giscusEnv.repoId,
    category: giscusEnv.category,
    categoryId: giscusEnv.categoryId,
    mapping: "pathname",
    reactionsEnabled: "1",
    emitMetadata: "0",
    theme: "preferred_color_scheme",
    lang: "en",
  };

  const ogImage: OgImageConfig = {
    background:
      optionalString(env.PUBLIC_OG_BACKGROUND) ??
      siteConfigJson.branding.ogBackground,
    foreground:
      optionalString(env.PUBLIC_OG_FOREGROUND) ??
      siteConfigJson.branding.ogForeground,
    accent:
      optionalString(env.PUBLIC_OG_ACCENT) ??
      siteConfigJson.branding.accentColor,
    fallbackTitle: siteConfigJson.site.name,
  };

  const siteConfig: SiteConfig = {
    site: {
      ...siteConfigJson.site,
      baseUrl: resolvedBaseUrl,
    },
    branding: siteConfigJson.branding,
  };

  const integrations: IntegrationsConfig = {
    pagefind,
    giscus,
    ogImage,
  };

  const appConfig: AppConfig = {
    ...siteConfig,
    integrations,
  };

  const absoluteUrl = (pathOrUrl: string): string => {
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

  const canonicalHref = (relativePath?: string): string | undefined => {
    if (!relativePath) {
      return undefined;
    }
    const normalized = relativePath.startsWith("/")
      ? relativePath
      : `/${relativePath}`;
    return absoluteUrl(normalized);
  };

  const mailtoHref = (): string => `mailto:${siteConfig.site.contactEmail}`;

  return {
    siteConfig,
    integrations,
    appConfig,
    absoluteUrl,
    canonicalHref,
    mailtoHref,
  };
};
