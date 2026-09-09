/**
 * The site pane shows the generated site the way a laptop would: laid out at
 * desktop width and scaled down to fit, so the page's own breakpoints see a
 * desktop and not the tablet a 900px iframe would be.
 */
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SITE_DESIGN_WIDTH, useSiteViewport } from '../steps/ConciergePanes';

type Box = { width: number; height: number };

let paneBox: Box = { width: 900, height: 600 };
let observed: { callback: ResizeObserverCallback; elements: Element[] } | null =
  null;
const originalResizeObserver = globalThis.ResizeObserver;
const originalRect = HTMLElement.prototype.getBoundingClientRect;

class FakeResizeObserver {
  elements: Element[] = [];
  constructor(private readonly callback: ResizeObserverCallback) {
    observed = { callback, elements: this.elements };
  }
  observe(el: Element) {
    this.elements.push(el);
  }
  unobserve() {}
  disconnect() {
    this.elements.length = 0;
  }
}

function Pane() {
  const viewport = useSiteViewport();
  return (
    <div ref={viewport.ref} data-testid="pane" data-scale={viewport.scale}>
      <iframe title="frame" style={viewport.frameStyle} />
    </div>
  );
}

const frame = () => screen.getByTitle('frame') as HTMLIFrameElement;
const scale = () => Number(screen.getByTestId('pane').dataset.scale);

beforeEach(() => {
  observed = null;
  HTMLElement.prototype.getBoundingClientRect = function () {
    return {
      ...paneBox,
      top: 0,
      left: 0,
      right: paneBox.width,
      bottom: paneBox.height,
      x: 0,
      y: 0,
      toJSON() {},
    } as DOMRect;
  };
});

afterEach(() => {
  globalThis.ResizeObserver = originalResizeObserver;
  HTMLElement.prototype.getBoundingClientRect = originalRect;
});

describe('the site viewport', () => {
  it('lays the frame out at desktop width and scales it to the pane', () => {
    globalThis.ResizeObserver =
      FakeResizeObserver as unknown as typeof ResizeObserver;
    paneBox = { width: 896, height: 612 };
    render(<Pane />);

    expect(scale()).toBeCloseTo(0.7, 3);
    expect(frame().style.width).toBe(`${SITE_DESIGN_WIDTH}px`);
    // Grown by the inverse of the scale, so the scaled frame fills the pane.
    expect(parseFloat(frame().style.height)).toBeCloseTo(612 / 0.7, 1);
    expect(frame().style.transform).toBe('scale(0.7)');
    expect(frame().style.transformOrigin).toBe('top left');
  });

  it('never scales up: a pane wider than the design width gets the frame at its own width', () => {
    globalThis.ResizeObserver =
      FakeResizeObserver as unknown as typeof ResizeObserver;
    paneBox = { width: 1500, height: 800 };
    render(<Pane />);

    expect(scale()).toBe(1);
    expect(frame().style.width).toBe('1500px');
    expect(frame().style.transform).toBe('scale(1)');
  });

  it('shows a phone-wide pane at its own width, so the site renders its mobile layout', () => {
    globalThis.ResizeObserver =
      FakeResizeObserver as unknown as typeof ResizeObserver;
    paneBox = { width: 360, height: 400 };
    render(<Pane />);

    expect(scale()).toBe(1);
    expect(frame().style.width).toBe('100%');
    expect(frame().style.transform).toBe('');
  });

  it('follows the pane as it resizes', () => {
    globalThis.ResizeObserver =
      FakeResizeObserver as unknown as typeof ResizeObserver;
    paneBox = { width: 1280, height: 700 };
    render(<Pane />);
    expect(scale()).toBe(1);

    paneBox = { width: 640 * 1.5, height: 700 };
    act(() => {
      observed?.callback([], {} as ResizeObserver);
    });
    expect(scale()).toBeCloseTo(0.75, 3);
  });

  it('falls back to the pane’s own width where nothing can measure it', () => {
    // jsdom has no ResizeObserver; neither will some older browsers.
    // @ts-expect-error -- simulating an environment without it
    delete globalThis.ResizeObserver;
    paneBox = { width: 900, height: 600 };
    render(<Pane />);

    expect(scale()).toBe(1);
    expect(frame().style.width).toBe('100%');
  });
});
