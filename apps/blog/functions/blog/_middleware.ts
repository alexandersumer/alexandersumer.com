import React from "react";
import vercelOGPagesPlugin from "@cloudflare/pages-plugin-vercel-og";
import { siteConfig } from "../../src/config/site";

const {
  branding: { ogBackground, ogForeground, accentColor },
  site: { name: siteName },
} = siteConfig;

const ogComponent: React.FC<{ ogTitle: string }> = ({ ogTitle }) =>
  React.createElement(
    "div",
    {
      style: {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: ogBackground,
        color: ogForeground,
        padding: "4rem",
        textAlign: "center",
        gap: "1.5rem",
      },
    },
    React.createElement(
      "span",
      {
        style: {
          fontSize: 24,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          opacity: 0.7,
        },
      },
      siteName,
    ),
    React.createElement(
      "span",
      {
        style: {
          fontSize: 64,
          fontWeight: 600,
          lineHeight: 1.1,
          maxWidth: "85%",
        },
      },
      ogTitle,
    ),
    React.createElement("span", {
      style: {
        width: 120,
        height: 4,
        background: accentColor,
        display: "inline-block",
      },
    }),
  );

export const onRequest = vercelOGPagesPlugin<{ ogTitle: string }>({
  imagePathSuffix: "/social-image.png",
  component: ogComponent,
  extractors: {
    on: {
      'meta[property="og:title"]': (props) => ({
        element(element) {
          props.ogTitle = element.getAttribute("content") || siteName;
        },
      }),
    },
  },
  autoInject: { openGraph: true },
});
