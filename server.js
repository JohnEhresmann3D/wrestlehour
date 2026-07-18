const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { URLSearchParams } = require('node:url');

const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;
const SESSION_COOKIE = 'wh_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || 'dev-session-secret-change-me';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.BASIC_PREVIEW_PASSWORD || '';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
};

function timingSafeEqual(a, b) {
  const left = Buffer.from(a || '');
  const right = Buffer.from(b || '');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function sign(value) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
}

function createSessionCookie() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const nonce = crypto.randomBytes(16).toString('base64url');
  const payload = `${expiresAt}.${nonce}`;
  const token = `${payload}.${sign(payload)}`;
  const secure = IS_PRODUCTION ? '; Secure' : '';
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/admin; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

function clearSessionCookie() {
  const secure = IS_PRODUCTION ? '; Secure' : '';
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/admin; Max-Age=0${secure}`;
}

function parseCookies(req) {
  const cookies = {};
  const header = req.headers.cookie || '';
  header.split(';').forEach((part) => {
    const index = part.indexOf('=');
    if (index === -1) return;
    cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  });
  return cookies;
}

function hasValidSession(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [expiresAt, nonce, signature] = parts;
  const payload = `${expiresAt}.${nonce}`;
  if (!timingSafeEqual(signature, sign(payload))) return false;
  return Number(expiresAt) > Math.floor(Date.now() / 1000);
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(body);
}

function redirect(res, location, headers = {}) {
  res.writeHead(302, { Location: location, 'Cache-Control': 'no-store', ...headers });
  res.end();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[char]));
}

function adminShell(title, content) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} — WrestleHour Admin</title>
  <link rel="icon" href="/assets/ui/favicon.svg">
  <style>
    :root { color-scheme: dark; --mint:#42FCD1; --paper:#f6efdf; --ink:#171513; --muted:#b9b0a3; --panel:#211d1a; --line:#3a332e; }
    * { box-sizing: border-box; }
    body { margin:0; min-height:100vh; display:grid; place-items:center; background:radial-gradient(circle at 20% 0%, #26332f 0, #171513 42%, #0e0d0c 100%); color:var(--paper); font-family: Arial, Helvetica, sans-serif; }
    main { width:min(760px, calc(100vw - 32px)); border:1px solid var(--line); background:rgba(33,29,26,.94); box-shadow:0 30px 80px rgba(0,0,0,.35); }
    header { padding:28px 28px 18px; border-bottom:1px solid var(--line); }
    .mark { letter-spacing:.16em; font-weight:900; color:var(--paper); text-decoration:none; } .mark span { color:var(--mint); }
    h1 { margin:20px 0 8px; font-size:clamp(32px, 6vw, 58px); line-height:.9; text-transform:uppercase; }
    p { color:var(--muted); line-height:1.55; }
    section { padding:28px; }
    label { display:block; margin:0 0 8px; font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--mint); font-weight:800; }
    input { width:100%; padding:15px 14px; border:1px solid var(--line); background:#141210; color:var(--paper); font-size:16px; }
    button, .button { display:inline-flex; align-items:center; justify-content:center; margin-top:18px; padding:13px 18px; border:1px solid var(--mint); background:var(--mint); color:#10100f; font-weight:900; letter-spacing:.08em; text-decoration:none; cursor:pointer; }
    .ghost { background:transparent; color:var(--paper); border-color:var(--line); margin-left:10px; }
    .error { padding:12px 14px; margin:0 0 18px; border:1px solid #FC5042; color:#ffd2cc; background:rgba(252,80,66,.12); }
    .grid { display:grid; gap:14px; grid-template-columns:repeat(auto-fit, minmax(190px,1fr)); margin-top:20px; }
    .card { border:1px solid var(--line); padding:18px; background:#191613; }
    .card strong { color:var(--paper); display:block; margin-bottom:8px; }
    code { color:var(--mint); }
  </style>
</head>
<body><main>${content}</main></body></html>`;
}

