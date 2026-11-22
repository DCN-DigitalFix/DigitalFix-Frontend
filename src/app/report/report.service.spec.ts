import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Certificate, ReportSummary } from './report.model';
import { ReportService } from './report.service';

const RESUMEN_EJEMPLO: ReportSummary = {
  ordenesPorEstado: { INGRESADA: 2, CERRADA: 5 },
  total: 7,
  tiempoPromedioCierreHoras: 36.5,
  totalEventosAuditoria: 12,
};

const CERTIFICADO_EJEMPLO: Certificate = {
  ordenId: 'OT-0001',
  cliente: 'Cliente Prueba',
  tecnicoAsignado: 'Tecnico Uno',
  creadaEn: '2026-11-20T10:00:00Z',
  cerradaEn: '2026-11-22T10:00:00Z',
  duracionHoras: 48,
};

describe('ReportService', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('obtiene el resumen', async () => {
    const promesa = service.resumen();

    const req = httpMock.expectOne('/api/v1/reports/summary');
    expect(req.request.method).toBe('GET');
    req.flush(RESUMEN_EJEMPLO);

    await expect(promesa).resolves.toEqual(RESUMEN_EJEMPLO);
  });

  it('obtiene el certificado de una orden', async () => {
    const promesa = service.certificado('OT-0001');

    const req = httpMock.expectOne('/api/v1/reports/orders/OT-0001/certificate');
    expect(req.request.method).toBe('GET');
    req.flush(CERTIFICADO_EJEMPLO);

    await expect(promesa).resolves.toEqual(CERTIFICADO_EJEMPLO);
  });

  it('propaga un 409 cuando la orden no esta cerrada', async () => {
    const promesa = service.certificado('OT-0002');

    const req = httpMock.expectOne('/api/v1/reports/orders/OT-0002/certificate');
    req.flush(
      { message: 'La orden OT-0002 aun no esta cerrada' },
      { status: 409, statusText: 'Conflict' }
    );

    await expect(promesa).rejects.toMatchObject({ status: 409 });
  });
});
