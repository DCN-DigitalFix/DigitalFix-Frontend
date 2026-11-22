import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  Cluster,
  ConsumerGroupDetalle,
  ConsumerGroupResumen,
  Topico,
} from '../kafka-admin/kafka-admin.model';
import { KafkaAdminService } from '../kafka-admin/kafka-admin.service';

type Pestana = 'topicos' | 'grupos' | 'cluster';

@Component({
  selector: 'app-kafka-admin',
  imports: [CommonModule, FormsModule],
  template: `
    <header class="page-heading">
      <p class="eyebrow">MANTENCIÓN ELÉCTRICA · PLATAFORMA DE STREAMING</p>
      <h2>&gt; ADMINISTRACIÓN KAFKA<span class="cursor" aria-hidden="true"></span></h2>
      <p class="page-meta">TÓPICOS · CONSUMER GROUPS · CLÚSTER</p>
    </header>

    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }

    <nav class="tabs">
      <button class="tab" [class.tab--activa]="pestana() === 'topicos'" type="button" (click)="irA('topicos')">Tópicos</button>
      <button class="tab" [class.tab--activa]="pestana() === 'grupos'" type="button" (click)="irA('grupos')">Consumer groups</button>
      <button class="tab" [class.tab--activa]="pestana() === 'cluster'" type="button" (click)="irA('cluster')">Clúster</button>
    </nav>

    @if (cargando()) {
      <p class="loading">&gt; cargando...</p>
    }

    @if (pestana() === 'topicos') {
      <div class="table-shell">
        <table>
          <thead>
            <tr><th>Nombre</th><th>Particiones</th><th>Replicas</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            @for (t of topicos(); track t.nombre) {
              <tr>
                <td class="id">{{ t.nombre }}</td>
                <td>{{ t.particiones }}</td>
                <td>{{ t.factorReplicacion }}</td>
                <td class="acciones">
                  <input type="number" [min]="t.particiones + 1" [(ngModel)]="particionesNuevas[t.nombre]" placeholder="Particiones" />
                  <button class="button" type="button" (click)="ampliarParticiones(t)">Ampliar</button>
                  <button class="button button--danger" type="button" (click)="eliminarTopico(t)">Eliminar</button>
                </td>
              </tr>
            } @empty {
              <tr><td class="empty" colspan="4">&gt; sin tópicos</td></tr>
            }
          </tbody>
        </table>
      </div>

      <h3>&gt; NUEVO TÓPICO</h3>
      <div class="form">
        <label>NOMBRE<input [(ngModel)]="nombreNuevo" placeholder="mi.topico.nuevo" /></label>
        <label>PARTICIONES<input type="number" min="1" [(ngModel)]="particionesNuevo" placeholder="3" /></label>
        <label>RÉPLICAS<input type="number" min="1" [(ngModel)]="replicasNuevo" placeholder="3" /></label>
        <button class="button button--primary" type="button" (click)="crearTopico()">Crear</button>
      </div>
    }

    @if (pestana() === 'grupos') {
      <div class="table-shell">
        <table>
          <thead>
            <tr><th>Group ID</th><th>Estado</th><th>Miembros</th><th></th></tr>
          </thead>
          <tbody>
            @for (g of grupos(); track g.groupId) {
              <tr>
                <td class="id">{{ g.groupId }}</td>
                <td>{{ g.estado }}</td>
                <td>{{ g.miembros }}</td>
                <td><button class="button" type="button" (click)="verDetalleGrupo(g.groupId)">Ver detalle</button></td>
              </tr>
            } @empty {
              <tr><td class="empty" colspan="4">&gt; sin consumer groups</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (detalleGrupo(); as d) {
        <h3>&gt; {{ d.groupId }} ({{ d.estado }})</h3>
        <div class="table-shell">
          <table>
            <thead>
              <tr><th>Tópico</th><th>Partición</th><th>Offset actual</th><th>Offset final</th><th>Lag</th></tr>
            </thead>
            <tbody>
              @for (o of d.offsets; track o.topico + '-' + o.particion) {
                <tr>
                  <td>{{ o.topico }}</td>
                  <td>{{ o.particion }}</td>
                  <td>{{ o.offsetActual ?? '—' }}</td>
                  <td>{{ o.offsetFinal }}</td>
                  <td [class.lag-alto]="(o.lag ?? 0) > 0">{{ o.lag ?? '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    }

    @if (pestana() === 'cluster') {
      @if (cluster(); as c) {
        <p class="dato"><span class="etiqueta">Cluster ID</span> {{ c.clusterId }}</p>
        <p class="dato"><span class="etiqueta">Controller</span> broker {{ c.controlador.id }} ({{ c.controlador.host }}:{{ c.controlador.puerto }})</p>
        <div class="table-shell">
          <table>
            <thead><tr><th>Broker</th><th>Host</th><th>Puerto</th></tr></thead>
            <tbody>
              @for (b of c.brokers; track b.id) {
                <tr>
                  <td>{{ b.id }}</td>
                  <td>{{ b.host }}</td>
                  <td>{{ b.puerto }}</td>
                </tr>
              }
            </tbody>
          </table>
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
    .table-shell { border: 1px solid var(--border); margin-bottom: 16px; overflow-x: auto; }
    table { border-collapse: collapse; min-width: 560px; width: 100%; }
    th, td { border-bottom: 1px solid var(--border); padding: 8px 12px; text-align: left; }
    th { border-bottom-color: var(--border-fuerte); color: var(--text-dim); font: var(--t-xs) var(--mono); letter-spacing: 0.08em; text-transform: uppercase; }
    td { font: var(--t-sm) var(--mono); white-space: nowrap; }
    .id { color: var(--ambar); }
    .empty { color: var(--text-faint); font-style: italic; }
    .lag-alto { color: var(--rojo); }
    .acciones { align-items: center; display: flex; gap: 6px; }
    .acciones input { width: 90px; }
    .dato { font: var(--t-sm) var(--mono); margin: 4px 0; }
    .etiqueta { color: var(--text-dim); display: inline-block; min-width: 110px; }
    .error { background: var(--surface); border-left: 2px solid var(--rojo); color: var(--text); font: var(--t-sm) var(--mono); margin: 0 0 16px; padding: 10px 12px; }
    .loading { color: var(--cyan); font: var(--t-sm) var(--mono); }
    .form { align-items: end; display: flex; flex-wrap: wrap; gap: 8px; }
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
    @keyframes blink { 50% { opacity: 0; } }
  `,
})
export class KafkaAdmin {
  private service = inject(KafkaAdminService);

