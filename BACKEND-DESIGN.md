# WrestleHour backend design for Railway

This repo is currently a dependency-free static prototype. The production backend should support the editorial workflow without forcing the homepage to become an algorithmic feed. The design below assumes Railway hosting, Postgres, object storage for media, and an Astro web app migration later.

## Goals

- Publish curated editorial articles and packages.
- Manually control the homepage: one dominant feature, Start Here rail, package rail, latest rail, graphics gallery, and watch module.
- Support search, newsletter capture, reminders, tags/series/package pages, and article assets.
- Keep V1 independent: no partner programming model until licensing/contributor terms are explicit.
- Keep the static frontend easy to migrate into Astro components.

## Recommended Railway services

```text
Railway Project: wrestlehour-production

services/
  web             Astro SSR or static+server app
  postgres        Railway Postgres
  redis optional  rate limits, job locks, preview/session cache
  worker optional newsletter sync, search indexing, scheduled sends
external/
  Cloudflare R2 or S3-compatible bucket for images/graphics
  Resend/Postmark for email
  Beehiiv/ConvertKit/Buttondown optional newsletter provider
```

For V1, avoid a separate API service unless the existing Astro app already has one. An Astro app with server routes is enough:

```text
apps/web/src/pages/api/search.ts
apps/web/src/pages/api/newsletter.ts
apps/web/src/pages/api/reminders.ts
apps/web/src/pages/admin/... or separate CMS
```

## Suggested stack

- Runtime: Node 22+ on Railway.
- Web: Astro, using the existing static design as components.
- Database: Railway Postgres.
- ORM: Drizzle or Prisma. Drizzle is lighter; Prisma is friendlier for admin tooling.
- Auth: Better Auth, Auth.js, Clerk, or Railway-protected admin during alpha.
- Admin/CMS options:
  - Fastest custom path: Payload CMS + Postgres + S3/R2 adapter.
  - Lightweight custom path: Astro admin routes + Drizzle/Prisma.
  - Managed path: Sanity/Contentful, with Railway only for app/API.

Recommendation: **Payload CMS on Railway with Postgres and R2** if you want a real editor UI quickly. **Custom Drizzle schema** if you want exact control and fewer moving parts.

## Core data model

### users

Admin/editor accounts.

| field | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| email | text unique | |
| name | text | |
| role | enum | `owner`, `editor`, `contributor` |
| image_url | text nullable | |
| created_at | timestamptz | |

### authors

Public bylines can differ from login users.

| field | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| slug | text unique | `john-ehresmann` |
| name | text | |
| initials | text | `JE` |
| bio | text nullable | |
| avatar_url | text nullable | |
| user_id | uuid nullable | FK users |

### articles

Editorial article records.

| field | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| slug | text unique | URL slug |
| title | text | |
| dek | text | subhead |
| body | jsonb or text | rich content; see content model |
| status | enum | `draft`, `in_review`, `scheduled`, `published`, `archived` |
| draft_source | enum nullable | `human`, `agent`, `import` |
| series | enum nullable | `under-the-hood`, `booking-sheet`, `prospect`, `tape` |
| package_id | uuid nullable | FK packages |
| package_order | int nullable | Part I, Part II, etc. |
| author_id | uuid | FK authors |
| hero_asset_id | uuid nullable | FK media_assets |
| hero_alt | text nullable | override alt |
| read_time_minutes | int | can be computed |
| published_at | timestamptz nullable | |
| scheduled_at | timestamptz nullable | |
| seo_title | text nullable | |
| seo_description | text nullable | |
| canonical_url | text nullable | |
| noindex | boolean default false | |
| created_at / updated_at | timestamptz | |

### article_sections

Optional if body is not a single rich-text JSON document. This makes TOC and graphics placement easy.

| field | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| article_id | uuid | FK articles |
| anchor | text | `question`, `why-pbr` |
| heading | text | |
| sort_order | int | |
| content | jsonb/text | rich blocks |

### media_assets

Story graphics, hero art, future raster images.

| field | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| url | text | R2/S3/public path |
| storage_key | text | private bucket key |
| type | enum | `image`, `svg`, `video`, `audio` |
| title | text | |
| alt | text | required for article images |
| caption | text nullable | |
| credit | text nullable | |
| width / height | int nullable | |
| created_at | timestamptz | |

