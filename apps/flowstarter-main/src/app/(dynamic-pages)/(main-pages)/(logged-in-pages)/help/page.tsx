'use client';
import { PageContainer } from '@/components/PageContainer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { QuickLinkCard } from '@/components/ui/quick-link-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/lib/i18n';
import {
  BookOpen,
  ChevronRight,
  Clock,
  HelpCircle,
  Mail,
  MessageCircle,
  Rocket,
  Settings,
  Users,
} from 'lucide-react';
import { DashboardSubtitle } from '../dashboard/components/DashboardSubtitle';
import { PageSectionHeader } from '../dashboard/components/PageSectionHeader';

const getFaqs = (t: (key: string) => string) => [
  {
    question: t('help.faqs.items.0.question'),
    answer: t('help.faqs.items.0.answer'),
  },
  {
    question: t('help.faqs.items.1.question'),
    answer: t('help.faqs.items.1.answer'),
  },
  {
    question: t('help.faqs.items.2.question'),
    answer: t('help.faqs.items.2.answer'),
  },
  {
    question: t('help.faqs.items.3.question'),
    answer: t('help.faqs.items.3.answer'),
  },
  {
    question: t('help.faqs.items.4.question'),
    answer: t('help.faqs.items.4.answer'),
  },
  {
    question: t('help.faqs.items.5.question'),
    answer: t('help.faqs.items.5.answer'),
  },
  {
    question: t('help.faqs.items.6.question'),
    answer: t('help.faqs.items.6.answer'),
  },
  {
    question: t('help.faqs.items.7.question'),
    answer: t('help.faqs.items.7.answer'),
  },
  {
    question: t('help.faqs.items.8.question'),
    answer: t('help.faqs.items.8.answer'),
  },
  {
    question: t('help.faqs.items.9.question'),
    answer: t('help.faqs.items.9.answer'),
  },
];

const getGuides = (t: (key: string) => string) => [
  {
    title: t('help.guides.items.0.title'),
    description: t('help.guides.items.0.description'),
    icon: Rocket,
    iconColor: 'var(--blue)',
    time: t('help.guides.items.0.time'),
    steps: [
      t('help.guides.items.0.steps.0'),
      t('help.guides.items.0.steps.1'),
      t('help.guides.items.0.steps.2'),
      t('help.guides.items.0.steps.3'),
      t('help.guides.items.0.steps.4'),
    ],
  },
  {
    title: t('help.guides.items.1.title'),
    description: t('help.guides.items.1.description'),
    icon: BookOpen,
    iconColor: 'var(--green)',
    time: t('help.guides.items.1.time'),
    steps: [
      t('help.guides.items.1.steps.0'),
      t('help.guides.items.1.steps.1'),
      t('help.guides.items.1.steps.2'),
      t('help.guides.items.1.steps.3'),
      t('help.guides.items.1.steps.4'),
    ],
  },
  {
    title: t('help.guides.items.2.title'),
    description: t('help.guides.items.2.description'),
    icon: Settings,
    iconColor: 'var(--purple)',
    time: t('help.guides.items.2.time'),
    steps: [
      t('help.guides.items.2.steps.0'),
      t('help.guides.items.2.steps.1'),
      t('help.guides.items.2.steps.2'),
      t('help.guides.items.2.steps.3'),
      t('help.guides.items.2.steps.4'),
    ],
  },
];

