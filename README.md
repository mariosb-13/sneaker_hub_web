# SneakerHub – Frontend & UI Layout Architecture

## Descripción del Proyecto

**SneakerHub** es una aplicación web de comercio electrónico (SPA) desarrollada con **Angular 19**.

Este repositorio abarca la fase de **Maquetación y Diseño de Interfaz**, con el objetivo de establecer una arquitectura visual robusta, escalable y altamente responsiva. El desarrollo se ha centrado en la implementación de patrones de diseño modernos, priorizando la experiencia de usuario en dispositivos móviles (Mobile First) sin comprometer la funcionalidad en entornos de escritorio.

**Demo en producción:**
[https://sneakerhub.es](https://sneakerhub.es)

---

## Stack Tecnológico

* **Framework:** Angular 19 (Arquitectura basada en Standalone Components).
* **Maquetación:** HTML5 Semántico y Bootstrap 5.
* **Estilos:** SCSS (Sass) para personalización avanzada y CSS nativo.
* **Iconografía:** Bootstrap Icons.
* **Control de Versiones:** Git.

---

## Estructura del Proyecto

El proyecto sigue una arquitectura modular organizada por funcionalidad ("Feature-based structure"), separando claramente las responsabilidades de cada sección de la aplicación. A continuación se detalla la organización del directorio `src/app`:

### 1. Componentes (`/components`)

Directorio principal que agrupa todas las vistas y bloques lógicos de la interfaz:

* **Auth (`/auth`):** Contiene los componentes relacionados con la gestión de usuarios.
* `/login`: Formulario de inicio de sesión.
* `/signin`: Formulario de registro de nuevos usuarios.


* **Estructura Global:**
* `/navbar`: Barra de navegación principal. Incluye lógica responsiva para colapsar menús en móvil y reorganizar elementos en escritorio.
* `/footer`: Pie de página con enlaces de navegación secundaria e información legal.


* **Home (`/home`):** Componente de la página de inicio (Landing Page). Gestiona la lógica de visualización condicional entre el banner estático (móvil) y el carrusel dinámico (escritorio).
* **Sneaker (`/sneaker`):** Módulo funcional para la gestión del catálogo. Incluye tanto el listado de productos (`list`) como la vista de detalle individual (`details`).

### 2. Modelos de Datos (`/models`)

Directorio destinado a las interfaces y tipos de TypeScript (por ejemplo, `sneaker.model.ts`). Su función es garantizar el tipado estricto de los datos que fluyen por la aplicación, asegurando la consistencia entre la vista y la lógica de negocio.

### 3. Configuración Raíz

Archivos de configuración a nivel de aplicación (Angular Standalone):

* `app.routes.ts`: Definición del enrutamiento y carga de componentes (Lazy Loading).
* `app.config.ts`: Configuración global de proveedores, incluyendo la inicialización del Router y otros servicios transversales.
* `app.component.*`: Componente raíz que actúa como contenedor principal (`<router-outlet>`).

---

## Estrategia de Maquetación y Diseño

La interfaz se ha construido utilizando una combinación de las utilidades de Bootstrap para la estructura y SCSS personalizado para la identidad visual.

### Sistema de Rejilla y Adaptabilidad

La aplicación implementa un diseño fluido que responde a los puntos de ruptura estándar (`sm`, `md`, `lg`, `xl`):

1. **Grid System:** Uso de `container-fluid` para secciones de ancho completo (Headers, Heros móviles) y `container` para limitar el ancho máximo de contenido en pantallas grandes (Carruseles, Grids de productos).
2. **Flexbox:** Alineación y distribución de elementos mediante clases de utilidad (`d-flex`, `justify-content-between`, `align-items-center`), permitiendo reordenar elementos visualmente sin alterar el DOM.

### Experiencia Diferenciada por Dispositivo

Se han implementado estrategias de renderizado condicional para optimizar la UX:

* **Home Component:**
* **Móvil:** Se renderiza una imagen estática vertical (`65vh`) con un overlay degradado. Esto mejora el rendimiento y la legibilidad en pantallas verticales, eliminando la carga innecesaria de scripts de carrusel.
* **Escritorio:** Se renderiza un carrusel interactivo encapsulado en un contenedor con bordes redondeados (`rounded-4`) y sombras, alineado con el grid de productos inferior.


* **Navegación:** Adaptación dinámica del menú, pasando de un menú hamburguesa lateral (Offcanvas o Dropdown) en móviles a una barra horizontal expandida en escritorio.

### Estilizado Avanzado (SCSS)

El uso de SCSS se ha reservado para aspectos que requieren mayor precisión que la ofrecida por el framework base:

* **Control de Imágenes:** Aplicación estricta de `object-fit: cover` y alturas fijas en las tarjetas de producto para evitar deformaciones y mantener la alineación del grid.
* **Micro-interacciones:** Implementación de efectos `hover` con transformaciones de escala (`scale 1.05`) y transiciones suaves para mejorar la interactividad.
* **Legibilidad:** Creación de capas de superposición (overlays) con degradados `linear-gradient` para asegurar el contraste del texto sobre imágenes dinámicas.

---

## Instalación y Ejecución

Para desplegar el entorno de desarrollo local:

1. **Clonar el repositorio:**
```bash
git clone [URL-del-repositorio]

```


2. **Instalar dependencias:**
```bash
npm install

```


3. **Ejecutar servidor:**
```bash
ng serve

```


4. **Acceso:**
Abrir el navegador en `http://localhost:4200`.
