(() => {
  const byId = (id) => document.getElementById(id);
  const gameById = (id) => GAME_DATA.find((game) => game.id === id);
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const slugify = (value) => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const kindFor = (game) => game.category === 'system' ? 'system' : game.category === 'encounter' ? 'encounter' : game.group === 'Zdroje' ? 'resource' : 'minigame';
  const kindLabel = (game) => ({minigame:'Minihra', resource:'Zdroje', encounter:'Stretnutie', system:'Hlavný systém'}[kindFor(game)]);
  const statusLabel = (game) => game.status || 'ROZPRACOVANÉ';
  const thumbFor = (image) => image.replace(/^img\//, 'img/thumbs/').replace(/\.png$/i, '.jpg');
  const searchableText = (game) => JSON.stringify(game).replace(/<[^>]+>/g, ' ').toLowerCase();
  const pluralResults = (count) => count === 1 ? 'VÝSLEDOK' : count >= 2 && count <= 4 ? 'VÝSLEDKY' : 'VÝSLEDKOV';

  function navMarkup() {
    const current = new URLSearchParams(location.search).get('id');
    return NAV_GROUPS.map((group) => `<section class="nav-group"><h6>${group.label}</h6>${group.items.map((item) => {
      const game = item.id ? gameById(item.id) : null;
      const href = game ? `game.html?id=${game.id}` : item.href;
      const active = (game && current === game.id) || (!game && document.body.dataset.page === 'home' && href === 'index.html') ? ' active' : '';
      const currentAttr = active ? ' aria-current="page"' : '';
      return `<a class="wiki-link${active}" href="${href}"${currentAttr}><span class="nav-icon" aria-hidden="true">${game ? game.title.charAt(0) : '⌂'}</span>${game ? game.navTitle : item.label}</a>`;
    }).join('')}</section>`).join('');
  }

  function mountNav() {
    const markup = navMarkup();
    if (byId('sidebarNav')) byId('sidebarNav').innerHTML = markup;
    if (byId('mobileNavBody')) byId('mobileNavBody').innerHTML = `<div class="mobile-nav-links">${markup}</div>`;
  }

  function cardMarkup(game) {
    const categories = [kindFor(game), game.category];
    if (game.group === 'Zdroje') categories.push('resource');
    return `<div class="col-sm-6 col-xl-4 game-card-col" data-category="${categories.join(' ')}" data-search="${escapeHtml(searchableText(game))}">
      <a class="game-card ${game.wide ? 'system-card' : ''}" href="game.html?id=${game.id}">
        <div class="card-image-wrap"><img src="${thumbFor(game.image)}" data-full-image="${game.image}" onerror="this.onerror=null;this.src='${escapeHtml(game.image)}'" alt="${escapeHtml(game.title)} – koncept art" loading="lazy" decoding="async"><span class="card-number">${String(GAME_DATA.indexOf(game)+1).padStart(2,'0')}</span><span class="card-arrow" aria-hidden="true">↗</span></div>
        <div class="card-body"><div class="card-kicker"><span>${kindLabel(game)} · ${game.group}</span><span>${game.type}</span></div><h3>${game.title}</h3><p>${game.description}</p><span class="read-more">OTVORIŤ DETAIL <b>→</b></span></div>
      </a>
    </div>`;
  }

  function renderHome() {
    const grid = byId('gameGrid');
    if (!grid) return;
    grid.innerHTML = GAME_DATA.map(cardMarkup).join('');
    const input = byId('searchInput');
    const buttons = [...document.querySelectorAll('.filter-btn')];
    const empty = byId('emptyState');
    const count = byId('resultCount');
    let filter = 'all';
    function apply() {
      const query = input.value.trim().toLowerCase();
      let visible = 0;
      document.querySelectorAll('.game-card-col').forEach((card) => {
        const matchesFilter = filter === 'all' || card.dataset.category.split(/\s+/).includes(filter);
        const matchesQuery = !query || card.dataset.search.includes(query);
        const show = matchesFilter && matchesQuery;
        card.classList.toggle('d-none', !show);
        if (show) visible++;
      });
       count.textContent = `${visible} ${pluralResults(visible)}`;
      empty.classList.toggle('d-none', visible !== 0);
    }
    input.addEventListener('input', apply);
     buttons.forEach((button) => button.addEventListener('click', () => { filter = button.dataset.filter; buttons.forEach((b) => { const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); }); apply(); }));
    apply();
  }

  function stepsMarkup(steps) { return `<div class="loop-steps">${steps.map((step, index) => `<div class="loop-step"><span>${String(index+1).padStart(2,'0')}</span><strong>${step}</strong></div>`).join('')}</div>`; }

  function sectionMarkup(title, content, extra='') {
    return `<section id="section-${slugify(title)}" class="article-section ${extra}"><p class="section-label">${title}</p><div class="section-content">${content}</div></section>`;
  }

  function detailToc(game) {
    const items = ['overview','connection','when','how','controls','loop','fishTypes','bait','why','future'].filter((key) => game[key]);
    const labels = {overview:'Prehľad', connection:'Prepojenie', when:'Kedy', how:'Ako to funguje', controls:'Ovládanie', loop:'Gameplay loop', fishTypes:'Typy rýb', bait:'Návnada', why:'Prečo to dáva zmysel', future:'Budúce rozšírenia'};
    return `<nav class="article-toc" aria-label="Obsah detailu"><span>NA STRÁNKE</span>${items.map((key) => `<a href="#section-${slugify(labels[key])}">${labels[key]}</a>`).join('')}</nav>`;
  }

  function galleryMarkup(game) {
    if (!game.gallery?.length) return '';
    return `<section class="gallery-section" aria-labelledby="galleryTitle">
      <div class="gallery-heading"><p class="eyebrow">GALÉRIA</p><h2 id="galleryTitle">Ďalšie obrázky</h2></div>
      <div class="gallery-carousel" data-gallery-carousel data-gallery-count="${game.gallery.length}">
        <div class="gallery-viewport"><div class="gallery-track">${game.gallery.map((image, index) => `<div class="gallery-slide"><button class="gallery-item" type="button" data-image="${escapeHtml(image)}" data-title="${escapeHtml(game.title)}"><img src="${escapeHtml(image)}" alt="${escapeHtml(game.title)} – obrázok ${index + 1}" loading="lazy"><span>Otvoriť obrázok <b>↗</b></span></button></div>`).join('')}</div></div>
        ${game.gallery.length > 1 ? `<button class="gallery-control gallery-prev" type="button" aria-label="Predchádzajúci obrázok">←</button><button class="gallery-control gallery-next" type="button" aria-label="Ďalší obrázok">→</button><div class="gallery-dots" role="tablist" aria-label="Výber obrázka">${game.gallery.map((image, index) => `<button class="gallery-dot${index === 0 ? ' active' : ''}" type="button" role="tab" aria-label="Obrázok ${index + 1}" aria-selected="${index === 0}"></button>`).join('')}</div>` : ''}
      </div>
    </section>`;
  }

  function mountGalleryCarousels() {
    document.querySelectorAll('[data-gallery-carousel]').forEach((carousel) => {
      const track = carousel.querySelector('.gallery-track');
      const slides = [...carousel.querySelectorAll('.gallery-slide')];
      const dots = [...carousel.querySelectorAll('.gallery-dot')];
      if (slides.length < 2) return;
      let current = 0;
      const update = (next) => {
        current = (next + slides.length) % slides.length;
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((dot, index) => {
          const active = index === current;
          dot.classList.toggle('active', active);
          dot.setAttribute('aria-selected', String(active));
        });
      };
      carousel.querySelector('.gallery-prev').addEventListener('click', () => update(current - 1));
      carousel.querySelector('.gallery-next').addEventListener('click', () => update(current + 1));
      dots.forEach((dot, index) => dot.addEventListener('click', () => update(index)));
      const viewport = carousel.querySelector('.gallery-viewport');
      let startX = null;
      viewport.addEventListener('touchstart', (event) => { startX = event.changedTouches[0].clientX; }, {passive:true});
      viewport.addEventListener('touchend', (event) => {
        if (startX === null) return;
        const delta = event.changedTouches[0].clientX - startX;
        if (Math.abs(delta) > 40) update(delta < 0 ? current + 1 : current - 1);
        startX = null;
      }, {passive:true});
    });
  }

  function renderDetail() {
    const root = byId('articleRoot');
    if (!root) return;
    const requestedId = new URLSearchParams(location.search).get('id');
    const game = gameById(requestedId) || GAME_DATA[0];
    const notFound = Boolean(requestedId && !gameById(requestedId));
    const index = GAME_DATA.indexOf(game);
    const previous = GAME_DATA[(index - 1 + GAME_DATA.length) % GAME_DATA.length];
    const next = GAME_DATA[(index + 1) % GAME_DATA.length];
     document.title = `Gold Trail Tycoon | ${game.title}`;
     byId('crumbTitle').textContent = game.title.toUpperCase();
     document.querySelector('meta[name="description"]')?.setAttribute('content', game.description);
     document.querySelector('meta[property="og:title"]')?.setAttribute('content', `Gold Trail Tycoon | ${game.title}`);
     document.querySelector('meta[property="og:description"]')?.setAttribute('content', game.description);
     document.querySelector('meta[property="og:image"]')?.setAttribute('content', game.image);
    const details = [
      game.overview && sectionMarkup('Prehľad', `<p>${game.overview}</p>`),
      sectionMarkup('Kde', `<p>${game.location}</p>`),
      game.connection && sectionMarkup('Prepojenie so systémom', `<p>${game.connection}</p>`),
      game.when && sectionMarkup('Kedy', `<p>${game.when}</p>`),
      game.how && sectionMarkup('Ako to funguje', `<p>${game.how}</p>`),
      game.controls && sectionMarkup('Ovládanie', `<div class="control-strip">${game.controls}</div>`),
      game.loop && sectionMarkup('Gameplay loop', stepsMarkup(game.loop), 'loop-section'),
      game.fishTypes && sectionMarkup('Typy rýb', game.fishTypes),
      game.bait && sectionMarkup('Návnada', `<p>${game.bait}</p>`),
      game.why && sectionMarkup('Prečo to dáva zmysel', `<p>${game.why}</p>`),
      game.future && sectionMarkup('Budúce rozšírenia', `<p>${game.future}</p>`)
    ].filter(Boolean).join('');
    const gallery = galleryMarkup(game);
    root.innerHTML = `<div class="article-crumbs"><a href="index.html">DOMOV</a><span>/</span><span>${game.group.toUpperCase()}</span><span>/</span><strong>${game.title.toUpperCase()}</strong></div>
      ${notFound ? '<div class="not-found-note" role="status"><strong>Systém sa nenašiel.</strong> Zobrazuje sa prvý systém z katalógu. <a href="index.html#catalog">Späť na všetky minihry</a></div>' : ''}
      <header class="article-header"><div><p class="eyebrow">${game.eyebrow}</p><h1>${game.title}</h1><p class="article-subtitle"><span class="location-pin">⌖</span> ${game.location} <i></i> ${game.type}</p></div><div class="article-index" aria-label="Položka ${index+1} z ${GAME_DATA.length}">${String(index+1).padStart(2,'0')} <span>/ ${String(GAME_DATA.length).padStart(2,'0')}</span></div></header>
      <div class="article-snapshot" aria-label="Rýchly prehľad"><div><span>KATEGÓRIA</span><strong>${kindLabel(game)}</strong></div><div><span>INTERAKCIA</span><strong>${escapeHtml((game.controls || game.type).split('→')[0].trim())}</strong></div><div><span>LOKÁCIA</span><strong>${game.location}</strong></div><div><span>STAV</span><strong><i class="status-dot"></i>${statusLabel(game)}</strong></div></div>
      <button class="article-hero" type="button" data-image="${game.image}" data-title="${escapeHtml(game.title)}" aria-label="Zväčšiť obrázok: ${escapeHtml(game.title)}"><img src="${game.image}" alt="${escapeHtml(game.title)} – koncept art" decoding="async" fetchpriority="high"><span class="zoom-hint">KLIKNÚŤ PRE ZVÄČŠENIE <b>↗</b></span></button>
      ${detailToc(game)}
      <div class="article-layout"><div class="article-main">${details}</div><aside class="article-rail"><div class="rail-card"><span class="rail-label">ZÁKLADNÉ ÚDAJE</span><dl><div><dt>LOKÁCIA</dt><dd>${game.location}</dd></div><div><dt>TYP</dt><dd>${game.type}</dd></div><div><dt>STAV</dt><dd><span class="status-dot"></span> ${statusLabel(game)}</dd></div></dl></div><a class="rail-source" href="downloads/Gold_Trail_Tycoon_Minigames.md" download><span>↘</span><div><strong>STIAHNUŤ MARKDOWN</strong><small>Zdrojový dokument</small></div></a></aside></div>
      ${gallery}
      <nav class="article-nav" aria-label="Navigácia medzi systémami"><a href="game.html?id=${previous.id}"><small>← PREDCHÁDZAJÚCI</small><strong>${previous.title}</strong></a><a href="index.html#catalog" class="all-systems">VŠETKY SYSTÉMY <span>✦</span></a><a href="game.html?id=${next.id}" class="next"><small>ĎALŠÍ →</small><strong>${next.title}</strong></a></nav>`;
    const hero = document.querySelector('.article-hero');
    const openImage = (image, title) => { byId('modalImage').src = image; byId('modalImage').alt = title; byId('imageModalLabel').textContent = title; bootstrap.Modal.getOrCreateInstance(byId('imageModal')).show(); };
    hero.addEventListener('click', () => openImage(game.image, `${game.title} – koncept art`));
    document.querySelectorAll('.gallery-item').forEach((item) => item.addEventListener('click', () => openImage(item.dataset.image, `${game.title} – galéria`)));
    mountGalleryCarousels();
    mountNav();
  }

  function mountBackToTop() { const button = byId('backToTop'); if (!button) return; window.addEventListener('scroll', () => button.classList.toggle('show', window.scrollY > 500)); button.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'})); }
  mountNav();
  if (document.body.dataset.page === 'home') renderHome(); else renderDetail();
  mountBackToTop();
})();
