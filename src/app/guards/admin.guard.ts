import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { Database, ref, get } from '@angular/fire/database';
import { switchMap } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const db = inject(Database);
  const router = inject(Router);

  return authState(auth).pipe(
    switchMap(async (user) => {
      // Si no hay usuario logueado, lo mandamos al login
      if (!user) {
        router.navigate(['/login']);
        return false;
      }
      
      try {
        // Buscamos su rol en la base de datos
        const snapshot = await get(ref(db, `users/${user.uid}`));
        if (snapshot.exists() && snapshot.val().rol === 'admin') {
          return true; // ¡Es admin, le dejamos pasar!
        }
        
        // Si está logueado pero NO es admin, lo echamos al home
        router.navigate(['/home']);
        return false;
      } catch (error) {
        router.navigate(['/home']);
        return false;
      }
    })
  );
};