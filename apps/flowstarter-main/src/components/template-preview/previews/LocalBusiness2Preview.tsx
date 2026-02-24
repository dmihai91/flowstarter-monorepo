import {
  Award,
  Calendar,
  Car,
  CheckCircle,
  Clock,
  Facebook,
  Heart,
  Home,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Scissors,
  Send,
  Star,
  Users,
  Wrench,
} from 'lucide-react';

export default function LocalBusiness2Preview() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-[var(--purple)]/5 to-[var(--purple)]/5 dark:from-blue-900 dark:via-[var(--purple)] dark:to-[var(--purple)]">
      {/* Navigation */}
      <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-blue-200 dark:border-blue-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="text-2xl font-bold bg-linear-to-r from-blue-600 to-[var(--purple)] bg-clip-text text-transparent">
              local-business-2
            </div>
            <div className="hidden md:flex space-x-8">
              <a
                href="#about"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-700 dark:[@media(hover:hover)]:hover:text-blue-400 transition-colors"
              >
                About
              </a>
              <a
                href="#services"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-700 dark:[@media(hover:hover)]:hover:text-blue-400 transition-colors"
              >
                Services
              </a>
              <a
                href="#testimonials"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-700 dark:[@media(hover:hover)]:hover:text-blue-400 transition-colors"
              >
                Reviews
              </a>
              <a
                href="#contact"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-700 dark:[@media(hover:hover)]:hover:text-blue-400 transition-colors"
              >
                Contact
              </a>
            </div>
            <button className="bg-linear-to-r from-blue-500 to-[var(--purple)] text-white px-6 py-2 rounded-full [@media(hover:hover)]:hover:from-blue-600 [@media(hover:hover)]:hover:to-[var(--purple)] transition-all hidden md:block">
              Book Now
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-blue-400/20 to-[var(--purple)]/20 dark:from-blue-600/30 dark:to-[var(--purple)]/30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm font-medium">
                  <Award className="w-4 h-4 mr-2" />
                  Professional Service
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
                  Quality
                  <span className="bg-linear-to-r from-blue-600 to-[var(--purple)] bg-clip-text text-transparent">
                    Service
                  </span>
                  You Can Trust
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                  Expert craftsmanship and reliable service for all your needs,
                  backed by years of experience and satisfied customers.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="inline-flex items-center px-8 py-4 bg-linear-to-r from-blue-600 to-[var(--purple)] text-white font-semibold rounded-full [@media(hover:hover)]:hover:from-blue-700 [@media(hover:hover)]:hover:to-[var(--purple)] transition-all transform [@media(hover:hover)]:hover:scale-105 shadow-lg">
                  Book Service
                  <Calendar className="ml-2 w-5 h-5" />
                </button>
                <button className="inline-flex items-center px-8 py-4 border-2 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 font-semibold rounded-full [@media(hover:hover)]:hover:bg-blue-50 dark:[@media(hover:hover)]:hover:bg-blue-900/50 transition-all">
                  <Phone className="mr-2 w-5 h-5" />
                  Call Us
                </button>
              </div>

              <div className="flex items-center space-x-8 pt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    10+
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Years Experience
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    500+
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Happy Clients
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-4 h-4 fill-blue-400 text-blue-400"
                      />
                    ))}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    4.9 Rating
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative bg-white dark:bg-slate-800 rounded-xl p-8 shadow-2xl">
                <div className="aspect-square bg-linear-to-br from-blue-400 to-[var(--purple)]/40 rounded-2xl flex items-center justify-center">
                  <Wrench className="w-24 h-24 text-white" />
                </div>
                <div className="absolute -top-4 -right-4 bg-green-400 rounded-full p-4">
                  <CheckCircle className="w-6 h-6 text-green-900" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-orange-400 rounded-full p-4">
                  <Award className="w-6 h-6 text-orange-900" />
                </div>
              </div>
              <div className="absolute inset-0 bg-linear-to-r from-blue-400/20 to-[var(--purple)]/20 rounded-xl -rotate-6 -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Our Services
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Professional services tailored to your needs with guaranteed
              satisfaction
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Scissors,
                title: 'Hair & Beauty',
                description:
                  'Professional styling, cuts, and beauty treatments',
                price: 'From $30',
              },
              {
                icon: Car,
                title: 'Auto Repair',
                description: 'Complete automotive service and repair solutions',
                price: 'From $50',
              },
              {
                icon: Home,
                title: 'Home Services',
                description: 'Maintenance, repairs, and improvement services',
                price: 'From $40',
              },
              {
                icon: Wrench,
                title: 'General Repair',
                description: 'Fix and maintenance for various equipment',
                price: 'From $35',
              },
              {
                icon: Users,
                title: 'Consultation',
                description: 'Expert advice and professional guidance',
                price: 'From $60',
              },
              {
                icon: Award,
                title: 'Premium Service',
                description: 'Top-tier service with extended warranty',
                price: 'From $80',
              },
            ].map((service, index) => (
              <div
                key={index}
                className="group bg-linear-to-br from-blue-50 to-[var(--purple)]/5 dark:from-blue-900/30 dark:to-[var(--purple)]/30 rounded-2xl p-6 [@media(hover:hover)]:hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-linear-to-r from-blue-500 to-[var(--purple)] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <service.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {service.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  {service.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-700 dark:text-blue-400">
                    {service.price}
                  </span>
                  <button className="text-slate-700 dark:text-blue-400 [@media(hover:hover)]:hover:text-blue-700 dark:[@media(hover:hover)]:hover:text-blue-300">
                    Book Now →
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
        className="py-20 bg-linear-to-r from-blue-50 to-[var(--purple)]/5 dark:from-blue-900/50 dark:to-[var(--purple)]/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
                Why Choose Our Professional Services?
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                With over 10 years of experience serving our community, we pride
                ourselves on delivering exceptional service quality and customer
                satisfaction.
              </p>
              <div className="space-y-4">
                {[
                  'Licensed and insured professionals',
                  '100% satisfaction guarantee',
                  'Competitive pricing with no hidden fees',
                  'Same-day and emergency services available',
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-700 dark:text-slate-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-square bg-linear-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <div className="aspect-square bg-linear-to-br from-[var(--purple)]/40 to-[var(--purple)] rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div className="aspect-square bg-linear-to-br from-[var(--purple)]/40 to-[var(--purple)] rounded-xl flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="aspect-square bg-linear-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              What Our Clients Say
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Real feedback from satisfied customers in our community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Johnson',
                service: 'Hair Styling',
                rating: 5,
                comment:
                  'Absolutely amazing service! The team is professional and the results exceeded my expectations.',
              },
              {
                name: 'Mike Chen',
                service: 'Auto Repair',
                rating: 5,
                comment:
                  'Quick, reliable, and honest. Fixed my car issue the same day at a fair price.',
              },
              {
                name: 'Lisa Williams',
                service: 'Home Maintenance',
                rating: 5,
                comment:
                  "They've been maintaining our home for 3 years. Always dependable and high quality work.",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-linear-to-br from-blue-50 to-[var(--purple)]/5 dark:from-blue-900/30 dark:to-[var(--purple)]/30 rounded-2xl p-6"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-4 h-4 fill-blue-400 text-blue-400"
                    />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4 italic">
                  "{testimonial.comment}"
                </p>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-slate-700 dark:text-blue-400">
                    {testimonial.service}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Booking */}
      <section
        id="contact"
        className="py-20 bg-linear-to-r from-blue-900 to-[var(--purple)] text-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Book Your Service?
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Contact us today for a free quote or to schedule your appointment
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Call Us</div>
                    <div className="text-blue-200">+1 (555) 123-4567</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Email</div>
                    <div className="text-blue-200">service@example.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Location</div>
                    <div className="text-blue-200">
                      123 Service St, City 12345
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Hours</div>
                    <div className="text-blue-200">
                      Mon-Fri: 8AM-6PM
                      <br />
                      Sat: 9AM-4PM
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center [@media(hover:hover)]:hover:bg-white/30 transition-colors"
                >
                  <Facebook className="w-6 h-6" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center [@media(hover:hover)]:hover:bg-white/30 transition-colors"
                >
                  <Instagram className="w-6 h-6" />
                </a>
              </div>
            </div>

            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:border-white/40"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:border-white/40"
                />
              </div>
              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:border-white/40"
              />
              <select className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white focus:outline-none focus:border-white/40">
                <option value="" disabled selected>
                  Select Service
                </option>
                <option value="hair">Hair & Beauty</option>
                <option value="auto">Auto Repair</option>
                <option value="home">Home Services</option>
                <option value="repair">General Repair</option>
                <option value="consultation">Consultation</option>
              </select>
              <textarea
                placeholder="Describe your service needs..."
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:border-white/40"
              ></textarea>
              <button
                type="submit"
                className="w-full px-8 py-4 bg-white text-blue-900 font-semibold rounded-xl [@media(hover:hover)]:hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                Request Service Quote
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
            <div className="text-2xl font-bold bg-linear-to-r from-blue-400 to-[var(--purple)]/40 bg-clip-text text-transparent mb-4">
              local-business-2
            </div>
            <p className="text-slate-400 mb-6">
              Professional service you can trust
            </p>
            <div className="text-sm text-slate-500">
              © {new Date().getFullYear()} local-business-2. All rights
              reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
