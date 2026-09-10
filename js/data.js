/* ============================================================
   AP MOTORS — Capa de datos modular y sincronizada
   Fuente principal: Firebase Firestore (Colecciones independientes)
   Respaldo local: localStorage (Soporte 100% Offline)
   Sincronización: onSnapshot en tiempo real (Página pública <-> Admin)
   ============================================================ */

'use strict';

const STORAGE_KEY = 'apmotors-data-v2';
const LEGACY_STORAGE_KEY = 'apmotors-data-v1';
const LEGACY_DOC_PATH = { collection: 'data', doc: 'main' };

const COLLECTIONS = [
  'brands',
  'categories',
  'products',
  'services',
  'tuning',
  'promotions',
  'branches'
];

/* ---------- Generador de IDs únicos y ordenados en el tiempo ---------- */
function generateId(prefix = 'id') {
  const ts = Date.now().toString(36);
  let rand = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    rand = Array.from(bytes, b => b.toString(36).padStart(2, '0')).join('').slice(0, 6);
  } else {
    rand = Math.random().toString(36).slice(2, 8);
  }
  return `${prefix}_${ts}_${rand}`;
}

/* ---------- Datos por defecto (Seed inicial) ---------- */
const DEFAULT_DATA = {
  settings: {
    siteName: 'AP MOTORS',
    heroBadge: '⚡ POR APERTURA DE TIENDA',
    heroTitle: 'Tu mejor opción comercial en motos del sur',
    heroSubtitle: 'Distribuidores autorizados RONCO · NEXUS · SUMO. Motos de trabajo, repuestos oficiales, tuning LED y servicio técnico con garantía de 1 año.',
    heroPromo: '¡20% de descuento en productos y servicios seleccionados! Participa además por una moto nueva.',
    phone1: '51987654321',
    phone1Label: '+51 987 654 321',
    phone2: '51912345678',
    phone2Label: '+51 912 345 678',
    hours: 'Lun–Sáb: 8:00 AM – 7:00 PM',
    logo: 'assets/img/logo-apmotors.png',
    heroImage: 'assets/img/promo-descuento-20.jpg',
    discountPercent: 20,
    noticeBar: '🔥 ¡Gran inauguración! 20% OFF en servicios seleccionados y kits LED para tu moto.',
  },

  brands: [
    {
      id: 'brand_ronco',
      name: 'RONCO',
      tag: 'Chacarera / Offroad',
      color: '#dc2626',
      emoji: '🏍️',
      desc: 'Reconocida en todo el Perú por su asombrosa durabilidad de chasis y motor en todo terreno, chacras y zonas difíciles. Repuestos súper accesibles.',
      active: true,
      orderIndex: 1
    },
    {
      id: 'brand_nexus',
      name: 'NEXUS',
      tag: 'Scooter / Urbana',
      color: '#0891b2',
      emoji: '🛵',
      desc: 'Especialistas en scooters urbanos de transmisión automática y motocicletas extremadamente livianas. Ideales para mensajería, reparto y entrega rápida.',
      active: true,
      orderIndex: 2
    },
    {
      id: 'brand_sumo',
      name: 'SUMO',
      tag: 'Mototaxi / Carguero',
      color: '#ca8a04',
      emoji: '🛺',
      desc: 'Diseñada específicamente para pequeños negocios y flotas de carga utilitaria. Excelente relación peso/potencia para transporte pesado.',
      active: true,
      orderIndex: 3
    },
  ],

  categories: [
    { id: 'cat_motos', name: 'Motos', color: '#ed1c24', icon: '🏍️', active: true, orderIndex: 1 },
    { id: 'cat_repuestos', name: 'Repuestos', color: '#1e4fd8', icon: '⚙️', active: true, orderIndex: 2 },
    { id: 'cat_tuning', name: 'Tuning LED', color: '#ffd400', icon: '💡', active: true, orderIndex: 3 },
    { id: 'cat_proteccion', name: 'Protección', color: '#16a34a', icon: '🪖', active: true, orderIndex: 4 },
  ],

  products: [
    {
      id: 'prod_ronco_explorer',
      name: 'Ronco Explorer 200cc',
      categoryId: 'cat_motos',
      brandId: 'brand_ronco',
      emoji: '🏍️',
      image: '',
      desc: 'La moto perfecta para caminos exigentes, chacras, arena y el trabajo diario en la geografía del sur. Motor robusto y repuestos súper económicos.',
      priceBefore: 6200,
      priceAfter: 5900,
      specs: ['200cc', 'Todo terreno', 'Carga pesada', 'Enfriado por aire'],
      isPromo: true,
      promoLabel: 'OFERTA CAMPAÑA',
      scheduleAt: '',
      active: true,
      consult: false,
      stockStatus: 'in_stock',
      orderIndex: 1
    },
    {
      id: 'prod_nexus_scooter',
      name: 'Nexus Scooter 125cc',
      categoryId: 'cat_motos',
      brandId: 'brand_nexus',
      emoji: '🛵',
      image: '',
      desc: 'Scooter automático ideal para movilizarte rápido por la ciudad o maximizar tus ganancias en el sector delivery. Consumo ultrabajo de combustible.',
      priceBefore: null,
      priceAfter: 4800,
      specs: ['125cc', 'Automático', 'Económico', 'Cargador USB'],
      isPromo: false,
      promoLabel: 'Stock disponible',
      scheduleAt: '',
      active: true,
      consult: false,
      stockStatus: 'in_stock',
      orderIndex: 2
    },
    {
      id: 'prod_sumo_cargo',
      name: 'Sumo Utilitaria de Carga 150cc',
      categoryId: 'cat_motos',
      brandId: 'brand_sumo',
      emoji: '🛺',
      image: '',
      desc: 'Vehículo de entrada confiable y de bajo costo. Ideal para armar flotas de entrega o comprar tu primera herramienta de trabajo.',
      priceBefore: null,
      priceAfter: null,
      specs: ['150cc', 'Carguero', 'Suspensión Reforzada'],
      isPromo: false,
      promoLabel: 'Consultar precio',
      scheduleAt: '',
      active: true,
      consult: true,
      stockStatus: 'on_demand',
      orderIndex: 3
    },
    {
      id: 'prod_kit_transmision',
      name: 'Kit de Transmisión Cadena Reforzada',
      categoryId: 'cat_repuestos',
      brandId: 'brand_ronco',
      emoji: '⛓️',
      image: '',
      desc: 'Kit de catalina, piñón y cadena reforzada ideal para motos Ronco y Nexus. Mayor resistencia a la fricción de caminos pedregosos.',
      priceBefore: 150,
      priceAfter: 120,
      specs: ['Acero templado', 'Reforzada', 'Instalación gratis'],
      isPromo: true,
      promoLabel: '20% OFF',
      scheduleAt: '',
      active: true,
      consult: false,
      stockStatus: 'in_stock',
      orderIndex: 4
    },
    {
      id: 'prod_faro_led',
      name: 'Faro LED Tuning Premium',
      categoryId: 'cat_tuning',
      brandId: '',
      emoji: '💡',
      image: '',
      desc: 'Kit de iluminación avanzada con faro principal y exploradoras bicolores de alta potencia. Visibilidad superior en carreteras oscuras.',
      priceBefore: 110,
      priceAfter: 85,
      specs: ['LED alta potencia', 'Bicolor ámbar/blanco', 'Bajo consumo'],
      isPromo: false,
      promoLabel: 'Instalación gratis',
      scheduleAt: '',
      active: true,
      consult: false,
      stockStatus: 'in_stock',
      orderIndex: 5
    },
    {
      id: 'prod_casco_dot',
      name: 'Casco de Seguridad Certificado DOT',
      categoryId: 'cat_proteccion',
      brandId: '',
      emoji: '🪖',
      image: '',
      desc: 'Casco de seguridad con carcasa de policarbonato de alta densidad y certificación DOT internacional. Visor antirrayaduras integrado.',
      priceBefore: 105,
      priceAfter: 85,
      specs: ['Certificación DOT', 'Policarbonato', 'Interior lavable'],
      isPromo: false,
      promoLabel: 'Seguridad',
      scheduleAt: '',
      active: true,
      consult: false,
      stockStatus: 'in_stock',
      orderIndex: 6
    },
  ],

  services: [
    {
      id: 'serv_mantenimiento',
      name: 'Mantenimiento Preventivo Básico',
      icon: '🛠️',
      price: 36,
      desc: 'Cambio de aceite, ajuste y lubricación de cadena, calibración de frenos.',
      featured: false,
      active: true,
      orderIndex: 1
    },
    {
      id: 'serv_afinamiento',
      name: 'Afinamiento Completo',
      icon: '🔧',
      price: 120,
      desc: 'Limpieza de carburador/inyector, calibración de válvulas y bujía nueva.',
      featured: true,
      active: true,
      orderIndex: 2
    },
    {
      id: 'serv_diagnostico',
      name: 'Diagnóstico del Sistema Eléctrico & Batería',
      icon: '⚡',
      price: 45,
      desc: 'Detección computarizada de fallas eléctricas, regulador de voltaje y compresión.',
      featured: false,
      active: true,
      orderIndex: 3
    },
    {
      id: 'serv_motor',
      name: 'Reparación Integral de Motor / Embrague',
      icon: '⚙️',
      price: 150,
      desc: 'Desmontaje técnico, cambio de discos de embrague, rectificado y asentado.',
      featured: false,
      active: true,
      orderIndex: 4
    },
    {
      id: 'serv_led',
      name: 'Instalación Kit Iluminación LED & Faros Auxiliares',
      icon: '💡',
      price: 85,
      desc: 'Instalación con relé y switch independiente para proteger tu sistema eléctrico.',
      featured: false,
      active: true,
      orderIndex: 5
    },
  ],

  tuning: [
    {
      id: 'tune_faro',
      name: 'Faro LED Tuning Principal',
      icon: '💡',
      desc: 'Iluminación hiper blanca y lupa central de largo alcance para noche.',
      benefit: 'Instalación eléctrica profesional incluida',
      active: true,
      orderIndex: 1
    },
    {
      id: 'tune_exploradoras',
      name: 'Faros Exploradores Duales Bicolor',
      icon: '🔦',
      desc: 'Luz amarilla penetrante para neblina y blanca para ruta abierta.',
      benefit: 'Consumo ultra eficiente y relé térmico',
      active: true,
      orderIndex: 2
    },
    {
      id: 'tune_protect',
      name: 'Protectores Metálicos Anticaídas (Sliders)',
      icon: '🛡️',
      desc: 'Estructura tubular con topes de nylon para proteger chasis y piernas.',
      benefit: 'Acero templado soldado con microalambre',
      active: true,
      orderIndex: 3
    },
  ],

  promotions: [
    {
      id: 'promo_20off',
      title: '20% de descuento en inauguración',
      badgeLabel: 'Campaña Especial',
      badgeColor: '#ed1c24',
      desc: 'En diversos productos y servicios: afinamientos, repuestos seleccionados y kits de luces LED.',
      image: 'assets/img/promo-descuento-20.jpg',
      ctaText: 'Quiero el 20% OFF',
      ctaMessage: 'Hola AP Motors, quiero aprovechar el 20% de descuento de la campaña',
      active: true,
      scheduleAt: '',
      orderIndex: 1
    },
    {
      id: 'promo_sorteo',
      title: 'Gana una moto nueva 125cc',
      badgeLabel: 'Gran Sorteo',
      badgeColor: '#ffd400',
      desc: 'Por compras desde S/ 50 en tienda o taller recibes un cupón para el sorteo presencial.',
      image: 'assets/img/promo-sorteo-moto.jpg',
      ctaText: '¡Quiero participar!',
      ctaMessage: 'Hola AP Motors, quiero información sobre cómo participar en el sorteo de la moto',
      active: true,
      scheduleAt: '',
      orderIndex: 2
    },
    {
      id: 'promo_financiamiento',
      title: 'Motos al contado o al crédito fácil',
      badgeLabel: 'Financiamiento',
      badgeColor: '#1e4fd8',
      desc: 'Llévate tu Ronco, Nexus o Sumo con cuotas accesibles, mínima cuota inicial y entrega en 24 horas.',
      image: 'assets/img/promo-motos-financiamiento.jpg',
      ctaText: 'Solicitar Crédito',
      ctaMessage: 'Hola AP Motors, deseo evaluar mi crédito para adquirir una motocicleta',
      active: true,
      scheduleAt: '',
      orderIndex: 3
    },
  ],

  branches: [
    {
      id: 'branch_bellaunion',
      name: 'Sede Principal — Bella Unión',
      address: 'Av. Francisco Flores S/N',
      reference: 'Frente a agua Don Felipe (Bella Unión, Caravelí, Arequipa)',
      hours: 'Lun–Sáb: 8:00 AM – 7:00 PM',
      phone: '51987654321',
      lat: '-15.4520',
      lng: '-74.6540',
      isMain: true,
      active: true,
      orderIndex: 1
    },
    {
      id: 'branch_acari',
      name: 'Sede Alterna — Acarí',
      address: 'Av. Enrique Brilka Mz. 62 Lote 5B',
      reference: 'Al costado de la cevichería "Mar de Catalina" (Acarí, Arequipa)',
      hours: 'Lun–Sáb: 8:00 AM – 7:00 PM',
      phone: '51912345678',
      lat: '-15.4310',
      lng: '-74.6150',
      isMain: false,
      active: true,
      orderIndex: 2
    },
  ],
};

