import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth';

export const programadorGuard: CanActivateFn = () => {

  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.getRole() === 'programador') {
    return true;
  }

  router.navigateByUrl('/');
  return false;
};
