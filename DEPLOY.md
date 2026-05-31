# Guía de Despliegue Profesional y Configuración de Base de Datos Cloud (Supabase + Netlify) 🇵🇾🛡️

Esta guía detalla el paso a paso para desplegar **Club Manager Pro PY** en producción y configurarlo de manera segura con una base de datos relacional PostgreSQL real y persistente en la nube mediante **Supabase** y alojamiento automático en **Netlify**.

---

## 📁 1. Estructura del Proyecto

El sistema está diseñado como una Single Page Application (SPA) modular y ultra rápida, estructurada de la siguiente manera:

```text
club-manager-pro-py/
├── index.html          # Interfaz principal SPA, scripts CDN de soporte y claves globales de Supabase
├── schema.sql          # Script SQL para estructurar la base de datos PostgreSQL de Supabase
├── setup-git.bat       # Script utilitario para inicialización rápida del repositorio local
├── DEPLOY.md           # Esta guía detallada de despliegue y administración
├── README.md           # Resumen general del sistema y credenciales de prueba
├── css/
│   └── styles.css      # Sistema de diseño visual premium (modo oscuro, variables HSL, responsive)
├── js/
│   ├── database.js     # Motor de base de datos dual (Simulador Local <=> Sincronización en la Nube Supabase)
│   ├── receipt.js      # Generación de recibos PDF (jsPDF), exportación de balances Excel e impresión nativa
│   ├── ui.js           # Renderizador dinámico de vistas, tableros KPI, gráficos (Chart.js) y alertas
│   ├── notifications.js# Motor de notificaciones y recordatorios para cobranzas y morosidad
│   └── app.js          # Controlador lógico de la SPA, enrutador, autenticación y auditoría
├── img/
│   └── logo.jpg        # Logo institucional del club (membrete e impresiones)
```

---

## ⚡ 2. Paso a Paso: Crear Repositorio y Subir a GitHub

Sigue estos comandos desde tu consola en la carpeta del proyecto para subir tu código a GitHub de forma profesional:

### Paso 2.1: Inicializar Git Local
Abre una terminal o PowerShell en la carpeta del proyecto y ejecuta:
```bash
# Inicializar repositorio local
git init

# Agregar todos los archivos al área de preparación (staging)
git add .

# Crear el primer commit de producción
git commit -m "feat: implementacion de persistencia real en la nube, logs de auditoria y backups contables"
```

