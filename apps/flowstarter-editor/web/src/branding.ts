export const APP_BASE_NAME = "Flowstarter Assistant";

/** Browser tab, static HTML, router head, and social metadata (no stage suffix). */
export const APP_SITE_TITLE = "Flowstarter Assistant";

export const APP_STAGE_LABEL = import.meta.env.DEV ? "Dev" : "";
export const APP_DISPLAY_NAME = APP_STAGE_LABEL
  ? `${APP_SITE_TITLE} (${APP_STAGE_LABEL})`
  : APP_SITE_TITLE;
export const APP_VERSION = import.meta.env.APP_VERSION || "0.0.0";
