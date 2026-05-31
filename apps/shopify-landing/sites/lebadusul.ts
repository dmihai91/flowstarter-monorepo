import type { SiteConfig } from "../src/siteConfig";

/** Lebădușul — Romanian fishing-tackle storefront. The first Shopify operator
 *  landing built from this template. */
const config: SiteConfig = {
  brandName: "Flowstarter",
  workspaceSlug: "lebadusul",
  storeName: "Lebădușul",
  storeUrl: "https://lebadusularticoledepescuit.ro",
  storeHost: "lebadusularticoledepescuit.ro",
  kicker: { lead: "Articole de pescuit", tail: "Online store" },
  lede: "Your online store, run with Flowstarter.",
  sub: {
    before: "Your fishing-tackle shop at",
    after: "Make changes by chatting with your assistant, then publish when you're happy.",
  },
  badges: [
    { label: "Concierge included", accent: true },
    { label: "Since Apr 2026" },
  ],
  storefrontImage: "/assets/lebadusul.jpg",
  storefrontAlt: "Lebădușul storefront — your live fishing-tackle homepage",
  helpUrl: "https://flowstarter.net/contact",
  brandUrl: "https://flowstarter.net",
  brandHost: "flowstarter.net",
};

export default config;
