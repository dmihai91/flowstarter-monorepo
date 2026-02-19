import {
  ArrowRight,
  Award,
  BarChart,
  Building,
  CheckCircle,
  Linkedin,
  Mail,
  Phone,
  Send,
  Shield,
  Star,
  Twitter,
  Users,
} from 'lucide-react';

export default function SaasProductLaunch2Preview() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Navigation */}
      <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="text-2xl font-bold bg-linear-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent">
              saas-product-launch-2
            </div>
            <div className="hidden md:flex space-x-8">
              <a
                href="#solutions"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-900 transition-colors"
              >
                Solutions
              </a>
              <a
                href="#features"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-900 transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-900 transition-colors"
              >
                Enterprise
              </a>
              <a
                href="#contact"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-900 transition-colors"
              >
                Contact
              </a>
            </div>
            <button className="bg-slate-900 text-white px-6 py-2 rounded-xl [@media(hover:hover)]:hover:bg-slate-800 transition-all">
              Request Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium">
              <Shield className="w-4 h-4 mr-2" />
              Enterprise Grade Security
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
              Enterprise
              <span className="bg-linear-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent">
                Solutions
              </span>
              That Scale
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-5xl mx-auto leading-relaxed">
              Powerful enterprise software that transforms how large
              organizations operate, collaborate, and achieve their strategic
              objectives.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center px-8 py-4 bg-slate-900 text-white font-semibold rounded-xl [@media(hover:hover)]:hover:bg-slate-800 transition-all shadow-lg">
                Schedule Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button className="inline-flex items-center px-8 py-4 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl [@media(hover:hover)]:hover:bg-slate-50 dark:[@media(hover:hover)]:hover:bg-slate-800 transition-all">
                <BarChart className="mr-2 w-5 h-5" />
                View ROI Calculator
              </button>
            </div>

            <div className="flex items-center justify-center space-x-12 pt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  500+
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Enterprise Clients
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  99.9%
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Uptime SLA
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  24/7
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Enterprise Support
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Enterprise Solutions
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Comprehensive solutions designed for enterprise-scale challenges
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Building,
                title: 'Digital Transformation',
                description:
                  'Complete organizational digital transformation with measurable ROI',
              },
              {
                icon: Shield,
                title: 'Security & Compliance',
                description:
                  'Enterprise-grade security with SOC 2, HIPAA, and GDPR compliance',
              },
              {
                icon: Users,
                title: 'Workforce Management',
                description:
                  'Streamline operations across departments and global teams',
              },
              {
                icon: BarChart,
                title: 'Analytics & Insights',
                description:
                  'Real-time dashboards and predictive analytics for decision-making',
              },
              {
                icon: Award,
                title: 'Quality Assurance',
                description:
                  'Six Sigma processes with 99.9% reliability guarantee',
              },
              {
                icon: CheckCircle,
                title: 'Integration Suite',
                description:
                  'Seamless integration with existing enterprise systems',
              },
            ].map((solution, index) => (
              <div
                key={index}
                className="bg-linear-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900 rounded-xl p-8 [@media(hover:hover)]:hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-slate-900 dark:bg-slate-100 rounded-xl flex items-center justify-center mb-6">
                  <solution.icon className="w-6 h-6 text-white dark:text-slate-900" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  {solution.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  {solution.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-6">
                  Built for Enterprise Scale
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  Our platform handles millions of transactions daily for
                  Fortune 500 companies, with enterprise-grade security and 24/7
                  dedicated support.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  'SOC 2 Type II certified infrastructure',
                  'Dedicated customer success manager',
                  '99.9% uptime SLA with financial backing',
                  'Advanced role-based access controls',
                  'Enterprise SSO and directory integration',
                  'Custom API development and support',
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl">
              <div className="text-center space-y-6">
                <Award className="w-16 h-16 text-slate-600 dark:text-slate-400 mx-auto" />
                <div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">
                    Fortune 500
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    Companies Trust Us
                  </div>
                </div>
                <div className="flex justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-6 h-6 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 italic">
                  "The most reliable enterprise solution we've implemented in
                  our 50-year history."
                </p>
                <div className="text-sm text-slate-500">
                  - Global Technology Director
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Enterprise Pricing
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Flexible pricing designed for enterprise organizations
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Professional
                </h3>
                <div className="text-4xl font-bold text-slate-900 dark:text-white mt-4">
                  Custom
                </div>
                <div className="text-slate-500">Based on organization size</div>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Up to 1,000 users',
                  'Standard integrations',
                  'Business hours support',
                  'Basic analytics',
                  'Standard SLA',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-600 dark:text-slate-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold [@media(hover:hover)]:hover:bg-slate-50 dark:[@media(hover:hover)]:hover:bg-slate-800 transition-all">
                Get Quote
              </button>
            </div>

            <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl p-8 shadow-xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm">
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold">Enterprise</h3>
                <div className="text-4xl font-bold mt-4">Custom</div>
                <div className="text-slate-300 dark:text-slate-600">
                  Volume-based pricing
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Unlimited users',
                  'Custom integrations',
                  '24/7 dedicated support',
                  'Advanced analytics & BI',
                  '99.9% uptime SLA',
                  'Dedicated success manager',
                  'Custom feature development',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl font-semibold [@media(hover:hover)]:hover:bg-slate-100 dark:[@media(hover:hover)]:hover:bg-slate-800 transition-all">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Transform Your Enterprise?
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Contact our enterprise team for a personalized demonstration
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-6">Enterprise Sales</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Mail className="w-6 h-6" />
                    <div>
                      <div className="font-semibold">Email</div>
                      <div className="text-slate-300">
                        enterprise@example.com
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Phone className="w-6 h-6" />
                    <div>
                      <div className="font-semibold">Phone</div>
                      <div className="text-slate-300">+1 (800) 555-0123</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center [@media(hover:hover)]:hover:bg-white/30 transition-colors"
                  >
                    <Linkedin className="w-6 h-6" />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center [@media(hover:hover)]:hover:bg-white/30 transition-colors"
                  >
                    <Twitter className="w-6 h-6" />
                  </a>
                </div>
              </div>
            </div>

            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder="First Name"
                  className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white placeholder-slate-300 focus:outline-none focus:border-white/40"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white placeholder-slate-300 focus:outline-none focus:border-white/40"
                />
              </div>
              <input
                type="email"
                placeholder="Business Email"
                className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white placeholder-slate-300 focus:outline-none focus:border-white/40"
              />
              <input
                type="text"
                placeholder="Company Name"
                className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white placeholder-slate-300 focus:outline-none focus:border-white/40"
              />
              <select className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white focus:outline-none focus:border-white/40">
                <option value="" disabled selected>
                  Company Size
                </option>
                <option value="100-500">100-500 employees</option>
                <option value="500-1000">500-1,000 employees</option>
                <option value="1000-5000">1,000-5,000 employees</option>
                <option value="5000+">5,000+ employees</option>
              </select>
              <textarea
                placeholder="Tell us about your enterprise needs..."
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white placeholder-slate-300 focus:outline-none focus:border-white/40"
              ></textarea>
              <button
                type="submit"
                className="w-full px-8 py-4 bg-white text-slate-900 font-semibold rounded-xl [@media(hover:hover)]:hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
              >
                Request Enterprise Demo
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-2xl font-bold bg-linear-to-r from-slate-300 to-blue-300 bg-clip-text text-transparent mb-4">
              saas-product-launch-2
            </div>
            <p className="text-slate-400 mb-6">
              Powering enterprise transformation worldwide
            </p>
            <div className="text-sm text-slate-500">
              © {new Date().getFullYear()} saas-product-launch-2. All rights
              reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
