'use client';

import { useProjectData } from '@/components/template-preview/TemplatePreview';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Box,
  CheckCircle,
  Cloud,
  Code,
  Database,
  Figma,
  FileText,
  Github,
  Globe,
  Layers,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Play,
  Rocket,
  Send,
  Shield,
  Slack,
  Star,
  Trello,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function SaasProductProPreview() {
  const projectData = useProjectData();

  // Dynamic values from project data with fallbacks
  const projectName = projectData?.name || 'SaaS Product Pro';
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
                  href="#features"
                  className="text-white/90 hover:text-white transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-white/90 hover:text-white transition-colors"
                >
                  How It Works
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
              <div className="flex items-center gap-4">
                <a
                  href="#"
                  className="text-white/90 hover:text-white transition-colors hidden md:block"
                >
                  Sign In
                </a>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <a
                    href="#contact"
                    className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg bg-gradient-to-tl from-cyan-400 to-emerald-400 text-gray-900 hover:shadow-xl"
                  >
                    Start Free Trial
                  </a>
                </motion.div>
              </div>
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
              <Zap className="h-4 w-4 text-cyan-400" />
              <span className="text-white/90">
                Trusted by 10,000+ teams worldwide
              </span>
              <ArrowRight className="h-4 w-4 text-white/90" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight"
            >
              Build Faster, Ship Smarter
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              {projectDescription} - The ultimate platform for {targetUsers} to
              achieve growing your online presence and converting visitors into
              customers.
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
                className="px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg bg-white text-[var(--purple)] hover:shadow-xl flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.a>
              <motion.a
                href="#how-it-works"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg backdrop-blur-md bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 flex items-center justify-center"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </motion.a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="flex items-center justify-center gap-12"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-white">10K+</div>
                <div className="text-sm text-white/70">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">99.9%</div>
                <div className="text-sm text-white/70">Uptime</div>
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
                icon: Users,
                value: '10K+',
                label: 'Active Users',
                color: 'from-blue-500 to-blue-600',
              },
              {
                icon: Globe,
                value: '99.9%',
                label: 'Uptime SLA',
                color: 'from-emerald-400 to-emerald-500',
              },
              {
                icon: Zap,
                value: '50ms',
                label: 'Avg Response',
                color: 'from-[var(--purple)] to-[var(--purple)]',
              },
              {
                icon: Shield,
                value: 'SOC2',
                label: 'Certified',
                color: 'from-cyan-500 to-cyan-600',
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

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-[var(--purple)]/10 dark:bg-[var(--purple)]/30 text-[var(--purple)] dark:text-[var(--purple)] px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Powerful Features
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Built for {targetUsers} who demand performance, reliability, and
              ease of use.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Lightning Fast',
                description:
                  'Blazing fast performance with sub-50ms response times and global CDN distribution.',
                color: 'from-blue-600 to-cyan-500',
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                description:
                  'Bank-level encryption, SOC2 compliance, and advanced threat protection built-in.',
                color: 'from-emerald-500 to-teal-400',
              },
              {
                icon: Code,
                title: 'Developer First',
                description:
                  'RESTful APIs, webhooks, SDKs for all major languages, and comprehensive documentation.',
                color: 'from-[var(--purple)] to-[var(--purple)]',
              },
              {
                icon: BarChart3,
                title: 'Advanced Analytics',
                description:
                  'Real-time dashboards, custom reports, and actionable insights at your fingertips.',
                color: 'from-orange-500 to-amber-500',
              },
              {
                icon: Cloud,
                title: 'Cloud Native',
                description:
                  'Auto-scaling infrastructure that grows with your business. No limits, no surprises.',
                color: 'from-cyan-500 to-blue-500',
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                description:
                  'Built-in tools for seamless teamwork with roles, permissions, and shared workspaces.',
                color: 'from-pink-500 to-rose-500',
              },
            ].map((feature, i) => (
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
                  className={`flex items-center justify-center w-14 h-14 rounded-xl shadow-lg bg-gradient-to-tl ${feature.color} text-white mb-6`}
                >
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--purple)]/5 to-[var(--purple)]/5 dark:from-gray-900 dark:to-gray-950"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-[var(--purple)]/10 dark:bg-[var(--purple)]/30 text-[var(--purple)] dark:text-[var(--purple)] px-4 py-2 rounded-full text-sm font-semibold mb-4">
              How It Works
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Three simple steps to transform your workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Sign Up',
                description:
                  'Create your free account in seconds. No credit card required to get started.',
              },
              {
                step: '02',
                title: 'Connect',
                description:
                  'Integrate with your existing tools and import your data with our easy setup wizard.',
              },
              {
                step: '03',
                title: 'Launch',
                description:
                  'Start using the platform immediately with our intuitive interface and helpful guides.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 relative z-10">
                  <div className="text-6xl font-bold text-[var(--purple)] dark:text-[var(--purple)]/50 mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-20">
                    <ArrowRight className="h-8 w-8 text-[var(--purple)]" />
                  </div>
                )}
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
              Customer Stories
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by Teams Worldwide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Alex Rivera',
                role: 'CTO, TechCorp',
                quote:
                  'This platform cut our deployment time by 80%. The developer experience is unmatched.',
              },
              {
                name: 'Sarah Kim',
                role: 'Engineering Lead, StartupX',
                quote:
                  'Finally, a tool that actually delivers on its promises. Our team productivity soared.',
              },
              {
                name: 'Marcus Johnson',
                role: 'VP Engineering, ScaleUp',
                quote:
                  'The security features gave us peace of mind. SOC2 compliance out of the box was a game-changer.',
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
                  <div className="w-12 h-12 bg-gradient-to-br from-[var(--purple)]/40 to-[var(--purple)] rounded-full"></div>
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

      {/* Integrations */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-white/10 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Integrations
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Works With Your Stack
            </h2>
            <p className="text-lg text-white/80 max-w-3xl mx-auto">
              Seamlessly connect with 100+ tools and services you already use
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { icon: Slack, name: 'Slack' },
              { icon: Github, name: 'GitHub' },
              { icon: Figma, name: 'Figma' },
              { icon: Trello, name: 'Trello' },
              { icon: Database, name: 'Database' },
              { icon: Cloud, name: 'AWS' },
              { icon: MessageSquare, name: 'Discord' },
              { icon: FileText, name: 'Notion' },
              { icon: Box, name: 'Dropbox' },
              { icon: Layers, name: 'Stripe' },
              { icon: Code, name: 'VS Code' },
              { icon: Globe, name: 'Vercel' },
            ].map((integration, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex flex-col items-center justify-center aspect-square gap-2"
              >
                <integration.icon className="h-10 w-10 text-white/80" />
                <span className="text-xs text-white/60 font-medium">
                  {integration.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--purple)]/5 to-[var(--purple)]/5 dark:from-gray-900 dark:to-gray-950"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-[var(--purple)]/10 dark:bg-[var(--purple)]/30 text-[var(--purple)] dark:text-[var(--purple)] px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Pricing Plans
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Start free, scale as you grow. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: '$0',
                period: '/month',
                description: 'Perfect for individuals and small projects',
                features: [
                  'Up to 3 team members',
                  '5 GB storage',
                  'Basic analytics',
                  'Email support',
                  'API access',
                ],
                popular: false,
              },
              {
                name: 'Pro',
                price: '$49',
                period: '/month',
                description: 'For growing teams that need more power',
                features: [
                  'Up to 20 team members',
                  '100 GB storage',
                  'Advanced analytics',
                  'Priority support',
                  'Custom integrations',
                  'SSO authentication',
                ],
                popular: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                description: 'For large organizations with complex needs',
                features: [
                  'Unlimited team members',
                  'Unlimited storage',
                  'Custom analytics',
                  'Dedicated support',
                  'On-premise option',
                  'SLA guarantee',
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
                  plan.popular ? 'ring-2 ring-[var(--purple)]/50 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[var(--purple)] to-[var(--purple)] text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
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
                      ? 'bg-gradient-to-r from-[var(--purple)] to-[var(--purple)] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {plan.price === '$0'
                    ? 'Get Started Free'
                    : plan.price === 'Custom'
                    ? 'Contact Sales'
                    : 'Start Free Trial'}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[var(--purple)] to-[var(--purple)]">
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
            Join thousands of teams already using SaaS Product Pro to build
            better products faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white text-[var(--purple)] rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <Rocket className="h-5 w-5" />
              Start Free Trial
            </motion.a>
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/10 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="h-5 w-5" />
              Contact Sales
            </motion.a>
          </div>
          <p className="text-white/70 text-sm mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-[var(--purple)]/10 dark:bg-[var(--purple)]/30 text-[var(--purple)] dark:text-[var(--purple)] px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Frequently Asked Questions
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
              Got Questions?
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
                Let's Build Something Great
              </h2>
              <p className="text-lg text-white/80 mb-8">
                Ready to transform your workflow? Our team is here to help you
                get started with SaaS Product Pro.
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
                    color: 'from-[var(--purple)] to-[var(--purple)]',
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--purple)]/50 focus:border-[var(--purple)]/50 outline-none transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--purple)]/50 focus:border-[var(--purple)]/50 outline-none transition-colors"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--purple)]/50 focus:border-[var(--purple)]/50 outline-none transition-colors"
                    placeholder="Your company"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--purple)]/50 focus:border-[var(--purple)]/50 outline-none transition-colors resize-none"
                    placeholder="Tell us about your project..."
                  ></textarea>
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg bg-gradient-to-tl from-[var(--purple)] to-[var(--purple)] text-white hover:shadow-xl flex items-center justify-center"
                >
                  <Send className="mr-2 h-5 w-5" />
                  Send Message
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
                The ultimate platform for {targetUsers} to build better products
                faster.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-white/70">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Features
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
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API Reference
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/70">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
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
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/60 text-sm">
              © {new Date().getFullYear()} SaaS Product Pro. All rights
              reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a
                href="#"
                className="text-white/60 hover:text-white transition-colors text-sm"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-white/60 hover:text-white transition-colors text-sm"
              >
                Terms of Service
              </a>
            </div>
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
      q: 'How does the free trial work?',
      a: 'Start with full access to all Pro features for 14 days. No credit card required. At the end, choose a plan that fits your needs.',
    },
    {
      q: 'Can I switch plans later?',
      a: 'Absolutely! Upgrade or downgrade anytime. Changes take effect immediately and billing is prorated.',
    },
    {
      q: 'Is my data secure?',
      a: 'Yes. We use bank-level encryption, are SOC2 certified, and never share your data. You own your data completely.',
    },
    {
      q: 'Do you offer refunds?',
      a: 'Yes, we offer a 30-day money-back guarantee on all paid plans. No questions asked.',
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
