import site from '../../site.config.json';

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

export interface SiteConfig {
  site: SiteMetadata;
  branding: Branding;
}

const normalizeBaseUrl = (maybeUrl: string) => {
  try {
    const normalized = new URL(maybeUrl);
    normalized.pathname = '/';
    return normalized.toString().replace(/\/$/, '');
  } catch (error) {
    throw new Error(`Invalid PUBLIC_SITE_URL provided: ${maybeUrl}`);
  }
};

const envBaseUrl = import.meta.env.PUBLIC_SITE_URL;
const baseUrl = envBaseUrl ? normalizeBaseUrl(envBaseUrl) : site.site.baseUrl.replace(/\/$/, '');

export const siteConfig: SiteConfig = {
  site: {
    ...site.site,
    baseUrl,
  },
  branding: site.branding,
};

export const absoluteUrl = (pathOrUrl: string): string => {
  if (!pathOrUrl) {
    return siteConfig.site.baseUrl;
  }
  try {
    return new URL(pathOrUrl, siteConfig.site.baseUrl + '/').toString().replace(/\/$/, pathOrUrl.endsWith('/') ? '/' : '');
  } catch (error) {
    throw new Error(`Failed to construct absolute URL from: ${pathOrUrl}`);
  }
};

export const canonicalHref = (relativePath?: string): string | undefined => {
  if (!relativePath) {
    return undefined;
  }
  return absoluteUrl(relativePath.startsWith('/') ? relativePath : `/${relativePath}`);
};

export const mailtoHref = (): string => `mailto:${siteConfig.site.contactEmail}`;
