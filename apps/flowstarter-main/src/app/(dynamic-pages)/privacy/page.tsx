import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Clock,
  Eye,
  FileText,
  Globe,
  Lock,
  Mail,
  Shield,
  Users,
} from 'lucide-react';

export default function PrivacyPage() {
  const lastUpdated = 'December 15, 2024';

  const sections = [
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'Information We Collect',
      content: [
        {
          subtitle: 'Personal Information',
          text: 'When you create an account, we collect your name, email address, and billing information. This helps us provide you with personalized service and process payments securely.',
        },
        {
          subtitle: 'Website Data',
          text: 'We store the websites you create, including content, images, and design preferences. This data is essential for providing our service and is only accessible to you and authorized Flowstarter personnel.',
        },
        {
          subtitle: 'Usage Analytics',
          text: 'We collect anonymous usage data to understand how our platform is used and to improve our services. This includes page views, feature usage, and performance metrics.',
        },
      ],
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: 'How We Use Your Information',
      content: [
        {
          subtitle: 'Service Provision',
          text: 'We use your information to provide, maintain, and improve our website building platform, including hosting your websites and providing customer support.',
        },
        {
          subtitle: 'Communication',
          text: 'We may send you service-related notifications, updates about new features, and promotional content (which you can opt out of at any time).',
        },
        {
          subtitle: 'Security and Compliance',
          text: 'We use your information to detect fraud, ensure platform security, and comply with legal obligations.',
        },
      ],
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: 'Data Security',
      content: [
        {
          subtitle: 'Encryption',
          text: 'All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. Your payment information is processed securely through certified payment processors.',
        },
        {
          subtitle: 'Access Controls',
          text: 'We implement strict access controls and regularly review who has access to user data. Our employees undergo security training and background checks.',
        },
        {
          subtitle: 'Infrastructure Security',
          text: 'Our infrastructure is hosted on secure, SOC 2 compliant platforms with regular security audits and monitoring.',
        },
      ],
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Your Rights',
      content: [
        {
          subtitle: 'Data Access',
          text: 'You can access and download all your personal data at any time through your account settings or by contacting our support team.',
        },
        {
          subtitle: 'Data Correction',
          text: 'You can update or correct your personal information directly in your account settings or by contacting us.',
        },
        {
          subtitle: 'Data Deletion',
          text: 'You can delete your account and all associated data at any time. Some data may be retained for legal or security purposes as outlined in our retention policy.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-white dark:bg-gray-900 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-5xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500/20 to-[var(--purple)]/20 flex items-center justify-center">
                <Shield className="h-8 w-8" style={{ color: 'var(--blue)' }} />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-5xl mx-auto leading-relaxed mb-8">
              Your privacy is important to us. This policy explains how we
              collect, use, and protect your information.
            </p>
            <Badge
              variant="outline"
              className="text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-900/20"
            >
              <Clock className="h-4 w-4 mr-2" />
              Last updated: {lastUpdated}
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Summary */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="backdrop-blur-md bg-linear-to-r from-blue-500/10 via-[var(--purple)]/10 to-pink-500/10 border border-white/40 shadow-xl mb-16">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Quick Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-linear-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <Shield
                      className="h-6 w-6"
                      style={{ color: 'var(--green)' }}
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    We Protect Your Data
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Enterprise-grade security with encryption and strict access
                    controls.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-linear-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Users
                      className="h-6 w-6"
                      style={{ color: 'var(--blue)' }}
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    You Control Your Data
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Access, update, or delete your data anytime through your
                    account.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-linear-to-br from-[var(--purple)]/20 to-pink-500/20 flex items-center justify-center">
                    <Globe
                      className="h-6 w-6"
                      style={{ color: 'var(--purple)' }}
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    No Data Selling
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    We never sell your personal information to third parties.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Sections */}
          <div className="space-y-12">
            {sections.map((section, index) => (
              <Card
                key={index}
                className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-xl"
              >
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500/20 to-[var(--purple)]/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      {section.icon}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {section.title}
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {section.content.map((item, itemIndex) => (
                      <div key={itemIndex}>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          {item.subtitle}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Data Retention */}
      <section className="py-20 bg:(var(--surface-2))">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-linear-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Data Retention
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Active Accounts
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    We retain your data as long as your account is active or as
                    needed to provide you services.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Deleted Accounts
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    When you delete your account, we remove your personal data
                    within 30 days, except for data we're required to retain for
                    legal purposes.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Legal Requirements
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    Some data may be retained longer for legal compliance, fraud
                    prevention, or security purposes.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Anonymous Data
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    We may retain anonymous, aggregated data indefinitely for
                    analytics and service improvement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="backdrop-blur-md bg-linear-to-r from-blue-500/10 via-[var(--purple)]/10 to-pink-500/10 border border-white/40 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500/20 to-[var(--purple)]/20 flex items-center justify-center">
                  <Mail className="h-6 w-6" style={{ color: 'var(--blue)' }} />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Questions About Privacy?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                If you have questions about this privacy policy or how we handle
                your data, we're here to help. Contact our privacy team anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:privacy@flowstarter.com"
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-linear-to-r from-blue-600 to-[var(--purple)] [@media(hover:hover)]:hover:from-blue-700 [@media(hover:hover)]:hover:to-[var(--purple)] transition-all duration-200 shadow-lg [@media(hover:hover)]:hover:shadow-xl"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  privacy@flowstarter.com
                </a>
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-xl text-gray-700 dark:text-gray-300 bg:(var(--surface-2)) [@media(hover:hover)]:hover:bg-gray-50 dark:[@media(hover:hover)]:hover:bg-gray-700 transition-all duration-200 shadow-lg [@media(hover:hover)]:hover:shadow-xl"
                >
                  Contact Support
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Legal Notice */}
      <section className="py-12 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p className="mb-2">
              This privacy policy is effective as of {lastUpdated} and will
              remain in effect except with respect to any changes in its
              provisions in the future, which will be in effect immediately
              after being posted on this page.
            </p>
            <p>
              We reserve the right to update or change our Privacy Policy at any
              time and you should check this Privacy Policy periodically. Your
              continued use of the service after we post any modifications to
              the Privacy Policy on this page will constitute your
              acknowledgment of the modifications and your consent to abide and
              be bound by the modified Privacy Policy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
