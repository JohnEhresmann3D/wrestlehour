---
description: Draft an editorial article safely through the planned agent/CMS workflow
argument-hint: "<article brief>"
---
Use the Slipstream editorial drafting workflow for this article brief:

Brief: $ARGUMENTS

Constraints:
- Treat the result as a draft only.
- Do not imply the article is publishable without human editorial review.
- Preserve WrestleHour voice: independent, analytical, wrestling-aware, not joyless.
- Separate factual claims from interpretation.
- Flag sourcing gaps and confidence levels.
- Recommend CMS metadata: title, dek, series, tags, package, hero/graphic needs, TOC anchors.
- If proposing MCP/CMS operations, use draft-only actions such as `create_article_draft` or `update_article_draft`; never publish.

Apply the `slipstream-engineering` skill if it is available.
