import { describe, it, expect } from 'vitest';
import {
  FILL_CLOSE_MARKER,
  FILL_OPEN_MARKER,
  parseFillFromHtml,
} from '../src/lib/site-template';

// parseFillFromHtml used to run `/<!--FILL([\s\S]*?)FILL-->/` over a rendered
// page. That pattern is ambiguous: on a page that opens the marker many times
// and never closes it, the engine restarts the lazy scan at each opening and
// the match cost grows with the square of the input (CodeQL js/polynomial-redos).
// The scanner that replaced it has to keep the old answers and stay linear.

function wrap(json: string): string {
  return `<html><head>${FILL_OPEN_MARKER}${json}${FILL_CLOSE_MARKER}</head><body></body></html>`;
}

describe('parseFillFromHtml', () => {
  it('reads the fill back out of a rendered page', () => {
    const fill = { brand: { name: 'Atelier Nord', tagline: 'Joinery' } };
    expect(parseFillFromHtml(wrap(JSON.stringify(fill)))).toEqual(fill);
  });

  it('stops at the first closing marker even when it sits inside the JSON', () => {
    const fill = { brand: { name: 'FILL--> and <!--FILL' } };
    // The closing marker inside the string ends the capture first, exactly as
    // the lazy pattern did, so this is not valid JSON and the parse fails.
    expect(parseFillFromHtml(wrap(JSON.stringify(fill)))).toBeNull();
  });

  it('returns null when the opening marker is missing', () => {
    expect(parseFillFromHtml('<html><head></head></html>')).toBeNull();
  });

  it('returns null when the closing marker is missing', () => {
    expect(parseFillFromHtml(`<html>${FILL_OPEN_MARKER}{"a":1}</html>`)).toBeNull();
  });

  it('returns null when the captured text is not JSON', () => {
    expect(parseFillFromHtml(wrap('not json at all'))).toBeNull();
  });

  it('takes the first opening marker, like the pattern it replaced', () => {
    const html = `${FILL_OPEN_MARKER}{"first":true}${FILL_CLOSE_MARKER}${FILL_OPEN_MARKER}{"second":true}${FILL_CLOSE_MARKER}`;
    expect(parseFillFromHtml(html)).toEqual({ first: true });
  });

  it('captures from the first opening marker even when another opens before the close', () => {
    // `<!--FILL` appears twice; only the text from the first opening to the
    // first closing marker is captured, and here that text is not JSON.
    const html = `${FILL_OPEN_MARKER}junk ${FILL_OPEN_MARKER}{"ok":true}${FILL_CLOSE_MARKER}`;
    expect(parseFillFromHtml(html)).toBeNull();
  });

  it('stays fast on the input shape the old pattern choked on', () => {
    // Many openings, no closing marker: quadratic for the old regular
    // expression, one forward scan for the replacement.
    const hostile = `${FILL_OPEN_MARKER}${`${FILL_OPEN_MARKER}a`.repeat(200_000)}`;
    const started = Date.now();
    expect(parseFillFromHtml(hostile)).toBeNull();
    expect(Date.now() - started).toBeLessThan(1_000);
  });
});
