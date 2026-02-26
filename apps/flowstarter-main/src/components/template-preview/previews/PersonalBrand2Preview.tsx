import {
  Camera,
  Dribbble,
  ExternalLink,
  Eye,
  Globe,
  Heart,
  Instagram,
  Mail,
  MapPin,
  Palette,
  Phone,
  Play,
  Send,
  Sparkles,
} from 'lucide-react';

export default function PersonalBrand2Preview() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-gray-50 to-stone-50 dark:from-[var(--purple)] dark:via-pink-900 dark:to-orange-900">
      {/* Navigation */}
      <nav className="bg-white/90 dark:bg-black/80 backdrop-blur-xl border-b border-[var(--purple)]/20 dark:border-[var(--purple)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="text-2xl font-bold bg-linear-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent">
              personal-brand-2
            </div>
            <div className="hidden md:flex space-x-8">
              <a
                href="#about"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-700 dark:[@media(hover:hover)]:hover:text-[var(--purple)]/40 transition-colors"
              >
                About
              </a>
              <a
                href="#portfolio"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-700 dark:[@media(hover:hover)]:hover:text-[var(--purple)]/40 transition-colors"
              >
                Portfolio
              </a>
              <a
                href="#services"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-700 dark:[@media(hover:hover)]:hover:text-[var(--purple)]/40 transition-colors"
              >
                Services
              </a>
              <a
                href="#contact"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-700 dark:[@media(hover:hover)]:hover:text-[var(--purple)]/40 transition-colors"
              >
                Contact
              </a>
            </div>
            <button className="md:hidden text-slate-600 dark:text-slate-300">
              <div className="w-6 h-6">☰</div>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Creative */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-[var(--purple)]/40/20 to-pink-400/20 dark:from-[var(--purple)]/30 dark:to-pink-600/30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-[var(--purple)]/10 dark:bg-[var(--purple)]/50 text-[var(--purple)] dark:text-[var(--purple)]/30 text-sm font-medium">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Creative Professional
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
                  Bringing
                  <span className="bg-linear-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent">
                    Ideas
                  </span>
                  to Life
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                  I transform concepts into stunning visual experiences that
                  captivate and inspire.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="inline-flex items-center px-8 py-4 bg-linear-to-r from-slate-700 to-slate-800 text-white font-semibold rounded-full [@media(hover:hover)]:hover:from-[var(--purple)] [@media(hover:hover)]:hover:to-pink-700 transition-all transform [@media(hover:hover)]:hover:scale-105 shadow-lg">
                  View My Work
                  <Eye className="ml-2 w-5 h-5" />
                </button>
                <button className="inline-flex items-center px-8 py-4 border-2 border-[var(--purple)]/30 dark:border-[var(--purple)] text-[var(--purple)] dark:text-[var(--purple)]/30 font-semibold rounded-full [@media(hover:hover)]:hover:bg-[var(--purple)]/5 dark:[@media(hover:hover)]:hover:bg-[var(--purple)]/50 transition-all">
                  <Play className="mr-2 w-5 h-5" />
                  Watch Showreel
                </button>
              </div>

              <div className="flex items-center space-x-6 pt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    500+
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Projects
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    50+
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Happy Clients
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    5+
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Years Experience
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative bg-white dark:bg-slate-800 rounded-xl p-8 shadow-2xl">
                <div className="aspect-square bg-linear-to-br from-[var(--purple)]/40 to-pink-400 rounded-2xl flex items-center justify-center">
                  <Palette className="w-24 h-24 text-white" />
                </div>
                <div className="absolute -top-4 -right-4 bg-yellow-400 rounded-full p-4">
                  <Sparkles className="w-6 h-6 text-yellow-900" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-blue-400 rounded-full p-4">
                  <Camera className="w-6 h-6 text-blue-900" />
                </div>
              </div>
              <div className="absolute inset-0 bg-linear-to-r from-[var(--purple)]/40/20 to-pink-400/20 rounded-xl -rotate-6 -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Showcase */}
      <section id="portfolio" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Featured Work
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              A collection of my recent projects showcasing creativity and
              innovation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="group relative overflow-hidden rounded-2xl bg-linear-to-br from-[var(--purple)]/10 to-pink-100 dark:from-[var(--purple)]/50 dark:to-pink-900/50 aspect-square"
              >
                <div className="absolute inset-0 bg-linear-to-br from-[var(--purple)]/40 to-pink-400 opacity-20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Eye className="w-12 h-12 text-slate-700 dark:text-[var(--purple)]/40" />
                </div>
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button className="text-white flex items-center gap-2">
                    <ExternalLink className="w-5 h-5" />
                    View Project
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="py-20 bg-linear-to-r from-[var(--purple)]/5 to-pink-50 dark:from-[var(--purple)]/50 dark:to-pink-900/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
                Creative Vision Meets Technical Excellence
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                With over 5 years of experience in creative design, I specialize
                in crafting unique visual experiences that tell compelling
                stories and drive engagement.
              </p>
              <div className="space-y-4">
                {[
                  'Brand Identity & Logo Design',
                  'UI/UX Design & Prototyping',
                  'Digital Art & Illustration',
                  'Photography & Video Production',
                ].map((skill, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-linear-to-r from-[var(--purple)] to-pink-500 rounded-full"></div>
                    <span className="text-slate-700 dark:text-slate-300">
                      {skill}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-square bg-linear-to-br from-[var(--purple)]/40 to-[var(--purple)] rounded-xl flex items-center justify-center">
                    <Palette className="w-8 h-8 text-white" />
                  </div>
                  <div className="aspect-square bg-linear-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <div className="aspect-square bg-linear-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                  <div className="aspect-square bg-linear-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Creative Services
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Comprehensive creative solutions to bring your vision to life
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Palette,
                title: 'Brand Design',
                description:
                  'Complete brand identity design including logos, color schemes, and brand guidelines.',
              },
              {
                icon: Camera,
                title: 'Photography',
                description:
                  'Professional photography services for products, portraits, and creative concepts.',
              },
              {
                icon: Eye,
                title: 'UI/UX Design',
                description:
                  'User-centered design for websites and mobile applications that convert.',
              },
              {
                icon: Sparkles,
                title: 'Digital Art',
                description:
                  'Custom digital illustrations and artwork for various media and platforms.',
              },
              {
                icon: Play,
                title: 'Video Production',
                description:
                  'Creative video content including animations, commercials, and social media.',
              },
              {
                icon: Heart,
                title: 'Creative Direction',
                description:
                  'Strategic creative guidance for campaigns and brand experiences.',
              },
            ].map((service, index) => (
              <div
                key={index}
                className="group p-8 bg-linear-to-br from-[var(--purple)]/5 to-pink-50 dark:from-[var(--purple)]/30 dark:to-pink-900/30 rounded-2xl [@media(hover:hover)]:hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-linear-to-r from-[var(--purple)] to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <service.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  {service.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="py-20 bg-linear-to-r from-[var(--purple)] to-pink-900 text-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Let's Create Something Amazing
            </h2>
            <p className="text-xl text-[var(--purple)]/10 max-w-2xl mx-auto">
              Ready to bring your creative vision to life? Let's discuss your
              project.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Email</div>
                    <div className="text-[var(--purple)]/20">
                      hello@example.com
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Phone</div>
                    <div className="text-[var(--purple)]/20">
                      +1 (555) 123-4567
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Location</div>
                    <div className="text-[var(--purple)]/20">
                      Creative Studio, City
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center [@media(hover:hover)]:hover:bg-white/30 transition-colors"
                >
                  <Instagram className="w-6 h-6" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center [@media(hover:hover)]:hover:bg-white/30 transition-colors"
                >
                  <Dribbble className="w-6 h-6" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center [@media(hover:hover)]:hover:bg-white/30 transition-colors"
                >
                  <Globe className="w-6 h-6" />
                </a>
              </div>
            </div>

            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white placeholder-[var(--purple)]/20 focus:outline-none focus:border-white/40"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white placeholder-[var(--purple)]/20 focus:outline-none focus:border-white/40"
                />
              </div>
              <input
                type="text"
                placeholder="Project Type"
                className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white placeholder-[var(--purple)]/20 focus:outline-none focus:border-white/40"
              />
              <textarea
                placeholder="Tell me about your creative vision..."
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white placeholder-[var(--purple)]/20 focus:outline-none focus:border-white/40"
              ></textarea>
              <button
                type="submit"
                className="w-full px-8 py-4 bg-white text-[var(--purple)] font-semibold rounded-xl [@media(hover:hover)]:hover:bg-[var(--purple)]/5 transition-colors flex items-center justify-center gap-2"
              >
                Start Our Creative Journey
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
            <div className="text-2xl font-bold bg-linear-to-r from-[var(--purple)]/40 to-pink-400 bg-clip-text text-transparent mb-4">
              personal-brand-2
            </div>
            <p className="text-slate-400 mb-6">
              Creating beautiful experiences, one project at a time.
            </p>
            <div className="text-sm text-slate-500">
              © {new Date().getFullYear()} personal-brand-2. All rights
              reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
