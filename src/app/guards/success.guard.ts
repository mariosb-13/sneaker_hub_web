import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const successGuard: CanActivateFn = () => {
  const router = inject(Router);
  const navigation = router.getCurrentNavigation();

  // Comprobamos si en la navegación le hemos pasado la "llave" de acceso
  if (navigation?.extras?.state?.['orderSuccess']) {
    return true;
  }

  // Si intenta entrar por la cara, lo mandamos al carrito
  router.navigate(['/carrito']);
  return false;
};