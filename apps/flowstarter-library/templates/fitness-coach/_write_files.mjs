import { writeFileSync } from 'fs';

// index.astro
const indexContent = `---
import Layout from '../layouts/Layout.astro';
import { Icon } from 'astro-icon/components';

interface Service {
  icon: string;
  title: string;
  description: string;
  price: string;
}

interface MethodStep {
  step: string;
  title: string;
  description: string;
}

interface Testimonial {
  quote: string;
  author: string;
  result: string;
  type: string;
}

interface FAQ {
  question: string;
  answer: string;
}

const services: Service[] = [
  { icon: "lucide:dumbbell", title: "1-on-1 Training", description: "Fully customized training programs designed around your goals, schedule, and fitness level. Every rep counts.", price: "$85/session" },
  { icon: "lucide:users", title: "Group Classes", description: "High-energy group workouts that push you harder. Community motivation meets expert programming.", price: "$25/class" },
  { icon: "lucide:monitor", title: "Online Coaching", description: "Remote training with custom workout plans, video form checks, and weekly accountability calls.", price: "$199/month" },
  { icon: "lucide:target", title: "Weight Loss Program", description: "12-week body transformation combining training, nutrition planning, and lifestyle coaching.", price: "$499" },
  { icon: "lucide:activity", title: "Strength & Conditioning", description: "Progressive overload programming for athletes and lifters who want to get seriously strong.", price: "$100/session" },
  { icon: "lucide:apple", title: "Nutrition Planning", description: "Custom meal plans, macro coaching, and ongoing dietary support to fuel your training.", price: "$150/month" },
];

const method: MethodStep[] = [
  { step: "01", title: "Assessment", description: "We start with a full fitness assessment — body composition, movement screening, and an honest conversation about your goals." },
  { step: "02", title: "Custom Programming", description: "I build a training program tailored to your body, your goals, and your life. No cookie-cutter plans." },
  { step: "03", title: "Progressive Overload", description: "Each session builds on the last. We track every lift, every set, every PR to ensure you're always moving forward." },
  { step: "04", title: "Track & Adapt", description: "Monthly check-ins, progress photos, and program adjustments keep you on the fastest path to results." },
];

const testimonials: Testimonial[] = [
  { quote: "I lost 45 pounds in 5 months and deadlifted 300lbs for the first time. Mike's programming is next level — he made me believe I could do things I never thought possible.", author: "Marcus R.", result: "Lost 45 lbs, hit 300lb deadlift", type: "Weight Loss Client" },
  { quote: "Training with Mike got me across the finish line of my first marathon injury-free. His strength and conditioning work made me a better, more resilient runner.", author: "Sarah K.", result: "Completed first marathon", type: "Endurance Athlete" },
  { quote: "The group classes are addictive. I went from barely doing 5 push-ups to cranking out 40. The energy in those sessions is unmatched.", author: "James T.", result: "5 to 40 push-ups in 3 months", type: "Group Class Member" },
];

const faqs: FAQ[] = [
  { question: "What happens in the first session?", answer: "Your first session is a full assessment. We'll do a movement screening, discuss your goals and training history, take baseline measurements, and do a trial workout so I can see where you're at. No judgment — just a starting point." },
  { question: "How often should I train?", answer: "For most people, 3-4 sessions per week is the sweet spot. But it depends on your goals and recovery capacity. We'll find the right frequency during your assessment and adjust as you progress." },
  { question: "Do you provide nutrition guidance?", answer: "Absolutely. Nutrition is 80% of the game. I offer standalone nutrition plans and also include basic nutrition coaching with all training packages. For serious transformations, I recommend the dedicated Nutrition Planning package." },
  { question: "What if I have an injury or limitation?", answer: "I work with clients at every level, including those rehabbing injuries. I'll modify exercises as needed and coordinate with your physical therapist or doctor if necessary. Safety always comes first." },
  { question: "What's the difference between online and in-person training?", answer: "In-person training gives you real-time form corrections and hands-on coaching. Online coaching gives you flexibility — you get a custom program, video form reviews, and weekly check-ins, but train on your own schedule. Both get results." },
];

const credentials: string[] = [
  "NASM Certified Personal Trainer",
  "ACE Fitness Nutrition Specialist",
  "CSCS — Strength & Conditioning",
  "8+ Years Training Experience",
];
---

<Layout>
  <!-- Hero Section -->
  <section class="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-br from-secondary-dark via-secondary to-slate-800"></div>
    <div class="absolute inset-0 geo-pattern opacity-30"></div>
    <div class="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
    <div class="absolute top-20 right-0 w-72 h-72 bg-ember-400/10 rounded-full blur-3xl"></div>

    <div class="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div>
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-lg text-primary-light text-sm font-medium mb-6">
            <Icon name="lucide:award" class="w-4 h-4" />
            NASM Certified Personal Trainer
          </div>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-tight mb-6">
            Push Beyond Your <span class="text-primary">Limits</span>
          </h1>
          <p class="text-lg text-slate-300 mb-8 max-w-lg">
            I'm Mike Torres, and I help people build the strongest version of themselves. Custom training programs, real accountability, and results you can see.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 mb-10">
            <a href="#contact" class="btn-primary">
              Start Training Today
              <Icon name="lucide:arrow-right" class="w-5 h-5 ml-2" />
            </a>
            <a href="#programs" class="btn-outline border-white/30 text-white hover:bg-white/10 hover:border-white/50">
              View Programs
            </a>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div class="text-center">
              <div class="text-2xl font-display font-bold text-white">800+</div>
              <div class="text-sm text-slate-400">Clients Transformed</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-display font-bold text-white">8+</div>
              <div class="text-sm text-slate-400">Years Experience</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-display font-bold text-white">98%</div>
              <div class="text-sm text-slate-400">Goal Achievement</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-display font-bold text-white">4.9</div>
              <div class="text-sm text-slate-400">Star Rating</div>
            </div>
          </div>
        </div>

        <div class="relative">
          <div class="absolute inset-0 bg-gradient-to-br from-primary/30 to-ember-400/20 rounded-2xl transform rotate-3"></div>
          <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=700&fit=crop" alt="Mike Torres - Personal Trainer" class="relative rounded-2xl shadow-2xl w-full object-cover aspect-[5/6]" />
          <div class="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 rounded-xl p-5 shadow-xl">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Icon name="lucide:trophy" class="w-6 h-6 text-primary" />
              </div>
              <div>
                <div class="text-2xl font-display font-bold text-slate-800 dark:text-white">800+</div>
                <div class="text-sm text-slate-500 dark:text-slate-400">Bodies Transformed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- About Section -->
  <section id="about" class="py-20 bg-steel-50 dark:bg-slate-800/50 transition-colors">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div class="order-2 lg:order-1">
          <div class="grid grid-cols-2 gap-4">
            <img src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&h=400&fit=crop" alt="Training session" class="rounded-2xl shadow-md w-full object-cover aspect-[3/4]" />
            <img src="https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=300&h=400&fit=crop" alt="Gym training" class="rounded-2xl shadow-md w-full object-cover aspect-[3/4] mt-8" />
          </div>
        </div>

        <div class="order-1 lg:order-2">
          <p class="text-primary font-semibold mb-4 uppercase tracking-wider text-sm">About Your Coach</p>
          <h2 class="text-3xl md:text-4xl font-display font-bold text-slate-800 dark:text-white mb-6">
            Your Coach. Your Results.
          </h2>
          <p class="text-slate-600 dark:text-slate-400 mb-6">
            I've spent 8+ years helping people from all walks of life transform their bodies and mindsets. From busy professionals to competitive athletes, I design programs that actually work for real life.
          </p>
          <p class="text-slate-600 dark:text-slate-400 mb-8">
            I specialize in strength training, weight loss, and athletic performance. My approach is simple: assess where you are, build a plan that fits your life, and hold you accountable every step of the way.
          </p>
          <ul class="space-y-3">
            {credentials.map((credential: string) => (
              <li class="flex items-center gap-3">
                <div class="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                  <Icon name="lucide:check" class="w-4 h-4 text-primary" />
                </div>
                <span class="text-slate-700 dark:text-slate-300 font-medium">{credential}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- Programs Section -->
  <section id="programs" class="py-20 bg-cream dark:bg-slate-900 transition-colors">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-2xl mx-auto mb-16">
        <p class="text-primary font-semibold mb-4 uppercase tracking-wider text-sm">Programs</p>
        <h2 class="text-3xl md:text-4xl font-display font-bold text-slate-800 dark:text-white mb-6">Training Programs Built for Results</h2>
        <p class="text-slate-600 dark:text-slate-400">Whether you want to lose weight, build muscle, or train for competition — there's a program for you.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service: Service) => (
          <div class="card group hover:-translate-y-1">
            <div class="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
              <Icon name={service.icon} class="w-7 h-7 text-primary group-hover:text-white" />
            </div>
            <h3 class="text-xl font-display font-bold text-slate-800 dark:text-white mb-3">{service.title}</h3>
            <p class="text-slate-600 dark:text-slate-400 mb-4">{service.description}</p>
            <div class="flex items-center justify-between pt-4 border-t border-steel-200 dark:border-slate-700">
              <span class="text-primary font-bold text-lg">{service.price}</span>
              <a href="#contact" class="text-sm text-slate-500 hover:text-primary transition-colors font-medium flex items-center gap-1">
                Get Started <Icon name="lucide:arrow-right" class="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>

  <!-- Method Section -->
  <section class="py-20 bg-secondary dark:bg-slate-800 transition-colors">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-2xl mx-auto mb-16">
        <p class="text-primary font-semibold mb-4 uppercase tracking-wider text-sm">The Method</p>
        <h2 class="text-3xl md:text-4xl font-display font-bold text-white mb-6">How We Get You Results</h2>
        <p class="text-slate-300">A proven 4-step system that's transformed 800+ clients. No guesswork — just science and consistency.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {method.map((item: MethodStep) => (
          <div class="text-center">
            <div class="w-16 h-16 bg-primary text-white rounded-xl flex items-center justify-center font-display font-bold text-xl mx-auto mb-5">{item.step}</div>
            <h3 class="text-lg font-display font-bold text-white mb-3">{item.title}</h3>
            <p class="text-slate-400">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>

  <!-- Testimonials Section -->
  <section id="results" class="py-20 bg-cream dark:bg-slate-900 transition-colors">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-2xl mx-auto mb-16">
        <p class="text-primary font-semibold mb-4 uppercase tracking-wider text-sm">Client Results</p>
        <h2 class="text-3xl md:text-4xl font-display font-bold text-slate-800 dark:text-white mb-6">Real People. Real Transformations.</h2>
        <p class="text-slate-600 dark:text-slate-400">Don't take my word for it. Here's what happens when you commit to the process.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((testimonial: Testimonial) => (
          <div class="card-steel">
            <div class="flex items-center gap-2 mb-4">
              {[1,2,3,4,5].map((_: number) => (
                <Icon name="lucide:star" class="w-5 h-5 text-primary fill-primary" />
              ))}
            </div>
            <p class="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">"{testimonial.quote}"</p>
            <div class="border-t border-steel-300 dark:border-slate-700 pt-4">
              <div class="font-display font-bold text-slate-800 dark:text-white">{testimonial.author}</div>
              <div class="text-sm text-primary font-medium">{testimonial.result}</div>
              <div class="text-sm text-slate-500 dark:text-slate-400">{testimonial.type}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>

  <!-- FAQ Section -->
  <section id="faq" class="py-20 bg-steel-50 dark:bg-slate-800/50 transition-colors">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <p class="text-primary font-semibold mb-4 uppercase tracking-wider text-sm">FAQ</p>
        <h2 class="text-3xl md:text-4xl font-display font-bold text-slate-800 dark:text-white mb-6">Got Questions?</h2>
        <p class="text-slate-600 dark:text-slate-400">Here are the most common things people ask before getting started.</p>
      </div>

      <div class="space-y-4">
        {faqs.map((faq: FAQ, index: number) => (
          <div class="faq-item bg-white dark:bg-slate-800 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-slate-700 overflow-hidden">
            <button class="faq-trigger w-full px-6 py-5 flex items-center justify-between text-left" data-index={index}>
              <span class="font-display font-semibold text-slate-800 dark:text-white pr-4">{faq.question}</span>
              <Icon name="lucide:chevron-down" class="w-5 h-5 text-primary transition-transform faq-icon flex-shrink-0" />
            </button>
            <div class="faq-content hidden px-6 pb-5">
              <p class="text-slate-600 dark:text-slate-400">{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>

  <!-- Contact Section -->
  <section id="contact" class="py-20 bg-cream dark:bg-slate-900 transition-colors">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <p class="text-primary font-semibold mb-4 uppercase tracking-wider text-sm">Let's Go</p>
          <h2 class="text-3xl md:text-4xl font-display font-bold text-slate-800 dark:text-white mb-6">Ready to Transform?</h2>
          <p class="text-slate-600 dark:text-slate-400 mb-8">Stop thinking about it. Book a free consultation and let's map out your game plan. No pressure, no commitment — just a conversation about your goals.</p>

          <div class="space-y-6 mb-8">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name="lucide:map-pin" class="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 class="font-display font-semibold text-slate-800 dark:text-white mb-1">Training Location</h4>
                <p class="text-slate-600 dark:text-slate-400">456 Iron Street, Fitness District<br>Austin, TX 78701</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name="lucide:clock" class="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 class="font-display font-semibold text-slate-800 dark:text-white mb-1">Training Hours</h4>
                <p class="text-slate-600 dark:text-slate-400">Monday – Friday: 5am – 9pm<br>Saturday: 7am – 2pm<br>Sunday: Closed</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name="lucide:phone" class="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 class="font-display font-semibold text-slate-800 dark:text-white mb-1">Contact</h4>
                <p class="text-slate-600 dark:text-slate-400">
                  <a href="tel:+15553456789" class="hover:text-primary transition-colors">(555) 345-6789</a><br>
                  <a href="mailto:mike@torresfit.com" class="hover:text-primary transition-colors">mike@torresfit.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg dark:shadow-none dark:border dark:border-slate-700">
          <h3 class="text-xl font-display font-bold text-slate-800 dark:text-white mb-6">Book Your Free Consultation</h3>
          <form class="space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">First Name</label>
                <input type="text" class="input" placeholder="Your first name" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Last Name</label>
                <input type="text" class="input" placeholder="Your last name" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
              <input type="email" class="input" placeholder="your@email.com" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone</label>
              <input type="tel" class="input" placeholder="(555) 345-6789" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">What are your fitness goals?</label>
              <textarea rows="4" class="textarea" placeholder="Tell me about your goals — weight loss, muscle gain, athletic performance, etc."></textarea>
            </div>
            <button type="submit" class="btn-primary w-full">
              Book Free Consultation
              <Icon name="lucide:arrow-right" class="w-5 h-5 ml-2" />
            </button>
            <p class="text-xs text-slate-500 dark:text-slate-400 text-center">Free 30-minute consultation. No obligation.</p>
          </form>
        </div>
      </div>
    </div>
  </section>
</Layout>

<script>
  document.querySelectorAll('.faq-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.faq-item');
      const content = item?.querySelector('.faq-content');
      const icon = trigger.querySelector('.faq-icon');

      document.querySelectorAll('.faq-item').forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.querySelector('.faq-content')?.classList.add('hidden');
          otherItem.querySelector('.faq-icon')?.classList.remove('rotate-180');
        }
      });

      content?.classList.toggle('hidden');
      icon?.classList.toggle('rotate-180');
    });
  });
</script>
`;

