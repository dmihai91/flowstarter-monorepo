'use client';

import Footer from '@/components/Footer';
import { SupportHeader } from '@/components/SupportHeader';
import { Shield, Bot, Download, Eye, Clock, Users, Cookie, Globe, Lock, Mail } from 'lucide-react';

export default function PrivacyPage() {
  const effectiveDate = 'February 27, 2026';
  const lastUpdated = 'February 27, 2026';
  const privacyEmail = 'privacy@flowstarter.dev';
  const supportEmail = 'hello@flowstarter.app';

  const glanceSummary = [
    { icon: Shield, title: 'Your data is protected', desc: 'Enterprise-grade encryption, secure infrastructure, strict access controls.' },
    { icon: Bot, title: 'AI is transparent', desc: 'We tell you exactly what data goes to AI providers and how.' },
    { icon: Download, title: 'You own your content', desc: 'Download your assets anytime. Your content is never used for AI training without consent.' },
    { icon: Eye, title: 'No tracking for ads', desc: 'We use privacy-focused analytics. No advertising cookies. We never sell your data.' },
    { icon: Clock, title: 'You control retention', desc: 'Request deletion anytime. We keep data only as long as needed.' },
    { icon: Lock, title: 'GDPR compliant', desc: 'Full data subject rights. EU-based company with proper safeguards.' },
  ];

  const sections = [
    {
      id: 'who-we-are',
      title: '1. Who We Are',
      content: [
        {
          subtitle: '1.1 About Flowstarter',
          text: 'Flowstarter is a premium website building service operated from Romania, European Union. We combine human expertise with AI technology to build professional websites for freelancers, small businesses, and creators. Our registered address and company details are available upon request.',
        },
        {
          subtitle: '1.2 Data Controller',
          text: 'Flowstarter acts as the Data Controller for the personal data we collect from our clients (you). This means we determine the purposes and means of processing your personal data.',
        },
        {
          subtitle: '1.3 Contact for Privacy Matters',
          text: `For any privacy-related questions, concerns, or to exercise your data rights, contact us at: ${privacyEmail}. We aim to respond to all privacy inquiries within 48 hours and will address formal requests within 30 days as required by GDPR.`,
        },
      ],
    },
    {
      id: 'lawful-basis',
      title: '2. Lawful Basis for Processing',
      content: [
        {
          subtitle: '2.1 Contract Performance',
          text: 'We process your data to fulfill our contract with you: building your website, providing dashboard access, hosting your site, and delivering the services you paid for. This includes processing your business information, content, and project data.',
        },
        {
          subtitle: '2.2 Legitimate Interest',
          text: 'We process certain data based on our legitimate business interests, including: improving our platform and AI systems using anonymized/aggregated data, preventing fraud and ensuring security, and communicating service updates. We balance these interests against your rights and only proceed where our interests do not override yours.',
        },
        {
          subtitle: '2.3 Consent',
          text: 'Where required, we obtain your explicit consent before processing. This includes: marketing communications, use of non-essential cookies, and any use of identifiable content for AI training (which we do not do without asking). You can withdraw consent at any time.',
        },
        {
          subtitle: '2.4 Legal Obligation',
          text: 'We retain certain data (e.g., invoices, payment records) to comply with tax, accounting, and other legal requirements.',
        },
      ],
    },
    {
      id: 'data-collection',
      title: '3. Information We Collect',
      content: [
        {
          subtitle: '3.1 Strategy Call & Onboarding Data',
          text: 'When you book a strategy call, we collect: business name, industry/niche, branding preferences (colors, fonts, tone of voice), content you provide (text, images, logos), contact information (name, email, phone), target audience description, and competitor references.',
        },
        {
          subtitle: '3.2 Account & Platform Data',
          text: 'When using our platform: account credentials (email, name, authentication method), project data (site structure, pages, components, design choices), AI editor interactions (prompts, edits, customization history), and platform usage data (features used, session information).',
        },
        {
          subtitle: '3.3 Payment Information',
          text: 'Payments are processed by Stripe. We receive confirmation of payment, subscription status, and billing history. We do NOT store credit card numbers, CVVs, or full payment credentials on our servers. Stripe handles all sensitive payment data under PCI-DSS compliance.',
        },
        {
          subtitle: '3.4 Automatically Collected Data',
          text: 'We automatically collect: IP address (anonymized for analytics), browser type and version, device type and operating system, pages visited and time spent, referral source, and general geographic region (country/city level).',
        },
      ],
    },
    {
      id: 'data-use',
      title: '4. How We Use Your Information',
      content: [
        {
          subtitle: '4.1 Service Delivery',
          text: 'Primary uses: building and hosting your website, providing dashboard and editor access, enabling AI-powered editing features, processing payments and managing subscriptions, and providing customer support.',
        },
        {
          subtitle: '4.2 Communication',
          text: 'We contact you for: service notifications and important updates, project progress and deliverables, security alerts, and marketing (only with consent, easy opt-out).',
        },
        {
          subtitle: '4.3 Platform Improvement',
          text: 'We use aggregated, anonymized data to: improve platform performance and features, fix bugs and issues, understand usage patterns, and develop new features.',
        },
        {
          subtitle: '4.4 Security & Fraud Prevention',
          text: 'We process data to: detect and prevent fraud, protect against unauthorized access, ensure platform integrity, and comply with legal requirements.',
        },
      ],
    },
    {
      id: 'ai-data',
      title: '5. AI Technology & Data Processing',
      highlight: true,
      content: [
        {
          subtitle: '5.1 How We Use AI',
          text: "Flowstarter uses AI technology for: generating website code and components, powering the AI editor for content changes, providing design suggestions, and automating repetitive development tasks. When you use AI features, data is sent to AI providers for real-time processing.",
        },
        {
          subtitle: '5.2 Third-Party AI Providers',
          text: "We currently use Anthropic (Claude) for AI processing. We may integrate additional providers in the future. These providers process data under their own privacy policies and our data processing agreements (DPAs). They are contractually prohibited from using your data for their own training purposes.",
        },
        {
          subtitle: '5.3 What Data Goes to AI Providers',
          text: 'When you use AI features, we send: your prompts and instructions, relevant page/component context needed for the task, and design preferences. We minimize data transmission to only what is necessary. We do NOT send: your personal contact information, payment details, or unrelated project data.',
        },
        {
          subtitle: '5.4 AI Compute Infrastructure',
          text: 'We use Daytona cloud workspaces for AI code execution. Code is executed in isolated, secure environments. No persistent storage of your data occurs on compute infrastructure beyond the active session.',
        },
      ],
    },
    {
      id: 'ai-training',
      title: '6. Anonymized Data for AI Improvement',
      highlight: true,
      content: [
        {
          subtitle: '6.1 What We May Use (Anonymized Only)',
          text: 'We may use anonymized, aggregated data to improve our AI systems: website structure patterns by industry, common editing workflows, prompt effectiveness patterns (anonymized), template usage statistics, and design preference trends. This data cannot be traced back to you or your business.',
        },
        {
          subtitle: '6.2 What We Will NEVER Use Without Explicit Consent',
          text: 'We will never use for AI training: your business name, branding, or identifiable content, your images, logos, or creative assets, your personal information, individual project data in identifiable form, or any data that could identify you or your clients.',
        },
        {
          subtitle: '6.3 Opt-Out Rights',
          text: `You can opt out of anonymized data collection for AI improvement by emailing ${privacyEmail}. Opting out will not affect your service but may limit certain AI features that rely on aggregated learning. Opt-out requests are processed within 30 days.`,
        },
        {
          subtitle: '6.4 Future AI Development',
          text: 'We may develop proprietary AI models using aggregated platform data. Any such development will follow these principles: strict anonymization, no identifiable content, transparency about methods, and continued opt-out availability.',
        },
      ],
    },
    {
      id: 'third-parties',
      title: '7. Data Sharing & Third Parties',
      content: [
        {
          subtitle: '7.1 Service Providers',
          text: 'We share data with trusted providers who help us operate: Stripe (payment processing), Supabase (database, authentication), Cloudflare (hosting, CDN, security), AWS S3 (asset storage), Anthropic (AI processing), Daytona (compute infrastructure), Convex (real-time editor data), and Analytics provider (Plausible or PostHog, privacy-focused).',
        },
        {
          subtitle: '7.2 Authentication Providers',
          text: 'If you sign in via Google, GitHub, Apple, or Facebook, we receive basic profile data (name, email) from these providers. We do not receive your passwords. Each provider has its own privacy policy governing their data practices.',
        },
        {
          subtitle: '7.3 Legal Requirements',
          text: 'We may disclose data if required by law, court order, or government request. We will notify you unless legally prohibited.',
        },
        {
          subtitle: '7.4 Business Transfers',
          text: 'If Flowstarter is acquired or merged, your data may transfer to the new entity. We will notify you before any such transfer and your rights under this policy will continue.',
        },
        {
          subtitle: '7.5 No Data Sales',
          text: 'We do NOT sell your personal information to anyone. We do NOT share data with advertisers. Your data is used solely to provide and improve our service.',
        },
      ],
    },
    {
      id: 'hosted-sites',
      title: '8. Client Websites & End Users',
      content: [
        {
          subtitle: '8.1 Our Role',
          text: 'When we host your website, we act as a Data Processor on your behalf. You (our client) are the Data Controller for any data your website collects from your visitors.',
        },
        {
          subtitle: '8.2 Your Responsibilities',
          text: "You are responsible for: having your own privacy policy for your website, obtaining necessary consents from your visitors, complying with applicable privacy laws for your audience, and configuring any forms or data collection appropriately.",
        },
        {
          subtitle: '8.3 What We Collect from Hosted Sites',
          text: 'We collect minimal technical data from visitors to sites we host: aggregated traffic statistics (page views, visitor counts), server logs for security and performance (IP addresses retained for 30 days), and error logs for debugging. We do NOT access or process personal data submitted to your website (form submissions, customer data) except as necessary for hosting.',
        },
        {
          subtitle: '8.4 Data Processing Agreement',
          text: 'Enterprise clients may request a formal Data Processing Agreement (DPA) for their hosted websites. Contact us to arrange this.',
        },
      ],
    },
    {
      id: 'data-security',
      title: '9. Data Security',
      content: [
        {
          subtitle: '9.1 Encryption',
          text: 'All data in transit is encrypted using TLS 1.3. Data at rest is encrypted using AES-256. Database connections use encrypted channels. Payment data is handled entirely by PCI-DSS compliant Stripe.',
        },
        {
          subtitle: '9.2 Access Controls',
          text: 'Strict role-based access controls limit who can access data. All access is logged and auditable. Employees with data access undergo background checks and security training. Multi-factor authentication required for all internal systems.',
        },
        {
          subtitle: '9.3 Infrastructure Security',
          text: 'We use SOC 2 compliant infrastructure providers. Regular security assessments and penetration testing. Automated vulnerability scanning. DDoS protection via Cloudflare.',
        },
        {
          subtitle: '9.4 Incident Response',
          text: 'We maintain an incident response plan. In case of a data breach affecting your personal data, we will: notify affected users within 72 hours, notify relevant supervisory authorities as required, document the breach and remediation steps, and take immediate action to contain and resolve the incident.',
        },
      ],
    },
    {
      id: 'gdpr-rights',
      title: '10. Your Rights (GDPR)',
      content: [
        {
          subtitle: '10.1 Right to Access',
          text: 'You can request a copy of all personal data we hold about you. We will provide this in a commonly used electronic format within 30 days.',
        },
        {
          subtitle: '10.2 Right to Rectification',
          text: 'You can correct inaccurate personal data through your account settings or by contacting us.',
        },
        {
          subtitle: '10.3 Right to Erasure ("Right to be Forgotten")',
          text: 'You can request deletion of your personal data. We will comply within 30 days, except for data we must retain for legal purposes (e.g., invoices).',
        },
        {
          subtitle: '10.4 Right to Data Portability',
          text: 'You can download your website files, assets, and content at any time. You own your content. We provide data export in standard formats.',
        },
        {
          subtitle: '10.5 Right to Object',
          text: 'You can object to processing based on legitimate interest, including anonymized data collection for AI improvement.',
        },
        {
          subtitle: '10.6 Right to Restrict Processing',
          text: 'You can request we limit how we use your data while a complaint or request is being resolved.',
        },
        {
          subtitle: '10.7 Right to Withdraw Consent',
          text: 'Where we process data based on consent, you can withdraw that consent anytime. This does not affect the lawfulness of prior processing.',
        },
        {
          subtitle: '10.8 Right to Lodge a Complaint',
          text: 'You have the right to lodge a complaint with your local data protection authority. In Romania, this is ANSPDCP (Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal).',
        },
        {
          subtitle: '10.9 Exercising Your Rights',
          text: `To exercise any of these rights, email ${privacyEmail} with your request. We may need to verify your identity before processing. We respond to all requests within 30 days.`,
        },
      ],
    },
    {
      id: 'data-retention',
      title: '11. Data Retention',
      content: [
        {
          subtitle: '11.1 Active Subscriptions',
          text: 'While your subscription is active, we retain all data necessary to provide the service: account information, project data, and usage history.',
        },
        {
          subtitle: '11.2 After Cancellation',
          text: 'When you cancel: project data and website files are retained for 90 days (in case you reactivate), after 90 days, project data is permanently deleted, account information is retained for 30 days then deleted.',
        },
        {
          subtitle: '11.3 Upon Account Deletion Request',
          text: 'When you request account deletion: personal data deleted within 30 days, anonymized/aggregated data may be retained indefinitely (it cannot identify you), and backup copies purged within 90 days.',
        },
        {
          subtitle: '11.4 Legal Retention',
          text: 'Certain data retained as legally required: invoices and payment records (7 years for tax purposes), data relevant to disputes (until resolution), and data subject to legal holds.',
        },
        {
          subtitle: '11.5 Anonymized Data',
          text: 'Truly anonymized, aggregated data (which cannot identify any individual) may be retained indefinitely for analytics and AI improvement purposes.',
        },
      ],
    },
    {
      id: 'international',
      title: '12. International Data Transfers',
      content: [
        {
          subtitle: '12.1 Where Data Is Processed',
          text: 'Your data may be processed in: European Union (primary), United States (some infrastructure providers, AI processing).',
        },
        {
          subtitle: '12.2 Safeguards for US Transfers',
          text: 'For transfers to the US, we rely on: Standard Contractual Clauses (SCCs) with providers, EU-US Data Privacy Framework certification where applicable, and provider-specific security commitments.',
        },
        {
          subtitle: '12.3 Provider Locations',
          text: 'Supabase: US and EU regions available. Cloudflare: Global CDN with EU presence. AWS S3: EU region (eu-central-1). Anthropic: US-based processing. Stripe: Global with EU entity.',
        },
      ],
    },
    {
      id: 'cookies',
      title: '13. Cookies & Tracking',
      content: [
        {
          subtitle: '13.1 Essential Cookies',
          text: 'Required for the service to function: authentication/session cookies, security tokens, and preference cookies (theme, language). These cannot be disabled.',
        },
        {
          subtitle: '13.2 Analytics Cookies',
          text: 'We use privacy-focused analytics (Plausible or PostHog) to understand platform usage. These do not track you across other sites and can be blocked via browser settings.',
        },
        {
          subtitle: '13.3 No Advertising Cookies',
          text: 'We do NOT use advertising or tracking cookies. We do NOT participate in ad networks. We do NOT build advertising profiles.',
        },
        {
          subtitle: '13.4 Managing Cookies',
          text: 'Most browsers allow you to manage cookie preferences. Blocking essential cookies may prevent you from using the service.',
        },
      ],
    },
    {
      id: 'children',
      title: '14. Children\'s Privacy',
      content: [
        {
          subtitle: '14.1 Age Requirement',
          text: 'Flowstarter is intended for users aged 18 and older. We do not knowingly collect personal data from anyone under 18.',
        },
        {
          subtitle: '14.2 Parental Notice',
          text: `If we learn we have collected data from someone under 18, we will delete it promptly. If you believe a minor has provided us data, please contact ${privacyEmail}.`,
        },
      ],
    },
    {
      id: 'changes',
      title: '15. Changes to This Policy',
      content: [
        {
          subtitle: '15.1 Updates',
          text: 'We may update this policy to reflect changes in our practices, technology, legal requirements, or business operations.',
        },
        {
          subtitle: '15.2 Notification',
          text: 'For significant changes, we will: email registered users, display a notice on the platform, and update the "Last Updated" date. Continued use after changes indicates acceptance.',
        },
        {
          subtitle: '15.3 Review',
          text: 'We encourage periodic review of this policy. Material changes will be highlighted.',
        },
      ],
    },
    {
      id: 'contact',
      title: '16. Contact Us',
      content: [
        {
          subtitle: '16.1 Privacy Inquiries',
          text: `For privacy-specific questions, data requests, or to exercise your rights: ${privacyEmail}`,
        },
        {
          subtitle: '16.2 General Support',
          text: `For general questions about our service: ${supportEmail}`,
        },
        {
          subtitle: '16.3 Response Time',
          text: 'We aim to respond to privacy inquiries within 48 hours. Formal data subject requests will be completed within 30 days.',
        },
      ],
    },
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-display {
          font-family: 'Outfit', system-ui, sans-serif;
        }
      `}</style>

      <div className="min-h-screen font-display bg-[#FAFAFA] dark:bg-[#0a0a0c]">
        {/* Flow lines background */}
        <div className="fixed inset-0 pointer-events-none">
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.08] dark:opacity-[0.06]"
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <defs>
              <linearGradient
                id="privacyFlowGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="var(--purple)" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <g stroke="url(#privacyFlowGradient)" strokeWidth="1">
              <path d="M-100,100 Q200,80 400,120 T800,100 T1300,140" />
              <path d="M-100,200 Q150,220 350,180 T750,220 T1300,200" />
              <path d="M-100,300 Q250,280 450,320 T850,290 T1300,330" />
              <path d="M-100,400 Q180,420 380,380 T780,420 T1300,400" />
              <path d="M-100,500 Q220,480 420,520 T820,490 T1300,530" />
              <path d="M-100,600 Q200,620 400,580 T800,620 T1300,600" />
              <path d="M-100,700 Q250,680 450,720 T850,690 T1300,730" />
            </g>
          </svg>
        </div>

        <SupportHeader />

        {/* Content */}
        <main className="relative z-10 max-w-4xl mx-auto px-6 py-16">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--purple)]/10 text-[var(--purple)] text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              GDPR Compliant
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-500 dark:text-white/50 max-w-2xl mx-auto mb-6">
              We respect your privacy and are committed to protecting your
              personal data. This policy explains how we collect, use, and
              safeguard your information.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-400 dark:text-white/30">
              <span>Effective: {effectiveDate}</span>
              <span className="hidden sm:inline">•</span>
              <span>Last updated: {lastUpdated}</span>
            </div>
          </div>

          {/* Privacy at a Glance */}
          <div className="mb-16 p-8 rounded-2xl bg-gradient-to-br from-[var(--purple)]/5 via-white to-blue-500/5 dark:from-[var(--purple)]/10 dark:via-[#0f0f12] dark:to-blue-500/10 border border-[var(--purple)]/20">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              🔒 Privacy at a Glance
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {glanceSummary.map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-white/60 dark:bg-white/[0.03] border border-gray-200/50 dark:border-white/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--purple)]/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-[var(--purple)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-white/50">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table of Contents */}
          <div className="mb-12 p-6 rounded-2xl bg-white/60 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Contents
            </h2>
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="text-gray-600 dark:text-white/60 hover:text-[var(--purple)] dark:hover:text-[var(--purple)] transition-colors"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </div>

          {/* Important AI Notice */}
          <div className="mb-12 p-6 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                  Important: AI & Your Data
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300/80 leading-relaxed mb-3">
                  Flowstarter uses AI technology. We want to be completely transparent:
                </p>
                <ul className="text-sm text-amber-700 dark:text-amber-300/80 space-y-1">
                  <li>• Your prompts are processed by third-party AI providers (Anthropic)</li>
                  <li>• We may use anonymized patterns to improve our AI (not your content)</li>
                  <li>• We will NEVER use your personal content for AI training without consent</li>
                  <li>• You can opt out of anonymized data collection</li>
                </ul>
                <p className="text-sm text-amber-700 dark:text-amber-300/80 mt-3">
                  See Sections 5 and 6 for full details.
                </p>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-10">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className={`p-8 rounded-2xl border ${
                  section.highlight
                    ? 'bg-[var(--purple)]/5 dark:bg-[var(--purple)]/10 border-[var(--purple)]/20'
                    : 'bg-white/60 dark:bg-white/[0.02] border-gray-200/50 dark:border-white/5'
                }`}
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  {section.title}
                </h2>
                <div className="space-y-5">
                  {section.content.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                        {item.subtitle}
                      </h3>
                      <p className="text-gray-600 dark:text-white/60 leading-relaxed text-sm">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Terms of Service Reference */}
          <div className="mt-12 p-6 rounded-2xl bg-gray-100 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 text-center">
            <p className="text-sm text-gray-500 dark:text-white/50">
              This Privacy Policy should be read alongside our{' '}
              <a href="/terms" className="text-[var(--purple)] hover:underline">
                Terms of Service
              </a>
              , which governs your use of Flowstarter.
            </p>
          </div>

          {/* Contact CTA */}
          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-[var(--purple)]/5 via-blue-500/5 to-cyan-500/5 border border-[var(--purple)]/10 dark:border-[var(--purple)]/20 text-center">
            <Mail className="w-10 h-10 text-[var(--purple)] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Questions about your privacy?
            </h2>
            <p className="text-gray-500 dark:text-white/50 mb-4">
              We're here to help. Reach out anytime.
            </p>
            <a
              href={`mailto:${privacyEmail}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 font-semibold hover:shadow-lg transition-all duration-300"
            >
              {privacyEmail}
            </a>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
