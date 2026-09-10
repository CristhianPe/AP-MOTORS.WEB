/* ============================================================
   AP MOTORS — Panel de Administración
   CRUD completo sobre colecciones modulares de Firestore y LocalStorage
   Sincronización en tiempo real con la tienda pública
   ============================================================ */

'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------- Estado del Panel ---------- */
let currentTab = 'ajustes';
let editingId = null;          // id del registro en edición (null = nuevo)
let pendingDelete = null;      // { collection, id, label }
let searchQuery = '';          // filtro de texto
let filterCategory = '';       // filtro de categoría (para productos)
let filterStatus = '';         // filtro de estado (all, active, inactive)
let adminPage = 1;             // página actual para paginación 5x2
const ADMIN_PAGE_SIZE = 10;    // 10 ítems por página (muestreo 5x2)
let adminViewMode = 'grid';    // 'grid' (5x2) o 'list'

/* ============================================================
   ESQUEMAS DE CAMPOS POR COLECCIÓN
   ============================================================ */
const F = {
  text: (k, label, o = {}) => ({ k, label, type: 'text', ...o }),
  textarea: (k, label, o = {}) => ({ k, label, type: 'textarea', ...o }),
  number: (k, label, o = {}) => ({ k, label, type: 'number', ...o }),
  color: (k, label, o = {}) => ({ k, label, type: 'color', ...o }),
  emoji: (k, label, o = {}) => ({ k, label, type: 'emoji', ...o }),
  select: (k, label, options, o = {}) => ({ k, label, type: 'select', options, ...o }),
  image: (k, label, o = {}) => ({ k, label, type: 'image', ...o }),
  toggle: (k, label, o = {}) => ({ k, label, type: 'toggle', ...o }),
  datetime: (k, label, o = {}) => ({ k, label, type: 'datetime', ...o }),
  tags: (k, label, o = {}) => ({ k, label, type: 'tags', ...o }),
};

const SCHEMAS = {
  promotions: {
    collection: 'promotions', singular: 'Promoción', plural: 'Promociones', icon: '🔥',
    desc: 'Campañas y ofertas destacadas visibles en la sección "Promociones".',
    fields: () => [
      F.text('title', 'Título de la promoción', { required: true }),
      F.text('badgeLabel', 'Etiqueta (Badge)', { placeholder: 'Ej. 20% OFF · Campaña' }),
      F.color('badgeColor', 'Color del badge', { default: '#ed1c24' }),
      F.textarea('desc', 'Descripción detallada'),
      F.image('image', 'Banner publicitario (subir imagen o URL)'),
      F.text('ctaText', 'Texto del botón CTA', { placeholder: 'Ej. Quiero el 20% OFF' }),
      F.text('ctaMessage', 'Mensaje predeterminado de WhatsApp', { placeholder: 'Ej. Hola AP Motors, quiero aprovechar el 20% de descuento' }),
      F.toggle('active', 'Promoción activa (visible)', { default: true }),
      F.datetime('scheduleAt', 'Programar publicación (opcional)'),
      F.number('orderIndex', 'Orden de visualización', { placeholder: '1' }),
    ],
  },
  categories: {
    collection: 'categories', singular: 'Categoría', plural: 'Categorías', icon: '🏷️',
    desc: 'Clasificación de productos (Motos, Repuestos, Tuning, etc.).',
    fields: () => [
      F.text('name', 'Nombre de la categoría', { required: true }),
      F.color('color', 'Color distintivo', { default: '#ed1c24' }),
      F.emoji('icon', 'Icono / Emoji', { placeholder: '🏍️' }),
      F.toggle('active', 'Categoría activa', { default: true }),
      F.number('orderIndex', 'Orden', { placeholder: '1' }),
    ],
  },
  brands: {
    collection: 'brands', singular: 'Marca', plural: 'Marcas', icon: '🏍️',
    desc: 'Marcas distribuidas (RONCO, NEXUS, SUMO, etc.).',
    fields: () => [
      F.text('name', 'Nombre de la marca', { required: true }),
      F.text('tag', 'Especialidad / Tipo', { placeholder: 'Ej. Chacarera / Offroad' }),
      F.color('color', 'Color de la marca', { default: '#dc2626' }),
      F.emoji('emoji', 'Emoji representativo', { placeholder: '🏍️' }),
      F.textarea('desc', 'Descripción de la marca y garantía'),
      F.toggle('active', 'Marca activa', { default: true }),
      F.number('orderIndex', 'Orden', { placeholder: '1' }),
    ],
  },
  products: {
    collection: 'products', singular: 'Producto / Moto', plural: 'Tienda y Stock', icon: '📦',
    desc: 'Catálogo de motocicletas, repuestos oficiales y accesorios con control de stock y precios.',
    fields: () => [
      F.text('name', 'Nombre del modelo o repuesto', { required: true }),
      F.select('categoryId', 'Categoría', [['', '— Seleccionar categoría —'], ...Store.list('categories').map(c => [c.id, `${c.icon || '🏷️'} ${c.name}`])]),
      F.select('brandId', 'Marca asociada', [['', '— Sin marca / Multimarca —'], ...Store.list('brands').map(b => [b.id, `${b.emoji || '🏍️'} ${b.name}`])]),
      F.image('image', 'Foto del producto (subir o pegar URL)'),
      F.emoji('emoji', 'Emoji fallback (si no hay foto)', { placeholder: '🏍️' }),
      F.textarea('desc', 'Descripción comercial y técnica'),
      F.number('priceBefore', 'Precio normal / anterior (S/)', { placeholder: 'Ej. 6200' }),
      F.number('priceAfter', 'Precio oferta / venta (S/)', { placeholder: 'Ej. 5900' }),
      F.tags('specs', 'Ficha técnica / Etiquetas (separadas por coma)', { placeholder: '200cc, Todo terreno, Carga pesada' }),
      F.text('promoLabel', 'Etiqueta comercial (Badge)', { placeholder: 'Ej. OFERTA CAMPAÑA' }),
      F.toggle('isPromo', 'Marcar como oferta destacada'),
      F.toggle('consult', 'Solo consulta (sin precio visible en soles)'),
      F.toggle('active', 'Producto activo (visible en catálogo)', { default: true }),
      F.datetime('scheduleAt', 'Programar lanzamiento (opcional)'),
      F.number('orderIndex', 'Orden de catálogo', { placeholder: '1' }),
    ],
  },
  services: {
    collection: 'services', singular: 'Servicio', plural: 'Servicios de Taller', icon: '🛠️',
    desc: 'Servicios mecánicos del taller. Alimentan el Cotizador Express interactivo.',
    fields: () => [
      F.text('name', 'Nombre del servicio', { required: true }),
      F.emoji('icon', 'Icono (Emoji)', { placeholder: '🛠️' }),
      F.number('price', 'Precio base estimado (S/)', { required: true, placeholder: '36' }),
      F.textarea('desc', 'Detalle de los trabajos que incluye'),
      F.toggle('featured', 'Destacar como "Más pedido"'),
      F.toggle('active', 'Servicio activo', { default: true }),
      F.number('orderIndex', 'Orden', { placeholder: '1' }),
    ],
  },
  tuning: {
    collection: 'tuning', singular: 'Elemento Tuning', plural: 'Tuning LED & Seguridad', icon: '💡',
    desc: 'Equipamiento de iluminación LED, exploradoras y barras protectoras anticaídas.',
    fields: () => [
      F.text('name', 'Nombre del kit o componente', { required: true }),
      F.emoji('icon', 'Icono / Emoji', { placeholder: '💡' }),
      F.textarea('desc', 'Descripción y ventajas para visibilidad nocturna'),
      F.text('benefit', 'Beneficio destacado', { placeholder: 'Ej. Instalación eléctrica gratis en taller' }),
      F.toggle('active', 'Elemento activo', { default: true }),
      F.number('orderIndex', 'Orden', { placeholder: '1' }),
    ],
  },
  branches: {
    collection: 'branches', singular: 'Sede', plural: 'Sedes y Mapas', icon: '📍',
    desc: 'Locales físicos con enlace directo a Google Maps y WhatsApp directo.',
    fields: () => [
      F.text('name', 'Nombre de la sede', { required: true, placeholder: 'Ej. Sede Principal — Bella Unión' }),
      F.text('address', 'Dirección exacta', { required: true, placeholder: 'Ej. Av. Francisco Flores S/N' }),
      F.text('reference', 'Referencia de ubicación', { placeholder: 'Ej. Frente a agua Don Felipe' }),
      F.text('hours', 'Horario de atención', { placeholder: 'Ej. Lun–Sáb: 8:00 AM – 7:00 PM' }),
      F.text('phone', 'Teléfono / WhatsApp de la sede', { placeholder: '51987654321' }),
      F.text('lat', 'Latitud GPS (opcional para mapa exacto)', { placeholder: 'Ej. -15.4520' }),
      F.text('lng', 'Longitud GPS (opcional)', { placeholder: 'Ej. -74.6540' }),
      F.toggle('isMain', 'Marcar como Sede Principal'),
      F.toggle('active', 'Sede activa', { default: true }),
      F.number('orderIndex', 'Orden', { placeholder: '1' }),
    ],
  },
};

