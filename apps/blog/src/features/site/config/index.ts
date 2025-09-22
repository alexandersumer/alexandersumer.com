import {
  PUBLIC_ENABLE_GISCUS,
  PUBLIC_ENABLE_PAGEFIND,
  PUBLIC_GISCUS_CATEGORY,
  PUBLIC_GISCUS_CATEGORY_ID,
  PUBLIC_GISCUS_REPO,
  PUBLIC_GISCUS_REPO_ID,
  PUBLIC_OG_ACCENT,
  PUBLIC_OG_BACKGROUND,
  PUBLIC_OG_FOREGROUND,
  PUBLIC_PAGEFIND_MIN_ITEMS,
  PUBLIC_PAGEFIND_PLACEHOLDER,
  PUBLIC_SITE_URL,
} from "astro:env/client";
import { createSiteRuntime } from "./runtime";

const runtime = createSiteRuntime(
  {
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
    PROD: import.meta.env.PROD,
  },
  { defaultProduction: import.meta.env.PROD },
);

export const {
  siteConfig,
  integrations,
  appConfig,
  absoluteUrl,
  canonicalHref,
  mailtoHref,
} = runtime;

export type {
  AppConfig,
  Branding,
  GiscusConfig,
  IntegrationsConfig,
  OgImageConfig,
  PagefindConfig,
  SiteConfig,
  SiteMetadata,
} from "./runtime";
