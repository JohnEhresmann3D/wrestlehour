(() => {
  const STORAGE_KEY = 'wrestlehour.editor.currentDraft.v1';
  const SAMPLE_DRAFT = {
    schemaVersion: 1,
    id: 'sample-feature',
    status: 'draft',
    template: 'feature-package',
    title: 'Untitled WrestleHour Feature',
    slug: 'untitled-wrestlehour-feature',
    dek: 'Use the editor to shape the thesis, graphics, and article rhythm before exporting JSON for review.',
    author: 'John Ehresmann',
    initials: 'JE',
    series: 'Under the Hood',
    packageLabel: 'Part I',
    readTimeMinutes: 8,
    hero: { imageUrl: '../assets/graphics/hero-platform.svg', alt: 'Abstract WrestleHour editorial platform graphic', display: 'standard' },
    toc: { enabled: true, mobile: 'disclosure' },
    rail: { title: 'The thesis', body: 'A modular article should preserve WrestleHour drama without exposing arbitrary CSS.', stats: [{ value: '01', label: 'Template pilot' }, { value: '∞', label: 'Reusable blocks' }] },
    tags: ['TKO', 'Strategy', 'Draft'],
    blocks: [
      { id: 'b1', type: 'paragraph', style: 'lead', text: 'This is a local draft preview. It uses the same article classes as the approved pilot so templates can be judged before publication.' },
      { id: 'b2', type: 'heading', level: 2, text: 'The modular article test', anchor: 'modular-article-test' },
      { id: 'b3', type: 'paragraph', text: 'Editors choose semantic blocks, figure display modes, and mobile behavior. The renderer owns the CSS and HTML contract.' },
      { id: 'b4', type: 'figure', imageUrl: '../assets/graphics/ecosystem.svg', alt: 'TKO ecosystem diagram', display: 'wide', title: 'The TKO ecosystem', caption: 'Wide graphics are explicit blocks, not transform hacks.', lightbox: true },
      { id: 'b5', type: 'callout', style: 'verdict', title: 'Working rule', body: 'Draft locally, validate structurally, export JSON, then publish only through human review.' }
    ]
  };

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const slugify = (value = '') => String(value).toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const getDraft = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : SAMPLE_DRAFT;
    } catch {
      return SAMPLE_DRAFT;
    }
  };

  const figureDisplay = (draft, display) => {
    if (display === 'full' && draft.template === 'feature-package') return 'full';
    if (display === 'wide') return 'wide';
    return 'inline';
  };

  const renderBlock = (draft, block) => {
    if (block.type === 'paragraph') {
      const cls = block.style === 'lead' ? ' class="lead-line"' : block.style === 'short' ? ' class="short-line"' : '';
      return `<p${cls}>${escapeHtml(block.text)}</p>`;
    }
    if (block.type === 'heading') {
      const level = block.level === 3 ? 3 : 2;
      const anchor = slugify(block.anchor || block.text || block.id) || block.id;
      return `<h${level} id="${escapeHtml(anchor)}">${escapeHtml(block.text)}</h${level}>`;
    }
    if (block.type === 'figure') {
      const display = figureDisplay(draft, block.display);
      const lightboxAttrs = block.lightbox ? ' tabindex="0" role="button" data-lightbox' : '';
      const caption = block.title || block.caption || block.credit ? `<figcaption>${block.title ? `<strong>${escapeHtml(block.title)}</strong>` : ''}<span>${escapeHtml(block.caption || '')}${block.credit ? ` · ${escapeHtml(block.credit)}` : ''}</span></figcaption>` : '';
      return `<figure class="article-block article-block--${display} article-figure article-figure--${display}"${lightboxAttrs}>
        <img src="${escapeHtml(block.imageUrl)}" alt="${escapeHtml(block.alt)}">
        ${block.lightbox ? '<span class="figure-expand-affordance" aria-hidden="true">Expand graphic</span>' : ''}
        ${caption}
      </figure>`;
    }
    if (block.type === 'pullQuote') return `<div class="pull-quote">${escapeHtml(block.text)}${block.attribution ? ` <span>${escapeHtml(block.attribution)}</span>` : ''}</div>`;
    if (block.type === 'callout') {
      const cls = block.style === 'verdict' ? 'verdict' : 'verdict';
      return `<div class="${cls}"><strong>${escapeHtml(block.title || block.style || 'Note')}</strong><p>${escapeHtml(block.body)}</p></div>`;
    }
    return '';
  };

  const renderPreview = (mount, draft = getDraft()) => {
    const templateClass = draft.template === 'feature-package' ? 'article-template--feature' : 'article-template--standard';
    const headings = (draft.blocks || []).filter((block) => block.type === 'heading' && block.level === 2);
    const tocLinks = headings.map((block) => `<a href="#${escapeHtml(slugify(block.anchor || block.text || block.id) || block.id)}">${escapeHtml(block.text)}</a>`).join('');
    const showHero = draft.hero && draft.hero.imageUrl;
    const body = (draft.blocks || []).map((block) => renderBlock(draft, block)).join('\n');
    const tags = (draft.tags || []).filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
    const railStats = draft.rail && Array.isArray(draft.rail.stats) ? draft.rail.stats.map((item) => `<div class="data-point"><strong>${escapeHtml(item.value)}</strong><span>${escapeHtml(item.label)}</span></div>`).join('') : '';

    mount.innerHTML = `
      <a class="skip-link" href="#article-content">Skip to article</a>
      <div class="reading-progress" aria-hidden="true"><span></span></div>
      <main>
        <header class="article-header">
          <div class="wrap article-header-grid">
            <div>
              <div class="article-series">${escapeHtml(draft.series || 'Draft')}${draft.packageLabel ? ` · ${escapeHtml(draft.packageLabel)}` : ''}</div>
              <h1 class="article-title medium">${escapeHtml(draft.title)}</h1>
              ${draft.dek ? `<p class="article-dek">${escapeHtml(draft.dek)}</p>` : ''}
              <div class="article-meta"><span class="author-dot" aria-hidden="true">${escapeHtml(draft.initials || 'WH')}</span><span class="meta">BY ${escapeHtml(draft.author || 'WrestleHour').toUpperCase()}</span><span class="meta">·</span><span class="meta">LOCAL DRAFT</span><span class="meta">·</span><span class="meta">${escapeHtml(draft.readTimeMinutes || 8)} MIN READ</span></div>
            </div>
            <aside class="article-header-side"><div class="eyebrow mint">${escapeHtml(draft.rail?.title || 'Draft thesis')}</div><p>${escapeHtml(draft.rail?.body || 'Local preview only. Export JSON for review before publishing.')}</p><div class="share-row"><button class="share-button" type="button" data-copy-link>COPY LINK</button></div></aside>
          </div>
        </header>
        ${showHero ? `<div class="article-hero wrap"><img src="${escapeHtml(draft.hero.imageUrl)}" alt="${escapeHtml(draft.hero.alt || '')}"></div>` : ''}
        <div class="article-shell article-layout ${templateClass} wrap">
          ${draft.toc?.enabled && tocLinks ? `<nav class="article-toc" aria-label="Article contents"><details class="article-toc-details" open><summary class="article-toc-summary"><span>In this article</span><span class="toc-current" aria-hidden="true">${escapeHtml(headings[0]?.text || '')}</span></summary><div class="article-toc-panel" id="article-toc-panel">${tocLinks}</div></details></nav>` : '<div></div>'}
          <article id="article-content" class="article-body article-layout__body">${body}<div class="article-end"><div class="article-tags">${tags}</div></div></article>
          <aside class="article-sidebar"><div class="side-note"><div class="eyebrow mint">${escapeHtml(draft.rail?.title || 'Draft note')}</div><h3>${escapeHtml(draft.rail?.body || 'Preview generated locally.')}</h3></div>${railStats ? `<div class="data-points">${railStats}</div>` : ''}</aside>
        </div>
      </main>
      <div class="lightbox" aria-hidden="true"><div class="lightbox-backdrop"></div><div class="lightbox-content" role="dialog" aria-modal="true" aria-label="Story graphic preview"><div class="lightbox-top"><span class="lightbox-title">Story graphic</span><button class="icon-button" type="button" aria-label="Close graphic" data-close-lightbox>✕</button></div><img src="" alt=""></div></div>`;
  };

  window.WrestleHourArticleRenderer = { STORAGE_KEY, SAMPLE_DRAFT, getDraft, renderPreview, slugify };

  document.addEventListener('DOMContentLoaded', () => {
    const mount = document.querySelector('[data-article-preview]');
    if (mount) renderPreview(mount);
  });
})();
