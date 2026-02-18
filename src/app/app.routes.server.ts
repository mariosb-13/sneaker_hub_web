import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rutas estáticas conocidas
  { path: 'login', renderMode: RenderMode.Server },
  { path: 'signin', renderMode: RenderMode.Server },
  { path: 'home', renderMode: RenderMode.Server },

  // Esta línea le dice al servidor: "Cualquier cosa que no sea lo anterior (incluyendo products/ y product/), 
  // no intentes validarla ahora, procésala solo cuando el cliente la pida".
  { path: '**', renderMode: RenderMode.Server }
];