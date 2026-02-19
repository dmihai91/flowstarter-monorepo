import en from '@/locales/en';

type En = typeof en;
export type TranslationKeys = keyof En;

// Extract placeholder names inside {curly} braces from a template string
type ExtractParams<S extends string> =
  S extends `${string}{${infer P}}${infer R}` ? P | ExtractParams<R> : never;
type ParamsFor<K extends TranslationKeys> = ExtractParams<En[K]>;
export type VarsFor<K extends TranslationKeys> = [ParamsFor<K>] extends [never]
  ? undefined
  : Partial<Record<ParamsFor<K>, string | number>>;

// Server-side translator (no hooks). Dynamically imports locale module.
export async function getServerT(locale: string) {
  try {
    const mod = await import(`@/locales/${locale}`);
    const messages = (mod.default || {}) as Record<TranslationKeys, string>;
    return <K extends TranslationKeys>(key: K, vars?: VarsFor<K>) => {
      let template = messages[key] ?? (key as string);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          template = template.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return template;
    };
  } catch {
    const messages = (await import('@/locales/en')).default as Record<
      TranslationKeys,
      string
    >;
    return <K extends TranslationKeys>(key: K, vars?: VarsFor<K>) => {
      let template = messages[key] ?? (key as string);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          template = template.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return template;
    };
  }
}
