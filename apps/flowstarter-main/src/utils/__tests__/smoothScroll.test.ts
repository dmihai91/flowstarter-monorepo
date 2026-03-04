import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { smoothScrollToSection, handleSmoothScroll } from '../smoothScroll';

describe('smoothScroll', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('smoothScrollToSection', () => {
    it('does nothing if element not found', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      smoothScrollToSection('nonexistent');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('nonexistent'));
      expect(window.scrollTo).not.toHaveBeenCalled();
    });

    it('scrolls to target element', () => {
      const el = document.createElement('div');
      el.id = 'target';
      document.body.appendChild(el);
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top: 500,
        bottom: 600,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
        x: 0,
        y: 500,
        toJSON: () => {},
      });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      smoothScrollToSection('target');
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('handleSmoothScroll', () => {
    it('does nothing for non-hash links', () => {
      const event = {
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent<HTMLAnchorElement>;
      handleSmoothScroll(event, '/about');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('prevents default for hash links', () => {
      const el = document.createElement('div');
      el.id = 'features';
      document.body.appendChild(el);
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top: 300,
        bottom: 400,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
        x: 0,
        y: 300,
        toJSON: () => {},
      });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const event = {
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent<HTMLAnchorElement>;

      handleSmoothScroll(event, '#features');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('updates URL hash via pushState', () => {
      const el = document.createElement('div');
      el.id = 'pricing';
      document.body.appendChild(el);
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top: 200,
        bottom: 300,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
        x: 0,
        y: 200,
        toJSON: () => {},
      });
      vi.spyOn(console, 'log').mockImplementation(() => {});
      const pushStateSpy = vi.spyOn(history, 'pushState').mockImplementation(() => {});

      const event = {
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent<HTMLAnchorElement>;

      handleSmoothScroll(event, '#pricing');
      expect(pushStateSpy).toHaveBeenCalledWith(null, '', '#pricing');
    });
  });
});
