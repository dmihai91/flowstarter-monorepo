import { describe, it, expect, vi, afterEach } from 'vitest';
import { smoothScrollToSection, handleSmoothScroll } from '../smoothScroll';

describe('smoothScroll', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('smoothScrollToSection', () => {
    it('does nothing if element not found', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      smoothScrollToSection('nonexistent');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('nonexistent'));
      expect(scrollToSpy).not.toHaveBeenCalled();
    });

    it('calls requestAnimationFrame for existing element', () => {
      const el = document.createElement('div');
      el.id = 'target';
      document.body.appendChild(el);
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top: 500, bottom: 600, left: 0, right: 100,
        width: 100, height: 100, x: 0, y: 500, toJSON: () => {},
      });
      vi.spyOn(console, 'log').mockImplementation(() => {});
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);

      smoothScrollToSection('target');
      expect(rafSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleSmoothScroll', () => {
    it('does nothing for non-hash links', () => {
      const event = { preventDefault: vi.fn() } as unknown as React.MouseEvent<HTMLAnchorElement>;
      handleSmoothScroll(event, '/about');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('prevents default for hash links', () => {
      const el = document.createElement('div');
      el.id = 'features';
      document.body.appendChild(el);
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top: 300, bottom: 400, left: 0, right: 100,
        width: 100, height: 100, x: 0, y: 300, toJSON: () => {},
      });
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);

      const event = { preventDefault: vi.fn() } as unknown as React.MouseEvent<HTMLAnchorElement>;
      handleSmoothScroll(event, '#features');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('updates URL hash via pushState', () => {
      const el = document.createElement('div');
      el.id = 'pricing';
      document.body.appendChild(el);
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top: 200, bottom: 300, left: 0, right: 100,
        width: 100, height: 100, x: 0, y: 200, toJSON: () => {},
      });
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
      const pushStateSpy = vi.spyOn(history, 'pushState').mockImplementation(() => {});

      const event = { preventDefault: vi.fn() } as unknown as React.MouseEvent<HTMLAnchorElement>;
      handleSmoothScroll(event, '#pricing');
      expect(pushStateSpy).toHaveBeenCalledWith(null, '', '#pricing');
    });
  });
});
