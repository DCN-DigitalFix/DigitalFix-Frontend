import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environments';
import { AuditEvent } from './audit.model';

/**
 * Cliente HTTP del BFF para auditoria (ms-digitalfix-audit, solo lectura).
 *
 * No agrega el header Authorization: de eso se encarga MsalInterceptor, que
 * hace match con el protectedResourceMap de app.config.ts.
 */
@Injectable({ providedIn: 'root' })
export class AuditService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/api/audit`;

  /** Ultimos eventos registrados, mas reciente primero. */
  listarUltimos(limite = 50): Promise<AuditEvent[]> {
    return firstValueFrom(
      this.http.get<AuditEvent[]>(`${this.base}/events`, {
        params: { limite },
      })
    );
  }

  /**
   * Linea de tiempo de una orden, en orden cronologico.
   * El BFF responde 404 si la orden no tiene ningun evento registrado.
   */
  timelineDeOrden(ordenId: string): Promise<AuditEvent[]> {
    return firstValueFrom(
      this.http.get<AuditEvent[]>(`${this.base}/orders/${ordenId}/timeline`)
    );
  }
}
