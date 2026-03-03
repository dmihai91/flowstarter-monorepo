'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export function TeamSection() {
  const { ref: sectionRef, isVisible } = useScrollAnimation();

  const team = [
    {
      name: 'Darius',
      role: 'Co-founder & Engineer',
      bio: '10+ years building software. Now building the platform he wished existed.',
      initials: 'D',
      gradient: 'from-[var(--purple)] to-blue-500',
    },
    {
      name: 'Dorin',
      role: 'Co-founder & Designer',
      bio: 'Obsessed with design that converts, not just looks pretty.',
      initials: 'D',
      gradient: 'from-pink-500 to-[var(--purple)]',
    },
  ];

  return (
    <section ref={sectionRef} className="py-16 lg:py-24">
      <div className={`max-w-3xl mx-auto px-6 sm:px-8 transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <div className="text-center mb-10 lg:mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Built by people, not algorithms
          </h2>
          <p className="text-base text-gray-500 dark:text-white/40">
            We started Flowstarter because we needed it ourselves.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
          {team.map(({ name, role, bio, initials, gradient }) => (
            <div
              key={name}
              className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/40 dark:bg-white/[0.03] backdrop-blur-sm border border-gray-200/30 dark:border-white/[0.06]"
            >
              {/* Avatar placeholder */}
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}>
                <span className="text-xl font-bold text-white">{initials}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{name}</h3>
              <p className="text-sm font-medium text-[var(--purple)] mb-3">{role}</p>
              <p className="text-sm text-gray-500 dark:text-white/45 leading-relaxed max-w-[30ch]">
                {bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
