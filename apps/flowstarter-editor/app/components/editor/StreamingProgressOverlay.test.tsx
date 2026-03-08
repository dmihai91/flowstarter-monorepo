import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreamingProgressOverlay } from './StreamingProgressOverlay';

describe('StreamingProgressOverlay', () => {
  it('returns null when not streaming', () => {
    const { container } = render(
      <StreamingProgressOverlay isStreaming={false} streamedFiles={[]} streamedCount={0} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders overlay when streaming', () => {
    render(<StreamingProgressOverlay isStreaming={true} streamedFiles={[]} streamedCount={0} />);
    expect(screen.getByText('Building your site...')).toBeTruthy();
  });

  it('shows "Initializing agent..." when no files yet', () => {
    render(<StreamingProgressOverlay isStreaming={true} streamedFiles={[]} streamedCount={0} />);
    expect(screen.getByText('Initializing agent...')).toBeTruthy();
  });

  it('shows streamed file paths', () => {
    const files = ['src/index.html', 'src/styles.css', 'src/script.js'];
    render(<StreamingProgressOverlay isStreaming={true} streamedFiles={files} streamedCount={3} />);
    expect(screen.getByText('src/index.html')).toBeTruthy();
    expect(screen.getByText('src/styles.css')).toBeTruthy();
    expect(screen.getByText((content) => content.includes('src/script.js'))).toBeTruthy();
  });

  it('shows correct file count', () => {
    render(
      <StreamingProgressOverlay isStreaming={true} streamedFiles={['a.html']} streamedCount={12} />
    );
    expect(screen.getByText('12 files written')).toBeTruthy();
  });

  it('uses singular "file" for count of 1', () => {
    render(
      <StreamingProgressOverlay isStreaming={true} streamedFiles={['a.html']} streamedCount={1} />
    );
    expect(screen.getByText('1 file written')).toBeTruthy();
  });
});
