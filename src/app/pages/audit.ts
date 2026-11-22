import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuditEvent } from '../audit/audit.model';
import { AuditService } from '../audit/audit.service';

/** Intervalo del refresco automatico de la tabla de ultimos eventos. */
const INTERVALO_REFRESCO_MS = 10_000;

@Component({
  selector: 'app-audit',
  imports: [CommonModule, FormsModule],
  template: `
    <header class="page-heading">
      <p class="eyebrow">MANTENCIÓN ELÉCTRICA · CUMPLIMIENTO</p>
      <h2>&gt; AUDITORÍA<span class="cursor" aria-hidden="true"></span></h2>
      <p class="page-meta">
        {{ eventos().length }} EVENTOS RECIENTES
        @if (autoRefrescar()) { · REFRESCO AUTOMÁTICO CADA 10 S }
      </p>
    </header>

    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }

    <div class="toolbar">
      <button class="button" type="button" (click)="cargarUltimos()" [disabled]="cargando()">
        Actualizar
      </button>
      <label class="toggle">
        <input type="checkbox" [ngModel]="autoRefrescar()" (ngModelChange)="alternarAutoRefresco($event)" />
        Refresco automático (10 s)
      </label>
    </div>

    @if (cargando()) {
      <p class="loading">&gt; cargando eventos...</p>
    }

    <div class="table-shell">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Orden</th>
            <th>Estado anterior → nuevo</th>
            <th>Actor</th>
          </tr>
        </thead>
        <tbody>
          @for (ev of eventos(); track ev.eventId) {
            <tr>
              <td class="muted">{{ ev.occurredAt | date: 'short' }}</td>
              <td><span class="tag" [class]="'tag tag--' + ev.eventType.toLowerCase()">{{ ev.eventType }}</span></td>
              <td class="id">{{ ev.ordenId }}</td>
              <td>{{ ev.estadoAnterior ?? '—' }} → {{ ev.estadoNuevo }}</td>
              <td class="muted">{{ ev.actor ?? '—' }}</td>
            </tr>
          } @empty {
            @if (!cargando()) {
              <tr><td class="empty" colspan="5">&gt; sin eventos registrados</td></tr>
            }
          }
        </tbody>
      </table>
    </div>

    <h3>&gt; LÍNEA DE TIEMPO DE UNA ORDEN</h3>
    <div class="form">
      <label>ID DE ORDEN
        <input [(ngModel)]="ordenBuscada" placeholder="OT-0001" (keyup.enter)="buscarTimeline()" />
      </label>
      <button class="button button--primary" type="button" (click)="buscarTimeline()" [disabled]="buscandoTimeline()">
        Buscar
      </button>
    </div>

    @if (buscandoTimeline()) {
      <p class="loading">&gt; buscando eventos de la orden...</p>
    }

    @if (timelineError()) {
      <p class="error" role="alert">{{ timelineError() }}</p>
    }

    @if (timelineVacio()) {
      <p class="empty-block">&gt; la orden {{ ordenConsultada() }} no tiene eventos registrados</p>
    }

    @if (timeline(); as eventosOrden) {
      <div class="table-shell">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Estado anterior → nuevo</th>
              <th>Actor</th>
            </tr>
          </thead>
          <tbody>
            @for (ev of eventosOrden; track ev.eventId) {
              <tr>
                <td class="muted">{{ ev.occurredAt | date: 'short' }}</td>
                <td><span class="tag" [class]="'tag tag--' + ev.eventType.toLowerCase()">{{ ev.eventType }}</span></td>
                <td>{{ ev.estadoAnterior ?? '—' }} → {{ ev.estadoNuevo }}</td>
                <td class="muted">{{ ev.actor ?? '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
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
    .toolbar { align-items: center; display: flex; gap: 16px; margin-bottom: 16px; }
    .toggle { align-items: center; color: var(--text-dim); display: flex; font: var(--t-sm) var(--mono); gap: 6px; }
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
    .empty-block { color: var(--text-faint); font: var(--t-sm) var(--mono); font-style: italic; margin: 0 0 16px; }
    .tag { border: 1px solid var(--text-dim); color: var(--text-dim); display: inline-block; font: var(--t-xs) var(--mono); padding: 2px 8px; }
    .tag--orden_creada { border-color: var(--verde); color: var(--verde); }
    .tag--estado_cambiado { border-color: var(--cyan); color: var(--cyan); }
    .error { background: var(--surface); border-left: 2px solid var(--rojo); color: var(--text); font: var(--t-sm) var(--mono); margin: 0 0 16px; padding: 10px 12px; }
    .loading { color: var(--cyan); font: var(--t-sm) var(--mono); }
    .form { align-items: end; display: flex; gap: 8px; margin-top: 0; }
    label { color: var(--text-dim); display: flex; flex: 1; flex-direction: column; font: var(--t-xs) var(--mono); gap: 6px; }
    input { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text); font: var(--t-sm) var(--mono); min-height: 34px; padding: 7px 8px; }
    input:focus { border-color: var(--ambar); outline: 1px solid var(--ambar); }
    input::placeholder { color: var(--text-faint); }
    .button { background: transparent; border: 1px solid var(--border-fuerte); border-radius: var(--radius); color: var(--text); cursor: pointer; font: var(--t-xs) var(--mono); min-height: 34px; padding: 7px 12px; text-transform: uppercase; }
    .button:hover:not(:disabled) { background: var(--border-fuerte); }
    .button--primary { border-color: var(--ambar); color: var(--ambar); }
    .button--primary:hover:not(:disabled) { background: var(--ambar); color: var(--bg); }
    .button:disabled { cursor: not-allowed; opacity: 0.5; }
    @keyframes blink { 50% { opacity: 0; } }
    @media (max-width: 760px) { .form { align-items: stretch; flex-direction: column; } .form .button { align-self: flex-start; } }
  `,
})
export class Audit {
  private service = inject(AuditService);
  private destroyRef = inject(DestroyRef);