function loginPage(error = '') {
  return adminShell('Login', `
    <header><a class="mark" href="/">WRESTLE<span>HOUR</span></a><h1>Backend Login</h1><p>Protected editorial workspace. This is the first custom backend entry point; CMS/database editing comes next.</p></header>
    <section>
      ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
      <form method="post" action="/admin/login">
        <label for="password">Admin password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" autofocus required>
        <button type="submit">Log in →</button>
      </form>
    </section>`);
}

function dashboardPage() {
  return adminShell('Dashboard', `
    <header><a class="mark" href="/">WRESTLE<span>HOUR</span></a><h1>Editorial Backend</h1><p>You are logged in. Draft/article CMS, media uploads, homepage curation, search, newsletter, and MCP drafting tools will attach here.</p></header>
    <section>
      <div class="grid">
        <div class="card"><strong>Articles</strong><p>Planned: create drafts, submit for review, schedule/publish with human approval.</p></div>
        <div class="card"><strong>Homepage</strong><p>Planned: manually curate feature, Start Here, packages, graphics, and Watch module.</p></div>
        <div class="card"><strong>Agent Drafting</strong><p>Planned MCP/API tools may create and update drafts, but cannot publish.</p></div>
      </div>
      <p>Current required Railway env vars: <code>ADMIN_PASSWORD</code> and <code>SESSION_SECRET</code>.</p>
      <a class="button" href="/">View site</a><a class="button ghost" href="/admin/logout">Log out</a>
    </section>`);
}

function readRequestBody(req, limitBytes = 1024 * 16) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > limitBytes) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function handleAdmin(req, res, pathname) {
  if (pathname === '/admin/login' && req.method === 'GET') {
    if (hasValidSession(req)) return redirect(res, '/admin');
    return send(res, 200, loginPage());
  }

  if (pathname === '/admin/login' && req.method === 'POST') {
    let body = '';
    try {
      body = await readRequestBody(req);
    } catch {
      return send(res, 413, loginPage('Request was too large.'));
    }
    const params = new URLSearchParams(body);
    const password = params.get('password') || '';

    if (!ADMIN_PASSWORD) {
      return send(res, 500, loginPage('ADMIN_PASSWORD is not configured on the server.'));
    }

    if (!timingSafeEqual(password, ADMIN_PASSWORD)) {
      return send(res, 401, loginPage('Incorrect password.'));
    }

    return redirect(res, '/admin', { 'Set-Cookie': createSessionCookie() });
  }

  if (pathname === '/admin/logout') {
    return redirect(res, '/admin/login', { 'Set-Cookie': clearSessionCookie() });
  }

  if (!hasValidSession(req)) return redirect(res, '/admin/login');

  if (pathname === '/admin' || pathname === '/admin/') {
    return send(res, 200, dashboardPage());
  }

  return send(res, 404, adminShell('Not Found', '<header><a class="mark" href="/admin">WRESTLE<span>HOUR</span></a><h1>Not Found</h1><p>That admin route does not exist yet.</p></header>'));
}

function serveStatic(req, res, pathname) {
  let requestedPath = pathname === '/' ? '/index.html' : pathname;
  requestedPath = decodeURIComponent(requestedPath);

  const filePath = path.normalize(path.join(ROOT, requestedPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }

  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const headers = {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
    };
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ ok: true }));
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    handleAdmin(req, res, pathname).catch((error) => {
      console.error(error);
      send(res, 500, adminShell('Error', '<header><h1>Server Error</h1><p>The admin backend hit an unexpected error.</p></header>'));
    });
    return;
  }

  serveStatic(req, res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`WrestleHour server listening on :${PORT}`);
  if (!ADMIN_PASSWORD) console.warn('ADMIN_PASSWORD is not set; /admin login will be disabled.');
  if (SESSION_SECRET === 'dev-session-secret-change-me') console.warn('SESSION_SECRET is using the development fallback. Set it on Railway.');
});
