'use client';
import { Dialog } from '@headlessui/react';
import Link from 'next/link';
import { ComponentProps, useState } from 'react';

function MenuIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      {...props}
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      {...props}
    >
      <path d="M5 5l14 14M19 5l-14 14" />
    </svg>
  );
}

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Templates', href: '/templates' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'About', href: '/about' },
];

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  // useEffect(() => {
  //   if (!isOpen) return

  //   function onRouteChange() {
  //     setIsOpen(false)
  //   }

  //   router.events.on('routeChangeComplete', onRouteChange)
  //   router.events.on('routeChangeError', onRouteChange)

  //   return () => {
  //     router.events.off('routeChangeComplete', onRouteChange)
  //     router.events.off('routeChangeError', onRouteChange)
  //   }
  // }, [router, isOpen])

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative"
        aria-label="Open navigation"
      >
        <MenuIcon className="h-6 w-6 stroke-slate-500" />
      </button>
      <Dialog
        open={isOpen}
        onClose={setIsOpen}
        className="fixed inset-0 z-50 flex items-start overflow-y-auto bg-slate-900/50 pr-10 backdrop-blur-sm lg:hidden"
        aria-label="Navigation"
      >
        <Dialog.Panel className="min-h-full w-full max-w-xs bg-[rgba(243,243,243,0.95)] dark:bg-[rgba(58,58,74,0.95)] backdrop-blur-xl border-r border-gray-200 dark:border-white/40 px-4 pb-12 pt-5 sm:px-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2"
              aria-label="Home page"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logos/flowstarter-mark.svg"
                className="h-8 w-8"
                alt="Flowstarter Logo"
              />
              <span className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-400 dark:to-indigo-300 bg-clip-text text-transparent">
                Flowstarter
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close navigation"
              className="rounded-md p-2 text-slate-500 [@media(hover:hover)]:hover:bg-slate-100 dark:[@media(hover:hover)]:hover:bg-slate-800"
            >
              <CloseIcon className="h-6 w-6 stroke-slate-500" />
            </button>
          </div>
          <nav className="mt-8 flex flex-col space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="rounded-md px-3 py-2 text-base font-medium text-slate-900 [@media(hover:hover)]:hover:bg-slate-100 dark:text-white dark:[@media(hover:hover)]:hover:bg-slate-800"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}
