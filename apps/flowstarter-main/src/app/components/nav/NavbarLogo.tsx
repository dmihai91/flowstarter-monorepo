'use client';
import { Logo } from '@/components/ui/logo';

interface NavbarLogoProps {
  href: string;
  showAppName?: boolean;
}

export function NavbarLogo({ href, showAppName = true }: NavbarLogoProps) {
  return <Logo size="sm" showText={showAppName} href={href} />;
}
