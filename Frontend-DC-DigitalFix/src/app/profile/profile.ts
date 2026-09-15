import { Component, inject } from '@angular/core';
import { Auth } from '../auth/auth';
import { environment } from '../../environments/environments';

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
        <tr><th>Scopes</th><td>{{ auth.scopes().join(', ') || 'sin scopes' }}</td></tr>
      </table>
      <p class="hint">
        Roles y scopes se leen del access token emitido para la API
        (aud = {{ audience }}).
      </p>
    } @else {
      <p>No hay sesion activa.</p>
    }
  `,
  styles: `.hint { color: #5b6672; font-size: 0.85rem; }`,
})
export class Profile {
  protected readonly auth = inject(Auth);
  protected readonly audience = environment.azure.apiAudience;
}