  readonly eventos = signal<AuditEvent[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly autoRefrescar = signal(false);

  ordenBuscada = '';
  readonly ordenConsultada = signal<string | null>(null);
  readonly timeline = signal<AuditEvent[] | null>(null);
  readonly timelineVacio = signal(false);
  readonly timelineError = signal<string | null>(null);
  readonly buscandoTimeline = signal(false);

  private intervaloId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    void this.cargarUltimos();
    this.destroyRef.onDestroy(() => this.detenerAutoRefresco());
  }

  async cargarUltimos(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.eventos.set(await this.service.listarUltimos(50));
    } catch (e) {
      this.reportar(e, this.error);
    } finally {
      this.cargando.set(false);
    }
  }

  alternarAutoRefresco(activo: boolean): void {
    this.autoRefrescar.set(activo);
    if (activo) {
      this.intervaloId = setInterval(() => void this.cargarUltimos(), INTERVALO_REFRESCO_MS);
    } else {
      this.detenerAutoRefresco();
    }
  }

  private detenerAutoRefresco(): void {
    if (this.intervaloId !== null) {
      clearInterval(this.intervaloId);
      this.intervaloId = null;
    }
  }

  async buscarTimeline(): Promise<void> {
    const ordenId = this.ordenBuscada.trim();
    if (!ordenId) {
      this.timelineError.set('Ingresa un id de orden, por ejemplo OT-0001.');
      return;
    }

    this.buscandoTimeline.set(true);
    this.timelineError.set(null);
    this.timelineVacio.set(false);
    this.timeline.set(null);
    this.ordenConsultada.set(ordenId);

    try {
      this.timeline.set(await this.service.timelineDeOrden(ordenId));
    } catch (e) {
      // Un 404 aqui no es un error: significa que la orden existe pero
      // todavia no tiene eventos de auditoria (o el id no existe).
      if (e instanceof HttpErrorResponse && e.status === 404) {
        this.timelineVacio.set(true);
      } else {
        this.reportar(e, this.timelineError);
      }
    } finally {
      this.buscandoTimeline.set(false);
    }
  }

  private reportar(e: unknown, destino: typeof this.error): void {
    if (e instanceof HttpErrorResponse) {
      const detalle = e.error?.message ?? e.message;
      if (e.status === 401) {
        destino.set(`401 — sesión no válida o token expirado. ${detalle}`);
      } else if (e.status === 403) {
        destino.set(`403 — tu rol no permite ver esta información. ${detalle}`);
      } else if (e.status === 0) {
        destino.set('No hay respuesta del BFF. ¿Está corriendo en el 8080?');
      } else {
        destino.set(`${e.status} — ${detalle}`);
      }
    } else {
      destino.set('Error inesperado.');
    }
  }
}
