/**
 * Unit tests for Lead Capture integration
 */
import { describe, it, expect } from 'vitest';
import { injectLeadCapture } from './lead-capture';

const contactFile = {
  path: 'src/pages/contact.astro',
  content: `---
import Layout from '../layouts/Layout.astro';
---
<Layout>
  <section>
    <form>
      <input name="name" />
      <input name="email" />
      <textarea name="message"></textarea>
      <button type="submit">Send</button>
    </form>
  </section>
</Layout>`,
};

const config = {
  projectId: 'proj-123-abc',
  apiUrl: 'https://flowstarter.dev/api/leads/capture',
};

describe('injectLeadCapture', () => {
  it('adds data-lead-capture attribute to form', () => {
    const result = injectLeadCapture([contactFile], config);
    expect(result[0].content).toContain('data-lead-capture');
  });

  it('injects hidden projectId field', () => {
    const result = injectLeadCapture([contactFile], config);
    expect(result[0].content).toContain('type="hidden"');
    expect(result[0].content).toContain('name="projectId"');
    expect(result[0].content).toContain('value="proj-123-abc"');
  });

  it('injects capture script with correct API URL', () => {
    const result = injectLeadCapture([contactFile], config);
    expect(result[0].content).toContain('https://flowstarter.dev/api/leads/capture');
    expect(result[0].content).toContain("data.projectId = 'proj-123-abc'");
  });

  it('script shows success message on form submit', () => {
    const result = injectLeadCapture([contactFile], config);
    expect(result[0].content).toContain('Thank you!');
    expect(result[0].content).toContain('We will get back to you shortly');
  });

  it('script shows error state on failure', () => {
    const result = injectLeadCapture([contactFile], config);
    expect(result[0].content).toContain('Error - Try again');
  });

  it('does not modify non-contact files', () => {
    const files = [
      contactFile,
      { path: 'src/pages/about.astro', content: '<h1>About</h1>' },
    ];
    const result = injectLeadCapture(files, config);
    expect(result[1].content).toBe('<h1>About</h1>');
  });

  it('does not inject into pages without forms', () => {
    const noForm = {
      path: 'src/pages/contact.astro',
      content: '<Layout><h1>Contact</h1><p>Call us at 555-0123</p></Layout>',
    };
    const result = injectLeadCapture([noForm], config);
    expect(result[0].content).not.toContain('data-lead-capture');
  });

  it('captures source page path', () => {
    const result = injectLeadCapture([contactFile], config);
    expect(result[0].content).toContain('data.source = window.location.pathname');
  });
});
