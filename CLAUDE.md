# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A standalone, dependency-free static prototype of the WrestleHour editorial homepage and article pages (V1 design mockup). Plain HTML/CSS/JS — no build step, no package manager, no framework.

## Running locally

```bash
./serve.sh          # serves on :8080 (override with PORT=xxxx ./serve.sh)
# or
python3 -m http.server 8080
```

Then visit `http://localhost:8080`. `index.html` can also be opened directly in a browser.

## Structure

- `index.html` — homepage (hero feature, "Start Here" rail, section rails, graphic gallery, newsletter, drawer/search overlays)
- `articles/*.html` — individual article pages (each is a full standalone HTML document, not a template)
- `script.js` — single IIFE wiring up all interactive behavior site-wide (drawer nav, search overlay, newsletter form, reminder toggle, lightbox for story graphics, copy-link, reading-progress bar, sticky table-of-contents highlighting via IntersectionObserver)
- `styles.css` — all styles, including the approved color palette (Mint `#42FCD1`, Orange `#FC9142`, Coral `#FC5042`, Sage `#5F7D76`, Taupe `#7D6C5F`, plus cream/paper/charcoal neutrals). Color is used as restrained editorial accents per franchise/series, not large decorative blocks.
- `assets/graphics/*.svg` — story/package graphics, built as hand-authored SVGs standing in for final raster artwork
- `assets/ui/favicon.svg`

## Interaction conventions (script.js)

Behavior is wired via `data-*` attributes rather than IDs/classes where possible — follow this pattern when adding new interactive elements:
- `data-open-drawer` / `data-close-drawer` — mobile nav drawer
- `data-open-search` / `data-close-search` — search overlay
- `data-search-term` — prefills the search input
- `data-lightbox` (on a card containing an `img` and `h3`) — opens the story-graphic lightbox
- `data-copy-link` — copies current page URL
- `data-reminder` — toggles a "reminder set" button state

Overlays (drawer, search, lightbox) share `openOverlay`/`closeOverlay` helpers that toggle `.open`, `aria-hidden`, and body scroll lock; Escape closes all of them. Follow this shared pattern rather than writing bespoke show/hide logic for new overlays.

Reading progress and TOC highlighting only activate on article pages that have `.reading-progress span`, `.article-body`, and `.article-toc a[href^="#"]` present — no page-type branching, elements are just optionally queried.

## Downstream integration (important context, not yet done in this repo)

This package is meant to be merged into an existing Astro app (`apps/web`) with an API/CMS backend. See `ASTRO-INTEGRATION.md` and the "Integrating with the repository" section of `README.md` for the intended component breakdown (`SiteHeader.astro`, `ArticleLayout.astro`, etc.), target asset paths, and the `HomepageEditorialConfig`/`EditorialArticleFields` data shapes the CMS is expected to support. No backend, database, admin, or deployment code exists in this repo — do not assume any exists when making changes here.

V1 editorial principles to preserve when extending pages: curate the homepage manually, keep one feature story singular and dominant, use color by franchise/series rather than as decoration, treat graphics as article assets with alt text/captions, and keep partner programming out of V1.
