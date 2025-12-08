import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const programadorGuard: CanActivateFn = async () => {

  const auth = inject(AuthService);
  const router = inject(Router);

  // espera a que firebase determine sesión y rol
  await auth.authReady;

  // permite acceso solo si el usuario es programador
  if (auth.getRole() === 'programador') {
    return true;
  }

  // si no tiene el rol, bloquea acceso y redirige
  router.navigateByUrl('/');
  return false;
};
