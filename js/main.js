/* ============================================================
   AP MOTORS — Frontend Reactivo & Sincronizado en Tiempo Real
   Navegación Horizontal Exclusiva + Cotizador 3.0 + Carrito WhatsApp
   ============================================================ */

'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const S = Store;
let SET = S.data.settings;
let DISC = Number(SET.discountPercent || 20) / 100;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* Icono SVG vectorial oficial de WhatsApp */
function svgWhatsApp(size = 20, fill = 'currentColor') {
  return `<svg class="icon-wa" viewBox="0 0 24 24" width="${size}" height="${size}" fill="${fill}" aria-hidden="true"><path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.476-.15-.677.15-.2.3-.777.978-.953 1.179-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.501-1.787-1.677-2.088-.175-.3-.019-.463.132-.613.136-.135.301-.351.452-.527.15-.175.2-.3.301-.501.1-.2.05-.376-.025-.527-.075-.15-.677-1.631-.928-2.233-.244-.586-.493-.506-.677-.516l-.577-.01c-.2 0-.527.075-.803.376-.276.3-1.053 1.028-1.053 2.507 0 1.479 1.078 2.908 1.229 3.109.15.2 2.122 3.24 5.141 4.544.718.31 1.279.496 1.716.635.722.23 1.38.197 1.9-.12.58-.352 1.78-1.08 2.03-2.122.251-1.042.251-1.934.176-2.122-.075-.188-.276-.289-.577-.439zM12.04 2C6.51 2 2.03 6.48 2.03 12c0 1.94.55 3.75 1.5 5.28L2 22l4.88-1.47A9.94 9.94 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18.27c-1.63 0-3.14-.49-4.41-1.33l-.32-.21-3.27.99 1-3.19-.23-.36a8.23 8.23 0 0 1-1.27-4.17c0-4.57 3.72-8.27 8.28-8.27 4.56 0 8.28 3.7 8.28 8.27 0 4.57-3.72 8.27-8.28 8.27z"/></svg>`;
}

/* ============================================================
   RENDERIZADO DE SECCIONES
   ============================================================ */

/* ---------- 1. Barra superior ---------- */
function renderTopbar() {
  $('#logoText').textContent = (SET.siteName || 'AP MOTORS').replace(/AP\s*/i, '').trim() || 'MOTORS';
  document.title = `${SET.siteName || 'AP Motors'} — Motos, Repuestos Oficiales y Servicio Técnico`;

  const topNotice = $('#topbarNotice');
  if (topNotice) {
    topNotice.textContent = SET.noticeBar || `🔥 ¡Gran campaña! ${SET.discountPercent}% de descuento en tienda y taller.`;
  }

  const main = S.list('branches').find(b => b.isMain) || S.list('branches')[0];
  const branchEl = $('#topbarMainBranch');
  if (branchEl) {
    branchEl.textContent = `📍 ${main ? main.name + ' — ' + main.address : 'Sede Principal'}`;
  }

  const hoursEl = $('#topbarHours');
  if (hoursEl) {
    hoursEl.textContent = `🕗 ${SET.hours || 'Lun–Sáb: 8:00 AM – 7:00 PM'}`;
  }

  const phonesEl = $('#topbarPhones');
  if (phonesEl) {
    phonesEl.innerHTML =
      `<a class="topbar__whatsapp" href="${S.waLink('Hola ' + SET.siteName + ', deseo información.')}" target="_blank" rel="noopener">${svgWhatsApp(15, '#25d366')} <span>${esc(SET.phone1Label || SET.phone1)}</span></a>` +
      (SET.phone2 ? `<span class="topbar__sep">·</span><a class="topbar__whatsapp" href="${S.waLink('Hola ' + SET.siteName, SET.phone2)}" target="_blank" rel="noopener">${svgWhatsApp(15, '#25d366')} <span>${esc(SET.phone2Label || SET.phone2)}</span></a>` : '');
  }

  const waFloat = $('#waFloat');
  if (waFloat) {
    waFloat.href = S.waLink('Hola ' + SET.siteName + ', quiero comunicarme con un asesor');
  }
}

/* ---------- 2. Hero (Inicio) ---------- */
function renderHero() {
  const root = $('#heroRoot');
  if (!root) return;

  const brandsCount = S.list('brands').length;
  const branchesCount = S.list('branches').length;

  root.innerHTML = `
    <section class="hero hero--inline">
      <div class="hero__inner">
        <div class="hero__content">
          <span class="hero__badge">${esc(SET.heroBadge || '⚡ POR APERTURA DE TIENDA')}</span>
          <h1 class="hero__title">${esc(SET.heroTitle || 'Tu mejor opción comercial en motos del sur')}</h1>
          <p class="hero__subtitle">${esc(SET.heroSubtitle || 'Distribuidores autorizados RONCO · NEXUS · SUMO. Motos de trabajo, repuestos oficiales, tuning LED y taller con garantía.')}</p>
          <p class="hero__promo">🎉 <strong>${esc(SET.heroPromo || '¡20% de descuento en productos y servicios seleccionados!')}</strong></p>

          <div class="hero__actions">
            <button class="btn btn--primary btn--glow" data-goto-btn="tienda">🛒 Ver Catálogo & Stock</button>
            <button class="btn btn--ghost" data-goto-btn="cotizador">🧮 Cotizar en 1 Minuto</button>
          </div>

          <div class="hero__stats">
            <div class="hero__stat"><strong>${brandsCount || 3}</strong><span>Marcas líderes</span></div>
            <div class="hero__stat"><strong>1 año</strong><span>Garantía oficial</span></div>
            <div class="hero__stat"><strong>${branchesCount || 2}</strong><span>Sedes físicas</span></div>
            <div class="hero__stat"><strong>${SET.discountPercent || 20}%</strong><span>Dscto. inauguración</span></div>
          </div>
        </div>

        ${SET.heroImage ? `
        <div class="hero__visual">
          <figure class="hero__promo-card">
            <img src="${esc(SET.heroImage)}" alt="Promoción ${esc(SET.siteName)}" loading="eager">
          </figure>
          <div class="hero__floating hero__floating--1">🔧 Taller mecánico certificado</div>
          <div class="hero__floating hero__floating--2">🛡️ Garantía real 1 año</div>
        </div>` : ''}
      </div>
    </section>`;

  $$('[data-goto-btn]', root).forEach(b => b.addEventListener('click', () => goto(b.dataset.gotoBtn)));
}

