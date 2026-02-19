/**
 * Integration Content Generators
 * 
 * Generators for booking, contact, newsletter, payments, and social feed.
 */

import type { ContentContext, IntegrationConfig } from '../types';

// ============================================
// BOOKING
// ============================================

const BOOKING_TITLES: Record<string, { title: string; description: string; cta: string }> = {
  therapist: { title: 'Schedule a Session', description: 'Take the first step. Book a confidential consultation.', cta: 'Book Session' },
  fitness: { title: 'Book Your Training', description: 'Ready to transform? Lock in your spot.', cta: 'Book Now' },
  yoga: { title: 'Reserve Your Mat', description: 'Find your flow. Book a class today.', cta: 'Reserve Spot' },
  beauty: { title: 'Book Appointment', description: 'Treat yourself. Schedule your visit.', cta: 'Book Now' },
  food: { title: 'Make a Reservation', description: 'Secure your table for an unforgettable meal.', cta: 'Reserve Table' },
};

const DEFAULT_BOOKING = { title: 'Book a Consultation', description: 'Schedule a time that works for you.', cta: 'Confirm Booking' };

export function generateBookingMd(
  businessInfo: any,
  integration?: IntegrationConfig,
  ctx?: ContentContext
): string {
  const provider = integration?.config?.provider || null;
  const url = integration?.config?.url || null;
  const enabled = !!(provider && url);

  let providerFields = '';
  if (provider === 'calendly' && url) {
    providerFields = `calendly_url: "${url}"`;
  } else if (provider === 'calcom' && url) {
    providerFields = `calcom_url: "${url}"`;
  }

  const booking = BOOKING_TITLES[ctx?.domain.id || ''] || DEFAULT_BOOKING;

  return `---
enabled: ${enabled}
provider: ${provider ? `"${provider}"` : 'null'}
${providerFields}

title: "${booking.title}"
description: "${booking.description}"
cta: "${booking.cta}"

available_label: "Available Times"
timezone_label: "Times shown in your timezone"
slots:
  - day: "Tomorrow"
    times: ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"]
  - day: "Wednesday"
    times: ["10:00 AM", "1:00 PM", "3:00 PM"]
  - day: "Thursday"
    times: ["9:00 AM", "11:00 AM", "2:00 PM"]

fields:
  - name: "name"
    label: "Your Name"
    placeholder: "John Smith"
    required: true
  - name: "email"
    label: "Email"
    placeholder: "john@example.com"
    required: true
  - name: "phone"
    label: "Phone (optional)"
    placeholder: "+1 (555) 000-0000"
    required: false
  - name: "message"
    label: "How can we help?"
    placeholder: "Tell us about your needs..."
    required: false
    type: "textarea"

confirmation:
  title: "Booking Confirmed!"
  message: "Check your email for confirmation details."
---
`;
}

// ============================================
// PAYMENTS
// ============================================

export function generatePaymentsMd(): string {
  return `---
enabled: false
provider: null
api_key: null

title: "Secure Checkout"
description: "Your payment is protected by bank-level encryption."

card_label: "Card Number"
card_placeholder: "1234 5678 9012 3456"
expiry_label: "Expiry"
expiry_placeholder: "MM/YY"
cvc_label: "CVC"
cvc_placeholder: "123"
name_label: "Name on Card"
name_placeholder: "John Smith"

pay_button: "Complete Purchase"
processing_text: "Processing..."

trust_badges:
  - icon: "lucide:shield-check"
    text: "SSL Secured"
  - icon: "lucide:lock"
    text: "256-bit Encryption"
  - icon: "lucide:credit-card"
    text: "PCI Compliant"

summary_title: "Order Summary"
subtotal_label: "Subtotal"
tax_label: "Tax"
total_label: "Total"

success:
  title: "Payment Successful!"
  message: "Thank you for your purchase."
  cta: "Continue"

error:
  title: "Payment Failed"
  message: "Something went wrong. Please try again."
  retry: "Try Again"
---
`;
}

// ============================================
// CONTACT FORM
// ============================================

const CONTACT_TITLES: Record<string, { title: string; description: string }> = {
  therapist: { title: 'Reach Out', description: "Have questions? I'm here to help. Your message is confidential." },
  fitness: { title: "Let's Connect", description: 'Ready to start? Drop me a message.' },
  yoga: { title: 'Connect With Us', description: "Questions about classes? We'd love to hear from you." },
  food: { title: 'Get in Touch', description: 'Questions, feedback, or catering inquiries welcome.' },
  realestate: { title: 'Contact Me', description: "Thinking of buying or selling? Let's talk." },
};

const DEFAULT_CONTACT = { title: 'Get in Touch', description: "Have a question? We'd love to hear from you." };

