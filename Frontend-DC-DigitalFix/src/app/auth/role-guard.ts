import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth';

/**
 * Guard de autorizacion por rol. Se encadena DESPUES de MsalGuard:
 * MsalGuard garantiza que hay sesion; roleGuard revisa el claim "roles"
 * del access token emitido para la API.
 */
export function roleGuard(...allowed: string[]): CanActivateFn {
  return async () => {
    const auth = inject(Auth);
    const router = inject(Router);

    // Espera a que haya un access token: los roles viajan en el.
    await auth.refresh();

    if (!auth.isLoggedIn()) return false;

    return auth.hasAnyRole(allowed) ? true : router.createUrlTree(['/forbidden']);
  };
}