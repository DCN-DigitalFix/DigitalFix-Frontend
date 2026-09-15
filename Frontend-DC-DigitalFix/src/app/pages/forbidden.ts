import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../auth/auth';

@Component({
  selector: 'app-forbidden',
  imports: [RouterLink],
  template: `
    <h2>403 · Acceso denegado</h2>
    <p>Tu sesión es válida, pero tu rol no permite acceder a esta sección.</p>
    <p>Roles actuales: {{ auth.roles().join(', ') || 'ninguno' }}</p>
    <a routerLink="/dashboard">Volver al dashboard</a>
  `,
})
export class Forbidden {
  protected readonly auth = inject(Auth);
}
