'use client';

import { useProjectData } from '@/components/template-preview/TemplatePreview';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  BarChart3,
  CheckCircle,
  Clock,
  Mail,
  MapPin,
  Phone,
  Rocket,
  Send,
  Shield,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function PersonalBrandProPreview() {
  const projectData = useProjectData();

  // Dynamic values from project data with fallbacks
  const projectName = projectData?.name || 'Personal Brand Pro';
  const projectDescription = projectData?.description || '{projectDescription}';
  const targetUsers = projectData?.targetUsers || '{targetUsers}';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-[var(--purple)] to-[var(--purple)]">
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
                  href="#pricing"
                  className="text-white/90 hover:text-white transition-colors"
                >
                  Pricing
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
                  className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg bg-gradient-to-tl from-emerald-500 to-teal-400 text-white hover:shadow-xl"
                >
                  Get Started
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
              <Star className="h-4 w-4 text-cyan-400" />
              <span className="text-white/90">
                Trusted by 500+ professionals worldwide
              </span>
              <ArrowRight className="h-4 w-4 text-white/90" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight"
            >
              Transform Your Vision Into Reality
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              {projectDescription} - Expert solutions tailored for {targetUsers}
              .
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
                className="px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg bg-white text-blue-600 hover:shadow-xl flex items-center justify-center"
              >
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.a>
              <motion.a
                href="#about"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg backdrop-blur-md bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 flex items-center justify-center"
              >
                <Rocket className="mr-2 h-5 w-5" />
                Learn More
              </motion.a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="flex items-center justify-center gap-12"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-white">500+</div>
                <div className="text-sm text-white/70">Clients</div>
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
                <div className="text-3xl font-bold text-white">10+</div>
                <div className="text-sm text-white/70">Years Experience</div>
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
                icon: BarChart3,
                value: '500+',
                label: 'Projects Delivered',
                color: 'from-blue-500 to-blue-600',
              },
              {
                icon: Users,
                value: '250+',
                label: 'Happy Clients',
                color: 'from-emerald-400 to-emerald-500',
              },
              {
                icon: Award,
                value: '50+',
                label: 'Awards Won',
                color: 'from-orange-400 to-orange-500',
              },
              {
                icon: Clock,
                value: '10+',
                label: 'Years Experience',
                color: 'from-[var(--purple)] to-pink-500',
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
              <div className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                About Personal Brand Pro
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                About Personal Brand Pro
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                With over 10 years of experience serving {targetUsers}, we've
                developed a proven track record of delivering exceptional
                results. Our mission is focused on growing your online presence
                and converting visitors into customers.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                We combine industry expertise with innovative strategies to help
                our clients not just meet, but exceed their business objectives.
              </p>
              <div className="space-y-4">
                {[
                  'Certified Industry Experts',
                  'Data-Driven Approach',
                  '24/7 Client Support',
                  'Proven Track Record',
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
                  icon: Target,
                  value: '200%',
                  label: 'Average ROI Increase',
                  color: 'from-blue-600 to-cyan-500',
                },
                {
                  icon: Zap,
                  value: '90 Days',
                  label: 'Average Time to Results',
                  color: 'from-emerald-500 to-teal-400',
                },
                {
                  icon: Shield,
                  value: '100%',
                  label: 'Money-Back Guarantee',
                  color: 'from-orange-500 to-yellow-500',
                },
                {
                  icon: Star,
                  value: '4.9/5',
                  label: 'Client Rating',
                  color: 'from-cyan-400 to-blue-500',
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

      {/* Services Section */}
      <section
        id="services"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-950"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Our Services
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Comprehensive Solutions for {targetUsers}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Tailored strategies and expert execution to help you achieve
              growing your online presence and converting visitors into
              customers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: 'Strategic Planning',
                description:
                  'Develop comprehensive business strategies that align with your goals and drive sustainable growth.',
                color: 'from-blue-600 to-cyan-500',
              },
              {
                icon: TrendingUp,
                title: 'Growth Optimization',
                description:
                  'Identify and implement growth opportunities through data-driven insights and proven methodologies.',
                color: 'from-emerald-500 to-teal-400',
              },
              {
                icon: Users,
                title: 'Team Development',
                description:
                  'Build high-performing teams with leadership training and organizational development programs.',
                color: 'from-[var(--purple)] to-pink-500',
              },
            ].map((service, i) => (
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
                  className={`flex items-center justify-center w-14 h-14 rounded-xl shadow-lg bg-gradient-to-tl ${service.color} text-white mb-6`}
                >
                  <service.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {service.description}
                </p>
                <a
                  href="#contact"
                  className="text-blue-600 font-semibold hover:text-blue-700 transition-colors flex items-center gap-2"
                >
                  Learn More <ArrowRight className="h-4 w-4" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Client Success Stories
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Proven Results That Speak for Themselves
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Johnson',
                role: 'CEO, TechStart Inc',
                quote:
                  'Working with this team transformed our business completely. The results exceeded all expectations.',
              },
              {
                name: 'Michael Chen',
                role: 'Founder, GrowthLabs',
                quote:
                  'The strategic insights and hands-on support helped us scale from startup to industry leader.',
              },
              {
                name: 'Emily Rodriguez',
                role: 'Director, InnovateCo',
                quote:
                  'Professional, responsive, and truly invested in our success. Highly recommend their services.',
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
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-[var(--purple)] rounded-full"></div>
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

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-[var(--purple)]/5 dark:from-gray-900 dark:to-gray-950"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Pricing Plans
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Choose the perfect plan for your needs. All plans include our
              satisfaction guarantee.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: '$999',
                period: '/month',
                description: 'Perfect for individuals getting started',
                features: [
                  'Initial consultation',
                  '3 monthly strategy sessions',
                  'Email support',
                  'Resource library access',
                  'Basic analytics',
                ],
                popular: false,
              },
              {
                name: 'Professional',
                price: '$2,499',
                period: '/month',
                description: 'For growing businesses and teams',
                features: [
                  'Everything in Starter',
                  'Weekly strategy sessions',
                  'Priority support',
                  'Custom action plans',
                  'Advanced analytics',
                  'Direct phone access',
                ],
                popular: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                description: 'Tailored solutions for large organizations',
                features: [
                  'Everything in Professional',
                  'Unlimited sessions',
                  'Dedicated account manager',
                  'Custom integrations',
                  'On-site visits',
                  '24/7 support',
                ],
                popular: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 ${
                  plan.popular ? 'ring-2 ring-[var(--purple)] scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[var(--purple)] to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {plan.description}
                  </p>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className={`block w-full text-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-[var(--purple)] to-pink-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Get Started
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-[var(--purple)]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-white mb-4"
          >
            Stay Ahead of the Curve
          </motion.h2>
          <p className="text-xl text-white/90 mb-8">
            Subscribe to our newsletter for exclusive insights, industry trends,
            and actionable strategies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <input
              type="email"
              placeholder="Enter your email address"
              className="px-6 py-4 rounded-xl w-full sm:w-96 text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <Send className="h-5 w-5" />
              Subscribe Now
            </motion.button>
          </div>
          <p className="text-white/70 text-sm mt-4">
            Join 10,000+ professionals already subscribed. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Frequently Asked Questions
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
              Everything You Need to Know
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
              <h2 className="text-4xl font-bold mb-6">
                Ready to Transform Your Business?
              </h2>
              <p className="text-lg text-white/80 mb-8">
                Let's discuss how we can help you achieve growing your online
                presence and converting visitors into customers and take your
                business to the next level.
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: Mail,
                    label: 'Email',
                    value: 'hello@{projectSlug}.com',
                    color: 'from-blue-600 to-cyan-500',
                  },
                  {
                    icon: Phone,
                    label: 'Phone',
                    value: '+1 (555) 123-4567',
                    color: 'from-emerald-500 to-teal-400',
                  },
                  {
                    icon: MapPin,
                    label: 'Location',
                    value: 'San Francisco, CA',
                    color: 'from-orange-500 to-yellow-500',
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="How can we help?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                    placeholder="Tell us about your project..."
                  ></textarea>
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg bg-gradient-to-tl from-blue-500 to-[var(--purple)] text-white hover:shadow-xl flex items-center justify-center"
                >
                  <Send className="mr-2 h-5 w-5" />
                  Get in Touch
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
                Expert services helping {targetUsers} achieve sustainable growth
                and success.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-white/70">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Strategic Planning
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Growth Optimization
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Team Development
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/70">
                <li>
                  <a
                    href="#about"
                    className="hover:text-white transition-colors"
                  >
                    About
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
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-white/60 text-sm">
              © {new Date().getFullYear()} Personal Brand Pro. All rights
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
      q: 'What results can I expect?',
      a: 'Most clients see measurable outcomes within 90 days of engagement.',
    },
    {
      q: 'Do you offer custom packages?',
      a: 'Yes—engagements are tailored to your goals, scope, and timeline.',
    },
    {
      q: 'How do we get started?',
      a: 'Book a discovery call to align on objectives and next steps.',
    },
    {
      q: 'What industries do you serve?',
      a: 'We work across SaaS, eCommerce, professional services, and more.',
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
