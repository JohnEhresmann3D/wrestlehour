(() => {
  const body = document.body;

  const openOverlay = (element) => {
    if (!element) return;
    element.classList.add('open');
    element.setAttribute('aria-hidden', 'false');
    body.classList.add('no-scroll');
    const focusable = element.querySelector('button, input, a[href]');
    focusable?.focus();
  };

  const closeOverlay = (element) => {
    if (!element) return;
    element.classList.remove('open');
    element.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.drawer.open, .search-overlay.open, .lightbox.open')) {
      body.classList.remove('no-scroll');
    }
  };

  const drawer = document.querySelector('.drawer');
  document.querySelectorAll('[data-open-drawer]').forEach((button) => {
    button.addEventListener('click', () => openOverlay(drawer));
  });
  drawer?.querySelectorAll('[data-close-drawer], .drawer-backdrop, .drawer-nav a').forEach((element) => {
    element.addEventListener('click', () => closeOverlay(drawer));
  });

  const searchOverlay = document.querySelector('.search-overlay');
  document.querySelectorAll('[data-open-search]').forEach((button) => {
    button.addEventListener('click', () => openOverlay(searchOverlay));
  });
  searchOverlay?.querySelectorAll('[data-close-search], .search-backdrop').forEach((element) => {
    element.addEventListener('click', () => closeOverlay(searchOverlay));
  });
  document.querySelectorAll('[data-search-term]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.querySelector('#site-search-input');
      if (!input) return;
      input.value = button.dataset.searchTerm || '';
      input.focus();
    });
  });
  document.querySelector('.search-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.querySelector('#site-search-input');
    const message = document.querySelector('#search-message');
    const term = input?.value.trim();
    if (!message) return;
    message.textContent = term
      ? `V1 search is staged for “${term}”. Connect this form to the existing article API when it is merged into the Astro app.`
      : 'Enter a topic, wrestler, promotion, or series.';
  });

  document.querySelectorAll('.newsletter-form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const message = form.parentElement?.querySelector('.form-message');
      if (!input || !message) return;
      if (!input.checkValidity()) {
        message.textContent = 'Enter a valid email address.';
        input.focus();
        return;
      }
      message.textContent = 'You are on the list. The V1 demo keeps this local; production can post to the existing newsletter endpoint.';
      form.reset();
    });
  });

  document.querySelectorAll('[data-reminder]').forEach((button) => {
    button.addEventListener('click', () => {
      const isSet = button.classList.toggle('reminder-set');
      button.textContent = isSet ? 'REMINDER SET ✓' : 'SET REMINDER →';
      button.setAttribute('aria-pressed', String(isSet));
    });
  });

  const lightbox = document.querySelector('.lightbox');
  const lightboxImage = lightbox?.querySelector('img');
  const lightboxTitle = lightbox?.querySelector('.lightbox-title');
  const openGraphic = (card) => {
    const image = card.querySelector('img');
    const title = card.querySelector('h3')?.textContent || image?.alt || 'Story graphic';
    if (!lightbox || !lightboxImage || !image) return;
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    if (lightboxTitle) lightboxTitle.textContent = title;
    openOverlay(lightbox);
  };
  document.querySelectorAll('[data-lightbox]').forEach((card) => {
    card.addEventListener('click', () => openGraphic(card));
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openGraphic(card);
    });
  });
  lightbox?.querySelectorAll('[data-close-lightbox], .lightbox-backdrop').forEach((element) => {
    element.addEventListener('click', () => closeOverlay(lightbox));
  });

  document.querySelectorAll('[data-copy-link]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        const original = button.textContent;
        button.textContent = 'COPIED ✓';
        setTimeout(() => { button.textContent = original; }, 1800);
      } catch {
        button.textContent = 'COPY UNAVAILABLE';
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    [drawer, searchOverlay, lightbox].forEach(closeOverlay);
  });

  const progress = document.querySelector('.reading-progress span');
  const articleBody = document.querySelector('.article-body');
  if (progress && articleBody) {
    const updateProgress = () => {
      const articleTop = articleBody.getBoundingClientRect().top + window.scrollY;
      const articleHeight = articleBody.offsetHeight;
      const viewport = window.innerHeight;
      const current = window.scrollY - articleTop + viewport * 0.28;
      const total = Math.max(articleHeight - viewport * 0.45, 1);
      const percent = Math.min(100, Math.max(0, current / total * 100));
      progress.style.width = `${percent}%`;
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
  }

  const tocLinks = [...document.querySelectorAll('.article-toc a[href^="#"]')];
  const sections = tocLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  if (tocLinks.length && sections.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!visible) return;
      tocLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`);
      });
    }, { rootMargin: '-18% 0px -68% 0px', threshold: 0 });
    sections.forEach((section) => observer.observe(section));
  }
})();
