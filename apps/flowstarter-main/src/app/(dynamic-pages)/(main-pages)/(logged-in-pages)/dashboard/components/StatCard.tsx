'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { useTranslations } from '@/lib/i18n';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  FileText,
  LucideIcon,
} from 'lucide-react';
import NextImage from 'next/image';
import Link from 'next/link';
import React from 'react';

type Tone = 'blue' | 'green' | 'indigo' | 'purple';

const toneStyles: Record<
  Tone,
  {
    badgeBg: string;
    iconColor: string;
    chipBg: string;
    chipText: string;
    ctaBg: string;
  }
> = {
  blue: {
    badgeBg:
      'bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-sm border border-blue-500/20 dark:border-blue-400/20',
    iconColor: 'var(--blue)',
    chipBg: 'bg-blue-500/10 backdrop-blur-sm dark:bg-blue-500/15',
    chipText: 'text-blue-700 dark:text-blue-300',
    ctaBg: 'bg-blue-600/10 dark:bg-blue-500/15',
  },
  green: {
    badgeBg:
      'bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-sm border border-emerald-500/20 dark:border-emerald-400/20',
    iconColor: 'var(--green)',
    chipBg: 'bg-[var(--green)]/5 backdrop-blur-sm',
    chipText: 'text-emerald-700 dark:text-emerald-300',
    ctaBg: 'bg-[var(--green)]/5',
  },
  indigo: {
    badgeBg:
      'bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-sm border border-purple-500/20 dark:border-purple-400/20',
    iconColor: 'var(--purple)',
    chipBg: 'bg-[var(--purple)]/5 backdrop-blur-sm',
    chipText: 'text-violet-700 dark:text-violet-300',
    ctaBg: 'bg-[var(--purple)]/5',
  },
  purple: {
    badgeBg:
      'bg-gradient-to-br from-orange-500/10 to-amber-500/10 backdrop-blur-sm border border-orange-500/20 dark:border-orange-400/20',
    iconColor: 'var(--purple)',
    chipBg: 'bg-orange-500/10 backdrop-blur-sm dark:bg-orange-500/15',
    chipText: 'text-orange-700 dark:text-orange-300',
    ctaBg: 'bg-orange-600/10 dark:bg-orange-500/15',
  },
};

