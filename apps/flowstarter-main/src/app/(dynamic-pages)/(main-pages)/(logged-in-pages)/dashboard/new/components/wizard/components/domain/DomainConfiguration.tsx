'use client';

import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PLATFORM_CONFIG } from '@/lib/const';
import { DomainValidator } from '@/lib/domain-validator';
import { useTranslations } from '@/lib/i18n';
import { useWizardStore } from '@/store/wizard-store';
import type { ProjectConfig } from '@/types/project-config';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DomainBuySection } from './DomainBuySection';
import { DomainOwnershipSelector } from './DomainOwnershipSelector';
import { DomainPreviewBanner } from './DomainPreviewBanner';

interface DomainConfigurationProps {
  projectConfig: ProjectConfig;
  onProjectConfigChangeAction: (config: ProjectConfig) => void;
}

export function DomainConfiguration({
  projectConfig,
  onProjectConfigChangeAction,
}: DomainConfigurationProps) {
  const { t } = useTranslations();
  const [validationResult, setValidationResult] = useState<ReturnType<
    typeof DomainValidator.validate
  > | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [domainOwnership, setDomainOwnership] = useState<
    'unknown' | 'owns' | 'wants-to-buy' | 'hosted'
  >('hosted');
  // Keep a local acknowledgement of the user's chosen custom domain
  const [confirmedCustomDomain, setConfirmedCustomDomain] = useState<
    string | null
  >(null);

  const [autoSuggestedHostedDomain, setAutoSuggestedHostedDomain] =
    useState<string>('');
  const [autoSuggestedCustomDomain, setAutoSuggestedCustomDomain] =
    useState<string>('');
  const [domainInputValue, setDomainInputValue] = useState<string>('');

  // Track the last auto-generated subdomain (without suffix) to avoid overriding manual edits
  const lastAutoSubdomainRef = useRef<string>('');
  // Track the last auto-generated custom domain to avoid overriding manual edits
  const lastAutoCustomDomainRef = useRef<string>('');
  const projectNameFromStore = useWizardStore((s) => s.projectConfig.name);

  // Prefer the passed-in projectConfig name so changes reflect immediately
  const effectiveProjectName = (
    projectNameFromStore ||
    projectConfig.name ||
    ''
  ).trim();

  // Persist the currently entered/checked custom domain into the project config
  const confirmCustomDomain = () => {
    const typed = (domainInputValue || '').trim().toLowerCase();
    const nextDomain = typed || projectConfig.domainConfig.domain || '';
    if (!nextDomain) return;
    onProjectConfigChangeAction({
      ...projectConfig,
      domainConfig: {
        ...projectConfig.domainConfig,
        domainType: 'custom',
        domain: nextDomain,
      },
    });
    // Clear validation banner state; user has explicitly confirmed intent
    setShowValidation(false);
    setConfirmedCustomDomain(nextDomain);
    // If the confirmed domain equals the current auto-suggestion, treat it as auto-suggested for future updates
    if (nextDomain === autoSuggestedCustomDomain) {
      lastAutoCustomDomainRef.current = nextDomain;
    }
  };

  // Utility function to convert project name to domain-friendly format
  const projectNameToDomain = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .slice(0, 50); // Limit length
  };

  // Auto-complete domain based on project name (debounced to wait until user pauses typing)
  useEffect(() => {
    const name = effectiveProjectName;
    if (!name) return;

    // Build suggestions using the entire project name
    const hostedSuggestion = projectNameToDomain(name) + '.flowstarter.io';
    const customSuggestion = projectNameToDomain(name) + '.com';

    setAutoSuggestedHostedDomain(hostedSuggestion);
    setAutoSuggestedCustomDomain(customSuggestion);

    const timeoutId = setTimeout(() => {
      // Always sync hosted subdomain with project name while in hosted mode
      if (projectConfig.domainConfig.domainType === 'hosted') {
        const currentDomain = projectConfig.domainConfig.domain || '';
        const nextSubdomain = hostedSuggestion.replace(
          PLATFORM_CONFIG.SUBDOMAIN_SUFFIX,
          ''
        );

        if (currentDomain !== hostedSuggestion) {
          onProjectConfigChangeAction({
            ...projectConfig,
            domainConfig: {
              ...projectConfig.domainConfig,
              domain: hostedSuggestion,
            },
          });
          lastAutoSubdomainRef.current = nextSubdomain;
        }
      }

      // Only auto-update custom domain when the user previously selected the suggested domain.
      // If the user typed a custom domain, do NOT override it on name changes.
      if (projectConfig.domainConfig.domainType === 'custom') {
        const currentCustom = projectConfig.domainConfig.domain || '';
        const projectName = projectConfig.name || '';
        const newCustomDomain = projectNameToDomain(projectName) + '.com';

        const hasAutoSelectedBefore =
          Boolean(lastAutoCustomDomainRef.current) &&
          currentCustom === lastAutoCustomDomainRef.current;

        if (hasAutoSelectedBefore && currentCustom !== newCustomDomain) {
          onProjectConfigChangeAction({
            ...projectConfig,
            domainConfig: {
              ...projectConfig.domainConfig,
              domain: newCustomDomain,
            },
          });
          lastAutoCustomDomainRef.current = newCustomDomain;
        }
      }

      // Domain suggestions handled by DomainBuySection via React Query
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [
    effectiveProjectName,
    projectConfig.domainConfig.domainType,
    domainOwnership,
    confirmedCustomDomain,
  ]);

  // Validate custom domain in real-time
  useEffect(() => {
    if (
      projectConfig.domainConfig.domainType === 'custom' &&
      projectConfig.domainConfig.domain
    ) {
      const current = projectConfig.domainConfig.domain;
      // Do not allow platform subdomains to be used as custom domains
      if (current.endsWith(PLATFORM_CONFIG.SUBDOMAIN_SUFFIX)) {
        setValidationResult({
          isValid: false,
          error: `Enter a real custom domain (not ${PLATFORM_CONFIG.SUBDOMAIN_SUFFIX})`,
        });
        setShowValidation(true);
        return;
      }

      const result = DomainValidator.validate(current);
      setValidationResult(result);
      setShowValidation(true);
    } else {
      setValidationResult(null);
      setShowValidation(false);
    }
  }, [
    projectConfig.domainConfig.domain,
    projectConfig.domainConfig.domainType,
  ]);

  // Keep local input state in sync with project config/domain type
  useEffect(() => {
    if (
      projectConfig.domainConfig.domainType === 'hosted' &&
      projectConfig.domainConfig.domain
    ) {
      setDomainInputValue(
        projectConfig.domainConfig.domain.replace(
          PLATFORM_CONFIG.SUBDOMAIN_SUFFIX,
          ''
        )
      );
    } else {
      setDomainInputValue(projectConfig.domainConfig.domain || '');
    }
  }, [
    projectConfig.domainConfig.domain,
    projectConfig.domainConfig.domainType,
  ]);

  // Handle domain ownership selection
  const handleDomainOwnershipChange = (
    ownership: 'owns' | 'wants-to-buy' | 'hosted'
  ) => {
    setDomainOwnership(ownership);
    if (ownership === 'owns') {
      onProjectConfigChangeAction({
        ...projectConfig,
        domainConfig: {
          ...projectConfig.domainConfig,
          domainType: 'custom',
          domain: '',
        },
      });
    } else if (ownership === 'hosted') {
      onProjectConfigChangeAction({
        ...projectConfig,
        domainConfig: {
          ...projectConfig.domainConfig,
          domainType: 'hosted',
          domain: '',
        },
      });
    }
    setConfirmedCustomDomain(null);
  };
  // Domain type changes are handled via ownership selection only

  const handleDomainChange = (value: string) => {
    let formattedDomain = '';

    if (projectConfig.domainConfig.domainType === 'hosted') {
      // For hosted domains, combine subdomain with platform suffix
      formattedDomain = value
        ? `${value.toLowerCase().replace(/[^a-z0-9-]/g, '')}${
            PLATFORM_CONFIG.SUBDOMAIN_SUFFIX
          }`
        : '';
    } else {
      // For custom domains, store as entered (validation is handled separately).
      // Ensure we consider full project name semantics: collapse multiple spaces/hyphens and trim.
      formattedDomain = value
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }

    onProjectConfigChangeAction({
      ...projectConfig,
      domainConfig: {
        ...projectConfig.domainConfig,
        domain: formattedDomain,
      },
    });
  };

  // Note: Do not auto-fill custom domains when selecting "My Custom Domain".
  // We only show the suggestion as a placeholder/button, leaving the field empty until the user opts in.

  const showPreviewBanner =
    domainOwnership !== 'unknown' &&
    domainOwnership !== 'wants-to-buy' &&
    projectConfig.domainConfig.domain;

  // Dynamic section title based on chosen ownership path
  const sectionTitle =
    domainOwnership === 'owns'
      ? t('domain.custom')
      : domainOwnership === 'hosted'
      ? t('domain.hosted')
      : t('domain.buy.available');

  return (
    <div className="bg-ui-bg-overlay border-[1.5px] border-ui-border-base border-solid rounded-[16px] shadow-xl">
      <CardHeader className="px-[24px] py-[16px] pb-[12px]">
        <div className="flex items-center gap-[20px]">
          <div className="w-[64px] h-[64px] rounded-[12px] bg-ui-bg-overlay-hover border-[1.5px] border-ui-border-base flex items-center justify-center">
            <Globe className="h-[32px] w-[32px] text-ui-accent-green" />
          </div>
          <div>
            <CardTitle className="text-[1.125rem] font-medium leading-[normal] text-ui-text-primary">
              {t('domain.config.title')}
            </CardTitle>
            <p className="text-[1rem] font-normal leading-[24px] text-ui-text-secondary mt-[12px]">
              {t('domain.config.subtitle')}
            </p>
            <p className="text-[1rem] font-normal leading-[24px] text-ui-text-secondary mt-[12px]">
              {t('domain.config.subtitle2')}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-[24px] py-[16px] pt-[8px] space-y-4">
        <div className="space-y-6">
          <AnimatePresence mode="wait" initial={false}>
            {domainOwnership === 'unknown' && (
              <motion.div
                key="ownership-unknown"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <DomainOwnershipSelector
                  disabled={!effectiveProjectName}
                  onSelectAction={handleDomainOwnershipChange}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            {domainOwnership !== 'unknown' && (
              <motion.div
                key={`ownership-header-${domainOwnership}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-[1.125rem] font-medium leading-[normal] text-ui-text-primary">
                    {sectionTitle}
                  </Label>
                  <button
                    onClick={() => {
                      setDomainOwnership('unknown');
                      // Clear any previous confirmation when switching paths
                      setConfirmedCustomDomain(null);
                    }}
                    disabled={!projectConfig.name.trim()}
                    className="border-[1.5px] border-ui-border-base border-solid rounded-[12px] px-[12px] py-[11px] flex gap-[6px] items-center text-[1rem] font-medium leading-[17px] text-ui-text-primary hover:bg-ui-bg-overlay-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('domain.config.changeSelection')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            {domainOwnership === 'wants-to-buy' && (
              <motion.div
                key="ownership-buy"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <DomainBuySection
                  baseName={projectNameToDomain(effectiveProjectName)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Domain Input Section */}
          <AnimatePresence mode="wait" initial={false}>
            {(domainOwnership === 'owns' || domainOwnership === 'hosted') && (
              <motion.div
                key={`ownership-input-${projectConfig.domainConfig.domainType}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="space-y-6"
              >
                {projectConfig.domainConfig.domainType === 'hosted' ? (
                  <>
                    <p className="text-[1rem] font-normal leading-[24px] text-ui-text-secondary">
                      {t('domain.config.subtitle3')}
                    </p>
                    <div className="mt-[8px] px-[12px] py-[11px] rounded-[12px] border-[1.5px] border-ui-border-base bg-ui-bg-overlay-hover text-ui-text-secondary text-[1rem] font-normal leading-[24px] max-w-[600px]">
                      {t('domain.config.hintChangeToCustomOrBuy')}
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 flex items-center">
                        <Input
                          value={domainInputValue}
                          onChange={(e) => setDomainInputValue(e.target.value)}
                          placeholder={
                            autoSuggestedHostedDomain
                              ? autoSuggestedHostedDomain.replace(
                                  PLATFORM_CONFIG.SUBDOMAIN_SUFFIX,
                                  ''
                                )
                              : t('domain.config.subdomain')
                          }
                          className="h-[44px] text-md font-normal bg-ui-bg-input border-[1.5px] border-ui-border-base border-solid focus:border-ui-border-focus focus:ring-2 focus:ring-ui-border-focus/20 text-ui-text-primary placeholder:text-ui-text-placeholder rounded-l-[12px] rounded-r-none border-r-0 transition-all"
                        />
                        <div className="h-[44px] px-1 bg-ui-bg-overlay-hover border-[1.5px] border-l-0 border-ui-border-base rounded-r-[12px] flex items-center text-[1rem] font-medium text-ui-text-secondary whitespace-nowrap">
                          {PLATFORM_CONFIG.SUBDOMAIN_SUFFIX}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-6">
                      <p className="text-md font-normal leading-[24px] text-ui-text-secondary">
                        {t('domain.config.subtitle4')}
                      </p>
                      <div className="flex items-center gap-[12px]">
                        {projectConfig.name &&
                          !projectConfig.domainConfig.domain &&
                          autoSuggestedCustomDomain && (
                            <button
                              onClick={() => {
                                onProjectConfigChangeAction({
                                  ...projectConfig,
                                  domainConfig: {
                                    ...projectConfig.domainConfig,
                                    domain: autoSuggestedCustomDomain,
                                  },
                                });
                                // Mark that the user intentionally selected the suggestion
                                lastAutoCustomDomainRef.current =
                                  autoSuggestedCustomDomain;
                              }}
                              className="text-[0.75rem] font-medium px-[12px] py-[5px] rounded-[32px] bg-ui-accent-purple-bg text-ui-accent-purple-light border border-ui-accent-purple-light/30 hover:bg-ui-accent-purple-bg/50 transition-all duration-200"
                            >
                              {t('domain.customOption.useSuggested')} "
                              {autoSuggestedCustomDomain}"
                            </button>
                          )}
                      </div>
                    </div>
                    <div className="flex items-center gap-[12px] flex-col md:flex-row">
                      <div className="relative flex-1">
                        <Input
                          value={domainInputValue}
                          onChange={(e) => setDomainInputValue(e.target.value)}
                          placeholder={
                            projectConfig.name
                              ? `${projectNameToDomain(projectConfig.name)}.com`
                              : 'yourbusiness.com'
                          }
                          className={`h-[44px] pr-[28px] text-[1rem] font-normal bg-ui-bg-input border-[1.5px] border-solid focus:ring-2 transition-all duration-200 text-ui-text-primary placeholder:text-ui-text-placeholder rounded-[12px] ${
                            showValidation
                              ? validationResult?.isValid
                                ? 'border-status-success focus:border-status-success focus:ring-status-success/20'
                                : 'border-status-warning focus:border-status-warning focus:ring-status-warning/20'
                              : 'border-ui-border-base focus:border-ui-border-focus focus:ring-ui-border-focus/20'
                          }`}
                        />
                        {showValidation && (
                          <div className="absolute right-[12px] top-1/2 transform -translate-y-1/2">
                            {validationResult?.isValid ? (
                              <span className="text-status-success text-[1.125rem]">
                                ✓
                              </span>
                            ) : (
                              <span className="text-status-warning text-[1.125rem]">
                                ⚠
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={confirmCustomDomain}
                        disabled={
                          !DomainValidator.validateQuick(
                            domainInputValue.trim().toLowerCase()
                          )
                        }
                        className="bg-ui-text-primary rounded-[100px] px-[8px] py-[10px] h-[44px] flex items-center justify-center gap-[8px] text-ui-text-dark text-[1rem] font-medium leading-[17px] hover:bg-ui-text-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('domain.continueWithThisDomain')}
                      </button>
                    </div>

                    {/* Auto-suggestion feedback as a badge */}
                    {autoSuggestedCustomDomain &&
                      projectConfig.domainConfig.domain ===
                        autoSuggestedCustomDomain &&
                      projectConfig.name && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 w-fit">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          <span className="text-xs">
                            {t('domain.autoSuggested', {
                              name: projectConfig.name,
                            })}
                          </span>
                        </div>
                      )}

                    {/* Validation errors with inline suggestion pills */}
                    {showValidation && !validationResult?.isValid && (
                      <div className="p-4 bg-red-50/80 dark:bg-red-900/20 rounded-xl border border-red-200/40 dark:border-red-700/40 space-y-3">
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {validationResult?.error ||
                            t('domain.validation.invalid')}
                        </p>
                        {validationResult?.suggestions &&
                          validationResult.suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {validationResult.suggestions
                                .slice(0, 5)
                                .map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => handleDomainChange(s)}
                                    className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-700 dark:text-blue-300 rounded-full transition-colors cursor-pointer"
                                  >
                                    {s}
                                  </button>
                                ))}
                            </div>
                          )}
                      </div>
                    )}

                    {/* Confirmation banner (no availability check) */}
                    {confirmedCustomDomain && (
                      <div className="p-5 rounded-xl border bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700">
                        <div className="text-blue-800 dark:text-blue-200 font-medium text-sm">
                          {confirmedCustomDomain} is set as your custom domain.
                          You can verify ownership after launch.
                        </div>
                      </div>
                    )}

                    {/* Validation Feedback - Only show if no availability result */}
                    {showValidation && (
                      <div className="space-y-3">
                        {validationResult?.isValid ? (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <span className="text-green-500">✓</span>
                            <span className="text-sm font-medium">
                              {t('domain.validation.valid')}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                              <span className="text-red-500">⚠</span>
                              <span className="text-sm font-medium">
                                {validationResult?.error ||
                                  t('domain.validation.invalid')}
                              </span>
                            </div>
                            {validationResult?.suggestions &&
                              validationResult.suggestions.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t('domain.validation.didYouMean')}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {validationResult.suggestions.map(
                                      (suggestion) => (
                                        <button
                                          key={suggestion}
                                          type="button"
                                          onClick={() =>
                                            handleDomainChange(suggestion)
                                          }
                                          className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-700 dark:text-blue-300 rounded-md transition-colors cursor-pointer"
                                        >
                                          {suggestion}
                                        </button>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {t('domain.customOption.helpIntro')}{' '}
                      {domainOwnership === 'owns'
                        ? t('domain.customOption.helpOwns')
                        : t('domain.customOption.helpWantsToBuy')}
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Domain Preview */}
          <AnimatePresence initial={false}>
            {showPreviewBanner && (
              <motion.div
                key="domain-preview"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <DomainPreviewBanner
                  domainType={projectConfig.domainConfig.domainType}
                  domain={projectConfig.domainConfig.domain}
                  projectName={projectNameToDomain(effectiveProjectName)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </div>
  );
}
