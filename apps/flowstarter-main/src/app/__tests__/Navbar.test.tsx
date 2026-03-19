import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExternalNavigationWithAuth } from '../components/Navbar';
import { useAuth } from '@clerk/nextjs';
import type { ComponentProps, PropsWithChildren } from 'react';

vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
  useUser: vi.fn(() => ({ user: null, isLoaded: true })),
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn() })),
}));

vi.mock('next/image', () => ({
  default: (props: ComponentProps<'img'>) => <img {...props} />,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: PropsWithChildren<ComponentProps<'a'>>) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key, locale: 'en' }),
}));


vi.mock('@/components/ui/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

vi.mock('../components/nav', () => ({
  AuthButtons: () => <div data-testid="auth-buttons">Auth</div>,
  DashboardNavControls: () => <div data-testid="dashboard-nav">Dashboard</div>,
  NavbarHeader: ({ children }: PropsWithChildren) => <header>{children}</header>,
  NavbarLogo: ({ href }: { href: string }) => <a href={href} data-testid="logo">Logo</a>,
  PublicNavLinks: () => <nav data-testid="public-links">Links</nav>,
  useCompactViewport: () => false,
  useScrolled: () => false,
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('ExternalNavigationWithAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('returns null when auth is not loaded', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false, isLoaded: false });
      const { container } = render(<ExternalNavigationWithAuth />);
      expect(container.innerHTML).toBe('');
    });
  });

  describe('Signed out', () => {
    it('renders auth buttons and theme toggle', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false, isLoaded: true });
      render(<ExternalNavigationWithAuth />);
      expect(screen.getByTestId('auth-buttons')).toBeInTheDocument();
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('links logo to home', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false, isLoaded: true });
      render(<ExternalNavigationWithAuth />);
      expect(screen.getByTestId('logo')).toHaveAttribute('href', '/');
    });
  });

  describe('Signed in', () => {
    it('renders dashboard nav controls', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: true, isLoaded: true });
      render(<ExternalNavigationWithAuth />);
      expect(screen.getByTestId('dashboard-nav')).toBeInTheDocument();
    });

    it('links logo to dashboard', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: true, isLoaded: true });
      render(<ExternalNavigationWithAuth />);
      expect(screen.getByTestId('logo')).toHaveAttribute('href', '/dashboard');
    });

    it('does not render auth buttons when signed in', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: true, isLoaded: true });
      render(<ExternalNavigationWithAuth />);
      expect(screen.queryByTestId('auth-buttons')).not.toBeInTheDocument();
    });
  });
});
