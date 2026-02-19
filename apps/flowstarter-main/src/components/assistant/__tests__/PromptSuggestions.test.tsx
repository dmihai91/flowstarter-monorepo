import { I18nProvider } from '@/lib/i18n';
import en from '@/locales/en';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PromptSuggestions } from '../PromptSuggestions';

// Mock Clerk's useUser hook
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
    },
  }),
}));

// Wrapper component to provide I18n context
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nProvider initialMessages={{ en }}>{children}</I18nProvider>
);

describe('PromptSuggestions', () => {
  const mockPrompts = [
    'Build a SaaS landing page',
    'Create a portfolio website',
    'Design an e-commerce store',
  ];

  it('renders title but no prompt buttons when prompts array is empty', () => {
    render(<PromptSuggestions prompts={[]} onPromptClick={vi.fn()} />, {
      wrapper: Wrapper,
    });
    // Title should still be rendered (uses personalized greeting)
    expect(
      screen.getByText(/hi test, here are some prompt examples/i)
    ).toBeTruthy();
    // No buttons should be rendered when prompts array is empty
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBe(0);
  });

  it('renders all prompts as buttons', async () => {
    const user = userEvent.setup();
    render(
      <PromptSuggestions prompts={mockPrompts} onPromptClick={vi.fn()} />,
      { wrapper: Wrapper }
    );

    // Initially only first prompt is shown (collapsed state)
    expect(screen.getByText(mockPrompts[0])).toBeTruthy();
    expect(screen.queryByText(mockPrompts[1])).not.toBeInTheDocument();
    expect(screen.queryByText(mockPrompts[2])).not.toBeInTheDocument();

    // Click "Show more" to expand
    const expandButton = screen.getByText(/show more/i);
    await user.click(expandButton);

    // Now all prompts should be visible
    mockPrompts.forEach((prompt) => {
      expect(screen.getByText(prompt)).toBeTruthy();
    });
  });

  it('calls onPromptClick when a prompt button is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <PromptSuggestions prompts={mockPrompts} onPromptClick={handleClick} />,
      { wrapper: Wrapper }
    );

    const firstPromptButton = screen.getByText(mockPrompts[0]);
    await user.click(firstPromptButton);

    expect(handleClick).toHaveBeenCalledWith(mockPrompts[0]);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onPromptClick with correct prompt for each button', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <PromptSuggestions prompts={mockPrompts} onPromptClick={handleClick} />,
      { wrapper: Wrapper }
    );

    // Expand to see all prompts
    const expandButton = screen.getByText(/show more/i);
    await user.click(expandButton);

    // Click second prompt
    const secondPromptButton = screen.getByText(mockPrompts[1]);
    await user.click(secondPromptButton);

    expect(handleClick).toHaveBeenCalledWith(mockPrompts[1]);

    // Click third prompt
    const thirdPromptButton = screen.getByText(mockPrompts[2]);
    await user.click(thirdPromptButton);

    expect(handleClick).toHaveBeenCalledWith(mockPrompts[2]);
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});
