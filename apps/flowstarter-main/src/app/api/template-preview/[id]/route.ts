import { projectTemplates } from '@/data/project-templates';
import { validateResourceId } from '@/lib/path-validation';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Allowlist of valid template IDs.
 * This is extracted from projectTemplates at module load time for security.
 */
const ALLOWED_TEMPLATE_IDS = new Set(projectTemplates.map((t) => t.id));

/**
 * Integrity hash of allowed template IDs (tamper detection)
 */
const TEMPLATE_IDS_HASH = crypto
  .createHash('sha256')
  .update(Array.from(ALLOWED_TEMPLATE_IDS).sort().join(','))
  .digest('hex');

/**
 * Anonymize IP address for GDPR compliance
 * IPv4: Removes last octet (e.g., 192.168.1.100 → 192.168.1.0)
 * IPv6: Removes last 80 bits (e.g., 2001:db8::1 → 2001:db8::)
 */
function anonymizeIP(ip: string): string {
  if (ip === 'unknown') return 'unknown';

  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }

  // IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':');
    // Keep first 48 bits (3 groups of 16 bits)
    return `${parts.slice(0, 3).join(':')}::`;
  }

  // Hash unknown format
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 8);
}

/**
 * Security event logger for template preview endpoint
 * IPs are anonymized for GDPR compliance
 */
function logSecurityEvent(
  event: string,
  details: Record<string, unknown>,
  ip?: string
) {
  const timestamp = new Date().toISOString();
  const anonymizedIP = ip ? anonymizeIP(ip) : 'unknown';
  console.warn(`[SECURITY:TEMPLATE-PREVIEW] ${timestamp}`, {
    event,
    ip_anonymized: anonymizedIP,
    ...details,
  });
}

/**
 * Generate cryptographically secure nonce for CSP
 */
function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Extract client IP from request (handles proxies)
 */
function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    (req as any).ip ??
    'unknown'
  );
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildPreviewHtml(options: {
  title: string;
  description: string;
  business?: string;
  theme: 'light' | 'dark';
  imageUrl?: string | null;
  nonce: string;
}) {
  const {
    title,
    description,
    business = 'John Smith Consulting',
    theme,
    imageUrl,
    nonce,
  } = options;

  const isDark = theme === 'dark';
  const bg = isDark ? '#0b0b0e' : '#ffffff';
  const text = isDark ? '#e5e7eb' : '#0f172a';
  const sub = isDark ? '#9ca3af' : '#475569';
  const badgeBg = isDark ? '#0f172a' : '#f1f5f9';
  const accent1 = '#6d28d9';
  const accent2 = '#7c3aed';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${escapeHtml(title)} Preview</title>
  <style>
    :root{ --bg:${bg}; --text:${text}; --sub:${sub}; --badge-bg:${badgeBg}; --accent1:${accent1}; --accent2:${accent2}; }
    html,body{ height:100%; }
    body{ margin:0; background:var(--bg); color:var(--text); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
    .container{ max-width:1180px; margin:0 auto; padding:32px 24px 64px; }
    .nav{ display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border:1px solid ${
      isDark ? '#1f2937' : '#e5e7eb'
    }; background:${
    isDark ? '#0b0b0e' : '#ffffff'
  }; border-radius:12px; position:sticky; top:12px; backdrop-filter:saturate(1.2) blur(8px); }
    .brand{ font-weight:700; letter-spacing:0.2px; }
    .links{ display:flex; gap:28px; color:var(--sub); font-size:14px; }
    .hero{ display:grid; grid-template-columns: 1.1fr 1fr; gap:32px; align-items:center; margin-top:28px; }
    .eyebrow{ display:inline-flex; align-items:center; gap:8px; font-size:12px; padding:6px 10px; background:${
      isDark ? '#0f172a' : '#eef2ff'
    }; border:1px solid ${
    isDark ? '#1f2937' : '#dbeafe'
  }; border-radius:999px; color:${isDark ? '#cbd5e1' : '#334155'}; }
    .title{ font-weight:800; line-height:1.05; font-size:48px; letter-spacing:-0.02em; }
    .title .grad{ background: linear-gradient(90deg, var(--accent1), var(--accent2)); -webkit-background-clip:text; background-clip:text; color:transparent; }
    .subtitle{ margin-top:16px; color:var(--sub); font-size:16px; max-width:56ch; }
    .cta-row{ display:flex; gap:14px; margin-top:22px; }
    .btn-primary{ background:linear-gradient(90deg, var(--accent1), var(--accent2)); color:white; border:none; padding:12px 18px; border-radius:12px; font-weight:600; font-size:14px; }
    .btn-secondary{ background:${
      isDark ? '#0b0b0e' : '#ffffff'
    }; border:1px solid ${
    isDark ? '#1f2937' : '#e5e7eb'
  }; color:var(--text); padding:12px 16px; border-radius:12px; font-weight:600; font-size:14px; }
    .media{ height:360px; border-radius:18px; overflow:hidden; background: linear-gradient(145deg, ${
      isDark ? '#0f1116' : '#f8fafc'
    }, ${isDark ? '#1a1d25' : '#eef2f7'}); border:1px solid ${
    isDark ? '#1f2937' : '#e5e7eb'
  }; display:flex; align-items:center; justify-content:center; position:relative; }
    .media .hint{ color:var(--sub); font-size:14px; }
    .corner-badge{ position:absolute; right:14px; bottom:14px; display:flex; align-items:center; gap:10px; background:${
      isDark ? '#0b0b0e' : '#ffffff'
    }; color:var(--text); border:1px solid ${
    isDark ? '#1f2937' : '#e5e7eb'
  }; border-radius:12px; padding:10px 12px; box-shadow: 0 6px 28px ${
    isDark ? 'rgba(0,0,0,.35)' : 'rgba(15,23,42,.14)'
  }; }
    .pill{ width:8px; height:8px; border-radius:999px; background: var(--accent2); box-shadow: 0 0 0 4px rgba(124,58,237,.18); }
    .footer{ margin-top:32px; color:var(--sub); font-size:12px; text-align:center; }
    .close{ position: fixed; top: 16px; right: 16px; background:${
      isDark ? '#0b0b0e' : '#ffffff'
    }; border:1px solid ${
    isDark ? '#1f2937' : '#e5e7eb'
  }; color:var(--text); border-radius:10px; padding:8px 10px; font-size:12px; cursor:pointer; }
  </style>
</head>
<body>
  <button class="close" id="close-btn">Close</button>
  <div class="container">
    <div class="nav">
      <div class="brand">${escapeHtml(business)}</div>
      <div class="links">
        <span>About</span><span>Services</span><span>Testimonials</span><span>Contact</span>
      </div>
    </div>

    <div class="hero">
      <div>
        <div class="eyebrow">Professional Consultant & Expert</div>
        <div class="title" style="margin-top:14px;">
          Build Your <span class="grad">Dream</span><br/> Business
        </div>
        <div class="subtitle">${escapeHtml(description)}</div>
        <div class="cta-row">
          <button class="btn-primary">Start Your Journey</button>
          <button class="btn-secondary">Watch Demo</button>
        </div>
      </div>
      <div class="media">
        ${
          imageUrl
            ? `<img src="${escapeHtml(
                imageUrl
              )}" alt="Preview" style="width:100%;height:100%;object-fit:cover;" />`
            : '<div class="hint">Preview image not available</div>'
        }
        <div class="corner-badge"><span class="pill"></span> <div><strong>10+ Years</strong><div style="font-size:11px; color:var(--sub);">Experience</div></div></div>
      </div>
    </div>

    <div class="footer">Press Esc or the Close button to return</div>
  </div>
  <script nonce="${nonce}">
    // Close on Escape or button click - postMessage to parent
    const closeBtn = document.getElementById('close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        parent.postMessage({ type: 'close-preview' }, '*');
      });
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        parent.postMessage({ type: 'close-preview' }, '*');
      }
    });
  </script>
