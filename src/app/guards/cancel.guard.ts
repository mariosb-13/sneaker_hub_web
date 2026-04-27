import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const cancelGuard: CanActivateFn = () => {
  const router = inject(Router);
  const navigation = router.getCurrentNavigation();

  if (navigation?.extras?.state?.['orderCancelled']) {
    return true;
  }

  router.navigate(['/carrito']);
  return false;
};