# WrestleHour V1 editorial site

This package is a working, dependency-free, multi-page website—not a rendered design image.

## Run it

Open `index.html` directly, serve the folder statically, or run the minimal Node backend:

```bash
python3 -m http.server 8080
# or
ADMIN_PASSWORD=local-admin-password SESSION_SECRET=local-dev-secret npm start
```

Then visit `http://localhost:8080`.

Admin login is available at `/admin` when using `npm start`. Set `ADMIN_PASSWORD` and `SESSION_SECRET` in the environment.

## Included

- Responsive WrestleHour homepage
- **The Machine** as the dominant feature
- Full article page for **The Machine**
- Full companion article page for **The Platform the Market Isn’t Pricing In**
- Web-native SVG editions of the TKO package graphics
- Mobile navigation drawer
- Search overlay staged for API integration
- Newsletter demo state
- Story-graphic lightbox
- Article reading-progress bar
- Sticky table of contents with active-section highlighting
- Reminder toggle for the future Watch module

## Palette

The approved palette is used as restrained editorial accents rather than oversized color slabs:

- Mint `#42FCD1`
- Orange `#FC9142`
- Coral `#FC5042`
- Sage `#5F7D76`
- Taupe `#7D6C5F`
- Cream, paper, and charcoal neutrals

## Graphics

The original generated image binaries were not available as mounted files in this build session. Each approved concept was therefore rebuilt as a lightweight, responsive SVG for the website:

- The TKO Ecosystem
- Why Every Capability Matters
- How Value Compounds
- Customer Confidence Is an Asset
- A Diagram Is Not Proof
- The PBR Stress Test
- Shared Infrastructure, Distinct Products
- PBR Is Not Just a Receiver
- The Destination Product
- Fewer Events, More Revenue
- Commercial Integration vs. Audience Integration
- The Premiumization Line
- What the Next Gear Must Add

The SVGs are ready for production use and can later be replaced with final approved raster artwork without changing page structure.

## Integrating with the repository

The existing repository uses Astro for the frontend and already has an API/CMS model. The clean merge path is:

1. Copy `assets/graphics/` into `apps/web/public/assets/graphics/`.
2. Convert the masthead, navigation drawer, search panel, newsletter, footer, story cards, and graphic cards into Astro components.
3. Move the design tokens and component styles from `styles.css` into the site’s global stylesheet.
4. Recreate `index.html` as `apps/web/src/pages/index.astro`.
5. Use either article page as the visual template for the existing dynamic article route.
6. Store the article body and ordered graphics in the CMS rather than hardcoding them in production.
7. Wire newsletter and search interactions to the existing endpoints.
8. Keep partner programming out of V1 until the content license or contributor agreement is explicit.

No backend, database, admin, or deployment files are modified by this standalone package.
