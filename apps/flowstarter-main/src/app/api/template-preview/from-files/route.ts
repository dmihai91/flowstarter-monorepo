import { NextRequest, NextResponse } from 'next/server';

type IncomingFile = {
  path: string;
  language?: string;
  content: string;
};

function normalizePath(p: string): string {
  const unix = p.replace(/\\/g, '/');
  return unix.startsWith('/') ? unix.slice(1) : unix;
}

function buildFallbackHtml(): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Preview</title>
    <style>
      html, body { height: 100%; margin: 0; }
      .empty { display:flex; align-items:center; justify-content:center; height:100%; color:#64748b; font:14px system-ui; }
    </style>
  </head>
  <body>
    <div class="empty">Preview unavailable</div>
  </body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const json = (await req.json()) as {
      files?: IncomingFile[];
      useDaytona?: boolean;
    };
    const files = Array.isArray(json?.files) ? json.files : [];
    const useDaytona = json?.useDaytona && !!process.env.DAYTONA_API_KEY;

    // If Daytona is requested and available, delegate to Daytona endpoint
    if (useDaytona) {
      try {
        const daytonaRes = await fetch(
          new URL('/api/daytona/render-template', req.url).toString(),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...Object.fromEntries(req.headers.entries()),
            },
            body: JSON.stringify({ files }),
          }
        );

        if (daytonaRes.ok) {
          const data = await daytonaRes.json();
          // Return an iframe that points to the Daytona preview URL
          const iframeHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Live Preview</title>
    <style>
      html, body, iframe { height: 100%; margin: 0; width: 100%; border: 0; }
    </style>
  </head>
  <body>
    <iframe src="${data.previewUrl || '#'}" title="Daytona Preview"></iframe>
  </body>
</html>`;
          return new NextResponse(iframeHtml, {
            headers: {
              'content-type': 'text/html; charset=utf-8',
              'cache-control': 'no-store',
            },
          });
        }
      } catch {
        // Fall through to static preview
      }
    }

    // Prefer explicit preview.html from agent output
    const byPath: Record<string, IncomingFile> = {};
    for (const f of files) {
      byPath[normalizePath(f.path)] = f;
    }

    const preview = byPath['preview.html'] || byPath['/preview.html'];
    const html = preview?.content || buildFallbackHtml();

    return new NextResponse(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
