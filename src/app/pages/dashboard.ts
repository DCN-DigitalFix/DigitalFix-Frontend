import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Auth } from '../auth/auth';
import { ROLES } from '../../environments/environments';
import { AuditEvent } from '../audit/audit.model';
import { AuditService } from '../audit/audit.service';
import { ReportSummary } from '../report/report.model';
import { ReportService } from '../report/report.service';
import { WorkOrder } from '../workorders/workorder.model';
import { WorkOrderService } from '../workorders/workorder.service';

/**
 * Cada rol ve datos reales de su propio dominio, no un mensaje generico:
 *   Admin      -> resumen de reportes (ms-digitalfix-report)
 *   Auditor    -> ultimos eventos de auditoria (ms-digitalfix-audit)
 *   Supervisor/Cliente -> sus ordenes de trabajo (ms-digitalfix-workorders)
 */
@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  template: `
    <header class="page-heading">
      <p class="eyebrow">MANTENCIÓN ELÉCTRICA · RESUMEN</p>
      <h2>&gt; DASHBOARD<span class="cursor" aria-hidden="true"></span></h2>
    </header>

    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }

    @if (cargando()) {
      <p class="loading">&gt; cargando...</p>
    }

    @if (auth.hasAnyRole([ROLES.ADMIN])) {
      @if (resumen(); as r) {
        <div class="kpis">
          <div class="kpi"><p class="kpi-valor">{{ r.total }}</p><p class="kpi-etiqueta">Órdenes totales</p></div>
          <div class="kpi"><p class="kpi-valor">{{ r.ordenesPorEstado['CERRADA'] ?? 0 }}</p><p class="kpi-etiqueta">Cerradas</p></div>
          <div class="kpi"><p class="kpi-valor">{{ r.totalEventosAuditoria }}</p><p class="kpi-etiqueta">Eventos de auditoría</p></div>
        </div>
        <p class="ver-mas">Detalle completo en <a routerLink="/reports">Reportería</a>.</p>
      }
    } @else if (auth.hasAnyRole([ROLES.AUDITOR])) {
      <div class="table-shell">
        <table>
          <thead><tr><th>Fecha</th><th>Orden</th><th>Estado anterior → nuevo</th></tr></thead>
          <tbody>
            @for (ev of eventos(); track ev.eventId) {
              <tr>
                <td class="muted">{{ ev.occurredAt | date: 'short' }}</td>
                <td class="id">{{ ev.ordenId }}</td>
                <td>{{ ev.estadoAnterior ?? '—' }} → {{ ev.estadoNuevo }}</td>
              </tr>
            } @empty {
              <tr><td class="empty" colspan="3">&gt; sin eventos recientes</td></tr>
            }
          </tbody>
        </table>
      </div>
      <p class="ver-mas">Línea de tiempo por orden en <a routerLink="/audit">Auditoría</a>.</p>
    } @else if (auth.hasAnyRole([ROLES.SUPERVISOR, ROLES.CLIENTE])) {
      <div class="table-shell">
        <table>
          <thead><tr><th>ID</th><th>Cliente</th><th>Estado</th></tr></thead>
          <tbody>
            @for (ot of ordenes(); track ot.id) {
              <tr>
                <td class="id">{{ ot.id }}</td>
                <td>{{ ot.cliente }}</td>
                <td><span class="status" [class]="'status status--' + ot.estado.toLowerCase()">[ {{ ot.estado }} ]</span></td>
              </tr>
            } @empty {
              <tr><td class="empty" colspan="3">&gt; sin órdenes</td></tr>
            }
          </tbody>
        </table>
      </div>
      <p class="ver-mas">Gestión completa en <a routerLink="/workorders">Órdenes</a>.</p>
    } @else {
      <p>Tu cuenta aún no tiene un rol asignado en DigitalFix.</p>
    }
  `,
  styles: `
    :host { display: block; }
    .page-heading { border-bottom: 1px solid var(--border); margin-bottom: 16px; padding-bottom: 12px; }
    .eyebrow { color: var(--text-dim); font: var(--t-xs) var(--mono); letter-spacing: 0.08em; margin: 0 0 8px; }
    h2 { color: var(--text); font: var(--t-xl) var(--mono); letter-spacing: 0.08em; margin: 0; text-transform: uppercase; }
    .cursor { animation: blink 1s steps(2, jump-none) infinite; background: var(--ambar); display: inline-block; height: 18px; margin-left: 8px; vertical-align: -1px; width: 8px; }
    .kpis { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); margin-bottom: 8px; }
    .kpi { border: 1px solid var(--border); padding: 16px; text-align: center; }
    .kpi-valor { color: var(--ambar); font: 28px var(--mono); margin: 0; }
    .kpi-etiqueta { color: var(--text-dim); font: var(--t-xs) var(--mono); letter-spacing: 0.06em; margin: 6px 0 0; text-transform: uppercase; }
    .table-shell { border: 1px solid var(--border); overflow-x: auto; }
    table { border-collapse: collapse; min-width: 420px; width: 100%; }
    th, td { border-bottom: 1px solid var(--border); padding: 8px 12px; text-align: left; }
    th { border-bottom-color: var(--border-fuerte); color: var(--text-dim); font: var(--t-xs) var(--mono); letter-spacing: 0.08em; text-transform: uppercase; }
    td { font: var(--t-sm) var(--mono); white-space: nowrap; }
    .id { color: var(--ambar); }
    .muted, .empty { color: var(--text-faint); }
    .empty { font-style: italic; }
    .status { border: 1px solid var(--text-dim); color: var(--text-dim); display: inline-block; font: var(--t-xs) var(--mono); padding: 2px 8px; }
    .status--asignada { border-color: var(--cyan); color: var(--cyan); }
    .status--en_ejecucion { border-color: var(--ambar); color: var(--ambar); }
    .status--cerrada { border-color: var(--verde); color: var(--verde); }
    .status--anulada { border-color: var(--rojo); color: var(--rojo); }
    .ver-mas { color: var(--text-dim); font: var(--t-sm) var(--mono); margin-top: 12px; }
    .ver-mas a { color: var(--ambar); }
    .error { background: var(--surface); border-left: 2px solid var(--rojo); color: var(--text); font: var(--t-sm) var(--mono); margin: 0 0 16px; padding: 10px 12px; }
    .loading { color: var(--cyan); font: var(--t-sm) var(--mono); }
    @keyframes blink { 50% { opacity: 0; } }
  `,
})
export class Dashboard {
  protected readonly auth = inject(Auth);
  protected readonly ROLES = ROLES;

  private reportService = inject(ReportService);
  private auditService = inject(AuditService);
  private workOrderService = inject(WorkOrderService);

  readonly resumen = signal<ReportSummary | null>(null);
  readonly eventos = signal<AuditEvent[]>([]);
  readonly ordenes = signal<WorkOrder[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      if (this.auth.hasAnyRole([ROLES.ADMIN])) {
        this.resumen.set(await this.reportService.resumen());
      } else if (this.auth.hasAnyRole([ROLES.AUDITOR])) {
        this.eventos.set(await this.auditService.listarUltimos(10));
      } else if (this.auth.hasAnyRole([ROLES.SUPERVISOR, ROLES.CLIENTE])) {
        this.ordenes.set(await this.workOrderService.listar());
      }
    } catch (e) {
      this.reportar(e);
    } finally {
      this.cargando.set(false);
    }
  }

  private reportar(e: unknown): void {
    if (e instanceof HttpErrorResponse) {
      const detalle = e.error?.message ?? e.message;
      if (e.status === 401) {
        this.error.set(`401 — sesión no válida o token expirado. ${detalle}`);
      } else if (e.status === 403) {
        this.error.set(`403 — tu rol no permite ver esta información. ${detalle}`);
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
