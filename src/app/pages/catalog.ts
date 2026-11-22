import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Auth } from '../auth/auth';
import { ROLES } from '../../environments/environments';
import { CatalogService } from '../catalog/catalog.service';
import { Repuesto, Servicio } from '../catalog/catalog.model';

type Pestana = 'servicios' | 'repuestos';

@Component({
  selector: 'app-catalog',
  imports: [CommonModule, FormsModule],
  template: `
    <header class="page-heading">
      <p class="eyebrow">MANTENCIÓN ELÉCTRICA · CATÁLOGO TÉCNICO</p>
      <h2>&gt; CATÁLOGO<span class="cursor" aria-hidden="true"></span></h2>
      <p class="page-meta">SERVICIOS Y REPUESTOS</p>
    </header>

    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }

    <nav class="tabs">
      <button
        class="tab"
        [class.tab--activa]="pestana() === 'servicios'"
        type="button"
        (click)="irA('servicios')"
      >Servicios</button>
      <button
        class="tab"
        [class.tab--activa]="pestana() === 'repuestos'"
        type="button"
        (click)="irA('repuestos')"
      >Repuestos</button>
    </nav>

    @if (cargando()) {
      <p class="loading">&gt; cargando catálogo...</p>
    }

    @if (pestana() === 'servicios') {
      <label class="toggle">
        <input type="checkbox" [ngModel]="soloActivos()" (ngModelChange)="cambiarFiltroActivos($event)" />
        Mostrar solo servicios activos
      </label>

      <div class="table-shell">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Tarifa</th>
              <th>Estado</th>
              @if (puedeAdministrar()) { <th>Acciones</th> }
            </tr>
          </thead>
          <tbody>
            @for (s of servicios(); track s.id) {
              <tr>
                <td class="id">{{ s.id }}</td>
                <td>{{ s.nombre }}</td>
                <td class="muted">{{ s.descripcion ?? '—' }}</td>
                <td>{{ s.tarifa | number: '1.0-2' }}</td>
                <td><span class="status" [class.status--activo]="s.activo">{{ s.activo ? 'ACTIVO' : 'INACTIVO' }}</span></td>
                @if (puedeAdministrar()) {
                  <td>
                    @if (s.activo) {
                      <button class="button button--danger" type="button" (click)="desactivarServicio(s)">Desactivar</button>
                    }
                  </td>
                }
              </tr>
            } @empty {
              <tr><td class="empty" [attr.colspan]="puedeAdministrar() ? 6 : 5">&gt; sin servicios</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (puedeAdministrar()) {
        <h3>&gt; NUEVO SERVICIO</h3>
        <div class="form">
          <label>NOMBRE<input [(ngModel)]="nombreServicio" placeholder="Nombre del servicio" /></label>
          <label>DESCRIPCIÓN<input [(ngModel)]="descripcionServicio" placeholder="Opcional" /></label>
          <label>TARIFA<input type="number" min="0" step="0.01" [(ngModel)]="tarifaServicio" placeholder="0" /></label>
          <button class="button button--primary" type="button" (click)="crearServicio()" [disabled]="cargando()">Crear</button>
        </div>
      }
    }

    @if (pestana() === 'repuestos') {
      <div class="table-shell">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Código</th>
              <th>Nombre</th>
              <th>Stock</th>
              <th>Precio unitario</th>
              @if (puedeDescontar()) { <th>Descontar</th> }
            </tr>
          </thead>
          <tbody>
            @for (r of repuestos(); track r.id) {
              <tr>
                <td class="id">{{ r.id }}</td>
                <td>{{ r.codigo }}</td>
                <td>{{ r.nombre }}</td>
                <td [class.stock-bajo]="r.stock === 0">{{ r.stock }}</td>
                <td>{{ r.precioUnitario | number: '1.0-2' }}</td>
                @if (puedeDescontar()) {
                  <td class="descontar">
                    <input
                      type="number"
                      min="1"
                      [(ngModel)]="cantidadesDescuento[r.codigo]"
                      placeholder="Cant."
                    />
                    <button class="button" type="button" (click)="descontarStock(r)">Descontar</button>
                  </td>
                }
              </tr>
            } @empty {
              <tr><td class="empty" [attr.colspan]="puedeDescontar() ? 6 : 5">&gt; sin repuestos</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (puedeAdministrar()) {
        <h3>&gt; NUEVO REPUESTO</h3>
        <div class="form">
          <label>CÓDIGO<input [(ngModel)]="codigoRepuesto" placeholder="RP-001" /></label>
          <label>NOMBRE<input [(ngModel)]="nombreRepuesto" placeholder="Nombre del repuesto" /></label>
          <label>STOCK<input type="number" min="0" [(ngModel)]="stockRepuesto" placeholder="0" /></label>
          <label>PRECIO UNITARIO<input type="number" min="0" step="0.01" [(ngModel)]="precioRepuesto" placeholder="0" /></label>
          <button class="button button--primary" type="button" (click)="crearRepuesto()" [disabled]="cargando()">Crear</button>
        </div>
      }
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
    .tabs { display: flex; gap: 4px; margin-bottom: 16px; }
    .tab { background: transparent; border: 1px solid var(--border); border-radius: var(--radius); color: var(--text-dim); cursor: pointer; font: var(--t-xs) var(--mono); letter-spacing: 0.08em; padding: 8px 16px; text-transform: uppercase; }
    .tab--activa { border-color: var(--ambar); color: var(--ambar); }
    .toggle { align-items: center; color: var(--text-dim); display: flex; font: var(--t-sm) var(--mono); gap: 6px; margin-bottom: 12px; }
    .table-shell { border: 1px solid var(--border); overflow-x: auto; }
    table { border-collapse: collapse; min-width: 760px; width: 100%; }
    th, td { border-bottom: 1px solid var(--border); padding: 8px 12px; text-align: left; }
    th { border-bottom-color: var(--border-fuerte); color: var(--text-dim); font: var(--t-xs) var(--mono); letter-spacing: 0.08em; text-transform: uppercase; }
    td { font: var(--t-sm) var(--mono); white-space: nowrap; }
    tbody tr:hover { background: var(--surface-alt); }
    tbody tr:last-child td { border-bottom: 0; }
    .id { color: var(--ambar); }
    .muted, .empty { color: var(--text-faint); }
    .empty { font-style: italic; text-align: left; }
    .stock-bajo { color: var(--rojo); }
    .status { border: 1px solid var(--rojo); color: var(--rojo); display: inline-block; font: var(--t-xs) var(--mono); padding: 2px 8px; }
    .status--activo { border-color: var(--verde); color: var(--verde); }
    .descontar { align-items: center; display: flex; gap: 6px; }
    .descontar input { width: 64px; }
    .error { background: var(--surface); border-left: 2px solid var(--rojo); color: var(--text); font: var(--t-sm) var(--mono); margin: 0 0 16px; padding: 10px 12px; }
    .loading { color: var(--cyan); font: var(--t-sm) var(--mono); }
    .form { align-items: end; display: flex; flex-wrap: wrap; gap: 8px; margin-top: 0; }
    label { color: var(--text-dim); display: flex; flex: 1; flex-direction: column; font: var(--t-xs) var(--mono); gap: 6px; min-width: 120px; }
    input { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text); font: var(--t-sm) var(--mono); min-height: 34px; padding: 7px 8px; }
    input:focus { border-color: var(--ambar); outline: 1px solid var(--ambar); }
    input::placeholder { color: var(--text-faint); }
    .button { background: transparent; border: 1px solid var(--border-fuerte); border-radius: var(--radius); color: var(--text); cursor: pointer; font: var(--t-xs) var(--mono); min-height: 34px; padding: 7px 12px; text-transform: uppercase; }
    .button:hover:not(:disabled) { background: var(--border-fuerte); }
    .button--primary { border-color: var(--ambar); color: var(--ambar); }
    .button--primary:hover:not(:disabled) { background: var(--ambar); color: var(--bg); }
    .button--danger { border-color: var(--rojo); color: var(--rojo); }
    .button--danger:hover:not(:disabled) { background: var(--rojo); color: var(--bg); }
    .button:disabled { cursor: not-allowed; opacity: 0.5; }
    @keyframes blink { 50% { opacity: 0; } }
    @media (max-width: 760px) { .form { align-items: stretch; flex-direction: column; } .form .button { align-self: flex-start; } }
  `,
})
export class Catalog {
  private service = inject(CatalogService);
  private auth = inject(Auth);

