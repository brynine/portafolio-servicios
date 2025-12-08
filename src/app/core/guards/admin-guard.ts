import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = async () => {

  const auth = inject(AuthService);
  const router = inject(Router);

  // espera a que firebase determine sesión y rol
  await auth.authReady;

  // permite acceso solo si el usuario es admin
  if (auth.currentUserData?.role === 'admin') {
    return true;
  }

  // si no es admin redirige y bloquea acceso
  router.navigateByUrl('/');
  return false;
};
