/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_ENABLE_PAGEFIND?: string;
  readonly PUBLIC_PAGEFIND_MIN_ITEMS?: string;
  readonly PUBLIC_PAGEFIND_PLACEHOLDER?: string;
  readonly PUBLIC_ENABLE_GISCUS?: string;
  readonly PUBLIC_GISCUS_REPO?: string;
  readonly PUBLIC_GISCUS_REPO_ID?: string;
  readonly PUBLIC_GISCUS_CATEGORY?: string;
  readonly PUBLIC_GISCUS_CATEGORY_ID?: string;
  readonly PUBLIC_OG_BACKGROUND?: string;
  readonly PUBLIC_OG_FOREGROUND?: string;
  readonly PUBLIC_OG_ACCENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
