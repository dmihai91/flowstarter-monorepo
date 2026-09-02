'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import type {
  GuidedPriceAmount,
  GuidedPriceCadence,
  GuidedRewriteDirection,
  GuidedRewriteTarget,
  GuidedTone,
  GuidedToneTarget,
  GuidedTranslationLanguage,
  GuidedTranslationTarget,
} from './useMockEditor';

type EditorTool = 'rewrite' | 'price' | 'tone' | 'translate';

interface MockEditorControlsProps {
  isTyping: boolean;
  handleGuidedRewrite: (
    target: GuidedRewriteTarget,
    direction: GuidedRewriteDirection
  ) => void;
  handleGuidedPrice: (
    amount: GuidedPriceAmount,
    cadence: GuidedPriceCadence,
    deliveryIncluded: boolean
  ) => void;
  handleGuidedTone: (target: GuidedToneTarget, tone: GuidedTone) => void;
  handleGuidedTranslation: (
    target: GuidedTranslationTarget,
    language: GuidedTranslationLanguage
  ) => void;
}

const labelClass =
  'grid gap-1 text-[0.6875rem] font-medium text-gray-500 dark:text-white/55';
const selectClass =
  'h-9 min-w-0 rounded-lg border border-gray-200 bg-white px-2.5 text-[0.8125rem] text-gray-700 outline-none focus:border-[var(--fs-accent)] focus:ring-2 focus:ring-[var(--fs-accent)]/15 dark:border-white/10 dark:bg-[#19191f] dark:text-white/80';
const applyClass =
  'mt-2.5 h-9 w-full rounded-lg bg-[var(--fs-accent)] px-4 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-[var(--fs-accent)]/90 disabled:opacity-50';

