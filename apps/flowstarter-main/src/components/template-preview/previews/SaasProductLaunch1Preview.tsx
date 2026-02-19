import {
  ArrowRight,
  Check,
  Github,
  Linkedin,
  Mail,
  Play,
  Rocket,
  Send,
  Star,
  Twitter,
  Users,
  Zap,
} from 'lucide-react';

export default function SaasProductLaunch1Preview() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-violet-900 dark:via-purple-900 dark:to-fuchsia-900">
      {/* Navigation */}
      <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-violet-200 dark:border-violet-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="text-2xl font-bold bg-linear-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent">
              saas-product-launch-1
            </div>
            <div className="hidden md:flex space-x-8">
              <a
                href="#features"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-700 transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-700 transition-colors"
              >
                Pricing
              </a>
              <a
                href="#about"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-700 transition-colors"
              >
                About
              </a>
              <a
                href="#contact"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-700 transition-colors"
              >
                Contact
              </a>
            </div>
            <button className="bg-linear-to-r from-violet-500 to-purple-500 text-white px-6 py-2 rounded-full [@media(hover:hover)]:hover:from-violet-600 [@media(hover:hover)]:hover:to-purple-600 transition-all">
              Join Waitlist
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-violet-400/20 to-purple-400/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-sm font-medium">
              <Rocket className="w-4 h-4 mr-2" />
              Launching Soon
            </div>
            <h1 className="text-4xl lg:text-7xl font-bold text-slate-900 dark:text-white leading-tight">
              The Future of
              <span className="bg-linear-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent">
                Innovation
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-5xl mx-auto leading-relaxed">
              Revolutionary technology that transforms how startups build,
              launch, and scale their products.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center px-8 py-4 bg-linear-to-r from-slate-700 to-slate-800 text-white font-semibold rounded-full [@media(hover:hover)]:hover:from-violet-700 [@media(hover:hover)]:hover:to-purple-700 transition-all transform [@media(hover:hover)]:hover:scale-105 shadow-lg">
                Get Early Access
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button className="inline-flex items-center px-8 py-4 border-2 border-violet-300 dark:border-violet-600 text-violet-700 dark:text-violet-300 font-semibold rounded-full [@media(hover:hover)]:hover:bg-violet-50 dark:[@media(hover:hover)]:hover:bg-violet-900/50 transition-all">
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </button>
            </div>

            <div className="flex items-center justify-center space-x-8 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  10K+
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Beta Users
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  50+
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Features
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-4 h-4 fill-violet-400 text-violet-400"
                    />
                  ))}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  5.0 Rating
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Powerful Features for Modern Startups
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Everything you need to build, launch, and scale your product
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Lightning Fast',
                description: 'Deploy in seconds, not hours',
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                description: 'Built for remote teams',
              },
              {
                icon: Rocket,
                title: 'Scalable Architecture',
                description: 'Grows with your business',
              },
              {
                icon: Check,
                title: 'Quality Assurance',
                description: 'Automated testing included',
              },
              {
                icon: Star,
                title: 'Analytics Dashboard',
                description: 'Real-time insights',
              },
              {
                icon: ArrowRight,
                title: 'Easy Integration',
                description: 'Connect with 100+ tools',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group bg-linear-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 rounded-2xl p-6 [@media(hover:hover)]:hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-linear-to-r from-violet-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-20 bg-linear-to-r from-violet-50 to-purple-50 dark:from-violet-900/50 dark:to-purple-900/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Choose the plan that's right for your startup
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '$29',
                features: ['5 Projects', 'Basic Analytics', 'Email Support'],
              },
              {
                name: 'Pro',
                price: '$99',
                features: [
                  'Unlimited Projects',
                  'Advanced Analytics',
                  'Priority Support',
                  'Team Collaboration',
                ],
                popular: true,
              },
              {
                name: 'Enterprise',
                price: '$299',
                features: [
                  'Everything in Pro',
                  'Custom Integrations',
                  'Dedicated Manager',
                  'SLA',
                ],
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl ${
                  plan.popular ? 'ring-2 ring-violet-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="text-center mb-4">
                    <span className="bg-violet-500 text-white px-3 py-1 rounded-full text-sm">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <div className="text-4xl font-bold text-slate-700 mt-2">
                    {plan.price}
                    <span className="text-lg text-slate-500">/mo</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-slate-600 dark:text-slate-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-violet-500 text-white [@media(hover:hover)]:hover:bg-(--purple)'
                      : 'border border-violet-300 text-slate-700 [@media(hover:hover)]:hover:bg-violet-50'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="py-20 bg-linear-to-r from-violet-900 to-purple-900 text-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Transform Your Startup?
            </h2>
            <p className="text-xl text-violet-100 max-w-2xl mx-auto">
              Join thousands of startups already using our platform
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Mail className="w-6 h-6" />
                <div>
                  <div className="font-semibold">Email</div>
                  <div className="text-violet-200">hello@example.com</div>
                </div>
              </div>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <Twitter className="w-6 h-6" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <Github className="w-6 h-6" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <Linkedin className="w-6 h-6" />
                </a>
              </div>
            </div>

            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white placeholder-violet-200 focus:outline-none focus:border-white/40"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white placeholder-violet-200 focus:outline-none focus:border-white/40"
                />
              </div>
              <input
                type="text"
                placeholder="Company"
                className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white placeholder-violet-200 focus:outline-none focus:border-white/40"
              />
              <textarea
                placeholder="Tell us about your startup..."
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white placeholder-violet-200 focus:outline-none focus:border-white/40"
              ></textarea>
              <button
                type="submit"
                className="w-full px-8 py-4 bg-white text-violet-900 font-semibold rounded-xl [@media(hover:hover)]:hover:bg-violet-50 transition-colors flex items-center justify-center gap-2"
              >
                Join the Revolution
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-2xl font-bold bg-linear-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent mb-4">
              saas-product-launch-1
            </div>
            <p className="text-slate-400 mb-6">
              Building the future, one startup at a time
            </p>
            <div className="text-sm text-slate-500">
              © {new Date().getFullYear()} saas-product-launch-1. All rights
              reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
