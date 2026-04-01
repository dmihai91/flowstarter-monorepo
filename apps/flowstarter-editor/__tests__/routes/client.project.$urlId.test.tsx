import { render, screen } from '@testing-library/react';
import { useQuery } from 'convex/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ClientProjectPage, { hasStoredClientAccess } from '../../app/routes/client.project.$urlId';

vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@remix-run/react', () => ({
  useParams: vi.fn(() => ({ urlId: 'client-site' })),
}));

vi.mock('remix-utils/client-only', () => ({
  ClientOnly: ({ children }: { children: () => any }) => children(),
}));

vi.mock('@flowstarter/flow-design-system', () => ({
  LoadingScreen: ({ message }: { message: string }) => <div>{message}</div>,
}));

vi.mock('~/components/editor/ClientQuickEditor', () => ({
  ClientQuickEditor: ({ projectName }: { projectName: string }) => <div>Client quick editor for {projectName}</div>,
}));

describe('hasStoredClientAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      configurable: true,
    });
  });

  it('returns true when the stored client session matches the route url id', () => {
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
      if (key === 'flowstarter_mode') {
        return 'client';
      }

      if (key === 'flowstarter_project_url_id') {
        return 'client-site';
      }

      return null;
    });

    expect(hasStoredClientAccess('client-site')).toBe(true);
  });

  it('returns false when the stored project does not match the route url id', () => {
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
      if (key === 'flowstarter_mode') {
        return 'client';
      }

      if (key === 'flowstarter_project_url_id') {
        return 'other-site';
      }

      return null;
    });

    expect(hasStoredClientAccess('client-site')).toBe(false);
  });

  it('returns false if localStorage access throws', () => {
    vi.mocked(localStorage.getItem).mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    expect(hasStoredClientAccess('client-site')).toBe(false);
  });
});

describe('ClientProjectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      configurable: true,
    });
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
      if (key === 'flowstarter_mode') {
        return 'client';
      }

      if (key === 'flowstarter_project_url_id') {
        return 'client-site';
      }

      return null;
    });
  });

  it('renders the quick client editor for an authorized client session', () => {
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
      if (key === 'flowstarter_mode') {
        return 'client';
      }

      if (key === 'flowstarter_project_url_id') {
        return 'client-site';
      }

      if (key === 'flowstarter_client_session_token') {
        return 'session-token';
      }

      return null;
    });
    vi.mocked(useQuery)
      .mockReturnValueOnce({
        valid: true,
        projectId: 'project_123',
      })
      .mockReturnValueOnce({
        _id: 'project_123',
        name: 'Client Site',
      });

    render(<ClientProjectPage />);

    expect(screen.getByText('Client quick editor for Client Site')).toBeTruthy();
  });

  it('shows an access message when the stored session does not match the route', () => {
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
      if (key === 'flowstarter_mode') {
        return 'client';
      }

      if (key === 'flowstarter_project_url_id') {
        return 'different-site';
      }

      if (key === 'flowstarter_client_session_token') {
        return 'session-token';
      }

      return null;
    });
    vi.mocked(useQuery).mockReturnValue(undefined);

    render(<ClientProjectPage />);

    expect(screen.getByText('Open this project from your access link')).toBeTruthy();
  });
});
