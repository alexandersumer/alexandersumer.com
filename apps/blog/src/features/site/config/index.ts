import siteConfigJson from "../../../../site.config.json";
import {
  PUBLIC_SITE_URL,
  PUBLIC_ENABLE_PAGEFIND,
  PUBLIC_PAGEFIND_MIN_ITEMS,
  PUBLIC_PAGEFIND_PLACEHOLDER,
  PUBLIC_ENABLE_GISCUS,
  PUBLIC_GISCUS_REPO,
  PUBLIC_GISCUS_REPO_ID,
  PUBLIC_GISCUS_CATEGORY,
  PUBLIC_GISCUS_CATEGORY_ID,
  PUBLIC_OG_BACKGROUND,
  PUBLIC_OG_FOREGROUND,
  PUBLIC_OG_ACCENT,
} from "astro:env/client";

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
  const provided = PUBLIC_SITE_URL ?? siteConfigJson.site.baseUrl;
  return normalizeBaseUrl(provided);
})();

const defaultPagefindEnabled =
  typeof PUBLIC_ENABLE_PAGEFIND === "boolean"
    ? PUBLIC_ENABLE_PAGEFIND
    : import.meta.env.PROD;

const pagefind: PagefindConfig = {
  enabled: defaultPagefindEnabled,
  minItems: PUBLIC_PAGEFIND_MIN_ITEMS ?? 1,
  assetPath: "/pagefind",
  translations: {
    placeholder: PUBLIC_PAGEFIND_PLACEHOLDER ?? "Search posts",
  },
};

const hasGiscusConfig = Boolean(
  PUBLIC_GISCUS_REPO &&
    PUBLIC_GISCUS_REPO_ID &&
    PUBLIC_GISCUS_CATEGORY &&
    PUBLIC_GISCUS_CATEGORY_ID,
);

const giscus: GiscusConfig = {
  enabled: Boolean(PUBLIC_ENABLE_GISCUS && hasGiscusConfig),
  repo: PUBLIC_GISCUS_REPO,
  repoId: PUBLIC_GISCUS_REPO_ID,
  category: PUBLIC_GISCUS_CATEGORY,
  categoryId: PUBLIC_GISCUS_CATEGORY_ID,
  mapping: "pathname",
  reactionsEnabled: "1",
  emitMetadata: "0",
  theme: "preferred_color_scheme",
  lang: "en",
};

const ogImage: OgImageConfig = {
  background: PUBLIC_OG_BACKGROUND ?? siteConfigJson.branding.ogBackground,
  foreground: PUBLIC_OG_FOREGROUND ?? siteConfigJson.branding.ogForeground,
  accent: PUBLIC_OG_ACCENT ?? siteConfigJson.branding.accentColor,
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