### article_assets

Ordered placements of graphics within articles.

| field | type | notes |
| --- | --- | --- |
| article_id | uuid | FK articles |
| media_asset_id | uuid | FK media_assets |
| placement_key | text nullable | e.g. `after-capabilities` |
| sort_order | int | |
| display_title | text nullable | card/figure title override |
| caption | text nullable | caption override |

### packages

Editorial packages like the TKO package.

| field | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| slug | text unique | |
| title | text | |
| description | text | |
| accent | enum/text | mint/orange/coral/sage/taupe |
| status | enum | draft/published |
| created_at / updated_at | timestamptz | |

### homepage_configs

Manual curation layer. Only one active row should be live.

| field | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| name | text | `Production homepage` |
| is_active | boolean | unique partial index where true |
| feature_article_id | uuid | singular dominant feature |
| start_here_article_ids | uuid[] | ordered |
| package_article_ids | uuid[] | ordered |
| package_graphic_ids | uuid[] | ordered media assets |
| latest_article_ids | uuid[] nullable | manual override; fallback to newest published |
| pulse_text | text nullable | top utility bar |
| watch_feature | jsonb nullable | title, description, scheduledAt, imageUrl |
| created_at / updated_at | timestamptz | |

### tags and article_tags

```text
tags(id, slug, name)
article_tags(article_id, tag_id)
```

### newsletter_subscribers

| field | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| email | citext unique | |
| status | enum | `pending`, `subscribed`, `unsubscribed`, `bounced` |
| source | text | `homepage`, `article-footer`, etc. |
| provider | text nullable | |
| provider_id | text nullable | |
| consented_at | timestamptz | |
| created_at | timestamptz | |

### reminders

For the Watch module's `data-reminder` button.

| field | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| email | citext | |
| watch_feature_key | text | or FK if Watch becomes a model |
| scheduled_at | timestamptz | |
| status | enum | `active`, `sent`, `cancelled` |
| created_at | timestamptz | |

## API surface

Public read routes should be cacheable. Admin routes require auth.

```http
GET  /api/homepage
GET  /api/articles?series=&tag=&package=&limit=&cursor=
GET  /api/articles/:slug
GET  /api/packages/:slug
GET  /api/search?q=&limit=
POST /api/newsletter
POST /api/reminders
POST /api/contact optional
```

Admin/CMS operations:

```http
POST   /api/admin/articles              # creates draft by default
PATCH  /api/admin/articles/:id          # edits draft/in-review/scheduled content
POST   /api/admin/articles/:id/review   # moves draft -> in_review
POST   /api/admin/articles/:id/publish  # owner/editor-only
POST   /api/admin/media/sign-upload
PATCH  /api/admin/homepage/:id
```

Draft rules:

- New articles always start as `draft` unless an editor explicitly schedules/publishes.
- Agent-created articles must stay `draft` or `in_review`; agents cannot publish.
- Public APIs must only return `published` articles with `published_at <= now()`.
- Homepage curation can only reference published articles/assets in production, but preview mode may render drafts for authenticated editors.

## Agent/MCP drafting interface

Agents should be able to draft articles without direct database access or publish permissions. Provide a small MCP server, or an equivalent authenticated tool API, that wraps the CMS/admin endpoints.

Recommended Railway service:

```text
services/
  web
  postgres
  mcp-editor optional  # private service exposing MCP tools for trusted agents
```

MCP server transport options:

- Local/editor machines: `stdio` MCP server using `DATABASE_URL` or admin API token.
- Railway-hosted: HTTP/SSE MCP service behind an auth token and IP/rate limits.

Expose tools like:

