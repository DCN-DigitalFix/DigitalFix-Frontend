import { Component, inject } from '@angular/core';
import { Auth } from '../auth/auth';

@Component({
  selector: 'app-home',
  template: `
    <h2>Plataforma de órdenes de trabajo</h2>

    @if (auth.isLoggedIn()) {
      <p>Sesión iniciada como {{ auth.displayName() }}.</p>
      <p>Roles: {{ auth.roles().join(', ') || 'sin roles asignados' }}</p>
    } @else {
      <p>Inicia sesión con tu cuenta corporativa para acceder al sistema.</p>
    }
  `,
})
export class Home {
  protected readonly auth = inject(Auth);
}
