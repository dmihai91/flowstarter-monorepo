import type { Json } from './database.types';

export const COMMERCE_PRODUCT_KIND = [
  'digital',
  'physical',
  'service',
  'subscription',
] as const;

export const COMMERCE_PRODUCT_STATUSES = [
  'draft',
  'active',
  'archived',
] as const;

export const COMMERCE_FULFILLMENT_TYPES = [
  'download',
  'license_key',
  'course_access',
  'manual',
  'ship',
  'pickup',
  'dropship',
  'print_on_demand',
] as const;

export const COMMERCE_INVENTORY_POLICIES = [
  'not_tracked',
  'track',
  'preorder',
] as const;

export type CommerceProductKind = (typeof COMMERCE_PRODUCT_KIND)[number];
export type CommerceProductStatus = (typeof COMMERCE_PRODUCT_STATUSES)[number];
export type CommerceFulfillmentType =
  (typeof COMMERCE_FULFILLMENT_TYPES)[number];
export type CommerceInventoryPolicy =
  (typeof COMMERCE_INVENTORY_POLICIES)[number];

export type CommerceProductInput = {
  name?: unknown;
  slug?: unknown;
  product_type?: unknown;
  status?: unknown;
  short_description?: unknown;
  price_amount?: unknown;
  currency?: unknown;
  provider_product_id?: unknown;
  provider_price_id?: unknown;
  checkout_url?: unknown;
  delivery_url?: unknown;
  fulfillment_type?: unknown;
  inventory_policy?: unknown;
  inventory_quantity?: unknown;
  weight_grams?: unknown;
  metadata?: unknown;
};

export type CommerceProductRecord = {
  name: string;
  slug: string | null;
  product_type: CommerceProductKind;
  status: CommerceProductStatus;
  short_description: string | null;
  price_amount: number | null;
  currency: string;
  provider_product_id: string | null;
  provider_price_id: string | null;
  checkout_url: string | null;
  delivery_url: string | null;
  fulfillment_type: CommerceFulfillmentType | null;
  inventory_policy: CommerceInventoryPolicy;
  inventory_quantity: number | null;
  weight_grams: number | null;
  metadata: Json;
};

export type ValidationError = { field: string; message: string };

export function slugifyProductName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
}

function trimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function trimmedRequired(value: unknown, max = 200): string | null {
  const trimmed = trimmedString(value);
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function nonNegativeInt(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

function safeUrl(value: unknown): string | null {
  const str = trimmedString(value);
  if (!str) return null;
  try {
    const u = new URL(str);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

function inEnum<T extends readonly string[]>(
  value: unknown,
  allowed: T
): T[number] | null {
  if (typeof value !== 'string') return null;
  return allowed.includes(value as T[number]) ? (value as T[number]) : null;
}

function safeJsonObject(value: unknown): Json {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Json;
}

function normalizeCurrency(value: unknown): string {
  if (typeof value !== 'string') return 'EUR';
  const trimmed = value.trim().toUpperCase();
  if (trimmed.length !== 3 || !/^[A-Z]{3}$/.test(trimmed)) return 'EUR';
  return trimmed;
}

export function validateCommerceProductInput(
  input: CommerceProductInput,
  options?: { partial?: false }
):
  | { ok: true; record: CommerceProductRecord }
  | { ok: false; errors: ValidationError[] };
export function validateCommerceProductInput(
  input: CommerceProductInput,
  options: { partial: true }
):
  | { ok: true; record: Partial<CommerceProductRecord> }
  | { ok: false; errors: ValidationError[] };
export function validateCommerceProductInput(
  input: CommerceProductInput,
  options: { partial?: boolean } = {}
):
  | { ok: true; record: Partial<CommerceProductRecord> }
  | { ok: false; errors: ValidationError[] } {
  const partial = options.partial === true;
  const errors: ValidationError[] = [];
  const record: Partial<CommerceProductRecord> = {};

  if (input.name !== undefined) {
    const name = trimmedRequired(input.name, 200);
    if (!name) {
      errors.push({ field: 'name', message: 'Name is required' });
    } else {
      record.name = name;
    }
  } else if (!partial) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  if (input.slug !== undefined) {
    const slug = trimmedString(input.slug);
    record.slug = slug ? slugifyProductName(slug) : null;
  } else if (!partial && record.name) {
    record.slug = slugifyProductName(record.name);
  }

  if (input.product_type !== undefined) {
    const kind = inEnum(input.product_type, COMMERCE_PRODUCT_KIND);
    if (!kind) {
      errors.push({ field: 'product_type', message: 'Invalid product_type' });
    } else {
      record.product_type = kind;
    }
  } else if (!partial) {
    record.product_type = 'digital';
  }

  if (input.status !== undefined) {
    const status = inEnum(input.status, COMMERCE_PRODUCT_STATUSES);
    if (!status) {
      errors.push({ field: 'status', message: 'Invalid status' });
    } else {
      record.status = status;
    }
  } else if (!partial) {
    record.status = 'draft';
  }

  if (input.short_description !== undefined) {
    const desc = trimmedString(input.short_description);
    record.short_description = desc ? desc.slice(0, 500) : null;
  }

  if (input.price_amount !== undefined) {
    record.price_amount = nonNegativeInt(input.price_amount);
  }

  if (input.currency !== undefined) {
    record.currency = normalizeCurrency(input.currency);
  } else if (!partial) {
    record.currency = 'EUR';
  }

  if (input.provider_product_id !== undefined) {
    record.provider_product_id = trimmedString(input.provider_product_id);
  }
  if (input.provider_price_id !== undefined) {
    record.provider_price_id = trimmedString(input.provider_price_id);
  }
  if (input.checkout_url !== undefined) {
    record.checkout_url = safeUrl(input.checkout_url);
    if (input.checkout_url && record.checkout_url === null) {
      errors.push({ field: 'checkout_url', message: 'Invalid URL' });
    }
  }
  if (input.delivery_url !== undefined) {
    record.delivery_url = safeUrl(input.delivery_url);
    if (input.delivery_url && record.delivery_url === null) {
      errors.push({ field: 'delivery_url', message: 'Invalid URL' });
    }
  }

  if (input.fulfillment_type !== undefined) {
    if (input.fulfillment_type === null || input.fulfillment_type === '') {
      record.fulfillment_type = null;
    } else {
      const fulfillment = inEnum(
        input.fulfillment_type,
        COMMERCE_FULFILLMENT_TYPES
      );
      if (!fulfillment) {
        errors.push({
          field: 'fulfillment_type',
          message: 'Invalid fulfillment_type',
        });
      } else {
        record.fulfillment_type = fulfillment;
      }
    }
  }

  if (input.inventory_policy !== undefined) {
    const policy = inEnum(input.inventory_policy, COMMERCE_INVENTORY_POLICIES);
    if (!policy) {
      errors.push({
        field: 'inventory_policy',
        message: 'Invalid inventory_policy',
      });
    } else {
      record.inventory_policy = policy;
    }
  } else if (!partial) {
    record.inventory_policy = 'not_tracked';
  }

  if (input.inventory_quantity !== undefined) {
    record.inventory_quantity = nonNegativeInt(input.inventory_quantity);
  }
  if (input.weight_grams !== undefined) {
    record.weight_grams = nonNegativeInt(input.weight_grams);
  }
  if (input.metadata !== undefined) {
    record.metadata = safeJsonObject(input.metadata);
  } else if (!partial) {
    record.metadata = {};
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, record };
}