</body>
</html>`;
}

/**
 * GET /api/template-preview/[id]
 *
 * Generate a preview HTML page for a template.
 * Public endpoint with strict security controls.
 *
 * Security measures:
 * - Allowlist validation: Only pre-defined template IDs accepted
 * - Path traversal protection: Multiple validation layers
 * - No file system access: Uses only in-memory template data
 * - Content Security Policy: Restricts resource loading
 * - Rate limiting: Prevents abuse (via middleware)
 * - XSS protection: All user content is escaped
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const clientIP = getClientIP(req);

  try {
    const { id } = await params;

    // Step 1: Validate ID format (alphanumeric, hyphens, underscores only)
    const idValidation = validateResourceId(id);
    if (!idValidation.valid) {
      logSecurityEvent(
        'invalid_id_format',
        {
          id: id?.substring(0, 50), // Limit logged input length
          error: idValidation.error,
          userAgent: req.headers.get('user-agent')?.substring(0, 100),
        },
        clientIP
      );
      return NextResponse.json(
        { error: 'Invalid template ID format', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const sanitizedId = idValidation.sanitized!;

    // Step 2: Check against allowlist (most important security check)
    if (!ALLOWED_TEMPLATE_IDS.has(sanitizedId)) {
      logSecurityEvent(
        'template_not_in_allowlist',
        {
          id: sanitizedId,
          allowedCount: ALLOWED_TEMPLATE_IDS.size,
          userAgent: req.headers.get('user-agent')?.substring(0, 100),
        },
        clientIP
      );
      return NextResponse.json(
        { error: 'Template not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Step 3: Get template data from in-memory array (no file system access)
    const url = new URL(req.url);
    const themeParam = url.searchParams.get('theme');
    const theme = themeParam === 'dark' ? 'dark' : 'light';

    const tpl = projectTemplates.find((t) => t.id === sanitizedId);

    // This should always succeed since we validated against allowlist
    if (!tpl) {
      logSecurityEvent(
        'allowlist_data_mismatch_critical',
        {
          id: sanitizedId,
          integrityHash: TEMPLATE_IDS_HASH,
          message: 'Template in allowlist but not in data - possible tampering',
        },
        clientIP
      );
      return NextResponse.json(
        { error: 'Template configuration error' },
        { status: 500 }
      );
    }

    const nonce = generateNonce();

    const html = buildPreviewHtml({
      title: tpl.name,
      description: tpl.description,
      theme,
      imageUrl: tpl.thumbnailUrl || null,
      nonce,
    });

    return new NextResponse(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        // Cache for 1 hour since templates are static
        'cache-control': 'public, max-age=3600, immutable',
        // Cache safety
        Vary: 'Accept-Encoding',
        // Security headers for public endpoint
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'SAMEORIGIN',
        'referrer-policy': 'strict-origin-when-cross-origin',
        // CSP: Disallow external loads, allow inline styles, and use nonce for scripts
        'content-security-policy': `default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; script-src 'nonce-${nonce}'; frame-ancestors 'self'`,
      },
    });
  } catch (err) {
    logSecurityEvent(
      'preview_generation_error',
      {
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack?.substring(0, 200) : undefined,
      },
      clientIP
    );
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
