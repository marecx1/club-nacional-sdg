/**
 * Club Manager Pro PY - Motor de Persistencia con Firebase Firestore
 * Patrón Offline-First: LocalStorage como caché local + Firestore como nube real.
 * Si Firebase no está disponible, opera en Modo Simulador Local con LocalStorage.
 */

// ---------------------------------------------------------------------------
// Polyfill de seguridad para LocalStorage / SessionStorage
// Evita caídas por bloqueos de cookies en modo incógnito o Safari estricto
// ---------------------------------------------------------------------------
(function() {
  function createMemoryStorage() {
    let store = {};
    return {
      getItem(key)        { return store[key] !== undefined ? store[key] : null; },
      setItem(key, value) { store[key] = String(value); },
      removeItem(key)     { delete store[key]; },
      clear()             { store = {}; },
      key(index)          { return Object.keys(store)[index] || null; },
      get length()        { return Object.keys(store).length; }
    };
  }

  try {
    const t = "__storage_test__";
    window.localStorage.setItem(t, t);
    window.localStorage.removeItem(t);
  } catch (e) {
    console.warn("LocalStorage bloqueado. Usando almacenamiento en memoria temporaria.");
    Object.defineProperty(window, "localStorage", { value: createMemoryStorage(), writable: true, configurable: true });
  }

  try {
    const t = "__storage_test__";
    window.sessionStorage.setItem(t, t);
    window.sessionStorage.removeItem(t);
  } catch (e) {
    console.warn("SessionStorage bloqueado. Usando almacenamiento en memoria temporaria.");
    Object.defineProperty(window, "sessionStorage", { value: createMemoryStorage(), writable: true, configurable: true });
  }
})();

// ---------------------------------------------------------------------------
// Referencias globales a Firebase (inicializadas en index.html antes de este script)
// ---------------------------------------------------------------------------
const DB_KEY_PREFIX = "club_nacional_sdg_";

// Referencia a Firestore y Auth (ya inicializados globalmente en index.html)
const fbDB   = window.fbDB   || null;
const fbAuth = window.fbAuth || null;

if (fbDB) {
  console.log("Firestore conectado correctamente.");
} else {
  console.warn("Firestore no disponible. Operando en Modo Local (LocalStorage).");
}

