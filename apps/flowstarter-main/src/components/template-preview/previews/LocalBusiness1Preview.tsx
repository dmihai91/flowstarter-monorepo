import {
  Award,
  Calendar,
  ChefHat,
  Clock,
  Coffee,
  Facebook,
  Heart,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Star,
  Users,
  Utensils,
  Wine,
} from 'lucide-react';

export default function LocalBusiness1Preview() {
  return (
    <div className="min-h-screen bg-gray-50 dark:from-zinc-900 dark:to-zinc-800">
      {/* Navigation */}
      <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-zinc-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              local-business-1
            </div>
            <div className="hidden md:flex space-x-8">
              <a
                href="#about"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-900 dark:[@media(hover:hover)]:hover:text-white transition-colors"
              >
                About
              </a>
              <a
                href="#menu"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-slate-900 dark:[@media(hover:hover)]:hover:text-white transition-colors"
              >
                Menu
              </a>
              <a
                href="#location"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-amber-600 dark:[@media(hover:hover)]:hover:text-amber-400 transition-colors"
              >
                Location
              </a>
              <a
                href="#contact"
                className="text-slate-600 dark:text-slate-300 [@media(hover:hover)]:hover:text-amber-600 dark:[@media(hover:hover)]:hover:text-amber-400 transition-colors"
              >
                Contact
              </a>
            </div>
            <button className="bg-linear-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-full [@media(hover:hover)]:hover:from-amber-600 [@media(hover:hover)]:hover:to-orange-600 transition-all hidden md:block">
              Reserve Table
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Restaurant */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-amber-400/20 to-orange-400/20 dark:from-amber-600/30 dark:to-orange-600/30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-sm font-medium">
                  <ChefHat className="w-4 h-4 mr-2" />
                  Authentic Cuisine
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
                  Experience
                  <span className="bg-linear-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    Flavors
                  </span>
                  That Tell Stories
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                  Fresh ingredients, traditional recipes, and a warm atmosphere
                  where every meal becomes a cherished memory.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="inline-flex items-center px-8 py-4 bg-linear-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-full [@media(hover:hover)]:hover:from-amber-700 [@media(hover:hover)]:hover:to-orange-700 transition-all transform [@media(hover:hover)]:hover:scale-105 shadow-lg">
                  View Menu
                  <Utensils className="ml-2 w-5 h-5" />
                </button>
                <button className="inline-flex items-center px-8 py-4 border-2 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 font-semibold rounded-full [@media(hover:hover)]:hover:bg-amber-50 dark:[@media(hover:hover)]:hover:bg-amber-900/50 transition-all">
                  <Calendar className="mr-2 w-5 h-5" />
                  Make Reservation
                </button>
              </div>

              <div className="flex items-center space-x-8 pt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    15+
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Years Experience
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    5000+
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Happy Customers
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-4 h-4 fill-amber-400 text-amber-400"
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
                <div className="aspect-square bg-linear-to-br from-amber-600 to-orange-700 rounded-2xl flex items-center justify-center">
                  <ChefHat className="w-24 h-24 text-white" />
                </div>
                <div className="absolute -top-4 -right-4 bg-green-400 rounded-full p-4">
                  <Coffee className="w-6 h-6 text-green-900" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-red-400 rounded-full p-4">
                  <Wine className="w-6 h-6 text-red-900" />
                </div>
              </div>
              <div className="absolute inset-0 bg-linear-to-r from-amber-400/20 to-orange-400/20 rounded-xl -rotate-6 -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Highlights */}
      <section id="menu" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Today's Specials
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Handcrafted dishes made with love and the finest ingredients
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: 'Signature Pasta',
                description: 'Fresh handmade pasta with our secret sauce',
                price: '$24',
                category: 'Main Course',
              },
              {
                name: 'Grilled Salmon',
                description: 'Atlantic salmon with seasonal vegetables',
                price: '$28',
                category: 'Seafood',
              },
              {
                name: 'Artisan Pizza',
                description: 'Wood-fired pizza with premium toppings',
                price: '$22',
                category: 'Pizza',
              },
              {
                name: "Chef's Salad",
                description: 'Mixed greens with house-made dressing',
                price: '$16',
                category: 'Salads',
              },
              {
                name: 'Tiramisu',
                description: 'Traditional Italian dessert',
                price: '$12',
                category: 'Desserts',
              },
              {
                name: 'Wine Selection',
                description: 'Curated wines from local vineyards',
                price: '$8-15',
                category: 'Beverages',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="group bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl p-6 [@media(hover:hover)]:hover:shadow-xl transition-all"
              >
                <div className="aspect-square bg-linear-to-br from-amber-200 to-orange-200 dark:from-amber-800 dark:to-orange-800 rounded-xl mb-4 flex items-center justify-center">
                  <Utensils className="w-12 h-12 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="mb-2">
                  <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full">
                    {item.category}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {item.name}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  {item.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {item.price}
                  </span>
                  <button className="text-amber-600 dark:text-amber-400 [@media(hover:hover)]:hover:text-amber-700 dark:[@media(hover:hover)]:hover:text-amber-300">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="bg-linear-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-full [@media(hover:hover)]:hover:from-amber-600 [@media(hover:hover)]:hover:to-orange-600 transition-all font-semibold">
              View Full Menu
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="py-20 bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-900/50 dark:to-orange-900/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
                Our Story & Passion for Great Food
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                For over 15 years, we've been serving our community with
                authentic flavors and warm hospitality. Our family recipes
                passed down through generations create the perfect dining
                experience.
              </p>
              <div className="space-y-4">
                {[
                  'Fresh, locally-sourced ingredients',
                  'Traditional recipes with modern touches',
                  'Warm, welcoming atmosphere',
                  'Award-winning chef and team',
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-linear-to-r from-amber-500 to-orange-500 rounded-full"></div>
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
                  <div className="aspect-square bg-linear-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
                    <ChefHat className="w-8 h-8 text-white" />
                  </div>
                  <div className="aspect-square bg-linear-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                    <Coffee className="w-8 h-8 text-white" />
                  </div>
                  <div className="aspect-square bg-linear-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center">
                    <Wine className="w-8 h-8 text-white" />
                  </div>
                  <div className="aspect-square bg-linear-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location & Hours */}
      <section id="location" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Visit Us Today
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              We're conveniently located in the heart of the city
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  Restaurant Information
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-linear-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        Address
                      </h4>
                      <p className="text-slate-600 dark:text-slate-300">
                        123 Main Street
                        <br />
                        Downtown District, City 12345
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-linear-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        Phone
                      </h4>
                      <p className="text-slate-600 dark:text-slate-300">
                        +1 (555) 123-4567
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-linear-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        Hours
                      </h4>
                      <div className="text-slate-600 dark:text-slate-300">
                        <p>Mon-Thu: 11:00 AM - 10:00 PM</p>
                        <p>Fri-Sat: 11:00 AM - 11:00 PM</p>
                        <p>Sun: 12:00 PM - 9:00 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-8 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-slate-500 dark:text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-300">
                  Interactive map would be embedded here
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Reservation */}
      <section
        id="contact"
        className="py-20 bg-linear-to-r from-amber-900 to-orange-900 text-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Make a Reservation
            </h2>
            <p className="text-xl text-amber-100 max-w-2xl mx-auto">
              Book your table today and experience exceptional dining
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
                    <div className="font-semibold">Call for Reservations</div>
                    <div className="text-amber-200">+1 (555) 123-4567</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Email</div>
                    <div className="text-amber-200">
                      reservations@example.com
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Group Reservations</div>
                    <div className="text-amber-200">
                      For parties of 8 or more
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
                  className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white placeholder-amber-200 focus:outline-none focus:border-white/40"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white placeholder-amber-200 focus:outline-none focus:border-white/40"
                />
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white focus:outline-none focus:border-white/40"
                />
                <input
                  type="time"
                  className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white focus:outline-none focus:border-white/40"
                />
                <select className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white focus:outline-none focus:border-white/40">
                  <option value="" disabled selected>
                    Party Size
                  </option>
                  <option value="1">1 Person</option>
                  <option value="2">2 People</option>
                  <option value="3">3 People</option>
                  <option value="4">4 People</option>
                  <option value="5+">5+ People</option>
                </select>
              </div>
              <textarea
                placeholder="Special requests or dietary restrictions..."
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-white placeholder-amber-200 focus:outline-none focus:border-white/40"
              ></textarea>
              <button
                type="submit"
                className="w-full px-8 py-4 bg-white text-amber-900 font-semibold rounded-xl [@media(hover:hover)]:hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
              >
                Reserve Your Table
                <Calendar className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-2xl font-bold bg-linear-to-r from-amber-600 to-orange-700 bg-clip-text text-transparent mb-4">
              local-business-1
            </div>
            <p className="text-slate-400 mb-6">
              Where every meal tells a story
            </p>
            <div className="text-sm text-slate-500">
              © {new Date().getFullYear()} local-business-1. All rights
              reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
