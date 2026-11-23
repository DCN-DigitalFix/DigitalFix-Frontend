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
    <header class="page-heading">
      <p class="eyebrow">MANTENCIÓN ELÉCTRICA · OPERACIONES</p>
      <h2>&gt; ÓRDENES DE TRABAJO<span class="cursor" aria-hidden="true"></span></h2>
      <p class="page-meta">{{ ordenes().length }} REGISTROS · ACTUALIZACIÓN EN TIEMPO REAL</p>
    </header>

    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }

    @if (cargando()) {
      <p class="loading">&gt; cargando registros...</p>
    }

    <div class="table-shell">
      <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Cliente</th>
          <th>Descripción</th>
          <th>Dirección</th>
          <th>Estado</th>
          <th>Técnico</th>
          <th>Repuesto</th>
          @if (puedeGestionar()) { <th>Acciones</th> }
        </tr>
      </thead>
      <tbody>
        @for (ot of ordenes(); track ot.id) {
          <tr>
            <td class="id">{{ ot.id }}</td>
            <td>{{ ot.cliente }}</td>
            <td>{{ ot.descripcion }}</td>
            <td>{{ ot.direccion }}</td>
            <td><span class="status" [class]="'status status--' + ot.estado.toLowerCase()">[ {{ ot.estado }} ]</span></td>
            <td class="muted">{{ ot.tecnicoAsignado ?? '—' }}</td>
            <td class="muted">
              {{ ot.codigoRepuesto ? ot.codigoRepuesto + ' ×' + ot.cantidadRepuesto : '—' }}
            </td>
            @if (puedeGestionar()) {
              <td>
                <!-- Solo en INGRESADA: es el unico estado que puede pasar a
                     ASIGNADA, que es cuando se descuenta stock. -->
                @if (ot.estado === 'INGRESADA') {
                  <input
                    [(ngModel)]="codigoRepuesto[ot.id]"
                    placeholder="Repuesto"
                    class="repuesto"
                  />
                  <input
                    type="number"
                    [(ngModel)]="cantidadRepuesto[ot.id]"
                    placeholder="Cant."
                    class="cantidad"
                  />
                }
                <select
                  [ngModel]="ot.estado"
                  (ngModelChange)="cambiarEstado(ot, $event)"
                >
                  @for (e of estados; track e) {
                    <option [value]="e">{{ e }}</option>
                  }
                </select>
                @if (puedeEliminar()) {
                  <button class="button button--danger" type="button" (click)="eliminar(ot)">Eliminar</button>
                }
              </td>
            }
          </tr>
        } @empty {
          <tr><td class="empty" [attr.colspan]="puedeGestionar() ? 8 : 7">&gt; sin registros</td></tr>
        }
      </tbody>
      </table>
    </div>

    @if (puedeCrear()) {
      <h3>&gt; NUEVA ORDEN</h3>
      <div class="form">
        <label>CLIENTE<input [(ngModel)]="cliente" placeholder="Nombre del cliente" /></label>
        <label>DESCRIPCIÓN<input [(ngModel)]="descripcion" placeholder="Trabajo requerido" /></label>
        <label>DIRECCIÓN<input [(ngModel)]="direccion" placeholder="Ubicación" /></label>
        <button class="button button--primary" type="button" (click)="crear()" [disabled]="cargando()">Crear</button>
      </div>
    }
  `,
  styles: `
    :host { display: block; }
    .page-heading { border-bottom: 1px solid var(--border); margin-bottom: 16px; padding-bottom: 12px; }
    .eyebrow, .page-meta { color: var(--text-dim); font: var(--t-xs) var(--mono); letter-spacing: 0.08em; margin: 0 0 8px; }
    h2, h3 { color: var(--text); font: 18px var(--mono); letter-spacing: 0.08em; margin: 0; text-transform: uppercase; }
    h2 { font-size: var(--t-xl); }
    h3 { color: var(--text-dim); margin: 32px 0 12px; }
    .page-meta { margin: 8px 0 0; }
    .cursor { animation: blink 1s steps(2, jump-none) infinite; background: var(--ambar); display: inline-block; height: 18px; margin-left: 8px; vertical-align: -1px; width: 8px; }
    .table-shell { border: 1px solid var(--border); overflow-x: auto; }
    table { border-collapse: collapse; min-width: 920px; width: 100%; }
    th, td { border-bottom: 1px solid var(--border); padding: 8px 12px; text-align: left; }
    th { border-bottom-color: var(--border-fuerte); color: var(--text-dim); font: var(--t-xs) var(--mono); letter-spacing: 0.08em; text-transform: uppercase; }
    td { font: var(--t-sm) var(--mono); white-space: nowrap; }
    tbody tr:hover { background: var(--surface-alt); }
    tbody tr:last-child td { border-bottom: 0; }
    .id { color: var(--ambar); }
    .muted, .empty { color: var(--text-faint); }
    .empty { font-style: italic; text-align: left; }
    .status { border: 1px solid var(--text-dim); color: var(--text-dim); display: inline-block; font: var(--t-xs) var(--mono); padding: 2px 8px; }
    .status--asignada { border-color: var(--cyan); color: var(--cyan); }
    .status--en_ejecucion { border-color: var(--ambar); color: var(--ambar); }
    .status--cerrada { border-color: var(--verde); color: var(--verde); }
    .status--anulada { border-color: var(--rojo); color: var(--rojo); }
    .error { background: var(--surface); border-left: 2px solid var(--rojo); color: var(--text); font: var(--t-sm) var(--mono); margin: 0 0 16px; padding: 10px 12px; }
    .loading { color: var(--cyan); font: var(--t-sm) var(--mono); }
    .form { align-items: end; display: flex; gap: 8px; margin-top: 0; }
    label { color: var(--text-dim); display: flex; flex: 1; flex-direction: column; font: var(--t-xs) var(--mono); gap: 6px; }
    input, select { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text); font: var(--t-sm) var(--mono); min-height: 34px; padding: 7px 8px; }
    input:focus, select:focus { border-color: var(--ambar); outline: 1px solid var(--ambar); }
    input::placeholder { color: var(--text-faint); }
    select { min-width: 145px; }
    .repuesto { margin-right: 6px; min-width: 110px; }
    .cantidad { margin-right: 6px; min-width: 70px; }
    .button { background: transparent; border: 1px solid var(--border-fuerte); border-radius: var(--radius); color: var(--text); cursor: pointer; font: var(--t-xs) var(--mono); min-height: 34px; padding: 7px 12px; text-transform: uppercase; }
    .button:hover:not(:disabled) { background: var(--border-fuerte); }
    .button--primary { border-color: var(--ambar); color: var(--ambar); }
    .button--primary:hover:not(:disabled) { background: var(--ambar); color: var(--bg); }
    .button--danger { border-color: var(--rojo); color: var(--rojo); margin-left: 8px; }
    .button--danger:hover:not(:disabled) { background: var(--rojo); color: var(--bg); }
    .button:disabled { cursor: not-allowed; opacity: 0.5; }
    @keyframes blink { 50% { opacity: 0; } }
    @media (max-width: 760px) { .form { align-items: stretch; flex-direction: column; } .form .button { align-self: flex-start; } }
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

  // Indexados por id de orden: cada fila lleva lo suyo. Con un solo par de
  // campos, todas las filas mostrarian el mismo valor.
  codigoRepuesto: Record<string, string> = {};
  cantidadRepuesto: Record<string, number | null> = {};

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
      // El repuesto solo viaja al asignar. El '|| null' convierte la cadena
      // vacia en nulo: sin repuesto, la orden se asigna sin descontar stock,
      // que es un caso legitimo (una visita de diagnostico, por ejemplo).
      await this.service.cambiarEstado(ot.id, {
        estado,
        tecnicoAsignado: ot.tecnicoAsignado,
        codigoRepuesto: estado === 'ASIGNADA' ? (this.codigoRepuesto[ot.id] || null) : null,
        cantidadRepuesto: estado === 'ASIGNADA' ? (this.cantidadRepuesto[ot.id] ?? null) : null,
      });
      await this.cargar();
    } catch (e) {
      await this.cargar();
      this.reportar(e);
      
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

  /**
   * El BFF anida el cuerpo completo del servicio de abajo como JSON dentro de
   * su campo message; si es asi, se extrae el message interno.
   */
  private mensajeDe(e: HttpErrorResponse): string {
    const mensaje = e.error?.message;
    if (typeof mensaje === 'string' && mensaje.startsWith('{')) {
      try {
        const interno = JSON.parse(mensaje);
        if (typeof interno?.message === 'string') {
          return interno.message;
        }
      } catch {
        // no era JSON valido: se devuelve el original
      }
      return mensaje;
    }
    return mensaje ?? e.message;
  }

  /** Traduce el status HTTP a algo legible, util para la demo de EP2. */
  private reportar(e: unknown): void {
    if (e instanceof HttpErrorResponse) {
      const detalle = this.mensajeDe(e);
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