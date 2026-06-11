/**
 * Club Manager Pro PY - Motor Principal SPA (Single Page Application)
 * Controla el inicio de sesión, roles de usuario, enrutamiento, CRUD y reglas de negocio.
 */

const App = {
  currentUser: null,
  currentView: "dashboard",
  editingSocioId: null,
  editingIngresoId: null,
  editingEgresoId: null,
  editingCierreId: null,
  transaccionesTab: "Todos",

  /**
   * Inicialización de la Aplicación al cargar
   */
  init() {
    // 1. Vincular los eventos de los formularios principales
    this.bindEvents();

    // 2. Verificar si hay una sesión activa guardada
    const savedUser = sessionStorage.getItem("club_manager_user");
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.launchApp();
    } else {
      this.showLoginScreen();
    }
  },

  /**
   * Mostrar Pantalla de Acceso
   */
  showLoginScreen() {
    document.getElementById("login-screen").classList.remove("hidden");
    document.getElementById("app-sidebar").style.display = "none";
    document.getElementById("app-main-content").style.display = "none";
  },

  /**
   * Iniciar la Aplicación tras Login Exitoso
   */
  launchApp() {
    document.getElementById("login-screen").classList.add("hidden");
    
    // Mostrar estructura principal
    const sidebar = document.getElementById("app-sidebar");
    const mainContent = document.getElementById("app-main-content");
    sidebar.style.display = "flex";
    mainContent.style.display = "flex";

    // Actualizar datos del usuario logueado en el sidebar
    document.getElementById("user-display-name").innerText = this.currentUser.nombre;
    document.getElementById("user-display-role").innerText = this.currentUser.rol;
    document.getElementById("user-avatar-text").innerText = this.currentUser.nombre.substring(0, 2).toUpperCase();

    // Sincronizar selector de acceso directo (Captura de pantalla)
    const rSel = document.getElementById("sidebar-role-selector");
    if (rSel) {
      rSel.value = this.currentUser.usuario;
      
      document.getElementById("acceso-display-user").innerText = this.currentUser.usuario;
      const badge = document.getElementById("acceso-display-permiso");
      badge.innerText = this.currentUser.rol.toUpperCase();
      if (this.currentUser.rol === "Administrador") {
        badge.style.background = "rgba(239, 68, 68, 0.15)";
        badge.style.color = "var(--danger)";
      } else if (this.currentUser.rol === "Tesorero") {
        badge.style.background = "rgba(245, 158, 11, 0.15)";
        badge.style.color = "var(--warning)";
      } else if (this.currentUser.rol === "Secretario") {
        badge.style.background = "rgba(16, 185, 129, 0.15)";
        badge.style.color = "var(--success)";
      } else {
        badge.style.background = "rgba(148, 163, 184, 0.15)";
        badge.style.color = "var(--text-secondary)";
      }
    }

    // Aplicar restricciones basadas en Roles
    this.applyRoleRestrictions();

    // Establecer mes y año actual como valores por defecto en los selectores
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const selCajaMes = document.getElementById("filtro-caja-mes");
    const selCajaAnio = document.getElementById("filtro-caja-anio");
    if (selCajaMes) selCajaMes.value = currentMonth;
    if (selCajaAnio) selCajaAnio.value = currentYear;

    const selIngresoMes = document.getElementById("filtro-ingreso-mes");
    const selIngresoAnio = document.getElementById("filtro-ingreso-anio");
    if (selIngresoMes) selIngresoMes.value = currentMonth;
    if (selIngresoAnio) selIngresoAnio.value = currentYear;

    const selEgresoMes = document.getElementById("filtro-egreso-mes");
    const selEgresoAnio = document.getElementById("filtro-egreso-anio");
    if (selEgresoMes) selEgresoMes.value = currentMonth;
    if (selEgresoAnio) selEgresoAnio.value = currentYear;

    // Navegar a la vista inicial (Dashboard)
    this.navigate("dashboard");

    // Inicializar servicio de notificaciones
    if (typeof NotificationService !== "undefined") {
      NotificationService.init();
    }

    UI.showToast(`¡Bienvenido de vuelta, ${this.currentUser.nombre}!`, "success");
  },

  /**
   * Aplicar Restricciones de Navegación según Rol
   */
  applyRoleRestrictions() {
    const rol = this.currentUser.rol;

    // Ocultar botones de agregar según rol
    const addSocioBtn = document.getElementById("btn-open-add-socio");
    const addIngresoBtn = document.getElementById("btn-open-add-ingreso");
    const addEgresoBtn = document.getElementById("btn-open-add-egreso");

    if (addSocioBtn) {
      addSocioBtn.style.display = ["Administrador", "Secretario"].includes(rol) ? "flex" : "none";
    }
    if (addIngresoBtn) {
      addIngresoBtn.style.display = ["Administrador", "Tesorero"].includes(rol) ? "flex" : "none";
    }
    if (addEgresoBtn) {
      addEgresoBtn.style.display = ["Administrador", "Tesorero"].includes(rol) ? "flex" : "none";
    }

    // Configurar menú visible en el sidebar
    const menuSocios = document.getElementById("menu-item-socios");
    const menuIngresos = document.getElementById("menu-item-ingresos");
    const menuEgresos = document.getElementById("menu-item-egresos");
    const menuCaja = document.getElementById("menu-item-caja");

    // Tesorero no gestiona directamente fichas de socios
    if (menuSocios) menuSocios.style.display = rol === "Tesorero" ? "none" : "block";

    // Secretario no gestiona caja ni finanzas directamente
    if (menuIngresos) menuIngresos.style.display = rol === "Secretario" ? "none" : "block";
    if (menuEgresos) menuEgresos.style.display = rol === "Secretario" ? "none" : "block";
    if (menuCaja) menuCaja.style.display = rol === "Secretario" ? "none" : "block";

    // Consulta tiene accesos de solo lectura a Dashboard, Socios y Reportes
    if (rol === "Consulta") {
      if (menuIngresos) menuIngresos.style.display = "none";
      if (menuEgresos) menuEgresos.style.display = "none";
      if (menuCaja) menuCaja.style.display = "none";
    }
  },

  /**
   * Navegación SPA interna
   */
  navigate(viewName) {
    this.currentView = viewName;

    // Ocultar todas las vistas
    document.querySelectorAll(".spa-view").forEach(view => {
      view.classList.add("hidden");
    });

    // Mostrar vista seleccionada
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
      targetView.classList.remove("hidden");
    }

    // Actualizar estados del Menú en Sidebar
    document.querySelectorAll(".menu-item").forEach(item => {
      item.classList.remove("active");
    });
    const activeMenuItem = document.getElementById(`menu-item-${viewName}`);
    if (activeMenuItem) {
      activeMenuItem.classList.add("active");
    }

    // Renderizar datos específicos de la vista activa
    this.renderViewData(viewName);

    // Ajustar sidebar en responsive (cerrar al hacer click en móviles)
    if (window.innerWidth <= 768) {
      document.getElementById("app-sidebar").classList.remove("active");
    }
  },

  /**
   * Disparar Renderizador específico según vista activa
   */
  renderViewData(viewName) {
    if (viewName === "dashboard") {
      UI.renderDashboard();
    } else if (viewName === "socios") {
      UI.renderSocios();
    } else if (viewName === "ingresos") {
      UI.renderIngresos();
    } else if (viewName === "egresos") {
      UI.renderEgresos();
    } else if (viewName === "caja") {
      UI.renderCaja();
    } else if (viewName === "reportes") {
      UI.renderReportes();
    }

    // Cargar iconos de Lucide actualizados
    lucide.createIcons();
  },

  /**
   * ==========================================================================
   * FLUJO: EVENTOS Y ENLACES DEL DOM
   * ==========================================================================
   */
  bindEvents() {
    // 1. Formulario de Login
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const user = String(document.getElementById("login-username").value || "").trim();
        const pass = String(document.getElementById("login-password").value || "").trim();
        this.login(user, pass);
      });
    }

    // 2. Toggle de Modo Claro/Oscuro
    const themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        document.body.classList.toggle("light-theme");
        
        // Cambiar icono
        const isLight = document.body.classList.contains("light-theme");
        themeBtn.innerHTML = isLight ? `<i data-lucide="moon"></i>` : `<i data-lucide="sun"></i>`;
        lucide.createIcons();

        // Redibujar gráficos del dashboard con los nuevos contrastes
        if (this.currentView === "dashboard") {
          UI.renderDashboard();
        }
      });
    }

    // 3. Formulario Socio (Agregar/Editar)
    const socioForm = document.getElementById("form-socio");
    if (socioForm) {
      socioForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveSocioForm();
      });
    }

    // 4. Formulario de Ingreso Financiero
    const ingresoForm = document.getElementById("form-ingreso");
    if (ingresoForm) {
      ingresoForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveIngresoForm();
      });
    }

    const ingresoSocioSelect = document.getElementById("ingreso-socio-id");
    if (ingresoSocioSelect) {
      ingresoSocioSelect.addEventListener("change", (e) => {
        const socioId = e.target.value;
        const rucInput = document.getElementById("ingreso-ruc");
        if (rucInput) {
          if (socioId) {
            const socios = DB.get("socios", []);
            const socio = socios.find(s => s.id === parseInt(socioId));
            if (socio) {
              rucInput.value = socio.ci;
            }
          } else {
            rucInput.value = "";
          }
        }
      });
    }

    const ingresoClienteSelect = document.getElementById("ingreso-cliente-id");
    if (ingresoClienteSelect) {
      ingresoClienteSelect.addEventListener("change", (e) => {
        const clienteId = e.target.value;
        const rucInput = document.getElementById("ingreso-ruc");
        if (rucInput) {
          if (clienteId) {
            const clientes = DB.get("clientes", []);
            const cliente = clientes.find(c => c.id === parseInt(clienteId));
            if (cliente) {
              rucInput.value = cliente.ruc;
            }
          } else {
            rucInput.value = "";
          }
        }
      });
    }

    const nuevoClienteForm = document.getElementById("form-nuevo-cliente");
    if (nuevoClienteForm) {
      nuevoClienteForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveNuevoCliente();
      });
    }

    // 5. Formulario de Egreso Financiero
    const egresoForm = document.getElementById("form-egreso");
    if (egresoForm) {
      egresoForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveEgresoForm();
      });
    }

    // 6. Formulario de Apertura de Caja
    const abrirCajaForm = document.getElementById("form-abrir-caja");
    if (abrirCajaForm) {
      abrirCajaForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveAbrirCajaForm();
      });
    }

    // 6b. Formulario de Edición de Cierre de Caja
    const editarCierreForm = document.getElementById("form-editar-cierre");
    if (editarCierreForm) {
      editarCierreForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveEditarCierreForm();
      });
    }

    // Auto-recalcular el saldo de cierre en tiempo real al editar
    const inputsCierre = ['editar-cierre-monto-inicial', 'editar-cierre-ingresos', 'editar-cierre-egresos'];
    inputsCierre.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          const ini = parseFloat(document.getElementById('editar-cierre-monto-inicial').value) || 0;
          const ing = parseFloat(document.getElementById('editar-cierre-ingresos').value) || 0;
          const egr = parseFloat(document.getElementById('editar-cierre-egresos').value) || 0;
          document.getElementById('editar-cierre-monto-final').value = Math.max(0, ini + ing - egr);
        });
      }
    });

    // 7. Buscador predictivo de socios
    const socioSearch = document.getElementById("socio-search");
    if (socioSearch) {
      socioSearch.addEventListener("input", () => {
        UI.renderSocios();
      });
    }

    // 8. Lector de archivos de imagen para foto de socio
    const socioFotoFile = document.getElementById("socio-foto-file");
    if (socioFotoFile) {
      socioFotoFile.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            document.getElementById("socio-foto").value = event.target.result;
            document.getElementById("socio-foto-preview").src = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // 9. Selector de Rol de Acceso Directo (Captura de pantalla)
    const roleSelector = document.getElementById("sidebar-role-selector");
    if (roleSelector) {
      roleSelector.addEventListener("change", (e) => {
        const val = e.target.value;
        const usuarios = DB.get("usuarios", []);
        const found = usuarios.find(u => u.usuario === val);
        if (found) {
          this.currentUser = found;
          sessionStorage.setItem("club_manager_user", JSON.stringify(found));
          
          // Actualizar perfil del sidebar
          document.getElementById("user-display-name").innerText = found.nombre;
          document.getElementById("user-display-role").innerText = found.rol;
          document.getElementById("user-avatar-text").innerText = found.nombre.substring(0, 2).toUpperCase();

          // Actualizar nivel de acceso del sidebar
          document.getElementById("acceso-display-user").innerText = found.usuario;
          
          // Cambiar color y texto del badge de permiso
          const badge = document.getElementById("acceso-display-permiso");
          badge.innerText = found.rol.toUpperCase();
          if (found.rol === "Administrador") {
            badge.style.background = "rgba(239, 68, 68, 0.15)";
            badge.style.color = "var(--danger)";
          } else if (found.rol === "Tesorero") {
            badge.style.background = "rgba(245, 158, 11, 0.15)";
            badge.style.color = "var(--warning)";
          } else if (found.rol === "Secretario") {
            badge.style.background = "rgba(16, 185, 129, 0.15)";
            badge.style.color = "var(--success)";
          } else {
            badge.style.background = "rgba(148, 163, 184, 0.15)";
            badge.style.color = "var(--text-secondary)";
          }

          // Re-aplicar restricciones
          this.applyRoleRestrictions();

          // Si el usuario ya no tiene permiso para la vista actual, redirigir al Dashboard
          const rol = found.rol;
          const restriccionIngresosEgresosCaja = ["Secretario", "Consulta"].includes(rol);
          const restriccionSocios = rol === "Tesorero";

          if (this.currentView === "socios" && restriccionSocios) {
            this.navigate("dashboard");
          } else if (["ingresos", "egresos", "caja"].includes(this.currentView) && restriccionIngresosEgresosCaja) {
            this.navigate("dashboard");
          } else {
            // Refrescar vista actual
            this.navigate(this.currentView);
          }

          UI.showToast(`Simulación activada: Ahora eres ${found.rol}`, "success");
        }
      });
    }

    // Formulario de Recuperación de Contraseña
    const recuperarForm = document.getElementById("form-recuperar-clave");
    if (recuperarForm) {
      recuperarForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = String(document.getElementById("recuperar-email").value || "").trim();
        if (window.fbAuth) {
          try {
            await window.fbAuth.sendPasswordResetEmail(email);
            UI.closeModal("modal-recuperar-clave-backdrop");
            UI.showToast("Enlace de recuperación enviado. Revisa tu correo.", "success");
            DB.logAuditoria("RECUPERAR_CONTRASEÑA", `Enlace de restablecimiento de Firebase enviado a ${email}`);
          } catch (err) {
            UI.showToast("Error: " + (err.message || "No se pudo enviar el enlace."), "danger");
          }
        } else {
          // Simulación Offline
          UI.closeModal("modal-recuperar-clave-backdrop");
          UI.showToast(`Simulación: Enlace de recuperación enviado a ${email}.`, "success");
          DB.logAuditoria("RECUPERAR_CONTRASEÑA", `Simulación de restablecimiento para ${email}`);
        }
      });
    }
  },

  /**
   * Forzar Acceso Directo de Respaldo Contable
   */
  loginDemo() {
    if (confirm("¿Deseas restablecer la caché del portal y acceder en Modo Demostración Local? Esto limpiará cualquier sesión previa conflictiva.")) {
      DB.reset();
      const usuarios = DB.get("usuarios", []);
      const admin = usuarios.find(u => u.usuario === "admin");
      if (admin) {
        this.currentUser = admin;
        sessionStorage.setItem("club_manager_user", JSON.stringify(admin));
        this.launchApp();
        DB.logAuditoria("INICIAR_SESIÓN", "Acceso de emergencia en Modo Demostración Local completado.");
      }
    }
  },

  /**
   * Lógica de Autenticación con Firebase Auth + fallback local
   */
  async login(username, password) {
    const cleanUser = String(username || "").trim();
    const cleanPass = String(password || "").trim();

    if (window.fbAuth) {
      try {
        // Mapear nombre de usuario corto a email real
        const emailMap = {
          admin:       "jonasmareco28@gmail.com",
          tesorero:    "tesorero@clubnacional.org.py",
          secretario:  "secretario@clubnacional.org.py",
          consulta:    "consulta@clubnacional.org.py"
        };
        const email = cleanUser.includes("@") ? cleanUser : (emailMap[cleanUser.toLowerCase()] || (cleanUser + "@clubnacional.org.py"));

        // Timeout de 5 segundos por seguridad
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Tiempo de espera agotado. Verificá tu conexión a internet.")), 5000)
        );

        const authPromise = window.fbAuth.signInWithEmailAndPassword(email, cleanPass);
        const userCredential = await Promise.race([authPromise, timeoutPromise]);

        // Cargar perfil desde LocalStorage (datos semilla o Firestore ya sincronizados)
        const usuarios = DB.get("usuarios", []);
        const matched  = usuarios.find(u =>
          u.email.toLowerCase() === email.toLowerCase() ||
          u.usuario.toLowerCase() === cleanUser.toLowerCase()
        );
        const found = matched
          ? { usuario: matched.usuario, nombre: matched.nombre, rol: matched.rol, email: matched.email }
          : { usuario: cleanUser, nombre: cleanUser, rol: "Consulta", email };

        this.currentUser = found;
        sessionStorage.setItem("club_manager_user", JSON.stringify(found));
        this.launchApp();

        // Descargar datos de Firestore en segundo plano
        DB.syncFromFirestore();
        DB.logAuditoria("INICIAR_SESIÓN", "Inicio de sesión seguro mediante Firebase Auth exitoso.");

      } catch (err) {
        console.warn("Fallo de Firebase Auth, intentando inicio de sesión local:", err.message);
        this.loginOffline(cleanUser, cleanPass);
      }
    } else {
      this.loginOffline(cleanUser, cleanPass);
    }
  },

  loginOffline(username, password) {
    const cleanUser = String(username || "").trim();
    const cleanPass = String(password || "").trim();
    const usuarios = DB.get("usuarios", []);
    const found = usuarios.find(u =>
      (u.usuario.toLowerCase() === cleanUser.toLowerCase() || u.email.toLowerCase() === cleanUser.toLowerCase()) &&
      u.clave === cleanPass
    );

    if (found) {
      this.currentUser = found;
      sessionStorage.setItem("club_manager_user", JSON.stringify(found));
      this.launchApp();
      DB.logAuditoria("INICIAR_SESIÓN", "Inicio de sesión local (modo offline) exitoso.");
    } else {
      alert("Error: Usuario o contraseña incorrectos para Club Nacional SDG.");
      UI.showToast("Acceso denegado: Credenciales inválidas.", "danger");
    }
  },

  /**
   * Salida del Sistema
   */
  logout() {
    this.currentUser = null;
    sessionStorage.removeItem("club_manager_user");
    this.showLoginScreen();
    UI.showToast("Has cerrado sesión correctamente.", "warning");
  },

  /**
   * ==========================================================================
   * CONTROLADOR: ABREVIACIONES Y DIÁLOGOS DE CAJA DIARIA
   * ==========================================================================
   */
  saveAbrirCajaForm() {
    const monto = parseFloat(document.getElementById("abrir-caja-monto").value);
    
    if (isNaN(monto) || monto < 0) {
      alert("Por favor, ingresa un monto inicial válido.");
      return;
    }

    const caja = DB.get("caja", {});
    caja.abierta = true;
    caja.fechaApertura = new Date().toISOString();
    caja.montoInicial = monto;
    caja.transacciones = [];

    DB.save("caja", caja);
    DB.logAuditoria("ABRIR_CAJA", `Caja diaria abierta exitosamente con saldo ₲ ${monto.toLocaleString()}`);
    UI.closeModal("modal-abrir-caja-backdrop");
    UI.showToast(`Caja diaria abierta exitosamente con saldo ₲ ${monto.toLocaleString()}`, "success");
    
    // Notificar apertura de caja
    if (typeof NotificationService !== "undefined") {
      NotificationService.notifyCajaAbierta(monto, this.currentUser.nombre);
    }

    // Recargar vista
    this.renderViewData(this.currentView);
  },

  closeCaja() {
    if (!confirm("¿Estás seguro de que deseas realizar el cierre de la caja diaria actual? Esto consolidará el balance general.")) {
      return;
    }

    const caja = DB.get("caja", {});
    const ingresos = DB.get("ingresos", []);
    const egresos = DB.get("egresos", []);

    if (!caja.abierta) return;

    const fApertura = new Date(caja.fechaApertura);

    const totalIngresos = ingresos
      .filter(i => new Date(i.fecha) >= fApertura)
      .reduce((sum, i) => sum + i.monto, 0);

    const totalEgresos = egresos
      .filter(e => new Date(e.fecha) >= fApertura)
      .reduce((sum, e) => sum + e.monto, 0);

    const montoFinal = caja.montoInicial + totalIngresos - totalEgresos;

    // Armar registro del cierre
    const nuevoCierre = {
      id: (caja.historial ? caja.historial.length : 0) + 1,
      fechaApertura: caja.fechaApertura,
      fechaCierre: new Date().toISOString(),
      montoInicial: caja.montoInicial,
      ingresos: totalIngresos,
      egresos: totalEgresos,
      montoFinal: montoFinal,
      usuario: this.currentUser.usuario
    };

    if (!caja.historial) caja.historial = [];
    caja.historial.push(nuevoCierre);

    caja.abierta = false;
    caja.fechaApertura = null;
    caja.montoInicial = 0;
    caja.transacciones = [];

    DB.save("caja", caja);
    DB.logAuditoria("CERRAR_CAJA", `Cierre de caja #${nuevoCierre.id} realizado. Saldo consolidado: ₲ ${montoFinal.toLocaleString()}`);
    UI.showToast(`Cierre de caja #${nuevoCierre.id} realizado. Saldo consolidado: ₲ ${montoFinal.toLocaleString()}`, "success");
    
    // Notificar cierre de caja
    if (typeof NotificationService !== "undefined") {
      NotificationService.notifyCajaCerrada(nuevoCierre, this.currentUser.nombre);
    }

    this.renderViewData(this.currentView);
  },

  /**
   * ==========================================================================
   * CONTROLADOR: CRUD SOCIOS
   * ==========================================================================
   */
  openAddSocioModal() {
    this.editingSocioId = null;
    document.getElementById("modal-socio-title").innerText = "Registrar Nuevo Socio";
    document.getElementById("form-socio").reset();
    
    // Sugerir avatar por defecto
    const defAvatar = `https://images.unsplash.com/photo-${Math.floor(Math.random() * 100000)}?auto=format&fit=crop&q=80&w=150`;
    document.getElementById("socio-foto").value = defAvatar;
    document.getElementById("socio-foto-preview").src = defAvatar;
    document.getElementById("socio-foto-file").value = "";

    UI.openModal("modal-socio-backdrop");
  },

  openEditSocioModal(socioId) {
    const socios = DB.get("socios", []);
    const socio = socios.find(s => s.id === socioId);

    if (!socio) return;

    this.editingSocioId = socioId;
    document.getElementById("modal-socio-title").innerText = `Editar Socio: ${socio.nroSocio}`;

    // Cargar datos en el formulario
    document.getElementById("socio-nombre").value = socio.nombre;
    document.getElementById("socio-ci").value = socio.ci;
    document.getElementById("socio-telefono").value = socio.telefono;
    document.getElementById("socio-email").value = socio.email;
    document.getElementById("socio-categoria").value = socio.categoria;
    document.getElementById("socio-estado").value = socio.estado;
    
    const sFoto = socio.foto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80";
    document.getElementById("socio-foto").value = socio.foto || "";
    document.getElementById("socio-foto-preview").src = sFoto;
    document.getElementById("socio-foto-file").value = "";
    document.getElementById("socio-vencimiento").value = socio.fechaVencimiento;

    UI.openModal("modal-socio-backdrop");
  },

  saveSocioForm() {
    const socios = DB.get("socios", []);
    
    const nombre = document.getElementById("socio-nombre").value;
    const ci = document.getElementById("socio-ci").value;
    const telefono = document.getElementById("socio-telefono").value;
    const email = document.getElementById("socio-email").value;
    const categoria = document.getElementById("socio-categoria").value;
    const estado = document.getElementById("socio-estado").value;
    const foto = document.getElementById("socio-foto").value;
    const fechaVencimiento = document.getElementById("socio-vencimiento").value;

    if (this.editingSocioId) {
      // Modificar existente
      const index = socios.findIndex(s => s.id === this.editingSocioId);
      if (index !== -1) {
        const estadoAnterior = socios[index].estado;
        socios[index] = {
          ...socios[index],
          nombre, ci, telefono, email, categoria, estado, foto, fechaVencimiento
        };
        DB.save("socios", socios);
        DB.logAuditoria("MODIFICAR_SOCIO", `Ficha de socio ${nombre} (CI: ${ci}) modificada en categoría ${categoria}.`);

        // Detectar cambio a Moroso y notificar
        if (estado === "Moroso" && estadoAnterior !== "Moroso" && typeof NotificationService !== "undefined") {
          NotificationService.notifySocioMoroso(socios[index], "Cambio manual de estado");
        }

        UI.showToast("Socio actualizado con éxito.", "success");
      }
    } else {
      // Crear nuevo socio con correlativo automático
      const maxId = socios.reduce((max, s) => s.id > max ? s.id : max, 0);
      const nuevoId = maxId + 1;
      const nroSocio = `CNSDG-${1000 + nuevoId}`;

      const nuevoSocio = {
        id: nuevoId,
        nroSocio,
        nombre,
        ci,
        telefono,
        email,
        categoria,
        estado,
        fechaIngreso: new Date().toISOString().split('T')[0],
        fechaVencimiento,
        foto
      };

      socios.push(nuevoSocio);
      DB.save("socios", socios);
      DB.logAuditoria("CREAR_SOCIO", `Socio ${nombre} registrado con Nro Ficha: ${nroSocio} y CI: ${ci}.`);

      // Notificar si se registra directamente como Moroso
      if (estado === "Moroso" && typeof NotificationService !== "undefined") {
        NotificationService.notifySocioMoroso(nuevoSocio, "Registrado con estado Moroso");
      }

      UI.showToast(`Socio ${nroSocio} registrado con éxito.`, "success");
    }

    UI.closeModal("modal-socio-backdrop");
    this.renderViewData("socios");
  },

  deleteSocio(socioId) {
    if (!confirm("¿Deseas suspender temporalmente a este socio? Cambiará su estado en los reportes.")) {
      return;
    }

    const socios = DB.get("socios", []);
    const index = socios.findIndex(s => s.id === socioId);
    
    if (index !== -1) {
      const nombre = socios[index].nombre;
      socios[index].estado = "Suspendido";
      DB.save("socios", socios);
      DB.logAuditoria("ELIMINAR_SOCIO", `Ficha de socio ${nombre} (ID: ${socioId}) suspendida temporalmente.`);
      UI.showToast("Estado del socio modificado a Suspendido.", "warning");
      this.renderViewData("socios");
    }
  },

  openAddIngresoModal() {
    this.editingIngresoId = null;
    const header = document.querySelector("#modal-ingreso-backdrop h3");
    if (header) header.innerText = "Registrar Ingreso de Caja";
    
    // Limpiar campos
    document.getElementById("ingreso-tipo-pagador").value = "socio";
    document.getElementById("ingreso-socio-id").value = "";
    document.getElementById("ingreso-cliente-id").value = "";
    document.getElementById("ingreso-nombre-manual").value = "";
    document.getElementById("ingreso-ruc").value = "";
    document.getElementById("ingreso-categoria").value = "cuotas";
    document.getElementById("ingreso-concepto").value = "";
    document.getElementById("ingreso-monto").value = "";
    document.getElementById("ingreso-metodo").value = "Transferencia";

    // Toggle de visibilidad de wrappers
    this.handleTipoPagadorChange();
    
    UI.openModal("modal-ingreso-backdrop");
  },

  openEditIngresoModal(ingresoId) {
    const ingresos = DB.get("ingresos", []);
    const ingreso = ingresos.find(i => i.id === ingresoId);
    if (!ingreso) return;

    this.editingIngresoId = ingresoId;
    const header = document.querySelector("#modal-ingreso-backdrop h3");
    if (header) header.innerText = "Editar Ingreso de Caja";
    
    // Determinar o mapear tipo de pagador si no existe (retrocompatibilidad)
    let tipoPagador = ingreso.tipoPagador;
    if (!tipoPagador) {
      if (ingreso.socioId !== null && ingreso.socioId !== undefined) {
        tipoPagador = "socio";
      } else if (ingreso.clienteId !== null && ingreso.clienteId !== undefined) {
        tipoPagador = "cliente";
      } else {
        tipoPagador = "ocasional";
      }
    }

    // Rellenar campos
    document.getElementById("ingreso-tipo-pagador").value = tipoPagador;
    document.getElementById("ingreso-socio-id").value = ingreso.socioId !== null && ingreso.socioId !== undefined ? ingreso.socioId : "";
    document.getElementById("ingreso-cliente-id").value = ingreso.clienteId !== null && ingreso.clienteId !== undefined ? ingreso.clienteId : "";
    document.getElementById("ingreso-nombre-manual").value = ingreso.nombreManual || "";
    document.getElementById("ingreso-ruc").value = ingreso.ruc || "";
    document.getElementById("ingreso-categoria").value = ingreso.categoria || "cuotas";
    document.getElementById("ingreso-concepto").value = ingreso.concepto;
    document.getElementById("ingreso-monto").value = ingreso.monto;
    document.getElementById("ingreso-metodo").value = ingreso.metodoPago;

    // Toggle de visibilidad de wrappers
    this.handleTipoPagadorChange();

    UI.openModal("modal-ingreso-backdrop");
  },

  deleteIngreso(ingresoId) {
    if (!confirm("¿Está seguro de que desea eliminar este registro de ingreso?")) return;
    
    let ingresos = DB.get("ingresos", []);
    const matching = ingresos.find(i => i.id === ingresoId);
    const details = matching ? `Monto: ₲ ${matching.monto.toLocaleString()} - Concepto: ${matching.concepto}` : `ID: ${ingresoId}`;
    
    ingresos = ingresos.filter(i => i.id !== ingresoId);
    DB.save("ingresos", ingresos);
    DB.logAuditoria("ELIMINAR_INGRESO", `Cobro de caja eliminado permanentemente. (${details})`);
    
    UI.showToast("Ingreso eliminado correctamente.", "warning");
    this.renderViewData("ingresos");
  },

  handleTipoPagadorChange() {
    const tipo = document.getElementById("ingreso-tipo-pagador").value;
    const wrapSocio = document.getElementById("wrapper-ingreso-socio");
    const wrapCliente = document.getElementById("wrapper-ingreso-cliente");
    const wrapManual = document.getElementById("wrapper-ingreso-nombre-manual");
    const rucInput = document.getElementById("ingreso-ruc");

    if (wrapSocio) wrapSocio.style.display = tipo === "socio" ? "block" : "none";
    if (wrapCliente) wrapCliente.style.display = tipo === "cliente" ? "block" : "none";
    if (wrapManual) wrapManual.style.display = tipo === "ocasional" ? "block" : "none";

    // Limpiar RUC y selects correspondientes al cambiar
    if (rucInput) rucInput.value = "";
    
    if (tipo === "socio") {
      const selectSocio = document.getElementById("ingreso-socio-id");
      if (selectSocio) selectSocio.value = "";
    } else if (tipo === "cliente") {
      const selectCliente = document.getElementById("ingreso-cliente-id");
      if (selectCliente) selectCliente.value = "";
    } else if (tipo === "ocasional") {
      const inputManual = document.getElementById("ingreso-nombre-manual");
      if (inputManual) inputManual.value = "";
    }
  },

  saveNuevoCliente() {
    const nombre = document.getElementById("nuevo-cliente-nombre").value;
    const ruc = document.getElementById("nuevo-cliente-ruc").value;
    const telefono = document.getElementById("nuevo-cliente-telefono").value;

    if (!nombre || !ruc) {
      alert("Por favor, completa los campos requeridos para el cliente.");
      return;
    }

    const clientes = DB.get("clientes", []);
    const maxId = clientes.reduce((max, c) => c.id > max ? c.id : max, 0);
    const nuevoId = maxId + 1;

    const nuevoCliente = {
      id: nuevoId,
      nombre,
      ruc,
      telefono: telefono || "",
      email: ""
    };

    clientes.push(nuevoCliente);
    DB.save("clientes", clientes);
    DB.logAuditoria("CREAR_CLIENTE", `Cliente comercial ${nombre} (RUC: ${ruc}) registrado.`);

    // Cerrar mini-modal
    UI.closeModal("modal-nuevo-cliente-backdrop");

    // Limpiar formulario de nuevo cliente
    document.getElementById("form-nuevo-cliente").reset();

    // Re-renderizar ingresos para actualizar los selectores
    UI.renderIngresos();

    // Auto-seleccionar el cliente recién registrado y rellenar su RUC
    const selectCliente = document.getElementById("ingreso-cliente-id");
    if (selectCliente) {
      selectCliente.value = nuevoId;
      const rucInput = document.getElementById("ingreso-ruc");
      if (rucInput) {
        rucInput.value = ruc;
      }
    }

    UI.showToast("Cliente comercial registrado y seleccionado.", "success");
  },

  saveIngresoForm() {
    // Regla de Negocio: La caja debe estar abierta para recibir ingresos
    const caja = DB.get("caja", {});
    if (!caja.abierta) {
      alert("Error: Debes ABRIR LA CAJA DIARIA en el módulo de Caja antes de poder registrar un ingreso financiero.");
      return;
    }

    const ingresos = DB.get("ingresos", []);
    const tipoPagador = document.getElementById("ingreso-tipo-pagador").value;
    const socioId = document.getElementById("ingreso-socio-id").value;
    const clienteId = document.getElementById("ingreso-cliente-id").value;
    const nombreManual = document.getElementById("ingreso-nombre-manual").value;
    const ruc = document.getElementById("ingreso-ruc").value || "N/A";
    const categoria = document.getElementById("ingreso-categoria").value || "cuotas";
    const concepto = document.getElementById("ingreso-concepto").value;
    const monto = parseFloat(document.getElementById("ingreso-monto").value);
    const metodoPago = document.getElementById("ingreso-metodo").value;

    if (isNaN(monto) || monto <= 0) {
      alert("Por favor, ingresa un monto válido.");
      return;
    }

    let targetIngreso;

    if (this.editingIngresoId) {
      const idx = ingresos.findIndex(i => i.id === this.editingIngresoId);
      if (idx !== -1) {
        ingresos[idx].tipoPagador = tipoPagador;
        ingresos[idx].socioId = (tipoPagador === "socio" && socioId) ? parseInt(socioId) : null;
        ingresos[idx].clienteId = (tipoPagador === "cliente" && clienteId) ? parseInt(clienteId) : null;
        ingresos[idx].nombreManual = tipoPagador === "ocasional" ? nombreManual : "";
        ingresos[idx].ruc = ruc;
        ingresos[idx].categoria = categoria;
        ingresos[idx].concepto = concepto;
        ingresos[idx].monto = monto;
        ingresos[idx].metodoPago = metodoPago;
        targetIngreso = ingresos[idx];
        DB.save("ingresos", ingresos);
        DB.logAuditoria("MODIFICAR_INGRESO", `Cobro ID: ${this.editingIngresoId} modificado. Nuevo Monto: ₲ ${monto.toLocaleString()} - Concepto: ${concepto}`);
      }
      this.editingIngresoId = null;
      UI.closeModal("modal-ingreso-backdrop");
      UI.showToast("Ingreso actualizado correctamente.", "success");
    } else {
      const maxId = ingresos.reduce((max, i) => i.id > max ? i.id : max, 0);
      const nuevoIngreso = {
        id: maxId + 1,
        fecha: new Date().toISOString(),
        tipoPagador,
        socioId: (tipoPagador === "socio" && socioId) ? parseInt(socioId) : null,
        clienteId: (tipoPagador === "cliente" && clienteId) ? parseInt(clienteId) : null,
        nombreManual: tipoPagador === "ocasional" ? nombreManual : "",
        ruc,
        categoria,
        concepto,
        monto,
        metodoPago,
        usuario: this.currentUser.usuario
      };
      targetIngreso = nuevoIngreso;
      ingresos.push(nuevoIngreso);
      DB.save("ingresos", ingresos);
      DB.logAuditoria("CREAR_INGRESO", `Nuevo cobro registrado. Monto: ₲ ${monto.toLocaleString()} - Concepto: ${concepto} - Categoría: ${categoria}`);

      // Actualizar el estado de morosidad si pagó su cuota
      if (tipoPagador === "socio" && socioId && concepto.toLowerCase().includes("cuota")) {
        const socios = DB.get("socios", []);
        const socioIdx = socios.findIndex(s => s.id === parseInt(socioId));
        if (socioIdx !== -1) {
          const socioNombre = socios[socioIdx].nombre;
          socios[socioIdx].estado = "Activo";
          // Extender fecha de vencimiento a un mes después
          const vDate = new Date();
          vDate.setMonth(vDate.getMonth() + 1);
          socios[socioIdx].fechaVencimiento = vDate.toISOString().split('T')[0];
          DB.save("socios", socios);
          DB.logAuditoria("MODIFICAR_SOCIO", `Socio ${socioNombre} restablecido a estado ACTIVO por pago de cuota.`);
        }
      }

      UI.closeModal("modal-ingreso-backdrop");
      UI.showToast("Ingreso registrado en caja correctamente.", "success");
      
      // Generar recibo automáticamente en el navegador solo para nuevos registros
      setTimeout(() => {
        const socios = DB.get("socios", []);
        const socio = (tipoPagador === "socio" && socioId) ? socios.find(s => s.id === parseInt(socioId)) : null;
        ReceiptManager.generatePDF(nuevoIngreso, socio);
      }, 500);
    }

    this.renderViewData("ingresos");
  },

  openAddEgresoModal() {
    this.editingEgresoId = null;
    const header = document.querySelector("#modal-egreso-backdrop h3");
    if (header) header.innerText = "Registrar Egreso (Gasto de Caja)";
    
    // Limpiar campos
    document.getElementById("egreso-concepto").value = "";
    document.getElementById("egreso-categoria").value = "mantenimiento";
    document.getElementById("egreso-monto").value = "";
    document.getElementById("egreso-comprobante").value = "";
    
    UI.openModal("modal-egreso-backdrop");
  },

  openEditEgresoModal(egresoId) {
    const egresos = DB.get("egresos", []);
    const egreso = egresos.find(e => e.id === egresoId);
    if (!egreso) return;

    this.editingEgresoId = egresoId;
    const header = document.querySelector("#modal-egreso-backdrop h3");
    if (header) header.innerText = "Editar Egreso de Caja";
    
    // Rellenar campos
    document.getElementById("egreso-concepto").value = egreso.concepto;
    document.getElementById("egreso-categoria").value = egreso.categoria;
    document.getElementById("egreso-monto").value = egreso.monto;
    
    UI.openModal("modal-egreso-backdrop");
  },

  deleteEgreso(egresoId) {
    if (!confirm("¿Está seguro de que desea eliminar este registro de egreso?")) return;
    
    let egresos = DB.get("egresos", []);
    const matching = egresos.find(e => e.id === egresoId);
    const details = matching ? `Monto: ₲ ${matching.monto.toLocaleString()} - Concepto: ${matching.concepto}` : `ID: ${egresoId}`;

    egresos = egresos.filter(e => e.id !== egresoId);
    DB.save("egresos", egresos);
    DB.logAuditoria("ELIMINAR_EGRESO", `Egreso de caja eliminado permanentemente. (${details})`);
    
    UI.showToast("Egreso eliminado correctamente.", "warning");
    this.renderViewData("egresos");
  },

  saveEgresoForm() {
    // Regla de Negocio: La caja debe estar abierta para registrar egresos
    const caja = DB.get("caja", {});
    if (!caja.abierta) {
      alert("Error: Debes ABRIR LA CAJA DIARIA antes de registrar un egreso de fondos del club.");
      return;
    }

    const egresos = DB.get("egresos", []);
    const concepto = document.getElementById("egreso-concepto").value;
    const categoria = document.getElementById("egreso-categoria").value;
    const monto = parseFloat(document.getElementById("egreso-monto").value);
    const comprobanteName = document.getElementById("egreso-comprobante").value;

    if (isNaN(monto) || monto <= 0) {
      alert("Por favor, ingresa un monto válido.");
      return;
    }

    if (this.editingEgresoId) {
      const idx = egresos.findIndex(e => e.id === this.editingEgresoId);
      if (idx !== -1) {
        egresos[idx].concepto = concepto;
        egresos[idx].categoria = categoria;
        egresos[idx].monto = monto;
        if (comprobanteName) {
          egresos[idx].comprobante = comprobanteName.split('\\').pop() || "Factura_Digital.pdf";
        }
        DB.save("egresos", egresos);
        DB.logAuditoria("MODIFICAR_EGRESO", `Egreso ID: ${this.editingEgresoId} modificado. Nuevo Monto: ₲ ${monto.toLocaleString()} - Concepto: ${concepto}`);
      }
      this.editingEgresoId = null;
      UI.closeModal("modal-egreso-backdrop");
      UI.showToast("Egreso actualizado correctamente.", "success");
    } else {
      const maxId = egresos.reduce((max, e) => e.id > max ? e.id : max, 0);
      const nuevoEgreso = {
        id: maxId + 1,
        fecha: new Date().toISOString(),
        concepto,
        categoria,
        monto,
        comprobante: comprobanteName ? comprobanteName.split('\\').pop() : "Factura_Digital.pdf",
        usuario: this.currentUser.usuario
      };
      egresos.push(nuevoEgreso);
      DB.save("egresos", egresos);
      DB.logAuditoria("CREAR_EGRESO", `Nuevo egreso registrado. Monto: ₲ ${monto.toLocaleString()} - Concepto: ${concepto} - Categoría: ${categoria}`);

      UI.closeModal("modal-egreso-backdrop");
      UI.showToast("Egreso registrado correctamente de la caja.", "success");
    }

    this.renderViewData("egresos");
  },

  downloadReceipt(ingresoId) {
    const ingresos = DB.get("ingresos", []);
    const socios = DB.get("socios", []);

    const ingreso = ingresos.find(i => i.id === ingresoId);
    if (!ingreso) return;

    const socio = socios.find(s => s.id === ingreso.socioId);
    ReceiptManager.generatePDF(ingreso, socio);
  },

  setTransaccionesTab(tabName) {
    this.transaccionesTab = tabName;
    
    // Cambiar clases active y estilos de botones
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.classList.remove("active");
      btn.style.background = "transparent";
      btn.style.color = "var(--text-secondary)";
    });
    
    const activeBtn = document.getElementById(`tab-transacciones-${tabName.toLowerCase()}`);
    if (activeBtn) {
      activeBtn.classList.add("active");
      activeBtn.style.background = "rgba(59, 130, 246, 0.15)";
      activeBtn.style.color = "var(--primary)";
    }
    
    // Volver a renderizar la tabla
    UI.renderIngresos();
  },

  showReceiptPreview(id, tipo) {
    const isIngreso = tipo === "INGRESO";
    const record = isIngreso ? 
      DB.get("ingresos", []).find(i => i.id === id) : 
      DB.get("egresos", []).find(e => e.id === id);

    if (!record) return;

    // Actualizar campos del modal
    const refCode = isIngreso ? `REC-${String(record.id).padStart(6, '0')}` : `EXP-${String(record.id).padStart(6, '0')}`;
    document.getElementById("recibo-vista-nro").innerText = refCode;
    
    const dateStr = new Date(record.fecha).toLocaleDateString("es-PY");
    document.getElementById("recibo-vista-fecha").innerText = dateStr;
    
    // Operador y método
    const users = DB.get("usuarios", []);
    const matchingUser = users.find(u => u.usuario === record.usuario);
    const userDisplay = matchingUser ? matchingUser.nombre : record.usuario;
    document.getElementById("recibo-vista-operador").innerText = userDisplay;
    document.getElementById("recibo-vista-metodo").innerText = isIngreso ? record.metodoPago : "Efectivo";

    // Concepto
    let pagadorName = "";
    if (isIngreso) {
      if (record.tipoPagador === "socio" || (record.socioId && !record.tipoPagador)) {
        const socios = DB.get("socios", []);
        const socio = socios.find(s => s.id === parseInt(record.socioId));
        pagadorName = socio ? ` - ${socio.nombre}` : "";
      } else if (record.tipoPagador === "cliente" || record.clienteId) {
        const clientes = DB.get("clientes", []);
        const cliente = clientes.find(c => c.id === parseInt(record.clienteId));
        pagadorName = cliente ? ` - ${cliente.nombre}` : "";
      } else if (record.tipoPagador === "ocasional" || record.nombreManual) {
        pagadorName = ` - ${record.nombreManual || "Cliente General"}`;
      }
    }
    
    const fullConcept = isIngreso ? `${record.concepto}${pagadorName}` : record.concepto;
    document.getElementById("recibo-vista-concepto").innerText = fullConcept;

    // Clase/Categoría
    const catLabels = {
      cuotas: "CUOTAS",
      alquiler_canchas: "ALQUILER",
      cantina: "CANTINA",
      eventos: "EVENTOS",
      rifas: "RIFAS",
      mantenimiento: "MANTENIMIENTO",
      arbitraje: "ARBITRAJE",
      salarios: "SALARIOS",
      luz: "LUZ",
      agua: "AGUA",
      compras: "COMPRAS",
      otros: "OTROS"
    };
    document.getElementById("recibo-vista-clase").innerText = catLabels[record.categoria] || record.categoria.toUpperCase();

    // Monto
    document.getElementById("recibo-vista-monto").innerText = `₲ ${new Intl.NumberFormat("es-PY").format(record.monto)}`;

    // Botón de descargar PDF
    const downloadBtn = document.getElementById("btn-descargar-recibo-pdf");
    if (downloadBtn) {
      const newBtn = downloadBtn.cloneNode(true);
      downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);
      
      newBtn.addEventListener("click", () => {
        if (isIngreso) {
          const socios = DB.get("socios", []);
          const socio = socios.find(s => s.id === parseInt(record.socioId));
          ReceiptManager.generatePDF(record, socio);
        } else {
          ReceiptManager.generatePDF(record);
        }
      });
    }

    UI.openModal("modal-recibo-vista-backdrop");
    lucide.createIcons();
  },

  openEditCierreModal(cierreId) {
    const caja = DB.get("caja", {});
    const historial = caja.historial || [];
    const closure = historial.find(h => h.id === cierreId);
    if (!closure) return;

    this.editingCierreId = cierreId;
    
    // Rellenar campos
    document.getElementById("editar-cierre-id").value = closure.id;
    document.getElementById("editar-cierre-monto-inicial").value = closure.montoInicial;
    document.getElementById("editar-cierre-ingresos").value = closure.ingresos;
    document.getElementById("editar-cierre-egresos").value = closure.egresos;
    document.getElementById("editar-cierre-monto-final").value = closure.montoFinal;

    UI.openModal("modal-editar-cierre-backdrop");
  },

  deleteCierre(cierreId) {
    if (!confirm("¿Está seguro de que desea eliminar este cierre de caja del historial?")) return;

    const caja = DB.get("caja", {});
    let historial = caja.historial || [];
    const matching = historial.find(h => h.id === cierreId);
    const details = matching ? `Cierre ID: ${cierreId} - Monto Final ₲ ${matching.montoFinal.toLocaleString()}` : `Cierre ID: ${cierreId}`;

    historial = historial.filter(h => h.id !== cierreId);
    caja.historial = historial;
    
    DB.save("caja", caja);
    DB.logAuditoria("ELIMINAR_CIERRE", `Registro de cierre de caja eliminado del historial. (${details})`);
    
    UI.showToast("Cierre de caja eliminado correctamente.", "warning");
    
    this.renderViewData(this.currentView);
  },

  saveEditarCierreForm() {
    const closureId = parseInt(document.getElementById("editar-cierre-id").value);
    const montoInicial = parseFloat(document.getElementById("editar-cierre-monto-inicial").value) || 0;
    const ingresos = parseFloat(document.getElementById("editar-cierre-ingresos").value) || 0;
    const egresos = parseFloat(document.getElementById("editar-cierre-egresos").value) || 0;
    const montoFinal = Math.max(0, montoInicial + ingresos - egresos);

    const caja = DB.get("caja", {});
    const historial = caja.historial || [];
    const idx = historial.findIndex(h => h.id === closureId);
    
    if (idx !== -1) {
      historial[idx].montoInicial = montoInicial;
      historial[idx].ingresos = ingresos;
      historial[idx].egresos = egresos;
      historial[idx].montoFinal = montoFinal;
      
      caja.historial = historial;
      DB.save("caja", caja);
      DB.logAuditoria("MODIFICAR_CIERRE", `Arqueo contable de Cierre #${closureId} ajustado. Nuevo Saldo Final ₲ ${montoFinal.toLocaleString()}`);
      
      UI.closeModal("modal-editar-cierre-backdrop");
      UI.showToast("Cierre de caja actualizado con éxito.", "success");
      
      this.renderViewData(this.currentView);
    }
  },

  /**
   * Imprimir Libro de Ingresos
   */
  printIngresosReport() {
    const mesFiltroSelect = document.getElementById("filtro-ingreso-mes");
    const anioFiltroSelect = document.getElementById("filtro-ingreso-anio");
    const mesFiltro = mesFiltroSelect ? mesFiltroSelect.value : "todos";
    const anioFiltro = anioFiltroSelect ? anioFiltroSelect.value : "todos";

    const ingresos = DB.get("ingresos", []);
    const socios = DB.get("socios", []);
    const clientes = DB.get("clientes", []);

    let filtered = [...ingresos];

    if (mesFiltro !== "todos") {
      filtered = filtered.filter(i => new Date(i.fecha).getMonth() === parseInt(mesFiltro));
    }
    if (anioFiltro !== "todos") {
      filtered = filtered.filter(i => new Date(i.fecha).getFullYear() === parseInt(anioFiltro));
    }

    filtered.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    const resolved = filtered.map(i => {
      let pagadorName = "Cliente General";
      if (i.tipoPagador === "socio" || (i.socioId && !i.tipoPagador)) {
        const socio = socios.find(s => s.id === parseInt(i.socioId));
        pagadorName = socio ? socio.nombre : "Socio no Encontrado";
      } else if (i.tipoPagador === "cliente" || i.clienteId) {
        const cliente = clientes.find(c => c.id === parseInt(i.clienteId));
        pagadorName = cliente ? cliente.nombre : "Cliente Comercial";
      } else if (i.tipoPagador === "ocasional" || i.nombreManual) {
        pagadorName = i.nombreManual || "Cliente General";
      }

      const catLabels = {
        cuotas: "93190 - Cuota Social",
        alquiler_comercial: "68100 - Alquiler Comercial",
        electricidad: "35101 - Reembolso ANDE",
        alquiler_canchas: "93190 - Canchas / Deportes",
        cantina: "Cantina / Consumos",
        otros: "Otros Ingresos"
      };

      return {
        fecha: i.fecha,
        concepto: i.concepto,
        pagador: pagadorName,
        metodoPago: i.metodoPago,
        monto: i.monto,
        ruc: i.ruc || "N/A",
        tipo: "INGRESO"
      };
    });

    ReceiptManager.printHTMLReport("ingresos", mesFiltro, anioFiltro, resolved);
  },

  /**
   * Imprimir Libro de Egresos
   */
  printEgresosReport() {
    const mesFiltroSelect = document.getElementById("filtro-egreso-mes");
    const anioFiltroSelect = document.getElementById("filtro-egreso-anio");
    const mesFiltro = mesFiltroSelect ? mesFiltroSelect.value : "todos";
    const anioFiltro = anioFiltroSelect ? anioFiltroSelect.value : "todos";

    const egresos = DB.get("egresos", []);

    let filtered = [...egresos];

    if (mesFiltro !== "todos") {
      filtered = filtered.filter(e => new Date(e.fecha).getMonth() === parseInt(mesFiltro));
    }
    if (anioFiltro !== "todos") {
      filtered = filtered.filter(e => new Date(e.fecha).getFullYear() === parseInt(anioFiltro));
    }

    filtered.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    const resolved = filtered.map(e => {
      return {
        fecha: e.fecha,
        concepto: e.concepto,
        categoria: e.categoria,
        comprobante: e.comprobante || "Sin Comprobante",
        monto: e.monto,
        tipo: "EGRESO"
      };
    });

    ReceiptManager.printHTMLReport("egresos", mesFiltro, anioFiltro, resolved);
  },

  /**
   * Imprimir Libro de Caja Diaria
   */
  printCajaDiariaReport() {
    const mesFiltroSelect = document.getElementById("filtro-caja-mes");
    const anioFiltroSelect = document.getElementById("filtro-caja-anio");
    const mesFiltro = mesFiltroSelect ? mesFiltroSelect.value : "todos";
    const anioFiltro = anioFiltroSelect ? anioFiltroSelect.value : "todos";

    const ingresos = DB.get("ingresos", []);
    const egresos = DB.get("egresos", []);
    const socios = DB.get("socios", []);
    const clientes = DB.get("clientes", []);

    let filteredIngresos = [...ingresos];
    let filteredEgresos = [...egresos];

    if (mesFiltro !== "todos") {
      filteredIngresos = filteredIngresos.filter(i => new Date(i.fecha).getMonth() === parseInt(mesFiltro));
      filteredEgresos = filteredEgresos.filter(e => new Date(e.fecha).getMonth() === parseInt(mesFiltro));
    }
    if (anioFiltro !== "todos") {
      filteredIngresos = filteredIngresos.filter(i => new Date(i.fecha).getFullYear() === parseInt(anioFiltro));
      filteredEgresos = filteredEgresos.filter(e => new Date(e.fecha).getFullYear() === parseInt(anioFiltro));
    }

    const mappedIngresos = filteredIngresos.map(i => {
      let pagadorName = "Cliente General";
      if (i.tipoPagador === "socio" || (i.socioId && !i.tipoPagador)) {
        const socio = socios.find(s => s.id === parseInt(i.socioId));
        pagadorName = socio ? socio.nombre : "Socio no Encontrado";
      } else if (i.tipoPagador === "cliente" || i.clienteId) {
        const cliente = clientes.find(c => c.id === parseInt(i.clienteId));
        pagadorName = cliente ? cliente.nombre : "Cliente Comercial";
      } else if (i.tipoPagador === "ocasional" || i.nombreManual) {
        pagadorName = i.nombreManual || "Cliente General";
      }
      
      const catLabels = {
        cuotas: "93190 - Cuota Social",
        alquiler_comercial: "68100 - Alquiler Comercial",
        electricidad: "35101 - Reembolso ANDE",
        alquiler_canchas: "93190 - Canchas / Deportes",
        cantina: "Cantina / Consumos",
        otros: "Otros Ingresos"
      };

      return {
        fecha: i.fecha,
        tipo: "INGRESO",
        concepto: i.concepto,
        pagador: pagadorName,
        categoria: catLabels[i.categoria] || i.categoria || "Otros",
        metodoPago: i.metodoPago,
        monto: i.monto,
        usuario: i.usuario
      };
    });

    const mappedEgresos = filteredEgresos.map(e => {
      return {
        fecha: e.fecha,
        tipo: "EGRESO",
        concepto: e.concepto,
        categoria: e.categoria,
        comprobante: e.comprobante || "Sin Comprobante",
        monto: e.monto,
        usuario: e.usuario
      };
    });

    const movimientos = [...mappedIngresos, ...mappedEgresos];
    movimientos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    ReceiptManager.printHTMLReport("caja", mesFiltro, anioFiltro, movimientos);
  },

  /**
   * Exportar base de datos LocalStorage completa a JSON para Respaldo Manual
   */
  exportManualBackup() {
    try {
      const backupData = {};
      const prefix = typeof DB_KEY_PREFIX !== "undefined" ? DB_KEY_PREFIX : "club_nacional_sdg_";
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(prefix)) {
          const raw = localStorage.getItem(key);
          try {
            backupData[key] = JSON.parse(raw);
          } catch(e) {
            backupData[key] = raw;
          }
        }
      });

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/T/, "_").replace(/:/g, "-").split(".")[0];
      link.href = url;
      link.download = `backup_club_nacional_sdg_${timestamp}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      DB.logAuditoria("RESPALDO_MANUAL", "Copia de seguridad contable (JSON) exportada y descargada manualmente.");
      UI.showToast("Copia de seguridad descargada con éxito.", "success");
    } catch(err) {
      console.error("Fallo al exportar backup manual:", err);
      UI.showToast("Error al exportar la base de datos.", "danger");
    }
  },

  /**
   * Colapsar Sidebar en pantallas medianas
   */
  toggleSidebar() {
    const sidebar = document.getElementById("app-sidebar");
    if (sidebar) {
      if (window.innerWidth <= 768) {
        sidebar.classList.toggle("active");
      } else {
        sidebar.classList.toggle("collapsed");
      }
    }
  }
};

// Arrancar App al cargar el script
window.addEventListener("DOMContentLoaded", () => {
  App.init();
});
