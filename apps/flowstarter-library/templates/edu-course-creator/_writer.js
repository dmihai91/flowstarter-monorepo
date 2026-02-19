const fs = require('fs');
const path = require('path');
const base = path.dirname(__filename || process.argv[1]);

const BASE = 'd:/Projects/flowstarter/flowstarter-monorepo/apps/flowstarter-library/templates/edu-course-creator';

// File 1: global.css
const globalCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}

body {
  @apply bg-cream dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-sans antialiased transition-colors duration-300;
}

h1, h2, h3, h4, h5, h6 {
  @apply font-display text-slate-800 dark:text-white;
}

/* Button Styles */
.btn-primary {
  @apply inline-flex items-center justify-center px-8 py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5;
}

.btn-secondary {
  @apply inline-flex items-center justify-center px-8 py-4 bg-secondary text-white font-semibold rounded-xl hover:bg-secondary-dark transition-all duration-300;
}

.btn-outline {
  @apply inline-flex items-center justify-center px-8 py-4 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-all duration-300;
}

/* Card Styles */
.card {
  @apply bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm dark:shadow-none dark:border dark:border-slate-700 hover:shadow-lg dark:hover:border-slate-600 transition-all duration-300;
}

.card-cool {
  @apply bg-cool-100 dark:bg-slate-800 rounded-2xl p-8 border border-cool-200 dark:border-slate-700;
}

/* Section Divider */
.section-divider {
  @apply w-20 h-1 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto;
}

/* Input Styles */
.input {
  @apply w-full px-5 py-4 rounded-xl bg-white dark:bg-slate-700 border border-cool-300 dark:border-slate-600 text-slate-700 dark:text-white placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all;
}

.textarea {
  @apply w-full px-5 py-4 rounded-xl bg-white dark:bg-slate-700 border border-cool-300 dark:border-slate-600 text-slate-700 dark:text-white placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none;
}

/* Grid/book decorative pattern for education theme */
.grid-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Crect width='60' height='60' fill='none'/%3E%3Cpath d='M0 30h60M30 0v60' stroke='%230891b2' stroke-opacity='0.06' stroke-width='1'/%3E%3Ccircle cx='30' cy='30' r='1.5' fill='%230891b2' fill-opacity='0.08'/%3E%3C/g%3E%3C/svg%3E");
}

/* Notebook lines pattern */
.lines-pattern {
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 31px,
    rgba(8, 145, 178, 0.06) 31px,
    rgba(8, 145, 178, 0.06) 32px
  );
}

/* Theme toggle */
.theme-toggle {
  @apply w-9 h-9 flex items-center justify-center rounded-full border border-cool-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer transition-all hover:border-primary;
}
.theme-toggle svg {
  @apply w-[1.125rem] h-[1.125rem] text-slate-700 dark:text-slate-300;
}
.icon-sun { @apply block; }
.icon-moon { @apply hidden; }
:global(html.dark) .icon-sun { @apply hidden; }
:global(html.dark) .icon-moon { @apply block; }
`;

fs.writeFileSync(BASE + '/src/styles/global.css', globalCss);
console.log('global.css OK');

// File 2: hero.md
const heroMd = `---
headline: "Master Skills That Matter"
subheadline: "Hands-on courses designed for real-world impact. Whether you're starting a new career, leveling up, or pursuing a passion — you'll get the skills you need to succeed."
badge: "5,000+ Students Enrolled"
cta_primary:
  text: "Browse Courses"
  href: "#courses"
cta_secondary:
  text: "See Student Reviews"
  href: "#testimonials"
stats:
  - value: "5,000+"
    label: "Students Enrolled"
  - value: "25+"
    label: "Expert Courses"
  - value: "4.9"
    label: "Average Rating"
  - value: "95%"
    label: "Completion Rate"
---
`;
fs.writeFileSync(BASE + '/content/hero.md', heroMd);
console.log('hero.md OK');

// File 3: services.md
const servicesMd = `---
title: "Featured Courses"
subtitle: "Learn in-demand skills with structured curriculum, hands-on projects, and lifetime access."
services:
  - icon: "lucide:code"
    title: "Web Development Mastery"
    description: "From HTML/CSS to full-stack JavaScript. Build real projects and deploy to production. 12-week comprehensive program."
    price: "$299"
  - icon: "lucide:palette"
    title: "UI/UX Design Foundations"
    description: "User research, wireframing, Figma mastery, and design systems. Create portfolios that get you hired."
    price: "$249"
  - icon: "lucide:bar-chart"
    title: "Data Analytics with Python"
    description: "Pandas, data visualization, SQL, and storytelling with data. Turn raw numbers into actionable insights."
    price: "$199"
  - icon: "lucide:megaphone"
    title: "Digital Marketing Essentials"
    description: "SEO, paid advertising, email marketing, and analytics. Launch campaigns that actually convert."
    price: "$179"
  - icon: "lucide:video"
    title: "Video Production for Creators"
    description: "Scripting, filming, editing, and publishing. Create professional content for YouTube and social media."
    price: "$229"
  - icon: "lucide:sparkles"
    title: "AI Tools for Professionals"
    description: "ChatGPT, automation workflows, and AI-powered productivity. Work smarter, not harder."
    price: "$99"
---
`;
fs.writeFileSync(BASE + '/content/services.md', servicesMd);
console.log('services.md OK');

// File 4: testimonials.md
const testimonialsMd = `---
title: "Student Success Stories"
subtitle: "Real results from real learners. See how our courses have transformed careers and opened new doors."
testimonials:
  - quote: "The Web Development course gave me everything I needed to land my first dev job. Clear structure, real projects, and the instructor actually responded to questions within hours."
    author: "Alex K."
    role: "Junior Developer"
    result: "Landed first dev job in 3 months"
  - quote: "I'd tried free tutorials for years with no progress. This course had a clear path, deadlines, and accountability. Finished in 10 weeks and built 3 portfolio pieces that got me hired."
    author: "Sara M."
    role: "UI/UX Designer"
    result: "Built 3 portfolio projects"
  - quote: "The Data Analytics course was worth every penny. I automated reports at work and got a promotion within 3 months of completing it. Best investment in my career."
    author: "James P."
    role: "Business Analyst"
    result: "Promotion + 20% raise"
---
`;
fs.writeFileSync(BASE + '/content/testimonials.md', testimonialsMd);
console.log('testimonials.md OK');

// File 5: site.md
const siteMd = `---
name: "SkillForge Academy"
tagline: "Master In-Demand Skills Online"
description: "Premium online courses taught by industry experts. From beginner to advanced — learn at your own pace with structured curriculum, hands-on projects, and a supportive community."
year: 2025
---
`;
fs.writeFileSync(BASE + '/content/site.md', siteMd);
console.log('site.md OK');

console.log('All content files written successfully');
