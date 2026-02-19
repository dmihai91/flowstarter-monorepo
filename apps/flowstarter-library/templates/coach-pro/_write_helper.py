"""Helper script to write template files for coach-pro."""
import os

BASE = os.path.dirname(os.path.abspath(__file__))

def write_file(rel_path, content):
    full_path = os.path.join(BASE, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)
    print(f"  Wrote {rel_path}")

# ── global.css ──
write_file("src/styles/global.css", r"""@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}

body {
  @apply bg-cream dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-sans antialiased transition-colors duration-300;
}

h1, h2, h3, h4, h5, h6 {
  @apply font-serif text-slate-800 dark:text-white;
}

/* Button Styles */
.btn-primary {
  @apply inline-flex items-center justify-center px-8 py-4 bg-primary text-white font-medium rounded-full hover:bg-primary-dark transition-all duration-300 shadow-md hover:shadow-lg;
}

.btn-secondary {
  @apply inline-flex items-center justify-center px-8 py-4 bg-secondary text-white font-medium rounded-full hover:bg-secondary-dark transition-all duration-300;
}

.btn-outline {
  @apply inline-flex items-center justify-center px-8 py-4 border-2 border-primary text-primary font-medium rounded-full hover:bg-primary hover:text-white transition-all duration-300;
}

/* Card Styles */
.card {
  @apply bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm dark:shadow-none dark:border dark:border-slate-700 hover:shadow-md dark:hover:border-slate-600 transition-all duration-300;
}

.card-warm {
  @apply bg-warm-100 dark:bg-slate-800 rounded-2xl p-8 border border-warm-200 dark:border-slate-700;
}

/* Section Divider */
.section-divider {
  @apply w-20 h-1 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto;
}

/* Input Styles */
.input {
  @apply w-full px-5 py-4 rounded-xl bg-white dark:bg-slate-700 border border-warm-300 dark:border-slate-600 text-slate-700 dark:text-white placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all;
}

.textarea {
  @apply w-full px-5 py-4 rounded-xl bg-white dark:bg-slate-700 border border-warm-300 dark:border-slate-600 text-slate-700 dark:text-white placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none;
}

/* Decorative target/compass pattern for coaching */
.target-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='12' fill='none' stroke='%234f46e5' stroke-opacity='0.04' stroke-width='2'/%3E%3Ccircle cx='30' cy='30' r='6' fill='none' stroke='%234f46e5' stroke-opacity='0.04' stroke-width='2'/%3E%3Ccircle cx='30' cy='30' r='2' fill='%234f46e5' fill-opacity='0.04'/%3E%3C/svg%3E");
}

/* Decorative arrow pattern for transformation */
.arrow-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 60L40 20L60 60' fill='none' stroke='%234f46e5' stroke-opacity='0.03' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M40 20V55' fill='none' stroke='%234f46e5' stroke-opacity='0.03' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
}

/* Theme toggle */
.theme-toggle {
  @apply w-9 h-9 flex items-center justify-center rounded-full border border-warm-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer transition-all hover:border-primary;
}
.theme-toggle svg {
  @apply w-[1.125rem] h-[1.125rem] text-slate-700 dark:text-slate-300;
}
.icon-sun { @apply block; }
.icon-moon { @apply hidden; }
:global(html.dark) .icon-sun { @apply hidden; }
:global(html.dark) .icon-moon { @apply block; }
""")

# ── content/hero.md ──
write_file("content/hero.md", """---
headline: "Unlock Your True Potential"
subheadline: "Expert coaching to help you break through limitations, gain clarity, and achieve extraordinary results in life, career, and business. Your transformation starts with one conversation."
badge: "ICF Certified Coach | 500+ Clients Transformed"
cta_primary:
  text: "Book a Discovery Call"
  href: "#contact"
cta_secondary:
  text: "View Success Stories"
  href: "#testimonials"
stats:
  - value: "500+"
    label: "Clients Coached"
  - value: "12"
    label: "Years Experience"
  - value: "96%"
    label: "Goal Achievement"
  - value: "4.9"
    label: "Client Rating"
---
""")

# ── content/services.md ──
write_file("content/services.md", """---
title: "Coaching Programs"
subtitle: "Tailored coaching programs designed to meet you where you are and accelerate you toward where you want to be."
services:
  - icon: "lucide:crown"
    title: "Executive Coaching"
    description: "High-impact 1-on-1 coaching for C-suite leaders. Navigate high-stakes decisions, strengthen executive presence, and lead with vision and purpose."
    price: "$500/session"
  - icon: "lucide:briefcase"
    title: "Business Coaching"
    description: "Scale your business with confidence. Strategic planning, leadership development, and accountability frameworks for entrepreneurs and founders."
    price: "$350/session"
  - icon: "lucide:heart"
    title: "Life Coaching"
    description: "Gain clarity on your purpose, break through limiting beliefs, and design a life that truly fulfills you. Personal growth starts here."
    price: "$200/session"
  - icon: "lucide:graduation-cap"
    title: "Career Coaching"
    description: "Navigate career transitions, land promotions, and build a career aligned with your values. From pivot to purpose with clarity and confidence."
    price: "$200/session"
  - icon: "lucide:users"
    title: "Group Mastermind"
    description: "Accelerate growth with peer accountability. Monthly group sessions with like-minded professionals for collective breakthroughs."
    price: "$150/month"
  - icon: "lucide:sparkles"
    title: "Intensive Programs"
    description: "90-day transformation programs with weekly sessions, structured milestones, and deep accountability. For clients ready for rapid, lasting change."
    price: "Custom pricing"
---
""")

# ── content/testimonials.md ──
write_file("content/testimonials.md", """---
title: "Client Success Stories"
subtitle: "Real transformations from real clients. Here's what happens when you commit to the coaching process."
testimonials:
  - quote: "I was stuck in a career that drained me for years. Within 6 months of working with James, I had the clarity to make my move, landed my dream role, and negotiated a 40% salary increase. The ROI was incredible."
    author: "Rachel T."
    role: "Senior Product Director"
    result: "Career pivot + 40% raise"
  - quote: "As a first-time founder, I was making decisions from fear and uncertainty. Business coaching helped me develop a clear growth strategy, set boundaries, and scale from $80K to $600K in revenue within 18 months."
    author: "Marcus D."
    role: "Tech Startup Founder"
    result: "7x revenue growth"
  - quote: "Executive coaching transformed how I lead. I went from burning out and micromanaging to delegating effectively and leading with purpose. My team's engagement scores are up 35%, and I actually enjoy my work again."
    author: "Christine W."
    role: "VP of Operations"
    result: "Sustainable leadership transformation"
---
""")

# ── content/site.md ──
write_file("content/site.md", """---
name: "James Parker Coaching"
tagline: "Your Partner in Transformation"
description: "Expert coaching to help you break through limitations and achieve extraordinary results in life, career, and business."
year: 2025
---
""")

print("\\nAll content files written successfully!")
