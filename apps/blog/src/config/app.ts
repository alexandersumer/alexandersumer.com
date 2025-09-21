import { z } from "zod";
import rawConfig from "../../site.config.json";

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

const booleanish = z.union([z.boolean(), z.string()]).transform((value) => {
  if (typeof value === "boolean") {
    return value;
  }
  const normalized = value.trim().toLowerCase();
  if (["false", "0", "off", "no"].includes(normalized)) {
    return false;
  }
  if (["true", "1", "on", "yes"].includes(normalized)) {
    return true;
  }
  throw new Error(`Invalid boolean value: ${value}`);
});

const optionalBooleanish = z
  .union([booleanish, z.undefined(), z.null()])
  .transform((value) =>
    value === null || value === undefined ? undefined : value,
  );

const numberish = z.union([z.number(), z.string()]).transform((value) => {
  if (typeof value === "number") {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }
  return parsed;
});

const optionalNumberish = z
  .union([numberish, z.undefined(), z.null()])
  .transform((value) =>
    value === null || value === undefined ? undefined : value,
  );

const optionalUrl = z
  .union([z.string().url(), z.undefined(), z.null()])
  .transform((value) =>
    value === null || value === undefined ? undefined : value,
  );

const EnvSchema = z.object({
  PUBLIC_SITE_URL: optionalUrl,
  PUBLIC_ENABLE_PAGEFIND: optionalBooleanish,
  PUBLIC_PAGEFIND_MIN_ITEMS: optionalNumberish,
  PUBLIC_PAGEFIND_PLACEHOLDER: z
    .string()
    .optional()
    .nullable()
    .transform((value) => value ?? undefined),
  PUBLIC_ENABLE_GISCUS: optionalBooleanish,
  PUBLIC_GISCUS_REPO: z
    .string()
    .optional()
    .nullable()
    .transform((value) => value ?? undefined),
  PUBLIC_GISCUS_REPO_ID: z
    .string()
    .optional()
    .nullable()
    .transform((value) => value ?? undefined),
  PUBLIC_GISCUS_CATEGORY: z
    .string()
    .optional()
    .nullable()
    .transform((value) => value ?? undefined),
  PUBLIC_GISCUS_CATEGORY_ID: z
    .string()
    .optional()
    .nullable()
    .transform((value) => value ?? undefined),
  PUBLIC_OG_BACKGROUND: z
    .string()
    .optional()
    .nullable()
    .transform((value) => value ?? undefined),
  PUBLIC_OG_FOREGROUND: z
    .string()
    .optional()
    .nullable()
    .transform((value) => value ?? undefined),
  PUBLIC_OG_ACCENT: z
    .string()
    .optional()
    .nullable()
    .transform((value) => value ?? undefined),
});

type MaybeEnvValue = string | boolean | undefined;
type MaybeEnv = Record<string, MaybeEnvValue>;

const importMetaEnv = (import.meta as { env?: MaybeEnv }).env ?? {};

const processEnv =
  (globalThis as { process?: { env?: MaybeEnv } }).process?.env ?? {};

const runtimeEnv: MaybeEnv = {
  ...processEnv,
  ...importMetaEnv,
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
      ["false", "0", "no", "off", "dev", "development"].includes(normalized)
    ) {
      return false;
    }
  }
  return undefined;
};

const defaultProdFlag =
  coerceBoolean(runtimeEnv.PROD) ?? coerceBoolean(runtimeEnv.NODE_ENV) ?? true;

const env = EnvSchema.parse({
  PUBLIC_SITE_URL: runtimeEnv.PUBLIC_SITE_URL,
  PUBLIC_ENABLE_PAGEFIND: runtimeEnv.PUBLIC_ENABLE_PAGEFIND,
  PUBLIC_PAGEFIND_MIN_ITEMS: runtimeEnv.PUBLIC_PAGEFIND_MIN_ITEMS,
  PUBLIC_PAGEFIND_PLACEHOLDER: runtimeEnv.PUBLIC_PAGEFIND_PLACEHOLDER,
  PUBLIC_ENABLE_GISCUS: runtimeEnv.PUBLIC_ENABLE_GISCUS,
  PUBLIC_GISCUS_REPO: runtimeEnv.PUBLIC_GISCUS_REPO,
  PUBLIC_GISCUS_REPO_ID: runtimeEnv.PUBLIC_GISCUS_REPO_ID,
  PUBLIC_GISCUS_CATEGORY: runtimeEnv.PUBLIC_GISCUS_CATEGORY,
  PUBLIC_GISCUS_CATEGORY_ID: runtimeEnv.PUBLIC_GISCUS_CATEGORY_ID,
  PUBLIC_OG_BACKGROUND: runtimeEnv.PUBLIC_OG_BACKGROUND,
  PUBLIC_OG_FOREGROUND: runtimeEnv.PUBLIC_OG_FOREGROUND,
  PUBLIC_OG_ACCENT: runtimeEnv.PUBLIC_OG_ACCENT,
});

const normalizeBaseUrl = (maybeUrl: string) => {
  const normalized = new URL(maybeUrl);
  normalized.pathname = "/";
  const result = normalized.toString();
  return result.endsWith("/") ? result.slice(0, -1) : result;
};

const resolvedBaseUrl = (() => {
  const provided = env.PUBLIC_SITE_URL ?? rawConfig.site.baseUrl;
  try {
    return normalizeBaseUrl(provided);
  } catch (error) {
    throw new Error(`Invalid site base URL provided: ${provided}`);
  }
})();

const resolvePagefindEnabled = () => {
  if (typeof env.PUBLIC_ENABLE_PAGEFIND === "boolean") {
    return env.PUBLIC_ENABLE_PAGEFIND;
  }
  return defaultProdFlag;
};

const pagefind: PagefindConfig = {
  enabled: resolvePagefindEnabled(),
  minItems: env.PUBLIC_PAGEFIND_MIN_ITEMS ?? 1,
  assetPath: "/pagefind",
  translations: {
    placeholder: env.PUBLIC_PAGEFIND_PLACEHOLDER ?? "Search posts",
  },
};

const hasGiscusConfig = Boolean(
  env.PUBLIC_GISCUS_REPO &&
    env.PUBLIC_GISCUS_REPO_ID &&
    env.PUBLIC_GISCUS_CATEGORY &&
    env.PUBLIC_GISCUS_CATEGORY_ID,
);

const giscus: GiscusConfig = {
  enabled: Boolean(env.PUBLIC_ENABLE_GISCUS && hasGiscusConfig),
  repo: env.PUBLIC_GISCUS_REPO,
  repoId: env.PUBLIC_GISCUS_REPO_ID,
  category: env.PUBLIC_GISCUS_CATEGORY,
  categoryId: env.PUBLIC_GISCUS_CATEGORY_ID,
  mapping: "pathname",
  reactionsEnabled: "1",
  emitMetadata: "0",
  theme: "preferred_color_scheme",
  lang: "en",
};

const ogImage: OgImageConfig = {
  background: env.PUBLIC_OG_BACKGROUND ?? rawConfig.branding.ogBackground,
  foreground: env.PUBLIC_OG_FOREGROUND ?? rawConfig.branding.ogForeground,
  accent: env.PUBLIC_OG_ACCENT ?? rawConfig.branding.accentColor,
  fallbackTitle: rawConfig.site.name,
};

export const siteConfig: SiteConfig = {
  site: {
    ...rawConfig.site,
    baseUrl: resolvedBaseUrl,
  },
  branding: rawConfig.branding,
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

export const _testExports = {
  env,
};