writeFileSync('src/pages/index.astro', indexContent);
console.log('index.astro written');

// hero.md
const heroContent = `---
headline: "Push Beyond Your Limits"
subheadline: "Personal training that delivers real results. Whether you're building strength, losing weight, or training for competition — I'll coach you every step of the way."
badge: "NASM Certified • 800+ Clients Transformed"
cta_primary:
  text: "Start Training Today"
  href: "#contact"
cta_secondary:
  text: "View Programs"
  href: "#programs"
stats:
  - value: "800+"
    label: "Clients Transformed"
  - value: "8+"
    label: "Years Experience"
  - value: "98%"
    label: "Goal Achievement"
  - value: "4.9"
    label: "Star Rating"
---
`;
writeFileSync('content/hero.md', heroContent);
console.log('hero.md written');

// services.md
const servicesContent = `---
title: "Training Programs"
subtitle: "Whether you want to lose weight, build muscle, or train for competition — there's a program for you."
services:
  - icon: "lucide:dumbbell"
    title: "1-on-1 Training"
    description: "Fully customized training programs designed around your goals, schedule, and fitness level. Every rep counts."
    price: "$85/session"
  - icon: "lucide:users"
    title: "Group Classes"
    description: "High-energy group workouts that push you harder. Community motivation meets expert programming."
    price: "$25/class"
  - icon: "lucide:monitor"
    title: "Online Coaching"
    description: "Remote training with custom workout plans, video form checks, and weekly accountability calls."
    price: "$199/month"
  - icon: "lucide:target"
    title: "Weight Loss Program"
    description: "12-week body transformation combining training, nutrition planning, and lifestyle coaching."
    price: "$499"
  - icon: "lucide:activity"
    title: "Strength & Conditioning"
    description: "Progressive overload programming for athletes and lifters who want to get seriously strong."
    price: "$100/session"
  - icon: "lucide:apple"
    title: "Nutrition Planning"
    description: "Custom meal plans, macro coaching, and ongoing dietary support to fuel your training."
    price: "$150/month"
---
`;
writeFileSync('content/services.md', servicesContent);
console.log('services.md written');