export function MockEditorControls({
  isTyping,
  handleGuidedRewrite,
  handleGuidedPrice,
  handleGuidedTone,
  handleGuidedTranslation,
}: MockEditorControlsProps) {
  const { t } = useI18n();
  const [activeTool, setActiveTool] = useState<EditorTool>('rewrite');
  const [rewriteTarget, setRewriteTarget] =
    useState<GuidedRewriteTarget>('cta');
  const [rewriteDirection, setRewriteDirection] =
    useState<GuidedRewriteDirection>('more-direct');
  const [priceAmount, setPriceAmount] = useState<GuidedPriceAmount>('24');
  const [priceCadence, setPriceCadence] =
    useState<GuidedPriceCadence>('two-weeks');
  const [deliveryIncluded, setDeliveryIncluded] = useState(true);
  const [toneTarget, setToneTarget] =
    useState<GuidedToneTarget>('introduction');
  const [tone, setTone] = useState<GuidedTone>('warm');
  const [translationTarget, setTranslationTarget] =
    useState<GuidedTranslationTarget>('service');
  const [translationLanguage, setTranslationLanguage] =
    useState<GuidedTranslationLanguage>('ro');

  const tools: Array<{ id: EditorTool; label: string }> = [
    { id: 'rewrite', label: t('mockEditor.tool.rewrite') },
    { id: 'price', label: t('mockEditor.tool.price') },
    { id: 'tone', label: t('mockEditor.tool.tone') },
    { id: 'translate', label: t('mockEditor.tool.translate') },
  ];

  return (
    <div className="@container mt-2.5 border-t border-gray-200/60 pt-2.5 dark:border-white/10">
      <div
        className="flex flex-wrap gap-1"
        aria-label={t('mockEditor.tools')}
      >
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            disabled={isTyping}
            aria-pressed={activeTool === tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`min-h-8 shrink-0 rounded-lg px-2.5 text-[0.6875rem] font-semibold transition-colors disabled:opacity-50 sm:text-[0.75rem] ${
              activeTool === tool.id
                ? 'bg-[var(--fs-accent)] text-white'
                : 'border border-gray-200/70 bg-white/65 text-gray-600 hover:border-[var(--fs-accent)]/35 hover:text-[var(--fs-accent)] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60'
            }`}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {activeTool === 'rewrite' && (
        <form
          className="mt-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            handleGuidedRewrite(rewriteTarget, rewriteDirection);
          }}
        >
          <div className="grid grid-cols-1 gap-2 @[22rem]:grid-cols-2">
            <label className={labelClass}>
              {t('mockEditor.rewrite.what')}
              <select
                aria-label={t('mockEditor.rewrite.what')}
                value={rewriteTarget}
                onChange={(event) =>
                  setRewriteTarget(event.target.value as GuidedRewriteTarget)
                }
                className={selectClass}
              >
                <option value="headline">
                  {t('mockEditor.target.headline')}
                </option>
                <option value="introduction">
                  {t('mockEditor.target.introduction')}
                </option>
                <option value="cta">{t('mockEditor.target.cta')}</option>
              </select>
            </label>
            <label className={labelClass}>
              {t('mockEditor.rewrite.how')}
              <select
                aria-label={t('mockEditor.rewrite.how')}
                value={rewriteDirection}
                onChange={(event) =>
                  setRewriteDirection(
                    event.target.value as GuidedRewriteDirection
                  )
                }
                className={selectClass}
              >
                <option value="warmer">
                  {t('mockEditor.rewrite.direction.warmer')}
                </option>
                <option value="shorter">
                  {t('mockEditor.rewrite.direction.shorter')}
                </option>
                <option value="more-confident">
                  {t('mockEditor.rewrite.direction.moreConfident')}
                </option>
                <option value="more-direct">
                  {t('mockEditor.rewrite.direction.moreDirect')}
                </option>
              </select>
            </label>
          </div>
          <button type="submit" disabled={isTyping} className={applyClass}>
            {t('mockEditor.rewrite.apply')}
          </button>
        </form>
      )}

      {activeTool === 'price' && (
        <form
          className="mt-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            handleGuidedPrice(priceAmount, priceCadence, deliveryIncluded);
          }}
        >
          <div className="grid grid-cols-1 gap-2 @[22rem]:grid-cols-3">
            <label className={labelClass}>
              {t('mockEditor.price.amount')}
              <select
                aria-label={t('mockEditor.price.amount')}
                value={priceAmount}
                onChange={(event) =>
                  setPriceAmount(event.target.value as GuidedPriceAmount)
                }
                className={selectClass}
              >
                <option value="24">€24</option>
                <option value="29">€29</option>
                <option value="35">€35</option>
              </select>
            </label>
            <label className={labelClass}>
              {t('mockEditor.price.cadence')}
              <select
                aria-label={t('mockEditor.price.cadence')}
                value={priceCadence}
                onChange={(event) =>
                  setPriceCadence(event.target.value as GuidedPriceCadence)
                }
                className={selectClass}
              >
                <option value="two-weeks">
                  {t('mockEditor.price.cadence.twoWeeks')}
                </option>
                <option value="monthly">
                  {t('mockEditor.price.cadence.monthly')}
                </option>
              </select>
            </label>
            <label className={labelClass}>
              {t('mockEditor.price.delivery')}
              <select
                aria-label={t('mockEditor.price.delivery')}
                value={deliveryIncluded ? 'included' : 'separate'}
                onChange={(event) =>
                  setDeliveryIncluded(event.target.value === 'included')
                }
                className={selectClass}
              >
                <option value="included">
                  {t('mockEditor.price.delivery.included')}
                </option>
                <option value="separate">
                  {t('mockEditor.price.delivery.separate')}
                </option>
              </select>
            </label>
          </div>
          <button type="submit" disabled={isTyping} className={applyClass}>
            {t('mockEditor.price.apply')}
          </button>
        </form>
      )}

      {activeTool === 'tone' && (
        <form
          className="mt-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            handleGuidedTone(toneTarget, tone);
          }}
        >
          <div className="grid grid-cols-1 gap-2 @[22rem]:grid-cols-2">
            <label className={labelClass}>
              {t('mockEditor.tone.what')}
              <select
                aria-label={t('mockEditor.tone.what')}
                value={toneTarget}
                onChange={(event) =>
                  setToneTarget(event.target.value as GuidedToneTarget)
                }
                className={selectClass}
              >
                <option value="headline">
                  {t('mockEditor.target.headline')}
                </option>
                <option value="introduction">
                  {t('mockEditor.target.introduction')}
                </option>
                <option value="service">
                  {t('mockEditor.target.service')}
                </option>
              </select>
            </label>
            <label className={labelClass}>
              {t('mockEditor.tone.how')}
              <select
                aria-label={t('mockEditor.tone.how')}
                value={tone}
                onChange={(event) => setTone(event.target.value as GuidedTone)}
                className={selectClass}
              >
                <option value="warm">{t('mockEditor.tone.warm')}</option>
                <option value="calm">{t('mockEditor.tone.calm')}</option>
                <option value="playful">{t('mockEditor.tone.playful')}</option>
                <option value="expert">{t('mockEditor.tone.expert')}</option>
              </select>
            </label>
          </div>
          <button type="submit" disabled={isTyping} className={applyClass}>
            {t('mockEditor.tone.apply')}
          </button>
        </form>
      )}

      {activeTool === 'translate' && (
        <form
          className="mt-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            handleGuidedTranslation(translationTarget, translationLanguage);
          }}
        >
          <div className="grid grid-cols-1 gap-2 @[22rem]:grid-cols-2">
            <label className={labelClass}>
              {t('mockEditor.translate.what')}
              <select
                aria-label={t('mockEditor.translate.what')}
                value={translationTarget}
                onChange={(event) =>
                  setTranslationTarget(
                    event.target.value as GuidedTranslationTarget
                  )
                }
                className={selectClass}
              >
                <option value="headline">
                  {t('mockEditor.target.headline')}
                </option>
                <option value="introduction">
                  {t('mockEditor.target.introduction')}
                </option>
                <option value="service">
                  {t('mockEditor.target.service')}
                </option>
                <option value="cta">{t('mockEditor.target.cta')}</option>
              </select>
            </label>
            <label className={labelClass}>
              {t('mockEditor.translate.language')}
              <select
                aria-label={t('mockEditor.translate.language')}
                value={translationLanguage}
                onChange={(event) =>
                  setTranslationLanguage(
                    event.target.value as GuidedTranslationLanguage
                  )
                }
                className={selectClass}
              >
                <option value="ro">{t('mockEditor.translate.romanian')}</option>
                <option value="fr">{t('mockEditor.translate.french')}</option>
                <option value="es">{t('mockEditor.translate.spanish')}</option>
              </select>
            </label>
          </div>
          <button type="submit" disabled={isTyping} className={applyClass}>
            {t('mockEditor.translate.apply')}
          </button>
        </form>
      )}
    </div>
  );
}
