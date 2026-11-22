import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environments';
import {
  CrearRepuestoRequest,
  CrearServicioRequest,
  DescontarStockRequest,
  Repuesto,
  Servicio,
} from './catalog.model';

/**
 * Cliente HTTP del BFF para catalogo (ms-digitalfix-catalog).
 *
 * El BFF expone /api/v1/catalog/... y lo reenvia tal cual al mismo path en
 * el microservicio real (los dos quedaron versionados a la vez).
 * No agrega el header Authorization: de eso se encarga MsalInterceptor.
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/api/v1/catalog`;

  // --- Servicios ---------------------------------------------------------

  listarServicios(soloActivos = false): Promise<Servicio[]> {
    return firstValueFrom(
      this.http.get<Servicio[]>(`${this.base}/services`, {
        params: { soloActivos },
      })
    );
  }

  crearServicio(request: CrearServicioRequest): Promise<Servicio> {
    return firstValueFrom(this.http.post<Servicio>(`${this.base}/services`, request));
  }

  /** catalog no borra el servicio: lo marca inactivo y lo devuelve. */
  desactivarServicio(id: number): Promise<Servicio> {
    return firstValueFrom(this.http.delete<Servicio>(`${this.base}/services/${id}`));
  }

  // --- Repuestos -----------------------------------------------------------

  listarRepuestos(): Promise<Repuesto[]> {
    return firstValueFrom(this.http.get<Repuesto[]>(`${this.base}/repuestos`));
  }

  crearRepuesto(request: CrearRepuestoRequest): Promise<Repuesto> {
    return firstValueFrom(this.http.post<Repuesto>(`${this.base}/repuestos`, request));
  }

  /** Responde 409 si no hay stock suficiente. */
  descontarStock(codigo: string, request: DescontarStockRequest): Promise<Repuesto> {
    return firstValueFrom(
      this.http.post<Repuesto>(`${this.base}/repuestos/${codigo}/descontar`, request)
    );
  }
}
