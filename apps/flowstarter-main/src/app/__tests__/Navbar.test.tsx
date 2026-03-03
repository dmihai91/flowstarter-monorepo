import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExternalNavigationWithAuth } from '../components/Navbar';
import { useAuth } from '@clerk/nextjs';

vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
  useUser: vi.fn(() => ({ user: null, isLoaded: true })),
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn() })),
}));

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key, locale: 'en' }),
}));

vi.mock('@/store/wizard-store', () => ({
  useWizardStore: vi.fn(() => ({ currentStep: 0, projectName: '' })),
}));

vi.mock('@/components/ui/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

vi.mock('../components/nav', () => ({
  AuthButtons: () => <div data-testid="auth-buttons">Auth</div>,
  DashboardNavControls: () => <div data-testid="dashboard-nav">Dashboard</div>,
  NavbarHeader: ({ children }: any) => <header>{children}</header>,
  NavbarLogo: ({ href }: any) => <a href={href} data-testid="logo">Logo</a>,
  PublicNavLinks: () => <nav data-testid="public-links">Links</nav>,
  WizardNavControls: () => <div data-testid="wizard-nav">Wizard</div>,
  useCompactViewport: () => false,
  useScrolled: () => false,
  useWizardNavbar: () => ({ isOnWizard: false }),
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