// ---------------------------------------------------------------------------
// Motor DB: LocalStorage (caché) + Firestore (nube)
// ---------------------------------------------------------------------------
const DB = {

  /**
   * Leer dato desde LocalStorage (sincrónico, para la UI inmediata)
   */
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(DB_KEY_PREFIX + key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) {
      console.error(`Error al leer "${key}" de LocalStorage`, e);
      return defaultValue;
    }
  },

  /**
   * Guardar dato en LocalStorage y sincronizar con Firestore en segundo plano
   */
  save(key, data) {
    try {
      localStorage.setItem(DB_KEY_PREFIX + key, JSON.stringify(data));
      // Sincronización optimista en segundo plano
      if (fbDB) {
        this._syncToFirestore(key, data);
      }
      return true;
    } catch (e) {
      console.error(`Error al guardar "${key}" en LocalStorage`, e);
      return false;
    }
  },

  /**
   * Limpiar caché local y reiniciar datos semilla
   */
  reset() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(DB_KEY_PREFIX)) localStorage.removeItem(key);
    });
    this.init(true);
  },

  /**
   * Inicializar datos semilla o cargar caché existente
   */
  init(force = false) {
    if (!force && this.get("initialized")) {
      // Actualizar usuarios del sistema si cambiaron
      const currentUsers = this.get("usuarios", []);
      let updated = false;
      const targetUsers = [
        { usuario: "admin",       nombre: "Jonas Mareco", rol: "Administrador", clave: "admin123",  email: "jonasmareco28@gmail.com" },
        { usuario: "tesorero",    nombre: "Fredy",        rol: "Tesorero",      clave: "teso123",   email: "tesorero@clubnacional.org.py" },
        { usuario: "secretario",  nombre: "Lucas",        rol: "Secretario",    clave: "secre123",  email: "secretario@clubnacional.org.py" },
        { usuario: "consulta",    nombre: "Hugo Pitta",   rol: "Consulta",      clave: "con123",    email: "consulta@clubnacional.org.py" }
      ];
      targetUsers.forEach(target => {
        const existing = currentUsers.find(u => u.usuario === target.usuario);
        if (!existing) {
          currentUsers.push(target);
          updated = true;
        } else if (
          existing.nombre !== target.nombre || existing.email !== target.email ||
          existing.clave  !== target.clave  || existing.rol   !== target.rol
        ) {
          Object.assign(existing, target);
          updated = true;
        }
      });
      if (updated) {
        this.save("usuarios", currentUsers);
        console.log("Usuarios del sistema actualizados en LocalStorage.");
      }

      // Descargar datos de Firestore al cargar la sesión
      if (fbDB) this.syncFromFirestore();
      return;
    }

    // -----------------------------------------------------------------------
    // DATOS SEMILLA
    // -----------------------------------------------------------------------
    const usuarios = [
      { usuario: "admin",       nombre: "Jonas Mareco", rol: "Administrador", clave: "admin123",  email: "jonasmareco28@gmail.com" },
      { usuario: "tesorero",    nombre: "Fredy",        rol: "Tesorero",      clave: "teso123",   email: "tesorero@clubnacional.org.py" },
      { usuario: "secretario",  nombre: "Lucas",        rol: "Secretario",    clave: "secre123",  email: "secretario@clubnacional.org.py" },
      { usuario: "consulta",    nombre: "Hugo Pitta",   rol: "Consulta",      clave: "con123",    email: "consulta@clubnacional.org.py" }
    ];

    const socios = [
      { id: 1, nroSocio: "CNSDG-1001", nombre: "Ramón Alejandro González",  ci: "3.456.789", telefono: "0981 123 456", email: "ramon.gonzalez@gmail.com",   categoria: "Titular",  estado: "Activo",  fechaIngreso: "2024-01-15", fechaVencimiento: "2026-06-10", foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150" },
      { id: 2, nroSocio: "CNSDG-1002", nombre: "Sofía Montserrat Recalde",  ci: "4.890.123", telefono: "0971 789 012", email: "sofia.recalde@outlook.com",  categoria: "Familiar", estado: "Activo",  fechaIngreso: "2024-03-20", fechaVencimiento: "2026-06-15", foto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" },
      { id: 3, nroSocio: "CNSDG-1003", nombre: "Nelson Haedo Benítez",      ci: "2.345.678", telefono: "0982 456 789", email: "nelson.haedo@hotmail.com",   categoria: "Vitalicio",estado: "Activo",  fechaIngreso: "2015-05-10", fechaVencimiento: "2030-12-31", foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150" },
      { id: 4, nroSocio: "CNSDG-1004", nombre: "Fátima Belén Espínola",     ci: "5.112.334", telefono: "0994 321 654", email: "fatima.espinola@gmail.com",  categoria: "Juvenil",  estado: "Moroso", fechaIngreso: "2025-02-10", fechaVencimiento: "2026-04-10", foto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150" }
    ];

    const ingresos = [
      { id: 1, fecha: "2026-05-01T09:30:00", socioId: 1, concepto: "Cuota Social - Mayo 2026", monto: 150000, metodoPago: "Transferencia", usuario: "tesorero",   categoria: "cuotas",         ruc: "3.456.789" },
      { id: 2, fecha: "2026-05-02T16:15:00", socioId: 2, concepto: "Cuota Social - Mayo 2026", monto: 100000, metodoPago: "QR",           usuario: "tesorero",   categoria: "cuotas",         ruc: "4.890.123" },
      { id: 3, fecha: "2026-05-03T18:00:00", socioId: null, concepto: "Alquiler Cancha Pádel 1", monto: 120000, metodoPago: "Efectivo",   usuario: "secretario", categoria: "alquiler_canchas", ruc: "80054321-1" }
    ];

    const egresos = [
      { id: 1, fecha: "2026-05-02T11:00:00", concepto: "Pago de Arbitraje - Torneo Apertura", categoria: "arbitraje",    monto: 300000, comprobante: "Recibo_Arbitraje_05.pdf",  usuario: "tesorero" },
      { id: 2, fecha: "2026-05-05T15:30:00", concepto: "Reparación de Reflector Cancha 2",   categoria: "mantenimiento", monto: 450000, comprobante: "Factura_Electro_22.png",   usuario: "admin" }
    ];

    const caja = {
      abierta: false, fechaApertura: null, montoInicial: 0, transacciones: [],
      historial: [
        { id: 1, fechaApertura: "2026-05-20T08:00:00", fechaCierre: "2026-05-20T18:00:00", montoInicial: 500000,  ingresos: 800000, egresos: 0,       montoFinal: 1300000, usuario: "tesorero" },
        { id: 2, fechaApertura: "2026-05-21T08:00:00", fechaCierre: "2026-05-21T18:00:00", montoInicial: 1300000, ingresos: 0,      egresos: 0,       montoFinal: 1300000, usuario: "tesorero" },
        { id: 3, fechaApertura: "2026-05-22T08:00:00", fechaCierre: "2026-05-22T18:00:00", montoInicial: 1300000, ingresos: 0,      egresos: 1200000, montoFinal: 100000,  usuario: "tesorero" }
      ]
    };

    const clientesSeed = [
      { id: 1, nombre: "Distribuidora El Sol S.A.", ruc: "80011122-3", telefono: "0981 999 888", email: "contacto@elsol.com.py" },
      { id: 2, nombre: "Supermercado Los Cedros",   ruc: "80077733-4", telefono: "0972 111 222", email: "administracion@loscedros.com.py" }
    ];

    const auditoriaSeed = [
      { id: 1, fecha: new Date().toISOString(), usuario: "admin", rol: "Administrador", accion: "INICIALIZAR_SISTEMA", detalle: "Sistema y base de datos inicializada con Firebase." }
    ];

    this.save("usuarios",   usuarios);
    this.save("socios",     socios);
    this.save("ingresos",   ingresos);
    this.save("egresos",    egresos);
    this.save("caja",       caja);
    this.save("clientes",   clientesSeed);
    this.save("auditoria",  auditoriaSeed);
    this.save("initialized", true);
    console.log("Caché local inicializada con datos semilla.");
  },

  /**
   * Registrar movimiento de auditoría
   */
  logAuditoria(accion, detalle) {
    const auditoria = this.get("auditoria", []);
    const currentUser = (() => {
      try { return JSON.parse(sessionStorage.getItem("club_manager_user")) || { usuario: "anonimo", rol: "Consulta" }; }
      catch { return { usuario: "anonimo", rol: "Consulta" }; }
    })();

    const newLog = {
      id: auditoria.length > 0 ? Math.max(...auditoria.map(l => l.id)) + 1 : 1,
      fecha: new Date().toISOString(),
      usuario: currentUser.usuario,
      rol: currentUser.rol,
      accion,
      detalle
    };

    auditoria.unshift(newLog);
    this.save("auditoria", auditoria);

    // Guardar en Firestore también
    if (fbDB) {
      fbDB.collection("auditoria").add({
        fecha:   newLog.fecha,
        usuario: newLog.usuario,
        rol:     newLog.rol,
        accion:  newLog.accion,
        detalle: newLog.detalle
      }).catch(err => console.error("Error al guardar auditoría en Firestore:", err));
    }
  },

  // ---------------------------------------------------------------------------
  // SINCRONIZACIÓN: LOCAL → FIRESTORE (escritura en segundo plano)
  // ---------------------------------------------------------------------------
  async _syncToFirestore(key, data) {
    if (!fbDB) return;
    try {
      if (["socios", "ingresos", "egresos", "clientes"].includes(key)) {
        // Para arrays: subimos cada documento con su id como clave
        const batch = fbDB.batch();
        (Array.isArray(data) ? data : []).forEach(item => {
          const ref = fbDB.collection(key).doc(String(item.id));
          batch.set(ref, item, { merge: true });
        });
        await batch.commit();
      } else if (key === "caja") {
        await fbDB.collection("caja").doc("estado").set(data, { merge: true });
      }
    } catch (err) {
      console.warn(`No se pudo sincronizar "${key}" con Firestore:`, err.message);
    }
  },

  // ---------------------------------------------------------------------------
  // SINCRONIZACIÓN: FIRESTORE → LOCAL (descarga al iniciar sesión)
  // ---------------------------------------------------------------------------
  async syncFromFirestore() {
    if (!fbDB) return;
    console.log("Descargando datos de Firestore...");
    try {
      const colecciones = ["socios", "ingresos", "egresos", "clientes"];
      for (const col of colecciones) {
        const snap = await fbDB.collection(col).get();
        if (!snap.empty) {
          const data = snap.docs.map(d => d.data());
          localStorage.setItem(DB_KEY_PREFIX + col, JSON.stringify(data));
        }
      }

      // Caja
      const cajaDoc = await fbDB.collection("caja").doc("estado").get();
      if (cajaDoc.exists) {
        localStorage.setItem(DB_KEY_PREFIX + "caja", JSON.stringify(cajaDoc.data()));
      }

      // Auditoría (últimos 100 registros)
      const audSnap = await fbDB.collection("auditoria").orderBy("fecha", "desc").limit(100).get();
      if (!audSnap.empty) {
        const audData = audSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        localStorage.setItem(DB_KEY_PREFIX + "auditoria", JSON.stringify(audData));
      }

      console.log("¡Sincronización desde Firestore completada!");

      // Refrescar vista actual en la SPA
      if (window.App && typeof App.renderViewData === "function") {
        App.renderViewData(App.currentView);
      }
    } catch (err) {
      console.warn("No se pudo descargar datos de Firestore (usando caché local):", err.message);
    }
  }
};

// Autoejecutar inicialización al cargar el script
DB.init();
