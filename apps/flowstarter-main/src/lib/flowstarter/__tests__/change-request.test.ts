/**
 * The change-request classifier is the routing rule between "you can do that
 * yourself in the editor" and "this reaches the team". Deterministic, so every
 * case here is a contract, not an example.
 */
import { describe, expect, it } from 'vitest';
import {
  classifyChangeRequest,
  formatChangeRequestBody,
} from '../change-request';

describe('classifyChangeRequest', () => {
  it.each([
    ['Add a page for group workshops with a booking calendar', 'new-thing'],
    ['Can you create a contact form that emails me?', 'new-thing'],
    ['I want to add a photo gallery of the studio', 'new-thing'],
    ['Remove the blog section entirely', 'new-thing'],
    ['Please rework the layout of the services page', 'relayout'],
    ['Move the testimonials section above the pricing', 'relayout'],
    ['Change the colors to something warmer', 'theme'],
    ['I would like a different font for headings', 'theme'],
    ['The button should go to my Calendly instead', 'behaviour'],
    ['Can we connect my own domain?', 'platform'],
    ['Can you translate the site to Romanian?', 'platform'],
  ])('routes "%s" to the team', (text, label) => {
    const result = classifyChangeRequest(text);
    expect(result.capability).toBe('structural');
    expect(result.matched).toContain(`structural:${label}`);
  });

  it.each([
    'Swap the hero photo for a newer one',
    'The logo looks blurry, can I replace the image?',
  ])('routes "%s" to the Pictures tab', (text) => {
    expect(classifyChangeRequest(text).capability).toBe('image');
  });

  it.each([
    'Make the headline warmer and more personal',
    'Fix the typo in the about paragraph',
    'The opening line should mention the free intro call',
  ])('routes "%s" to the Words tab', (text) => {
    expect(classifyChangeRequest(text).capability).toBe('content');
  });

  it('prefers structural when a request mixes both', () => {
    // "photo" alone is an image cue, but a new gallery is builder work.
    const result = classifyChangeRequest('Add a new page with a photo gallery');
    expect(result.capability).toBe('structural');
  });

  it('is deterministic', () => {
    const text = 'Add a booking page';
    expect(classifyChangeRequest(text)).toEqual(classifyChangeRequest(text));
  });
});

describe('formatChangeRequestBody', () => {
  it('carries the request verbatim under a recognisable header', () => {
    const body = formatChangeRequestBody({
      request: '  Add a workshops page  ',
      classification: classifyChangeRequest('Add a workshops page'),
    });
    expect(body).toContain('Change request from the site editor:');
    expect(body).toContain('Add a workshops page');
    expect(body).not.toMatch(/^\s|\s$/);
  });
});
