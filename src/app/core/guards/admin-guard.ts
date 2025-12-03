import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = () => {

  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.currentUserData) {
    if (auth.currentUserData.role === 'admin') {
      return true;
    } else {
      router.navigateByUrl('/');
      return false;
    }
  }

  return new Promise<boolean>((resolve) => {

    const unsubscribe = auth.onUserDataChange((userData) => {

      if (!userData) {
        router.navigateByUrl('/');
        resolve(false);
      } else if (userData.role === 'admin') {
        resolve(true);
      } else {
        router.navigateByUrl('/');
        resolve(false);
      }
    });

  });
};
    