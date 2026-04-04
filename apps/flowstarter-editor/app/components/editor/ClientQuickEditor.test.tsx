import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useMutation, useQuery } from 'convex/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientQuickEditor } from './ClientQuickEditor';

vi.mock('convex/react', () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
}));

vi.mock('@flowstarter/flow-design-system', () => ({
  LoadingScreen: ({ message }: { message: string }) => <div>{message}</div>,
}));

describe('ClientQuickEditor', () => {
  const updateContentMock = vi.fn();
  const fetchMock = vi.fn();
  const storage = new Map<string, string>();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        storage.delete(key);
      }),
      clear: vi.fn(() => {
        storage.clear();
      }),
    });
    vi.mocked(useMutation).mockReturnValue(updateContentMock as never);
    vi.mocked(useQuery).mockReturnValue([
      {
        path: 'content/hero.md',
        content: '---\nheadline: "Original headline"\nsubheadline: "Original subheadline"\n---\n',
      },
      {
        path: 'content/site.md',
        content:
          '---\nname: "Studio North"\ntagline: "Bold work"\ndescription: "A modern studio."\ncontact:\n  email: "hello@example.com"\n  phone: "555-0101"\n  address: "Bucharest"\n---\n',
      },
    ]);
    updateContentMock.mockResolvedValue(undefined);
  });

  it('saves safe client edits back into the expected content files', async () => {
    render(<ClientQuickEditor projectId={'project_123' as never} projectName="Client Site" accessLevel="customize" />);

    fireEvent.change(screen.getByLabelText('Hero Headline'), {
      target: { value: 'A sharper headline' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'new@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(updateContentMock).toHaveBeenCalledTimes(2);
    });

    expect(updateContentMock).toHaveBeenNthCalledWith(1, {
      projectId: 'project_123',
      path: 'content/hero.md',
      content: '---\nheadline: "A sharper headline"\nsubheadline: "Original subheadline"\n---\n',
    });
    expect(updateContentMock).toHaveBeenNthCalledWith(2, {
      projectId: 'project_123',
      path: 'content/site.md',
      content:
        '---\nname: "Studio North"\ntagline: "Bold work"\ndescription: "A modern studio."\ncontact:\n  email: "new@example.com"\n  phone: "555-0101"\n  address: "Bucharest"\n---\n',
    });
  });

  it('publishes with the scoped client session token', async () => {
    localStorage.setItem('flowstarter_client_session_token', 'session_123');
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ publishedUrl: 'https://client-site.example.com' }),
    });

    render(
      <ClientQuickEditor
        projectId={'project_123' as never}
        projectName="Client Site"
        publishedUrl="https://old-site.example.com"
        accessLevel="customize"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Publish Site' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer session_123',
      },
      body: JSON.stringify({ projectId: 'project_123' }),
    });

    expect(await screen.findByText('Site published. The live preview has been refreshed.')).toBeTruthy();
  });

  it('shows a guarded fallback when the template has no client-editable content files', () => {
    vi.mocked(useQuery).mockReturnValue([
      {
        path: 'src/app/page.tsx',
        content: 'export default function Page() { return null; }',
      },
    ]);

    render(<ClientQuickEditor projectId={'project_123' as never} projectName="Client Site" accessLevel="customize" />);

    expect(screen.getByText('This template is not configured for self-serve editing yet.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Save Changes' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Publish Site' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
