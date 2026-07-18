# Railway setup

This repo now includes a minimal Node backend entry point for Railway.

## What is implemented

- `server.js` serves the existing static site.
- `/admin/login` accepts an admin password.
- `/admin` shows a protected backend dashboard placeholder.
- `/admin/logout` clears the admin session.
- `/health` returns `{ "ok": true }` for health checks.

This is not a full CMS yet. It is the protected login surface where article drafts, homepage curation, media uploads, and MCP drafting tools can attach next.

## Railway service settings

Railway should detect `package.json` and run:

```bash
npm start
```

If needed, set the start command manually to:

```bash
node server.js
```

## Required environment variables

Set these on the Railway service:

```bash
ADMIN_PASSWORD=<choose-a-strong-admin-password>
SESSION_SECRET=<generate-a-long-random-secret>
NODE_ENV=production
```

Recommended secret generation:

```bash
openssl rand -base64 48
```

## Optional/current variables

```bash
BASIC_PREVIEW_PASSWORD=BayBay
PUBLIC_SITE_URL=https://www.wrestlehour.com
```

`ADMIN_PASSWORD` should be separate from the public preview/password gate. If `ADMIN_PASSWORD` is missing, `/admin` login is disabled.

## Next backend steps

1. Add Postgres on Railway.
2. Add an ORM/schema for articles, authors, media assets, homepage configs, subscribers, and editorial events.
3. Replace the dashboard placeholder with real draft/article screens.
4. Move the current frontend password gate in `gate.js` to server-side auth/middleware.
5. Add draft-only MCP tools for agents.
