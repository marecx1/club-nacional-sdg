/**
 * Club Nacional SDG - Servicio de Notificaciones Web
 * =====================================================
 * Sistema dual de notificaciones:
 *   1. Web Notifications API (push nativo del navegador)
 *   2. Panel in-app con historial persistente en LocalStorage
 *
 * Eventos monitoreados:
 *   - Cambio de estado de socio a 'Moroso'
 *   - Apertura de caja diaria
 *   - Cierre de caja diaria
 */

const NotificationService = {
  DB_KEY: "club_nacional_sdg_notifications",
  MAX_NOTIFICATIONS: 50,
  permissionGranted: false,

  /**
   * Inicializar el servicio: pedir permisos y renderizar panel
   */
  init() {
    // Solicitar permiso para Web Notifications si el navegador lo soporta
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        this.permissionGranted = true;
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          this.permissionGranted = permission === "granted";
        });
      }
    }

    // Vincular eventos del panel
    this.bindPanelEvents();

    // Renderizar badge con conteo de no leídas
    this.updateBadge();
  },

  // =========================================================================
  // PERSISTENCIA: CRUD de notificaciones en LocalStorage
  // =========================================================================

  getAll() {
    try {
      const data = localStorage.getItem(this.DB_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveAll(notifications) {
    try {
      // Limitar a MAX_NOTIFICATIONS más recientes
      const trimmed = notifications.slice(-this.MAX_NOTIFICATIONS);
      localStorage.setItem(this.DB_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.error("Error al guardar notificaciones", e);
    }
  },

  /**
   * Agregar una nueva notificación al historial
   * @param {Object} notification - { type, title, message, icon }
   */
  add(notification) {
    const all = this.getAll();
    const newNotif = {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      type: notification.type || "info",       // "moroso", "caja-abierta", "caja-cierre", "info"
      title: notification.title,
      message: notification.message,
      icon: notification.icon || "bell",
      timestamp: new Date().toISOString(),
      read: false
    };

    all.push(newNotif);
    this.saveAll(all);
    this.updateBadge();
    this.renderPanel();

    // Disparar Web Notification nativa si hay permiso
    this.sendBrowserNotification(newNotif);

    // Mostrar toast in-app también
    const toastType = newNotif.type === "moroso" ? "warning"
      : newNotif.type === "caja-cierre" ? "danger"
      : "success";
    if (typeof UI !== "undefined" && UI.showToast) {
      UI.showToast(newNotif.message, toastType);
    }

    return newNotif;
  },

  /**
   * Marcar una notificación como leída
   */
  markAsRead(notifId) {
    const all = this.getAll();
    const idx = all.findIndex(n => n.id === notifId);
    if (idx !== -1) {
      all[idx].read = true;
      this.saveAll(all);
      this.updateBadge();
      this.renderPanel();
    }
  },

  /**
   * Marcar todas como leídas
   */
  markAllAsRead() {
    const all = this.getAll();
    all.forEach(n => n.read = true);
    this.saveAll(all);
    this.updateBadge();
    this.renderPanel();
  },

  /**
   * Limpiar todo el historial
   */
  clearAll() {
    this.saveAll([]);
    this.updateBadge();
    this.renderPanel();
  },

  /**
   * Obtener conteo de no leídas
   */
  getUnreadCount() {
    return this.getAll().filter(n => !n.read).length;
  },

  // =========================================================================
  // WEB NOTIFICATIONS API (Push Nativo del Navegador)
  // =========================================================================

  sendBrowserNotification(notif) {
    if (!this.permissionGranted || !("Notification" in window)) return;

    try {
      const browserNotif = new Notification(`Club Nacional SDG - ${notif.title}`, {
        body: notif.message,
        icon: "img/logo.jpg",
        badge: "img/logo.jpg",
        tag: notif.id,
        requireInteraction: notif.type === "moroso",
        silent: false
      });

      // Auto-cerrar después de 8 segundos excepto para morosos
      if (notif.type !== "moroso") {
        setTimeout(() => browserNotif.close(), 8000);
      }

      browserNotif.onclick = () => {
        window.focus();
        this.markAsRead(notif.id);
        browserNotif.close();
      };
    } catch (e) {
      // Silenciar errores en entornos sin soporte
      console.warn("Web Notification no soportada:", e);
    }
  },

  // =========================================================================
  // EVENTOS DE NEGOCIO: Funciones llamadas desde App
  // =========================================================================

  /**
   * Notificar que un socio pasó a estado Moroso
   * @param {Object} socio - Objeto del socio { nombre, nroSocio, ci }
   * @param {string} motivo - Razón del cambio (opcional)
   */
  notifySocioMoroso(socio, motivo = "Cuota vencida") {
    this.add({
      type: "moroso",
      title: "Socio Moroso",
      message: `⚠️ ${socio.nombre} (${socio.nroSocio}) pasó a estado MOROSO. Motivo: ${motivo}`,
      icon: "alert-triangle"
    });
  },

  /**
   * Notificar apertura de caja
   * @param {number} monto - Monto inicial de apertura
   * @param {string} usuario - Nombre del usuario que abrió
   */
  notifyCajaAbierta(monto, usuario) {
    const montoStr = new Intl.NumberFormat("es-PY", {
      style: "currency", currency: "PYG", minimumFractionDigits: 0
    }).format(monto);

    this.add({
      type: "caja-abierta",
      title: "Caja Abierta",
      message: `🟢 La caja diaria fue abierta por ${usuario} con un saldo inicial de ${montoStr}`,
      icon: "unlock"
    });
  },

  /**
   * Notificar cierre de caja
   * @param {Object} cierre - Datos del cierre { montoFinal, ingresos, egresos }
   * @param {string} usuario - Nombre del usuario que cerró
   */
  notifyCajaCerrada(cierre, usuario) {
    const montoStr = new Intl.NumberFormat("es-PY", {
      style: "currency", currency: "PYG", minimumFractionDigits: 0
    }).format(cierre.montoFinal);

    this.add({
      type: "caja-cierre",
      title: "Caja Cerrada",
      message: `🔴 Cierre de caja realizado por ${usuario}. Saldo consolidado: ${montoStr}`,
      icon: "lock"
    });
  },

  // =========================================================================
  // UI: Panel de Notificaciones In-App
  // =========================================================================

  /**
   * Actualizar badge con conteo de no leídas
   */
  updateBadge() {
    const badge = document.getElementById("notif-badge");
    const count = this.getUnreadCount();
    if (badge) {
      badge.textContent = count > 9 ? "9+" : count;
      badge.style.display = count > 0 ? "flex" : "none";
    }

    // Animar el icono de campana si hay nuevas
    const bellBtn = document.getElementById("notif-bell-btn");
    if (bellBtn) {
      if (count > 0) {
        bellBtn.classList.add("has-notifications");
      } else {
        bellBtn.classList.remove("has-notifications");
      }
    }
  },

  /**
   * Toggle del panel desplegable
   */
  togglePanel() {
    const panel = document.getElementById("notif-panel");
    if (panel) {
      const isOpen = panel.classList.contains("active");
      if (isOpen) {
        panel.classList.remove("active");
      } else {
        this.renderPanel();
        panel.classList.add("active");
      }
    }
  },

  /**
   * Cerrar panel
   */
  closePanel() {
    const panel = document.getElementById("notif-panel");
    if (panel) {
      panel.classList.remove("active");
    }
  },

  /**
   * Renderizar lista de notificaciones en el panel
   */
  renderPanel() {
    const list = document.getElementById("notif-list");
    if (!list) return;

    const notifications = this.getAll().reverse(); // Más recientes primero

    if (notifications.length === 0) {
      list.innerHTML = `
        <div class="notif-empty">
          <i data-lucide="bell-off" style="width:40px;height:40px;color:var(--text-muted);"></i>
          <p>Sin notificaciones</p>
          <span>Las alertas del sistema aparecerán aquí</span>
        </div>
      `;
      if (typeof lucide !== "undefined") lucide.createIcons();
      return;
    }

    list.innerHTML = notifications.map(n => {
      const date = new Date(n.timestamp);
      const timeAgo = this.getTimeAgo(date);

      let iconName = "bell";
      let accentColor = "var(--primary)";
      let accentBg = "rgba(59, 130, 246, 0.12)";

      if (n.type === "moroso") {
        iconName = "alert-triangle";
        accentColor = "var(--warning)";
        accentBg = "rgba(245, 158, 11, 0.12)";
      } else if (n.type === "caja-abierta") {
        iconName = "unlock";
        accentColor = "var(--success)";
        accentBg = "rgba(16, 185, 129, 0.12)";
      } else if (n.type === "caja-cierre") {
        iconName = "lock";
        accentColor = "var(--danger)";
        accentBg = "rgba(239, 68, 68, 0.12)";
      }

      return `
        <div class="notif-item ${n.read ? 'read' : 'unread'}" onclick="NotificationService.markAsRead('${n.id}')">
          <div class="notif-item-icon" style="background:${accentBg};color:${accentColor};">
            <i data-lucide="${iconName}"></i>
          </div>
          <div class="notif-item-content">
            <div class="notif-item-title">${n.title}</div>
            <div class="notif-item-message">${n.message.replace(/[⚠️🟢🔴]/g, '').trim()}</div>
            <div class="notif-item-time">
              <i data-lucide="clock" style="width:11px;height:11px;"></i>
              ${timeAgo}
            </div>
          </div>
          ${!n.read ? '<div class="notif-unread-dot"></div>' : ''}
        </div>
      `;
    }).join("");

    if (typeof lucide !== "undefined") lucide.createIcons();
  },

  /**
   * Calcular tiempo relativo "hace X minutos"
   */
  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "Hace un momento";
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHr < 24) return `Hace ${diffHr}h`;
    if (diffDay === 1) return "Ayer";
    return date.toLocaleDateString("es-PY", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  },

  /**
   * Vincular eventos del panel (cierre al clic fuera)
   */
  bindPanelEvents() {
    document.addEventListener("click", (e) => {
      const panel = document.getElementById("notif-panel");
      const bellBtn = document.getElementById("notif-bell-btn");
      if (panel && bellBtn && !panel.contains(e.target) && !bellBtn.contains(e.target)) {
        this.closePanel();
      }
    });
  }
};