  readonly pestana = signal<Pestana>('topicos');
  readonly topicos = signal<Topico[]>([]);
  readonly grupos = signal<ConsumerGroupResumen[]>([]);
  readonly detalleGrupo = signal<ConsumerGroupDetalle | null>(null);
  readonly cluster = signal<Cluster | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  nombreNuevo = '';
  particionesNuevo: number | null = null;
  replicasNuevo: number | null = null;
  /** Particiones a ampliar por nombre de topico, mientras el usuario las escribe. */
  particionesNuevas: Record<string, number | null> = {};

  constructor() {
    void this.cargarTopicos();
  }

  irA(pestana: Pestana): void {
    this.pestana.set(pestana);
    if (pestana === 'grupos' && this.grupos().length === 0) {
      void this.cargarGrupos();
    } else if (pestana === 'cluster' && this.cluster() === null) {
      void this.cargarCluster();
    }
  }

  async cargarTopicos(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.topicos.set(await this.service.listarTopicos());
    } catch (e) {
      this.reportar(e);
    } finally {
      this.cargando.set(false);
    }
  }

  async cargarGrupos(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.grupos.set(await this.service.listarConsumerGroups());
    } catch (e) {
      this.reportar(e);
    } finally {
      this.cargando.set(false);
    }
  }

  async cargarCluster(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.cluster.set(await this.service.obtenerCluster());
    } catch (e) {
      this.reportar(e);
    } finally {
      this.cargando.set(false);
    }
  }

  async verDetalleGrupo(groupId: string): Promise<void> {
    this.error.set(null);
    try {
      this.detalleGrupo.set(await this.service.obtenerConsumerGroup(groupId));
    } catch (e) {
      this.reportar(e);
    }
  }

  async crearTopico(): Promise<void> {
    if (!this.nombreNuevo || !this.particionesNuevo || !this.replicasNuevo) {
      this.error.set('Nombre, particiones y réplicas son obligatorios.');
      return;
    }

    this.error.set(null);
    try {
      await this.service.crearTopico({
        nombre: this.nombreNuevo,
        particiones: this.particionesNuevo,
        factorReplicacion: this.replicasNuevo,
      });
      this.nombreNuevo = '';
      this.particionesNuevo = null;
      this.replicasNuevo = null;
      await this.cargarTopicos();
    } catch (e) {
      this.reportar(e);
    }
  }

  async ampliarParticiones(topico: Topico): Promise<void> {
    const nuevoTotal = this.particionesNuevas[topico.nombre];
    if (!nuevoTotal || nuevoTotal <= topico.particiones) {
      this.error.set(`Indica un total de particiones mayor que ${topico.particiones} para '${topico.nombre}'.`);
      return;
    }

    this.error.set(null);
    try {
      await this.service.ampliarParticiones(topico.nombre, nuevoTotal);
      this.particionesNuevas[topico.nombre] = null;
      await this.cargarTopicos();
    } catch (e) {
      this.reportar(e);
    }
  }

  async eliminarTopico(topico: Topico): Promise<void> {
    this.error.set(null);
    try {
      await this.service.eliminarTopico(topico.nombre);
      await this.cargarTopicos();
    } catch (e) {
      this.reportar(e);
    }
  }

  /** Un 409 aqui significa que el topico esta protegido (ver KafkaAdminService). */
  private reportar(e: unknown): void {
    if (e instanceof HttpErrorResponse) {
      const detalle = e.error?.message ?? e.message;
      if (e.status === 401) {
        this.error.set(`401 — sesión no válida o token expirado. ${detalle}`);
      } else if (e.status === 403) {
        this.error.set(`403 — tu rol no permite esta operación. ${detalle}`);
      } else if (e.status === 404) {
        this.error.set(`404 — no existe. ${detalle}`);
      } else if (e.status === 409) {
        this.error.set(`409 — ${detalle}`);
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
