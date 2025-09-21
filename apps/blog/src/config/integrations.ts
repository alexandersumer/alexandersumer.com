import { siteConfig } from './site';

type Booleanish = boolean | 'true' | 'false' | '1' | '0' | undefined | null;

const toBoolean = (value: Booleanish, fallback = true): boolean => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalized = value.toLowerCase();
  if (['false', '0', 'off', 'no'].includes(normalized)) {
    return false;
  }
  if (['true', '1', 'on', 'yes'].includes(normalized)) {
    return true;
  }
  return fallback;
};

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

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
  mapping: 'pathname' | 'url' | 'title';
  reactionsEnabled: '0' | '1';
  emitMetadata: '0' | '1';
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

const pagefindDefaultEnabled = import.meta.env.PROD;

const pagefind: PagefindConfig = {
  enabled: toBoolean(import.meta.env.PUBLIC_ENABLE_PAGEFIND, pagefindDefaultEnabled),
  minItems: toNumber(import.meta.env.PUBLIC_PAGEFIND_MIN_ITEMS, 1),
  assetPath: '/pagefind',
  translations: {
    placeholder:
      import.meta.env.PUBLIC_PAGEFIND_PLACEHOLDER ?? 'Search posts',
  },
};

const giscusRepo = import.meta.env.PUBLIC_GISCUS_REPO;
const giscusRepoId = import.meta.env.PUBLIC_GISCUS_REPO_ID;
const giscusCategory = import.meta.env.PUBLIC_GISCUS_CATEGORY;
const giscusCategoryId = import.meta.env.PUBLIC_GISCUS_CATEGORY_ID;
const giscusExplicitFlag = import.meta.env.PUBLIC_ENABLE_GISCUS;

const giscus: GiscusConfig = {
  enabled:
    toBoolean(giscusExplicitFlag, false) &&
    Boolean(giscusRepo && giscusRepoId && giscusCategory && giscusCategoryId),
  repo: giscusRepo,
  repoId: giscusRepoId,
  category: giscusCategory,
  categoryId: giscusCategoryId,
  mapping: 'pathname',
  reactionsEnabled: '1',
  emitMetadata: '0',
  theme: 'preferred_color_scheme',
  lang: 'en',
};

const ogImage: OgImageConfig = {
  background: import.meta.env.PUBLIC_OG_BACKGROUND ?? siteConfig.branding.ogBackground,
  foreground: import.meta.env.PUBLIC_OG_FOREGROUND ?? siteConfig.branding.ogForeground,
  accent: import.meta.env.PUBLIC_OG_ACCENT ?? siteConfig.branding.accentColor,
  fallbackTitle: siteConfig.site.name,
};

export const integrations: IntegrationsConfig = {
  pagefind,
  giscus,
  ogImage,
};