```ts
create_article_draft(input: {
  title: string;
  dek?: string;
  bodyBlocks: ArticleBlock[];
  series?: 'under-the-hood' | 'booking-sheet' | 'prospect' | 'tape';
  packageSlug?: string;
  tags?: string[];
  sourceNotes?: string;
}): { articleId: string; slug: string; status: 'draft' }

update_article_draft(input: {
  articleId: string;
  title?: string;
  dek?: string;
  bodyBlocks?: ArticleBlock[];
  tags?: string[];
  changeSummary?: string;
}): { articleId: string; status: 'draft' | 'in_review' }

attach_article_asset(input: {
  articleId: string;
  mediaAssetId: string;
  placementKey?: string;
  caption?: string;
}): { ok: true }

submit_article_for_review(input: {
  articleId: string;
  notes?: string;
}): { articleId: string; status: 'in_review' }

search_editorial_archive(input: {
  query: string;
  includeDrafts?: boolean;
}): Array<{ articleId: string; title: string; slug: string; status: string }>
```

Guardrails:

- Use a dedicated `agent` role/API token with create/update/read-draft permissions only.
- Log every MCP mutation in an `editorial_events` audit table.
- Require human review for publish, homepage placement, SEO canonical changes, and newsletter sends.
- Validate generated article blocks with Zod before saving.
- Store agent source notes and prompt/context metadata separately from the public article body.

Optional audit table:

```text
editorial_events(
  id uuid pk,
  actor_type text,       -- user | agent | system
  actor_id text,
  entity_type text,      -- article | media | homepage
  entity_id uuid,
  action text,           -- draft.created, draft.updated, review.submitted
  metadata jsonb,
  created_at timestamptz
)
```

## Search design

V1: Postgres full-text search is enough.

- Add a generated `search_vector` on articles using title, dek, tags, series, and stripped body text.
- Query only `status = 'published'` and `published_at <= now()`.
- Return compact cards: title, slug, dek, series, publishedAt, readTimeMinutes.

Later: Meilisearch or Typesense as a Railway service if search needs typo tolerance and faceting.

## Content body model

Use a portable block format so articles can render in Astro and remain CMS-editable:

```ts
type ArticleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; anchor: string; text: string }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'figure'; assetId: string; title?: string; caption?: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'html'; html: string }; // escape hatch, admin-only
```

This maps cleanly to the current article pages' TOC, lightbox figures, and reading progress behavior.

## Railway environment variables

```bash
DATABASE_URL=
SESSION_SECRET=
PUBLIC_SITE_URL=https://www.wrestlehour.com
ADMIN_ALLOWED_EMAILS=john@example.com
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=wrestlehour-media
R2_PUBLIC_URL=https://media.wrestlehour.com
EMAIL_PROVIDER=resend
RESEND_API_KEY=
NEWSLETTER_PROVIDER=buttondown # optional
NEWSLETTER_API_KEY=
BASIC_PREVIEW_PASSWORD=BayBay # temporary, do not hardcode in JS for production
```

## Deployment plan

1. Provision Railway Postgres.
2. Choose CMS path:
   - Payload: create collections for Articles, Authors, Media, Packages, Homepage Config.
   - Custom: add ORM schema and simple admin routes.
3. Import current static articles and SVG graphics as seed data.
4. Convert current HTML into Astro components:
   - `SiteHeader.astro`, `SiteFooter.astro`, `ArticleLayout.astro`, `StoryCard.astro`, `GraphicCard.astro`, `NewsletterSignup.astro`.
5. Wire frontend interactions:
   - search form -> `GET /api/search?q=`
   - newsletter form -> `POST /api/newsletter`
   - reminder button -> email capture modal then `POST /api/reminders`
6. Move password gate server-side:
   - Basic auth or middleware/session, not `gate.js`.
7. Add caching:
   - homepage/articles: `s-maxage=60, stale-while-revalidate=300`
   - assets: long cache with hashed keys.
8. Set preview + production Railway environments.
9. Add database backups and migration checks before deploy.

## Security and operations

- Never keep the launch password in frontend JS in production.
- Validate API input with Zod.
- Rate-limit newsletter/search/reminder endpoints by IP/email.
- Use CSRF protection for admin writes.
- Store uploaded media outside the app filesystem; Railway deploys are ephemeral.
- Restrict admin access by role and email allowlist.
- Enable daily Postgres backups.

## Minimal V1 schema priority

If you want the smallest useful backend, build only these first:

1. `articles`
2. `authors`
3. `media_assets`
4. `article_assets`
5. `homepage_configs`
6. `newsletter_subscribers`

Everything else can be added after publishing/search/newsletter are real.
