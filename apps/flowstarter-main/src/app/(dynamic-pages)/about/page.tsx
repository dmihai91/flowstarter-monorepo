import { Rocket, Sparkles, Target } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 w-full mx-auto">
        {/* Hero Section with Subtle Gradient */}
        <section className="pt-20 pb-16 md:pt-32 md:pb-24 text-center bg-[linear-gradient(135deg,#f8f8ff_0%,#f3f0ff_100%)] dark:bg-[linear-gradient(135deg,#181825_0%,#232136_100%)]">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-24 h-2 bg-[--purple-primary] rounded-full mb-6" />
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl mb-4 text-foreground">
                About Flowstarter
              </h1>
              <p className="text-lg md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto">
                Empowering small businesses to build their digital presence with
                AI-powered solutions
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section as Card */}
        <section className="py-16 flex justify-center bg-background">
          <div className="w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-2xl border-2 border-[--purple-primary] shadow-2xl p-8 md:p-14 grid gap-10 lg:grid-cols-2 items-center">
            <div className="space-y-6 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-8 bg-[--purple-primary] rounded-full" />
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Our Mission
                </h2>
              </div>
              <p className="text-muted-foreground md:text-lg">
                We believe that every small business deserves a professional
                digital presence. Our mission is to make it easy and affordable
                for entrepreneurs to establish and grow their online business
                with cutting-edge AI technology.
              </p>
              <ul className="space-y-4 mt-6">
                <li className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-[var(--purple)]/10 dark:bg-[var(--purple)]/20 flex items-center justify-center">
                    <Target className="w-6 h-6 text-(--purple-primary)" />
                  </span>
                  <span className="text-muted-foreground">
                    Simplify digital presence creation for small businesses
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Sparkles
                      className="w-6 h-6"
                      style={{ color: 'var(--blue)' }}
                    />
                  </span>
                  <span className="text-muted-foreground">
                    Leverage AI to make professional design accessible
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-[var(--purple)]/10 dark:bg-[var(--purple)]/20 flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-pink-500" />
                  </span>
                  <span className="text-muted-foreground">
                    Help businesses grow and succeed online
                  </span>
                </li>
              </ul>
            </div>
            <div className="relative flex justify-center">
              <div className="rounded-xl overflow-hidden border border-border shadow-lg">
                <Image
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1600&auto=format&fit=crop"
                  alt="Team collaboration"
                  className="object-cover w-full h-full"
                  width={500}
                  height={350}
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values Section with Elevated Cards */}
        <section className="py-16 bg-linear-to-br from-[var(--purple)]/10/40 via-transparent to-blue-100/40 dark:from-[var(--purple)]/20 dark:to-blue-900/20">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col items-center mb-10">
              <div className="w-2 h-8 bg-[--purple-primary] rounded-full mb-2" />
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">
                Our Values
              </h2>
              <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto">
                These core values guide everything we do at Flowstarter
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
              <div className="flex flex-col items-center space-y-4 rounded-xl border-2 border-[--purple-primary] bg-white dark:bg-zinc-900 p-6 shadow-xl [@media(hover:hover)]:hover:shadow-2xl transition-shadow duration-300">
                <Sparkles className="w-10 h-10 text-(--purple-primary) mb-2" />
                <h3 className="text-xl font-bold">Innovation</h3>
                <p className="text-muted-foreground text-center">
                  We constantly push the boundaries of what's possible with AI
                  technology to provide the best solutions for our customers.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-xl border-2 border-blue-500 bg-white dark:bg-zinc-900 p-6 shadow-xl [@media(hover:hover)]:hover:shadow-2xl transition-shadow duration-300">
                <Target
                  className="w-10 h-10 mb-2"
                  style={{ color: 'var(--blue)' }}
                />
                <h3 className="text-xl font-bold">Accessibility</h3>
                <p className="text-muted-foreground text-center">
                  We believe in making professional digital tools accessible to
                  businesses of all sizes, regardless of technical expertise.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-xl border-2 border-pink-500 bg-white dark:bg-zinc-900 p-6 shadow-xl [@media(hover:hover)]:hover:shadow-2xl transition-shadow duration-300">
                <Rocket className="w-10 h-10 text-pink-500 mb-2" />
                <h3 className="text-xl font-bold">Customer Success</h3>
                <p className="text-muted-foreground text-center">
                  Your success is our success. We're committed to helping you
                  achieve your business goals through our platform and support.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Join Our Team Section as Card */}
        <section className="py-16 flex justify-center bg-background">
          <div className="w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-2xl border-2 border-[--purple-primary] shadow-2xl p-10 md:p-16 text-center">
            <div className="flex flex-col items-center mb-6">
              <div className="w-2 h-8 bg-[--purple-primary] rounded-full mb-2" />
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">
                Join Our Team
              </h2>
            </div>
            <p className="text-muted-foreground md:text-lg mb-8 max-w-2xl mx-auto">
              We're always looking for talented individuals who share our
              passion for helping small businesses succeed.
            </p>
            <a
              href="/careers"
              className="inline-flex h-12 items-center justify-center rounded-md bg-[--purple-primary] px-8 text-base font-semibold text-white shadow transition-colors duration-200 [@media(hover:hover)]:hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--purple-primary) focus-visible:ring-offset-2"
            >
              View Open Positions
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
