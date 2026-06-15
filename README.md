# Clavel y Azahar 🌸 — Floristería en Los Ramos, Murcia

Web de **Clavel y Azahar** (eslogan «El nuevo aroma de Entre Ramblas»), floristería en Los Ramos (Murcia). Negocio adquirido por traspaso de *Entre Ramblas*. Construida como Single Page Application (SPA) con **React**, **Vite** y **Tailwind CSS**. Los datos del negocio pendientes de confirmar están listados en [PENDIENTES.md](./PENDIENTES.md).

---

## 🛠️ Tecnologías utilizadas

- **React 18** - Biblioteca de JavaScript para construir interfaces de usuario.
- **Vite 6** - Herramienta de compilación ultrarrápida para el desarrollo moderno.
- **React Router DOM v6** - Sistema de enrutamiento dinámico para navegar entre páginas sin recargar.
- **Tailwind CSS v3** - Framework de CSS orientado a utilidades para un diseño premium y responsive.
- **PostCSS / Autoprefixer** - Procesamiento de estilos CSS.
- **Supabase** - Base de datos, almacenamiento de fotos y autenticación del panel de la dueña.

---

## 🔐 Panel de gestión de la dueña (`/admin`)

La web incluye un panel privado en **`/admin`** para que la dueña suba fotos, cree
eventos y edite textos y datos del negocio **sin tocar código**. La web pública
sigue siendo estática y rápida; el contenido editable se carga de la base de datos
y, si aún no hay nada, se muestran los valores de ejemplo (la web nunca se rompe).

Para activarlo hay que conectar Supabase una sola vez (≈15 min). Pasos detallados
en **[SETUP_PANEL.md](./SETUP_PANEL.md)**. El esquema de la base de datos está en
[`supabase/schema.sql`](./supabase/schema.sql).

---

## 📋 Requisitos previos

Asegúrate de tener instalado en tu sistema:
- **Node.js** (versión 18 o superior recomendada)
- **pnpm** (gestor de paquetes rápido, eficiente y seguro)

Puedes comprobar si los tienes instalados ejecutando en tu terminal:
```bash
node -v
pnpm -v
```

---

## 🚀 Instrucciones para ejecutar el proyecto

Sigue estos sencillos pasos para poner en marcha el proyecto de forma local:

### 1. Clonar o acceder al directorio del proyecto
Abre la terminal en la carpeta raíz del proyecto (`floristeria`).

### 2. Instalar dependencias
Instala todos los paquetes necesarios declarados en el archivo `package.json` ejecutando:
```bash
pnpm install
```

### 3. Iniciar el servidor de desarrollo
Para levantar el servidor local y empezar a trabajar o visualizar la web, ejecuta:
```bash
pnpm dev
```
Una vez iniciado, la consola mostrará la URL local (normalmente `http://localhost:5173/`). Abre esa dirección en tu navegador para ver la aplicación en tiempo real.

---

## 📦 Construcción para Producción

Si deseas compilar el proyecto optimizado para subirlo a producción:

1. **Generar la build de producción:**
   ```bash
   pnpm build
   ```
   Esto creará una carpeta llamada `dist/` en la raíz del proyecto con todo el código HTML, CSS y JS optimizado y minificado.

2. **Previsualizar la build de producción de forma local:**
   ```bash
   pnpm preview
   ```
   Esto levantará un servidor local rápido para comprobar el comportamiento final del código compilado en la carpeta `dist/`.

---

## 📁 Estructura del proyecto

A continuación se detalla la estructura principal de archivos creados para React:

```text
floristeria/
├── dist/                  # Archivos compilados para producción (se genera tras ejecutar pnpm build)
├── node_modules/          # Dependencias gestionadas por pnpm
├── pnpm-lock.yaml         # Archivo de bloqueo de dependencias de pnpm
├── src/
│   ├── components/        # Componentes reutilizables
│   │   ├── Navbar.jsx     # Barra de navegación superior (persistente y adaptativa)
│   │   └── Footer.jsx     # Pie de página de la web (persistente)
│   ├── pages/             # Páginas individuales de la web (enrutadas por React Router)
│   │   ├── Inicio.jsx     # Página principal
│   │   ├── Colecciones.jsx# Galería de ramos y flores
│   │   ├── Servicios.jsx  # Sección de servicios de floristería (bodas, eventos, talleres...)
│   │   └── Contacto.jsx   # Formulario de contacto e información de contacto
│   ├── App.jsx            # Enrutador principal y layout general
│   ├── index.css          # Estilos globales y directivas de Tailwind CSS
│   └── main.jsx           # Punto de entrada de React que renderiza App.jsx en el DOM
├── index.html             # Plantilla HTML base cargada por Vite
├── package.json           # Scripts de ejecución y dependencias del proyecto
├── tailwind.config.js     # Configuración de Tailwind CSS
├── postcss.config.js      # Configuración de PostCSS
└── vite.config.js         # Configuración de Vite para soporte de React
```
