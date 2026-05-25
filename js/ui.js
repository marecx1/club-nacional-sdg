/**
 * Club Manager Pro PY - Renderizador de UI y Componentes Interactivos
 */

const UI = {
  // Instancias de gráficos para destruirlos antes de volver a crearlos
  charts: {
    finanzas: null,
    socios: null
  },

  /**
   * Formatear número a moneda paraguaya (Gs.)
   */
  formatCurrency(value) {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0
    }).format(value);
  },

  /**
   * Mostrar Notificación Toast en pantalla
   */
  showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    let icon = "check-circle";
    if (type === "warning") icon = "alert-triangle";
    if (type === "danger") icon = "x-circle";

    toast.innerHTML = `
      <i data-lucide="${icon}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    // Auto-eliminar después de 4 segundos con animación
    setTimeout(() => {
      toast.classList.add("fade-out");
      toast.addEventListener("animationend", () => {
        toast.remove();
      });
    }, 4000);
  },

  /**
   * Abrir un Modal
   */
  openModal(modalId) {
    const backdrop = document.getElementById(modalId);
    if (backdrop) {
      backdrop.classList.add("active");
    }
  },

  /**
   * Cerrar un Modal
   */
  closeModal(modalId) {
    const backdrop = document.getElementById(modalId);
    if (backdrop) {
      backdrop.classList.remove("active");
    }
  },

  /**
   * ==========================================================================
   * RENDER: DASHBOARD PRINCIPAL
   * ==========================================================================
   */
  renderDashboard() {
    const socios = DB.get("socios", []);
    const ingresos = DB.get("ingresos", []);
    const egresos = DB.get("egresos", []);
    const caja = DB.get("caja", {});

    // 1. Cálculos de KPIs
    const totalSocios = socios.length;
    const sociosActivos = socios.filter(s => s.estado === "Activo").length;
    const sociosMorosos = socios.filter(s => s.estado === "Moroso").length;

    // Calcular ingresos y egresos del mes actual (Mayo 2026 en esta demo)
    const hoy = new Date();
    const mesActual = 4; // Mayo (0-indexed es 4)
    const anioActual = 2026;

    const ingresosMes = ingresos
      .filter(i => {
        const d = new Date(i.fecha);
        return d.getMonth() === mesActual && d.getFullYear() === anioActual;
      })
      .reduce((sum, i) => sum + i.monto, 0);

    const egresosMes = egresos
      .filter(e => {
        const d = new Date(e.fecha);
        return d.getMonth() === mesActual && d.getFullYear() === anioActual;
      })
      .reduce((sum, e) => sum + e.monto, 0);

    const saldoTotal = ingresos.reduce((sum, i) => sum + i.monto, 0) - egresos.reduce((sum, e) => sum + e.monto, 0);

    // Actualizar elementos DOM de KPIs
    document.getElementById("kpi-total-socios").innerText = totalSocios;
    document.getElementById("kpi-socios-activos").innerText = sociosActivos;
    document.getElementById("kpi-socios-morosos").innerText = sociosMorosos;
    document.getElementById("kpi-ingresos-mes").innerText = this.formatCurrency(ingresosMes);
    document.getElementById("kpi-egresos-mes").innerText = this.formatCurrency(egresosMes);
    document.getElementById("kpi-saldo-total").innerText = this.formatCurrency(saldoTotal);

    // 2. Gráficos Estadísticos (Chart.js)
    this.initDashboardCharts(ingresosMes, egresosMes, socios);

    // 3. Actividad Reciente (Últimas 5 transacciones/registros combinados)
    this.renderRecentActivity(ingresos, egresos, socios);
  },

  initDashboardCharts(ingresosMes, egresosMes, socios) {
    const ctxFinanzas = document.getElementById("chart-finanzas");
    const ctxSocios = document.getElementById("chart-socios");

    if (!ctxFinanzas || !ctxSocios) return;

    // Destruir gráficos anteriores si existen para evitar solapamientos
    if (this.charts.finanzas) this.charts.finanzas.destroy();
    if (this.charts.socios) this.charts.socios.destroy();

    // Estilos globales de Chart.js para modo oscuro/claro
    const isDark = !document.body.classList.contains("light-theme");
    const gridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(15, 23, 42, 0.05)";
    const textColor = isDark ? "#94a3b8" : "#475569";

    // Gráfico de Finanzas (Barras)
    this.charts.finanzas = new Chart(ctxFinanzas, {
      type: 'bar',
      data: {
        labels: ['Ingresos del Mes', 'Egresos del Mes'],
        datasets: [{
          data: [ingresosMes, egresosMes],
          backgroundColor: ['#10b981', '#ef4444'],
          borderRadius: 8,
          borderWidth: 0,
          barThickness: 45
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor }
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              callback: (value) => this.formatCurrency(value).replace("Gs.", "")
            }
          }
        }
      }
    });

    // Gráfico de Socios (Dona)
    const categoriasCount = { Titular: 0, Familiar: 0, Juvenil: 0, Vitalicio: 0 };
    socios.forEach(s => {
      if (categoriasCount[s.categoria] !== undefined) {
        categoriasCount[s.categoria]++;
      }
    });

    this.charts.socios = new Chart(ctxSocios, {
      type: 'doughnut',
      data: {
        labels: ['Titular', 'Familiar', 'Juvenil', 'Vitalicio'],
        datasets: [{
          data: [
            categoriasCount.Titular,
            categoriasCount.Familiar,
            categoriasCount.Juvenil,
            categoriasCount.Vitalicio
          ],
          backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'],
          borderColor: isDark ? '#0e1222' : '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: textColor,
              font: { family: 'Inter', size: 11 },
              boxWidth: 12
            }
          }
        },
        cutout: '65%'
      }
    });
  },

  renderRecentActivity(ingresos, egresos, socios) {
    const listContainer = document.getElementById("dashboard-activity-list");
    if (!listContainer) return;

    // Combinar actividades en una lista unificada
    const actividades = [];

    // Tomar los últimos 5 ingresos
    ingresos.forEach(i => {
      actividades.push({
        tipo: "ingreso",
        titulo: `Ingreso: ${i.concepto}`,
        monto: `+ ${this.formatCurrency(i.monto)}`,
        fecha: new Date(i.fecha),
        icon: "arrow-up-right",
        usuario: i.usuario
      });
    });

    // Tomar los últimos 5 egresos
    egresos.forEach(e => {
      actividades.push({
        tipo: "egreso",
        titulo: `Egreso: ${e.concepto}`,
        monto: `- ${this.formatCurrency(e.monto)}`,
        fecha: new Date(e.fecha),
        icon: "arrow-down-left",
        usuario: e.usuario
      });
    });

    // Tomar los últimos 5 socios registrados
    socios.slice(-4).forEach(s => {
      actividades.push({
        tipo: "socio",
        titulo: `Nuevo Socio: ${s.nombre}`,
        monto: s.nroSocio,
        fecha: new Date(s.fechaIngreso + "T08:00:00"),
        icon: "user-plus",
        usuario: "secretario"
      });
    });

    // Ordenar por fecha descendente y tomar las 5 más recientes
    actividades.sort((a, b) => b.fecha - a.fecha);
    const topActividades = actividades.slice(0, 5);

    if (topActividades.length === 0) {
      listContainer.innerHTML = `<p class="activity-meta">No hay actividad registrada hoy.</p>`;
      return;
    }

    listContainer.innerHTML = topActividades
      .map(act => {
        const timeAgo = this.getTimeAgo(act.fecha);
        return `
          <div class="activity-item">
            <div class="activity-icon-wrapper ${act.tipo}">
              <i data-lucide="${act.icon}"></i>
            </div>
            <div class="activity-details">
              <div class="activity-title">${act.titulo}</div>
              <div class="activity-meta">${timeAgo} • Registrado por: ${act.usuario}</div>
            </div>
            <div class="activity-value" style="margin-left: auto; font-weight: 700; font-size: 13px; color: ${
              act.tipo === 'ingreso' ? 'var(--success)' : act.tipo === 'egreso' ? 'var(--danger)' : 'var(--primary)'
            }">
              ${act.monto}
            </div>
          </div>
        `;
      })
      .join("");

    lucide.createIcons();
  },

  getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Hace un momento";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} hs`;
    return date.toLocaleDateString("es-PY");
  },

  /**
   * ==========================================================================
   * RENDER: GESTIÓN DE SOCIOS
   * ==========================================================================
   */
  renderSocios() {
    const socios = DB.get("socios", []);
    const searchVal = document.getElementById("socio-search")?.value.toLowerCase() || "";
    const filterCat = document.getElementById("socio-filter-categoria")?.value || "todos";
    const filterEst = document.getElementById("socio-filter-estado")?.value || "todos";
    const cardsGrid = document.getElementById("socios-cards-grid");

    if (!cardsGrid) return;

    // Aplicar filtros
    const filteredSocios = socios.filter(s => {
      const matchSearch = s.nombre.toLowerCase().includes(searchVal) || s.nroSocio.toLowerCase().includes(searchVal) || s.ci.includes(searchVal);
      const matchCat = filterCat === "todos" || s.categoria === filterCat;
      const matchEst = filterEst === "todos" || s.estado === filterEst;
      return matchSearch && matchCat && matchEst;
    });

    if (filteredSocios.length === 0) {
      cardsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 50px 0; display:flex; flex-direction:column; align-items:center; gap: 10px;">
          <i data-lucide="users-2" style="width: 48px; height: 48px; opacity: 0.5;"></i>
          <p>No se encontraron socios con los filtros aplicados.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    // Calcular cuota regular según categoría para mostrar
    const getCuotaRegular = (cat) => {
      if (cat === "Titular") return 120000;
      if (cat === "Familiar") return 180000;
      if (cat === "Juvenil") return 70000;
      return 0; // Vitalicio
    };

    // Dibujar Cards
    cardsGrid.innerHTML = filteredSocios
      .map(s => {
        const estClass = s.estado.toLowerCase();
        const tienePermisoEscritura = ["Administrador", "Secretario"].includes(App.currentUser.rol);
        const btnEliminar = tienePermisoEscritura
          ? `<button class="btn-action" onclick="App.deleteSocio(${s.id})" title="Dar de Baja" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.1); width:32px; height:32px; border-radius:8px;"><i data-lucide="trash-2"></i></button>`
          : "";
        const btnEditar = tienePermisoEscritura
          ? `<button class="btn-action btn-edit-socio" onclick="App.openEditSocioModal(${s.id})" title="Editar Socio" style="color: var(--primary); border-color: rgba(59,130,246,0.1); width:32px; height:32px; border-radius:8px;"><i data-lucide="edit-3"></i></button>`
          : "";

        const cuota = getCuotaRegular(s.categoria);
        const saldoPendiente = s.estado === "Moroso" ? (s.categoria === "Familiar" ? 360000 : 150000) : 0;

        return `
          <div class="kpi-card" style="padding: 20px; display: flex; flex-direction: column; gap: 15px; border-radius: 14px; background: var(--card-bg); border: 1px solid var(--card-border); box-shadow: var(--shadow-md);">
            <!-- Header de la Card -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%;">
              <div class="socio-cell" style="gap: 12px; display:flex; align-items:center;">
                <img class="socio-avatar" src="${s.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80'}" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80'" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;">
                <div class="socio-details">
                  <div class="socio-name" style="font-weight: 700; font-size: 15px;">${s.nombre}</div>
                  <div class="socio-sub" style="font-size: 12px; color: var(--text-muted);">${s.nroSocio} • CI: ${s.ci}</div>
                </div>
              </div>
              <span class="status-badge ${estClass}" style="padding: 3px 10px; font-size: 10px; font-weight: 700; border-radius: 20px; text-transform: uppercase;">
                ${s.estado}
              </span>
            </div>

            <!-- Cuerpo de la Card -->
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: var(--text-secondary); border-top: 1px solid rgba(255,255,255,0.04); padding-top: 12px;">
              <div style="display: flex; justify-content: space-between;">
                <span>Plan:</span>
                <strong style="color: var(--text-primary);">${s.categoria}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Cuota regular:</span>
                <strong style="color: var(--text-primary);">${this.formatCurrency(cuota)}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Próximo vencimiento:</span>
                <strong style="color: var(--text-primary);">${s.fechaVencimiento}</strong>
              </div>
              ${saldoPendiente > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-top: 4px; color: var(--danger); font-weight: 700;">
                <span>Saldo Pendiente:</span>
                <span>${this.formatCurrency(saldoPendiente)}</span>
              </div>
              ` : ''}
            </div>

            <!-- Footer de la Card -->
            <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 12px; margin-top: 5px;">
              <a href="#" onclick="UI.showCarnet(${s.id}); return false;" style="font-size: 13px; color: var(--warning); font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
                <i data-lucide="credit-card" style="width: 16px; height: 16px;"></i> Ver Carnet Digital
              </a>
              <div style="display: flex; gap: 8px;">
                ${btnEditar}
                ${btnEliminar}
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    lucide.createIcons();
  },

  /**
   * Mostrar el Carnet Digital Premium con QR
   */
  showCarnet(socioId) {
    const socios = DB.get("socios", []);
    const socio = socios.find(s => s.id === socioId);

    if (!socio) return;

    const carnetNode = document.getElementById("carnet-digital-card");
    const containerQr = document.getElementById("carnet-qr");

    if (!carnetNode || !containerQr) return;

    // Resetear clases de categoría previas
    carnetNode.className = "carnet-digital";
    carnetNode.classList.add(socio.categoria.toLowerCase());

    // Actualizar datos del DOM del Carnet
    document.getElementById("carnet-display-name").innerText = socio.nombre;
    document.getElementById("carnet-display-number").innerText = socio.nroSocio;
    document.getElementById("carnet-display-cat").innerText = socio.categoria;
    document.getElementById("carnet-display-status").innerText = socio.estado;
    document.getElementById("carnet-display-avatar").src = socio.foto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80";

    const statusBadge = document.getElementById("carnet-display-status");
    statusBadge.className = "carnet-badge status";
    statusBadge.classList.add(socio.estado.toLowerCase());

    // Generar código QR local usando QRCode.js
    containerQr.innerHTML = "";
    try {
      new QRCode(containerQr, {
        text: `CMP-SOCIO-VAL: ${socio.nroSocio} | CI: ${socio.ci} | Vence: ${socio.fechaVencimiento}`,
        width: 84,
        height: 84,
        colorDark: "#0b0f19",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
    } catch (e) {
      console.error("Error al generar QR:", e);
      containerQr.innerHTML = "<p style='font-size: 8px; color:red;'>QR Error</p>";
    }

    this.openModal("modal-carnet-backdrop");
  },

  /**
   * ==========================================================================
   * RENDER: GESTIÓN DE INGRESOS
   * ==========================================================================
   */
  renderIngresos() {
    const ingresos = DB.get("ingresos", []);
    const socios = DB.get("socios", []);
    const tableBody = document.getElementById("ingresos-table-body");

    if (!tableBody) return;

    // Cargar select de socios en el formulario de ingresos
    const selectSocio = document.getElementById("ingreso-socio-id");
    if (selectSocio) {
      selectSocio.innerHTML = `
        <option value="">-- Seleccionar Socio --</option>
        ${socios.map(s => `<option value="${s.id}">${s.nombre} (${s.nroSocio})</option>`).join("")}
      `;
    }

    // Cargar select de clientes comerciales en el formulario de ingresos
    const selectCliente = document.getElementById("ingreso-cliente-id");
    if (selectCliente) {
      const clientes = DB.get("clientes", []);
      selectCliente.innerHTML = `
        <option value="">-- Seleccionar Cliente Comercial --</option>
        ${clientes.map(c => `<option value="${c.id}">${c.nombre} (${c.ruc})</option>`).join("")}
      `;
    }

    // Filtros de fecha (Mes y Año)
    const mesFiltroSelect = document.getElementById("filtro-ingreso-mes");
    const anioFiltroSelect = document.getElementById("filtro-ingreso-anio");
    
    const mesFiltro = mesFiltroSelect ? mesFiltroSelect.value : "todos";
    const anioFiltro = anioFiltroSelect ? anioFiltroSelect.value : "todos";

    let filteredIngresos = [...ingresos];

    if (mesFiltro !== "todos") {
      filteredIngresos = filteredIngresos.filter(i => new Date(i.fecha).getMonth() === parseInt(mesFiltro));
    }
    if (anioFiltro !== "todos") {
      filteredIngresos = filteredIngresos.filter(i => new Date(i.fecha).getFullYear() === parseInt(anioFiltro));
    }

    if (filteredIngresos.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 45px 0;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; justify-content: center;">
              <i data-lucide="calendar-x" style="width: 36px; height: 36px; stroke-width: 1.5; opacity: 0.5; color: var(--warning);"></i>
              <div>
                <p style="font-weight: 700; margin-bottom: 2px; color: var(--text-primary); font-size: 14px;">No se encontraron movimientos</p>
                <p style="font-size: 12.5px; color: var(--text-muted);">No hay transacciones de ingresos en el período seleccionado.</p>
              </div>
              <button class="btn-secondary" onclick="UI.resetFiltrosIngresos()" style="padding: 5px 12px; font-size: 12px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px; margin-top: 5px; cursor: pointer; border-color: rgba(255,255,255,0.08); background: rgba(255,255,255,0.02);">
                <i data-lucide="refresh-cw" style="width: 12px; height: 12px;"></i> Restablecer Filtros
              </button>
            </div>
          </td>
        </tr>
      `;
      lucide.createIcons();
      return;
    }

    // Ordenar de más nuevo a más viejo
    filteredIngresos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Determinar nivel de acceso actual
    const rol = App.currentUser ? App.currentUser.rol : "Consulta";
    const hasFinancialAccess = ["Administrador", "Tesorero"].includes(rol);

    const catLabels = {
      cuotas: "Cuota Social",
      alquiler_comercial: "Alquiler Comercial",
      electricidad: "Reembolso Electricidad",
      alquiler_canchas: "Canchas / Deportes",
      cantina: "Cantina / Consumos",
      otros: "Otros Ingresos"
    };

    tableBody.innerHTML = filteredIngresos
      .map(i => {
        let socioNom = "Cliente General";
        if (i.tipoPagador === "socio" || (i.socioId && !i.tipoPagador)) {
          const socio = socios.find(s => s.id === parseInt(i.socioId));
          socioNom = socio ? socio.nombre : "Socio no Encontrado";
        } else if (i.tipoPagador === "cliente" || i.clienteId) {
          const clientes = DB.get("clientes", []);
          const cliente = clientes.find(c => c.id === parseInt(i.clienteId));
          socioNom = cliente ? cliente.nombre : "Cliente Comercial";
        } else if (i.tipoPagador === "ocasional" || i.nombreManual) {
          socioNom = i.nombreManual || "Cliente General";
        }

        const rucVal = i.ruc || (i.tipoPagador === "socio" && socio ? socio.ci : "N/A");
        
        // Acciones condicionales según el rol
        const actionButtons = hasFinancialAccess ? `
          <div style="display: flex; gap: 5px;">
            <button class="btn-action" onclick="App.downloadReceipt(${i.id})" title="Descargar Recibo PDF" style="color: var(--success); border-color: rgba(16, 185, 129, 0.15);">
              <i data-lucide="download"></i>
            </button>
            <button class="btn-action" onclick="App.openEditIngresoModal(${i.id})" title="Editar Ingreso" style="color: var(--primary); border-color: rgba(59, 130, 246, 0.15);">
              <i data-lucide="edit-3"></i>
            </button>
            <button class="btn-action" onclick="App.deleteIngreso(${i.id})" title="Eliminar Ingreso" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.15);">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        ` : `
          <button class="btn-action" onclick="App.downloadReceipt(${i.id})" title="Descargar Recibo PDF" style="color: var(--success); border-color: rgba(16, 185, 129, 0.15);">
            <i data-lucide="download"></i>
          </button>
        `;

        return `
          <tr>
            <td>${new Date(i.fecha).toLocaleString("es-PY")}</td>
            <td>
              <strong>${socioNom}</strong>
              ${rucVal !== "N/A" ? `<br><span style="font-size:11px; color:var(--text-muted); font-weight:normal;">R.U.C./C.I.: ${rucVal}</span>` : ''}
            </td>
            <td>${i.concepto}</td>
            <td><span class="carnet-badge cat" style="background: rgba(255,255,255,0.04); font-size: 11px;">${catLabels[i.categoria] || i.categoria || 'Otros'}</span></td>
            <td><strong style="color: var(--success);">${this.formatCurrency(i.monto)}</strong></td>
            <td><span class="carnet-badge cat" style="background: rgba(255,255,255,0.04);">${i.metodoPago}</span></td>
            <td>${actionButtons}</td>
          </tr>
        `;
      })
      .join("");

    lucide.createIcons();
  },

  /**
   * ==========================================================================
   * RENDER: GESTIÓN DE EGRESOS
   * ==========================================================================
   */
  renderEgresos() {
    const egresos = DB.get("egresos", []);
    const tableBody = document.getElementById("egresos-table-body");

    if (!tableBody) return;

    // Filtros de fecha (Mes y Año)
    const mesFiltroSelect = document.getElementById("filtro-egreso-mes");
    const anioFiltroSelect = document.getElementById("filtro-egreso-anio");
    
    const mesFiltro = mesFiltroSelect ? mesFiltroSelect.value : "todos";
    const anioFiltro = anioFiltroSelect ? anioFiltroSelect.value : "todos";

    let filteredEgresos = [...egresos];

    if (mesFiltro !== "todos") {
      filteredEgresos = filteredEgresos.filter(e => new Date(e.fecha).getMonth() === parseInt(mesFiltro));
    }
    if (anioFiltro !== "todos") {
      filteredEgresos = filteredEgresos.filter(e => new Date(e.fecha).getFullYear() === parseInt(anioFiltro));
    }

    // Determinar nivel de acceso actual
    const rol = App.currentUser ? App.currentUser.rol : "Consulta";
    const hasFinancialAccess = ["Administrador", "Tesorero"].includes(rol);

    // Ajustar visibilidad de cabecera de acciones
    const thAcciones = document.getElementById("egresos-th-acciones");
    if (thAcciones) {
      thAcciones.style.display = hasFinancialAccess ? "table-cell" : "none";
    }

    if (filteredEgresos.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="${hasFinancialAccess ? 6 : 5}" style="text-align: center; color: var(--text-muted); padding: 45px 0;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; justify-content: center;">
              <i data-lucide="calendar-x" style="width: 36px; height: 36px; stroke-width: 1.5; opacity: 0.5; color: var(--warning);"></i>
              <div>
                <p style="font-weight: 700; margin-bottom: 2px; color: var(--text-primary); font-size: 14px;">No se encontraron egresos</p>
                <p style="font-size: 12.5px; color: var(--text-muted);">No hay registros de egresos en el período seleccionado.</p>
              </div>
              <button class="btn-secondary" onclick="UI.resetFiltrosEgresos()" style="padding: 5px 12px; font-size: 12px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px; margin-top: 5px; cursor: pointer; border-color: rgba(255,255,255,0.08); background: rgba(255,255,255,0.02);">
                <i data-lucide="refresh-cw" style="width: 12px; height: 12px;"></i> Restablecer Filtros
              </button>
            </div>
          </td>
        </tr>
      `;
      lucide.createIcons();
      return;
    }

    filteredEgresos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    tableBody.innerHTML = filteredEgresos
      .map(e => {
        // Acciones condicionales según el rol
        const actionsTd = hasFinancialAccess ? `
          <td>
            <div style="display: flex; gap: 5px;">
              <button class="btn-action" onclick="App.openEditEgresoModal(${e.id})" title="Editar Egreso" style="color: var(--primary); border-color: rgba(59, 130, 246, 0.15);">
                <i data-lucide="edit-3"></i>
              </button>
              <button class="btn-action" onclick="App.deleteEgreso(${e.id})" title="Eliminar Egreso" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.15);">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </td>
        ` : "";

        return `
          <tr>
            <td>${new Date(e.fecha).toLocaleString("es-PY")}</td>
            <td>${e.concepto}</td>
            <td><span class="carnet-badge cat" style="text-transform: capitalize;">${e.categoria}</span></td>
            <td><strong style="color: var(--danger);">${this.formatCurrency(e.monto)}</strong></td>
            <td>
              <div style="font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 5px;">
                <i data-lucide="file-text" style="width: 14px; height: 14px;"></i>
                <span>${e.comprobante || 'Sin Adjunto'}</span>
              </div>
            </td>
            ${actionsTd}
          </tr>
        `;
      })
      .join("");

    lucide.createIcons();
  },

  /**
   * ==========================================================================
   * RENDER: GESTIÓN DE CAJA DIARIA
   * ==========================================================================
   */
  renderCaja() {
    const caja = DB.get("caja", {});
    const ingresos = DB.get("ingresos", []);
    const egresos = DB.get("egresos", []);

    const statusBadge = document.getElementById("topbar-caja-badge");
    const container = document.getElementById("caja-view-container");

    if (!statusBadge || !container) return;

    // 1. Actualizar Badge Global
    if (caja.abierta) {
      statusBadge.className = "caja-status-badge abierta";
      statusBadge.innerHTML = `<span class="indicator"></span>Caja Abierta`;
    } else {
      statusBadge.className = "caja-status-badge cerrada";
      statusBadge.innerHTML = `<span class="indicator"></span>Caja Cerrada`;
    }

    // Calcular totales asociados a la caja actual si está abierta
    let montoInicial = caja.montoInicial || 0;
    let totalIngresosCaja = 0;
    let totalEgresosCaja = 0;

    if (caja.abierta && caja.fechaApertura) {
      const fApertura = new Date(caja.fechaApertura);
      
      totalIngresosCaja = ingresos
        .filter(i => new Date(i.fecha) >= fApertura)
        .reduce((sum, i) => sum + i.monto, 0);

      totalEgresosCaja = egresos
        .filter(e => new Date(e.fecha) >= fApertura)
        .reduce((sum, e) => sum + e.monto, 0);
    }

    const saldoCalculado = montoInicial + totalIngresosCaja - totalEgresosCaja;

    // 2. Renderizar UI de la sección Caja
    if (caja.abierta) {
      container.innerHTML = `
        <div class="caja-info-grid">
          <div class="caja-widget">
            <div class="caja-widget-title">Monto Inicial de Apertura</div>
            <div class="caja-widget-value">${this.formatCurrency(montoInicial)}</div>
            <span class="activity-meta">Abierto: ${new Date(caja.fechaApertura).toLocaleString("es-PY")}</span>
          </div>
          <div class="caja-widget">
            <div class="caja-widget-title">Ingresos Registrados Hoy</div>
            <div class="caja-widget-value positive">+ ${this.formatCurrency(totalIngresosCaja)}</div>
            <span class="activity-meta">Cobros y aportes</span>
          </div>
          <div class="caja-widget">
            <div class="caja-widget-title">Egresos Registrados Hoy</div>
            <div class="caja-widget-value negative">- ${this.formatCurrency(totalEgresosCaja)}</div>
            <span class="activity-meta">Gastos y compras</span>
          </div>
        </div>

        <div class="chart-card" style="display:flex; flex-direction:column; gap: 20px;">
          <div class="chart-header">
            <div class="chart-title">Balance y Arqueo en Tiempo Real</div>
            <div style="font-family: var(--font-title); font-size: 20px; font-weight: 800; color: var(--primary);">
              Saldo Calculado en Caja: ${this.formatCurrency(saldoCalculado)}
            </div>
          </div>
          <div class="caja-actions-bar">
            <button class="btn-danger" onclick="App.closeCaja()"><i data-lucide="lock"></i> Cerrar Caja Diaria</button>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="chart-card" style="text-align: center; padding: 50px 20px; display:flex; flex-direction:column; align-items:center; gap: 15px;">
          <i data-lucide="lock" style="width: 60px; height: 60px; color: var(--danger); opacity:0.8;"></i>
          <h3 style="font-family: var(--font-title); font-size: 22px; font-weight: 800;">La Caja Diaria se encuentra Cerrada</h3>
          <p style="color: var(--text-secondary); max-width: 450px; font-size: 14px;">
            Para poder registrar cobros de cuotas, ingresos o gastos de mantenimiento en el club, debes iniciar la jornada abriendo la caja.
          </p>
          <button class="btn-success" style="margin-top:10px;" onclick="UI.openModal('modal-abrir-caja-backdrop')">
            <i data-lucide="key-round"></i> Abrir Caja del Día
          </button>
        </div>
      `;
    }

    // 3. Dibujar Historial de Cierres de Caja
    const historialBody = document.getElementById("caja-historial-body");
    if (historialBody) {
      const historial = caja.historial || [];
      const rol = App.currentUser ? App.currentUser.rol : "Consulta";
      const hasFinancialAccess = ["Administrador", "Tesorero"].includes(rol);

      // Ajustar visibilidad de la cabecera de acciones
      const thAccionesCaja = document.getElementById("caja-th-acciones");
      if (thAccionesCaja) {
        thAccionesCaja.style.display = hasFinancialAccess ? "table-cell" : "none";
      }

      if (historial.length === 0) {
        historialBody.innerHTML = `<tr><td colspan="${hasFinancialAccess ? 7 : 6}" style="text-align:center; color: var(--text-muted);">No hay registros de cierres históricos.</td></tr>`;
      } else {
        const sortedHist = [...historial].sort((a,b) => b.id - a.id);
        historialBody.innerHTML = sortedHist
          .map(h => {
            const actionsTd = hasFinancialAccess ? `
              <td>
                <div style="display: flex; gap: 5px;">
                  <button class="btn-action" onclick="App.openEditCierreModal(${h.id})" title="Ajustar Cierre" style="color: var(--primary); border-color: rgba(59, 130, 246, 0.15);">
                    <i data-lucide="edit-3"></i>
                  </button>
                  <button class="btn-action" onclick="App.deleteCierre(${h.id})" title="Eliminar Cierre" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.15);">
                    <i data-lucide="trash-2"></i>
                  </button>
                </div>
              </td>
            ` : "";

            return `
              <tr>
                <td><strong>Cierre #${h.id}</strong></td>
                <td>${new Date(h.fechaApertura).toLocaleDateString("es-PY")}</td>
                <td>${this.formatCurrency(h.montoInicial)}</td>
                <td><span style="color: var(--success); font-weight:600;">+ ${this.formatCurrency(h.ingresos)}</span></td>
                <td><span style="color: var(--danger); font-weight:600;">- ${this.formatCurrency(h.egresos)}</span></td>
                <td><strong style="color: var(--primary);">${this.formatCurrency(h.montoFinal)}</strong></td>
                ${actionsTd}
              </tr>
            `;
          })
          .join("");
      }
    }

    // 4. Filtrar y Renderizar Movimientos Contables del Período Seleccionado
    const mesFiltroSelect = document.getElementById("filtro-caja-mes");
    const anioFiltroSelect = document.getElementById("filtro-caja-anio");
    const mesFiltro = mesFiltroSelect ? mesFiltroSelect.value : "todos";
    const anioFiltro = anioFiltroSelect ? anioFiltroSelect.value : "todos";

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

    const totalIngresos = filteredIngresos.reduce((sum, i) => sum + i.monto, 0);
    const totalEgresos = filteredEgresos.reduce((sum, e) => sum + e.monto, 0);
    const saldoNeto = totalIngresos - totalEgresos;
    const totalMovimientos = filteredIngresos.length + filteredEgresos.length;

    const elIngresos = document.getElementById("caja-resumen-ingresos");
    const elEgresos = document.getElementById("caja-resumen-egresos");
    const elSaldo = document.getElementById("caja-resumen-saldo");
    const elMovimientos = document.getElementById("caja-resumen-movimientos");

    if (elIngresos) elIngresos.innerText = this.formatCurrency(totalIngresos);
    if (elEgresos) elEgresos.innerText = this.formatCurrency(totalEgresos);
    if (elSaldo) {
      elSaldo.innerText = this.formatCurrency(saldoNeto);
      if (saldoNeto >= 0) {
        elSaldo.style.color = "var(--success)";
      } else {
        elSaldo.style.color = "var(--danger)";
      }
    }
    if (elMovimientos) elMovimientos.innerText = totalMovimientos;

    const tableBody = document.getElementById("caja-movimientos-table-body");
    if (tableBody) {
      const socios = DB.get("socios", []);
      const clientes = DB.get("clientes", []);

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
          cuotas: "Cuota Social",
          alquiler_comercial: "Alquiler Comercial",
          electricidad: "Reembolso Electricidad",
          alquiler_canchas: "Canchas / Deportes",
          cantina: "Cantina / Consumos",
          otros: "Otros Ingresos"
        };

        return {
          id: i.id,
          fecha: i.fecha,
          tipo: "INGRESO",
          concepto: i.concepto,
          pagador: pagadorName,
          categoria: catLabels[i.categoria] || i.categoria || "Otros",
          ruc: i.ruc || "N/A",
          metodoPago: i.metodoPago,
          monto: i.monto,
          usuario: i.usuario
        };
      });

      const mappedEgresos = filteredEgresos.map(e => {
        return {
          id: e.id,
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
      movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      if (movimientos.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 35px 0;">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; justify-content: center;">
                <i data-lucide="calendar-x" style="width: 28px; height: 28px; opacity: 0.5; color: var(--warning);"></i>
                <span>No se encontraron movimientos para el período seleccionado.</span>
              </div>
            </td>
          </tr>
        `;
      } else {
        tableBody.innerHTML = movimientos.map(m => {
          const isIngreso = m.tipo === "INGRESO";
          const tipoBadge = isIngreso ? 
            `<span class="carnet-badge status activo" style="font-weight: 700;">INGRESO</span>` : 
            `<span class="carnet-badge status suspendido" style="font-weight: 700; background: rgba(239, 68, 68, 0.15); color: var(--danger);">EGRESO</span>`;
          
          const catSocio = isIngreso ? 
            `<strong>${m.pagador}</strong><br><span style="font-size:10px; color:var(--text-muted);">${m.categoria}</span>` : 
            `<span style="text-transform: capitalize;">${m.categoria}</span>`;

          const compMetodo = isIngreso ? 
            `<span class="carnet-badge cat" style="background: rgba(255,255,255,0.04);">${m.metodoPago}</span>` : 
            `<div style="font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">
              <i data-lucide="file-text" style="width: 12px; height: 12px;"></i>
              <span>${m.comprobante}</span>
             </div>`;

          const montoFormatted = isIngreso ? 
            `<strong style="color: var(--success);">+ ${this.formatCurrency(m.monto)}</strong>` : 
            `<strong style="color: var(--danger);">- ${this.formatCurrency(m.monto)}</strong>`;

          return `
            <tr>
              <td>${new Date(m.fecha).toLocaleString("es-PY")}</td>
              <td>${tipoBadge}</td>
              <td>${m.concepto}</td>
              <td>${catSocio}</td>
              <td>${compMetodo}</td>
              <td>${montoFormatted}</td>
              <td><span style="font-size:11px; text-transform:uppercase;">${m.usuario}</span></td>
            </tr>
          `;
        }).join("");
      }
    }

    // Ocultar botón de impresión de caja si no tiene privilegios contables
    const rol2 = App.currentUser ? App.currentUser.rol : "Consulta";
    const hasFinancialAccess2 = ["Administrador", "Tesorero"].includes(rol2);
    const printCajaBtn = document.getElementById("btn-print-caja");
    if (printCajaBtn) {
      printCajaBtn.style.display = hasFinancialAccess2 ? "flex" : "none";
    }

    lucide.createIcons();
  },

  /**
   * ==========================================================================
   * RENDER: REPORTES Y MOROSOS
   * ==========================================================================
   */
  renderReportes() {
    const socios = DB.get("socios", []);
    const morososList = document.getElementById("reporte-morosos-list");

    if (!morososList) return;

    const morosos = socios.filter(s => s.estado === "Moroso");

    if (morosos.length === 0) {
      morososList.innerHTML = `
        <div style="grid-column: span 2; text-align: center; color: var(--text-muted); padding: 40px 0;">
          <i data-lucide="smile" style="width: 48px; height: 48px; opacity:0.5; margin-bottom:10px;"></i>
          <p>¡Excelente! No hay socios morosos en este momento.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    // Dibujar lista de Morosos con botón de alerta
    morososList.innerHTML = morosos
      .map(s => {
        return `
          <div class="activity-item" style="padding: 15px; background: rgba(0,0,0,0.1); border-radius:10px; border: 1px solid var(--card-border); display:flex; align-items:center;">
            <img class="socio-avatar" src="${s.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80'}" style="width: 36px; height:36px; border-radius:50%; margin-right:10px;">
            <div class="activity-details">
              <div class="activity-title" style="font-weight: 700;">${s.nombre}</div>
              <div class="activity-meta" style="color: var(--warning); font-weight:600;">Socio: ${s.nroSocio} • Cat: ${s.categoria}</div>
            </div>
            <button class="btn-success" onclick="ReceiptManager.sendWhatsAppReminder(${JSON.stringify(s).replace(/"/g, '&quot;')})" style="margin-left: auto; padding: 8px 12px; font-size:12px; border-radius:6px; display:flex; align-items:center; gap:5px; background:linear-gradient(135deg, #25D366, #128C7E); box-shadow:none;">
              <i data-lucide="message-square"></i> Alerta WhatsApp
            </button>
          </div>
        `;
      })
      .join("");

    lucide.createIcons();
  },

  resetFiltrosIngresos() {
    const mesSelect = document.getElementById("filtro-ingreso-mes");
    const anioSelect = document.getElementById("filtro-ingreso-anio");
    if (mesSelect) mesSelect.value = "todos";
    if (anioSelect) anioSelect.value = "todos";
    this.renderIngresos();
  },

  resetFiltrosEgresos() {
    const mesSelect = document.getElementById("filtro-egreso-mes");
    const anioSelect = document.getElementById("filtro-egreso-anio");
    if (mesSelect) mesSelect.value = "todos";
    if (anioSelect) anioSelect.value = "todos";
    this.renderEgresos();
  }
};
