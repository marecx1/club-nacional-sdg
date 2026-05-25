Sistema de Gestión Integral Contable, Deportiva y Social
Club Manager Pro PY es una plataforma web SPA (Single Page Application) de alto rendimiento, diseñada a medida para la administración y contabilidad del Club Nacional SDG (fundado el 2 de febrero de 1975 en Saltos del Guairá, Paraguay).

El sistema optimiza el control de ingresos por cuotas y servicios comerciales, registra el flujo de caja en tiempo real y automatiza la cobranza de socios mediante una interfaz ultra-moderna, intuitiva y fluida.

🎯 Características Principales
1. 📖 Libros Contables e Impresión de Alta Fidelidad
Libro de Ingresos y Egresos: Reportes detallados ordenados cronológicamente por mes y año.
Impresión Nativa A4: Sistema de impresión nativa (window.print()) optimizado en blanco y negro de alto contraste, diseñado bajo estándares institucionales aptos para el archivo físico y digital del club, ocultando barras de navegación y elementos SPA innecesarios.
Libro de Caja Diaria: Ledger consolidado que unifica de forma intercalada y visual todos los cobros y gastos del período seleccionado.
2. 💼 Módulo de Caja Diaria y Arqueos
Control de Jornada: Apertura y cierre de caja diaria con saldo inicial de apertura y balance consolidado en tiempo real.
Historial de Arqueos (CRUD): Modificación, borrado y recalculo dinámico inmediato de cierres de caja históricos.
3. 👥 Gestión de Socios y Carnet Digital Premium
Carnet Digital Interactivo: Tarjeta de identificación personalizada según la categoría del socio (Titular, Familiar, Juvenil, Vitalicio).
Código QR Incorporado: Generación local de códigos QR en tiempo real para control de accesos e inspección de estado del socio.
Buscador Inteligente: Filtros predictivos instantáneos por documento de identidad (C.I.), nombre o número de ficha del socio.
4. 💰 Gestión de Clientes Comerciales y Externos
Facturación Comercial: Catálogo dedicado de clientes comerciales independientes para el registro detallado de alquileres de salones comerciales y reembolsos de servicios de electricidad (ANDE) sin alterar la base de datos oficial de socios deportivos.
Emisor de Recibos en Guaraníes (Gs.): Generación automática de comprobantes y recibos digitales oficiales en PDF con firma y sello contable validado.
5. 📢 Alertas y Cobranza Automatizada
Integración con WhatsApp: Generación automática de enlaces directos a WhatsApp Web con mensajes de cobranza y estados de cuenta personalizados para socios en estado moroso.
Historial de Alertas: Panel centralizado de notificaciones y alertas de caja auditada.
🛠️ Stack Tecnológico y Arquitectura
Core Frontend: HTML5 Semántico y Javascript ES6+ modularizado en capas desacopladas (Vistas, Modelos y Controladores) para facilitar una futura migración a frameworks como React o Vue.
Diseño Premium (CSS3): Paleta de colores HSL curada, sombras suaves, transiciones fluidas, diseño ultra-moderno adaptado a pantallas táctiles y móviles (Mobile First).
Gráficos en Tiempo Real: Comparativa financiera de ingresos vs. egresos ejecutada mediante Chart.js.
Generación de Archivos: Integración nativa asíncrona con jsPDF para exportaciones robustas a PDF resistentes a bloqueos de navegadores y descargas locales directas.
Persistencia: Simulación relacional robusta en memoria local persistida mediante LocalStorage de forma asíncrona, estructurada limpiamente para una futura integración nativa con bases de datos en la nube como Supabase o Firebase.