const SETTINGS_FIELDS = [
  F.text('siteName', 'Nombre de la empresa', { required: true }),
  F.text('heroBadge', 'Badge superior del Hero', { placeholder: '⚡ POR APERTURA DE TIENDA' }),
  F.text('heroTitle', 'Título principal del Hero'),
  F.textarea('heroSubtitle', 'Subtítulo del Hero'),
  F.text('heroPromo', 'Texto destacado de promoción'),
  F.text('noticeBar', 'Barra de anuncios superior (Top notice)'),
  F.number('discountPercent', 'Porcentaje de descuento de campaña (%)', { placeholder: '20' }),
  F.text('phone1', 'WhatsApp 1 (número internacional sin espacios ni +)', { placeholder: '51987654321' }),
  F.text('phone1Label', 'Etiqueta visible WhatsApp 1', { placeholder: '+51 987 654 321' }),
  F.text('phone2', 'WhatsApp 2 (opcional)', { placeholder: '51912345678' }),
  F.text('phone2Label', 'Etiqueta visible WhatsApp 2', { placeholder: '+51 912 345 678' }),
  F.text('hours', 'Horario de atención general', { placeholder: 'Lun–Sáb: 8:00 AM – 7:00 PM' }),
  F.image('logo', 'Logo de la marca'),
  F.image('heroImage', 'Banner principal del Hero'),
];

/* ============================================================
   RENDERIZADO PRINCIPAL
   ============================================================ */
