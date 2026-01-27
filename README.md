# SneakerHub – Store

## Descripción del Proyecto

**SneakerHub** es una aplicación web orientada a la exposición y venta de zapatillas de colección. Este repositorio corresponde a la primera fase del proyecto, centrada en la **maquetación y diseño de interfaces** mediante **Angular** y **Bootstrap 5**.

El objetivo principal de esta fase es la implementación de al menos el **50 % de las vistas principales**, priorizando una experiencia de usuario clara, un diseño totalmente responsivo y una correcta organización del proyecto basada en componentes reutilizables.

La aplicación se encuentra desplegada y accesible públicamente en el siguiente enlace:

**Demo en producción (Render):**
[https://sneaker-hub-web.onrender.com](https://sneaker-hub-web.onrender.com)

---

## Estructura del Proyecto

La aplicación sigue las buenas prácticas recomendadas por Angular, separando responsabilidades y organizando la interfaz en componentes bien definidos:

* **Auth**
  Gestión de autenticación, incluyendo:

  * `Login`
  * `Signin` (registro de usuarios)

* **Sneaker**
  Gestión del catálogo de productos:

  * `SneakerList`: galería dinámica de zapatillas
  * `SneakerDetails`: vista detallada de cada modelo
  * `SneakerResume`: componente reutilizable para mostrar información resumida de productos

* **Core UI**
  Componentes globales compartidos:

  * `Navbar`
  * `Footer`

* **Home**
  Página principal de aterrizaje con secciones destacadas.

* **Models**
  Definición de interfaces y modelos de datos para garantizar consistencia y tipado fuerte.

---

## Enrutamiento (Angular Router)

Se ha implementado un sistema de rutas dinámicas utilizando **Angular Router**, permitiendo una navegación clara y escalable:

* `/home` – Página principal
* `/login` y `/signin` – Vistas de autenticación
* `/products/:category` – Listado filtrado por categoría
* `/product/:id` – Vista de detalles mediante parámetros dinámicos

El uso de parámetros en la URL permite una navegación semántica y facilita la escalabilidad futura del proyecto.

---

## Maquetación y Uso de Bootstrap 5

El diseño visual de la aplicación se ha desarrollado principalmente con **Bootstrap 5**, reduciendo al mínimo el uso de estilos personalizados:

* **Sistema de rejilla**
  Uso de `container`, `row` y `col` para una adaptación fluida a diferentes tamaños de pantalla.

* **Componentes**
  Implementación de `navbars` responsivas, `cards` para el catálogo de productos y formularios con clases utilitarias.

* **Diseño responsivo**
  Uso de breakpoints (`sm`, `md`, `lg`) para garantizar una experiencia consistente en dispositivos móviles, tablets y escritorio.

### Uso de SCSS

El uso de **SCSS** se limita a aquellos casos donde Bootstrap no cubre las necesidades de personalización:

* Definición de variables de color corporativas.
* Efectos hover personalizados en tarjetas de producto.
* Ajustes específicos de layout no cubiertos por clases utilitarias estándar.

---

## Instalación y Ejecución en Local

1. Clonar el repositorio:

   ```bash
   git clone [URL-del-repositorio]
   ```
2. Instalar dependencias:

   ```bash
   npm install
   ```
3. Ejecutar el servidor de desarrollo:

   ```bash
   ng serve
   ```
4. Acceder desde el navegador:

   ```
   http://localhost:4200
   ```

---

## Dificultades Encontradas y Mejoras Futuras

### Dificultades

* Ajuste del diseño responsivo en la vista de detalle del producto, manteniendo una jerarquía visual clara en pantallas pequeñas.

### Mejoras Futuras

* Integración con una API real para la gestión de productos.
* Implementación de servicios y gestión de estado para el carrito de compras.
* Filtros avanzados por talla, precio y marca.
* Autenticación completa y persistencia de sesión.