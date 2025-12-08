import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {

  const auth = inject(AuthService);
  const router = inject(Router);

  // espera a que firebase determine si existe sesión
  await auth.authReady;

  // obtiene usuario actual desde firebase auth
  const user = auth.getCurrentUser();

  // si no hay sesión, bloquea acceso y redirige
  if (!user) {
    router.navigateByUrl('/');
    return false;
  }

  // si hay usuario permite el acceso
  return true;
};