function renderCurrent() {
  if (currentTab === 'ajustes') return renderSettings();
  const s = SCHEMAS[currentTab];
  if (!s) return;

  let items = Store.list(s.collection);

  // Filtros aplicables
  if (searchQuery) {
    const q = searchQuery.toLowerCase().trim();
    items = items.filter(it =>
      (it.name && it.name.toLowerCase().includes(q)) ||
      (it.title && it.title.toLowerCase().includes(q)) ||
      (it.desc && it.desc.toLowerCase().includes(q))
    );
  }

  if (currentTab === 'products') {
    if (filterCategory) {
      items = items.filter(it => it.categoryId === filterCategory);
    }
    if (filterStatus === 'active') items = items.filter(it => it.active !== false);
    if (filterStatus === 'inactive') items = items.filter(it => it.active === false);
  }

  const isProductsTab = currentTab === 'products';
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / ADMIN_PAGE_SIZE) || 1;
  if (adminPage > totalPages) adminPage = totalPages;
  if (adminPage < 1) adminPage = 1;

  const startIdx = (adminPage - 1) * ADMIN_PAGE_SIZE;
  const pageItems = isProductsTab ? items.slice(startIdx, startIdx + ADMIN_PAGE_SIZE) : items;

  const categories = Store.list('categories');

  $('#aMain').innerHTML = `
    <div class="a-head">
      <div>
        <h2>${s.icon} ${s.plural}</h2>
        <p>${s.desc}</p>
      </div>
      <button class="a-btn a-btn--primary" data-add>+ Añadir ${s.singular}</button>
    </div>

    <!-- Barra de búsqueda y filtros -->
    <div class="a-toolbar">
      <div class="a-search-box">
        <span class="a-search-icon">🔍</span>
        <input type="text" id="aSearchInput" class="a-input a-input--search" placeholder="Buscar ${s.plural.toLowerCase()}..." value="${esc(searchQuery)}">
        ${searchQuery ? `<button class="a-search-clear" id="aSearchClear">✕</button>` : ''}
      </div>

      ${isProductsTab ? `
      <div class="a-filter-group">
        <select id="aCatFilter" class="a-select a-select--sm">
          <option value="">Todas las categorías (${categories.length})</option>
          ${categories.map(c => `<option value="${esc(c.id)}" ${filterCategory === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
        </select>
        <select id="aStatusFilter" class="a-select a-select--sm">
          <option value="" ${filterStatus === '' ? 'selected' : ''}>Todos los estados</option>
          <option value="active" ${filterStatus === 'active' ? 'selected' : ''}>Solo activos (visibles)</option>
          <option value="inactive" ${filterStatus === 'inactive' ? 'selected' : ''}>Solo ocultos</option>
        </select>
        <div class="a-view-switch">
          <button class="a-btn a-btn--sm ${adminViewMode === 'grid' ? 'a-btn--primary' : 'a-btn--ghost'}" id="aViewGrid" title="Cuadrícula 5x2">📐 5x2</button>
          <button class="a-btn a-btn--sm ${adminViewMode === 'list' ? 'a-btn--primary' : 'a-btn--ghost'}" id="aViewList" title="Lista compacta">📋 Lista</button>
        </div>
      </div>` : ''}
    </div>

    ${isProductsTab && adminViewMode === 'grid' ? `
      <!-- Cuadrícula 5x2 en Panel de Administración (10 productos) -->
      <div class="a-grid--5x2">
        ${pageItems.length
          ? pageItems.map(it => renderProductCardAdmin(it)).join('')
          : `<div class="a-empty" style="grid-column: 1 / -1;">No se encontraron productos ${searchQuery || filterCategory ? 'con los filtros actuales' : ''}. Haz clic en "+ Añadir Producto".</div>`}
      </div>
    ` : `
      <div class="a-list">
        ${pageItems.length
          ? pageItems.map(it => renderItem(s.collection, it)).join('')
          : `<div class="a-empty">No se encontraron registros ${searchQuery || filterCategory ? 'con los filtros actuales' : `en ${s.plural}`}. Haz clic en "+ Añadir ${s.singular}".</div>`}
      </div>
    `}

    ${isProductsTab && totalItems > 0 ? `
      <!-- Paginación 5x2 en Panel de Administración -->
      <div class="a-pagination">
        <button class="a-btn a-btn--ghost a-btn--sm" id="aPagePrev" ${adminPage === 1 ? 'disabled' : ''}>◀ Anterior</button>
        <div class="a-page-numbers">
          ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
            <button class="a-page-num ${p === adminPage ? 'active' : ''}" data-admin-page="${p}">${p}</button>
          `).join('')}
        </div>
        <button class="a-btn a-btn--ghost a-btn--sm" id="aPageNext" ${adminPage === totalPages ? 'disabled' : ''}>Siguiente ▶</button>
      </div>
      <p class="a-pagination__info">
        Mostrando <strong>${totalItems === 0 ? 0 : startIdx + 1}–${Math.min(startIdx + ADMIN_PAGE_SIZE, totalItems)}</strong> de <strong>${totalItems}</strong> productos en inventario (Página ${adminPage} de ${totalPages})
      </p>
    ` : ''}`;

  // Listeners de Toolbar y Paginación
  const searchInput = $('#aSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      adminPage = 1;
      renderCurrent();
      const nextInput = $('#aSearchInput');
      if (nextInput) { nextInput.focus(); nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length); }
    });
  }
  const searchClear = $('#aSearchClear');
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchQuery = '';
      adminPage = 1;
      renderCurrent();
    });
  }
  const catFilter = $('#aCatFilter');
  if (catFilter) {
    catFilter.addEventListener('change', (e) => {
      filterCategory = e.target.value;
      adminPage = 1;
      renderCurrent();
    });
  }
  const statusFilter = $('#aStatusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      filterStatus = e.target.value;
      adminPage = 1;
      renderCurrent();
    });
  }

  const vGrid = $('#aViewGrid');
  if (vGrid) {
    vGrid.addEventListener('click', () => {
      adminViewMode = 'grid';
      renderCurrent();
    });
  }
  const vList = $('#aViewList');
  if (vList) {
    vList.addEventListener('click', () => {
      adminViewMode = 'list';
      renderCurrent();
    });
  }

  const pagePrev = $('#aPagePrev');
  if (pagePrev) {
    pagePrev.addEventListener('click', () => {
      if (adminPage > 1) {
        adminPage--;
        renderCurrent();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
  const pageNext = $('#aPageNext');
  if (pageNext) {
    pageNext.addEventListener('click', () => {
      if (adminPage < totalPages) {
        adminPage++;
        renderCurrent();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
  $$('[data-admin-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      adminPage = Number(btn.dataset.adminPage) || 1;
      renderCurrent();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Listeners de acciones
  $('[data-add]').addEventListener('click', () => openForm(s.collection, null));
  $$('[data-edit]').forEach(b => b.addEventListener('click', () => openForm(s.collection, b.dataset.edit)));
  $$('[data-del]').forEach(b => b.addEventListener('click', () => askDelete(s.collection, b.dataset.del)));
  $$('[data-toggle-active]').forEach(chk => chk.addEventListener('change', async () => {
    const id = chk.dataset.toggleActive;
    const isChecked = chk.checked;
    await Store.update(s.collection, id, { active: isChecked });
    toast(isChecked ? '✔ Ahora visible en la página web' : '👁️ Ocultado de la página web');
    renderCurrent();
  }));
}

function renderSettings() {
  const st = Store.data.settings;
  $('#aMain').innerHTML = `
    <div class="a-head">
      <div>
        <h2>⚙️ Ajustes generales</h2>
        <p>Configura información institucional, teléfonos de WhatsApp, banners y descuentos globales.</p>
      </div>
      <button class="a-btn a-btn--primary" id="saveSettings">💾 Guardar cambios</button>
    </div>
    <div class="a-form" id="settingsForm"></div>`;

  const formEl = $('#settingsForm');
  formEl.innerHTML = buildFields(SETTINGS_FIELDS, st);
  bindImageHandlers(formEl);

  $('#saveSettings').addEventListener('click', async () => {
    const values = collectFields(SETTINGS_FIELDS);
    const fb = window.FB;
    if (fb && fb.auth && !fb.auth.currentUser) {
      toast('⚠️ Debes iniciar sesión como administrador para guardar cambios');
      setTimeout(() => { window.location.href = 'login.html'; }, 1500);
      return;
    }
    try {
      await Store.updateSettings(values);
      toast('Ajustes guardados y sincronizados ✔');
    } catch (e) {
      console.error('Error al guardar ajustes:', e);
      if (e && e.code === 'permission-denied') {
        toast('⚠️ Permisos insuficientes: Inicia sesión en /login');
      } else {
        toast(`⚠️ Error al guardar ajustes: ${e.message || 'Error en Firestore'}`);
      }
    }
  });
}

function renderItem(collection, it) {
  switch (collection) {
    case 'promotions': {
      const sched = scheduleBadge(it);
      return itemShell(it, `
        ${it.image ? `<img class="a-item__thumb" src="${esc(it.image)}" alt="">` : `<div class="a-item__thumb a-item__thumb--empty">🔥</div>`}
        <div class="a-item__info">
          <strong>${esc(it.title)}</strong>
          <span class="a-item__sub">${esc(it.badgeLabel || '')}</span>
          <div class="a-item__meta">${statusBadge(it)} ${sched}</div>
        </div>`, it.id, collection);
    }
    case 'categories':
      return itemShell(it, `
        <div class="a-item__thumb" style="background:${esc(it.color)}20; border: 2px solid ${esc(it.color)}">${it.icon || '🏷️'}</div>
        <div class="a-item__info">
          <strong>${esc(it.name)}</strong>
          <span class="a-item__sub">Color: ${esc(it.color)} ${it.active === false ? '· <em>Oculta</em>' : ''}</span>
        </div>`, it.id, collection);
    case 'brands':
      return itemShell(it, `
        <div class="a-item__thumb" style="background:${esc(it.color)}20; border: 2px solid ${esc(it.color)}">${it.emoji || '🏍️'}</div>
        <div class="a-item__info">
          <strong>${esc(it.name)}</strong>
          <span class="a-item__sub">${esc(it.tag || '')}</span>
          <div class="a-item__meta">${statusBadge(it)}</div>
        </div>`, it.id, collection);
    case 'products': {
      const cat = Store.get('categories', it.categoryId);
      const brand = Store.get('brands', it.brandId);
      const sched = scheduleBadge(it);
      return itemShell(it, `
        ${it.image ? `<img class="a-item__thumb" src="${esc(it.image)}" alt="">` : `<div class="a-item__thumb a-item__thumb--empty">${it.emoji || '📦'}</div>`}
        <div class="a-item__info">
          <strong>${esc(it.name)}</strong>
          <span class="a-item__sub">${esc(cat ? cat.name : 'Sin categoría')} ${brand ? `· ${esc(brand.name)}` : ''}</span>
          <div class="a-item__meta">
            ${it.priceBefore != null ? `<del class="a-price-del">${fmtSoles(it.priceBefore)}</del>` : ''}
            ${it.priceAfter != null ? `<b class="a-price-val">${fmtSoles(it.priceAfter)}</b>` : (it.consult ? '<em class="a-price-consult">A consultar</em>' : '')}
            ${statusBadge(it)} ${sched}
          </div>
        </div>`, it.id, collection);
    }
    case 'services':
      return itemShell(it, `
        <div class="a-item__thumb a-item__thumb--empty">${it.icon || '🛠️'}</div>
        <div class="a-item__info">
          <strong>${esc(it.name)}</strong>
          <span class="a-item__sub">${it.price != null ? fmtSoles(it.price) : ''} ${it.featured ? '· ⭐ Destacado' : ''}</span>
          <div class="a-item__meta">${statusBadge(it)}</div>
        </div>`, it.id, collection);
    case 'tuning':
      return itemShell(it, `
        <div class="a-item__thumb a-item__thumb--empty">${it.icon || '💡'}</div>
        <div class="a-item__info">
          <strong>${esc(it.name)}</strong>
          <span class="a-item__sub">${esc(it.benefit || '')}</span>
          <div class="a-item__meta">${statusBadge(it)}</div>
        </div>`, it.id, collection);
    case 'branches':
      return itemShell(it, `
        <div class="a-item__thumb a-item__thumb--empty">📍</div>
        <div class="a-item__info">
          <strong>${esc(it.name)}${it.isMain ? ' <span class="a-chip a-chip--primary">Principal</span>' : ''}</strong>
          <span class="a-item__sub">${esc(it.address)}</span>
          <span class="a-item__sub">${esc(it.reference || '')}</span>
        </div>`, it.id, collection);
    default:
      return '';
  }
}

function itemShell(item, inner, id, collection) {
  const isActive = item.active !== false;
  return `<article class="a-item ${isActive ? '' : 'a-item--muted'}">
    ${inner}
    <div class="a-item__actions">
      <label class="a-visible-toggle" title="${isActive ? 'Visible en la web — Desmarca para ocultar' : 'Oculto — Marca para hacer visible en la web'}">
        <input type="checkbox" class="a-checkbox-active" data-toggle-active="${esc(id)}" ${isActive ? 'checked' : ''}>
        <span class="a-visible-toggle__box"></span>
        <span class="a-visible-toggle__label">${isActive ? 'Visible' : 'Oculto'}</span>
      </label>
      <button class="a-btn a-btn--ghost a-btn--sm" data-edit="${esc(id)}">✏️ Editar</button>
      <button class="a-btn a-btn--danger-ghost a-btn--sm" data-del="${esc(id)}" title="Eliminar registro">🗑️</button>
    </div>
  </article>`;
}

/* Tarjeta visual 5x2 de producto para el panel de administración */
function renderProductCardAdmin(it) {
  const cat = Store.get('categories', it.categoryId);
  const brand = Store.get('brands', it.brandId);
  const isActive = it.active !== false;
  const sched = scheduleBadge(it);

  let promoTag = it.promoLabel;
  if (!promoTag && it.priceBefore && it.priceAfter && it.priceBefore > it.priceAfter) {
    const pct = Math.round((1 - it.priceAfter / it.priceBefore) * 100);
    promoTag = `-${pct}% OFF`;
  }

  return `
    <article class="a-card-product ${isActive ? '' : 'a-card-product--muted'}">
      <div class="a-card-product__media">
        <span class="a-card-product__badge" style="background:${esc(cat?.color || 'var(--a-blue)')}">
          ${esc(promoTag || cat?.name || 'General')}
        </span>
        ${it.image
          ? `<img src="${esc(it.image)}" alt="${esc(it.name)}" class="a-card-product__img" loading="lazy">`
          : `<span class="a-card-product__emoji">${it.emoji || '📦'}</span>`}
      </div>
      <div class="a-card-product__body">
        <span class="a-card-product__sub">${esc(cat ? cat.name : 'Sin categoría')} ${brand ? `· ${esc(brand.name)}` : ''}</span>
        <strong class="a-card-product__title">${esc(it.name)}</strong>
        <div class="a-card-product__price">
          ${it.priceBefore != null ? `<del class="a-price-del">${fmtSoles(it.priceBefore)}</del>` : ''}
          ${it.priceAfter != null ? `<b class="a-price-val">${fmtSoles(it.priceAfter)}</b>` : (it.consult ? '<em class="a-price-consult">A consultar</em>' : '')}
        </div>
        <div class="a-card-product__meta">${statusBadge(it)} ${sched}</div>
      </div>
      <div class="a-card-product__foot">
        <label class="a-visible-toggle" title="${isActive ? 'Visible en la web' : 'Oculto de la web'}">
          <input type="checkbox" class="a-checkbox-active" data-toggle-active="${esc(it.id)}" ${isActive ? 'checked' : ''}>
          <span class="a-visible-toggle__box"></span>
          <span class="a-visible-toggle__label">${isActive ? 'Visible' : 'Oculto'}</span>
        </label>
        <div class="a-card-product__actions">
          <button class="a-btn a-btn--ghost a-btn--sm" data-edit="${esc(it.id)}" title="Editar producto">✏️ Editar</button>
          <button class="a-btn a-btn--danger-ghost a-btn--sm" data-del="${esc(it.id)}" title="Eliminar producto">🗑️</button>
        </div>
      </div>
    </article>`;
}

function statusBadge(it) {
  if (it.active === false) return '<span class="a-chip a-chip--off">Oculto</span>';
  return '<span class="a-chip a-chip--on">Activo</span>';
}

function scheduleBadge(it) {
  if (!it.scheduleAt) return '';
  const t = new Date(it.scheduleAt).getTime();
  const future = t > Date.now();
  return `<span class="a-chip ${future ? 'a-chip--sched' : 'a-chip--pub'}">${future ? '⏳ Programado' : '🕒 Publicado'} ${new Date(it.scheduleAt).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}</span>`;
}

/* ============================================================
   FORMULARIOS MODALES (CREAR / EDITAR)
   ============================================================ */
// Función para garantizar que ninguna imagen base64 supere jamás los límites de Firestore (< 60KB)
async function ensureSafeImage(dataUri) {
  if (!dataUri || !dataUri.startsWith('data:image')) return dataUri;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 600;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.70));
    };
    img.onerror = () => resolve(dataUri);
    img.src = dataUri;
  });
}

function openForm(collection, id) {
  const s = SCHEMAS[currentTab];
  const fields = s.fields(id);
  const existing = id ? Store.get(collection, id) : {};
  editingId = id;

  $('#aModalTitle').textContent = id ? `Editar ${s.singular}` : `Añadir nuevo ${s.singular}`;
  $('#aModalBody').innerHTML = buildFields(fields, existing || {}) +
    (collection === 'branches' ? '<div class="a-map a-map--preview" id="aMapPreview"></div>' : '');
  $('#aModal').hidden = false;

  const saveBtn = $('#aModalSave');
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Guardar';
    saveBtn.classList.remove('a-btn--optimizing');
  }

  bindImageHandlers($('#aModalBody'));
  if (collection === 'branches') bindBranchMaps();

  $('#aModalSave').onclick = async () => {
    const saveBtn = $('#aModalSave');
    const values = collectFields(fields);
    for (const f of fields) {
      if (f.required && !String(values[f.k] ?? '').trim()) {
        toast(`⚠️ Completa el campo requerido "${f.label}"`);
        return;
      }
    }

    // Comprobación previa de sesión activa en Firebase
    const fb = window.FB;
    if (fb && fb.auth && !fb.auth.currentUser) {
      toast('⚠️ Debes iniciar sesión como administrador para guardar en Firebase');
      setTimeout(() => { window.location.href = 'login.html'; }, 1500);
      return;
    }

    const originalBtnText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando…';

    try {
      // Optimización automática de imagen al vuelo antes de persistir
      if (values.image && values.image.startsWith('data:image')) {
        saveBtn.textContent = 'Optimizando foto…';
        values.image = await ensureSafeImage(values.image);
      }

      if (id) {
        await Store.update(collection, id, values);
        toast(`${s.singular} actualizado ✔`);
      } else {
        await Store.add(collection, values);
        toast(`${s.singular} creado con éxito ✔`);
      }
      closeModal();
      renderCurrent();
    } catch (err) {
      console.error('Error detallado al guardar en Firestore:', err);
      const code = err && err.code;
      if (code === 'permission-denied') {
        toast('⚠️ Error de permisos: Inicia sesión nuevamente en /login.html');
      } else if (code === 'resource-exhausted' || (err.message && err.message.includes('exceeds maximum allowed size'))) {
        toast('⚠️ La imagen supera el límite de Firestore. Usa una foto más liviana.');
      } else {
        toast(`⚠️ Error al guardar: ${err.message || 'Error de sincronización con Firestore'}`);
      }
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = originalBtnText;
    }
  };
}

/* ============================================================
   CONSTRUCCIÓN DINÁMICA DE CAMPOS
   ============================================================ */
function buildFields(fields, data = {}) {
  return `<div class="a-form-grid">` + fields.map(f => {
    const val = data[f.k] != null ? data[f.k] : (f.default ?? '');
    switch (f.type) {
      case 'text':
        return `
          <div class="a-field ${f.wide ? 'a-field--wide' : ''}">
            <label>${esc(f.label)} ${f.required ? '<span class="a-req">*</span>' : ''}</label>
            <input type="text" class="a-input" data-k="${esc(f.k)}" value="${esc(val)}" placeholder="${esc(f.placeholder || '')}">
          </div>`;
      case 'textarea':
        return `
          <div class="a-field a-field--wide">
            <label>${esc(f.label)} ${f.required ? '<span class="a-req">*</span>' : ''}</label>
            <textarea class="a-textarea" data-k="${esc(f.k)}" placeholder="${esc(f.placeholder || '')}">${esc(val)}</textarea>
          </div>`;
      case 'number':
        return `
          <div class="a-field">
            <label>${esc(f.label)} ${f.required ? '<span class="a-req">*</span>' : ''}</label>
            <input type="number" step="any" class="a-input" data-k="${esc(f.k)}" value="${val !== '' && val != null ? Number(val) : ''}" placeholder="${esc(f.placeholder || '')}">
          </div>`;
      case 'color':
        return `
          <div class="a-field">
            <label>${esc(f.label)}</label>
            <div class="a-color-input">
              <input type="color" data-k="${esc(f.k)}" value="${esc(val || '#ed1c24')}">
              <input type="text" class="a-input" data-ktext="${esc(f.k)}" value="${esc(val || '#ed1c24')}" maxlength="7">
            </div>
          </div>`;
      case 'emoji':
        return `
          <div class="a-field">
            <label>${esc(f.label)}</label>
            <input type="text" class="a-input a-input--emoji" data-k="${esc(f.k)}" value="${esc(val)}" placeholder="🏍️">
          </div>`;
      case 'select':
        return `
          <div class="a-field">
            <label>${esc(f.label)}</label>
            <select class="a-select" data-k="${esc(f.k)}">
              ${(f.options || []).map(([v, label]) => `
                <option value="${esc(v)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(label)}</option>
              `).join('')}
            </select>
          </div>`;
      case 'toggle':
        const checked = val === true || val === 'true';
        return `
          <div class="a-field a-field--toggle">
            <label class="a-toggle">
              <input type="checkbox" data-k="${esc(f.k)}" ${checked ? 'checked' : ''}>
              <span class="a-toggle__slider"></span>
              <span class="a-toggle__label">${esc(f.label)}</span>
            </label>
          </div>`;
      case 'datetime':
        const dtVal = val ? new Date(val).toISOString().slice(0, 16) : '';
        return `
          <div class="a-field">
            <label>${esc(f.label)}</label>
            <input type="datetime-local" class="a-input" data-k="${esc(f.k)}" value="${dtVal}">
          </div>`;
      case 'tags':
        const tagsVal = Array.isArray(val) ? val.join(', ') : val;
        return `
          <div class="a-field a-field--wide">
            <label>${esc(f.label)}</label>
            <input type="text" class="a-input" data-k="${esc(f.k)}" data-type="tags" value="${esc(tagsVal)}" placeholder="${esc(f.placeholder || '')}">
          </div>`;
      case 'image':
        return `
          <div class="a-field a-field--wide a-field--img" data-img-group>
            <label>${esc(f.label)} ${f.required ? '<span class="a-req">*</span>' : ''}</label>
            
            <div class="a-img-inputs-bar">
              <input type="text" class="a-input" data-k="${esc(f.k)}" data-img-url value="${esc(val)}" placeholder="Pega una URL https://... o selecciona un archivo">
              <label class="a-btn a-btn--primary a-file-btn">
                📁 Subir foto
                <input type="file" accept="image/*" data-img-file hidden>
              </label>
            </div>

            <!-- Barra de estado de optimización -->
            <div class="a-img-status-bar" data-img-status-bar style="display:none;">
              <span data-img-status-text></span>
            </div>

            <!-- Visor de Encuadre y Márgenes Seguros de Catálogo (SIEMPRE VISIBLE) -->
            <div class="a-framing-editor" data-framing-box>
              <div class="a-framing-editor__head">
                <div class="a-framing-editor__title">
                  <span>📐 <strong>Visor de Márgenes de Catálogo:</strong> Encuadre oficial de la tienda</span>
                </div>
                <div class="a-framing-editor__mode-btns">
                  <div class="a-btn-group">
                    <button type="button" class="a-tag-btn active" data-framing-ratio="1-1">1:1 (Tienda Web)</button>
                    <button type="button" class="a-tag-btn" data-framing-ratio="4-3">4:3</button>
                    <button type="button" class="a-tag-btn" data-framing-ratio="16-9">16:9</button>
                  </div>
                  <div class="a-btn-group">
                    <button type="button" class="a-tag-btn active" data-framing-fit="cover">Cover</button>
                    <button type="button" class="a-tag-btn" data-framing-fit="contain">Contain</button>
                  </div>
                </div>
              </div>

              <!-- Tarjeta Simuladora con Guías de Márgenes Seguros (Por defecto 1:1 Cuadrado) -->
              <div class="a-framing-stage ratio-1-1" data-card-stage style="background: #ffffff;">
                <div class="a-framing-guides-layer">
                  <span class="a-framing-badge-sim">Badge (-20% OFF)</span>
                  <div class="a-framing-safe-rect">
                    <span class="a-framing-safe-tag">Zona Segura 1:1 (Sin Cortes)</span>
                  </div>
                </div>
                
                <div class="a-framing-img-wrapper" data-img-wrapper>
                  ${val
                    ? `<img src="${esc(val)}" alt="Encuadre" class="a-framing-img fit-cover" data-framing-img>`
                    : `<div class="a-framing-placeholder" data-framing-ph>
                         <span class="a-framing-placeholder__icon">🏍️</span>
                         <p>Sube una foto o pega una URL para previsualizar el encuadre 1:1</p>
                       </div>
                       <img src="" alt="Encuadre" class="a-framing-img fit-cover" data-framing-img style="display:none;">`
                  }
                </div>
                <div class="a-framing-loading" data-framing-load hidden>⏳ Optimizando imagen...</div>
              </div>

              <!-- Controles Interactivos de Ajuste Fino -->
              <div class="a-framing-controls" data-framing-controls style="${val ? '' : 'display:none;'}">
                <div class="a-framing-ctrl-row">
                  <label>🔍 <strong>Zoom / Escala:</strong></label>
                  <input type="range" class="a-range" data-framing-zoom min="70" max="180" value="100" step="2">
                  <span class="a-range-val" data-framing-zoom-val>100%</span>
                </div>

                <div class="a-framing-ctrl-row">
                  <label>↕️ <strong>Posición Vertical (Eje Y):</strong></label>
                  <input type="range" class="a-range" data-framing-pos-y min="-40" max="40" value="0" step="1">
                  <span class="a-range-val" data-framing-pos-y-val>Centro (0)</span>
                </div>

                <div class="a-framing-ctrl-row">
                  <label>🎨 <strong>Fondo de Tarjeta:</strong></label>
                  <div class="a-bg-btns">
                    <button type="button" class="a-bg-btn active" data-bg="#ffffff">Blanco</button>
                    <button type="button" class="a-bg-btn" data-bg="#0f172a" style="color:#fff;background:#0f172a;">Oscuro</button>
                    <button type="button" class="a-bg-btn" data-bg="#f1f5f9">Gris</button>
                    <button type="button" class="a-bg-btn" data-bg="transparent">Transp.</button>
                  </div>
                  <button type="button" class="a-btn a-btn--sm a-btn--primary" data-framing-bake style="margin-left:auto;">
                    ✂️ Aplicar encuadre 1:1
                  </button>
                </div>
              </div>

              <p class="a-framing-hint">
                💡 <strong>Margen 1:1 Sincronizado:</strong> Esta tarjeta refleja la proporción exacta 1:1 (cuadrada) en la que tus clientes ven los productos en la tienda web.
              </p>
            </div>
          </div>`;
      default:
        return '';
    }
  }).join('') + `</div>`;
}

function collectFields(fields) {
  const out = {};
  for (const f of fields) {
    const el = $(`[data-k="${f.k}"]`);
    if (!el) continue;
    if (f.type === 'toggle') {
      out[f.k] = el.checked;
    } else if (f.type === 'number') {
      const v = el.value.trim();
      out[f.k] = v === '' ? null : Number(v);
    } else if (f.type === 'tags') {
      const raw = el.value.split(',').map(s => s.trim()).filter(Boolean);
      out[f.k] = raw;
    } else if (f.type === 'datetime') {
      out[f.k] = el.value ? new Date(el.value).toISOString() : '';
    } else {
      out[f.k] = el.value.trim();
    }
  }
  return out;
}

/* ============================================================
   MANEJO DE IMÁGENES Y SUBIDAS A FIREBASE STORAGE
   ============================================================ */
function bindImageHandlers(scope = document) {
  $$('[data-img-group]', scope).forEach(group => {
    const txt = $('[data-img-url]', group);
    const file = $('[data-img-file]', group);
    const framingBox = $('[data-framing-box]', group);
    const framingImg = $('[data-framing-img]', group);
    const framingPh = $('[data-framing-ph]', group);
    const framingControls = $('[data-framing-controls]', group);
    const cardStage = $('[data-card-stage]', group);
    const loading = $('[data-framing-load]', group);
    const zoomInput = $('[data-framing-zoom]', group);
    const zoomVal = $('[data-framing-zoom-val]', group);
    const posYInput = $('[data-framing-pos-y]', group);
    const posYVal = $('[data-framing-pos-y-val]', group);
    const bakeBtn = $('[data-framing-bake]', group);

    const statusBar = $('[data-img-status-bar]', group);
    const statusText = $('[data-img-status-text]', group);

    // Si ya tiene una foto cargada al abrir el formulario
    if (txt && txt.value && statusBar && statusText) {
      statusBar.style.display = 'flex';
      statusBar.className = 'a-img-status-bar ready';
      statusText.innerHTML = '✔ <strong>Foto vinculada</strong> — Lista para guardar';
    }

    let currentZoom = 100;
    let currentPosY = 0;
    let currentFit = 'cover';
    let currentBg = '#ffffff';
    let currentRatio = '1-1';

    function applyTransform() {
      if (framingImg) {
        framingImg.style.transform = `scale(${currentZoom / 100}) translateY(${currentPosY}%)`;
      }
    }

    const updatePreview = (url) => {
      if (url) {
        if (framingImg) {
          framingImg.src = url;
          framingImg.style.display = 'block';
        }
        if (framingPh) framingPh.style.display = 'none';
        if (framingControls) framingControls.style.display = 'flex';
      } else {
        if (framingImg) {
          framingImg.src = '';
          framingImg.style.display = 'none';
        }
        if (framingPh) framingPh.style.display = 'flex';
        if (framingControls) framingControls.style.display = 'none';
      }
    };

    if (framingBox) {
      // Proporción 1:1, 4:3, 16:9
      $$('[data-framing-ratio]', framingBox).forEach(btn => {
        btn.addEventListener('click', () => {
          $$('[data-framing-ratio]', framingBox).forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentRatio = btn.dataset.framingRatio;
          if (cardStage) {
            cardStage.className = `a-framing-stage ratio-${currentRatio}`;
          }
          const safeTag = $('.a-framing-safe-tag', framingBox);
          if (safeTag) {
            safeTag.textContent = `Zona Segura ${currentRatio.replace('-', ':')} (Sin Cortes)`;
          }
          if (bakeBtn) {
            bakeBtn.textContent = `✂️ Aplicar encuadre ${currentRatio.replace('-', ':')}`;
          }
        });
      });

      // Modos Cover / Contain
      $$('[data-framing-fit]', framingBox).forEach(btn => {
        btn.addEventListener('click', () => {
          $$('[data-framing-fit]', framingBox).forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentFit = btn.dataset.framingFit;
          if (framingImg) {
            framingImg.className = `a-framing-img fit-${currentFit}`;
          }
        });
      });

      // Zoom slider
      if (zoomInput) {
        zoomInput.addEventListener('input', () => {
          currentZoom = Number(zoomInput.value);
          if (zoomVal) zoomVal.textContent = `${currentZoom}%`;
          applyTransform();
        });
      }

      // Posición vertical slider
      if (posYInput) {
        posYInput.addEventListener('input', () => {
          currentPosY = Number(posYInput.value);
          if (posYVal) posYVal.textContent = currentPosY === 0 ? 'Centro (0)' : `${currentPosY > 0 ? '+' : ''}${currentPosY}%`;
          applyTransform();
        });
      }

      // Color de fondo
      $$('[data-bg]', framingBox).forEach(bBtn => {
        bBtn.addEventListener('click', () => {
          $$('[data-bg]', framingBox).forEach(b => b.classList.remove('active'));
          bBtn.classList.add('active');
          currentBg = bBtn.dataset.bg;
          if (cardStage) cardStage.style.background = currentBg;
        });
      });

      // Aplicar encuadre exacto al Canvas con optimización
      if (bakeBtn) {
        bakeBtn.addEventListener('click', () => {
          if (!framingImg || !framingImg.src) return;
          const saveBtn = $('#aModalSave');
          if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = '⏳ Optimizando encuadre…';
            saveBtn.classList.add('a-btn--optimizing');
          }
          if (statusBar && statusText) {
            statusBar.style.display = 'flex';
            statusBar.className = 'a-img-status-bar optimizing';
            statusText.innerHTML = '⏳ <strong>Aplicando encuadre y optimizando foto...</strong>';
          }

          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            let canvasW = 600;
            let canvasH = 600; // Por defecto 1:1
            if (currentRatio === '4-3') { canvasW = 600; canvasH = 450; }
            if (currentRatio === '16-9') { canvasW = 640; canvasH = 360; }

            const canvas = document.createElement('canvas');
            canvas.width = canvasW; canvas.height = canvasH;
            const ctx = canvas.getContext('2d');

            // 1. Fondo
            if (currentBg && currentBg !== 'transparent') {
              ctx.fillStyle = currentBg;
              ctx.fillRect(0, 0, canvasW, canvasH);
            }

            // 2. Calcular dimensiones de imagen escalada y posicionada
            let drawW, drawH, drawX, drawY;
            const imgAspect = img.width / img.height;
            const canvasAspect = canvasW / canvasH;

            if (currentFit === 'cover') {
              if (imgAspect > canvasAspect) {
                drawH = canvasH;
                drawW = canvasH * imgAspect;
              } else {
                drawW = canvasW;
                drawH = canvasW / imgAspect;
              }
            } else {
              // Contain
              if (imgAspect > canvasAspect) {
                drawW = canvasW * 0.88;
                drawH = drawW / imgAspect;
              } else {
                drawH = canvasH * 0.88;
                drawW = drawH * imgAspect;
              }
            }

            // Aplicar Zoom y Posición Y
            drawW *= (currentZoom / 100);
            drawH *= (currentZoom / 100);
            drawX = (canvasW - drawW) / 2;
            drawY = (canvasH - drawH) / 2 + (canvasH * (currentPosY / 100));

            ctx.drawImage(img, drawX, drawY, drawW, drawH);

            const bakedDataUrl = canvas.toDataURL('image/jpeg', 0.70);
            if (txt) txt.value = bakedDataUrl;
            framingImg.src = bakedDataUrl;
            currentZoom = 100;
            currentPosY = 0;
            if (zoomInput) zoomInput.value = 100;
            if (zoomVal) zoomVal.textContent = '100%';
            if (posYInput) posYInput.value = 0;
            if (posYVal) posYVal.textContent = 'Centro (0)';
            applyTransform();

            const kb = Math.round((bakedDataUrl.length * 0.75) / 1024);
            if (statusBar && statusText) {
              statusBar.style.display = 'flex';
              statusBar.className = 'a-img-status-bar ready';
              statusText.innerHTML = `✔ <strong>Foto optimizada con encuadre ${currentRatio.replace('-', ':')}</strong> (~${kb} KB) — Opción de guardar habilitada`;
            }
            if (saveBtn) {
              saveBtn.disabled = false;
              saveBtn.textContent = 'Guardar';
              saveBtn.classList.remove('a-btn--optimizing');
            }
            toast(`✔ Foto optimizada con encuadre ${currentRatio.replace('-', ':')}: lista para guardar`);
          };
          img.onerror = () => {
            if (saveBtn) {
              saveBtn.disabled = false;
              saveBtn.textContent = 'Guardar';
              saveBtn.classList.remove('a-btn--optimizing');
            }
          };
          img.src = framingImg.src;
        });
      }
    }

    if (txt) {
      txt.addEventListener('input', () => updatePreview(txt.value.trim()));
    }

    if (file) {
      file.addEventListener('change', () => {
        const f = file.files?.[0];
        if (!f) return;

        const saveBtn = $('#aModalSave');

        // 1. DESHABILITAR BOTÓN GUARDAR Y MOSTRAR "Optimizando imagen"
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.textContent = '⏳ Optimizando imagen…';
          saveBtn.classList.add('a-btn--optimizing');
        }

        if (loading) {
          loading.innerHTML = '<span>⏳ Optimizando imagen...</span><small style="display:block;font-size:0.75rem;font-weight:600;opacity:0.85;margin-top:4px;">Reduciendo peso para guardar</small>';
          loading.hidden = false;
          loading.style.display = 'grid';
        }

        if (statusBar && statusText) {
          statusBar.style.display = 'flex';
          statusBar.className = 'a-img-status-bar optimizing';
          statusText.innerHTML = '⏳ <strong>Optimizando imagen...</strong> Por favor espera para guardar.';
        }

        toast('⏳ Optimizando imagen para reducir peso...');

        // 2. EJECUTAR COMPRESIÓN ULTRA-LIVIANA
        uploadImage(f, (resUrl, isPreviewOnly) => {
          if (isPreviewOnly) {
            // Vista previa visual inmediata en el marco mientras comprime
            updatePreview(resUrl);
          } else {
            if (resUrl) {
              if (txt) txt.value = resUrl;
              updatePreview(resUrl);

              // 3. MOSTRAR MENSAJE DE "FOTO OPTIMIZADA"
              if (loading) {
                loading.innerHTML = '<span style="color:#4ade80;font-size:1.15rem;">✔ Foto optimizada</span><small style="display:block;font-size:0.78rem;font-weight:700;color:#f8fafc;margin-top:4px;">Lista para catálogo</small>';
                setTimeout(() => {
                  loading.hidden = true;
                  loading.style.display = 'none';
                }, 850);
              }

              const kb = Math.round((resUrl.length * 0.75) / 1024);
              if (statusBar && statusText) {
                statusBar.style.display = 'flex';
                statusBar.className = 'a-img-status-bar ready';
                statusText.innerHTML = `✔ <strong>Foto optimizada</strong> (~${kb} KB) — Opción de guardar habilitada`;
              }

              // 4. RECIÉN AQUÍ SE HABILITA EL BOTÓN DE GUARDAR
              if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Guardar';
                saveBtn.classList.remove('a-btn--optimizing');
              }

              toast('✔ Foto optimizada: opción de guardar habilitada');
            } else {
              if (loading) {
                loading.hidden = true;
                loading.style.display = 'none';
              }
              if (statusBar && statusText) {
                statusBar.style.display = 'flex';
                statusBar.className = 'a-img-status-bar optimizing';
                statusText.innerHTML = '⚠️ <strong>No se pudo procesar la imagen</strong>';
              }
              if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Guardar';
                saveBtn.classList.remove('a-btn--optimizing');
              }
              toast('No se pudo procesar la imagen ⚠️');
            }
          }
        });
      });
    }
  });

  // Sincronizar selectores de color
  $$('input[type="color"]', scope).forEach(c => {
    c.addEventListener('input', () => {
      const txt = $(`[data-ktext="${c.dataset.k}"]`, scope);
      if (txt) txt.value = c.value;
    });
  });
  $$('[data-ktext]', scope).forEach(t => {
    t.addEventListener('input', () => {
      const c = $(`input[type="color"][data-k="${t.dataset.ktext}"]`, scope);
      if (c && /^#[0-9a-f]{6}$/i.test(t.value)) c.value = t.value;
    });
  });
}

