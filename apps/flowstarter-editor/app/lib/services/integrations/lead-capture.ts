/**
 * Lead Capture Integration
 *
 * Injects a form handler into the generated contact page that POSTs
 * form submissions to our API. Leads are stored in Supabase and
 * shown on the client dashboard.
 *
 * The generated form gets:
 * 1. A hidden projectId field
 * 2. A JS submit handler that POSTs to /api/leads/capture
 * 3. Success/error feedback
 */

export interface LeadCaptureConfig {
  projectId: string;
  apiUrl: string; // e.g. https://flowstarter.dev/api/leads/capture
}

/** Inline script that handles form submission */
function captureScript(apiUrl: string, projectId: string): string {
  return `
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const form = document.querySelector('form[data-lead-capture]') || document.querySelector('form');
        if (!form) return;
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const btn = form.querySelector('button[type="submit"]');
          const origText = btn?.textContent || 'Send';
          if (btn) { btn.textContent = 'Sending...'; btn.disabled = true; }
          try {
            const fd = new FormData(form);
            const data = Object.fromEntries(fd.entries());
            data.projectId = '${projectId}';
            data.source = window.location.pathname;
            const res = await fetch('${apiUrl}', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });
            if (res.ok) {
              form.innerHTML = '<div class="text-center py-8"><h3 class="text-xl font-semibold text-green-600 mb-2">Thank you!</h3><p class="text-gray-600">We will get back to you shortly.</p></div>';
            } else {
              if (btn) { btn.textContent = 'Error - Try again'; btn.disabled = false; }
            }
          } catch {
            if (btn) { btn.textContent = origText; btn.disabled = false; }
          }
        });
      });
    <\/script>`;
}

/**
 * Inject lead capture into generated site files.
 * Adds submit handler script to contact page forms.
 */
export function injectLeadCapture(
  files: Array<{ path: string; content: string }>,
  config: LeadCaptureConfig,
): Array<{ path: string; content: string }> {
  return files.map((file) => {
    // Only inject into contact page
    if (!file.path.toLowerCase().includes('contact')) return file;
    if (!file.content.includes('<form') && !file.content.includes('</form>')) return file;

    let content = file.content;

    // Add data-lead-capture attribute to the form
    content = content.replace(/<form([^>]*)>/, '<form$1 data-lead-capture>');

    // Add hidden projectId field
    content = content.replace(
      /<form([^>]*)>/,
      `<form$1>\n    <input type="hidden" name="projectId" value="${config.projectId}" />`,
    );

    // Add capture script before </body> or at end
    const script = captureScript(config.apiUrl, config.projectId);
    if (content.includes('</body>')) {
      content = content.replace('</body>', `${script}\n</body>`);
    } else if (content.includes('</Layout>')) {
      content = content.replace('</Layout>', `${script}\n</Layout>`);
    } else {
      content += `\n${script}`;
    }

    return { ...file, content };
  });
}