  readonly pestana = signal<Pestana>('servicios');
  readonly servicios = signal<Servicio[]>([]);
  readonly repuestos = signal<Repuesto[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly soloActivos = signal(false);

  // La UI se adapta al rol, pero la autorizacion real la hace el BFF
  // (ver CatalogController): crear y desactivar exigen Admin; descontar
  // stock exige Admin o Supervisor.
  readonly puedeAdministrar = computed(() => this.auth.hasAnyRole([ROLES.ADMIN]));
  readonly puedeDescontar = computed(() =>
    this.auth.hasAnyRole([ROLES.ADMIN, ROLES.SUPERVISOR])
  );

  nombreServicio = '';
  descripcionServicio = '';
  tarifaServicio: number | null = null;

  codigoRepuesto = '';
  nombreRepuesto = '';
  stockRepuesto: number | null = null;
  precioRepuesto: number | null = null;

  /** Cantidad a descontar por codigo de repuesto, mientras el usuario la escribe. */
  cantidadesDescuento: Record<string, number | null> = {};

  constructor() {
    void this.cargarServicios();
    void this.cargarRepuestos();
  }

  irA(pestana: Pestana): void {
    this.pestana.set(pestana);
  }

  async cambiarFiltroActivos(valor: boolean): Promise<void> {
    this.soloActivos.set(valor);
    await this.cargarServicios();
  }

  async cargarServicios(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.servicios.set(await this.service.listarServicios(this.soloActivos()));
    } catch (e) {
      this.reportar(e);
    } finally {
      this.cargando.set(false);
    }
  }