export function generateContactFormMd(businessInfo: any, ctx?: ContentContext): string {
  const email = businessInfo.contact?.email || null;
  const phone = businessInfo.contact?.phone || null;
  const address = businessInfo.contact?.address || null;
  const hasContactInfo = !!(email || phone || address);

  const contact = CONTACT_TITLES[ctx?.domain.id || ''] || DEFAULT_CONTACT;

  return `---
enabled: false
provider: null
action_url: null

title: "${contact.title}"
description: "${contact.description}"

fields:
  - name: "name"
    label: "Name"
    placeholder: "Your name"
    type: "text"
    required: true
    width: "half"
  - name: "email"
    label: "Email"
    placeholder: "you@example.com"
    type: "email"
    required: true
    width: "half"
  - name: "phone"
    label: "Phone"
    placeholder: "+1 (555) 000-0000"
    type: "tel"
    required: false
    width: "half"
  - name: "subject"
    label: "Subject"
    placeholder: "What's this about?"
    type: "select"
    required: true
    width: "half"
    options:
      - "General Inquiry"
      - "Service Question"
      - "Partnership"
      - "Other"
  - name: "message"
    label: "Message"
    placeholder: "Tell us more..."
    type: "textarea"
    required: true
    width: "full"
    rows: 5

submit_text: "Send Message"
submitting_text: "Sending..."

success:
  title: "Message Sent!"
  message: "Thanks for reaching out. We'll get back to you soon."

contact_info:
  enabled: ${hasContactInfo}
  email: ${email ? `"${email}"` : 'null'}
  phone: ${phone ? `"${phone}"` : 'null'}
  address: ${address ? `"${address}"` : 'null'}
---
`;
}

// ============================================
// NEWSLETTER
// ============================================

const NEWSLETTER_TITLES: Record<string, { title: string; description: string; benefits: string[] }> = {
  therapist: {
    title: 'Wellness Insights',
    description: 'Tips for mental wellness delivered to your inbox.',
    benefits: ['Monthly wellness tips', 'Self-care resources', 'Workshop announcements'],
  },
  fitness: {
    title: 'Get Fit Tips',
    description: 'Weekly training tips and motivation.',
    benefits: ['Workout tips', 'Nutrition advice', 'Challenge invites', 'Early access'],
  },
  yoga: {
    title: 'Studio Updates',
    description: 'Class schedules, workshops, and mindfulness tips.',
    benefits: ['Class updates', 'Workshop invites', 'Practice tips', 'Community events'],
  },
  food: {
    title: 'From Our Kitchen',
    description: 'Recipes, specials, and exclusive offers.',
    benefits: ['New menu alerts', 'Special offers', 'Recipes', 'Event invites'],
  },
  tech: {
    title: 'Product Updates',
    description: 'Be the first to know about new features.',
    benefits: ['Feature updates', 'Tips & tricks', 'Webinar invites', 'Early access'],
  },
};

const DEFAULT_NEWSLETTER = {
  title: 'Stay Updated',
  description: 'Get the latest news and updates.',
  benefits: ['Weekly updates', 'Exclusive content', 'Special offers'],
};

export function generateNewsletterMd(
  businessInfo: any,
  integration?: IntegrationConfig,
  ctx?: ContentContext
): string {
  const provider = integration?.config?.provider || null;
  const url = integration?.config?.url || null;
  const enabled = !!(provider && url);

  let formActionUrl = '';
  if (provider && url) {
    formActionUrl = `form_action_url: "${url}"`;
  }

  const newsletter = NEWSLETTER_TITLES[ctx?.domain.id || ''] || DEFAULT_NEWSLETTER;
  const benefitsYaml = newsletter.benefits.map(b => `  - "${b}"`).join('\n');

  return `---
enabled: ${enabled}
provider: ${provider ? `"${provider}"` : 'null'}
${formActionUrl}

title: "${newsletter.title}"
description: "${newsletter.description}"
placeholder: "Enter your email"
cta: "Subscribe"
submitting: "Subscribing..."

benefits:
${benefitsYaml}

privacy: "We respect your privacy. Unsubscribe anytime."

success:
  title: "You're In!"
  message: "Check your inbox to confirm your subscription."
---
`;
}

// ============================================
// SOCIAL FEED
// ============================================

export function generateSocialFeedMd(businessInfo: any): string {
  return `---
enabled: false
provider: null
username: null

title: "Follow Us"
description: "Stay connected on social media."
cta: "Follow Us"
cta_href: "#"

placeholder_posts:
  - image: "/images/social/post-1.jpg"
    caption: "Sharing our latest work! 🎉"
    likes: 234
    type: "image"
  - image: "/images/social/post-2.jpg"
    caption: "Behind the scenes today..."
    likes: 456
    type: "image"
  - image: "/images/social/post-3.jpg"
    caption: "Exciting news coming soon!"
    likes: 189
    type: "image"
---
`;
}
