import { createSiteRuntime } from "./runtime";

const runtime = createSiteRuntime(process.env, {
  defaultProduction: process.env.NODE_ENV === "production",
});

export const {
  siteConfig,
  integrations,
  appConfig,
  absoluteUrl,
  canonicalHref,
  mailtoHref,
} = runtime;
