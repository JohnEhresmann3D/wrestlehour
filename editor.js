(() => {
  const renderer = window.WrestleHourArticleRenderer;
  const STORAGE_KEY = renderer.STORAGE_KEY;
  const form = document.querySelector('[data-editor-form]');
  const blocksMount = document.querySelector('[data-blocks]');
  const validation = document.querySelector('[data-validation]');
  const saveState = document.querySelector('[data-save-state]');
  const templateHelp = document.querySelector('[data-template-help]');

  if (!form || !blocksMount || !renderer) return;

  let draft = renderer.getDraft();

  const uid = () => `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const normalizeAssetPath = (value = '') => value.replace(/^\.\//, '').replace(/^\.\.\//, '');
  const previewPath = (value = '') => {
    const clean = normalizeAssetPath(value.trim());
    if (!clean) return '';
    return clean.startsWith('http') || clean.startsWith('../') ? clean : `../${clean}`;
  };
  const editorPath = (value = '') => normalizeAssetPath(value).replace(/^assets\//, 'assets/');

  const blockLabel = (block) => ({ paragraph: 'Paragraph', heading: 'Heading', figure: 'Figure', callout: 'Callout', pullQuote: 'Pull quote' }[block.type] || block.type);

  const defaultBlock = (type) => {
    const id = uid();
    if (type === 'heading') return { id, type, level: 2, text: 'New section', anchor: 'new-section' };
    if (type === 'figure') return { id, type, imageUrl: '../assets/graphics/ecosystem.svg', alt: '', display: 'wide', title: '', caption: '', credit: '', lightbox: true };
    if (type === 'callout') return { id, type, style: 'note', title: 'Editor note', body: '' };
    if (type === 'pullQuote') return { id, type, text: '', attribution: '' };
    return { id, type: 'paragraph', style: 'standard', text: '' };
  };

  const validateDraft = (candidate) => {
    const errors = [];
    if (candidate.schemaVersion !== 1) errors.push('Unsupported schema version.');
    if (!candidate.title?.trim()) errors.push('Title is required.');
    if (!/^[a-z0-9-]+$/.test(candidate.slug || '')) errors.push('Slug must use lowercase letters, numbers, and hyphens only.');
    if (!candidate.author?.trim()) errors.push('Author is required.');
    if (candidate.template === 'feature-package') {
      if (!candidate.dek?.trim()) errors.push('Feature template requires a dek.');
      if (!candidate.hero?.imageUrl?.trim()) errors.push('Feature template requires hero art.');
      if (!candidate.hero?.alt?.trim()) errors.push('Feature template requires hero alt text.');
    }
    const anchors = new Set();
    (candidate.blocks || []).forEach((block, index) => {
      const label = `${blockLabel(block)} ${index + 1}`;
      if (block.type === 'paragraph' && !block.text?.trim()) errors.push(`${label} needs text.`);
      if (block.type === 'heading') {
        if (!block.text?.trim()) errors.push(`${label} needs heading text.`);
        const anchor = renderer.slugify(block.anchor || block.text || block.id);
        if (!anchor) errors.push(`${label} needs a safe anchor.`);
        if (anchors.has(anchor)) errors.push(`Duplicate heading anchor: ${anchor}.`);
        anchors.add(anchor);
      }
      if (block.type === 'figure') {
        if (!block.imageUrl?.trim()) errors.push(`${label} needs an image path.`);
        if (!block.alt?.trim()) errors.push(`${label} needs alt text.`);
        if (block.display === 'full' && candidate.template !== 'feature-package') errors.push('Full-width figures are only allowed in Feature / Package.');
      }
      if (block.type === 'callout' && !block.body?.trim()) errors.push(`${label} needs body text.`);
      if (block.type === 'pullQuote' && !block.text?.trim()) errors.push(`${label} needs quote text.`);
    });
    if (!(candidate.blocks || []).some((block) => block.type === 'paragraph' || block.type === 'heading')) errors.push('Draft needs at least one text or heading block.');
    return errors;
  };

  const toForm = () => {
    form.template.value = draft.template || 'feature-package';
    form.title.value = draft.title || '';
    form.slug.value = draft.slug || '';
    form.dek.value = draft.dek || '';
    form.author.value = draft.author || '';
    form.initials.value = draft.initials || '';
    form.series.value = draft.series || '';
    form.packageLabel.value = draft.packageLabel || '';
    form.readTimeMinutes.value = draft.readTimeMinutes || 8;
    form.tags.value = (draft.tags || []).join(', ');
    form.heroImage.value = editorPath(draft.hero?.imageUrl || '');
    form.heroAlt.value = draft.hero?.alt || '';
    form.railTitle.value = draft.rail?.title || '';
    form.railBody.value = draft.rail?.body || '';
    form.tocEnabled.checked = draft.toc?.enabled !== false;
    templateHelp.textContent = form.template.value === 'feature-package'
      ? 'Feature supports hero art, TOC, rails, and wide/full graphics.'
      : 'Standard keeps the article calmer: text/image hero, optional TOC, inline/wide figures only.';
  };

  const fromForm = () => ({
    ...draft,
    schemaVersion: 1,
    status: 'draft',
    template: form.template.value,
    title: form.title.value.trim(),
    slug: renderer.slugify(form.slug.value || form.title.value),
    dek: form.dek.value.trim(),
    author: form.author.value.trim(),
    initials: form.initials.value.trim().toUpperCase(),
    series: form.series.value.trim(),
    packageLabel: form.packageLabel.value.trim(),
    readTimeMinutes: Number(form.readTimeMinutes.value || 8),
    tags: form.tags.value.split(',').map((tag) => tag.trim()).filter(Boolean),
    hero: { imageUrl: previewPath(form.heroImage.value), alt: form.heroAlt.value.trim(), display: 'standard' },
    toc: { enabled: form.tocEnabled.checked, mobile: 'disclosure' },
    rail: { ...(draft.rail || {}), title: form.railTitle.value.trim(), body: form.railBody.value.trim() },
    updatedAt: new Date().toISOString(),
  });

  const renderBlocks = () => {
    blocksMount.innerHTML = (draft.blocks || []).map((block, index) => `
      <article class="block-card" data-block-id="${block.id}">
        <div class="block-head">
          <span class="block-title">${index + 1}. ${blockLabel(block)}</span>
          <div class="block-actions">
            <button class="icon-action" type="button" data-move="up" aria-label="Move block up">↑</button>
            <button class="icon-action" type="button" data-move="down" aria-label="Move block down">↓</button>
            <button class="icon-action" type="button" data-duplicate aria-label="Duplicate block">⧉</button>
            <button class="icon-action" type="button" data-delete aria-label="Delete block">×</button>
          </div>
        </div>
        <div class="block-body">${renderBlockFields(block)}</div>
      </article>`).join('');
  };

  const renderBlockFields = (block) => {
    if (block.type === 'paragraph') return `
      <label>Style<select data-field="style"><option value="standard">Standard</option><option value="lead">Lead</option><option value="short">Short line</option></select></label>
      <label class="span-2">Text<textarea data-field="text" rows="5">${escapeField(block.text)}</textarea></label>`;
    if (block.type === 'heading') return `
      <label>Level<select data-field="level"><option value="2">H2</option><option value="3">H3</option></select></label>
      <label>Anchor<input data-field="anchor" value="${escapeField(block.anchor)}"></label>
      <label class="span-2">Heading text<input data-field="text" value="${escapeField(block.text)}"></label>`;
    if (block.type === 'figure') return `
      <label>Display<select data-field="display"><option value="inline">Inline</option><option value="wide">Wide</option><option value="full">Full</option></select></label>
      <label class="check-row"><input data-field="lightbox" type="checkbox"> Lightbox</label>
      <label>Image path<input data-field="imageUrl" value="${escapeField(editorPath(block.imageUrl))}"></label>
      <label>Alt text<input data-field="alt" value="${escapeField(block.alt)}"></label>
      <label>Caption title<input data-field="title" value="${escapeField(block.title)}"></label>
      <label>Credit<input data-field="credit" value="${escapeField(block.credit)}"></label>
      <label class="span-2">Caption<textarea data-field="caption" rows="3">${escapeField(block.caption)}</textarea></label>`;
    if (block.type === 'callout') return `
      <label>Style<select data-field="style"><option value="note">Note</option><option value="thesis">Thesis</option><option value="verdict">Verdict</option></select></label>
      <label>Title<input data-field="title" value="${escapeField(block.title)}"></label>
      <label class="span-2">Body<textarea data-field="body" rows="4">${escapeField(block.body)}</textarea></label>`;
    if (block.type === 'pullQuote') return `
      <label class="span-2">Quote<textarea data-field="text" rows="4">${escapeField(block.text)}</textarea></label>
      <label class="span-2">Attribution<input data-field="attribution" value="${escapeField(block.attribution)}"></label>`;
    return '';
  };

  function escapeField(value = '') {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  const syncSelectValues = () => {
    blocksMount.querySelectorAll('.block-card').forEach((card) => {
      const block = draft.blocks.find((item) => item.id === card.dataset.blockId);
      if (!block) return;
      card.querySelectorAll('[data-field]').forEach((field) => {
        if (field.type === 'checkbox') field.checked = Boolean(block[field.dataset.field]);
        else if (field.tagName === 'SELECT') field.value = String(block[field.dataset.field] ?? field.value);
      });
    });
  };

  const saveDraft = () => {
    draft = fromForm();
    const errors = validateDraft(draft);
    if (errors.length) {
      validation.hidden = false;
      validation.innerHTML = errors.map((error) => `<div>${escapeField(error)}</div>`).join('');
    } else {
      validation.hidden = true;
      validation.innerHTML = '';
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft, null, 2));
    saveState.textContent = `Saved locally ${new Date().toLocaleTimeString()}. ${errors.length ? `${errors.length} validation issue(s).` : 'Validation passed.'}`;
  };

  form.addEventListener('input', (event) => {
    if (event.target.name === 'title' && !form.slug.value.trim()) form.slug.value = renderer.slugify(event.target.value);
    draft = fromForm();
    clearTimeout(form._saveTimer);
    form._saveTimer = setTimeout(saveDraft, 400);
  });

  form.addEventListener('change', (event) => {
    if (event.target.name === 'template') {
      templateHelp.textContent = event.target.value === 'feature-package'
        ? 'Feature supports hero art, TOC, rails, and wide/full graphics.'
        : 'Standard keeps the article calmer: text/image hero, optional TOC, inline/wide figures only.';
    }
    draft = fromForm();
    saveDraft();
  });

  blocksMount.addEventListener('input', (event) => {
    const card = event.target.closest('[data-block-id]');
    const block = draft.blocks.find((item) => item.id === card?.dataset.blockId);
    if (!block || !event.target.dataset.field) return;
    const field = event.target.dataset.field;
    block[field] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    if (field === 'text' && block.type === 'heading' && !block.anchor) block.anchor = renderer.slugify(block.text);
    if (field === 'imageUrl') block.imageUrl = previewPath(block.imageUrl);
    clearTimeout(form._saveTimer);
    form._saveTimer = setTimeout(saveDraft, 400);
  });

  blocksMount.addEventListener('change', (event) => {
    const card = event.target.closest('[data-block-id]');
    const block = draft.blocks.find((item) => item.id === card?.dataset.blockId);
    if (!block || !event.target.dataset.field) return;
    const field = event.target.dataset.field;
    block[field] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    if (field === 'level') block.level = Number(event.target.value);
    if (field === 'imageUrl') block.imageUrl = previewPath(block.imageUrl);
    saveDraft();
  });

  blocksMount.addEventListener('click', (event) => {
    const card = event.target.closest('[data-block-id]');
    if (!card) return;
    const index = draft.blocks.findIndex((item) => item.id === card.dataset.blockId);
    if (index === -1) return;
    if (event.target.matches('[data-move="up"]') && index > 0) [draft.blocks[index - 1], draft.blocks[index]] = [draft.blocks[index], draft.blocks[index - 1]];
    if (event.target.matches('[data-move="down"]') && index < draft.blocks.length - 1) [draft.blocks[index + 1], draft.blocks[index]] = [draft.blocks[index], draft.blocks[index + 1]];
    if (event.target.matches('[data-duplicate]')) draft.blocks.splice(index + 1, 0, { ...JSON.parse(JSON.stringify(draft.blocks[index])), id: uid() });
    if (event.target.matches('[data-delete]') && confirm('Delete this block?')) draft.blocks.splice(index, 1);
    renderBlocks();
    syncSelectValues();
    saveDraft();
  });

  document.querySelectorAll('[data-add-block]').forEach((button) => {
    button.addEventListener('click', () => {
      draft = fromForm();
      draft.blocks.push(defaultBlock(button.dataset.addBlock));
      renderBlocks();
      syncSelectValues();
      saveDraft();
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    saveDraft();
  });

  document.querySelector('[data-reset]').addEventListener('click', () => {
    if (!confirm('Reset the local draft to the sample?')) return;
    draft = JSON.parse(JSON.stringify(renderer.SAMPLE_DRAFT));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft, null, 2));
    toForm(); renderBlocks(); syncSelectValues(); saveDraft();
  });

  document.querySelector('[data-export]').addEventListener('click', () => {
    saveDraft();
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${draft.slug || 'wrestlehour-draft'}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  });

  document.querySelector('[data-import]').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (imported.schemaVersion !== 1 || !Array.isArray(imported.blocks)) throw new Error('Invalid WrestleHour draft JSON.');
      draft = imported;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft, null, 2));
      toForm(); renderBlocks(); syncSelectValues(); saveDraft();
    } catch (error) {
      validation.hidden = false;
      validation.textContent = error.message || 'Could not import JSON.';
    }
  });

  toForm();
  renderBlocks();
  syncSelectValues();
  saveDraft();
})();
