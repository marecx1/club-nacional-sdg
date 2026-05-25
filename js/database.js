/**
 * Club Manager Pro PY - Sistema de Base de Datos Local
 * Persistencia basada en LocalStorage para simular tiempo real.
 */

const DB_KEY_PREFIX = "club_nacional_sdg_";

const DB = {
  get(key, defaultValue = null) {
    const data = localStorage.getItem(DB_KEY_PREFIX + key);
    try {
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Error al leer la clave ${key} de LocalStorage`, e);
      return defaultValue;
    }
  },

  save(key, data) {
    try {
      localStorage.setItem(DB_KEY_PREFIX + key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`Error al guardar la clave ${key} en LocalStorage`, e);
      return false;
    }
  },

  reset() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(DB_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    this.init(true);
  },

  init(force = false) {
    if (!force && this.get("initialized")) {
      // Migración: Asegurar que el director se actualice a Jonas Mareco si ya estaba inicializado
      const usuarios = this.get("usuarios", []);
      const adminUser = usuarios.find(u => u.usuario === "admin");
      if (adminUser && adminUser.nombre.includes("Carlos Benítez")) {
        adminUser.nombre = "Jonas Mareco (Director)";
        this.save("usuarios", usuarios);
      }

      // Migración: Asegurar campos RUC y Categoría en ingresos preexistentes
      const ingresos = this.get("ingresos", []);
      if (ingresos.length > 0 && !ingresos[0].ruc) {
        const updatedIngresos = ingresos.map(i => {
          if (!i.ruc) i.ruc = "N/A";
          if (!i.categoria) {
            i.categoria = i.concepto.toLowerCase().includes("cuota") ? "cuotas" :
                          i.concepto.toLowerCase().includes("cancha") ? "alquiler_canchas" : "otros";
          }
          return i;
        });
        this.save("ingresos", updatedIngresos);
      }

      // Migración: Asegurar tabla de clientes comerciales
      if (!this.get("clientes")) {
        const clientesSeed = [
          { id: 1, nombre: "Distribuidora El Sol S.A.", ruc: "80011122-3", telefono: "0981 999 888", email: "contacto@elsol.com.py" },
          { id: 2, nombre: "Supermercado Los Cedros", ruc: "80077733-4", telefono: "0972 111 222", email: "administracion@loscedros.com.py" },
          { id: 3, nombre: "Telecomunicaciones Guaraní", ruc: "80044455-5", telefono: "0991 333 444", email: "pagos@tely.com.py" }
        ];
        this.save("clientes", clientesSeed);
      }
      return;
    }

    // --- DATOS SEMILLA (REALISTAS DE PARAGUAY) ---

    // 1. Catálogo de Usuarios / Roles
    const usuarios = [
      { usuario: "admin", nombre: "Jonas Mareco (Director)", rol: "Administrador", clave: "admin123" },
      { usuario: "tesorero", nombre: "María Auxiliadora Duarte", rol: "Tesorero", clave: "teso123" },
      { usuario: "secretario", nombre: "Jorge Galeano", rol: "Secretario", clave: "secre123" },
      { usuario: "consulta", nombre: "Rodrigo Martínez", rol: "Consulta", clave: "con123" }
    ];

    // 2. Socios Semilla
    const socios = [
      {
        id: 1,
        nroSocio: "CNSDG-1001",
        nombre: "Ramón Alejandro González",
        ci: "3.456.789",
        telefono: "0981 123 456",
        email: "ramon.gonzalez@gmail.com",
        categoria: "Titular",
        estado: "Activo",
        fechaIngreso: "2024-01-15",
        fechaVencimiento: "2026-06-10",
        foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150"
      },
      {
        id: 2,
        nroSocio: "CNSDG-1002",
        nombre: "Sofía Montserrat Recalde",
        ci: "4.890.123",
        telefono: "0971 789 012",
        email: "sofia.recalde@outlook.com",
        categoria: "Familiar",
        estado: "Activo",
        fechaIngreso: "2024-03-20",
        fechaVencimiento: "2026-06-15",
        foto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
      },
      {
        id: 3,
        nroSocio: "CNSDG-1003",
        nombre: "Nelson Haedo Benítez",
        ci: "2.345.678",
        telefono: "0982 456 789",
        email: "nelson.haedo@hotmail.com",
        categoria: "Vitalicio",
        estado: "Activo",
        fechaIngreso: "2015-05-10",
        fechaVencimiento: "2030-12-31",
        foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"
      },
      {
        id: 4,
        nroSocio: "CNSDG-1004",
        nombre: "Fátima Belén Espínola",
        ci: "5.112.334",
        telefono: "0994 321 654",
        email: "fatima.espinola@gmail.com",
        categoria: "Juvenil",
        estado: "Moroso",
        fechaIngreso: "2025-02-10",
        fechaVencimiento: "2026-04-10",
        foto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150"
      },
      {
        id: 5,
        nroSocio: "CNSDG-1005",
        nombre: "Juan Ángel Cardozo",
        ci: "1.987.654",
        telefono: "0983 987 654",
        email: "juan.cardozo@gmail.com",
        categoria: "Titular",
        estado: "Activo",
        fechaIngreso: "2022-08-12",
        fechaVencimiento: "2026-06-10",
        foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
      },
      {
        id: 6,
        nroSocio: "CNSDG-1006",
        nombre: "Gabriela Jazmín Almada",
        ci: "6.012.345",
        telefono: "0972 555 444",
        email: "gabi.almada@live.com.py",
        categoria: "Familiar",
        estado: "Moroso",
        fechaIngreso: "2025-01-20",
        fechaVencimiento: "2026-05-10",
        foto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"
      },
      {
        id: 7,
        nroSocio: "CNSDG-1007",
        nombre: "Derlis Francisco Ortiz",
        ci: "4.567.890",
        telefono: "0985 667 889",
        email: "derlis.ortiz@caja.com.py",
        categoria: "Titular",
        estado: "Suspendido",
        fechaIngreso: "2023-11-05",
        fechaVencimiento: "2026-02-10",
        foto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150"
      }
    ];

    // 3. Ingresos Semilla (En Guaraníes Gs.)
    const ingresos = [
      { id: 1, fecha: "2026-05-01T09:30:00", socioId: 1, concepto: "Cuota Social - Mayo 2026", monto: 150000, metodoPago: "Transferencia", usuario: "tesorero", categoria: "cuotas", ruc: "3.456.789" },
      { id: 2, fecha: "2026-05-02T16:15:00", socioId: 2, concepto: "Cuota Social - Mayo 2026", monto: 100000, metodoPago: "QR", usuario: "tesorero", categoria: "cuotas", ruc: "4.890.123" },
      { id: 3, fecha: "2026-05-03T18:00:00", socioId: null, concepto: "Alquiler Cancha Pádel 1", monto: 120000, metodoPago: "Efectivo", usuario: "secretario", categoria: "alquiler_canchas", ruc: "80054321-1" },
      { id: 4, fecha: "2026-05-10T12:00:00", socioId: 3, concepto: "Aporte Especial Anual", monto: 500000, metodoPago: "Transferencia", usuario: "admin", categoria: "otros", ruc: "2.345.678" },
      { id: 5, fecha: "2026-05-15T21:00:00", socioId: null, concepto: "Consumo Cantina - Fin de semana", monto: 350000, metodoPago: "Efectivo", usuario: "tesorero", categoria: "cantina", ruc: "80099988-2" },
      { id: 6, fecha: "2026-05-18T10:45:00", socioId: 5, concepto: "Cuota Social - Mayo 2026", monto: 150000, metodoPago: "QR", usuario: "tesorero", categoria: "cuotas", ruc: "1.987.654" },
      { id: 7, fecha: "2026-05-20T19:30:00", socioId: null, concepto: "Inscripciones Torneo de Fútbol", monto: 800000, metodoPago: "Transferencia", usuario: "secretario", categoria: "otros", ruc: "80077766-3" },
      { id: 8, fecha: "2026-05-22T14:00:00", socioId: null, concepto: "Alquiler Comercial - Salón 1 y Electricidad", monto: 2500000, metodoPago: "Transferencia", usuario: "tesorero", categoria: "alquiler_comercial", ruc: "80011122-3" }
    ];

    // 4. Egresos Semilla (En Guaraníes Gs.)
    const egresos = [
      { id: 1, fecha: "2026-05-02T11:00:00", concepto: "Pago de Arbitraje - Torneo Apertura", categoria: "arbitraje", monto: 300000, comprobante: "Recibo_Arbitraje_05.pdf", usuario: "tesorero" },
      { id: 2, fecha: "2026-05-05T15:30:00", concepto: "Reparación de Reflector Cancha 2", categoria: "mantenimiento", monto: 450000, comprobante: "Factura_Electro_22.png", usuario: "admin" },
      { id: 3, fecha: "2026-05-08T10:00:00", concepto: "Pago ANDE - Consumo Abril", categoria: "electricidad", monto: 750000, comprobante: "Factura_ANDE_Abril.pdf", usuario: "tesorero" },
      { id: 4, fecha: "2026-05-12T17:00:00", concepto: "Artículos de Limpieza y Oficina", categoria: "compras", monto: 180000, comprobante: "Factura_Comercial_ElSol.jpg", usuario: "secretario" },
      { id: 5, fecha: "2026-05-22T09:00:00", concepto: "Salario Cuidador de Instalaciones", categoria: "salarios", monto: 1200000, comprobante: "Recibo_Firma_Salario.pdf", usuario: "tesorero" }
    ];

    // 5. Caja Diaria Inicial (Abierta hoy con saldo base)
    const hoyStr = new Date().toISOString().split('T')[0];
    const caja = {
      abierta: true,
      fechaApertura: `${hoyStr}T08:00:00`,
      montoInicial: 500000,
      transacciones: [
        // Se mapearán los IDs de transacciones de hoy si las hubiera
      ],
      historial: [
        { id: 1, fechaApertura: "2026-05-20T08:00:00", fechaCierre: "2026-05-20T18:00:00", montoInicial: 500000, ingresos: 800000, egresos: 0, montoFinal: 1300000, usuario: "tesorero" },
        { id: 2, fechaApertura: "2026-05-21T08:00:00", fechaCierre: "2026-05-21T18:00:00", montoInicial: 1300000, ingresos: 0, egresos: 0, montoFinal: 1300000, usuario: "tesorero" },
        { id: 3, fechaApertura: "2026-05-22T08:00:00", fechaCierre: "2026-05-22T18:00:00", montoInicial: 1300000, ingresos: 0, egresos: 1200000, montoFinal: 100000, usuario: "tesorero" }
      ]
    };

    // Guardar en LocalStorage
    const clientesSeed = [
      { id: 1, nombre: "Distribuidora El Sol S.A.", ruc: "80011122-3", telefono: "0981 999 888", email: "contacto@elsol.com.py" },
      { id: 2, nombre: "Supermercado Los Cedros", ruc: "80077733-4", telefono: "0972 111 222", email: "administracion@loscedros.com.py" },
      { id: 3, nombre: "Telecomunicaciones Guaraní", ruc: "80044455-5", telefono: "0991 333 444", email: "pagos@tely.com.py" }
    ];

    this.save("usuarios", usuarios);
    this.save("socios", socios);
    this.save("ingresos", ingresos);
    this.save("egresos", egresos);
    this.save("caja", caja);
    this.save("clientes", clientesSeed);
    this.save("initialized", true);

    console.log("Base de datos Club Nacional SDG inicializada correctamente con datos semilla.");
  }
};

// Autoejecutar inicialización
DB.init();
