# Astro implementation map

## Suggested components

```text
apps/web/src/components/
  SiteHeader.astro
  SiteFooter.astro
  StoryCard.astro
  GraphicCard.astro
  NewsletterSignup.astro
  ArticleLayout.astro
  ArticleFigure.astro
```

## Public assets

```text
apps/web/public/assets/graphics/
  hero-machine.svg
  hero-platform.svg
  ecosystem.svg
  capabilities.svg
  compounding.svg
  confidence.svg
  hypothesis.svg
  stress-test.svg
  infrastructure.svg
  value-exchange.svg
  destination.svg
  fewer-events.svg
  integration-tracks.svg
  premiumization.svg
  next-gear.svg
```

## Homepage data shape

```ts
interface HomepageEditorialConfig {
  featureArticleId: string;
  startHereArticleIds: string[];
  packageArticleIds: string[];
  packageGraphicIds: string[];
  watchFeature?: {
    title: string;
    description: string;
    scheduledAt?: string;
    imageUrl?: string;
  };
}
```

## Article fields worth supporting

```ts
interface EditorialArticleFields {
  series?: 'under-the-hood' | 'booking-sheet' | 'prospect' | 'tape';
  packageSlug?: string;
  packageOrder?: number;
  heroImageUrl?: string;
  heroImageAlt?: string;
  readTimeMinutes?: number;
  dek?: string;
  visualAssets?: Array<{
    imageUrl: string;
    alt: string;
    title: string;
    caption?: string;
    placementKey?: string;
  }>;
}
```

## V1 principles

- Curate the homepage manually.
- Keep one feature singular and dominant.
- Use color by editorial franchise, not as large decorative slabs.
- Treat graphics as article assets with alt text and captions.
- Preserve collaborator independence; future partner modules should be explicit content types.