/* ---------- 3. Marcas asociadas ---------- */
function renderBrands() {
  const root = $('#brandsRoot');
  if (!root) return;
  const brands = S.list('brands').filter(b => b.active !== false);
  if (!brands.length) { root.innerHTML = ''; return; }

  root.innerHTML = `
    <div class="section__head">
      <span class="section__tag">Nuestras Marcas Aliadas</span>
      <h2 class="section__title">Marcas de penetración y potencia líder</h2>
      <p class="section__desc">Modelos diseñados para el trabajo exigente, rutas de arena y transporte urbano en el sur del Perú.</p>
    </div>
    <div class="brands">
      ${brands.map(b => `
      <article class="brand reveal" style="border-top-color:${esc(b.color || '#ed1c24')}">
        <div class="brand__top">
          <span class="brand__name" style="color:${esc(b.color || '#ed1c24')}">${esc(b.name)}</span>
          <span class="brand__tag">${esc(b.tag || 'Distribuidor')}</span>
        </div>
        <div class="brand__bike"><span class="brand__emoji">${b.emoji || '🏍️'}</span></div>
        <p class="brand__desc">${esc(b.desc)}</p>
        <button class="brand__btn" data-filter-brand="${esc(b.id)}" style="color:${esc(b.color || '#ed1c24')}">Ver modelos en tienda →</button>
      </article>`).join('')}
    </div>`;

  $$('[data-filter-brand]', root).forEach(btn => {
    btn.addEventListener('click', () => {
      storeBrandFilter = btn.dataset.filterBrand;
      renderStore();
      goto('tienda');
    });
  });

  observeReveal();
}

/* ---------- 4. Beneficios institucionales ---------- */
function renderWhy() {
  const root = $('#whyRoot');
  if (!root) return;
  root.innerHTML = `
    <div class="why">
      <div class="why__card"><span class="why__icon">🛡️</span><h3>Garantía Real</h3><p>Respaldada por 1 año en intervenciones de motor y chasis en nuestros talleres oficiales.</p></div>
      <div class="why__card"><span class="why__icon">💳</span><h3>Financiamiento Directo</h3><p>Llévate tu moto al contado o con crédito rápido en cómodas cuotas.</p></div>
      <div class="why__card"><span class="why__icon">⚙️</span><h3>Repuestos Originales</h3><p>Almacén multimarca en stock permanente. Entrega inmediata sin esperas.</p></div>
      <div class="why__card"><span class="why__icon">🗺️</span><h3>Presencia en el Sur</h3><p>Sedes físicas de atención técnica y recojo en Bella Unión y Acarí.</p></div>
    </div>`;
}

/* ---------- 5. Promociones ---------- */
function renderPromos() {
  const root = $('#promosRoot');
  if (!root) return;
  const promos = S.list('promotions').filter(S.isVisible);

  root.innerHTML = `
    <div class="section__head section__head--light">
      <span class="section__tag">🔥 Campañas Especiales</span>
      <h2 class="section__title">Ofertas y Sorteos Exclusivos</h2>
      <p class="section__desc">Aprovecha descuentos directos, facilidades de financiamiento y participa en nuestros sorteos presenciales.</p>
    </div>
    <div class="promos">
      ${promos.map(p => `
      <article class="promo reveal">
        ${p.image ? `
        <a class="promo__media" href="${esc(p.image)}" target="_blank" rel="noopener">
          <img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">
        </a>` : ''}
        <div class="promo__body">
          <span class="promo__badge" style="background:${esc(p.badgeColor || '#ed1c24')}">${esc(p.badgeLabel || 'OFERTA')}</span>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.desc)}</p>
          <a class="btn btn--whatsapp btn--block btn--glow-green" href="${S.waLink(p.ctaMessage || 'Hola ' + SET.siteName + ', quiero más información de la promoción: ' + p.title)}" target="_blank" rel="noopener">
            ${svgWhatsApp(19, '#fff')} <span>${esc(p.ctaText || 'Aprovechar Oferta')}</span>
          </a>
        </div>
      </article>`).join('') || '<p class="section__desc" style="text-align:center">Nuevas promociones muy pronto.</p>'}
    </div>`;

  observeReveal();
}

/* ---------- 6. Tienda & Catálogo (con Búsqueda, Filtros y Paginación 5x2 de 10 productos) ---------- */
let storeCategoryFilter = 'all';
let storeBrandFilter = 'all';
let storeSearchQuery = '';
let storePage = 1;
const STORE_PAGE_SIZE = 10;