// testimonials.md
const testimonialsContent = `---
title: "Client Results"
subtitle: "Real people, real transformations. Here's what happens when you commit to the process."
testimonials:
  - quote: "I lost 45 pounds in 5 months and deadlifted 300lbs for the first time. Mike's programming is next level — he made me believe I could do things I never thought possible."
    author: "Marcus R."
    role: "Software Engineer"
    result: "Lost 45 lbs, hit 300lb deadlift"
  - quote: "Training with Mike got me across the finish line of my first marathon injury-free. His strength and conditioning work made me a better, more resilient runner."
    author: "Sarah K."
    role: "Marketing Director"
    result: "Completed first marathon"
  - quote: "The group classes are addictive. I went from barely doing 5 push-ups to cranking out 40. The energy in those sessions is unmatched."
    author: "James T."
    role: "Teacher"
    result: "5 to 40 push-ups in 3 months"
---
`;
writeFileSync('content/testimonials.md', testimonialsContent);
console.log('testimonials.md written');

// site.md
const siteContent = `---
name: "Mike Torres Fitness"
tagline: "Your Body. Your Goals. Your Results."
description: "Certified personal trainer specializing in strength training, weight loss, and athletic performance. Custom programs, real accountability, real results."
year: 2025
---
`;
writeFileSync('content/site.md', siteContent);
console.log('site.md written');

console.log('All files written successfully!');
