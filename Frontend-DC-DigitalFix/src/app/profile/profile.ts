import { Component, inject } from '@angular/core';
import { Auth } from '../auth/auth';

@Component({
  selector: 'app-profile',
  template: `
    <h2>Perfil del usuario</h2>

    @if (auth.account(); as a) {
      <table>
        <tr><th>Nombre</th><td>{{ a.name }}</td></tr>
        <tr><th>Usuario</th><td>{{ a.username }}</td></tr>
        <tr><th>Tenant</th><td>{{ a.tenantId }}</td></tr>
        <tr><th>Roles</th><td>{{ auth.roles().join(', ') || 'sin roles asignados' }}</td></tr>
      </table>
    } @else {
      <p>No hay sesión activa.</p>
    }
  `,
})
export class Profile {
  protected readonly auth = inject(Auth);
}
