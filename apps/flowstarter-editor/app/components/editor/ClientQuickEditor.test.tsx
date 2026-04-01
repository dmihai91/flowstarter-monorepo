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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMutation).mockReturnValue(updateContentMock);
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
    render(<ClientQuickEditor projectId={'project_123' as never} projectName="Client Site" />);

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
});
