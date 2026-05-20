export const BRAND_ASSET_PATHS = {
  productionMacIconPng: "assets/prod/black-macos-1024.png",
  productionLinuxIconPng: "assets/prod/black-universal-1024.png",
  productionWindowsIconIco: "assets/prod/t3-black-windows.ico",
  productionWebFaviconIco: "assets/prod/t3-black-web-favicon.ico",
  productionWebFavicon16Png: "assets/prod/t3-black-web-favicon-16x16.png",
  productionWebFavicon32Png: "assets/prod/t3-black-web-favicon-32x32.png",
  productionWebAppleTouchIconPng: "assets/prod/t3-black-web-apple-touch-180.png",
  developmentWindowsIconIco: "assets/dev/blueprint-windows.ico",
  developmentWebFaviconIco: "assets/dev/blueprint-web-favicon.ico",
  developmentWebFavicon16Png: "assets/dev/blueprint-web-favicon-16x16.png",
  developmentWebFavicon32Png: "assets/dev/blueprint-web-favicon-32x32.png",
  developmentWebAppleTouchIconPng: "assets/dev/blueprint-web-apple-touch-180.png",
} as const;

export interface IconOverride {
  readonly sourceRelativePath: string;
  readonly targetRelativePath: string;
}

// Upstream T3 ships its own blueprint/dev + production icon sets at
// `<root>/assets/{dev,prod}/`, which the build subcommand copies over the
// freshly built web client. Flowstarter ships its own favicons via
// `apps/flowstarter-editor/web/public/` (vite emits them into web/dist
// directly), so we no longer override anything here. Re-add entries if a
// per-stage favicon swap is ever needed for our brand.
export const DEVELOPMENT_ICON_OVERRIDES: ReadonlyArray<IconOverride> = [];

export const PUBLISH_ICON_OVERRIDES: ReadonlyArray<IconOverride> = [];