function uploadImage(file, cb) {
  if (!file) { cb('', false); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    const rawDataUrl = e.target.result;
    // Feedback visual inmediato en el marco
    cb(rawDataUrl, true);

    // Compresión instantánea en Canvas (máx 600px, 70% de compresión JPEG ~35KB-50KB)
    const img = new Image();
    img.onload = () => {
      const maxDim = 600;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.70);
      cb(compressedDataUrl, false);
    };
    img.onerror = () => {
      cb('', false);
    };
    img.src = rawDataUrl;
  };
  reader.onerror = () => {
    cb('', false);
  };
  reader.readAsDataURL(file);
}

/* ============================================================
   MAPAS PREVIEW (SEDES)
   ============================================================ */
function bindBranchMaps() {
  const preview = $('#aMapPreview');
  if (!preview) return;
  const update = () => {
    const name = $('#aModalBody input[data-k="name"]')?.value || 'Sede';
    const addr = $('#aModalBody input[data-k="address"]')?.value || '';
    const lat = $('#aModalBody input[data-k="lat"]')?.value || '';
    const lng = $('#aModalBody input[data-k="lng"]')?.value || '';
    const q = (lat && lng) ? `${lat},${lng}` : `${name}, ${addr}`;
    preview.innerHTML = `<iframe src="https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed" loading="lazy"></iframe>`;
  };
  ['name', 'address', 'lat', 'lng'].forEach(k => {
    const el = $('#aModalBody input[data-k="' + k + '"]');
    if (el) el.addEventListener('input', update);
  });
  update();
}

