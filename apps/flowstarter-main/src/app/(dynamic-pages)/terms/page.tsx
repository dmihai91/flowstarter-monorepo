import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertTriangle,
  Clock,
  CreditCard,
  FileText,
  Gavel,
  Mail,
  Shield,
} from 'lucide-react';

export default function TermsPage() {
  const lastUpdated = new Date();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-white dark:bg-gray-900 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-5xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <Gavel className="h-8 w-8" style={{ color: 'var(--blue)' }} />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              Terms of Service
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-5xl mx-auto leading-relaxed mb-8">
              By using Flowstarter, you agree to these terms. Please read them
              carefully.
            </p>
            <Badge
              variant="outline"
              className="text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-900/20"
            >
              <Clock className="h-4 w-4 mr-2" />
              Last updated: {lastUpdated.toLocaleDateString()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Terms Content */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {/* Agreement */}
            <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <FileText
                      className="h-6 w-6"
                      style={{ color: 'var(--blue)' }}
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    1. Agreement to Terms
                  </h2>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  By accessing and using Flowstarter ("the Service"), you accept
                  and agree to be bound by the terms and provision of this
                  agreement.
                </p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  If you do not agree to abide by the above, please do not use
                  this service. We reserve the right to update these terms at
                  any time, and your continued use of the service constitutes
                  acceptance of those changes.
                </p>
              </CardContent>
            </Card>

            {/* Service Description */}
            <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-linear-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <Shield
                      className="h-6 w-6"
                      style={{ color: 'var(--green)' }}
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    2. Service Description
                  </h2>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Flowstarter provides AI-powered website building tools and
                    hosting services. Our service includes:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 pl-4">
                    <li>Website template library and customization tools</li>
                    <li>AI-powered design assistance and content generation</li>
                    <li>Web hosting and domain management</li>
                    <li>Analytics and performance monitoring</li>
                    <li>Customer support and documentation</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* User Responsibilities */}
            <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-linear-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    3. User Responsibilities
                  </h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Account Security
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      You are responsible for maintaining the confidentiality of
                      your account credentials and for all activities that occur
                      under your account.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Content Guidelines
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                      You agree not to use our service to create content that:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300 pl-4">
                      <li>Violates any applicable laws or regulations</li>
                      <li>Infringes on intellectual property rights</li>
                      <li>
                        Contains harmful, threatening, or abusive material
                      </li>
                      <li>Promotes illegal activities or violence</li>
                      <li>Contains spam, malware, or deceptive content</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Terms */}
            <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-linear-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <CreditCard
                      className="h-6 w-6"
                      style={{ color: 'var(--purple)' }}
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    4. Payment and Billing
                  </h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Subscription Plans
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      Flowstarter offers various subscription plans. Payment is
                      due monthly or annually as selected. All fees are
                      non-refundable except as required by law.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Automatic Renewal
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      Subscriptions automatically renew unless cancelled before
                      the renewal date. You can cancel your subscription at any
                      time through your account settings.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Price Changes
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      We reserve the right to modify pricing with 30 days
                      notice. Existing subscribers will be notified of any price
                      changes affecting their current plan.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Intellectual Property */}
            <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-linear-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    5. Intellectual Property
                  </h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Your Content
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      You retain ownership of all content you create using
                      Flowstarter. By using our service, you grant us a license
                      to host, store, and display your content as necessary to
                      provide the service.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Our Platform
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      Flowstarter's platform, including templates, tools, and
                      technology, remains our intellectual property. You may not
                      copy, modify, or redistribute our platform or its
                      components.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Limitation of Liability */}
            <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-linear-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    6. Limitation of Liability
                  </h2>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Flowstarter is provided "as is" without warranties of any
                  kind. We strive for 99.9% uptime but cannot guarantee
                  uninterrupted service.
                </p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  In no event shall Flowstarter be liable for any indirect,
                  incidental, special, consequential, or punitive damages, or
                  any loss of profits or revenues.
                </p>
              </CardContent>
            </Card>

            {/* Termination */}
            <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-linear-to-br from-gray-500/20 to-slate-500/20 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    7. Account Termination
                  </h2>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    You may terminate your account at any time through your
                    account settings. We may terminate accounts that violate
                    these terms or engage in prohibited activities.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Upon termination, you will lose access to your account and
                    websites. We recommend exporting any important data before
                    termination.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg:(var(--surface-2))">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="backdrop-blur-md bg-linear-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/40 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <Mail className="h-6 w-6" style={{ color: 'var(--blue)' }} />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Questions About These Terms?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                If you have any questions about these Terms of Service, please
                contact our legal team.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:legal@flowstarter.com"
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-linear-to-r from-blue-600 to-purple-600 [@media(hover:hover)]:hover:from-blue-700 [@media(hover:hover)]:hover:to-purple-700 transition-all duration-200 shadow-lg [@media(hover:hover)]:hover:shadow-xl"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  legal@flowstarter.com
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
    </div>
  );
}
