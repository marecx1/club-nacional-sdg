/**
 * Club Manager Pro PY - Lógica de Recibos PDF, Balances y Reportes
 * Generador de recibos y balances en Guaraníes (Gs.) usando jsPDF y exportación compatible con Excel.
 */

const ReceiptManager = {
  /**
   * Cargar el logo del club de forma asíncrona
   * @returns {Promise<HTMLImageElement|null>}
   */
  loadLogo() {
    return new Promise((resolve) => {
      const img = new Image();
      let resolved = false;
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      }, 300); // 300ms safety timeout
      
      img.onload = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(img);
        }
      };
      
      img.onerror = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(null);
        }
      };
      
      try {
        img.src = "img/logo.jpg";
      } catch (e) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(null);
        }
      }
    });
  },

  /**
   * Pintar la cabecera y el pie de página institucional en cada página
   * @param {Object} doc Instancia de jsPDF
   * @param {HTMLImageElement|null} logoImg Logo cargado
   * @param {number} pageNumber Número de página actual
   * @param {number} totalPages Total de páginas en el documento
   */
  addHeaderFooter(doc, logoImg, pageNumber, totalPages) {
    // 1. Cabecera Institucional en cada página (Azul Medianoche y Verde)
    doc.setFillColor(11, 18, 34); // Azul Medianoche
    doc.rect(0, 0, 210, 32, "F");
    
    doc.setFillColor(16, 185, 129); // Línea verde de acento
    doc.rect(0, 32, 210, 1.5, "F");

    if (logoImg) {
      doc.addImage(logoImg, "JPEG", 15, 5, 22, 22);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("CLUB NACIONAL SDG", 44, 14);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("BALANCE GENERAL Y ESTADO DE CUENTAS INSTITUCIONALES", 44, 20);
    doc.text("Asunción, Paraguay • Gestión Deportiva y Social", 44, 25);

    // 2. Pie de página en cada página
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 278, 195, 278);

    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Club Nacional SDG - Sistema de Gestión Club Manager Pro PY", 15, 284);
    doc.text(`Página ${pageNumber} de ${totalPages}`, 180, 284);
  },

  /**
   * Generar y descargar un recibo de cobro PDF
   * @param {Object} ingreso Objeto de ingreso desde la base de datos
   * @param {Object} socio Objeto del socio asociado (puede ser null)
   */
  async generatePDF(ingreso, socio = null) {
    const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDFClass) {
      console.error("jsPDF CDN no se ha cargado correctamente.");
      alert("Error: El generador de PDF no está listo. Verifica tu conexión a internet para cargar la librería de impresión.");
      return;
    }

    const doc = new jsPDFClass({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const formatCurrency = (val) => {
      return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(val);
    };

    let socioNombre = "Cliente Ocasional / General";
    if (ingreso.tipoPagador === "socio" || (ingreso.socioId && !ingreso.tipoPagador)) {
      socioNombre = socio ? socio.nombre : "Socio del Club";
    } else if (ingreso.tipoPagador === "cliente" || ingreso.clienteId) {
      const clientes = DB.get("clientes", []);
      const cliente = clientes.find(c => c.id === parseInt(ingreso.clienteId));
      socioNombre = cliente ? cliente.nombre : "Cliente Comercial";
    } else if (ingreso.tipoPagador === "ocasional" || ingreso.nombreManual) {
      socioNombre = ingreso.nombreManual || "Cliente General";
    }

    const socioDoc = (ingreso.ruc && ingreso.ruc !== "N/A") ? ingreso.ruc : ((ingreso.tipoPagador === "socio" || !ingreso.tipoPagador) && socio ? `C.I. Nº ${socio.ci}` : "N/A");
    const socioNro = (ingreso.tipoPagador === "socio" || !ingreso.tipoPagador) && socio ? socio.nroSocio : "N/A";
    
    // Carga de logo asíncrona
    const logoImg = await this.loadLogo();

    // --- ESTILIZACIÓN DEL RECIBO PREMIUM ---
    
    // 1. Fondos y Marcos Geométricos
    doc.setFillColor(11, 18, 34); // Azul Medianoche
    doc.rect(0, 0, 210, 38, "F");
    
    doc.setFillColor(16, 185, 129); // Línea verde de acento
    doc.rect(0, 38, 210, 2, "F");

    // 2. Logo y Encabezado del Recibo
    if (logoImg) {
      doc.addImage(logoImg, "JPEG", 15, 7, 24, 24);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("CLUB NACIONAL SDG", 44, 16);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("ADMINISTRACIÓN Y CONTABILIDAD DEPORTIVA", 44, 22);
    doc.text("Asunción, Paraguay", 44, 27);
    
    // Cuadro del Recibo Nº
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(145, 8, 50, 22, 2, 2, "F");
    
    doc.setTextColor(11, 18, 34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("RECIBO DE COBRO", 150, 14);
    doc.setFontSize(13);
    doc.setTextColor(37, 99, 235); // Azul principal
    doc.text(`Nº 001-${String(ingreso.id).padStart(6, '0')}`, 150, 24);

    // 3. Detalles de Emisión (Fecha y Operador)
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const fechaFormat = new Date(ingreso.fecha).toLocaleString("es-PY");
    doc.text(`Fecha y Hora de Emisión: ${fechaFormat}`, 15, 48);
    doc.text(`Operador de Caja: ${ingreso.usuario.toUpperCase()}`, 15, 53);

    // Línea divisoria
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 57, 195, 57);

    // 4. Datos del Socio / Pagador
    doc.setTextColor(11, 18, 34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DATOS DEL SOCIO / DEPOSITANTE", 15, 65);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nombre Completo:`, 15, 73);
    doc.setFont("helvetica", "bold");
    doc.text(`${socioNombre}`, 50, 73);

    doc.setFont("helvetica", "normal");
    doc.text(`Documento de Identidad:`, 15, 79);
    doc.setFont("helvetica", "bold");
    doc.text(`${socioDoc}`, 60, 79);

    doc.setFont("helvetica", "normal");
    doc.text(`Número de Socio:`, 15, 85);
    doc.setFont("helvetica", "bold");
    doc.text(`${socioNro}`, 50, 85);

    // 5. Tabla de Transacción (Diseño Corporativo)
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 95, 180, 10, "F");
    
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("CONCEPTO / DETALLE DE PAGO", 20, 101);
    doc.text("MÉTODO", 130, 101);
    doc.text("SUBTOTAL", 165, 101);

    // Cuerpo de la tabla
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`${ingreso.concepto}`, 20, 113);
    doc.text(`${ingreso.metodoPago}`, 130, 113);
    
    doc.setFont("helvetica", "bold");
    doc.text(`${formatCurrency(ingreso.monto)}`, 165, 113);

    // Línea final de tabla
    doc.line(15, 120, 195, 120);

    // Total General Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(125, 126, 70, 15, 1, 1, "F");

    doc.setTextColor(11, 18, 34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TOTAL ABONADO:", 129, 135);
    doc.setTextColor(16, 185, 129); // Verde éxito
    doc.setFontSize(13);
    doc.text(`${formatCurrency(ingreso.monto)}`, 165, 135);

    // 6. Mensaje de Agradecimiento e Información Legal
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.text("Este comprobante constituye un recibo oficial de cobro emitido por la administración digital de Club Nacional SDG.", 15, 160);
    doc.text("Gracias por su aporte y su puntualidad en las cuotas sociales, haciendo crecer nuestro club.", 15, 164);

    // 7. Firmas y Sello de Validación
    // Sello Digital de Caja
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.8);
    doc.roundedRect(25, 175, 45, 20, 2, 2, "D");
    
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("CAJA VALIDADA", 32, 182);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Club Nacional SDG", 29, 187);
    doc.setFontSize(7);
    doc.text(`REF: CNSDG-SEC-${ingreso.id}`, 34, 192);

    // Firma del Cajero
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.5);
    doc.line(130, 188, 185, 188);
    
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Firma del Responsable / Tesorero", 137, 193);

    // Guardar / Descargar PDF con fallback robusto
    try {
      doc.save(`Recibo_CNSDG_${String(ingreso.id).padStart(6, '0')}.pdf`);
    } catch (saveError) {
      console.warn("doc.save() bloqueado o falló, intentando abrir en nueva pestaña:", saveError);
      try {
        const blobUrl = doc.output('bloburl');
        window.open(blobUrl, '_blank');
      } catch (blobError) {
        console.error("Fallo al abrir blob url:", blobError);
        alert("El navegador bloqueó la descarga automática. Por favor, permite las descargas y ventanas emergentes para este portal.");
      }
    }
  },

  /**
   * Generar el Balance General Anual oficial en PDF (2 páginas)
   */
  async generateBalancePDF() {
    const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDFClass) {
      console.error("jsPDF CDN no se ha cargado correctamente.");
      alert("Error: El generador de PDF no está listo. Verifica tu conexión a internet para cargar la librería de impresión.");
      return;
    }
    
    if (window.UI && typeof UI.showToast === "function") {
      UI.showToast("Generando Balance General (PDF)...", "success");
    }

    const doc = new jsPDFClass({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const formatCurrency = (val) => {
      return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(val);
    };

    const logoImg = await this.loadLogo();
    
    const ingresos = DB.get("ingresos", []);
    const egresos = DB.get("egresos", []);

    // Cálculos Financieros
    const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0);
    const totalEgresos = egresos.reduce((sum, e) => sum + e.monto, 0);
    const balanceNeto = totalIngresos - totalEgresos;

    // Desglose por categorías de ingresos
    const catsIngresos = {};
    const catLabels = {
      cuotas: "Cuotas Sociales",
      alquiler_comercial: "Alquiler Comercial",
      electricidad: "Reembolso Electricidad",
      alquiler_canchas: "Canchas / Deportes",
      cantina: "Cantina / Consumos",
      otros: "Otros Ingresos"
    };

    ingresos.forEach(i => {
      let catKey = i.categoria || "cuotas";
      let catName = catLabels[catKey] || "Otros Ingresos";
      catsIngresos[catName] = (catsIngresos[catName] || 0) + i.monto;
    });

    // Desglose por categorías de egresos
    const catsEgresos = {};
    egresos.forEach(e => {
      let cat = e.categoria.charAt(0).toUpperCase() + e.categoria.slice(1);
      catsEgresos[cat] = (catsEgresos[cat] || 0) + e.monto;
    });

    // -------------------------------------------------------------
    // PÁGINA 1: RESUMEN DE GESTIÓN Y BALANCES
    // -------------------------------------------------------------
    this.addHeaderFooter(doc, logoImg, 1, 2);

    doc.setTextColor(11, 18, 34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("1. RESUMEN DE EJECUCIÓN FINANCIERA (ANUAL)", 15, 42);

    // Línea divisoria sutil
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 45, 195, 45);

    // Cuadros KPI (Ingresos, Egresos, Neto)
    // KPI 1: Ingresos Totales
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, 52, 55, 24, 2, 2, "F");
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("INGRESOS TOTALES", 20, 59);
    doc.setTextColor(16, 185, 129); // Verde éxito
    doc.setFontSize(11);
    doc.text(formatCurrency(totalIngresos), 20, 68);

    // KPI 2: Egresos Totales
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(77, 52, 55, 24, 2, 2, "F");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text("EGRESOS TOTALES", 82, 59);
    doc.setTextColor(239, 68, 68); // Rojo
    doc.setFontSize(11);
    doc.text(formatCurrency(totalEgresos), 82, 68);

    // KPI 3: Balance Neto
    doc.setFillColor(11, 18, 34);
    doc.roundedRect(140, 52, 55, 24, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("BALANCE NETO DISPONIBLE", 144, 59);
    doc.setTextColor(59, 130, 246); // Azul premium
    doc.setFontSize(11);
    doc.text(formatCurrency(balanceNeto), 144, 68);

    // Detalle de Categorías (Tablita simple)
    doc.setTextColor(11, 18, 34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DESGLOSE DE CUENTAS DE INGRESOS", 15, 92);
    
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 96, 180, 8, "F");
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8.5);
    doc.text("CATEGORÍA DE INGRESO", 20, 101);
    doc.text("SUBTOTAL ABONADO (Gs.)", 150, 101);

    let yPos = 110;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    
    Object.entries(catsIngresos).forEach(([cat, val]) => {
      doc.text(cat, 20, yPos);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(val), 150, yPos);
      doc.setFont("helvetica", "normal");
      doc.line(15, yPos + 3, 195, yPos + 3);
      yPos += 10;
    });

    // Desglose Egresos
    yPos += 5;
    doc.setTextColor(11, 18, 34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DESGLOSE DE CUENTAS DE EGRESOS (GASTOS)", 15, yPos);
    
    yPos += 4;
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPos, 180, 8, "F");
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8.5);
    doc.text("CATEGORÍA DE GASTO", 20, yPos + 5);
    doc.text("SUBTOTAL EXPENSADO (Gs.)", 150, yPos + 5);

    yPos += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);

    Object.entries(catsEgresos).forEach(([cat, val]) => {
      doc.text(cat, 20, yPos);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(val), 150, yPos);
      doc.setFont("helvetica", "normal");
      doc.line(15, yPos + 3, 195, yPos + 3);
      yPos += 10;
    });

    // Sello Digital de la Auditoría en la primera página
    yPos += 5;
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.6);
    doc.roundedRect(15, yPos, 65, 18, 1, 1, "D");
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("AUDITORÍA CONSOLIDADA", 18, yPos + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Club Nacional SDG - Verificado", 18, yPos + 11);
    doc.text(`Fecha Cierre: ${new Date().toLocaleDateString("es-PY")}`, 18, yPos + 15);

    // -------------------------------------------------------------
    // PÁGINA 2: DETALLE CRONOLÓGICO DE MOVIMIENTOS
    // -------------------------------------------------------------
    doc.addPage();
    this.addHeaderFooter(doc, logoImg, 2, 2);

    doc.setTextColor(11, 18, 34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("2. DETALLE CRONOLÓGICO DE MOVIMIENTOS (LIBRO DIARIO)", 15, 42);

    // Línea divisoria sutil
    doc.line(15, 45, 195, 45);

    // Encabezado de la tabla de movimientos
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 52, 180, 8, "F");
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    doc.text("FECHA Y HORA", 18, 57);
    doc.text("TIPO", 55, 57);
    doc.text("CONCEPTO / DETALLE", 78, 57);
    doc.text("METODO/COMPR.", 138, 57);
    doc.text("MONTO (Gs.)", 170, 57);

    // Combinar ingresos y egresos y ordenar por fecha
    let transacciones = [
      ...ingresos.map(i => ({ ...i, tipo: "INGRESO", cat: i.metodoPago })),
      ...egresos.map(e => ({ ...e, tipo: "EGRESO", cat: e.comprobante }))
    ];
    transacciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    yPos = 66;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);

    // Renderizar las transacciones (hasta 18 para no pasarse de la página)
    const listado = transacciones.slice(0, 18);
    listado.forEach(t => {
      const fStr = new Date(t.fecha).toLocaleString("es-PY", {dateStyle: 'short', timeStyle: 'short'});
      doc.text(fStr, 18, yPos);
      
      // Tipo con color
      if (t.tipo === "INGRESO") {
        doc.setTextColor(16, 185, 129);
        doc.setFont("helvetica", "bold");
        doc.text("INGRESO", 55, yPos);
      } else {
        doc.setTextColor(239, 68, 68);
        doc.setFont("helvetica", "bold");
        doc.text("EGRESO", 55, yPos);
      }
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);

      // Limitar caracteres del concepto
      const conceptoLim = t.concepto.substring(0, 28) + (t.concepto.length > 28 ? "..." : "");
      doc.text(conceptoLim, 78, yPos);
      
      const catLim = t.cat.substring(0, 14);
      doc.text(catLim, 138, yPos);
      
      doc.setFont("helvetica", "bold");
      if (t.tipo === "INGRESO") {
        doc.text(`+ ${formatCurrency(t.monto)}`, 170, yPos);
      } else {
        doc.text(`- ${formatCurrency(t.monto)}`, 170, yPos);
      }
      doc.setFont("helvetica", "normal");

      doc.line(15, yPos + 2.5, 195, yPos + 2.5);
      yPos += 8.5;
    });

    // Bloque de Firmas y Responsables al final
    yPos = 240;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.5);
    doc.line(25, yPos, 80, yPos);
    doc.line(130, yPos, 185, yPos);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text("Firma del Presidente", 38, yPos + 5);
    doc.text("Firma del Tesorero General", 140, yPos + 5);

    doc.setFont("helvetica", "bold");
    doc.text("Club Nacional SDG", 40, yPos + 10);
    doc.text("Caja Central", 152, yPos + 10);

    try {
      doc.save(`Balance_General_CNSDG_${new Date().getFullYear()}.pdf`);
    } catch (saveError) {
      console.warn("doc.save() bloqueado o falló, intentando abrir en nueva pestaña:", saveError);
      try {
        const blobUrl = doc.output('bloburl');
        window.open(blobUrl, '_blank');
      } catch (blobError) {
        console.error("Fallo al abrir blob url:", blobError);
        alert("El navegador bloqueó la descarga automática. Por favor, permite las descargas y ventanas emergentes para este portal.");
      }
    }
  },

  /**
   * Exportar el Libro Diario completo en formato CSV compatible con Excel
   */
  exportLibroDiarioCSV() {
    if (window.UI && typeof UI.showToast === "function") {
      UI.showToast("Exportando Libro Diario a Excel...", "success");
    }

    const ingresos = DB.get("ingresos", []);
    const egresos = DB.get("egresos", []);
    
    // Combinar transacciones y ordenar por fecha
    let transacciones = [
      ...ingresos.map(i => ({ ...i, tipo: "INGRESO", cat: "Ingreso General" })),
      ...egresos.map(e => ({ ...e, tipo: "EGRESO", cat: e.categoria }))
    ];
    
    transacciones.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    // Encabezado CSV con formato compatible para Excel (UTF-8 con BOM de firma y separador ;)
    let csvContent = "\ufeff"; // UTF-8 BOM
    csvContent += "ID;Fecha;Tipo;Concepto;Categoria;Metodo / Comprobante;Monto (Gs.);Operador\r\n";
    
    transacciones.forEach(t => {
      const fecha = new Date(t.fecha).toLocaleString("es-PY");
      const monto = t.monto;
      const metodoComprobante = t.tipo === "INGRESO" ? t.metodoPago : t.comprobante;
      
      csvContent += `${t.id};"${fecha}";${t.tipo};"${t.concepto.replace(/"/g, '""')}";"${t.cat}";"${metodoComprobante}";${monto};"${t.usuario}"\r\n`;
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Libro_Diario_CNSDG_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Generar y descargar el Libro Diario de Ingresos y Egresos en PDF (Multi-página dinámico)
   * @param {string|number} mes Filtro de mes ("todos" o 0-11)
   * @param {string|number} anio Filtro de año ("todos" o año numérico)
   */
  async generateLibroPDF(mes = "todos", anio = "todos") {
    try {
      const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
      if (!jsPDFClass) {
        console.error("jsPDF CDN no se ha cargado correctamente.");
        alert("Error: El generador de PDF no está listo. Verifica tu conexión a internet para cargar la librería de impresión.");
        return;
      }

      if (window.UI && typeof UI.showToast === "function") {
        UI.showToast("Generando Libro Diario PDF...", "success");
      }
      const doc = new jsPDFClass({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const formatCurrency = (val) => {
        return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(val);
      };

      const logoImg = await this.loadLogo();
      const ingresos = DB.get("ingresos", []);
      const egresos = DB.get("egresos", []);
      const socios = DB.get("socios", []);

      // 1. Unificar transacciones y mapear detalles
      const transacciones = [];

      // Mapear ingresos
      ingresos.forEach(i => {
        let pagador = "Cliente General";
        if (i.tipoPagador === "socio" || (i.socioId && !i.tipoPagador)) {
          const socio = socios.find(s => s.id === parseInt(i.socioId));
          pagador = socio ? socio.nombre : "Socio del Club";
        } else if (i.tipoPagador === "cliente" || i.clienteId) {
          const clientes = DB.get("clientes", []);
          const cliente = clientes.find(c => c.id === parseInt(i.clienteId));
          pagador = cliente ? cliente.nombre : "Cliente Comercial";
        } else if (i.tipoPagador === "ocasional" || i.nombreManual) {
          pagador = i.nombreManual || "Cliente General";
        }

        const rucVal = i.ruc || "N/A";
        const catLabels = {
          cuotas: "Cuota Social",
          alquiler_comercial: "Alquiler Comercial",
          electricidad: "Reembolso Elec.",
          alquiler_canchas: "Canchas / Deportes",
          cantina: "Cantina / Consumos",
          otros: "Otros Ingresos"
        };

        transacciones.push({
          id: i.id,
          fecha: i.fecha ? new Date(i.fecha) : new Date(),
          tipo: "INGRESO",
          concepto: `${i.concepto || 'Ingreso'} (${pagador})`,
          categoria: catLabels[i.categoria] || i.categoria || "Otros",
          metodo: i.metodoPago || "Efectivo",
          monto: Number(i.monto || 0),
          ruc: rucVal
        });
      });

      // Mapear egresos
      egresos.forEach(e => {
        const catCap = e.categoria ? (String(e.categoria).charAt(0).toUpperCase() + String(e.categoria).slice(1)) : "Gastos";
        transacciones.push({
          id: e.id,
          fecha: e.fecha ? new Date(e.fecha) : new Date(),
          tipo: "EGRESO",
          concepto: e.concepto || "Gasto",
          categoria: catCap,
          metodo: e.comprobante || "Factura",
          monto: Number(e.monto || 0),
          ruc: "N/A"
        });
      });

      // 2. Filtrar transacciones por mes y año
      let filteredTrans = [...transacciones];
      if (mes !== "todos") {
        filteredTrans = filteredTrans.filter(t => t.fecha.getMonth() === parseInt(mes));
      }
      if (anio !== "todos") {
        filteredTrans = filteredTrans.filter(t => t.fecha.getFullYear() === parseInt(anio));
      }

      // Ordenar de forma CRONOLÓGICA ASCENDENTE (Libro Diario Real)
      filteredTrans.sort((a, b) => a.fecha - b.fecha);

      // Calcular resúmenes financieros
      const totalIngresos = filteredTrans.filter(t => t.tipo === "INGRESO").reduce((sum, t) => sum + t.monto, 0);
      const totalEgresos = filteredTrans.filter(t => t.tipo === "EGRESO").reduce((sum, t) => sum + t.monto, 0);
      const saldoNeto = totalIngresos - totalEgresos;

      // 3. Renderizar Libro Diario en PDF (Paginación Dinámica)
      // Título y Período en la primera página
      doc.setTextColor(11, 18, 34);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      
      let mesNombres = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      let periodoStr = (mes !== "todos" ? mesNombres[parseInt(mes)] : "Todos los Meses") + " " + (anio !== "todos" ? anio : "Todos los Años");
      doc.text(`LIBRO DIARIO DE INGRESOS Y EGRESOS`, 15, 41);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Período Contable: ${periodoStr} | Generado el: ${new Date().toLocaleString("es-PY")}`, 15, 46);

      let yPos = 52;
      const marginBot = 270;
      const rowHeight = 9;
      const topMarginTable = 45;

      // Función auxiliar para dibujar la cabecera de la tabla
      const drawTableHeader = (y) => {
        doc.setFillColor(241, 245, 249);
        doc.rect(15, y, 180, 7.5, "F");
        
        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        
        doc.text("FECHA / HORA", 18, y + 5);
        doc.text("TIPO", 50, y + 5);
        doc.text("CONCEPTO / DETALLE DE TRANSACCIÓN", 68, y + 5);
        doc.text("CATEGORÍA", 137, y + 5);
        doc.text("MONTO (Gs.)", 168, y + 5);
        
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(15, y + 7.5, 195, y + 7.5);
      };

      // Dibujar la cabecera inicial
      drawTableHeader(yPos);
      yPos += 7.5;

      let index = 0;
      let pageNumber = 1;

      if (filteredTrans.length === 0) {
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9.5);
        doc.text("No se registraron movimientos en este período contable.", 20, yPos + 8);
        yPos += 15;
      } else {
        filteredTrans.forEach(t => {
          // Verificar si la fila sobrepasa el límite de la página
          if (yPos + rowHeight > marginBot) {
            doc.addPage();
            pageNumber++;
            yPos = topMarginTable;
            drawTableHeader(yPos);
            yPos += 7.5;
          }

          // Alternancia de fondos de fila
          if (index % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(15, yPos, 180, rowHeight, "F");
          }

          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);

          // Col 1: Fecha
          const fStr = (t.fecha instanceof Date && !isNaN(t.fecha)) ? t.fecha.toLocaleString("es-PY", { dateStyle: 'short', timeStyle: 'short' }) : "S/F";
          doc.text(fStr, 18, yPos + 5.5);

          // Col 2: Tipo con badge
          if (t.tipo === "INGRESO") {
            doc.setTextColor(16, 185, 129); // Verde
            doc.setFont("helvetica", "bold");
            doc.text("INGRESO", 50, yPos + 5.5);
          } else {
            doc.setTextColor(239, 68, 68); // Rojo
            doc.setFont("helvetica", "bold");
            doc.text("EGRESO", 50, yPos + 5.5);
          }

          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "normal");

          // Col 3: Concepto limitado para que no se desborde la columna
          const rawConcepto = String(t.concepto || "");
          const conceptoLim = rawConcepto.substring(0, 42) + (rawConcepto.length > 42 ? "..." : "");
          doc.text(conceptoLim, 68, yPos + 5.5);

          // Col 4: Categoría
          const catLim = String(t.categoria || "Otros").substring(0, 18);
          doc.text(catLim, 137, yPos + 5.5);

          // Col 5: Monto formateado
          doc.setFont("helvetica", "bold");
          if (t.tipo === "INGRESO") {
            doc.setTextColor(16, 185, 129);
            doc.text(`+ ${formatCurrency(t.monto).replace("Gs.", "")}`, 168, yPos + 5.5);
          } else {
            doc.setTextColor(239, 68, 68);
            doc.text(`- ${formatCurrency(t.monto).replace("Gs.", "")}`, 168, yPos + 5.5);
          }

          // Línea divisoria de fila
          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.2);
          doc.line(15, yPos + rowHeight, 195, yPos + rowHeight);

          yPos += rowHeight;
          index++;
        });
      }

      // 4. Dibujar cuadro de Resumen Final en la última página
      // Asegurarse de tener suficiente espacio, de lo contrario añadir página nueva
      if (yPos + 35 > marginBot) {
        doc.addPage();
        yPos = topMarginTable;
      }

      yPos += 8;
      // Caja de Resumen
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(120, yPos, 75, 28, 2, 2, "F");

      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("TOTAL DE INGRESOS:", 124, yPos + 6);
      doc.setTextColor(16, 185, 129);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(totalIngresos), 164, yPos + 6);

      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "normal");
      doc.text("TOTAL DE EGRESOS:", 124, yPos + 13);
      doc.setTextColor(239, 68, 68);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(totalEgresos), 164, yPos + 13);

      // Línea divisoria en resumen
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(122, yPos + 17, 193, yPos + 17);

      doc.setTextColor(11, 18, 34);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("SALDO NETO PERÍODO:", 124, yPos + 23);
      doc.setTextColor(59, 130, 246); // Azul
      doc.text(formatCurrency(saldoNeto), 164, yPos + 23);

      // Bloque de Firmas y Validación
      yPos += 35;
      if (yPos + 20 > marginBot) {
        doc.addPage();
        yPos = topMarginTable + 20;
      }

      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.6);
      doc.roundedRect(15, yPos, 62, 16, 1, 1, "D");
      doc.setTextColor(16, 185, 129);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("LIBRO DIARIO AUDITADO", 18, yPos + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text("Club Nacional SDG - Firma Digital", 18, yPos + 9);
      doc.text(`Hash: CNSDG-LD-${new Date().getTime().toString().slice(-6)}`, 18, yPos + 13);

      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.4);
      doc.line(135, yPos + 10, 190, yPos + 10);
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.text("Firma del Tesorero General", 143, yPos + 14);

      // 5. Segunda pasada: Estampar Cabecera y Pie de página con numeración final
      const totalPages = doc.internal.getNumberOfPages();
      for (let j = 1; j <= totalPages; j++) {
        doc.setPage(j);
        
        // Pintar cabecera azul
        doc.setFillColor(11, 18, 34);
        doc.rect(0, 0, 210, 32, "F");
        
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 32, 210, 1.5, "F");

        if (logoImg) {
          doc.addImage(logoImg, "JPEG", 15, 5, 22, 22);
        }

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("CLUB NACIONAL SDG", 44, 14);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.text("LIBRO DIARIO GENERAL DE INGRESOS Y EGRESOS DE CAJA", 44, 20);
        doc.text("Gestión Contable Centralizada • Saltos del Guairá", 44, 25);

        // Pintar pie de página
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(15, 278, 195, 278);

        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Club Nacional SDG - Sistema de Gestión Club Manager Pro PY", 15, 284);
        doc.text(`Página ${j} de ${totalPages}`, 180, 284);
      }

      // Descargar PDF
      const safePeriodo = periodoStr.replace(/\s+/g, "_");
      doc.save(`Libro_Diario_CNSDG_${safePeriodo}.pdf`);
    } catch (error) {
      console.error("Error al generar Libro Diario PDF:", error);
      alert("Error al generar el Libro Diario en PDF: " + error.message);
    }
  },,

  /**
   * Generar mensaje de recordatorio de pago para WhatsApp
   * @param {Object} socio Objeto del socio moroso
   * @param {number} montoCuota El monto estimado de la cuota vencida
   * @returns {string} Enlace de redirección a WhatsApp Web
   */
  generateWhatsAppLink(socio, montoCuota = 150000) {
    const cleanPhone = socio.telefono.replace(/\s+/g, "").replace(/^0/, "595");
    
    const formatCurrency = (val) => {
      return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(val);
    };

    const mensaje = `Estimado/a *${socio.nombre}*, le saludamos de la administración de *Club Nacional SDG* 🇵🇾⚽

Queríamos recordarle amablemente que su cuota correspondiente a la categoría *${socio.categoria}* se encuentra vencida. El monto pendiente es de *${formatCurrency(montoCuota)}*.

Puede regularizar su estado realizando una transferencia bancaria o depósito a nuestras cuentas, o vía QR. Una vez hecho el pago, responda a este mensaje con su comprobante para generarle su recibo digital.

¡Muchas gracias por su constante apoyo al desarrollo de nuestro club! 🙌`;

    const encodedText = encodeURIComponent(mensaje);
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  },

  /**
   * Lanzar redirección de WhatsApp
   * @param {Object} socio Objeto del socio
   */
  sendWhatsAppReminder(socio) {
    const link = this.generateWhatsAppLink(socio);
    window.open(link, "_blank");
  },

  /**
   * Imprimir Reporte en Formato HTML Limpio e Institucional
   */
  printHTMLReport(tipoLibro, mes, anio, transacciones) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("El navegador bloqueó la apertura de la ventana de impresión. Por favor, habilita las ventanas emergentes.");
      return;
    }

    const formatCurrency = (val) => {
      return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(val);
    };

    const mesNombres = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const periodoStr = (mes !== "todos" && mesNombres[parseInt(mes)]) ? `${mesNombres[parseInt(mes)]} ${anio !== "todos" ? anio : ""}` : (anio !== "todos" ? anio : "Todos los Períodos");
    const fechaImpresion = new Date().toLocaleString("es-PY");

    let libroTitulo = "";
    if (tipoLibro === "ingresos") {
      libroTitulo = "Libro de Ingresos";
    } else if (tipoLibro === "egresos") {
      libroTitulo = "Libro de Egresos";
    } else {
      libroTitulo = "Libro de Caja Diaria";
    }

    let tableHeadersHtml = "";
    let tableRowsHtml = "";

    if (tipoLibro === "ingresos") {
      tableHeadersHtml = `
        <tr>
          <th>Fecha</th>
          <th>Concepto</th>
          <th>Socio / Pagador</th>
          <th>Método de Pago</th>
          <th style="text-align: right;">Monto</th>
          <th>Observación / RUC</th>
        </tr>
      `;
      tableRowsHtml = transacciones.map(t => `
        <tr>
          <td>${new Date(t.fecha).toLocaleString("es-PY", { dateStyle: 'short', timeStyle: 'short' })}</td>
          <td>${t.concepto || "Cobro"}</td>
          <td><strong>${t.pagador || "Cliente General"}</strong></td>
          <td>${t.metodoPago || "Efectivo"}</td>
          <td style="text-align: right;" class="monto-ingreso">${formatCurrency(t.monto)}</td>
          <td>${t.ruc || t.observacion || "N/A"}</td>
        </tr>
      `).join("");
    } else if (tipoLibro === "egresos") {
      tableHeadersHtml = `
        <tr>
          <th>Fecha</th>
          <th>Concepto</th>
          <th>Categoría</th>
          <th>Comprobante / Método</th>
          <th style="text-align: right;">Monto</th>
          <th>Observación</th>
        </tr>
      `;
      tableRowsHtml = transacciones.map(t => `
        <tr>
          <td>${new Date(t.fecha).toLocaleString("es-PY", { dateStyle: 'short', timeStyle: 'short' })}</td>
          <td>${t.concepto || "Gasto"}</td>
          <td><span style="text-transform: capitalize;">${t.categoria || "Gasto"}</span></td>
          <td>${t.comprobante || "Sin Comprobante"}</td>
          <td style="text-align: right;" class="monto-egreso">${formatCurrency(t.monto)}</td>
          <td>${t.observacion || "N/A"}</td>
        </tr>
      `).join("");
    } else {
      tableHeadersHtml = `
        <tr>
          <th>Fecha</th>
          <th>Tipo</th>
          <th>Concepto / Detalle</th>
          <th>Categoría / Socio</th>
          <th>Comprobante / Método</th>
          <th style="text-align: right;">Monto</th>
          <th>Operador</th>
        </tr>
      `;
      tableRowsHtml = transacciones.map(t => {
        const isIngreso = t.tipo === "INGRESO";
        const catSocio = isIngreso ? (t.pagador || "Socio") : (t.categoria || "Egreso");
        const compMetodo = isIngreso ? (t.metodoPago || "Efectivo") : (t.comprobante || "Gasto");
        return `
          <tr>
            <td>${new Date(t.fecha).toLocaleString("es-PY", { dateStyle: 'short', timeStyle: 'short' })}</td>
            <td style="font-weight: bold; color: ${isIngreso ? '#2e7d32' : '#c62828'}">${t.tipo}</td>
            <td>${t.concepto || ""}</td>
            <td>${catSocio}</td>
            <td>${compMetodo}</td>
            <td style="text-align: right; font-weight: bold;" class="${isIngreso ? 'monto-ingreso' : 'monto-egreso'}">
              ${isIngreso ? '+' : '-'} ${formatCurrency(t.monto)}
            </td>
            <td>${t.usuario || "Auditor"}</td>
          </tr>
        `;
      }).join("");
    }

    if (transacciones.length === 0) {
      tableRowsHtml = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 30px; color: #666; font-style: italic;">
            No se registraron movimientos en este período contable.
          </td>
        </tr>
      `;
    }

    const totalIngresos = transacciones.filter(t => t.tipo === "INGRESO" || !t.tipo || tipoLibro === "ingresos").reduce((sum, t) => sum + (tipoLibro === "egresos" ? 0 : t.monto), 0);
    const totalEgresos = transacciones.filter(t => t.tipo === "EGRESO" || tipoLibro === "egresos").reduce((sum, t) => sum + (tipoLibro === "ingresos" ? 0 : t.monto), 0);
    const saldoNeto = totalIngresos - totalEgresos;

    let summaryHtml = "";
    if (tipoLibro === "ingresos") {
      summaryHtml = `
        <div class="summary-row">
          <span>Cantidad de Movimientos:</span>
          <span>${transacciones.length}</span>
        </div>
        <div class="summary-row">
          <span>Total Ingresos:</span>
          <span class="monto-ingreso">${formatCurrency(totalIngresos)}</span>
        </div>
      `;
    } else if (tipoLibro === "egresos") {
      summaryHtml = `
        <div class="summary-row">
          <span>Cantidad de Movimientos:</span>
          <span>${transacciones.length}</span>
        </div>
        <div class="summary-row">
          <span>Total Egresos:</span>
          <span class="monto-egreso">${formatCurrency(totalEgresos)}</span>
        </div>
      `;
    } else {
      summaryHtml = `
        <div class="summary-row">
          <span>Cantidad de Movimientos:</span>
          <span>${transacciones.length}</span>
        </div>
        <div class="summary-row">
          <span>Total Ingresos:</span>
          <span class="monto-ingreso">${formatCurrency(totalIngresos)}</span>
        </div>
        <div class="summary-row">
          <span>Total Egresos:</span>
          <span class="monto-egreso">${formatCurrency(totalEgresos)}</span>
        </div>
        <div class="summary-row">
          <span>Saldo Neto Período:</span>
          <span style="color: #1565c0;">${formatCurrency(saldoNeto)}</span>
        </div>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${libroTitulo} - Club Nacional SDG</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            color: #111;
            background: #fff;
            margin: 40px;
            line-height: 1.5;
          }
          .header {
            border-bottom: 2px solid #111;
            padding-bottom: 15px;
            margin-bottom: 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .header-info h1 {
            margin: 0 0 5px 0;
            font-size: 24px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0b1222;
          }
          .header-info h2 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #444;
          }
          .header-meta {
            text-align: right;
            font-size: 11px;
            color: #555;
            line-height: 1.6;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          th {
            background: #f5f5f5;
            color: #000;
            text-align: left;
            padding: 8px 10px;
            font-size: 11px;
            font-weight: 700;
            border-bottom: 2px solid #222;
            border-top: 1px solid #ccc;
          }
          td {
            padding: 8px 10px;
            font-size: 11px;
            border-bottom: 1px solid #eee;
          }
          tr:nth-child(even) td {
            background: #fafafa;
          }
          .summary-container {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
            page-break-inside: avoid;
          }
          .summary-box {
            width: 280px;
            border: 1px solid #ddd;
            background: #fcfcfc;
            padding: 12px;
            border-radius: 4px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            font-size: 11.5px;
            margin-bottom: 6px;
          }
          .summary-row:last-child {
            margin-bottom: 0;
            padding-top: 6px;
            border-top: 1px solid #ddd;
            font-weight: bold;
            font-size: 12px;
          }
          .monto-ingreso {
            color: #2e7d32;
          }
          .monto-egreso {
            color: #c62828;
          }
          .signatures-container {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
          }
          .signature-box {
            width: 200px;
            text-align: center;
            font-size: 10px;
            color: #555;
          }
          .signature-line {
            border-top: 1px solid #888;
            margin-bottom: 5px;
            width: 100%;
          }
          @media print {
            body {
              margin: 20px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            🖨️ Imprimir Reporte
          </button>
        </div>

        <div class="header">
          <div class="header-info">
            <h1>Club Nacional SDG</h1>
            <h2>${libroTitulo}</h2>
          </div>
          <div class="header-meta">
            <div><strong>Período:</strong> ${periodoStr}</div>
            <div><strong>Fecha de Impresión:</strong> ${fechaImpresion}</div>
            <div>Saltos del Guairá, Paraguay</div>
          </div>
        </div>

        <table>
          <thead>
            ${tableHeadersHtml}
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="summary-container">
          <div class="summary-box">
            ${summaryHtml}
          </div>
        </div>

        <div class="signatures-container">
          <div class="signature-box">
            <div class="signature-line"></div>
            <strong>Tesorero General</strong>
            <div>Club Nacional SDG</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <strong>Presidente / Secretario</strong>
            <div>Club Nacional SDG</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};
