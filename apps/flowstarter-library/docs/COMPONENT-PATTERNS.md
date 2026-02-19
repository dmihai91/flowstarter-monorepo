# Flowstarter Component Patterns

Copy-pasteable code patterns for creating new templates. Each component follows the same structure:
- Accepts a `theme` prop for colors
- Uses Framer Motion for animations
- Supports light/dark mode
- Is fully responsive

---

## Table of Contents

1. [Navigation](#navigation)
2. [Hero](#hero)
3. [Trust Bar](#trust-bar)
4. [Stats](#stats)
5. [Features](#features)
6. [Services](#services)
7. [How It Works](#how-it-works)
8. [Testimonials](#testimonials)
9. [Pricing](#pricing)
10. [FAQ](#faq)
11. [CTA](#cta)
12. [Contact](#contact)
13. [Footer](#footer)

---

## Navigation

```tsx
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavigationProps {
  projectName: string;
  theme: {
    button: string;
  };
}

export function Navigation({ projectName, theme }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <nav className="relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.a
            href="#"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-white"
          >
            {projectName}
          </motion.a>

          {/* Desktop Nav */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:flex items-center gap-8"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-white/80 hover:text-white transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              className={`px-6 py-2.5 rounded-full font-semibold transition-all hover:scale-105 ${theme.button}`}
            >
              Get Started
            </a>
          </motion.div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="md:hidden pb-6"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-white/80 hover:text-white py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#contact"
                className={`px-6 py-3 rounded-full font-semibold text-center ${theme.button}`}
              >
                Get Started
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
```

---

## Hero

### Split Layout Hero (Image + Content)

```tsx
import { motion } from 'framer-motion';
import { ArrowRight, Play, Star } from 'lucide-react';

interface HeroProps {
  theme: {
    button: string;
    buttonSecondary: string;
  };
}

export function Hero({ theme }: HeroProps) {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm font-medium mb-6">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              Trusted by 10,000+ customers
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Your Compelling
              <span className="block">Headline Here</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-white/80 mb-8 max-w-lg">
              A clear, benefit-focused description that explains what you do
              and why it matters to your target audience.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <motion.a
                href="#contact"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-lg ${theme.button}`}
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="#demo"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-lg border ${theme.buttonSecondary}`}
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </motion.a>
            </div>

            {/* Social Proof */}
            <div className="mt-10 flex items-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">10K+</div>
                <div className="text-white/60 text-sm">Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">4.9/5</div>
                <div className="text-white/60 text-sm">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">99.9%</div>
                <div className="text-white/60 text-sm">Uptime</div>
              </div>
            </div>
          </motion.div>

          {/* Image/Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://placehold.co/800x600/1e293b/94a3b8?text=Product+Screenshot"
                alt="Product preview"
                className="w-full h-auto"
              />
            </div>
            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">4.9/5 Rating</div>
                  <div className="text-sm text-slate-500">500+ reviews</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

---

## Trust Bar

```tsx
import { motion } from 'framer-motion';
import { Shield, Award, Clock, Users, BadgeCheck, ThumbsUp } from 'lucide-react';

const trustItems = [
  { icon: Shield, label: 'Secure & Private' },
  { icon: Award, label: 'Award Winning' },
  { icon: Clock, label: '24/7 Support' },
  { icon: Users, label: '10K+ Users' },
  { icon: BadgeCheck, label: 'Certified' },
  { icon: ThumbsUp, label: '99% Satisfaction' },
];

export function TrustBar() {
  return (
    <section className="py-6 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4"
        >
          {trustItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400"
            >
              <item.icon className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium">{item.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

---

## Stats

```tsx
import { motion } from 'framer-motion';
import { Users, TrendingUp, Award, Clock, LucideIcon } from 'lucide-react';

interface Stat {
  icon: LucideIcon;
  value: string;
  label: string;
  color: string;
}

interface StatsProps {
  stats?: Stat[];
}

const defaultStats: Stat[] = [
  { icon: Users, value: '10,000+', label: 'Active Users', color: 'from-blue-500 to-cyan-500' },
  { icon: TrendingUp, value: '$2.5M', label: 'Revenue Generated', color: 'from-emerald-500 to-teal-500' },
  { icon: Award, value: '99%', label: 'Satisfaction Rate', color: 'from-purple-500 to-pink-500' },
  { icon: Clock, value: '24/7', label: 'Support Available', color: 'from-orange-500 to-amber-500' },
];

export function Stats({ stats = defaultStats }: StatsProps) {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-100 dark:border-slate-700">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-sm">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## Features

```tsx
import { motion } from 'framer-motion';
import { Zap, Shield, Code, BarChart3, Cloud, Users, LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FeaturesProps {
  title?: string;
  subtitle?: string;
  features?: Feature[];
  theme: {
    badge: string;
  };
}

const defaultFeatures: Feature[] = [
  { icon: Zap, title: 'Lightning Fast', description: 'Optimized for speed with sub-100ms response times.' },
  { icon: Shield, title: 'Secure by Default', description: 'Enterprise-grade security with SOC2 compliance.' },
  { icon: Code, title: 'Developer Friendly', description: 'Clean APIs and comprehensive documentation.' },
  { icon: BarChart3, title: 'Analytics Built-in', description: 'Real-time insights and custom dashboards.' },
  { icon: Cloud, title: 'Cloud Native', description: 'Auto-scaling infrastructure that grows with you.' },
  { icon: Users, title: 'Team Collaboration', description: 'Built-in tools for seamless teamwork.' },
];

export function Features({
  title = "Everything You Need",
  subtitle = "Powerful features to help you succeed",
  features = defaultFeatures,
  theme
}: FeaturesProps) {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 ${theme.badge}`}>
            Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            {title}
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-slate-100 dark:border-slate-700"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-6">
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## Services (with Pricing)

```tsx
import { motion } from 'framer-motion';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface Service {
  icon: LucideIcon;
  title: string;
  description: string;
  price: string;
  color: string;
}

interface ServicesProps {
  services: Service[];
  theme: {
    badge: string;
  };
}

export function Services({ services, theme }: ServicesProps) {
  return (
    <section id="services" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 ${theme.badge}`}>
            Services
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            What We Offer
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Professional services tailored to your needs
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-slate-100 dark:border-slate-700"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <service.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                {service.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {service.description}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {service.price}
                </span>
                <a href="#contact" className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                  Get Quote <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## How It Works

```tsx
import { motion } from 'framer-motion';

interface Step {
  step: string;
  title: string;
  description: string;
}

interface HowItWorksProps {
  steps: Step[];
}

export function HowItWorks({ steps }: HowItWorksProps) {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Get started in three simple steps
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-transparent -translate-x-8" />
              )}

              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold text-white">{step.step}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## Testimonials

```tsx
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  image?: string;
  rating?: number;
}

interface TestimonialsProps {
  testimonials: Testimonial[];
  theme: {
    badge: string;
  };
}

export function Testimonials({ testimonials, theme }: TestimonialsProps) {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 ${theme.badge}`}>
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Loved by Customers
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-100 dark:border-slate-700"
            >
              <Quote className="w-10 h-10 text-blue-500 mb-4" />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${star <= (testimonial.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`}
                  />
                ))}
              </div>

              <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              <div className="flex items-center gap-4">
                {testimonial.image ? (
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## Pricing

```tsx
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
}

interface PricingProps {
  plans: Plan[];
  theme: {
    popular: string;
    badge: string;
  };
}

export function Pricing({ plans, theme }: PricingProps) {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 ${theme.badge}`}>
            Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Choose the plan that's right for you
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border ${
                plan.popular
                  ? 'border-blue-500 ring-2 ring-blue-500'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-semibold text-white ${theme.popular}`}>
                  Most Popular
                </div>
              )}

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {plan.name}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                {plan.description}
              </p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">
                  {plan.price}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600 dark:text-slate-400">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  plan.popular
                    ? `${theme.popular} text-white hover:opacity-90`
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                Get Started
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## FAQ

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FAQItem {
  q: string;
  a: string;
}

interface FAQProps {
  items: FAQItem[];
}

export function FAQ({ items }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <span className="font-semibold text-slate-900 dark:text-white">
                  {item.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-500 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 text-slate-600 dark:text-slate-400">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## CTA

```tsx
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface CTAProps {
  title: string;
  description: string;
  theme: {
    cta: string;
  };
}

export function CTA({ title, description, theme }: CTAProps) {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`max-w-5xl mx-auto rounded-3xl p-12 md:p-16 text-center ${theme.cta}`}
      >
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          {title}
        </h2>
        <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
          {description}
        </p>
        <motion.a
          href="#contact"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-full font-semibold text-lg hover:bg-white/90 transition-colors"
        >
          Get Started Now
          <ArrowRight className="w-5 h-5" />
        </motion.a>
      </motion.div>
    </section>
  );
}
```

---

## Contact

```tsx
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

interface ContactProps {
  theme: {
    formFocus: string;
    cta: string;
  };
}

export function Contact({ theme }: ContactProps) {
  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Get in Touch
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            We'd love to hear from you
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Contact Information
            </h3>
            <div className="space-y-6">
              {[
                { icon: Mail, label: 'Email', value: 'hello@example.com' },
                { icon: Phone, label: 'Phone', value: '+1 (555) 123-4567' },
                { icon: MapPin, label: 'Address', value: 'San Francisco, CA' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {item.label}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <form className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${theme.formFocus}`}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className={`w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${theme.formFocus}`}
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Message
                </label>
                <textarea
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none ${theme.formFocus}`}
                  placeholder="How can we help?"
                />
              </div>
              <button
                type="submit"
                className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 ${theme.cta} hover:opacity-90 transition-opacity`}
              >
                Send Message
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

---

## Footer

```tsx
import { motion } from 'framer-motion';

interface FooterProps {
  projectName: string;
  description?: string;
}

export function Footer({ projectName, description }: FooterProps) {
  const links = {
    product: ['Features', 'Pricing', 'Integrations', 'Changelog'],
    company: ['About', 'Blog', 'Careers', 'Press'],
    resources: ['Documentation', 'Help Center', 'Community', 'Contact'],
    legal: ['Privacy', 'Terms', 'Security'],
  };

  return (
    <footer className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="text-2xl font-bold mb-4">{projectName}</div>
            <p className="text-slate-400 mb-6 max-w-sm">
              {description || 'Building the future, one feature at a time.'}
            </p>
          </div>

          {/* Links */}
          {Object.entries(links).slice(0, 3).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4 capitalize">{category}</h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} {projectName}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {links.legal.map((item) => (
              <a key={item} href="#" className="text-slate-400 hover:text-white text-sm">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
```

---

## Full Theme Object Example

```typescript
const themes: Record<string, any> = {
  modern: {
    gradient: 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-blue-900 dark:via-indigo-950 dark:to-purple-950',
    button: 'bg-white text-blue-600',
    buttonSecondary: 'bg-white/10 border-white/30 text-white',
    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    popular: 'bg-gradient-to-r from-blue-600 to-purple-600',
    cta: 'bg-gradient-to-br from-blue-600 to-purple-600',
    formFocus: 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
  },
  vibrant: {
    gradient: 'bg-gradient-to-br from-rose-500 via-orange-500 to-yellow-500 dark:from-rose-900 dark:via-orange-950 dark:to-amber-950',
    button: 'bg-white text-rose-600',
    buttonSecondary: 'bg-white/10 border-white/30 text-white',
    badge: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
    popular: 'bg-gradient-to-r from-rose-500 to-orange-500',
    cta: 'bg-gradient-to-br from-rose-500 to-orange-500',
    formFocus: 'focus:ring-2 focus:ring-rose-500 focus:border-rose-500',
  },
  forest: {
    gradient: 'bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 dark:from-emerald-900 dark:via-green-950 dark:to-teal-950',
    button: 'bg-white text-emerald-700',
    buttonSecondary: 'bg-white/10 border-white/30 text-white',
    badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    popular: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    cta: 'bg-gradient-to-br from-emerald-600 to-teal-600',
    formFocus: 'focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
  },
  ocean: {
    gradient: 'bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 dark:from-cyan-900 dark:via-blue-950 dark:to-indigo-950',
    button: 'bg-white text-cyan-700',
    buttonSecondary: 'bg-white/10 border-white/30 text-white',
    badge: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
    popular: 'bg-gradient-to-r from-cyan-500 to-blue-600',
    cta: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    formFocus: 'focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500',
  },
  sunset: {
    gradient: 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 dark:from-orange-900 dark:via-red-950 dark:to-pink-950',
    button: 'bg-white text-orange-600',
    buttonSecondary: 'bg-white/10 border-white/30 text-white',
    badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    popular: 'bg-gradient-to-r from-orange-500 to-pink-600',
    cta: 'bg-gradient-to-br from-orange-500 to-pink-600',
    formFocus: 'focus:ring-2 focus:ring-orange-500 focus:border-orange-500',
  },
  midnight: {
    gradient: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900',
    button: 'bg-white text-indigo-900',
    buttonSecondary: 'bg-white/10 border-white/30 text-white',
    badge: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
    popular: 'bg-gradient-to-r from-indigo-600 to-purple-600',
    cta: 'bg-gradient-to-br from-indigo-600 to-purple-600',
    formFocus: 'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
  },
  minimal: {
    gradient: 'bg-gradient-to-br from-zinc-800 via-slate-800 to-zinc-900 dark:from-zinc-900 dark:via-slate-950 dark:to-black',
    button: 'bg-white text-zinc-900',
    buttonSecondary: 'border border-zinc-400 text-white',
    badge: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
    popular: 'bg-zinc-800 text-white',
    cta: 'bg-zinc-900',
    formFocus: 'focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500',
  },
  rose: {
    gradient: 'bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 dark:from-rose-900 dark:via-pink-950 dark:to-fuchsia-950',
    button: 'bg-white text-rose-600',
    buttonSecondary: 'bg-white/10 border-white/30 text-white',
    badge: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
    popular: 'bg-gradient-to-r from-rose-500 to-fuchsia-600',
    cta: 'bg-gradient-to-br from-rose-500 to-fuchsia-600',
    formFocus: 'focus:ring-2 focus:ring-rose-500 focus:border-rose-500',
  },
};
```

---

## Tips for Designers

1. **Start with an existing template** - Copy the closest match and modify
2. **Keep sections modular** - Each component should work independently
3. **Test all 8 themes** - Use `?theme=modern`, `?theme=vibrant`, etc.
4. **Test dark mode** - Add `?mode=dark` to the URL
5. **Use placeholder images** - `https://placehold.co/WIDTH x HEIGHT/BGCOLOR/TEXTCOLOR?text=YOUR+TEXT`
6. **Mobile first** - Design for mobile, then add responsive classes
