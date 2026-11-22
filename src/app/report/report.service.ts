import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environments';
import { Certificate, ReportSummary } from './report.model';

/**
 * Cliente HTTP del BFF para reportes (ms-digitalfix-report, solo lectura).
 * No agrega el header Authorization: de eso se encarga MsalInterceptor.
 */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/api/v1/reports`;

  resumen(): Promise<ReportSummary> {
    return firstValueFrom(this.http.get<ReportSummary>(`${this.base}/summary`));
  }

  /** El BFF responde 404 si no hay datos para la orden y 409 si existe pero no esta cerrada. */
  certificado(ordenId: string): Promise<Certificate> {
    return firstValueFrom(
      this.http.get<Certificate>(`${this.base}/orders/${ordenId}/certificate`)
    );
  }
}
