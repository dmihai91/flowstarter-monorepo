import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserMenu } from '../user-menu';

let mockPathname = '/dashboard';
const mockPush = vi.fn();
const mockSignOut = vi.fn().mockResolvedValue(undefined);

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

vi.mock('@clerk/nextjs', () => ({
  useClerk: () => ({ signOut: mockSignOut }),
  useUser: () => ({
    user: {
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      imageUrl: 'https://example.com/avatar.jpg',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    },
  }),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown">{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick, onSelect, className, variant }: any) => (
    <button onClick={onClick || onSelect} className={`${className || ''} ${variant === 'destructive' ? 'text-red-600' : ''}`} data-testid="menu-item">{children}</button>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: any) => <div data-testid="trigger">{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  AlertDialogAction: ({ children, onClick }: any) => <button onClick={onClick} data-testid="confirm">{children}</button>,
  AlertDialogCancel: ({ children }: any) => <button data-testid="cancel">{children}</button>,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

describe('UserMenu', () => {
  beforeEach(() => {
    mockPathname = '/dashboard';
    mockPush.mockClear();
    mockSignOut.mockClear();
  });

  it('renders user avatar', () => {
    render(<UserMenu />);
    const avatar = document.querySelector('img[src="https://example.com/avatar.jpg"]');
    expect(avatar).toBeInTheDocument();
  });

  it('shows user name in dropdown', () => {
    render(<UserMenu />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('shows user email in dropdown', () => {
    render(<UserMenu />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows Profile + Settings for client pages', () => {
    render(<UserMenu />);
    expect(screen.getByText('app.profile')).toBeInTheDocument();
    expect(screen.getByText('app.settings')).toBeInTheDocument();
  });

  it('shows Security link for team pages', () => {
    mockPathname = '/team/dashboard';
    render(<UserMenu />);
    expect(screen.getByText('team.sidebar.security')).toBeInTheDocument();
    expect(screen.getByText('app.profile')).toBeInTheDocument();
  });

  it('has sign-out button with red styling', () => {
    render(<UserMenu />);
    const signOutBtn = screen.getByText('app.signOut').closest('button');
    expect(signOutBtn?.className).toContain('text-red-600');
  });

  it('navigates to /profile on profile click', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<UserMenu />);
    const profileBtn = screen.getByText('app.profile').closest('button');
    if (profileBtn) await user.click(profileBtn);
    expect(mockPush).toHaveBeenCalledWith('/profile');
  });
});
