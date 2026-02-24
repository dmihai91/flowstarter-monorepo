'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const CALENDLY_URL = 'https://calendly.com/flowstarter/discovery';

export default function LandingPage() {
  const [activeChat, setActiveChat] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const chatExamples = [
    { user: "Add a testimonials section with 3 cards", ai: "Done! I added a testimonials section below the features. I used your brand colors and added placeholder text. Want me to help you write the actual testimonials?" },
    { user: "Change the header background to white", ai: "Updated! The header is now white with a subtle shadow on scroll. I also adjusted the logo and nav links to stay visible. How does it look?" },
    { user: "Add my phone number to the footer", ai: "Added your phone number to the footer next to the email. I also made it clickable on mobile so visitors can tap to call. Anything else?" },
  ];

  useEffect(() => {
    setIsLoaded(true);
    const interval = setInterval(() => {
      setActiveChat((prev) => (prev + 1) % chatExamples.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0C0C0E]">
      {/* Gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[400px] -left-[200px] w-[800px] h-[800px] rounded-full bg-[#A55AAC]/20 dark:bg-[#A55AAC]/10 blur-[150px]" />
        <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] rounded-full bg-[#4D5DD9]/20 dark:bg-[#4D5DD9]/10 blur-[150px]" />
        <div className="absolute -bottom-[300px] left-[30%] w-[700px] h-[500px] rounded-full bg-[#7B6AD8]/15 dark:bg-[#7B6AD8]/5 blur-[150px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0C0C0E]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Flowstarter</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">Client Login</Button>
            </Link>
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-[#0C0C0E] dark:bg-white text-white dark:text-[#0C0C0E] hover:bg-[#1a1a1a] dark:hover:bg-gray-100 rounded-lg">
                Book a Call
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Beta: 50% off until launch
              </div>
            </div>
            
            <h1 className={`text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-[1.1] mb-6 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              We build your website.
              <br />
              <span className="text-gray-400 dark:text-gray-500">You update it with AI.</span>
            </h1>
            
            <p className={`text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-xl transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              Tell us about your business in a 30-minute call. We build a professional website for you. Then use our AI editor to make changes whenever you want.
            </p>
            
            <div className={`flex flex-wrap gap-4 mb-12 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="h-12 px-6 rounded-xl bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] hover:opacity-90 text-white shadow-lg shadow-purple-500/20">
                  Book Free Discovery Call
                </Button>
              </a>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>€99.50 setup</span>
                <span>•</span>
                <span>€9.50/month</span>
              </div>
            </div>
          </div>

          {/* Editor Preview */}
          <div className={`mt-8 transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#111113] shadow-2xl shadow-black/10 dark:shadow-black/50 overflow-hidden">
              {/* Editor Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/[0.02] border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">AI Editor</div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live
                </div>
              </div>
              
              {/* Editor Content */}
              <div className="grid md:grid-cols-2 min-h-[400px]">
                {/* Chat Panel */}
                <div className="p-6 border-r border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]">
                  <div className="space-y-4">
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Chat with your website</div>
                    
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] text-white text-sm">
                        {chatExamples[activeChat].user}
                      </div>
                    </div>
                    
                    {/* AI response */}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </div>
                      <div className="flex-1 px-4 py-3 rounded-2xl rounded-tl-sm bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 text-sm text-gray-700 dark:text-gray-300">
                        {chatExamples[activeChat].ai}
                      </div>
                    </div>

                    {/* Input */}
                    <div className="mt-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-black/10 dark:border-white/10">
                      <input 
                        type="text" 
                        placeholder="Tell me what to change..." 
                        className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400"
                        readOnly
                      />
                      <Button size="sm" className="h-8 px-3 rounded-lg bg-[#0C0C0E] dark:bg-white text-white dark:text-[#0C0C0E]">
                        Send
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Preview Panel */}
                <div className="p-6 bg-white dark:bg-[#0a0a0b]">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Live Preview</div>
                  <div className="rounded-xl border border-black/5 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] p-4 space-y-4">
                    {/* Mini website preview */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9]" />
                      <div className="h-2 w-20 bg-gray-200 dark:bg-white/10 rounded" />
                      <div className="ml-auto flex gap-2">
                        <div className="h-2 w-12 bg-gray-200 dark:bg-white/10 rounded" />
                        <div className="h-2 w-12 bg-gray-200 dark:bg-white/10 rounded" />
                      </div>
                    </div>
                    <div className="h-24 rounded-lg bg-gradient-to-br from-[#A55AAC]/10 to-[#4D5DD9]/10 flex items-center justify-center">
                      <div className="text-center">
                        <div className="h-3 w-32 bg-gray-300 dark:bg-white/20 rounded mx-auto mb-2" />
                        <div className="h-2 w-48 bg-gray-200 dark:bg-white/10 rounded mx-auto" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-16 rounded-lg bg-gray-100 dark:bg-white/5 border border-black/5 dark:border-white/5" />
                      <div className="h-16 rounded-lg bg-gray-100 dark:bg-white/5 border border-black/5 dark:border-white/5" />
                      <div className="h-16 rounded-lg bg-gray-100 dark:bg-white/5 border border-black/5 dark:border-white/5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Changes apply instantly
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Example prompts */}
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="text-sm text-gray-400">Try:</span>
            {['Add a contact form', 'Change the colors', 'Add a new page', 'Update my phone number'].map((prompt, i) => (
              <button
                key={i}
                onClick={() => setActiveChat(i % chatExamples.length)}
                className="px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-sm text-gray-600 dark:text-gray-400 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* The Offer */}
      <section className="py-24 bg-gray-50 dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Here is exactly what you get
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              No vague promises. No hidden fees. This is the complete package.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Setup */}
            <div className="p-8 rounded-2xl bg-white dark:bg-[#111113] border border-black/5 dark:border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Setup</h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">€99.50</div>
                  <div className="text-sm text-gray-400 line-through">€199</div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">One-time fee. We do all the work.</p>
              <ul className="space-y-3">
                {[
                  '30-minute video call to understand your business',
                  'We design and build your complete website',
                  'Your domain configured (or we help you buy one)',
                  '2 professional email addresses (you@yourbusiness.com)',
                  'Hosted on fast global servers',
                  'Live within 3-5 business days',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Monthly */}
            <div className="p-8 rounded-2xl bg-white dark:bg-[#111113] border border-black/5 dark:border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Monthly</h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">€9.50<span className="text-base font-normal text-gray-400">/mo</span></div>
                  <div className="text-sm text-gray-400 line-through">€19/mo</div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">First month free. Cancel anytime.</p>
              <ul className="space-y-3">
                {[
                  'Website hosting (fast, secure, always online)',
                  'SSL certificate (the padlock in the browser)',
                  'Your 2 email addresses',
                  'AI Editor access to update your site',
                  '1GB storage for images and files',
                  'We keep everything running and updated',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-[#A55AAC]/10 to-[#4D5DD9]/10 border border-[#A55AAC]/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white mb-1">Beta pricing ends soon</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Lock in 50% off before we launch publicly</div>
              </div>
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Button className="bg-[#0C0C0E] dark:bg-white text-white dark:text-[#0C0C0E] hover:bg-[#1a1a1a] dark:hover:bg-gray-100 rounded-lg">
                  Book Your Call
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How the AI Editor Works */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              The AI Editor is simple
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Type what you want. Watch it happen. No coding, no design skills needed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Change content',
                examples: ['Update the homepage text', 'Add a new team member', 'Change my phone number'],
              },
              {
                title: 'Add features',
                examples: ['Add a contact form', 'Create a pricing table', 'Add an FAQ section'],
              },
              {
                title: 'Adjust design',
                examples: ['Make the header sticky', 'Change the button colors', 'Use a different font'],
              },
            ].map((category, i) => (
              <div key={i}>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{category.title}</h3>
                <ul className="space-y-2">
                  {category.examples.map((example, j) => (
                    <li key={j} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                      <span className="text-[#7B6AD8]">"</span>
                      {example}
                      <span className="text-[#7B6AD8]">"</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Questions */}
      <section className="py-24 bg-gray-50 dark:bg-white/[0.02]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Common questions</h2>
          <div className="space-y-6">
            {[
              { q: 'What happens on the discovery call?', a: 'We talk about your business, what you do, who your customers are, and what you want your website to accomplish. We ask questions, you answer. Takes about 30 minutes.' },
              { q: 'How long until my site is ready?', a: '3 to 5 business days after the call. We will send you a preview link to review before going live.' },
              { q: 'What if I want changes after you build it?', a: 'That is what the AI Editor is for. Just tell it what you want changed. "Make the logo bigger." "Add my new phone number." "Create a page for our services." It handles it.' },
              { q: 'Can I cancel the monthly subscription?', a: 'Yes, anytime. No contracts, no penalties. If you cancel, your site stays live until the end of your billing period.' },
              { q: 'What happens after the beta?', a: 'Prices go to €199 setup and €19/month. If you sign up during beta, you keep the beta price.' },
            ].map((item, i) => (
              <div key={i}>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.q}</h3>
                <p className="text-gray-600 dark:text-gray-400">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Let us build your website
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Book a free 30-minute call. If it is not a fit, no hard feelings.
          </p>
          <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="h-12 px-8 rounded-xl bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] hover:opacity-90 text-white shadow-lg shadow-purple-500/20">
              Book Free Discovery Call
            </Button>
          </a>
          <p className="mt-4 text-sm text-gray-400">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-black/5 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center">
              <span className="text-white font-bold text-xs">F</span>
            </div>
            <span className="text-sm text-gray-500">© 2026 Flowstarter</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="mailto:hello@flowstarter.app" className="hover:text-gray-900 dark:hover:text-white">hello@flowstarter.app</a>
            <Link href="/login" className="hover:text-gray-900 dark:hover:text-white">Client Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