/* ---------- Utilidades internas ---------- */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function deepMerge(defaults, loaded) {
  const out = clone(defaults);
  if (!loaded || typeof loaded !== 'object') return out;
  for (const key of Object.keys(defaults)) {
    if (loaded[key] != null) {
      if (Array.isArray(defaults[key]) && Array.isArray(loaded[key])) {
        out[key] = loaded[key];
      } else if (typeof defaults[key] === 'object' && typeof loaded[key] === 'object' && !Array.isArray(defaults[key])) {
        out[key] = { ...defaults[key], ...loaded[key] };
      } else {
        out[key] = loaded[key];
      }
    }
  }
  return out;
}

function sanitizeForFirestore(obj) {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)).filter(x => x !== undefined);
  }
  if (typeof obj === 'object') {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) {
        clean[key] = null;
      } else {
        clean[key] = sanitizeForFirestore(value);
      }
    }
    return clean;
  }
  return obj;
}

/* ============================================================
   STORE: CAPA CENTRALIZADA DE DATOS
   ============================================================ */
const Store = {
  data: clone(DEFAULT_DATA),
  usingFirestore: false,
  isInitialized: false,
  unsubscribers: [],
  listeners: new Set(),

  /* ---- Suscripción a cambios reactivos ---- */
  onUpdate(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },

  notify() {
    this.saveLocal();
    for (const fn of this.listeners) {
      try {
        fn(this.data);
      } catch (err) {
        console.error('Error en listener de Store:', err);
      }
    }
  },

  /* ---- Inicialización ---- */
  async init(options = {}) {
    const { seedIfEmpty = false, liveSync = true } = options;

    // 1. Cargar desde almacenamiento local inmediatamente (render instantáneo)
    const local = this.loadLocal();
    if (local) {
      this.data = deepMerge(DEFAULT_DATA, local);
    }

    const fb = window.FB;
    if (!fb || !fb.db) {
      this.isInitialized = true;
      return;
    }

    try {
      this.usingFirestore = true;

      // 2. Comprobar si hay que migrar datos del formato legado
      await this.checkAndMigrateLegacy(fb.db);

      // 3. Cargar colecciones o sembrar si está vacío
      const hasData = await this.loadFromFirestore(fb.db);
      if (!hasData && seedIfEmpty) {
        await this.seedFirestore(fb.db);
      }

      // 4. Activar escuchas en tiempo real (onSnapshot) si está solicitado
      if (liveSync) {
        this.setupRealtimeListeners(fb.db);
      }

      this.saveLocal();
    } catch (e) {
      console.warn('Advertencia en conexión a Firestore; operando con respaldo local.', e);
    } finally {
      this.isInitialized = true;
    }
  },

  /* ---- Carga inicial desde Firestore ---- */
  async loadFromFirestore(db) {
    let anyFound = false;

    // Cargar ajustes generales
    try {
      const setSnap = await db.collection('settings').doc('general').get();
      if (setSnap.exists) {
        this.data.settings = { ...DEFAULT_DATA.settings, ...setSnap.data() };
        anyFound = true;
      }
    } catch (e) {
      console.warn('Error leyendo settings/general:', e);
    }

    // Cargar cada colección
    for (const col of COLLECTIONS) {
      try {
        const snap = await db.collection(col).get();
        if (!snap.empty) {
          anyFound = true;
          this.data[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (e) {
        console.warn(`Error leyendo colección ${col}:`, e);
      }
    }

    return anyFound;
  },

  /* ---- Sincronización en tiempo real ---- */
  setupRealtimeListeners(db) {
    // Limpiar anteriores si existieran
    this.cleanupListeners();

    // Listener para settings
    const unsubSet = db.collection('settings').doc('general').onSnapshot(snap => {
      if (snap.exists) {
        this.data.settings = { ...DEFAULT_DATA.settings, ...snap.data() };
        this.notify();
      }
    }, err => console.warn('Realtime settings error:', err));
    this.unsubscribers.push(unsubSet);

    // Listener para cada colección
    for (const col of COLLECTIONS) {
      const unsubCol = db.collection(col).onSnapshot(snap => {
        if (!snap.empty) {
          const list = [];
          snap.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() });
          });
          // Ordenar por orderIndex si existe
          list.sort((a, b) => (a.orderIndex || 999) - (b.orderIndex || 999));
          this.data[col] = list;
          this.notify();
        } else if (snap.metadata.hasPendingWrites) {
          this.notify();
        }
      }, err => console.warn(`Realtime error on ${col}:`, err));
      this.unsubscribers.push(unsubCol);
    }
  },

  cleanupListeners() {
    for (const unsub of this.unsubscribers) {
      try { unsub(); } catch (e) { /* ignore */ }
    }
    this.unsubscribers = [];
  },

  /* ---- Migración automática desde documento legado data/main ---- */
  async checkAndMigrateLegacy(db) {
    try {
      const legacySnap = await db.collection(LEGACY_DOC_PATH.collection).doc(LEGACY_DOC_PATH.doc).get();
      if (!legacySnap.exists) return;

      const legacyData = legacySnap.data();
      if (!legacyData || typeof legacyData !== 'object') return;

      // Verificar si ya hay productos en la nueva colección
      const prodCheck = await db.collection('products').limit(1).get();
      if (!prodCheck.empty) return; // Ya está migrado

      console.info('Migrando datos legados de data/main a colecciones individuales...');

      const batch = db.batch();

      if (legacyData.settings) {
        const setRef = db.collection('settings').doc('general');
        batch.set(setRef, { ...DEFAULT_DATA.settings, ...legacyData.settings, updatedAt: new Date().toISOString() });
      }

      for (const col of COLLECTIONS) {
        const list = Array.isArray(legacyData[col]) ? legacyData[col] : [];
        list.forEach((item, index) => {
          const id = item.id || generateId(col.slice(0, 4));
          const ref = db.collection(col).doc(id);
          batch.set(ref, {
            ...item,
            id,
            orderIndex: item.orderIndex || index + 1,
            updatedAt: new Date().toISOString()
          });
        });
      }

      await batch.commit();
      console.info('Migración completada con éxito.');
    } catch (e) {
      console.warn('No se pudo verificar/migrar datos legados:', e);
    }
  },

  /* ---- Sembrar Firestore con datos por defecto ---- */
  async seedFirestore(db) {
    try {
      const batch = db.batch();

      // Settings
      const setRef = db.collection('settings').doc('general');
      batch.set(setRef, { ...DEFAULT_DATA.settings, updatedAt: new Date().toISOString() });

      // Colecciones
      for (const col of COLLECTIONS) {
        const items = DEFAULT_DATA[col] || [];
        items.forEach((item, index) => {
          const id = item.id || generateId(col.slice(0, 4));
          const docRef = db.collection(col).doc(id);
          batch.set(docRef, {
            ...item,
            id,
            orderIndex: item.orderIndex || index + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        });
      }

      await batch.commit();
      this.data = clone(DEFAULT_DATA);
    } catch (e) {
      console.error('Error al sembrar datos en Firestore:', e);
    }
  },

  /* ---- Almacenamiento Local (Fallback & Cache) ---- */
  loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
      // Migración desde v1
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw);
        localStorage.setItem(STORAGE_KEY, legacyRaw);
        return parsed;
      }
    } catch (e) {
      console.warn('Error leyendo localStorage:', e);
    }
    return null;
  },

  saveLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Error guardando en localStorage:', e);
    }
  },

  /* ---- Consultas y Lectura Síncrona ---- */
  list(collection) {
    const arr = this.data[collection] || [];
    return [...arr].sort((a, b) => (a.orderIndex || 999) - (b.orderIndex || 999));
  },

  get(collection, id) {
    return (this.data[collection] || []).find(i => i.id === id);
  },

  uid(prefix) {
    return generateId(prefix);
  },

  isVisible(item) {
    if (!item) return false;
    if (item.active === false) return false;
    if (!item.scheduleAt) return true;
    return new Date(item.scheduleAt).getTime() <= Date.now();
  },

  waLink(text, phone) {
    const num = phone || this.data.settings.phone1 || '51987654321';
    return `https://wa.me/${num.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
  },

  mapsEmbed(branch) {
    if (!branch) return '';
    const q = (branch.lat && branch.lng) ? `${branch.lat},${branch.lng}` : `${branch.address}, ${branch.reference || ''}`;
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`;
  },

  mapsLink(branch) {
    if (!branch) return '#';
    const q = (branch.lat && branch.lng) ? `${branch.lat},${branch.lng}` : `${branch.address}, ${branch.reference || ''}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  },

  /* ---- Operaciones de Escritura Asíncronas (CRUD) ---- */
  async add(collection, item) {
    const id = item.id || generateId(collection.slice(0, 4));
    const now = new Date().toISOString();
    const orderIndex = item.orderIndex || (this.data[collection]?.length || 0) + 1;
    const record = sanitizeForFirestore({ ...item, id, orderIndex, createdAt: now, updatedAt: now });

    // 1. Actualización optimista local (siempre disponible de inmediato)
    const list = this.data[collection] || (this.data[collection] = []);
    const existingIdx = list.findIndex(i => i.id === id);
    if (existingIdx >= 0) {
      list[existingIdx] = record;
    } else {
      list.push(record);
    }
    this.saveLocal();

    // 2. Persistencia en Firestore
    const fb = window.FB;
    if (this.usingFirestore && fb && fb.db) {
      try {
        if (fb.auth && fb.auth.currentUser) {
          try { await fb.auth.currentUser.getIdToken(true); } catch (tErr) {}
        }
        await fb.db.collection(collection).doc(id).set(record);
      } catch (e) {
        console.error(`Error al guardar en Firestore (${collection}/${id}):`, e);
        throw e;
      }
    }

    this.notify();
    return record;
  },

  async update(collection, id, patch) {
    const now = new Date().toISOString();
    const list = this.data[collection] || [];
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return null;

    const updated = sanitizeForFirestore({ ...list[idx], ...patch, id, updatedAt: now });
    list[idx] = updated;
    this.saveLocal();

    const fb = window.FB;
    if (this.usingFirestore && fb && fb.db) {
      try {
        if (fb.auth && fb.auth.currentUser) {
          try { await fb.auth.currentUser.getIdToken(true); } catch (tErr) {}
        }
        await fb.db.collection(collection).doc(id).set(updated, { merge: true });
      } catch (e) {
        console.error(`Error al actualizar en Firestore (${collection}/${id}):`, e);
        throw e;
      }
    }

    this.notify();
    return updated;
  },

  async remove(collection, id) {
    this.data[collection] = (this.data[collection] || []).filter(i => i.id !== id);
    this.saveLocal();

    const fb = window.FB;
    if (this.usingFirestore && fb && fb.db) {
      try {
        if (fb.auth && fb.auth.currentUser) {
          try { await fb.auth.currentUser.getIdToken(true); } catch (tErr) {}
        }
        await fb.db.collection(collection).doc(id).delete();
      } catch (e) {
        console.error(`Error al eliminar de Firestore (${collection}/${id}):`, e);
        throw e;
      }
    }

    this.notify();
  },

  async updateSettings(patch) {
    const now = new Date().toISOString();
    this.data.settings = sanitizeForFirestore({ ...this.data.settings, ...patch, updatedAt: now });
    this.saveLocal();

    const fb = window.FB;
    if (this.usingFirestore && fb && fb.db) {
      try {
        if (fb.auth && fb.auth.currentUser) {
          try { await fb.auth.currentUser.getIdToken(true); } catch (tErr) {}
        }
        await fb.db.collection('settings').doc('general').set(this.data.settings, { merge: true });
      } catch (e) {
        console.error('Error al actualizar settings en Firestore:', e);
        throw e;
      }
    }

    this.notify();
    return this.data.settings;
  },

  async reset() {
    this.data = clone(DEFAULT_DATA);
    this.saveLocal();

    const fb = window.FB;
    if (this.usingFirestore && fb && fb.db) {
      try {
        await this.seedFirestore(fb.db);
      } catch (e) {
        console.error('Error al resetear Firestore:', e);
      }
    }

    this.notify();
  },

  /* Registro opcional de cotizaciones generadas para auditoría */
  async logQuote(quoteData) {
    const fb = window.FB;
    if (this.usingFirestore && fb && fb.db) {
      try {
        const id = generateId('quot');
        await fb.db.collection('quotes').doc(id).set({
          ...quoteData,
          id,
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        /* Silencioso para no frenar la experiencia del usuario */
        console.debug('Quote log skipped:', e);
      }
    }
  }
};

/* Formato de moneda estándar (Soles peruanos) */
function fmtSoles(n) {
  if (n == null || isNaN(n)) return '';
  return 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
