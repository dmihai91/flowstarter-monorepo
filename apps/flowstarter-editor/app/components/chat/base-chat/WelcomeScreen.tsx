/**
 * BaseChat - WelcomeScreen Component
 *
 * The intro section shown before chat starts.
 */

import { TextShimmer } from '~/components/ui/text-shimmer';
import { Logo } from './Logo';

export function WelcomeScreen() {
  return (
    <div id="intro" className="mt-8 max-w-3xl mx-auto text-center px-4 lg:px-0">
      <h1 className="flex flex-wrap items-center gap-2 text-flowstarter-elements-textPrimary justify-center font-display font-bold text-3xl tracking-tight mb-4">
        <span className="text-flowstarter-elements-textPrimary">Welcome to </span>
        <Logo />
        <span className="text-flowstarter-elements-textPrimary"> Deploy</span>
      </h1>
      <p className="text-md lg:text-xl mb-8 text-flowstarter-elements-textSecondary animate-fade-in animation-delay-200">
        <TextShimmer>Let your imagination build your next startup idea</TextShimmer>
      </p>
    </div>
  );
}
