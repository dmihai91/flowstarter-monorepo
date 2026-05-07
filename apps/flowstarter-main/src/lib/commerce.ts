import type { Json } from './database.types';

export const COMMERCE_MODES = [
  'none',
  'payment_link',
  'embedded_checkout',
  'digital_delivery',
  'external_storefront',
  'managed_storefront',
  'custom',
] as const;

export const COMMERCE_PRODUCT_TYPES = [
  'none',
  'digital',
  'physical',
  'mixed',
  'service',
] as const;

export const COMMERCE_PROVIDERS = [
  'none',
  'stripe',
  'gumroad',
  'lemon_squeezy',
  'paddle',
  'shopify',
  'woocommerce',
  'custom',
] as const;

export const COMMERCE_STATUSES = [
  'not_needed',
  'discovery',
  'configured',
  'live',
  'needs_custom_build',
] as const;

export type CommerceMode = (typeof COMMERCE_MODES)[number];
export type CommerceProductType = (typeof COMMERCE_PRODUCT_TYPES)[number];
export type CommerceProvider = (typeof COMMERCE_PROVIDERS)[number];
export type CommerceStatus = (typeof COMMERCE_STATUSES)[number];

export type CommercePlanInput = {
  mode?: unknown;
  productType?: unknown;
  provider?: unknown;
  status?: unknown;
  productCount?: unknown;
  requirements?: unknown;
  notes?: unknown;
};

export type CommercePlan = {
  commerce_mode: CommerceMode;
  commerce_product_type: CommerceProductType;
  commerce_provider: CommerceProvider;
  commerce_status: CommerceStatus;
  commerce_product_count: number;
  commerce_requirements: Json;
  commerce_notes: string | null;
};

function oneOf<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number]
): T[number] {
  if (typeof value !== 'string') return fallback;
  return allowed.includes(value as T[number]) ? (value as T[number]) : fallback;
}

function normalizedCount(value: unknown): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) return 0;
  return Math.floor(numberValue);
}

function safeJsonObject(value: unknown): Json {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Json;
}

function safeNotes(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 5000) : null;
}

export function normalizeCommercePlan(input?: CommercePlanInput): CommercePlan {
  const productType = oneOf(
    input?.productType,
    COMMERCE_PRODUCT_TYPES,
    'none'
  );
  const provider = oneOf(input?.provider, COMMERCE_PROVIDERS, 'none');
  const mode = oneOf(input?.mode, COMMERCE_MODES, 'none');
  const productCount = normalizedCount(input?.productCount);
  const statusFallback =
    mode === 'none' && productType === 'none' ? 'not_needed' : 'discovery';

  return {
    commerce_mode: mode,
    commerce_product_type: productType,
    commerce_provider: provider,
    commerce_status: oneOf(
      input?.status,
      COMMERCE_STATUSES,
      statusFallback
    ),
    commerce_product_count: productCount,
    commerce_requirements: safeJsonObject(input?.requirements),
    commerce_notes: safeNotes(input?.notes),
  };
}

export function inferCommercePlanFromText(text: string): CommercePlan {
  const lower = text.toLowerCase();
  const sells =
    /\b(ecommerce|e-commerce|shop|store|storefront|checkout|payment|sell|selling|product|products|course|ebook|digital download|merch|shipping|inventory)\b/.test(
      lower
    );

  if (!sells) return normalizeCommercePlan();

  const physical =
    /\b(physical|shipping|ship|inventory|stock|sku|variant|variants|merch|clothing|prints|warehouse|fulfillment|delivery)\b/.test(
      lower
    );
  const digital =
    /\b(digital|download|ebook|course|template|notion|pdf|license|software|membership|subscription)\b/.test(
      lower
    );

  if (physical && digital) {
    return normalizeCommercePlan({
      mode: 'external_storefront',
      productType: 'mixed',
      provider: 'shopify',
      status: 'discovery',
      productCount: 1,
    });
  }

  if (physical) {
    return normalizeCommercePlan({
      mode: 'external_storefront',
      productType: 'physical',
      provider: 'shopify',
      status: 'discovery',
      productCount: 1,
    });
  }

  if (digital) {
    return normalizeCommercePlan({
      mode: 'digital_delivery',
      productType: 'digital',
      provider: 'lemon_squeezy',
      status: 'discovery',
      productCount: 1,
    });
  }

  return normalizeCommercePlan({
    mode: 'payment_link',
    productType: 'service',
    provider: 'stripe',
    status: 'discovery',
    productCount: 1,
  });
}

export function describeCommerceProvider(provider: CommerceProvider): string {
  switch (provider) {
    case 'stripe':
      return 'Best default for simple payments, deposits, services, and small catalogs with Payment Links or Checkout.';
    case 'gumroad':
      return 'Fastest creator-style launch for simple digital products, but fees are higher at scale.';
    case 'lemon_squeezy':
      return 'Best lightweight merchant-of-record option for digital downloads, courses, software, and subscriptions.';
    case 'paddle':
      return 'Best merchant-of-record option for SaaS, software, licenses, and more complex global digital commerce.';
    case 'shopify':
      return 'Best for physical goods, inventory, shipping, variants, returns, POS, and multi-channel selling.';
    case 'woocommerce':
      return 'Useful only when the client already wants a WordPress commerce stack.';
    case 'custom':
      return 'Use for bespoke marketplace, membership, cart, fulfillment, or unusual checkout requirements.';
    case 'none':
    default:
      return 'No commerce setup needed.';
  }
}
