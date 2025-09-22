import { createSiteRuntime, type RuntimeEnvInput } from "./runtime";

const resolveRuntimeEnv = (): RuntimeEnvInput => {
  if (typeof process !== "undefined" && process?.env) {
    return process.env as unknown as RuntimeEnvInput;
  }

  const globalCandidate =
    (
      globalThis as {
        ENV?: unknown;
        env?: unknown;
      }
    )?.ENV ?? (globalThis as { ENV?: unknown; env?: unknown })?.env;

  if (globalCandidate && typeof globalCandidate === "object") {
    return globalCandidate as RuntimeEnvInput;
  }

  return {};
};

const runtimeEnv = resolveRuntimeEnv();

const runtime = createSiteRuntime(runtimeEnv);

export const {
  siteConfig,
  integrations,
  appConfig,
  absoluteUrl,
  canonicalHref,
  mailtoHref,
} = runtime;