/* ============================================================
   ELIMINACIÓN DE REGISTROS
   ============================================================ */
function askDelete(collection, id) {
  const item = Store.get(collection, id);
  const label = item && (item.name || item.title) ? (item.name || item.title) : 'este registro';
  pendingDelete = { collection, id };
  $('#aConfirmText').textContent = `Se eliminará permanentemente "${label}". Esta acción no se puede deshacer.`;
  $('#aConfirm').hidden = false;
}

$('#aConfirmYes').addEventListener('click', async () => {
  if (!pendingDelete) return;
  try {
    await Store.remove(pendingDelete.collection, pendingDelete.id);
    toast('Registro eliminado ✔');
  } catch (err) {
    toast('Error al eliminar registro ⚠️');
  }
  pendingDelete = null;
  $('#aConfirm').hidden = true;
  renderCurrent();
});

/* ============================================================
   MODALES Y TOASTS
   ============================================================ */
function closeModal() {
  $('#aModal').hidden = true;
  editingId = null;
}
$$('[data-close]').forEach(el => el.addEventListener('click', closeModal));
$('#aModal').addEventListener('click', (e) => { if (e.target === $('#aModal')) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); $('#aConfirm').hidden = true; } });

/* ============================================================
   NAVEGACIÓN DE PESTAÑAS
   ============================================================ */
