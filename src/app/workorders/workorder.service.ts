import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environments';
import {
  CambiarEstadoRequest,
  CrearWorkOrderRequest,
  WorkOrder,
} from './workorder.model';

/**
 * Cliente HTTP del BFF.
 *
 * No agrega el header Authorization: de eso se encarga MsalInterceptor, que
 * hace match con el protectedResourceMap de app.config.ts y adquiere el token
 * con los scopes de la API antes de cada llamada.
 */
@Injectable({ providedIn: 'root' })
export class WorkOrderService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/api/v1/workorders`;

  listar(): Promise<WorkOrder[]> {
    return firstValueFrom(this.http.get<WorkOrder[]>(this.base));
  }

  obtener(id: string): Promise<WorkOrder> {
    return firstValueFrom(this.http.get<WorkOrder>(`${this.base}/${id}`));
  }

  crear(request: CrearWorkOrderRequest): Promise<WorkOrder> {
    return firstValueFrom(this.http.post<WorkOrder>(this.base, request));
  }

  cambiarEstado(id: string, request: CambiarEstadoRequest): Promise<WorkOrder> {
    return firstValueFrom(
      this.http.patch<WorkOrder>(`${this.base}/${id}/estado`, request)
    );
  }

  eliminar(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/${id}`));
  }
}