import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('@/lib/constants', () => ({
  EXTERNAL_URLS: {
    calendly: { discovery: 'https://calendly.example.com/discovery' },
  },
}));

import { MockEditorPreview } from '../MockEditorPreview';
import { useMockEditor } from '../useMockEditor';

function IntegratedEditor() {
  const editor = useMockEditor();
  return <MockEditorPreview {...editor} />;
}

describe('MockEditorPreview integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    if (window.__demoInterval) {
      clearInterval(window.__demoInterval);
      delete window.__demoInterval;
    }
  });

  it('renders autonomous prompt edits in the live site preview', () => {
    const { container } = render(<IntegratedEditor />);
    const headline = container.querySelector('[data-preview-field="headline"]');
    const introduction = container.querySelector(
      '[data-preview-field="introduction"]'
    );

    expect(headline).toHaveTextContent(
      'Coffee that makes mornings feel like home.'
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(headline).toHaveTextContent(
      'Coffee that makes every morning feel like home.'
    );

    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(introduction).toHaveTextContent('Fresh-roasted coffee, delivered.');
  });

  it('renders a complete business story instead of a placeholder wireframe', () => {
    const { container, getByText } = render(<IntegratedEditor />);

    expect(
      container.querySelector('[data-demo-section="trust"]')
    ).toHaveTextContent('Roast to dispatch');
    expect(
      container.querySelector('[data-demo-section="products"]')
    ).toHaveTextContent('House Blend');
    expect(
      container.querySelector('[data-demo-section="brand-story"]')
    ).toHaveTextContent('Small batches. Serious attention.');
    expect(
      container.querySelector('[data-demo-section="customer-proof"]')
    ).toHaveTextContent('subscriber since 2024');
    expect(
      container.querySelector('[data-preview-field="price"]')
    ).toHaveTextContent('From €24 every two weeks');
    expect(getByText('Build a subscription')).toBeInTheDocument();
  });

  it('connects a user prompt to the corresponding preview field', () => {
    const { container, getByPlaceholderText } = render(<IntegratedEditor />);
    const input = getByPlaceholderText('mockEditor.inputPlaceholder');

    fireEvent.change(input, {
      target: { value: 'Make this call to action more direct' },
    });
    fireEvent.keyDown(input, { key: 'Enter' });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(
      container.querySelector('[data-preview-field="cta"]')
    ).toHaveTextContent('Find your roast');
  });

  it('lets the user choose what to rewrite and how it should feel', () => {
    const { container, getByLabelText, getByRole } = render(
      <IntegratedEditor />
    );

    fireEvent.change(getByLabelText('mockEditor.rewrite.what'), {
      target: { value: 'headline' },
    });
    fireEvent.change(getByLabelText('mockEditor.rewrite.how'), {
      target: { value: 'shorter' },
    });
    fireEvent.click(getByRole('button', { name: 'mockEditor.rewrite.apply' }));

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(
      container.querySelector('[data-preview-field="headline"]')
    ).toHaveTextContent('Better coffee. Better mornings.');
  });

  it('lets the user choose the price terms shown on the site', () => {
    const { container, getByLabelText, getByRole } = render(
      <IntegratedEditor />
    );

    fireEvent.click(getByRole('button', { name: 'mockEditor.tool.price' }));
    fireEvent.change(getByLabelText('mockEditor.price.amount'), {
      target: { value: '29' },
    });
    fireEvent.change(getByLabelText('mockEditor.price.cadence'), {
      target: { value: 'monthly' },
    });
    fireEvent.change(getByLabelText('mockEditor.price.delivery'), {
      target: { value: 'separate' },
    });
    fireEvent.click(getByRole('button', { name: 'mockEditor.price.apply' }));

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(
      container.querySelector('[data-preview-field="price"]')
    ).toHaveTextContent('€29 per month · delivery calculated separately');
  });

  it('lets the user choose a text block and brand voice', () => {
    const { container, getByLabelText, getByRole } = render(
      <IntegratedEditor />
    );

    fireEvent.click(getByRole('button', { name: 'mockEditor.tool.tone' }));
    fireEvent.change(getByLabelText('mockEditor.tone.what'), {
      target: { value: 'service' },
    });
    fireEvent.change(getByLabelText('mockEditor.tone.how'), {
      target: { value: 'expert' },
    });
    fireEvent.click(getByRole('button', { name: 'mockEditor.tone.apply' }));

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(
      container.querySelector('[data-preview-field="service"]')
    ).toHaveTextContent(
      'Compare roast profile, origin and tasting notes before choosing.'
    );
  });

  it('lets the user choose a text block and translation language', () => {
    const { container, getByLabelText, getByRole } = render(
      <IntegratedEditor />
    );

    fireEvent.click(getByRole('button', { name: 'mockEditor.tool.translate' }));
    fireEvent.change(getByLabelText('mockEditor.translate.what'), {
      target: { value: 'cta' },
    });
    fireEvent.change(getByLabelText('mockEditor.translate.language'), {
      target: { value: 'fr' },
    });
    fireEvent.click(
      getByRole('button', { name: 'mockEditor.translate.apply' })
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(
      container.querySelector('[data-preview-field="cta"]')
    ).toHaveTextContent('Choisir mon café');
  });
});
