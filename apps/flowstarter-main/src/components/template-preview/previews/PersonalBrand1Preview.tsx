import {
  ArrowRight,
  Award,
  Calendar,
  CheckCircle,
  ExternalLink,
  Github,
  Lightbulb,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Play,
  Quote,
  Rocket,
  Send,
  Star,
  Target,
  TrendingUp,
  Twitter,
  Users,
} from 'lucide-react';

export default function PersonalBrand1Preview() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-800">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              personal-brand-1
            </div>
            <div className="hidden md:flex space-x-8">
              <a
                href="#about"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-900 dark:[@media(hover:hover)]:hover:text-white transition-colors"
              >
                About
              </a>
              <a
                href="#services"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-900 dark:[@media(hover:hover)]:hover:text-white transition-colors"
              >
                Services
              </a>
              <a
                href="#testimonials"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-900 dark:[@media(hover:hover)]:hover:text-white transition-colors"
              >
                Testimonials
              </a>
              <a
                href="#contact"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-900 dark:[@media(hover:hover)]:hover:text-white transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Star className="h-4 w-4" />
                Professional Consultant & Expert
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
                Build Your
                <span className="bg-linear-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent">
                  Dream Business
                </span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-lg">
                - Expert consulting services to help entrepreneurs and small
                business owners achieve sustainable growth and success.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button className="bg-slate-900 dark:bg-white [@media(hover:hover)]:hover:bg-slate-800 dark:[@media(hover:hover)]:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold py-4 px-8 rounded-xl transition duration-300 flex items-center justify-center">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                <button className="bg-white dark:bg-zinc-800 [@media(hover:hover)]:hover:bg-slate-50 dark:[@media(hover:hover)]:hover:bg-zinc-700 text-slate-900 dark:text-white font-semibold py-4 px-8 rounded-xl border border-slate-300 dark:border-zinc-600 transition duration-300 flex items-center justify-center">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </button>
              </div>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white dark:border-zinc-800"></div>
                    <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white dark:border-zinc-800"></div>
                    <div className="w-8 h-8 bg-[var(--purple)] rounded-full border-2 border-white dark:border-zinc-800"></div>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    500+ Happy Clients
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                  <span className="text-sm text-slate-600 dark:text-slate-300 ml-1">
                    4.9/5 Rating
                  </span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-linear-to-br from-blue-100 to-[var(--purple)]/10 dark:from-blue-950/50 dark:to-[var(--purple)]/50 rounded-2xl p-8 h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-slate-200 dark:bg-zinc-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-12 w-12 text-slate-500 dark:text-slate-300" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    Professional headshot or video would go here
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-lg border dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <Award className="h-8 w-8 text-slate-700 dark:text-blue-400" />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      10+ Years
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      Experience
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                500+
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                Projects Completed
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                98%
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                Client Satisfaction
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                50+
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                Industry Awards
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                24/7
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                Support Available
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-zinc-800"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
                About personal-brand-1
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                With over 10 years of experience in business consulting, I've
                helped hundreds of entrepreneurs and small business owners
                transform their ideas into thriving businesses.
              </p>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
                My mission is focused on
                {
                  'growing your online presence and converting visitors into customers'
                }
                while providing exceptional value to entrepreneurs and small
                business owners.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-200">
                    Certified Business Strategy Expert
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-200">
                    10+ Years Industry Experience
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-200">
                    Client-Focused Approach
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-200">
                    Proven Results & ROI
                  </span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-linear-to-br from-slate-100 to-slate-200 dark:from-zinc-700 dark:to-zinc-600 rounded-2xl p-8 h-96 flex items-center justify-center">
                <div className="text-center">
                  <Target className="h-16 w-16 text-slate-500 dark:text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-300">
                    About image or infographic would go here
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills & Experience */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Skills & Expertise
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Proven track record in delivering exceptional results across
              multiple industries
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 p-6 rounded-xl border dark:border-blue-800">
              <Lightbulb className="h-10 w-10 text-slate-700 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                Strategy Development
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Creating comprehensive business strategies that drive growth and
                innovation.
              </p>
              <div className="bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full w-[95%]"></div>
              </div>
              <div className="text-sm text-slate-700 dark:text-blue-400 font-medium mt-2">
                95% Success Rate
              </div>
            </div>
            <div className="bg-linear-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 p-6 rounded-xl border dark:border-green-800">
              <TrendingUp className="h-10 w-10 text-green-600 dark:text-green-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                Growth Optimization
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Identifying and implementing growth opportunities for
                sustainable success.
              </p>
              <div className="bg-green-200 dark:bg-green-800 rounded-full h-2">
                <div className="bg-green-600 dark:bg-green-400 h-2 rounded-full w-[92%]"></div>
              </div>
              <div className="text-sm text-green-600 dark:text-green-400 font-medium mt-2">
                92% Success Rate
              </div>
            </div>
            <div className="bg-linear-to-br from-[var(--purple)]/5 to-[var(--purple)]/10 dark:from-[var(--purple)]/50 dark:to-[var(--purple)]/50 p-6 rounded-xl border dark:border-[var(--purple)]">
              <Users className="h-10 w-10 text-slate-700 dark:text-[var(--purple)]/40 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                Team Leadership
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Building and leading high-performance teams that deliver
                results.
              </p>
              <div className="bg-[var(--purple)]/20 dark:bg-[var(--purple)] rounded-full h-2">
                <div className="bg-[var(--purple)] dark:bg-[var(--purple)]/40 h-2 rounded-full w-[98%]"></div>
              </div>
              <div className="text-sm text-slate-700 dark:text-[var(--purple)]/40 font-medium mt-2">
                98% Success Rate
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section
        id="services"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-zinc-800"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              My Services
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Comprehensive consulting solutions designed specifically for
              entrepreneurs and small business owners
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm [@media(hover:hover)]:hover:shadow-lg transition-shadow border border-slate-100 dark:border-zinc-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mb-6">
                <Lightbulb className="h-6 w-6 text-slate-700 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Business Strategy
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Develop comprehensive business strategies that drive growth and
                maximize your competitive advantage.
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Market Analysis
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Growth Planning
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Risk Assessment
                </li>
              </ul>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm [@media(hover:hover)]:hover:shadow-lg transition-shadow border border-slate-100 dark:border-zinc-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mb-6">
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Digital Marketing
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Create powerful digital marketing campaigns that convert
                visitors into loyal customers.
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  SEO Optimization
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Social Media Strategy
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Content Marketing
                </li>
              </ul>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm [@media(hover:hover)]:hover:shadow-lg transition-shadow border border-slate-100 dark:border-zinc-700">
              <div className="w-12 h-12 bg-[var(--purple)]/10 dark:bg-[var(--purple)] rounded-xl flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-slate-700 dark:text-[var(--purple)]/40" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Team Building
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Build high-performing teams that drive results and create
                lasting business value.
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Leadership Training
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Team Optimization
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Culture Development
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio/Work Showcase */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Featured Work
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Success stories from recent client partnerships
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((project) => (
              <div
                key={project}
                className="group bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm [@media(hover:hover)]:hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-zinc-700"
              >
                <div className="bg-linear-to-br from-blue-100 to-[var(--purple)]/10 dark:from-blue-950/50 dark:to-[var(--purple)]/50 h-48 flex items-center justify-center">
                  <div className="text-center">
                    <Rocket className="h-12 w-12 text-slate-500 dark:text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 dark:text-slate-300 text-sm">
                      Project Screenshot
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Client Success Story {project}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    Transformed business operations and achieved 200% growth in
                    6 months.
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                        200% Growth
                      </span>
                    </div>
                    <button className="text-slate-700 dark:text-blue-400 [@media(hover:hover)]:hover:text-blue-700 dark:[@media(hover:hover)]:hover:text-blue-300 text-sm font-medium flex items-center gap-1">
                      View Case Study
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-zinc-800"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              What Clients Say
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Real feedback from entrepreneurs and small business owners who've
              transformed their businesses
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((testimonial) => (
              <div
                key={testimonial}
                className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border dark:border-zinc-700"
              >
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <Quote className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  "Working with this consultant transformed our business
                  completely. The strategies were practical and results were
                  immediate."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-zinc-700 rounded-full mr-3"></div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      Sarah Johnson
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      CEO, TechStart
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-zinc-900"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Let's Work Together
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Ready to transform your business? Let's discuss how we can help
              you achieve
              {
                'growing your online presence and converting visitors into customers'
              }
              and converting visitors into customers.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mr-4">
                  <Mail className="h-6 w-6 text-slate-700 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    Email
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    hello@personal-brand-1.com
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mr-4">
                  <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    Phone
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    +1 (555) 123-4567
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[var(--purple)]/10 dark:bg-[var(--purple)] rounded-xl flex items-center justify-center mr-4">
                  <MapPin className="h-6 w-6 text-slate-700 dark:text-[var(--purple)]/40" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    Location
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    San Francisco, CA
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center mr-4">
                  <Calendar className="h-6 w-6 text-amber-700 dark:text-orange-400" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    Schedule
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    Book a free consultation
                  </div>
                </div>
              </div>
            </div>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 focus:border-slate-900 dark:focus:border-blue-500 outline-none transition-colors bg-white dark:bg-zinc-800 text-slate-900 dark:text-white"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 focus:border-slate-900 dark:focus:border-blue-500 outline-none transition-colors bg-white dark:bg-zinc-800 text-slate-900 dark:text-white"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 focus:border-slate-900 dark:focus:border-blue-500 outline-none transition-colors bg-white dark:bg-zinc-800 text-slate-900 dark:text-white"
                  placeholder="How can I help you?"
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 focus:border-slate-900 dark:focus:border-blue-500 outline-none transition-colors resize-none bg-white dark:bg-zinc-800 text-slate-900 dark:text-white"
                  placeholder="Tell me about your project and goals..."
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 dark:bg-blue-600 [@media(hover:hover)]:hover:bg-slate-800 dark:[@media(hover:hover)]:hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition duration-300 flex items-center justify-center"
              >
                <Send className="mr-2 h-5 w-5" />
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900 dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Stay Updated with Industry Insights
          </h2>
          <p className="text-slate-300 dark:text-slate-400 mb-8 text-lg">
            Get weekly tips, strategies, and success stories delivered to your
            inbox
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-600 dark:border-zinc-700 bg-slate-800 dark:bg-zinc-800 text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <button className="bg-blue-600 [@media(hover:hover)]:hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-300">
              Subscribe
            </button>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-4">
            No spam. Unsubscribe at any time.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-zinc-950 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">personal-brand-1</h3>
              <p className="text-slate-400 dark:text-slate-500 mb-6 max-w-md">
                Expert consulting services helping entrepreneurs and small
                business owners achieve sustainable growth and success.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="w-10 h-10 bg-slate-800 dark:bg-zinc-800 rounded-xl flex items-center justify-center [@media(hover:hover)]:hover:bg-slate-700 dark:[@media(hover:hover)]:hover:bg-zinc-700 transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-slate-800 dark:bg-zinc-800 rounded-xl flex items-center justify-center [@media(hover:hover)]:hover:bg-slate-700 dark:[@media(hover:hover)]:hover:bg-zinc-700 transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-slate-800 dark:bg-zinc-800 rounded-xl flex items-center justify-center [@media(hover:hover)]:hover:bg-slate-700 dark:[@media(hover:hover)]:hover:bg-zinc-700 transition-colors"
                >
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-slate-400 dark:text-slate-500">
                <li>
                  <a
                    href="#"
                    className="[@media(hover:hover)]:hover:text-white transition-colors"
                  >
                    Business Strategy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="[@media(hover:hover)]:hover:text-white transition-colors"
                  >
                    Digital Marketing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="[@media(hover:hover)]:hover:text-white transition-colors"
                  >
                    Team Building
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="[@media(hover:hover)]:hover:text-white transition-colors"
                  >
                    Consulting
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 dark:text-slate-500">
                <li>
                  <a
                    href="#"
                    className="[@media(hover:hover)]:hover:text-white transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="[@media(hover:hover)]:hover:text-white transition-colors"
                  >
                    Portfolio
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="[@media(hover:hover)]:hover:text-white transition-colors"
                  >
                    Testimonials
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="[@media(hover:hover)]:hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 dark:border-zinc-800 mt-8 pt-8 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-sm">
              © {new Date().getFullYear()} personal-brand-1 All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
