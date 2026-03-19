import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppHeader } from '../app-header';
import type { PropsWithChildren } from 'react';

// Mock dependencies
const mockSetIsMobileOpen = vi.fn();
let mockPathname = '/dashboard';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

vi.mock('@/contexts/SidebarContext', () => ({
  useSidebar: () => ({
    setIsMobileOpen: mockSetIsMobileOpen,
  }),
}));

vi.mock('@flowstarter/flow-design-system', () => ({
  ScrollAwareHeader: ({ children, className }: PropsWithChildren<{ className?: string }>) => (
    <header className={className} data-testid="header">{children}</header>
  ),
}));

vi.mock('@/components/ui/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

vi.mock('@/components/ui/logo', () => ({
  Logo: ({ size }: { size: string }) => <div data-testid={`logo-${size}`} />,
}));

vi.mock('@/components/ui/user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu" />,
}));

describe('AppHeader', () => {
  beforeEach(() => {
    mockPathname = '/dashboard';
    mockSetIsMobileOpen.mockClear();
  });

  it('renders single header element', () => {
    render(<AppHeader />);
    const headers = screen.getAllByTestId('header');
    expect(headers).toHaveLength(1);
  });

  it('renders logo linking to /dashboard for client', () => {
    render(<AppHeader />);
    const link = document.querySelector('a[href="/dashboard"]');
    expect(link).toBeInTheDocument();
  });

  it('renders logo linking to /team/dashboard for team', () => {
    mockPathname = '/team/dashboard';
    render(<AppHeader />);
    const link = document.querySelector('a[href="/team/dashboard"]');
    expect(link).toBeInTheDocument();
  });

  it('shows Team badge on team pages', () => {
    mockPathname = '/team/dashboard';
    render(<AppHeader />);
    expect(screen.getByText('Team')).toBeInTheDocument();
  });

  it('does NOT show Team badge on client pages', () => {
    mockPathname = '/dashboard';
    render(<AppHeader />);
    expect(screen.queryByText('Team')).not.toBeInTheDocument();
  });

  it('renders theme toggle', () => {
    render(<AppHeader />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('renders user menu', () => {
    render(<AppHeader />);
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('renders mobile hamburger button', () => {
    render(<AppHeader />);
    const btn = screen.getByLabelText('Open menu');
    expect(btn).toBeInTheDocument();
  });

  it('opens mobile sidebar on hamburger click', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<AppHeader />);
    await user.click(screen.getByLabelText('Open menu'));
    expect(mockSetIsMobileOpen).toHaveBeenCalledWith(true);
  });

  it('has consistent z-index across all states', () => {
    render(<AppHeader />);
    const header = screen.getByTestId('header');
    expect(header.className).toContain('z-[100]');
  });
});
