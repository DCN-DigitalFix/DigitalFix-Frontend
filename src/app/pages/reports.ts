import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Certificate, ReportSummary } from '../report/report.model';
import { ReportService } from '../report/report.service';

@Component({
  selector: 'app-reports',
  imports: [CommonModule, FormsModule],
  template: `
    <header class="page-heading">
      <p class="eyebrow">MANTENCIÓN ELÉCTRICA · REPORTERÍA</p>
      <h2>&gt; REPORTERÍA<span class="cursor" aria-hidden="true"></span></h2>
      <p class="page-meta">RESUMEN DE ÓRDENES Y AUDITORÍA</p>
    </header>

    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }

    @if (cargando()) {
      <p class="loading">&gt; cargando resumen...</p>
    }

    @if (resumen(); as r) {
      <div class="kpis">
        <div class="kpi">
          <p class="kpi-valor">{{ r.total }}</p>
          <p class="kpi-etiqueta">Órdenes totales</p>
        </div>
        <div class="kpi">
          <p class="kpi-valor">{{ r.ordenesPorEstado['CERRADA'] ?? 0 }}</p>
          <p class="kpi-etiqueta">Cerradas</p>
        </div>
        <div class="kpi">
          <p class="kpi-valor">{{ r.tiempoPromedioCierreHoras !== null ? (r.tiempoPromedioCierreHoras | number: '1.1-1') : '—' }}</p>
          <p class="kpi-etiqueta">Horas promedio hasta el cierre</p>
        </div>
        <div class="kpi">
          <p class="kpi-valor">{{ r.totalEventosAuditoria }}</p>
          <p class="kpi-etiqueta">Eventos de auditoría</p>
        </div>
      </div>

      <h3>&gt; ÓRDENES POR ESTADO</h3>
      <div class="table-shell">
        <table>
          <thead>
            <tr><th>Estado</th><th>Cantidad</th></tr>
          </thead>
          <tbody>
            @for (par of estadosOrdenados(r.ordenesPorEstado); track par[0]) {
              <tr>
                <td><span class="status" [class]="'status status--' + par[0].toLowerCase()">[ {{ par[0] }} ]</span></td>
                <td>{{ par[1] }}</td>
              </tr>
            } @empty {
              <tr><td class="empty" colspan="2">&gt; sin órdenes registradas</td></tr>
            }
          </tbody>
        </table>
      </div>
    }

    <h3>&gt; CERTIFICADO DE UNA ORDEN CERRADA</h3>
    <div class="form">
      <label>ID DE ORDEN
        <input [(ngModel)]="ordenBuscada" placeholder="OT-0001" (keyup.enter)="buscarCertificado()" />
      </label>
      <button class="button button--primary" type="button" (click)="buscarCertificado()" [disabled]="buscandoCertificado()">
        Buscar
      </button>
    </div>

    @if (buscandoCertificado()) {
      <p class="loading">&gt; buscando certificado...</p>
    }

    @if (errorCertificado()) {
      <p class="error" role="alert">{{ errorCertificado() }}</p>
    }

    @if (certificado(); as c) {
      <div class="certificado">
        <p><span class="etiqueta">Orden</span> {{ c.ordenId }}</p>
        <p><span class="etiqueta">Cliente</span> {{ c.cliente ?? '—' }}</p>
        <p><span class="etiqueta">Técnico</span> {{ c.tecnicoAsignado ?? '—' }}</p>
        <p><span class="etiqueta">Creada</span> {{ c.creadaEn | date: 'medium' }}</p>
        <p><span class="etiqueta">Cerrada</span> {{ c.cerradaEn | date: 'medium' }}</p>
        <p><span class="etiqueta">Duración</span> {{ c.duracionHoras !== null ? (c.duracionHoras | number: '1.1-1') + ' h' : '—' }}</p>
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
    .kpis { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); margin-bottom: 8px; }
    .kpi { border: 1px solid var(--border); padding: 16px; text-align: center; }
    .kpi-valor { color: var(--ambar); font: 28px var(--mono); margin: 0; }
    .kpi-etiqueta { color: var(--text-dim); font: var(--t-xs) var(--mono); letter-spacing: 0.06em; margin: 6px 0 0; text-transform: uppercase; }
    .table-shell { border: 1px solid var(--border); overflow-x: auto; }
    table { border-collapse: collapse; min-width: 320px; width: 100%; }
    th, td { border-bottom: 1px solid var(--border); padding: 8px 12px; text-align: left; }
    th { border-bottom-color: var(--border-fuerte); color: var(--text-dim); font: var(--t-xs) var(--mono); letter-spacing: 0.08em; text-transform: uppercase; }
    td { font: var(--t-sm) var(--mono); }
    .empty { color: var(--text-faint); font-style: italic; }
    .status { border: 1px solid var(--text-dim); color: var(--text-dim); display: inline-block; font: var(--t-xs) var(--mono); padding: 2px 8px; }
    .status--asignada { border-color: var(--cyan); color: var(--cyan); }
    .status--en_ejecucion { border-color: var(--ambar); color: var(--ambar); }
    .status--cerrada { border-color: var(--verde); color: var(--verde); }
    .status--anulada { border-color: var(--rojo); color: var(--rojo); }
    .error { background: var(--surface); border-left: 2px solid var(--rojo); color: var(--text); font: var(--t-sm) var(--mono); margin: 0 0 16px; padding: 10px 12px; }
    .loading { color: var(--cyan); font: var(--t-sm) var(--mono); }
    .form { align-items: end; display: flex; gap: 8px; }
    label { color: var(--text-dim); display: flex; flex: 1; flex-direction: column; font: var(--t-xs) var(--mono); gap: 6px; max-width: 220px; }
    input { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text); font: var(--t-sm) var(--mono); min-height: 34px; padding: 7px 8px; }
    input:focus { border-color: var(--ambar); outline: 1px solid var(--ambar); }
    .button { background: transparent; border: 1px solid var(--border-fuerte); border-radius: var(--radius); color: var(--text); cursor: pointer; font: var(--t-xs) var(--mono); min-height: 34px; padding: 7px 12px; text-transform: uppercase; }
    .button--primary { border-color: var(--ambar); color: var(--ambar); }
    .button--primary:hover:not(:disabled) { background: var(--ambar); color: var(--bg); }
    .button:disabled { cursor: not-allowed; opacity: 0.5; }
    .certificado { border: 1px solid var(--border); margin-top: 16px; padding: 16px; }
    .certificado p { font: var(--t-sm) var(--mono); margin: 4px 0; }
    .etiqueta { color: var(--text-dim); display: inline-block; min-width: 100px; }
    @keyframes blink { 50% { opacity: 0; } }
  `,
})
export class Reports {
  private service = inject(ReportService);