export default function HelpPage() {
  const { t } = useI18n();
  const faqs = getFaqs(t);
  const guides = getGuides(t);

  return (
    <PageContainer gradientVariant="help">
      <div className="space-y-12">
        {/* Hero Section */}
        <section className="relative mb-12">
          <div className="relative z-10">
            {/* Header Title - Top Left */}
            <PageSectionHeader
              title={t('help.overview.title')}
              className="mb-4"
            />

            {/* Greeting section */}
            <div className="mb-8">
              <DashboardSubtitle>
                {t('help.overview.subtitle')}
              </DashboardSubtitle>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <QuickLinkCard
                icon={HelpCircle}
                title={t('help.quicklinks.faqs.title')}
                description={t('help.quicklinks.faqs.desc')}
                gradientFrom="from-blue-500"
                gradientTo="to-indigo-500"
              />
              <QuickLinkCard
                icon={BookOpen}
                title={t('help.quicklinks.guides.title')}
                description={t('help.quicklinks.guides.desc')}
                gradientFrom="from-emerald-500"
                gradientTo="to-teal-500"
              />
              <QuickLinkCard
                icon={MessageCircle}
                title={t('help.quicklinks.community.title')}
                description={t('help.quicklinks.community.desc')}
                gradientFrom="from-violet-500"
                gradientTo="to-fuchsia-500"
              />
              <QuickLinkCard
                icon={Mail}
                title={t('help.quicklinks.support.title')}
                description={t('help.quicklinks.support.desc')}
                gradientFrom="from-gray-900"
                gradientTo="to-gray-800"
              />
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-10">
              <div className="flex-grow border-t border-gray-300/60 dark:border-gray-600/40"></div>
            </div>

            {/* Main Content - Tabs */}
            <Tabs defaultValue="guides" className="space-y-8">
              <TabsList className="grid w-full grid-cols-2 h-auto p-1 rounded-[16px] bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)] backdrop-blur-xl border border-white dark:border-white/40">
                <TabsTrigger
                  value="faqs"
                  className="flex items-center justify-center gap-2 text-sm h-11 px-6 rounded-lg transition-all data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10"
                  style={{
                    color: 'var(--copy-headlines)',
                  }}
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="font-medium">{t('help.faqs.title')}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="guides"
                  className="flex items-center justify-center gap-2 text-sm h-11 px-6 rounded-lg transition-all data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10"
                  style={{
                    color: 'var(--copy-headlines)',
                  }}
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="font-medium">{t('help.guides.title')}</span>
                </TabsTrigger>
              </TabsList>

              {/* FAQs Tab */}
              <TabsContent value="faqs" className="space-y-6">
                <div>
                  <Accordion
                    type="single"
                    collapsible
                    defaultValue={`item-${faqs[0]?.question
                      .replace(/[^a-z0-9]/gi, '-')
                      .toLowerCase()}`}
                    className="space-y-4"
                  >
                    {faqs.map((faq) => (
                      <AccordionItem
                        key={`faq-${faq.question
                          .replace(/[^a-z0-9]/gi, '-')
                          .toLowerCase()}`}
                        value={`item-${faq.question
                          .replace(/[^a-z0-9]/gi, '-')
                          .toLowerCase()}`}
                        className="border border-white dark:border-white/40 rounded-[16px] px-6 bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)] backdrop-blur-xl"
                      >
                        <AccordionTrigger
                          className="text-left font-semibold"
                          style={{ color: 'var(--copy-headlines)' }}
                        >
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent style={{ color: 'var(--copy-body)' }}>
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </TabsContent>

              {/* Guides Tab */}
              <TabsContent value="guides" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {guides.map((guide) => {
                    const IconComponent = guide.icon;
                    return (
                      <GlassCard
                        key={`guide-${guide.title
                          .replace(/[^a-z0-9]/gi, '-')
                          .toLowerCase()}`}
                        href={`/help/${guide.title
                          .toLowerCase()
                          .replace(/[^a-z0-9]/gi, '-')
                          .replace('getting-started-guide', 'getting-started')
                          .replace(
                            'template-selection-guide',
                            'template-selection'
                          )
                          .replace('customization-guide', 'customization')}`}
                        as="link"
                        className="group relative"
                      >
                        <div className="relative">
                          {/* Header with icon */}
                          <div className="flex items-start gap-4 mb-4">
                            <div className="shrink-0 rounded-xl p-3 transition-transform duration-300 group-hover:scale-105 backdrop-blur-sm border border-white dark:border-white/40 bg-[rgba(243,243,243,0.30)] dark:bg-[rgba(58,58,74,0.30)]">
                              <IconComponent
                                className="h-6 w-6"
                                style={{ color: guide.iconColor }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3
                                className="text-lg font-semibold mb-1.5"
                                style={{ color: 'var(--copy-headlines)' }}
                              >
                                {guide.title}
                              </h3>
                              <p
                                className="text-sm leading-relaxed"
                                style={{ color: 'var(--copy-body)' }}
                              >
                                {guide.description}
                              </p>
                            </div>
                          </div>

                          {/* Time estimate */}
                          <div
                            className="flex items-center gap-2 mb-4 text-xs"
                            style={{ color: 'var(--copy-labels)' }}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            <span>{guide.time}</span>
                          </div>

                          {/* Steps list */}
                          <div className="space-y-2 mb-4">
                            {guide.steps.map((step, stepIndex) => (
                              <div
                                key={`${guide.title}-step-${stepIndex + 1}`}
                                className="flex items-start gap-2.5"
                              >
                                <div className="shrink-0 w-5 h-5 rounded-full bg-gray-100 dark:bg-[#3a3a42] border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 text-xs font-medium flex items-center justify-center mt-0.5">
                                  {stepIndex + 1}
                                </div>
                                <span
                                  className="text-sm leading-relaxed"
                                  style={{ color: 'var(--copy-body)' }}
                                >
                                  {step}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* CTA */}
                          <div
                            className="flex items-center gap-2 text-sm font-medium transition-colors"
                            style={{ color: 'var(--copy-body)' }}
                          >
                            <span>{t('help.guides.start')}</span>
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Contact Support */}
        <div className="text-center">
          <GlassCard className="py-10">
            <div className="relative z-10 w-full">
              <div className="flex justify-center mb-5">
                <div className="shrink-0 rounded-xl text-white p-3 bg-gradient-to-br from-gray-900 to-gray-800">
                  <MessageCircle className="h-6 w-6" />
                </div>
              </div>
              <h2
                className="text-xl sm:text-2xl font-bold mb-3"
                style={{ color: 'var(--copy-headlines)' }}
              >
                {t('help.support.title')}
              </h2>
              <p
                className="text-sm mb-6 max-w-2xl mx-auto"
                style={{ color: 'var(--copy-body)' }}
              >
                {t('help.support.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {t('help.support.contactSupport')}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Users className="h-5 w-5" />
                  {t('help.support.joinCommunity')}
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageContainer>
  );
}