  async cargarRepuestos(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.repuestos.set(await this.service.listarRepuestos());
    } catch (e) {
      this.reportar(e);
    } finally {
      this.cargando.set(false);
    }
  }

  async crearServicio(): Promise<void> {
    if (!this.nombreServicio || this.tarifaServicio == null) {
      this.error.set('Nombre y tarifa son obligatorios.');
      return;
    }

    this.error.set(null);
    try {
      await this.service.crearServicio({
        nombre: this.nombreServicio,
        descripcion: this.descripcionServicio || null,
        tarifa: this.tarifaServicio,
      });
      this.nombreServicio = '';
      this.descripcionServicio = '';
      this.tarifaServicio = null;
      await this.cargarServicios();
    } catch (e) {
      this.reportar(e);
    }
  }

  async desactivarServicio(servicio: Servicio): Promise<void> {
    this.error.set(null);
    try {
      await this.service.desactivarServicio(servicio.id);
      await this.cargarServicios();
    } catch (e) {
      this.reportar(e);
    }
  }

  async crearRepuesto(): Promise<void> {
    if (!this.codigoRepuesto || !this.nombreRepuesto || this.stockRepuesto == null || this.precioRepuesto == null) {
      this.error.set('Código, nombre, stock y precio unitario son obligatorios.');
      return;
    }

    this.error.set(null);
    try {
      await this.service.crearRepuesto({
        codigo: this.codigoRepuesto,
        nombre: this.nombreRepuesto,
        stock: this.stockRepuesto,
        precioUnitario: this.precioRepuesto,
      });
      this.codigoRepuesto = '';
      this.nombreRepuesto = '';
      this.stockRepuesto = null;
      this.precioRepuesto = null;
      await this.cargarRepuestos();
    } catch (e) {
      this.reportar(e);
    }
  }

  async descontarStock(repuesto: Repuesto): Promise<void> {
    const cantidad = this.cantidadesDescuento[repuesto.codigo];
    if (!cantidad || cantidad <= 0) {
      this.error.set('Ingresa una cantidad mayor que cero para descontar.');
      return;
    }

    this.error.set(null);
    try {
      await this.service.descontarStock(repuesto.codigo, { cantidad });
      this.cantidadesDescuento[repuesto.codigo] = null;
      await this.cargarRepuestos();
    } catch (e) {
      this.reportar(e);
    }
  }

  /** Traduce el status HTTP a algo legible; un 409 de catalog ya trae el mensaje de stock insuficiente. */
  private reportar(e: unknown): void {
    if (e instanceof HttpErrorResponse) {
      const detalle = e.error?.message ?? e.message;
      if (e.status === 401) {
        this.error.set(`401 — sesión no válida o token expirado. ${detalle}`);
      } else if (e.status === 403) {
        this.error.set(`403 — tu rol no permite esta operación. ${detalle}`);
      } else if (e.status === 409) {
        this.error.set(detalle);
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
