import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AuthService } from '../services/auth';
import { User } from 'firebase/auth';

export const authGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const user: User | null = await new Promise(resolve => {
    const unsub = authService.onAuthChange(u => {
      resolve(u);
      unsub();
    });
  });

  if (!user) {
    router.navigateByUrl('/');
    return false;
  }

  return true;
};
