import { Component, inject } from '@angular/core';
import { Auth } from '../auth/auth';
import { ROLES } from '../../environments/environments';

@Component({
  selector: 'app-dashboard',
  template: `
    <h2>Dashboard</h2>

    @if (auth.hasAnyRole([ROLES.ADMIN])) {
      <p>Vista Admin: KPIs de la red.</p>
    } @else if (auth.hasAnyRole([ROLES.SUPERVISOR])) {
      <p>Vista Supervisor: órdenes por asignar y cuadrillas en terreno.</p>
    } @else if (auth.hasAnyRole([ROLES.CLIENTE])) {
      <p>Vista Cliente: últimas órdenes y su estado.</p>
    } @else {
      <p>Tu cuenta aún no tiene un rol asignado en DigitalFix.</p>
    }
  `,
})
export class Dashboard {
  protected readonly auth = inject(Auth);
  protected readonly ROLES = ROLES;
}