### Paso 2.2: Crear el repositorio en GitHub
1. Ingresa a tu cuenta en [GitHub](https://github.com).
2. Haz clic en el botón **New** (Nuevo repositorio) en la esquina superior izquierda.
3. Asígnale el nombre: `club-manager-pro-py`.
4. Elige si prefieres que sea **Público** o **Privado** (Privado es recomendado para resguardar la confidencialidad del club).
5. **IMPORTANTE:** Déjalo completamente en blanco (no marques "Add a README", ni `.gitignore`, ni licencia, ya que el proyecto ya los incluye).
6. Haz clic en **Create repository**.

### Paso 2.3: Vincular y Subir a GitHub
Copia las instrucciones de GitHub para subir un repositorio existente:
```bash
# Vincular con tu repositorio remoto (reemplaza 'TU_USUARIO' con tu nombre de usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/club-manager-pro-py.git

# Renombrar la rama a la estándar 'main'
git branch -M main

# Subir el código por primera vez
git push -u origin main
```

---

## ☁️ 3. Conexión y Despliegue en Netlify

Netlify compilará y alojará tu SPA de forma gratuita con certificados de seguridad SSL automáticos (HTTPS):

1. Regístrate o ingresa en [Netlify](https://www.netlify.com) (puedes iniciar sesión directamente con tu cuenta de GitHub).
2. En tu panel de Netlify, haz clic en **Add new site** > **Import an existing project**.
3. Selecciona **GitHub** como proveedor de Git y autoriza el acceso a tus repositorios.
4. Elige tu repositorio `club-manager-pro-py`.
5. En la configuración de construcción (**Build settings**):
   - **Branch to deploy:** `main`
   - **Build command:** (Déjalo en blanco, ya que es una SPA HTML/JS puro y no requiere compilación previa).
   - **Publish directory:** `.` (Punto, que representa el directorio raíz).
6. Haz clic en **Deploy club-manager-pro-py**.
7. En menos de un minuto tu sitio estará online. Netlify te proveerá un subdominio gratuito tipo `https://club-nacional-sdg.netlify.app` con HTTPS activo de manera permanente.

> [!TIP]
> **Despliegues Automáticos:** Cada vez que realices cambios en tu código y hagas un `git push origin main` a GitHub, Netlify detectará la actualización y reconstruirá tu aplicación online en segundos de manera automática, sin intervención manual.

---

## 🗄️ 4. Configuración de Base de Datos Real en Supabase (PostgreSQL)

Conectar tu base de datos de Supabase persistirá toda la contabilidad contable y fichas del club en la nube de forma segura:

### Paso 4.1: Crear tu Cuenta y Proyecto
1. Ingresa a [Supabase](https://supabase.com) y regístrate gratis.
2. Crea una nueva organización y haz clic en **New Project**.
3. Configura los datos de tu proyecto:
   - **Name:** `Club Nacional SDG`
   - **Database Password:** Crea una contraseña segura y anótala (la necesitarás para respaldos directos).
   - **Region:** Elige una cercana a tu ubicación (e.g., `sa-east-1` en São Paulo para la mejor latencia en Paraguay).
   - **Plan:** Free Plan (Gratuito).
4. Haz clic en **Create new project** y espera 1 o 2 minutos a que se configure tu base de datos.

### Paso 4.2: Estructurar las Tablas (Editor SQL)
1. En tu panel lateral de Supabase, dirígete a **SQL Editor**.
2. Haz clic en **New Query** (Nueva consulta).
3. Abre el archivo [schema.sql](file:///C:/Users/user/.gemini/antigravity/scratch/club-manager-pro-py/schema.sql) del proyecto, copia todo su contenido y pégalo en el editor SQL de Supabase.
4. Haz clic en **Run** (Ejecutar) en la esquina inferior derecha.
5. El editor indicará `Success`. Esto habrá estructurado tus tablas relacionales (`socios`, `clientes`, `ingresos`, `egresos`, `caja_estado`, `caja_historial`, `auditoria`) e insertado los registros de datos semilla automáticamente en tu base de datos cloud.

### Paso 4.3: Obtener Claves API y Conectar
1. Dirígete a **Project Settings** (icono de engranaje) en el panel izquierdo y selecciona **API**.
2. Copia los siguientes dos valores:
   - **Project URL** (e.g., `https://xxxxxx.supabase.co`)
   - **Anon Key** (Clave pública anon, e.g., `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
3. Abre el archivo `index.html` de tu proyecto y localiza el bloque de configuración en el `<head>` (Líneas 23-32):
   ```html
   <script>
     // =======================================================================
     // CONFIGURACIÓN DE CONEXIÓN A TU BASE DE DATOS REAL EN LA NUBE (SUPABASE)
     // =======================================================================
     // Si dejas estas claves vacías, la app operará de forma segura en "Modo Simulador local" persistente.
     // Pega aquí tus credenciales de Supabase para activar la base de datos en la nube:
     window.SUPABASE_URL = "TU_PROJECT_URL_DE_SUPABASE";
     window.SUPABASE_KEY = "TU_ANON_KEY_DE_SUPABASE";
   </script>
   ```
4. Reemplaza los valores correspondientes dentro de las comillas, guarda el archivo y haz `git commit` y `git push` a tu repositorio. ¡Listo! Tu portal estará conectado en tiempo real a Supabase PostgreSQL y los datos se mantendrán sincronizados entre múltiples celulares y computadoras al instante.

---

## 🛡️ 5. Administración Contable y Planes de Backups

La seguridad e integridad de la contabilidad contable y padrón de socios del club es primordial:

### 📥 A. Backups Manuales (JSON)
*   Cualquier operador con rol de **Administrador** o **Tesorero** puede ingresar a la pestaña **Reportes y Avisos** en el menú.
*   En el panel de herramientas, haz clic en **Respaldar Base de Datos (JSON)**.
*   El sistema recopilará de forma segura todas las tablas y cachés, estructurará un archivo estructurado con fecha y hora actual y lo descargará directamente en tu computadora o celular.
*   Esta acción quedará registrada de forma transparente en el feed en vivo de **Auditoría Contable** para evitar fugas de información.

### 💾 B. Backups Automáticos en Supabase (Nube)
*   Por defecto, Supabase realiza copias de seguridad diarias completas de tu base de datos de manera automatizada.
*   Si deseas realizar un backup SQL directo desde Supabase:
    1. Ve a **Database** en el panel lateral de tu proyecto Supabase.
    2. Selecciona **Backups** y realiza una descarga manual inmediata en formato `.sql`.

### 🔎 C. Auditoría Contable y Transparencia
*   Todas las acciones críticas realizadas en el portal (crear socios, registrar egresos, ajustar arqueos de caja, borrar registros contables o generar respaldos) registran automáticamente una traza inalterable con:
    - **Operador:** Quién realizó la acción.
    - **Nivel/Rol:** Permisos del operador.
    - **Fecha y Hora:** Timestamp exacto del cambio.
    - **Acción:** Nombre técnico (e.g. `CREAR_SOCIO`, `ELIMINAR_EGRESO`).
    - **Detalles del Cambio:** Resumen legible del impacto financiero o de datos.
*   El panel de **Historial de Auditoría Contable** es visible en tiempo real en la vista de **Reportes** para garantizar la transparencia financiera y evitar fraudes administrativos.

---

## 🚀 6. Comandos Utilitarios para Actualizaciones Futuras

Cuando decidas hacer mejoras en el código de tu aplicación, utiliza el siguiente flujo en tu terminal para publicar los cambios online instantáneamente:

```bash
# 1. Comprobar qué archivos modificaste
git status

# 2. Agregar los cambios al área de preparación
git add .

# 3. Registrar el commit descriptivo
git commit -m "docs: actualizacion de manuales y ajustes menores en interfaz"

# 4. Enviar a GitHub para despliegue automatico en Netlify
git push origin main
```

---

Con esta infraestructura, **Club Deportivo Nacional SDG** cuenta con un portal administrativo robusto, resistente a caídas de conexión, con alta confidencialidad y a la vanguardia de la tecnología contable deportiva en Paraguay. 🇵🇾⚽🏆
