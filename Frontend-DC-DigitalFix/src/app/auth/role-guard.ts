import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth';

/**
 * Guard de autorización por rol. Se encadena DESPUÉS de MsalGuard:
 * MsalGuard garantiza que hay sesión; roleGuard revisa el claim "roles".
 *
 *   canActivate: [MsalGuard, roleGuard(ROLES.ADMIN, ROLES.SUPERVISOR)]
 */
export function roleGuard(...allowed: string[]): CanActivateFn {
  return () => {
    const auth = inject(Auth);
    const router = inject(Router);

    auth.sync();

    // Sin sesión no decidimos aquí: MsalGuard ya disparó el redirect a Microsoft.
    if (!auth.isLoggedIn()) return false;

    return auth.hasAnyRole(allowed) ? true : router.createUrlTree(['/forbidden']);
  };
}