function renderStore() {
  const root = $('#storeRoot');
  if (!root) return;

  const cats = S.list('categories').filter(c => c.active !== false);
  const brands = S.list('brands').filter(b => b.active !== false);
  let allMatchingProducts = S.list('products').filter(S.isVisible);

  // Filtrado por categoría
  if (storeCategoryFilter !== 'all') {
    allMatchingProducts = allMatchingProducts.filter(p => p.categoryId === storeCategoryFilter);
  }

  // Filtrado por marca
  if (storeBrandFilter !== 'all') {
    allMatchingProducts = allMatchingProducts.filter(p => p.brandId === storeBrandFilter);
  }

  // Filtrado por texto
  if (storeSearchQuery) {
    const q = storeSearchQuery.toLowerCase().trim();
    allMatchingProducts = allMatchingProducts.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.desc && p.desc.toLowerCase().includes(q)) ||
      (p.specs && p.specs.some(s => s.toLowerCase().includes(q)))
    );
  }

  // Paginación 5x2 (10 ítems por página)
  const totalItems = allMatchingProducts.length;
  const totalPages = Math.ceil(totalItems / STORE_PAGE_SIZE) || 1;
  if (storePage > totalPages) storePage = totalPages;
  if (storePage < 1) storePage = 1;

  const startIndex = (storePage - 1) * STORE_PAGE_SIZE;
  const pageProducts = allMatchingProducts.slice(startIndex, startIndex + STORE_PAGE_SIZE);

  const catName = (id) => (cats.find(c => c.id === id) || {}).name || 'General';
  const catColor = (id) => (cats.find(c => c.id === id) || {}).color || '#1e4fd8';
  const brandName = (id) => (brands.find(b => b.id === id) || {}).name || '';

  root.innerHTML = `
    <div class="section__head">
      <span class="section__tag">🛒 Catálogo Oficial</span>
      <h2 class="section__title">Motos, Repuestos y Accesorios</h2>
      <p class="section__desc">Stock disponible con garantía oficial. Navega en bloques de 10 unidades y cotiza directo por WhatsApp.</p>
    </div>

    <!-- Barra de búsqueda y filtros de tienda -->
    <div class="store-toolbar">
      <div class="store-search">
        <span class="store-search__icon">🔍</span>
        <input type="text" id="storeSearchInput" class="store-search__input" placeholder="Buscar motos, 200cc, repuestos, casco..." value="${esc(storeSearchQuery)}">
        ${storeSearchQuery ? `<button class="store-search__clear" id="storeSearchClear">✕</button>` : ''}
      </div>

      <!-- Filtros por Marca -->
      <div class="store-chips store-chips--brands">
        <button class="chip ${storeBrandFilter === 'all' ? 'chip--active' : ''}" data-brand-filter="all">Todas las marcas (${brands.length})</button>
        ${brands.map(b => `
          <button class="chip ${storeBrandFilter === b.id ? 'chip--active' : ''}" data-brand-filter="${esc(b.id)}" style="${storeBrandFilter === b.id ? `background:${esc(b.color)};border-color:${esc(b.color)};color:#fff;` : ''}">
            ${b.emoji || '🏍️'} ${esc(b.name)}
          </button>
        `).join('')}
      </div>

      <!-- Filtros por Categoría -->
      <div class="store-chips store-chips--cats">
        <button class="chip ${storeCategoryFilter === 'all' ? 'chip--active' : ''}" data-cat-filter="all">Todas las categorías (${cats.length})</button>
        ${cats.map(c => `
          <button class="chip ${storeCategoryFilter === c.id ? 'chip--active' : ''}" data-cat-filter="${esc(c.id)}" style="${storeCategoryFilter === c.id ? `background:${esc(c.color)};border-color:${esc(c.color)};color:#fff;` : ''}">
            ${c.icon || '🏷️'} ${esc(c.name)}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Grid de productos 5x2 (Máximo 10 productos por vista) -->
    <div class="grid grid--5x2" id="catalog">
      ${pageProducts.length ? pageProducts.map(p => {
        const color = catColor(p.categoryId);
        const showPrice = p.priceAfter != null && !p.consult;
        const brand = brandName(p.brandId);

        let promoTag = p.promoLabel;
        if (!promoTag && p.priceBefore && p.priceAfter && p.priceBefore > p.priceAfter) {
          const pct = Math.round((1 - p.priceAfter / p.priceBefore) * 100);
          promoTag = `-${pct}% OFF`;
        }

        return `
        <article class="card reveal">
          <div class="card__media">
            <span class="card__badge" style="background:${esc(color)}">${esc(promoTag || catName(p.categoryId))}</span>
            ${p.image
              ? `<img class="card__img" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">`
              : `<span class="card__emoji">${p.emoji || '🏍️'}</span>`}
          </div>
          <div class="card__body">
            <span class="card__cat" style="color:${esc(color)}">${esc(catName(p.categoryId))}${brand ? ' · ' + esc(brand) : ''}</span>
            <h3 class="card__title">${esc(p.name)}</h3>
            <p class="card__desc">${esc(p.desc)}</p>
            ${(p.specs && p.specs.length) ? `<div class="card__specs">${p.specs.map(s => `<span class="card__spec">${esc(s)}</span>`).join('')}</div>` : ''}

            <div class="card__price">
              ${p.priceBefore != null ? `<span class="card__price-old">${fmtSoles(p.priceBefore)}</span>` : ''}
              <span class="card__price-now">${showPrice ? fmtSoles(p.priceAfter) : (p.consult ? 'Consultar precio' : '')}</span>
            </div>

            <div class="card__actions">
              <button class="card__add ${p.consult ? 'card__add--consult' : ''}" data-add="${esc(p.id)}">
                ${p.consult ? '💬 Consultar' : '🛒 Añadir'}
              </button>
              <a class="card__wa" target="_blank" rel="noopener" aria-label="Cotizar por WhatsApp" href="${S.waLink('Hola ' + SET.siteName + ', me interesa: ' + p.name + (showPrice ? ' (' + fmtSoles(p.priceAfter) + ')' : ''))}">
                ${svgWhatsApp(22, '#fff')}
              </a>
            </div>
          </div>
        </article>`;
      }).join('') : `
        <div class="store-empty" style="grid-column: 1 / -1; text-align: center; padding: 48px 16px;">
          <p style="font-size: 1.1rem; color: var(--muted);">No se encontraron productos con los filtros seleccionados.</p>
          <button class="btn btn--ghost" id="storeResetFilters" style="margin-top: 14px;">Restablecer filtros</button>
        </div>
      `}
    </div>

    <!-- Barra de Paginación 5x2 -->
    ${totalItems > 0 ? `
    <div class="store-pagination">
      <button class="store-page-btn" id="storePagePrev" ${storePage === 1 ? 'disabled' : ''} aria-label="Página anterior">
        ◀ Anterior
      </button>
      <div class="store-page-numbers">
        ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
          <button class="store-page-num ${p === storePage ? 'active' : ''}" data-page="${p}">${p}</button>
        `).join('')}
      </div>
      <button class="store-page-btn" id="storePageNext" ${storePage === totalPages ? 'disabled' : ''} aria-label="Página siguiente">
        Siguiente ▶
      </button>
    </div>
    <p class="store-pagination__info">
      Mostrando <strong>${totalItems === 0 ? 0 : startIndex + 1}–${Math.min(startIndex + STORE_PAGE_SIZE, totalItems)}</strong> de <strong>${totalItems}</strong> unidades en stock (Página ${storePage} de ${totalPages})
    </p>` : ''}`;

  // Listeners de paginación
  const prevBtn = $('#storePagePrev');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (storePage > 1) {
        storePage--;
        renderStore();
        const slide = document.getElementById('slide-tienda');
        if (slide) slide.scrollTop = 0;
      }
    });
  }

  const nextBtn = $('#storePageNext');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (storePage < totalPages) {
        storePage++;
        renderStore();
        const slide = document.getElementById('slide-tienda');
        if (slide) slide.scrollTop = 0;
      }
    });
  }

  $$('[data-page]', root).forEach(pBtn => {
    pBtn.addEventListener('click', () => {
      storePage = Number(pBtn.dataset.page) || 1;
      renderStore();
      const slide = document.getElementById('slide-tienda');
      if (slide) slide.scrollTop = 0;
    });
  });

  // Listeners de búsqueda y filtros (resetean a página 1)
  const searchInp = $('#storeSearchInput');
  if (searchInp) {
    searchInp.addEventListener('input', (e) => {
      storeSearchQuery = e.target.value;
      storePage = 1;
      renderStore();
      const nInp = $('#storeSearchInput');
      if (nInp) { nInp.focus(); nInp.setSelectionRange(nInp.value.length, nInp.value.length); }
    });
  }

  const searchClr = $('#storeSearchClear');
  if (searchClr) {
    searchClr.addEventListener('click', () => {
      storeSearchQuery = '';
      storePage = 1;
      renderStore();
    });
  }

  $$('[data-cat-filter]', root).forEach(chip => {
    chip.addEventListener('click', () => {
      storeCategoryFilter = chip.dataset.catFilter;
      storePage = 1;
      renderStore();
    });
  });

  $$('[data-brand-filter]', root).forEach(chip => {
    chip.addEventListener('click', () => {
      storeBrandFilter = chip.dataset.brandFilter;
      storePage = 1;
      renderStore();
    });
  });

  const resetBtn = $('#storeResetFilters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      storeCategoryFilter = 'all';
      storeBrandFilter = 'all';
      storeSearchQuery = '';
      storePage = 1;
      renderStore();
    });
  }

  $$('.card__add', root).forEach(btn => {
    btn.addEventListener('click', () => {
      const p = S.get('products', btn.dataset.add);
      if (!p) return;
      if (p.consult || p.priceAfter == null) {
        window.open(S.waLink(`Hola ${SET.siteName}, deseo cotizar la motocicleta/repuesto: ${p.name}`), '_blank');
        return;
      }
      addToCart(p);
    });
  });

  observeReveal();
}

/* ---------- 7. Servicios Mecánicos ---------- */
function renderServices() {
  const root = $('#servicesRoot');
  if (!root) return;
  const services = S.list('services').filter(s => s.active !== false);

  root.innerHTML = `
    <div class="section__head">
      <span class="section__tag">Taller Especializado</span>
      <h2 class="section__title">Mecánica de Confianza y Precisión</h2>
      <p class="section__desc">Técnicos certificados, herramientas calibradas y repuestos originales con garantía real por escrito.</p>
    </div>
    <div class="services">
      ${services.map(s => `
      <article class="service ${s.featured ? 'service--featured' : ''} reveal">
        ${s.featured ? '<span class="service__badge">⭐ Más pedido</span>' : ''}
        <span class="service__icon">${s.icon || '🔧'}</span>
        <h3 class="service__title">${esc(s.name)}</h3>
        <p class="service__desc">${esc(s.desc)}</p>
        <div class="service__foot">
          <span class="service__price">Desde <strong>${fmtSoles(s.price)}</strong></span>
          <a class="service__cta" href="${S.waLink('Hola ' + SET.siteName + ', deseo reservar turno para el servicio: ' + s.name)}" target="_blank" rel="noopener">
            Reservar Turno →
          </a>
        </div>
      </article>`).join('') || '<p class="section__desc" style="text-align:center">Próximamente más servicios.</p>'}
    </div>
    <div class="service-note"><strong>🏭 Almacén propio multimarca:</strong> Garantizamos repuestos listos para tu servicio el mismo día.</div>`;

  observeReveal();
}

/* ---------- 8. Tuning LED & Protección ---------- */
function renderTuning() {
  const root = $('#tuningRoot');
  if (!root) return;
  const items = S.list('tuning').filter(t => t.active !== false);

  root.innerHTML = `
    <div class="section__head section__head--light">
      <span class="section__tag">Tuning & Seguridad</span>
      <h2 class="section__title">Vanguardia LED y Protección Nocturna</h2>
      <p class="section__desc">Iluminación hiper blanca de alta penetración, faros exploradores y protecciones para carreteras del sur.</p>
    </div>
    <div class="tuning">
      ${items.map(t => `
      <article class="tuning__card reveal">
        <span class="tuning__icon">${t.icon || '💡'}</span>
        <h3>${esc(t.name)}</h3>
        <p>${esc(t.desc)}</p>
        <span class="tuning__benefit">✔ ${esc(t.benefit || 'Instalación profesional')}</span>
      </article>`).join('')}
    </div>`;

  observeReveal();
}

/* ---------- 9. Cotizador Express 3.0 Interactivo ---------- */
function renderQuote() {
  const root = $('#quoteRoot');
  if (!root) return;

  const services = S.list('services').filter(s => s.active !== false && s.price != null);
  const tuning = S.list('tuning').filter(t => t.active !== false);
  const branches = S.list('branches').filter(b => b.active !== false);

  root.innerHTML = `
    <div class="section__head">
      <span class="section__tag">Presupuesto en Tiempo Real</span>
      <h2 class="section__title">Cotizador Express 3.0</h2>
      <p class="section__desc">Calcula el presupuesto estimado de tu mantenimiento o equipamiento con el <strong>${SET.discountPercent}% de descuento de apertura</strong> aplicado en directo.</p>
    </div>

    <div class="quote quote--v3">
      <div class="quote__steps">
        <!-- Paso 1: Tipo de Moto -->
        <div class="quote__step">
          <span class="quote__num">1</span>
          <div class="quote__step-content">
            <p><strong>Tipo de vehículo / Cilindrada</strong></p>
            <select id="quoteVehicle" class="quote__select">
              <option value="">— Selecciona tu tipo de moto —</option>
              <option value="Chacarera / Todo Terreno 200cc">🏍️ Chacarera / Todo Terreno (200cc / 250cc)</option>
              <option value="Scooter Urbana 125cc">🛵 Scooter Urbana Automática (125cc / 150cc)</option>
              <option value="Mototaxi / Carguero 150cc">🛺 Mototaxi / Unidad de Carga (150cc / 200cc)</option>
              <option value="Pistera Deportiva">⚡ Pistera / Deportiva</option>
              <option value="Otra / Multimarca">🔧 Otra cilindrada / Multimarca</option>
            </select>
          </div>
        </div>

        <!-- Paso 2: Servicios requeridos -->
        <div class="quote__step">
          <span class="quote__num">2</span>
          <div class="quote__step-content">
            <p><strong>Servicios y equipamiento a realizar</strong></p>
            <div class="quote__checks" id="quoteServicesList">
              ${services.map((s, idx) => `
                <label class="quote__check-item">
                  <input type="checkbox" class="quote-check" data-price="${s.price}" data-name="${esc(s.name)}" ${idx === 0 ? 'checked' : ''}>
                  <span class="quote__check-box"></span>
                  <span class="quote__check-label">${s.icon || '🔧'} ${esc(s.name)}</span>
                  <strong class="quote__check-price">${fmtSoles(s.price)}</strong>
                </label>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Paso 3: Sede y Datos -->
        <div class="quote__step">
          <span class="quote__num">3</span>
          <div class="quote__step-content">
            <p><strong>Sede de atención y tu nombre</strong></p>
            <div class="quote__row-inputs">
              <select id="quoteBranch" class="quote__select">
                ${branches.map(b => `<option value="${esc(b.name)}">📍 ${esc(b.name)}</option>`).join('')}
              </select>
              <input type="text" id="quoteName" class="quote__select" placeholder="Tu nombre (opcional)">
            </div>
          </div>
        </div>
      </div>

      <!-- Resumen Calculado en Vivo -->
      <div class="quote__result">
        <h3>🧮 Resumen del Presupuesto</h3>
        <p class="quote__result-sub">Valores calculados con precios oficiales y descuento exclusivo.</p>

        <div class="quote__rows">
          <div class="quote__row"><span>Subtotal taller:</span><strong id="quoteBase">S/ 0.00</strong></div>
          <div class="quote__row quote__row--discount"><span>Ahorro Campaña (${SET.discountPercent}% OFF):</span><strong id="quoteDiscount">- S/ 0.00</strong></div>
          <div class="quote__row quote__row--total"><span>Total Estimado:</span><strong id="quoteTotal">S/ 0.00</strong></div>
        </div>

        <p class="quote__note">💡 El presupuesto final puede ajustarse levemente según repuestos adicionales o estado del motor.</p>

        <button class="btn btn--whatsapp btn--block btn--glow-green" id="quoteWhatsapp">
          ${svgWhatsApp(22, '#fff')} <span>Confirmar Cotización vía WhatsApp</span>
        </button>
      </div>
    </div>`;

  function calculateQuote() {
    const checked = $$('.quote-check:checked', root);
    let base = 0;
    checked.forEach(chk => {
      base += Number(chk.dataset.price) || 0;
    });

    const discount = base * DISC;
    const total = base - discount;

    $('#quoteBase').textContent = fmtSoles(base);
    $('#quoteDiscount').textContent = '- ' + fmtSoles(discount);
    $('#quoteTotal').textContent = fmtSoles(total);

    const vehicle = $('#quoteVehicle').value;
    const btn = $('#quoteWhatsapp');
    if (btn) {
      btn.disabled = base === 0;
    }
  }

  $$('.quote-check', root).forEach(chk => chk.addEventListener('change', calculateQuote));
  $('#quoteVehicle').addEventListener('change', calculateQuote);

  $('#quoteWhatsapp').addEventListener('click', async () => {
    const checked = $$('.quote-check:checked', root);
    if (!checked.length) {
      toast('Selecciona al menos un servicio en el cotizador ⚠️');
      return;
    }

    const vehicle = $('#quoteVehicle').value || 'Motocicleta';
    const branch = $('#quoteBranch').value || 'Sede Principal';
    const name = $('#quoteName').value.trim();

    let base = 0;
    const itemsList = checked.map(chk => {
      const p = Number(chk.dataset.price) || 0;
      base += p;
      return `• ${chk.dataset.name} (${fmtSoles(p)})`;
    });

    const discount = base * DISC;
    const total = base - discount;

    let msg = `Hola ${SET.siteName}, he generado mi cotización desde la web oficial:\n\n`;
    if (name) msg += `👤 Cliente: ${name}\n`;
    msg += `🛵 Tipo de unidad: ${vehicle}\n`;
    msg += `📍 Sede de atención: ${branch}\n\n`;
    msg += `🔧 Servicios seleccionados:\n${itemsList.join('\n')}\n\n`;
    msg += `💰 Subtotal taller: ${fmtSoles(base)}\n`;
    msg += `🎉 Ahorro campaña (${SET.discountPercent}% OFF): -${fmtSoles(discount)}\n`;
    msg += `✅ Total estimado con descuento: ${fmtSoles(total)}\n\n`;
    msg += `¿Tienen disponibilidad de turno para esta semana?`;

    // Registrar en Firestore para auditoría
    await S.logQuote({
      customerName: name,
      vehicle,
      branch,
      servicesCount: checked.length,
      subtotal: base,
      total,
    });

    window.open(S.waLink(msg), '_blank');
  });

  calculateQuote();
}

/* ---------- 10. Sedes y Mapas ---------- */
function renderBranches() {
  const root = $('#branchesRoot');
  if (!root) return;
  const branches = S.list('branches').filter(b => b.active !== false);

  root.innerHTML = `
    <div class="section__head">
      <span class="section__tag">Ubicación Estratégica</span>
      <h2 class="section__title">Nuestras Sedes en el Sur</h2>
      <p class="section__desc">Talleres y tiendas con estacionamiento seguro, amplio stock y atención inmediata.</p>
    </div>
    <div class="branches">
      ${branches.map(b => `
      <article class="branch reveal">
        <div class="branch__head">
          <span class="branch__pin">📍</span>
          <div>
            <h3 class="branch__title">${esc(b.name)}</h3>
            ${b.isMain ? '<span class="branch__badge">Sede Principal</span>' : ''}
          </div>
        </div>
        <p class="branch__addr"><strong>Dirección:</strong> ${esc(b.address)}</p>
        ${b.reference ? `<p class="branch__ref"><strong>Referencia:</strong> ${esc(b.reference)}</p>` : ''}
        ${b.hours ? `<p class="branch__hours">🕗 ${esc(b.hours)}</p>` : ''}
        <div class="branch__map">
          <iframe src="${S.mapsEmbed(b)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mapa ${esc(b.name)}"></iframe>
        </div>
        <div class="branch__actions">
          <a class="btn btn--outline btn--block" href="${S.mapsLink(b)}" target="_blank" rel="noopener">📍 Navegar por GPS</a>
          <a class="btn btn--whatsapp btn--block btn--glow-green" href="${S.waLink('Hola ' + SET.siteName + ', consulto por la ' + b.name, b.phone)}" target="_blank" rel="noopener">
            ${svgWhatsApp(19, '#fff')} <span>WhatsApp de Sede</span>
          </a>
        </div>
      </article>`).join('')}
    </div>`;

  observeReveal();
}

/* ---------- 11. Contacto & Footer ---------- */

/* Marcas disponibles para el selector del formulario */
function contactBrandOptions() {
  const brands = S.list('brands').filter(b => b.active !== false);
  const names = brands.length ? brands.map(b => b.name) : ['RONCO', 'NEXUS', 'SUMO'];
  return [...names, 'Otra marca', 'Aún no tengo moto'];
}

/* Estado abierto/cerrado según horario comercial (Lun–Sáb 8:00–19:00) */
function shopOpenState() {
  const now = new Date();
  const day = now.getDay();               // 0 = domingo
  const mins = now.getHours() * 60 + now.getMinutes();
  const isOpen = day >= 1 && day <= 6 && mins >= 480 && mins < 1140;
  return {
    isOpen,
    label: isOpen ? 'Abierto ahora' : 'Cerrado ahora',
    detail: isOpen
      ? 'Te respondemos en minutos'
      : 'Déjanos tu mensaje y te contactamos al abrir'
  };
}

function renderContact() {
  const root = $('#contactRoot');
  if (!root) return;

  const main = S.list('branches').find(b => b.isMain && b.active !== false)
            || S.list('branches').filter(b => b.active !== false)[0];
  const st = shopOpenState();
  const hours = SET.hours || 'Lun–Sáb: 8:00 AM – 7:00 PM';

  root.innerHTML = `
    <div class="contact-v2">

      <div class="section__head">
        <span class="section__tag">Contacto directo</span>
        <h2 class="section__title">Cuéntanos qué necesitas y te cotizamos</h2>
        <p class="section__desc">Completa el formulario y tu consulta llega ordenada a WhatsApp del asesor. Sin registros ni esperas.</p>
      </div>

      <div class="contact-grid">

        <!-- ====== FORMULARIO ====== -->
        <div class="c-card">
          <h3 class="c-card__title">📝 Solicita tu cotización</h3>
          <p class="c-card__sub">Solo toma 30 segundos. Los campos con <span style="color:var(--primary)">*</span> son obligatorios.</p>

          <form class="c-form" id="contactForm" novalidate style="margin-top:20px">
            <div class="c-form__body">

              <div class="c-field">
                <span class="c-label">¿Qué necesitas? <span>*</span></span>
                <div class="c-chips" role="radiogroup" aria-label="Motivo de contacto">
                  ${[
                    { v: 'Comprar una moto', i: '🏍️' },
                    { v: 'Repuestos', i: '🔧' },
                    { v: 'Servicio técnico', i: '🛠️' },
                    { v: 'Tuning LED', i: '💡' }
                  ].map((o, i) => `
                  <label class="c-chip">
                    <input type="radio" name="intent" value="${esc(o.v)}" ${i === 0 ? 'checked' : ''}>
                    <span class="c-chip__face">${o.i} ${esc(o.v)}</span>
                  </label>`).join('')}
                </div>
              </div>

              <div class="c-row">
                <div class="c-field">
                  <label class="c-label" for="cName">Nombre <span>*</span></label>
                  <input class="c-input" type="text" id="cName" name="name" placeholder="Ej. Juan Pérez"
                         autocomplete="name" required aria-describedby="cNameErr">
                  <span class="c-error" id="cNameErr">⚠ Ingresa tu nombre</span>
                </div>
                <div class="c-field">
                  <label class="c-label" for="cPhone">Celular / WhatsApp <span>*</span></label>
                  <input class="c-input" type="tel" id="cPhone" name="phone" placeholder="9XX XXX XXX"
                         inputmode="numeric" autocomplete="tel" maxlength="12" required aria-describedby="cPhoneErr">
                  <span class="c-error" id="cPhoneErr">⚠ Ingresa un celular de 9 dígitos</span>
                </div>
              </div>

              <div class="c-row">
                <div class="c-field">
                  <label class="c-label" for="cBrand">Marca de tu moto <small>(opcional)</small></label>
                  <select class="c-select" id="cBrand" name="brand">
                    <option value="">Selecciona…</option>
                    ${contactBrandOptions().map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('')}
                  </select>
                </div>
                <div class="c-field">
                  <label class="c-label" for="cBranch">Sede de preferencia</label>
                  <select class="c-select" id="cBranch" name="branch">
                    ${S.list('branches').filter(b => b.active !== false)
                      .map(b => `<option value="${esc(b.name)}">${esc(b.name)}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div class="c-field">
                <label class="c-label" for="cMsg">Detalle de tu consulta <span>*</span></label>
                <textarea class="c-textarea" id="cMsg" name="message" required aria-describedby="cMsgErr"
                  placeholder="Ej. Busco una moto de trabajo 150cc para chacra, ¿tienen financiamiento?"></textarea>
                <span class="c-error" id="cMsgErr">⚠ Cuéntanos brevemente qué necesitas</span>
              </div>

              <label class="c-consent">
                <input type="checkbox" id="cConsent" name="consent" checked>
                <span>Acepto ser contactado por WhatsApp o llamada para recibir mi cotización.</span>
              </label>

              <div class="c-sent" id="cSent" role="status" aria-live="polite">
                ✅ <span>¡Listo! Abrimos WhatsApp con tu consulta ya redactada.</span>
              </div>

              <button class="c-submit" type="submit">
                ${svgWhatsApp(21, '#fff')} <span>Enviar por WhatsApp</span>
              </button>

              <p class="c-form__note">🔒 No guardamos tus datos. El mensaje se abre en tu propio WhatsApp.</p>
            </div>
          </form>
        </div>

        <!-- ====== COLUMNA LATERAL ====== -->
        <div class="contact-side">
          <div class="c-card">
            <span class="c-status ${st.isOpen ? 'c-status--open' : 'c-status--closed'}">
              <span class="c-status__dot"></span> ${esc(st.label)}
            </span>
            <p class="c-card__sub" style="margin-top:10px">${esc(st.detail)}</p>

            <div class="c-channels">
              <a class="c-channel" href="${S.waLink('Hola ' + (SET.siteName || 'AP Motors') + ', deseo asesoría personalizada')}" target="_blank" rel="noopener">
                <span class="c-channel__ico c-channel__ico--wa">${svgWhatsApp(20, '#25d366')}</span>
                <span class="c-channel__body">
                  <span class="c-channel__label">WhatsApp principal</span>
                  <span class="c-channel__value">${esc(SET.phone1Label || SET.phone1 || '')}</span>
                </span>
                <span class="c-channel__arrow" aria-hidden="true">›</span>
              </a>

              ${SET.phone2 ? `
              <a class="c-channel" href="${S.waLink('Hola ' + (SET.siteName || 'AP Motors') + ', deseo asesoría personalizada', SET.phone2)}" target="_blank" rel="noopener">
                <span class="c-channel__ico c-channel__ico--wa">${svgWhatsApp(20, '#25d366')}</span>
                <span class="c-channel__body">
                  <span class="c-channel__label">WhatsApp alterno</span>
                  <span class="c-channel__value">${esc(SET.phone2Label || SET.phone2)}</span>
                </span>
                <span class="c-channel__arrow" aria-hidden="true">›</span>
              </a>` : ''}

              <div class="c-channel" style="cursor:default">
                <span class="c-channel__ico c-channel__ico--clock">🕗</span>
                <span class="c-channel__body">
                  <span class="c-channel__label">Horario de atención</span>
                  <span class="c-channel__value" style="font-size:.86rem;white-space:normal">${esc(hours)}</span>
                </span>
              </div>

              ${main ? `
              <a class="c-channel" href="${S.mapsLink(main)}" target="_blank" rel="noopener">
                <span class="c-channel__ico c-channel__ico--pin">📍</span>
                <span class="c-channel__body">
                  <span class="c-channel__label">Sede principal</span>
                  <span class="c-channel__value" style="font-size:.88rem;white-space:normal">${esc(main.address)}</span>
                  <span class="c-channel__meta">${esc(main.reference || '')}</span>
                </span>
                <span class="c-channel__arrow" aria-hidden="true">›</span>
              </a>` : ''}
            </div>

            <div class="c-sla">
              ⚡ <span>Respondemos en <strong>menos de 15 minutos</strong> dentro del horario de atención.</span>
            </div>
          </div>

          <div class="c-card">
            <h3 class="c-card__title" style="font-size:1rem">🚀 ¿Prefieres explorar primero?</h3>
            <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">
              <button class="btn btn--ghost" data-goto-btn="tienda" style="flex:1;min-width:130px">Ver Catálogo</button>
              <button class="btn btn--ghost" data-goto-btn="cotizador" style="flex:1;min-width:130px">Cotizador</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ====== FRANJA DE CONFIANZA ====== -->
      <div class="c-trust">
        <div class="c-trust__item">
          <div class="c-trust__ico">🛡️</div>
          <div>
            <div class="c-trust__title">Garantía 1 año</div>
            <div class="c-trust__desc">Servicio técnico respaldado</div>
          </div>
        </div>
        <div class="c-trust__item">
          <div class="c-trust__ico">✅</div>
          <div>
            <div class="c-trust__title">Distribuidor oficial</div>
            <div class="c-trust__desc">RONCO · NEXUS · SUMO</div>
          </div>
        </div>
        <div class="c-trust__item">
          <div class="c-trust__ico">📦</div>
          <div>
            <div class="c-trust__title">Repuestos originales</div>
            <div class="c-trust__desc">Stock permanente</div>
          </div>
        </div>
        <div class="c-trust__item">
          <div class="c-trust__ico">💳</div>
          <div>
            <div class="c-trust__title">Financiamiento</div>
            <div class="c-trust__desc">Cuotas a tu medida</div>
          </div>
        </div>
      </div>

      <div class="footer-mini">
        <p>© <span id="year">${new Date().getFullYear()}</span> ${esc(SET.siteName || 'AP Motors')} · Todos los derechos reservados.</p>
        <p>Hecho con 🔧 en el sur del Perú</p>
      </div>
    </div>`;

  $$('[data-goto-btn]', root).forEach(b => b.addEventListener('click', () => goto(b.dataset.gotoBtn)));
  bindContactForm(root);
}

/* ---------- Validación + envío del formulario a WhatsApp ---------- */
function bindContactForm(root) {
  const form = $('#contactForm', root);
  if (!form) return;

  const fields = {
    name:  { el: $('#cName', form),  err: $('#cNameErr', form),  test: v => v.trim().length >= 2 },
    phone: { el: $('#cPhone', form), err: $('#cPhoneErr', form), test: v => v.replace(/\D/g, '').length >= 9 },
    message: { el: $('#cMsg', form), err: $('#cMsgErr', form),   test: v => v.trim().length >= 5 },
  };

  // Solo dígitos y espacios en el teléfono
  fields.phone.el.addEventListener('input', e => {
    e.target.value = e.target.value.replace(/[^\d\s]/g, '');
  });

  // Limpia el error en cuanto el campo se vuelve válido
  Object.values(fields).forEach(f => {
    f.el.addEventListener('input', () => {
      if (f.test(f.el.value)) {
        f.err.classList.remove('show');
        f.el.removeAttribute('aria-invalid');
      }
    });
  });

  function validate() {
    let firstBad = null;
    Object.values(fields).forEach(f => {
      const ok = f.test(f.el.value);
      f.err.classList.toggle('show', !ok);
      if (ok) f.el.removeAttribute('aria-invalid');
      else {
        f.el.setAttribute('aria-invalid', 'true');
        if (!firstBad) firstBad = f.el;
      }
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validate()) return;

    const d = new FormData(form);
    const site = SET.siteName || 'AP Motors';
    const brand = (d.get('brand') || '').toString().trim();

    // Mensaje estructurado y legible en WhatsApp
    const lines = [
      `Hola ${site}, quiero una cotización 👋`,
      '',
      `*Motivo:* ${d.get('intent') || 'Consulta general'}`,
      `*Nombre:* ${(d.get('name') || '').toString().trim()}`,
      `*Celular:* ${(d.get('phone') || '').toString().trim()}`,
      brand ? `*Marca:* ${brand}` : null,
      `*Sede:* ${d.get('branch') || '—'}`,
      '',
      `*Detalle:* ${(d.get('message') || '').toString().trim()}`,
    ].filter(Boolean);

    // Enruta al WhatsApp de la sede elegida cuando existe
    const chosen = S.list('branches').find(b => b.name === d.get('branch'));
    const url = S.waLink(lines.join('\n'), chosen && chosen.phone);

    const sent = $('#cSent', form);
    if (sent) sent.classList.add('show');
    window.open(url, '_blank', 'noopener');
  });
}

/* ============================================================
   NAVEGACIÓN HORIZONTAL EXCLUSIVA & CONTROL DE SLIDER
   ============================================================ */
const slider = $('#slider');
const slides = $$('.slide');
const ORDER = ['inicio', 'promociones', 'tienda', 'servicios', 'tuning', 'cotizador', 'sedes', 'contacto'];

function slideById(id) {
  return slides.find(s => s.dataset.slide === id) || document.getElementById('slide-' + id);
}

function goto(id) {
  const slide = slideById(id);
  if (!slide || !slider) return;
  slider.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
  try { history.replaceState(null, '', '#' + id); } catch (e) {}
}

let currentIndex = 0;

function updateIndicator() {
  if (!slider) return;
  const center = slider.scrollLeft + slider.clientWidth / 2;
  let idx = 0;
  slides.forEach((s, i) => { if (s.offsetLeft <= center) idx = i; });
  currentIndex = idx;

  // Actualizar Dots
  $$('.dots__dot').forEach((d, i) => d.classList.toggle('active', i === idx));
  const prevBtn = $('#navPrev');
  const nextBtn = $('#navNext');
  if (prevBtn) prevBtn.disabled = idx === 0;
  if (nextBtn) nextBtn.disabled = idx === slides.length - 1;

  // Actualizar Barra de Progreso
  const maxScroll = slider.scrollWidth - slider.clientWidth;
  const progress = maxScroll > 0 ? (slider.scrollLeft / maxScroll) * 100 : 0;
  const progBar = $('#progressBar');
  if (progBar) progBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;

  // Actualizar Menú Horizontal y Píldora
  const activeSlideId = slides[idx]?.dataset?.slide;
  $$('.nav-h__link').forEach(l => {
    const isAct = l.dataset.goto === activeSlideId;
    l.classList.toggle('active', isAct);
    if (isAct) {
      moveNavPill(l);
    }
  });
}

function moveNavPill(activeLink) {
  const pill = $('#navHPill');
  if (!pill || !activeLink) return;
  const navRect = activeLink.parentElement.getBoundingClientRect();
  const linkRect = activeLink.getBoundingClientRect();
  const leftOffset = linkRect.left - navRect.left + activeLink.parentElement.scrollLeft;
  pill.style.width = `${linkRect.width}px`;
  pill.style.transform = `translateX(${leftOffset}px)`;
  pill.style.opacity = '1';
}

function buildDots() {
  const labels = ['Inicio', 'Promos', 'Tienda', 'Servicios', 'Tuning', 'Cotizador', 'Sedes', 'Contacto'];
  const dotsContainer = $('#dots');
  if (!dotsContainer) return;
  dotsContainer.innerHTML = ORDER.map((id, i) =>
    `<button class="dots__dot ${i === 0 ? 'active' : ''}" data-goto="${id}" role="tab" aria-label="${labels[i]}"><span class="dots__tooltip">${labels[i]}</span></button>`
  ).join('');
  $$('.dots__dot', dotsContainer).forEach(d => d.addEventListener('click', () => goto(d.dataset.goto)));
}

function navBy(dir) {
  const target = slides[currentIndex + dir];
  if (target) goto(target.dataset.slide);
}

// Listeners de navegación
const pBtn = $('#navPrev');
const nBtn = $('#navNext');
if (pBtn) pBtn.addEventListener('click', () => navBy(-1));
if (nBtn) nBtn.addEventListener('click', () => navBy(1));
if (slider) slider.addEventListener('scroll', updateIndicator, { passive: true });

// Navegación por Teclado
window.addEventListener('keydown', (e) => {
  if (e.target.matches('input, select, textarea')) return;
  if (e.key === 'ArrowRight') navBy(1);
  if (e.key === 'ArrowLeft') navBy(-1);
});

// Soporte Swipe Táctil
let touchStartX = 0;
let touchStartY = 0;
if (slider) {
  slider.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  slider.addEventListener('touchend', (e) => {
    const diffX = touchStartX - e.changedTouches[0].clientX;
    const diffY = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diffX > 0) navBy(1);
      else navBy(-1);
    }
  }, { passive: true });
}

$$('.nav-h__link').forEach(l => l.addEventListener('click', (e) => {
  e.preventDefault();
  goto(l.dataset.goto);
}));

/* ============================================================
   CARRITO DE COMPRAS & PEDIDOS WHATSAPP
   ============================================================ */
let cart = loadCart();

function loadCart() {
  try { return JSON.parse(localStorage.getItem('apmotors-cart-v2')) || []; } catch { return []; }
}
function saveCart() {
  localStorage.setItem('apmotors-cart-v2', JSON.stringify(cart));
}

function addToCart(product) {
  const existing = cart.find(i => i.id === product.id);
  if (existing) existing.qty += 1;
  else cart.push({ id: product.id, qty: 1 });

  saveCart();
  renderCart();
  toast(`✔ "${product.name}" añadido al carrito`, true);
}

function updateQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
}

function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
}

function cartItems() {
  return cart.map(i => {
    const p = S.get('products', i.id);
    return p ? { ...p, qty: i.qty } : null;
  }).filter(Boolean);
}

function cartTotals() {
  const items = cartItems().filter(i => i.priceAfter != null && !i.consult);
  const subtotal = items.reduce((s, i) => s + i.priceAfter * i.qty, 0);
  const discount = subtotal * DISC;
  return { items, subtotal, discount, total: subtotal - discount };
}

function renderCart() {
  const { items, subtotal, discount, total } = cartTotals();
  const count = items.reduce((s, i) => s + i.qty, 0);

  const badge = $('#cartCount');
  if (badge) {
    badge.textContent = count;
    badge.classList.remove('pop');
    void badge.offsetWidth;
    badge.classList.add('pop');
  }

  const body = $('#cartBody');
  const foot = $('#cartFoot');
  if (!body || !foot) return;

  $('#cartDiscountLabel').textContent = `Ahorro Campaña (${SET.discountPercent}% OFF):`;

  if (!items.length) {
    body.innerHTML = '<p class="cart__empty">Tu carrito de compras está vacío.</p>';
    foot.hidden = true;
    return;
  }

  body.innerHTML = items.map(i => `
    <div class="cart-item">
      <span class="cart-item__emoji">${i.image ? `<img src="${esc(i.image)}" alt="">` : (i.emoji || '🏍️')}</span>
      <div class="cart-item__info">
        <p class="cart-item__title">${esc(i.name)}</p>
        <p class="cart-item__price">${fmtSoles(i.priceAfter)}</p>
        <div class="cart-item__controls">
          <button class="cart-item__btn" data-dec="${esc(i.id)}" aria-label="Disminuir cantidad">−</button>
          <span class="cart-item__qty">${i.qty}</span>
          <button class="cart-item__btn" data-inc="${esc(i.id)}" aria-label="Aumentar cantidad">+</button>
          <button class="cart-item__remove" data-remove="${esc(i.id)}">Eliminar</button>
        </div>
      </div>
    </div>`).join('');

  $('#cartSubtotal').textContent = fmtSoles(subtotal);
  $('#cartDiscount').textContent = '- ' + fmtSoles(discount);
  $('#cartTotal').textContent = fmtSoles(total);
  foot.hidden = false;

  $$('.cart-item__btn', body).forEach(b => b.addEventListener('click', () => {
    if (b.dataset.inc) updateQty(b.dataset.inc, 1);
    if (b.dataset.dec) updateQty(b.dataset.dec, -1);
  }));
  $$('.cart-item__remove', body).forEach(b => b.addEventListener('click', () => removeItem(b.dataset.remove)));
}

const cartEl = $('#cart'), overlay = $('#cartOverlay');
function openCart() {
  if (!cartEl || !overlay) return;
  cartEl.classList.add('show');
  overlay.classList.add('show');
  document.body.classList.add('no-scroll');
}
function closeCart() {
  if (!cartEl || !overlay) return;
  cartEl.classList.remove('show');
  overlay.classList.remove('show');
  document.body.classList.remove('no-scroll');
}

const cartBtn = $('#cartBtn');
const cartClose = $('#cartClose');
if (cartBtn) cartBtn.addEventListener('click', openCart);
if (cartClose) cartClose.addEventListener('click', closeCart);
if (overlay) overlay.addEventListener('click', closeCart);

const checkoutBtn = $('#cartCheckout');
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    const { items, subtotal, discount, total } = cartTotals();
    if (!items.length) return;
    const lines = items.map(i => `• ${i.name} (x${i.qty}) — ${fmtSoles(i.priceAfter * i.qty)}`).join('\n');
    const msg = `Hola ${SET.siteName}, deseo confirmar el siguiente pedido desde el carrito web:\n\n${lines}\n\nSubtotal: ${fmtSoles(subtotal)}\nDescuento aplicado (${SET.discountPercent}% OFF): -${fmtSoles(discount)}\nTotal estimado: ${fmtSoles(total)}\n\n¿Tienen stock disponible para entrega/recojo en sede?`;
    window.open(S.waLink(msg), '_blank');
  });
}

/* ============================================================
   UTILIDADES & INTERSECCIÓN REVEAL
   ============================================================ */
function observeReveal() {
  if (!('IntersectionObserver' in window)) {
    $$('.reveal:not(.visible)').forEach(el => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('visible');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.08 });
  $$('.reveal:not(.visible)').forEach(el => io.observe(el));
}

const toastEl = document.createElement('div');
toastEl.className = 'toast';
document.body.appendChild(toastEl);
let toastTimer;
function toast(message, success = false) {
  toastEl.textContent = message;
  toastEl.classList.toggle('toast--success', success);
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2500);
}

/* ============================================================
   TEMA CLARO / OSCURO
   ============================================================ */
function initTheme() {
  const btn = $('#themeBtn');
  if (!btn) return;
  const sync = () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.textContent = dark ? '☀️' : '🌙';
    btn.setAttribute('aria-label', dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
    const meta = document.getElementById('metaTheme');
    if (meta) meta.setAttribute('content', dark ? '#0a1122' : '#0a1547');
  };
  sync();
  btn.addEventListener('click', () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark');
    try { localStorage.setItem('apmotors-theme', dark ? 'light' : 'dark'); } catch (e) {}
    sync();
  });
}

/* ============================================================
   RENDERIZADO COMPLETO DEL SITIO
   ============================================================ */
function renderAll() {
  renderTopbar();
  renderHero();
  renderBrands();
  renderWhy();
  renderPromos();
  renderStore();
  renderServices();
  renderTuning();
  renderQuote();
  renderBranches();
  renderContact();
  renderCart();
  updateIndicator();
}

/* ============================================================
   BOOTSTRAP
   ============================================================ */
(async function boot() {
  initTheme();
  buildDots();

  // 1. Carga inicial desde Store
  await Store.init({ seedIfEmpty: false, liveSync: true });
  SET = Store.data.settings;
  DISC = Number(SET.discountPercent || 20) / 100;

  renderAll();

  // 2. Reactividad en tiempo real: cuando el admin actualiza Firestore
  Store.onUpdate((data) => {
    SET = data.settings;
    DISC = Number(SET.discountPercent || 20) / 100;
    renderAll();
  });

  // 3. Revisar hash inicial en la URL
  if (window.location.hash) {
    const targetId = window.location.hash.replace('#slide-', '').replace('#', '');
    if (ORDER.includes(targetId)) {
      setTimeout(() => goto(targetId), 200);
    }
  }
})();
