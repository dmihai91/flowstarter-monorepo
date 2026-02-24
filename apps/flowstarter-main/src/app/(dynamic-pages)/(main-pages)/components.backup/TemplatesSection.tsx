'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useTranslations } from '@/lib/i18n';
import {
  Palette as ArtPalette,
  Briefcase as BriefcaseIcon,
  HeartPulse,
  ShoppingBag,
  Store,
  Utensils,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

type Template = {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
};

const FEATURED_TEMPLATES_BASE: Template[] = [
  {
    id: 'saas-product-pro',
    name: 'SaaS Product Pro',
    category: 'SaaS & Product',
    thumbnail: '/assets/template-thumbnails/saas-product-pro.png',
  },
  {
    id: 'personal-brand-pro',
    name: 'Personal Brand Pro',
    category: 'Personal Brand',
    thumbnail: '/assets/template-thumbnails/personal-brand-pro.png',
  },
  {
    id: 'local-business-pro',
    name: 'Local Business Pro',
    category: 'Local Business',
    thumbnail: '/assets/template-thumbnails/local-business-pro.png',
  },
];

export function TemplatesSection() {
  const { t } = useTranslations();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute theme-aware thumbnails
  const featuredTemplates = useMemo(() => {
    return FEATURED_TEMPLATES_BASE.map((template) => {
      if (!mounted) return template;
      // If dark mode and URL points to template-thumbnails, use -dark variant
      if (
        resolvedTheme === 'dark' &&
        template.thumbnail.includes('/template-thumbnails/')
      ) {
        return {
          ...template,
          thumbnail: template.thumbnail.replace('.png', '-dark.png'),
        };
      }
      return template;
    });
  }, [resolvedTheme, mounted]);

  const templateCategories = [
    {
      title: t('landing.templates.ecommerce.title'),
      description: t('landing.templates.ecommerce.description'),
      icon: (
        <ShoppingBag className="h-6 w-6" style={{ color: 'var(--purple)' }} />
      ),
    },
    {
      title: t('landing.templates.professionalServices.title'),
      description: t('landing.templates.professionalServices.description'),
      icon: (
        <BriefcaseIcon className="h-6 w-6" style={{ color: 'var(--purple)' }} />
      ),
    },
    {
      title: t('landing.templates.restaurants.title'),
      description: t('landing.templates.restaurants.description'),
      icon: <Utensils className="h-6 w-6" style={{ color: 'var(--purple)' }} />,
    },
    {
      title: t('landing.templates.healthWellness.title'),
      description: t('landing.templates.healthWellness.description'),
      icon: (
        <HeartPulse className="h-6 w-6" style={{ color: 'var(--purple)' }} />
      ),
    },
    {
      title: t('landing.templates.creativeStudios.title'),
      description: t('landing.templates.creativeStudios.description'),
      icon: (
        <ArtPalette className="h-6 w-6" style={{ color: 'var(--purple)' }} />
      ),
    },
    {
      title: t('landing.templates.localBusinesses.title'),
      description: t('landing.templates.localBusinesses.description'),
      icon: <Store className="h-6 w-6" style={{ color: 'var(--purple)' }} />,
    },
  ];

  return (
    <section
      id="templates"
      className="full-width-section py-16 md:py-24 lg:py-32 relative"
    >
      {/* Distinct glassmorphism background for Templates section */}
      <div className="absolute inset-0 backdrop-blur-xl bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)]" />
      <div className="absolute inset-0 border-t border-b border-white/40 dark:border-white/10" />
      {/* Subtle gradient overlay for distinction */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-purple-500/3 to-transparent pointer-events-none" />
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-400/10 to-purple-400/10 dark:from-indigo-600/5 dark:to-purple-600/5 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 left-1/3 w-96 h-96 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-400/10 dark:from-purple-600/5 dark:to-pink-600/5 blur-3xl animate-pulse"
          style={{ animationDelay: '2.5s', animationDuration: '4s' }}
        />
      </div>
      <div className="full-width-content relative z-10">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="space-y-4 max-w-[850px] mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl tablet:text-4xl md:text-5xl">
              {t('landing.templates.sectionTitle')}
            </h2>
            <p className="text-muted-foreground tablet:text-lg md:text-xl">
              {t('landing.templates.sectionSubtitle')}
            </p>
          </div>

          {/* Featured Templates */}
          <div className="w-full max-w-7xl mt-8 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredTemplates.map((template, idx) => (
                <div
                  key={template.id}
                  className="group relative overflow-hidden rounded-[16px] border border-white dark:border-white/40 backdrop-blur-xl shadow-xl bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)] transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
                  style={{
                    transitionDelay: `${idx * 100}ms`,
                  }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {mounted ? (
                      <Image
                        src={template.thumbnail}
                        alt={template.name}
                        fill
                        className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {template.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 tablet:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl">
            {templateCategories.map((category, idx) => (
              <div
                key={category.title}
                className="group flex flex-col space-y-4 rounded-[16px] p-6 transition-all duration-300 hover:scale-105 hover:-translate-y-1 active:scale-[0.98] backdrop-blur-xl border border-white dark:border-white/40 hover:border-indigo-400/50 dark:hover:border-indigo-400/30 text-left cursor-pointer bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)] shadow-lg hover:shadow-xl"
                style={{
                  transitionDelay: `${idx * 50}ms`,
                }}
              >
                <div
                  className="rounded-full p-3 w-12 h-12 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                  style={{
                    backgroundColor: 'var(--surface-1)',
                  }}
                >
                  <div className="transition-transform duration-300 group-hover:scale-110">
                    {category.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {category.title}
                </h3>
                <p className="text-muted-foreground">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
