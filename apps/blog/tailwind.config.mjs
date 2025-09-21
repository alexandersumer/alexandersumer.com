/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,md,mdx,js,ts,jsx,tsx}",
    "./node_modules/pagefind/pagefind-ui.css",
  ],
  theme: {
    extend: {
      colors: {
        bg: "oklch(var(--bg))",
        fg: "oklch(var(--fg))",
        accent: "oklch(var(--accent))",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
