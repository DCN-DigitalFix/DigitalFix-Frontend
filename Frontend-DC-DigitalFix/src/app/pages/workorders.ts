import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Auth } from '../auth/auth';
import { ROLES } from '../../environments/environments';
import {
  ESTADOS,
  EstadoOT,
  WorkOrder,
} from '../workorders/workorder.model';
import { WorkOrderService } from '../workorders/workorder.service';

@Component({
  selector: 'app-workorders',
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Órdenes de trabajo</h2>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @if (cargando()) {
      <p>Cargando…</p>
    }

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Cliente</th>
          <th>Descripción</th>
          <th>Dirección</th>
          <th>Estado</th>
          <th>Técnico</th>
          @if (puedeGestionar()) { <th>Acciones</th> }
        </tr>
      </thead>
      <tbody>
        @for (ot of ordenes(); track ot.id) {
          <tr>
            <td>{{ ot.id }}</td>
            <td>{{ ot.cliente }}</td>
            <td>{{ ot.descripcion }}</td>
            <td>{{ ot.direccion }}</td>
            <td>{{ ot.estado }}</td>
            <td>{{ ot.tecnicoAsignado ?? '—' }}</td>
            @if (puedeGestionar()) {
              <td>
                <select
                  [ngModel]="ot.estado"
                  (ngModelChange)="cambiarEstado(ot, $event)"
                >
                  @for (e of estados; track e) {
                    <option [value]="e">{{ e }}</option>
                  }
                </select>
                @if (puedeEliminar()) {
                  <button (click)="eliminar(ot)">Eliminar</button>
                }
              </td>
            }
          </tr>
        } @empty {
          <tr><td colspan="7">Sin órdenes registradas.</td></tr>
        }
      </tbody>
    </table>

    @if (puedeCrear()) {
      <h3>Nueva orden</h3>
      <div class="form">
        <input [(ngModel)]="cliente" placeholder="Cliente" />
        <input [(ngModel)]="descripcion" placeholder="Descripción" />
        <input [(ngModel)]="direccion" placeholder="Dirección" />
        <button (click)="crear()" [disabled]="cargando()">Crear</button>
      </div>
    }
  `,
  styles: `
    table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
    th, td { border: 1px solid #ccc; padding: 0.4rem 0.6rem; text-align: left; }
    .error { color: #b00020; }
    .form { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
    .form input { flex: 1; padding: 0.3rem; }
  `,
})
export class WorkOrders {
  private service = inject(WorkOrderService);
  private auth = inject(Auth);

  readonly estados = ESTADOS;

  readonly ordenes = signal<WorkOrder[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  // La UI se adapta al rol, pero la autorizacion real la hace el BFF.
  // Ocultar un boton no es seguridad: el 403 sigue siendo la defensa.
  readonly puedeCrear = computed(() =>
    this.auth.hasAnyRole([ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CLIENTE])
  );
  readonly puedeGestionar = computed(() =>
    this.auth.hasAnyRole([ROLES.ADMIN, ROLES.SUPERVISOR])
  );
  readonly puedeEliminar = computed(() => this.auth.hasAnyRole([ROLES.ADMIN]));

  cliente = '';
  descripcion = '';
  direccion = '';

  constructor() {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.ordenes.set(await this.service.listar());
    } catch (e) {
      this.reportar(e);
    } finally {
      this.cargando.set(false);
    }
  }

  async crear(): Promise<void> {
    if (!this.cliente || !this.descripcion || !this.direccion) {
      this.error.set('Cliente, descripción y dirección son obligatorios.');
      return;
    }

    this.cargando.set(true);
    this.error.set(null);
    try {
      await this.service.crear({
        cliente: this.cliente,
        descripcion: this.descripcion,
        direccion: this.direccion,
      });
      this.cliente = '';
      this.descripcion = '';
      this.direccion = '';
      await this.cargar();
    } catch (e) {
      this.reportar(e);
    } finally {
      this.cargando.set(false);
    }
  }

  async cambiarEstado(ot: WorkOrder, estado: EstadoOT): Promise<void> {
    if (estado === ot.estado) return;

    this.error.set(null);
    try {
      await this.service.cambiarEstado(ot.id, {
        estado,
        tecnicoAsignado: ot.tecnicoAsignado,
      });
      await this.cargar();
    } catch (e) {
      this.reportar(e);
      await this.cargar();
    }
  }

  async eliminar(ot: WorkOrder): Promise<void> {
    this.error.set(null);
    try {
      await this.service.eliminar(ot.id);
      await this.cargar();
    } catch (e) {
      this.reportar(e);
    }
  }

  /** Traduce el status HTTP a algo legible, util para la demo de EP2. */
  private reportar(e: unknown): void {
    if (e instanceof HttpErrorResponse) {
      const detalle = e.error?.message ?? e.message;
      if (e.status === 401) {
        this.error.set(`401 — sesión no válida o token expirado. ${detalle}`);
      } else if (e.status === 403) {
        this.error.set(`403 — tu rol no permite esta operación. ${detalle}`);
      } else if (e.status === 0) {
        this.error.set('No hay respuesta del BFF. ¿Está corriendo en el 8080?');
      } else {
        this.error.set(`${e.status} — ${detalle}`);
      }
    } else {
      this.error.set('Error inesperado.');
    }
  }
}