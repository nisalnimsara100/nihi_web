/**
 * The page shown when there is no connection. It is plain HTML with its own styles and no scripts,
 * so the service worker can keep a copy that works with nothing else loaded.
 */
export function GET() {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#ffffff"><title>Offline · NiHi</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif;background:#fff;color:#111;padding:24px;text-align:center}main{max-width:320px}.mark{width:64px;height:64px;border-radius:20px;background:#4744f7;margin:0 auto 20px;display:flex;align-items:center;justify-content:center}h1{font-size:22px;margin:0 0 8px}p{color:#6e6e73;line-height:1.5;margin:0 0 20px}a{display:inline-block;background:#4744f7;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:14px}</style></head>
<body><main><div class="mark"><svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M8 25.5V15a8 8 0 0 1 16 0v10.5" stroke="#fff" stroke-width="5"/><circle cx="16" cy="20.2" r="3.1" fill="#f6b23e"/></svg></div>
<h1>You're offline</h1><p>NiHi needs a connection to show your money. Anything you add while offline on the New transaction page is kept on this phone and added when you're back online.</p><a href="/dashboard">Try again</a></main></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=0, must-revalidate" } });
}
