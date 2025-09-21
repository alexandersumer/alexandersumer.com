import { useEffect } from "react";

type Props = {
  assetPath: string;
  placeholder: string;
  targetSelector?: string;
};

const DEFAULT_TARGET = "#pagefind-search";

const normalizePath = (path: string) => path.replace(/\/$/, "");

export default function PagefindSearchIsland({
  assetPath,
  placeholder,
  targetSelector = DEFAULT_TARGET,
}: Props) {
  useEffect(() => {
    const path = normalizePath(assetPath);

    const init = async () => {
      try {
        const module = await import(
          /* @vite-ignore */ `${path}/pagefind-ui.js`
        );
        const PagefindUI = module?.default;
        if (typeof PagefindUI !== "function") {
          throw new Error("PagefindUI is unavailable");
        }
        new PagefindUI({
          element: targetSelector,
          showImages: false,
          showSubResults: true,
          translations: { placeholder },
        });
      } catch (error) {
        console.error("Failed to initialise Pagefind search", error);
      }
    };

    init();
  }, [assetPath, placeholder, targetSelector]);

  return null;
}
