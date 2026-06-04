/**
 * Club Manager Pro PY - Motor de Persistencia y Sincronización Contable
 * Implementación de Patrón Offline-First / Caché Optimista con Supabase y LocalStorage.
 * Si las credenciales de Supabase no están configuradas, opera en Modo Simulador Local.
 */

// Credenciales globales de Supabase (se leen de las variables globales del navegador)
const SUPABASE_URL = window.SUPABASE_URL || "";
const SUPABASE_KEY = window.SUPABASE_KEY || "";
const DB_KEY_PREFIX = "club_nacional_sdg_";

let supabase = null;

// Inicialización segura del cliente de Supabase CDN
if (SUPABASE_URL && SUPABASE_KEY && window.supabase) {
  try {
    const tempSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    if (tempSupabase && tempSupabase.auth) {
      supabase = tempSupabase;
      console.log("Supabase inicializado correctamente.");
    } else {
      console.warn("Cliente de Supabase instanciado pero 'auth' no está definido.");
    }
  } catch (e) {
    console.error("Error al instanciar cliente de Supabase:", e);
  }
}

const DB = {
  /**
   * Obtener datos de la caché local (Sincrónico)
   */
  get(key, defaultValue = null) {
    const data = localStorage.getItem(DB_KEY_PREFIX + key);
    try {
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Error al leer la clave ${key} de LocalStorage`, e);
      return defaultValue;
    }
  },

  /**
   * Guardar datos en caché local y sincronizar con la nube en segundo plano
   */
  save(key, data) {
    try {
      localStorage.setItem(DB_KEY_PREFIX + key, JSON.stringify(data));
      
      // Sincronización asíncrona optimista en segundo plano si Supabase está activo
      if (supabase) {
        this.syncToSupabase(key, data);
      }
      return true;
    } catch (e) {
      console.error(`Error al guardar la clave ${key} en LocalStorage`, e);
      return false;
    }
  },

  /**
   * Limpiar la base de datos local y reiniciar
   */
  reset() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(DB_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    this.init(true);
  },

  /**
   * Inicializar datos semilla o cargar caché local
   */
  init(force = false) {
    if (!force && this.get("initialized")) {
      // Auto-actualizar los usuarios del sistema si cambiaron sus perfiles
      const currentUsers = this.get("usuarios", []);
      let updated = false;

      const targetUsers = [
        { usuario: "admin", nombre: "Jonas Mareco", rol: "Administrador", clave: "admin123", email: "jonasmareco28@gmail.com" },
        { usuario: "tesorero", nombre: "Fredy", rol: "Tesorero", clave: "teso123", email: "tesorero@clubnacional.org.py" },
        { usuario: "secretario", nombre: "Lucas", rol: "Secretario", clave: "secre123", email: "secretario@clubnacional.org.py" },
        { usuario: "consulta", nombre: "Hugo Pitta", rol: "Consulta", clave: "con123", email: "consulta@clubnacional.org.py" }
      ];

      targetUsers.forEach(target => {
        let existing = currentUsers.find(u => u.usuario === target.usuario);
        if (!existing) {
          currentUsers.push(target);
          updated = true;
        } else if (existing.nombre !== target.nombre || existing.email !== target.email || existing.clave !== target.clave || existing.rol !== target.rol) {
          existing.nombre = target.nombre;
          existing.email = target.email;
          existing.clave = target.clave;
          existing.rol = target.rol;
          updated = true;
        }
      });

      if (updated) {
        this.save("usuarios", currentUsers);
        console.log("Usuarios del sistema actualizados en LocalStorage.");
      }

      // Sincronizar desde la nube en segundo plano si está activo
      if (supabase) {
        this.syncFromSupabase();
      }
      return;
    }

    // --- DATOS SEMILLA (REALISTAS DE PARAGUAY / SET) ---
    const usuarios = [
      { usuario: "admin", nombre: "Jonas Mareco", rol: "Administrador", clave: "admin123", email: "jonasmareco28@gmail.com" },
      { usuario: "tesorero", nombre: "Fredy", rol: "Tesorero", clave: "teso123", email: "tesorero@clubnacional.org.py" },
      { usuario: "secretario", nombre: "Lucas", rol: "Secretario", clave: "secre123", email: "secretario@clubnacional.org.py" },
      { usuario: "consulta", nombre: "Hugo Pitta", rol: "Consulta", clave: "con123", email: "consulta@clubnacional.org.py" }
    ];

    const socios = [
      { id: 1, nroSocio: "CNSDG-1001", nombre: "Ramón Alejandro González", ci: "3.456.789", telefono: "0981 123 456", email: "ramon.gonzalez@gmail.com", categoria: "Titular", estado: "Activo", fechaIngreso: "2024-01-15", fechaVencimiento: "2026-06-10", foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150" },
      { id: 2, nroSocio: "CNSDG-1002", nombre: "Sofía Montserrat Recalde", ci: "4.890.123", telefono: "0971 789 012", email: "sofia.recalde@outlook.com", categoria: "Familiar", estado: "Activo", fechaIngreso: "2024-03-20", fechaVencimiento: "2026-06-15", foto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" },
      { id: 3, nroSocio: "CNSDG-1003", nombre: "Nelson Haedo Benítez", ci: "2.345.678", telefono: "0982 456 789", email: "nelson.haedo@hotmail.com", categoria: "Vitalicio", estado: "Activo", fechaIngreso: "2015-05-10", fechaVencimiento: "2030-12-31", foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150" },
      { id: 4, nroSocio: "CNSDG-1004", nombre: "Fátima Belén Espínola", ci: "5.112.334", telefono: "0994 321 654", email: "fatima.espinola@gmail.com", categoria: "Juvenil", estado: "Moroso", fechaIngreso: "2025-02-10", fechaVencimiento: "2026-04-10", foto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150" }
    ];

    const ingresos = [
      { id: 1, fecha: "2026-05-01T09:30:00", socioId: 1, concepto: "Cuota Social - Mayo 2026", monto: 150000, metodoPago: "Transferencia", usuario: "tesorero", categoria: "cuotas", ruc: "3.456.789" },
      { id: 2, fecha: "2026-05-02T16:15:00", socioId: 2, concepto: "Cuota Social - Mayo 2026", monto: 100000, metodoPago: "QR", usuario: "tesorero", categoria: "cuotas", ruc: "4.890.123" },
      { id: 3, fecha: "2026-05-03T18:00:00", socioId: null, concepto: "Alquiler Cancha Pádel 1", monto: 120000, metodoPago: "Efectivo", usuario: "secretario", categoria: "alquiler_canchas", ruc: "80054321-1" }
    ];

    const egresos = [
      { id: 1, fecha: "2026-05-02T11:00:00", concepto: "Pago de Arbitraje - Torneo Apertura", categoria: "arbitraje", monto: 300000, comprobante: "Recibo_Arbitraje_05.pdf", usuario: "tesorero" },
      { id: 2, fecha: "2026-05-05T15:30:00", concepto: "Reparación de Reflector Cancha 2", categoria: "mantenimiento", monto: 450000, comprobante: "Factura_Electro_22.png", usuario: "admin" }
    ];

    const caja = {
      abierta: false,
      fechaApertura: null,
      montoInicial: 0,
      transacciones: [],
      historial: [
        { id: 1, fechaApertura: "2026-05-20T08:00:00", fechaCierre: "2026-05-20T18:00:00", montoInicial: 500000, ingresos: 800000, egresos: 0, montoFinal: 1300000, usuario: "tesorero" },
        { id: 2, fechaApertura: "2026-05-21T08:00:00", fechaCierre: "2026-05-21T18:00:00", montoInicial: 1300000, ingresos: 0, egresos: 0, montoFinal: 1300000, usuario: "tesorero" },
        { id: 3, fechaApertura: "2026-05-22T08:00:00", fechaCierre: "2026-05-22T18:00:00", montoInicial: 1300000, ingresos: 0, egresos: 1200000, montoFinal: 100000, usuario: "tesorero" }
      ]
    };

    const clientesSeed = [
      { id: 1, nombre: "Distribuidora El Sol S.A.", ruc: "80011122-3", telefono: "0981 999 888", email: "contacto@elsol.com.py" },
      { id: 2, nombre: "Supermercado Los Cedros", ruc: "80077733-4", telefono: "0972 111 222", email: "administracion@loscedros.com.py" }
    ];

    const auditoriaSeed = [
      { id: 1, fecha: new Date().toISOString(), usuario: "admin", rol: "Administrador", accion: "INICIALIZAR_SISTEMA", detalle: "Sistema y base de datos inicializada localmente con éxito." }
    ];

    this.save("usuarios", usuarios);
    this.save("socios", socios);
    this.save("ingresos", ingresos);
    this.save("egresos", egresos);
    this.save("caja", caja);
    this.save("clientes", clientesSeed);
    this.save("auditoria", auditoriaSeed);
    this.save("initialized", true);

    console.log("Caché local inicializada con datos semilla.");
  },

  /**
   * Registrar movimiento de auditoría (Auditoría Contable de Acciones)
   */
  logAuditoria(accion, detalle) {
    const auditoria = this.get("auditoria", []);
    const currentUser = JSON.parse(sessionStorage.getItem("club_manager_user")) || { usuario: "anonimo", rol: "Consulta" };
    
    const newLog = {
      id: auditoria.length > 0 ? Math.max(...auditoria.map(l => l.id)) + 1 : 1,
      fecha: new Date().toISOString(),
      usuario: currentUser.usuario,
      rol: currentUser.rol,
      accion: accion,
      detalle: detalle
    };

    auditoria.unshift(newLog); // Añadir al inicio para feed cronológico descendente
    this.save("auditoria", auditoria);

    // Si Supabase está configurado, insertar registro de auditoría directamente en la nube
    if (supabase) {
      supabase.from("auditoria").insert([{
        usuario: newLog.usuario,
        rol: newLog.rol,
        accion: newLog.accion,
        detalle: newLog.detalle
      }]).then(({ error }) => {
        if (error) console.error("Error al sincronizar log de auditoría:", error);
      });
    }
  },

  /**
   * Sincronizar hacia Supabase (Escritura en Nube en segundo plano)
   */
  async syncToSupabase(key, data) {
    if (!supabase) return;

    try {
      if (key === "socios") {
        // Formatear filas para insertar/actualizar
        const formatted = data.map(s => ({
          id: s.id,
          nro_socio: s.nroSocio,
          nombre: s.nombre,
          ci: s.ci,
          telefono: s.telefono,
          email: s.email,
          categoria: s.categoria,
          estado: s.estado,
          fecha_vencimiento: s.fechaVencimiento,
          foto: s.foto
        }));
        await supabase.from("socios").upsert(formatted);
      } else if (key === "ingresos") {
        const formatted = data.map(i => ({
          id: i.id,
          fecha: i.fecha,
          tipo_pagador: i.tipoPagador || 'socio',
          socio_id: i.socioId ? parseInt(i.socioId) : null,
          cliente_id: i.clienteId ? parseInt(i.clienteId) : null,
          nombre_manual: i.nombreManual || null,
          ruc: i.ruc || null,
          categoria: i.categoria,
          concepto: i.concepto,
          monto: i.monto,
          metodo_pago: i.metodoPago,
          usuario: i.usuario
        }));
        await supabase.from("ingresos").upsert(formatted);
      } else if (key === "egresos") {
        const formatted = data.map(e => ({
          id: e.id,
          fecha: e.fecha,
          concepto: e.concepto,
          categoria: e.categoria,
          monto: e.monto,
          comprobante: e.comprobante,
          usuario: e.usuario
        }));
        await supabase.from("egresos").upsert(formatted);
      } else if (key === "clientes") {
        const formatted = data.map(c => ({
          id: c.id,
          nombre: c.nombre,
          ruc: c.ruc,
          telefono: c.telefono,
          email: c.email
        }));
        await supabase.from("clientes").upsert(formatted);
      } else if (key === "caja") {
        // Sincronizar estado de caja activa
        const estadoCaja = {
          id: 1,
          abierta: data.abierta,
          monto_inicial: data.montoInicial || 0,
          fecha_apertura: data.fechaApertura || null,
          usuario: data.usuario || null
        };
        await supabase.from("caja_estado").upsert([estadoCaja]);

        // Sincronizar cierres del historial
        if (data.historial && data.historial.length > 0) {
          const histFormatted = data.historial.map(h => ({
            id: h.id,
            fecha_apertura: h.fechaApertura,
            fecha_cierre: h.fechaCierre,
            monto_inicial: h.montoInicial,
            ingresos: h.ingresos,
            egresos: h.egresos,
            monto_final: h.montoFinal,
            usuario: h.usuario
          }));
          await supabase.from("caja_historial").upsert(histFormatted);
        }
      }
    } catch (err) {
      console.error(`Fallo al sincronizar ${key} en Supabase:`, err);
    }
  },

  /**
   * Sincronizar desde Supabase (Carga total desde Nube)
   */
  async syncFromSupabase() {
    if (!supabase) return;

    try {
      console.log("Iniciando sincronización completa desde Supabase...");

      // 1. Cargar Socios
      const { data: dbSocios, error: errS } = await supabase.from("socios").select("*");
      if (!errS && dbSocios) {
        const mapped = dbSocios.map(s => ({
          id: s.id,
          nroSocio: s.nro_socio,
          nombre: s.nombre,
          ci: s.ci,
          telefono: s.telefono,
          email: s.email,
          categoria: s.categoria,
          estado: s.estado,
          fechaIngreso: s.fecha_ingreso,
          fechaVencimiento: s.fecha_vencimiento,
          foto: s.foto
        }));
        localStorage.setItem(DB_KEY_PREFIX + "socios", JSON.stringify(mapped));
      }

      // 2. Cargar Clientes
      const { data: dbClientes, error: errC } = await supabase.from("clientes").select("*");
      if (!errC && dbClientes) {
        localStorage.setItem(DB_KEY_PREFIX + "clientes", JSON.stringify(dbClientes));
      }

      // 3. Cargar Ingresos
      const { data: dbIngresos, error: errI } = await supabase.from("ingresos").select("*");
      if (!errI && dbIngresos) {
        const mapped = dbIngresos.map(i => ({
          id: i.id,
          fecha: i.fecha,
          tipoPagador: i.tipo_pagador,
          socioId: i.socio_id,
          clienteId: i.cliente_id,
          nombreManual: i.nombre_manual,
          ruc: i.ruc,
          categoria: i.categoria,
          concepto: i.concepto,
          monto: i.monto,
          metodoPago: i.metodo_pago,
          usuario: i.usuario
        }));
        localStorage.setItem(DB_KEY_PREFIX + "ingresos", JSON.stringify(mapped));
      }

      // 4. Cargar Egresos
      const { data: dbEgresos, error: errE } = await supabase.from("egresos").select("*");
      if (!errE && dbEgresos) {
        localStorage.setItem(DB_KEY_PREFIX + "egresos", JSON.stringify(dbEgresos));
      }

      // 5. Cargar Caja y Cierres Históricos
      const { data: activeCaja, error: errAC } = await supabase.from("caja_estado").select("*").eq("id", 1).single();
      const { data: dbHist, error: errH } = await supabase.from("caja_historial").select("*");
      
      if (!errAC && activeCaja) {
        const mappedHist = (dbHist || []).map(h => ({
          id: h.id,
          fechaApertura: h.fecha_apertura,
          fechaCierre: h.fecha_cierre,
          montoInicial: h.monto_inicial,
          ingresos: h.ingresos,
          egresos: h.egresos,
          montoFinal: h.monto_final,
          usuario: h.usuario
        }));

        const cajaState = {
          abierta: activeCaja.abierta,
          fechaApertura: activeCaja.fecha_apertura,
          montoInicial: activeCaja.monto_inicial,
          transacciones: [],
          historial: mappedHist
        };
        localStorage.setItem(DB_KEY_PREFIX + "caja", JSON.stringify(cajaState));
      }

      // 6. Cargar Auditoría
      const { data: dbAuditoria, error: errAu } = await supabase.from("auditoria").select("*").order("id", { ascending: false });
      if (!errAu && dbAuditoria) {
        localStorage.setItem(DB_KEY_PREFIX + "auditoria", JSON.stringify(dbAuditoria));
      }

      console.log("¡Sincronización completa de Supabase a LocalStorage exitosa!");

      // Disparar redibujado de la pantalla actual en la SPA
      if (window.App && typeof App.renderViewData === "function") {
        App.renderViewData(App.currentView);
      }
    } catch (err) {
      console.error("Fallo general en la descarga de datos desde Supabase:", err);
    }
  }
};

// Autoejecutar inicialización
DB.init();