$$('.a-nav__item').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.a-nav__item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.dataset.tab;
    searchQuery = '';
    filterCategory = '';
    filterStatus = '';
    renderCurrent();
  });
});

/* ============================================================
   RESET GENERAL
   ============================================================ */
$('#aReset').addEventListener('click', async () => {
  if (confirm('¿Restablecer toda la base de datos a los valores predeterminados de fábrica?')) {
    await Store.reset();
    renderCurrent();
    toast('Base de datos restablecida ↺');
  }
});

let toastTimer;
function toast(msg) {
  const t = $('#aToast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ============================================================
   TEMA CLARO / OSCURO
   ============================================================ */
function initTheme() {
  const btn = $('#aThemeBtn');
  if (!btn) return;
  const sync = () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.textContent = dark ? '☀️ Tema' : '🌙 Tema';
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
   AUTENTICACIÓN FIREBASE AUTH
   ============================================================ */
function setupAuthUI(user) {
  const emailEl = $('#aUserEmail');
  const syncBadge = $('#aSyncBadge');
  const logout = $('#aLogout');
  if (user) {
    if (emailEl) emailEl.innerHTML = `👤 <span style="font-weight:700;color:#38bdf8;">${esc(user.email || 'Administrador')}</span>`;
    if (syncBadge) {
      syncBadge.textContent = '🟢 Conectado (Firestore)';
      syncBadge.className = 'a-sync-badge';
    }
    if (logout) {
      logout.hidden = false;
      logout.onclick = async () => {
        if (window.FB && window.FB.auth) {
          await window.FB.auth.signOut();
        }
        window.location.replace('login.html');
      };
    }
  } else {
    if (emailEl) emailEl.innerHTML = `<a href="login.html" style="color:#ef4444;font-weight:700;text-decoration:underline;">⚠️ Iniciar sesión</a>`;
    if (syncBadge) {
      syncBadge.textContent = '🔴 Sin sesión (Solo lectura)';
      syncBadge.className = 'a-sync-badge offline';
    }
    if (logout) logout.hidden = true;
  }
}

/* ============================================================
   BOOTSTRAP
   ============================================================ */
(async function boot() {
  initTheme();

  // Guard reactivo de autenticación
  if (window.FB && window.FB.auth) {
    window.FB.auth.onAuthStateChanged((user) => {
      if (!user) {
        setupAuthUI(null);
        toast('⚠️ Sesión requerida para administrar. Redirigiendo a login...');
        setTimeout(() => { window.location.replace('login.html'); }, 1200);
      } else {
        setupAuthUI(user);
      }
    });
  } else {
    setupAuthUI(null);
  }

  // Inicializar capa de datos con sembrado si está vacío
  await Store.init({ seedIfEmpty: true, liveSync: true });

  $('#aSiteName').textContent = Store.data.settings.siteName;

  // Reactividad: Si Firestore se actualiza externamente y el usuario no está editando en modal, re-renderizar
  Store.onUpdate(() => {
    if ($('#aModal').hidden) {
      renderCurrent();
    }
  });

  renderCurrent();
})();
