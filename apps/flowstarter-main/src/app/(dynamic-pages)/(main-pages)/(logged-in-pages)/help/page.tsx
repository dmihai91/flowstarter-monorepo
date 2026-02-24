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
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  HelpCircle,
  Mail,
  MessageCircle,
  Pencil,
  Rocket,
  Sparkles,
} from 'lucide-react';

const CALENDLY_URL = 'https://calendly.com/flowstarter/discovery';

const faqs = [
  {
    question: 'How does the process work?',
    answer: 'It\'s simple! Book a free discovery call with our team. We\'ll learn about your business, goals, and design preferences. Then we build your professional website in 1-2 weeks. Once it\'s live, you can manage and edit it from your dashboard.',
  },
  {
    question: 'How long does it take to build my website?',
    answer: 'Most websites are completed within 1-2 weeks after your discovery call. Complex projects with custom features may take a bit longer. We\'ll give you a clear timeline during your call.',
  },
  {
    question: 'What happens during the discovery call?',
    answer: 'We\'ll discuss your business, target audience, design preferences, and any specific features you need. This helps us understand your vision so we can build exactly what you need.',
  },
  {
    question: 'Can I make changes after my site is live?',
    answer: 'Absolutely! You\'ll have full access to edit your website content, images, and settings from your dashboard. For major design changes or new features, we\'re here to help.',
  },
  {
    question: 'What\'s included in my website?',
    answer: 'Every website includes professional design, mobile responsiveness, SEO optimization, contact forms, analytics integration, and hosting. During your discovery call, we\'ll discuss any additional features you need.',
  },
  {
    question: 'Do I need any technical skills?',
    answer: 'Not at all! We handle all the technical work. Once your site is live, our easy-to-use dashboard lets you make content updates without any coding knowledge.',
  },
  {
    question: 'How do I track my website performance?',
    answer: 'Your dashboard shows key metrics like visitor traffic, leads, and engagement. You can also connect Google Analytics for detailed insights through our integrations page.',
  },
  {
    question: 'What if I need help after my site launches?',
    answer: 'We\'re always here to help! You can reach out through the dashboard or book a follow-up call. We want your website to succeed as much as you do.',
  },
];

const steps = [
  {
    number: 1,
    title: 'Book Your Discovery Call',
    description: 'Schedule a free 30-minute call with our team to discuss your business and website needs.',
    icon: Calendar,
    iconColor: '#7C3AED',
  },
  {
    number: 2,
    title: 'We Build Your Website',
    description: 'Our team designs and develops your professional website within 1-2 weeks.',
    icon: Sparkles,
    iconColor: '#3B82F6',
  },
  {
    number: 3,
    title: 'Review & Launch',
    description: 'You review the site, we make any adjustments, then launch it to the world.',
    icon: Rocket,
    iconColor: '#10B981',
  },
  {
    number: 4,
    title: 'Manage From Dashboard',
    description: 'Edit content, track analytics, and manage leads — all from your dashboard.',
    icon: Pencil,
    iconColor: '#F59E0B',
  },
];

export default function HelpPage() {
  return (
    <PageContainer gradientVariant="help">
      <div className="space-y-12">
        {/* Hero Section */}
        <section className="relative">
          <div className="relative z-10">
            <div className="mb-2">
              <p className="text-gray-500 dark:text-white/50">
                Everything you need to know
              </p>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
              <span className="bg-gradient-to-r from-[#7C3AED] to-blue-500 bg-clip-text text-transparent">
                Help & Support
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
              Learn how Flowstarter works and get answers to common questions.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step) => {
              const IconComponent = step.icon;
              return (
                <GlassCard key={step.number} className="relative">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${step.iconColor}15` }}
                      >
                        <IconComponent 
                          className="w-5 h-5" 
                          style={{ color: step.iconColor }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Step {step.number}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </section>

        {/* CTA Card */}
        <section>
          <GlassCard className="bg-gradient-to-br from-[#7C3AED]/5 to-blue-500/5">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Ready to get started?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Book your free discovery call and let's build your website together.
                </p>
              </div>
              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white font-semibold shadow-lg shadow-[#7C3AED]/25 hover:shadow-xl hover:shadow-[#7C3AED]/30 transition-all duration-300 hover:scale-[1.02]"
              >
                <Calendar className="w-4 h-4" />
                Book Free Call
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </GlassCard>
        </section>

        {/* FAQs */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-[#7C3AED]" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h2>
          </div>
          <Accordion
            type="single"
            collapsible
            defaultValue="item-0"
            className="space-y-3"
          >
            {faqs.map((faq, index) => (
              <AccordionItem
                key={`faq-${index}`}
                value={`item-${index}`}
                className="border border-gray-200/80 dark:border-white/10 rounded-2xl px-6 bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-900 dark:text-white hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-300">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Contact Support */}
        <section>
          <GlassCard className="text-center py-10">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white dark:text-gray-900" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Still have questions?
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              We're here to help. Reach out and we'll get back to you as soon as possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="inline-flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Contact Support
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
              >
                <a
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule a Call
                </a>
              </Button>
            </div>
          </GlassCard>
        </section>
      </div>
    </PageContainer>
  );
}
