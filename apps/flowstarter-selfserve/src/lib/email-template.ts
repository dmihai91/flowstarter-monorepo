// Branded transactional email template. Email-client-safe by construction:
// table layout, fully inlined styles, 600px card, bulletproof CTA button,
// system font stack, solid-color fallbacks where gradients aren't supported.
import 'server-only';

export interface EmailContent {
  /** Hidden preview line shown next to the subject in inboxes. */
  preheader?: string;
  heading: string;
  paragraphs: string[];
  cta?: { label: string; url: string };
  /** Small print under the body (e.g. "link valid 30 days"). */
  footnote?: string;
}

const INK = '#18181f';
const INK_2 = '#56565f';
const INK_3 = '#8c8c96';
const LINE = '#e6e6ea';
const PAPER = '#f1f1f5';
const CARD = '#ffffff';
const ACCENT = '#3d3fe0';
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif";

const esc = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderEmailHtml(c: EmailContent): string {
  const paragraphs = c.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.65;color:${INK_2};">${esc(p)}</p>`,
    )
    .join('\n              ');

  const cta = c.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px;">
                <tr>
                  <td bgcolor="${ACCENT}" style="border-radius:10px;background:linear-gradient(120deg,${ACCENT},#5e7bf7);">
                    <a href="${esc(c.cta.url)}" target="_blank"
                       style="display:inline-block;padding:13px 28px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
                      ${esc(c.cta.label)}
                    </a>
                  </td>
                </tr>
              </table>`
    : '';

  const footnote = c.footnote
    ? `<p style="margin:0;padding-top:14px;border-top:1px solid ${LINE};font-family:${FONT};font-size:12.5px;line-height:1.6;color:${INK_3};">${esc(c.footnote)}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light" />
<title>${esc(c.heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:${PAPER};">
  ${c.preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(c.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAPER}">
    <tr>
      <td align="center" style="padding:36px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">

          <!-- brand -->
          <tr>
            <td style="padding:0 8px 18px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="${ACCENT}" width="34" height="34" align="center" valign="middle"
                      style="border-radius:9px;background:linear-gradient(135deg,${ACCENT},#06b6d4);font-family:${FONT};font-size:18px;font-weight:700;color:#ffffff;">
                    F
                  </td>
                  <td style="padding-left:10px;font-family:${FONT};font-size:18px;font-weight:700;letter-spacing:-0.02em;color:${INK};">
                    Flow<span style="color:${ACCENT};">starter</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- card -->
          <tr>
            <td bgcolor="${CARD}" style="background-color:${CARD};border:1px solid ${LINE};border-radius:14px;padding:32px 34px;">
              <h1 style="margin:0 0 18px;font-family:${FONT};font-size:22px;line-height:1.25;letter-spacing:-0.01em;font-weight:700;color:${INK};">
                ${esc(c.heading)}
              </h1>
              ${paragraphs}
              ${cta}
              ${footnote}
            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td align="center" style="padding:22px 8px 0;">
              <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.7;color:${INK_3};">
                Flowstarter — your business, online this week.<br />
                You received this because you used Flowstarter. Questions? Just reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
