'use client';

import { useProjectData } from '@/components/template-preview/TemplatePreview';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  Bath,
  Briefcase,
  Building2,
  CheckCircle,
  Clock,
  Flower2,
  Grid3X3,
  Hammer,
  Heart,
  Home,
  Mail,
  MapPin,
  Phone,
  Send,
  Sparkles,
  Star,
  TreeDeciduous,
  Users,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// Business type icons mapping
const BusinessIcons = {
  primary: Briefcase,
  secondary: Wrench,
  accent: Award,
};

export default function LocalBusinessProPreview() {
  const projectData = useProjectData();

  // Dynamic values from project data with fallbacks
  const projectName = projectData?.name || 'Local Business Pro';
  const projectDescription = projectData?.description || '{projectDescription}';
  const targetUsers = projectData?.targetUsers || '{targetUsers}';
  const projectSlug = projectName.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700">
        <nav className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-between items-center py-6"
            >
              <Link href="/" className="text-2xl font-bold text-white">
                {projectName}
              </Link>
              <div className="hidden md:flex space-x-8">
                <a
                  href="#about"
                  className="text-white/90 hover:text-white transition-colors"
                >
                  About
                </a>
                <a
                  href="#services"
                  className="text-white/90 hover:text-white transition-colors"
                >
                  Services
                </a>
                <a
                  href="#gallery"
                  className="text-white/90 hover:text-white transition-colors"
                >
                  Gallery
                </a>
                <a
                  href="#contact"
                  className="text-white/90 hover:text-white transition-colors"
                >
                  Contact
                </a>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <a
                  href="#contact"
                  className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg bg-gradient-to-tl from-lime-400 to-emerald-300 text-gray-900 hover:shadow-xl"
                >
                  Get a Quote
                </a>
              </motion.div>
            </motion.div>
          </div>
        </nav>

        <section className="relative pt-15 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="max-w-5xl mx-auto text-center relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 backdrop-blur-md bg-white/10 border border-white/40 px-4 py-2 rounded-full text-sm mb-8"
            >
              <Sparkles className="h-4 w-4 text-lime-300" />
              <span className="text-white/90">
                Trusted professionals since 2010
              </span>
              <ArrowRight className="h-4 w-4 text-white/90" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight"
            >
              Expert Solutions You Can Trust
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              {projectDescription} - Professional services delivered with
              excellence for {targetUsers}.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <motion.a
                href="#contact"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg bg-white text-emerald-600 hover:shadow-xl flex items-center justify-center"
              >
                Get a Quote
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.a>
              <motion.a
                href="#services"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg backdrop-blur-md bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 flex items-center justify-center"
              >
                <BusinessIcons.primary className="mr-2 h-5 w-5" />
                Our Services
              </motion.a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="flex items-center justify-center gap-12"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-white">14+</div>
                <div className="text-sm text-white/70">Years of Experience</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <div className="text-sm text-white/70">4.9/5 Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">5K+</div>
                <div className="text-sm text-white/70">Satisfied Clients</div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* Stats Section */}
      <section className="relative -mt-16 px-4 sm:px-6 lg:px-8 mb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                icon: BusinessIcons.primary,
                value: '200+',
                label: 'Projects Completed',
                color: 'from-emerald-500 to-emerald-600',
              },
              {
                icon: Users,
                value: '5K+',
                label: 'Satisfied Clients',
                color: 'from-green-500 to-green-600',
              },
              {
                icon: Award,
                value: '25+',
                label: 'Awards Won',
                color: 'from-teal-500 to-teal-600',
              },
              {
                icon: Clock,
                value: '14+',
                label: 'Years of Experience',
                color: 'from-lime-500 to-emerald-500',
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`relative overflow-hidden bg-gradient-to-br ${stat.color} p-6 rounded-2xl text-white shadow-xl`}
              >
                <stat.icon className="h-10 w-10 mb-3 opacity-90" />
                <div className="text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm opacity-90">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-block bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                Our Story
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Professional Excellence Since 2010
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                With over a decade of experience, we've built a reputation for
                delivering exceptional results. Our team of certified
                professionals is dedicated to exceeding your expectations.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Our commitment is focused on growing your online presence and
                converting visitors into customers while providing reliable,
                high-quality services with transparent pricing and timely
                delivery.
              </p>
              <div className="space-y-4">
                {[
                  'Licensed & Insured Professionals',
                  'Satisfaction Guaranteed',
                  'Transparent Pricing',
                  'Prompt & Reliable Service',
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
            <div className="grid grid-cols-2 gap-6">
              {[
                {
                  icon: Briefcase,
                  value: '200+',
                  label: 'Projects Completed',
                  color: 'from-green-500 to-emerald-500',
                },
                {
                  icon: Heart,
                  value: '14+',
                  label: 'Years of Passion',
                  color: 'from-rose-500 to-pink-500',
                },
                {
                  icon: Award,
                  value: '25+',
                  label: 'Industry Awards',
                  color: 'from-amber-500 to-orange-500',
                },
                {
                  icon: Star,
                  value: '4.9/5',
                  label: 'Customer Rating',
                  color: 'from-yellow-400 to-amber-400',
                },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 text-center ${
                    i % 2 === 1 ? 'mt-8' : ''
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-lg shadow-lg bg-gradient-to-tl ${stat.color} text-white mx-auto mb-4`}
                  >
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services/Offerings Section */}
      <section
        id="services"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-950"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Our Services
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What We Offer
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Comprehensive solutions tailored to your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Briefcase,
                title: 'Consultation',
                description:
                  'In-depth assessment and expert recommendations tailored to your specific needs and goals.',
                price: 'From $99',
                color: 'from-blue-500 to-indigo-500',
              },
              {
                icon: Wrench,
                title: 'Full Service',
                description:
                  'Complete end-to-end solutions handled by our experienced team of professionals.',
                price: 'Custom Quote',
                color: 'from-indigo-500 to-violet-500',
              },
              {
                icon: Award,
                title: 'Premium Support',
                description:
                  'Priority service with dedicated support and extended warranty on all work performed.',
                price: 'From $149',
                color: 'from-violet-500 to-purple-500',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8"
              >
                <div
                  className={`flex items-center justify-center w-14 h-14 rounded-xl shadow-lg bg-gradient-to-tl ${item.color} text-white mb-6`}
                >
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {item.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-emerald-600">
                    {item.price}
                  </span>
                  <a
                    href="#contact"
                    className="text-emerald-600 font-semibold hover:opacity-80 transition-colors flex items-center gap-2"
                  >
                    Learn More <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg hover:shadow-xl transition-all"
            >
              View All Services
              <ArrowRight className="ml-2 h-5 w-5" />
            </motion.a>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Client Testimonials
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Clients Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Robert Davis',
                role: 'Business Owner',
                quote:
                  'Exceptional service and attention to detail. They completed the project on time and within budget.',
              },
              {
                name: 'Jennifer Lee',
                role: 'Property Manager',
                quote:
                  'Professional, reliable, and always available when we need them. Highly recommended!',
              },
              {
                name: 'David Wilson',
                role: 'Homeowner',
                quote:
                  'The quality of work exceeded my expectations. They took the time to explain everything clearly.',
              },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full"></div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section
        id="gallery"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-white/10 backdrop-blur-sm border border-white/10 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Portfolio
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Our Work</h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Browse through our portfolio of completed projects
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              {
                title: 'Kitchen Remodel',
                category: 'Interior',
                icon: UtensilsCrossed,
                featured: true,
              },
              { title: 'Deck Build', category: 'Outdoor', icon: TreeDeciduous },
              { title: 'Bathroom', category: 'Interior', icon: Bath },
              { title: 'Landscaping', category: 'Outdoor', icon: Flower2 },
              {
                title: 'Office Space',
                category: 'Commercial',
                icon: Building2,
              },
              {
                title: 'Home Addition',
                category: 'Construction',
                icon: Home,
                featured: true,
              },
              { title: 'Flooring', category: 'Interior', icon: Grid3X3 },
              { title: 'Roofing', category: 'Exterior', icon: Hammer },
            ].map((project, i) => {
              const IconComponent = project.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`group relative rounded-2xl overflow-hidden cursor-pointer ${
                    project.featured ? 'md:col-span-2 md:row-span-2' : ''
                  }`}
                >
                  {/* Card with image placeholder */}
                  <div className="aspect-square w-full h-full relative">
                    {/* Gradient background simulating image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900" />

                    {/* Noise texture overlay */}
                    <div
                      className="absolute inset-0 opacity-40"
                      style={{
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
                      }}
                    />

                    {/* Accent color overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-30 mix-blend-overlay" />

                    {/* Bottom gradient for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Category badge */}
                    <div className="absolute top-4 left-4">
                      <span className="inline-block bg-black/40 backdrop-blur-md border border-white/10 text-white/90 px-3 py-1 rounded-full text-xs font-medium">
                        {project.category}
                      </span>
                    </div>

                    {/* Icon for project type */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className={`${
                          project.featured ? 'w-24 h-24' : 'w-16 h-16'
                        } rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300`}
                      >
                        <IconComponent
                          className={`${
                            project.featured ? 'h-12 w-12' : 'h-7 w-7'
                          } text-white/60 group-hover:text-white/90 transition-colors`}
                        />
                      </div>
                    </div>

                    {/* Project info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3
                        className={`text-white font-semibold ${
                          project.featured ? 'text-xl' : 'text-sm'
                        } mb-1`}
                      >
                        {project.title}
                      </h3>
                      <p className="text-white/60 text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        View details <ArrowRight className="h-3 w-3" />
                      </p>
                    </div>

                    {/* Hover border */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-white/20 transition-colors duration-300" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* View more button */}
          <div className="text-center mt-12">
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 backdrop-blur-sm border border-white/10 text-white rounded-xl font-medium hover:bg-white/10 transition-all"
            >
              View All Projects
              <ArrowRight className="h-4 w-4" />
            </motion.a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-emerald-600 to-green-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-white mb-4"
          >
            Ready to Get Started?
          </motion.h2>
          <p className="text-xl text-white/90 mb-8">
            Contact us today for a free consultation and quote. Our team is
            ready to help with your next project.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="h-5 w-5" />
              Call Now
            </motion.a>
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/10 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="h-5 w-5" />
              Request Quote
            </motion.a>
          </div>
        </div>
      </section>

      {/* Hours & Location */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-block bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                Visit Us
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Business Hours
              </h2>

              <div className="space-y-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Office Hours
                    </h3>
                  </div>
                  <div className="space-y-2 text-gray-600 dark:text-gray-300">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span className="font-semibold">8:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span className="font-semibold">9:00 AM - 2:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span className="font-semibold">By Appointment</span>
                    </div>
                  </div>
                </div>

                <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Location
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    123 Main Street
                    <br />
                    Downtown District
                    <br />
                    Your City, ST 12345
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-1"
            >
              <div className="bg-gray-200 dark:bg-gray-800 rounded-xl h-full min-h-[400px] flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <MapPin className="h-12 w-12 mx-auto mb-2" />
                  <p>Map Location</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Frequently Asked Questions
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
              Common Questions
            </h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-slate-800"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-white"
            >
              <h2 className="text-4xl font-bold mb-6">Request a Quote</h2>
              <p className="text-lg text-white/80 mb-8">
                Tell us about your project and we'll provide a detailed
                estimate. Free consultations for new clients!
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: Phone,
                    label: 'Phone',
                    value: '+1 (555) 123-4567',
                    color: 'from-emerald-500 to-green-500',
                  },
                  {
                    icon: Mail,
                    label: 'Email',
                    value: 'hello@{projectSlug}.com',
                    color: 'from-green-500 to-teal-500',
                  },
                  {
                    icon: MapPin,
                    label: 'Location',
                    value: '123 Main Street, Downtown',
                    color: 'from-teal-500 to-emerald-500',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-lg shadow-lg bg-gradient-to-tl ${item.color} text-white`}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm text-white/70">{item.label}</div>
                      <div className="text-white">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Details
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors resize-none"
                    placeholder="Describe your project or service needs..."
                  ></textarea>
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg bg-gradient-to-tl from-emerald-600 to-green-600 text-white hover:shadow-xl flex items-center justify-center"
                >
                  <Send className="mr-2 h-5 w-5" />
                  Request Quote
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">{projectName}</h3>
              <p className="text-white/70 mb-6">
                Delivering professional excellence and reliable service to our
                community since 2010.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-white/70">
                <li>
                  <a
                    href="#about"
                    className="hover:text-white transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#services"
                    className="hover:text-white transition-colors"
                  >
                    Services
                  </a>
                </li>
                <li>
                  <a
                    href="#gallery"
                    className="hover:text-white transition-colors"
                  >
                    Gallery
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="hover:text-white transition-colors"
                  >
                    Get a Quote
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-white/70">
                <li>123 Main Street</li>
                <li>Downtown District</li>
                <li>+1 (555) 123-4567</li>
                <li>hello@{projectSlug}.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-white/60 text-sm">
              © {new Date().getFullYear()} Local Business Pro. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const items = [
    {
      q: 'Do you offer free estimates?',
      a: 'Yes! We provide free consultations and detailed estimates for all projects. No obligation required.',
    },
    {
      q: 'Are you licensed and insured?',
      a: 'Absolutely. All our professionals are fully licensed, bonded, and insured for your peace of mind.',
    },
    {
      q: 'What areas do you serve?',
      a: 'We serve the greater metropolitan area and surrounding communities within a 30-mile radius.',
    },
    {
      q: 'Do you offer warranties?',
      a: 'Yes, all our work comes with a satisfaction guarantee and warranty. Ask about our extended warranty options.',
    },
  ];
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700 border dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <motion.button
            key={i}
            onClick={() => setOpen(isOpen ? null : i)}
            className="w-full text-left p-6 focus:outline-none transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {item.q}
              </h3>
              <span
                className={`transition-transform ${
                  isOpen ? 'rotate-45' : ''
                } text-gray-400 text-2xl`}
              >
                +
              </span>
            </div>
            <motion.div
              initial={false}
              animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
              className="overflow-hidden"
            >
              <p className="mt-3 text-gray-600 dark:text-gray-300">{item.a}</p>
            </motion.div>
          </motion.button>
        );
      })}
    </div>
  );
}