export function StatCard({
  title,
  icon: Icon,
  tone,
  locked,
  value,
  description,
  trend,
  cta,
  zeroState,
  avatar,
  detailsLink,
  lastProject,
}: {
  title: string;
  icon?: LucideIcon;
  tone: Tone;
  locked: boolean;
  value?: React.ReactNode;
  description?: React.ReactNode;
  trend?: React.ReactNode;
  cta?: string;
  zeroState?: React.ReactNode;
  avatar?: React.ReactNode;
  detailsLink?: string;
  lastProject?: {
    id: string;
    name: string;
    status: string;
    is_draft: boolean;
    updated_at: string;
    thumbnail_url?: string | null;
  } | null;
}) {
  const { t } = useTranslations();
  const styles = toneStyles[tone];
  return (
    <GlassCard className="gap-[20px]">
      <div className="flex items-center justify-between w-full">
        <div
          className="text-[14px] font-medium truncate"
          style={{
            color: 'var(--copy-labels)',
            lineHeight: '17px',
            paddingTop: '11px',
            paddingBottom: '11px',
          }}
        >
          {title}
        </div>
        <div className="flex items-center gap-[6px] shrink-0">
          {detailsLink && (
            <Link
              href={detailsLink}
              className="inline-flex items-center gap-[6px] rounded-[12px] transition-all bg-transparent cursor-pointer touch-manipulation hover:opacity-80 border-[1.5px] border-solid"
              style={{
                borderColor: 'var(--divider-border)',
                color: 'var(--copy-headlines)',
                padding: '11px 12px',
                fontSize: '14px',
                fontWeight: '500',
                lineHeight: '17px',
              }}
            >
              {t('dashboard.cards.details')}
              <ChevronRight
                className="h-3 w-3"
                style={{ width: '12px', height: '12px' }}
                strokeWidth={2}
              />
            </Link>
          )}
          {Icon ? (
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center transition-transform duration-300 sm:group-hover:scale-110 ${styles.badgeBg}`}
            >
              <Icon
                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                style={{ color: styles.iconColor }}
              />
            </div>
          ) : null}
        </div>
      </div>

      {locked ? (
        <div>
          <div
            className="text-[20px] font-semibold leading-normal mb-2"
            style={{ color: 'var(--copy-headlines)' }}
          >
            {cta}
          </div>
          <p
            className="text-[12px] mb-2 sm:mb-3 leading-relaxed"
            style={{ color: 'var(--copy-body)' }}
          >
            {cta}
          </p>
          <div
            className={`inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-sm sm:text-xs font-semibold text-white/90 dark:text-white ${styles.ctaBg}`}
          >
            {cta}
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full gap-[16px]">
          {avatar ? (
            <>
              <div className="flex items-center justify-center mb-2 sm:mb-3">
                <div className="shrink-0">{avatar}</div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div
                  className="text-[28px] font-semibold mb-3 sm:mb-4 tracking-tight text-center"
                  style={{ color: 'var(--colors-primary)' }}
                >
                  {value}
                </div>
              </div>
              <div className="mt-auto pt-2">
                <div
                  className="text-[16px] leading-relaxed"
                  style={{ color: 'var(--copy-body)' }}
                >
                  {description}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-[8px]">
                <div
                  className="text-[28px] font-semibold tracking-tight w-full whitespace-pre-wrap"
                  style={{ color: 'var(--colors-primary)' }}
                >
                  {value}
                </div>
                {description && typeof description === 'string' && (
                  <div
                    className="text-[14px]"
                    style={{ color: 'var(--copy-body)' }}
                  >
                    {description}
                  </div>
                )}
              </div>
              {description && typeof description !== 'string' && (
                <div
                  className="text-[16px] leading-normal"
                  style={{ color: 'var(--copy-body)' }}
                >
                  {description}
                </div>
              )}
            </>
          )}
          {zeroState && (
            <div
              className="text-[12px] bg-gray-100/80 dark:bg-[#3a3a42] border border-gray-200/60 dark:border-gray-600/50 rounded-md px-2.5 py-1 sm:py-1.5 mt-2 backdrop-blur-sm"
              style={{ color: 'var(--copy-body)' }}
            >
              {zeroState}
            </div>
          )}
          {trend && (
            <div
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-sm sm:text-xs font-medium ${styles.chipBg} ${styles.chipText} mt-2`}
            >
              {typeof trend === 'string' && trend.trim().startsWith('-') ? (
                <ArrowDownRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              ) : (
                <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              )}
              {trend}
            </div>
          )}
          {lastProject && (
            <>
              <div className="h-0 w-full relative">
                <div
                  className="absolute bottom-0 left-0 right-0 top-[-1px] h-px"
                  style={{ backgroundColor: 'var(--divider-border)' }}
                ></div>
              </div>
              <div className="flex gap-[12px] items-start w-full">
                <div className="flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative shrink-0">
                  <div
                    className="inline-flex items-center justify-center px-[12px] py-[5px] rounded-[32px] w-fit"
                    style={{ backgroundColor: 'var(--badge-draft-bg)' }}
                  >
                    <p
                      className="text-[12px] font-medium leading-[17px]"
                      style={{ color: 'var(--copy-headlines)' }}
                    >
                      {lastProject.is_draft
                        ? t('projects.status.draft')
                        : lastProject.status === 'completed'
                        ? t('projects.status.completed')
                        : lastProject.status === 'active'
                        ? t('projects.status.live')
                        : t('projects.status.draft')}
                    </p>
                  </div>
                  <div className="flex gap-[12px] items-center w-full">
                    <div className="flex flex-[1_0_0] flex-col gap-[8px] items-start justify-center min-h-px min-w-px relative shrink-0">
                      <p
                        className="text-[14px] font-medium leading-normal"
                        style={{ color: 'var(--colors-primary)' }}
                      >
                        {lastProject.name}
                      </p>
                      <p
                        className="text-[12px] font-normal leading-normal"
                        style={{ color: 'var(--copy-labels)' }}
                      >
                        <span className="font-medium">Last edit:</span>{' '}
                        <span style={{ color: 'var(--copy-body)' }}>
                          {formatTimeAgo(lastProject.updated_at)}
                        </span>
                      </p>
                    </div>
                    <div className="h-[62px] w-[83px] rounded-[8px] overflow-hidden shrink-0 relative flex items-center justify-center backdrop-blur-sm bg-white/20 dark:bg-[rgba(58,58,74,0.2)] border border-white/40 dark:border-white/10">
                      {lastProject.thumbnail_url ? (
                        <NextImage
                          src={lastProject.thumbnail_url}
                          alt={lastProject.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText
                          className="h-5 w-5 text-gray-500 dark:text-gray-400 opacity-60"
                          strokeWidth={1.5}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </GlassCard>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60)
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24)
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  return date.toLocaleDateString();
}

export default StatCard;