  readonly resumen = signal<ReportSummary | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  ordenBuscada = '';
  readonly certificado = signal<Certificate | null>(null);
  readonly buscandoCertificado = signal(false);
  readonly errorCertificado = signal<string | null>(null);

  constructor() {
    void this.cargarResumen();
  }

  estadosOrdenados(porEstado: Partial<Record<string, number>>): [string, number][] {
    return Object.entries(porEstado)
      .filter((par): par is [string, number] => par[1] !== undefined)
      .sort((a, b) => a[0].localeCompare(b[0]));
  }

  async cargarResumen(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.resumen.set(await this.service.resumen());
    } catch (e) {
      this.reportar(e, this.error);
    } finally {
      this.cargando.set(false);
    }
  }

  async buscarCertificado(): Promise<void> {
    const ordenId = this.ordenBuscada.trim();
    if (!ordenId) {
      this.errorCertificado.set('Ingresa un id de orden, por ejemplo OT-0001.');
      return;
    }

    this.buscandoCertificado.set(true);
    this.errorCertificado.set(null);
    this.certificado.set(null);

    try {
      this.certificado.set(await this.service.certificado(ordenId));
    } catch (e) {
      this.reportar(e, this.errorCertificado);
    } finally {
      this.buscandoCertificado.set(false);
    }
  }

  private reportar(e: unknown, destino: typeof this.error): void {
    if (e instanceof HttpErrorResponse) {
      const detalle = e.error?.message ?? e.message;
      if (e.status === 401) {
        destino.set(`401 — sesión no válida o token expirado. ${detalle}`);
      } else if (e.status === 403) {
        destino.set(`403 — tu rol no permite ver esta información. ${detalle}`);
      } else if (e.status === 404) {
        destino.set(`404 — no hay datos para esa orden. ${detalle}`);
      } else if (e.status === 409) {
        destino.set(`409 — la orden existe pero aún no está cerrada. ${detalle}`);
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
