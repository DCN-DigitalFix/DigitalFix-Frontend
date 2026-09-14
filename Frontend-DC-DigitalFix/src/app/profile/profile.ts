import { Component, computed, inject, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
 
interface UserProfile {
    id?: string;
    displayName?: string;
    givenName?: string;
    surname?: string;
    mail?: string;
    userPrincipalName?: string;
    jobTitle?: string;
    department?: string;
    companyName?: string;
    officeLocation?: string;
    city?: string;
    country?: string;
    mobilePhone?: string;
    businessPhones?: string[];
    preferredLanguage?: string;
}
 
// Campos solicitados explícitamente para reducir el tamaño de la respuesta
const SELECT_FIELDS = [
    'id', 'displayName', 'givenName', 'surname',
    'mail', 'userPrincipalName', 'jobTitle', 'department',
    'companyName', 'officeLocation', 'city', 'country',
    'mobilePhone', 'businessPhones', 'preferredLanguage'
].join(',');
 
@Component({
  selector: 'app-profile',
  standalone: true,
  template: `
    <div style="padding: 20px;">
      <h2>Perfil del Usuario</h2>
      @if (account(); as a) {
        <table>
          <tr><th>Nombre</th><td>{{ a.name }}</td></tr>
          <tr><th>Usuario</th><td>{{ a.username }}</td></tr>
          <tr><th>Tenant</th><td>{{ a.tenantId }}</td></tr>
          <tr><th>Roles</th><td>{{ roles().join(', ') || 'sin roles asignados' }}</td></tr>
        </table>
      } @else {
        <p>No hay sesión activa.</p>
      }
    </div>
  `,
})
export class Profile {
  private msal = inject(MsalService);
  account = signal(this.msal.instance.getActiveAccount());

  roles = computed<string[]>(() => {
    const claims = this.account()?.idTokenClaims as Record<string, any> | undefined;
    return (claims?.['roles'] as string[]) ?? [];
  });
}