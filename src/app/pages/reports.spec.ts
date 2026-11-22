import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ReportSummary } from '../report/report.model';
import { Reports } from './reports';

const RESUMEN_EJEMPLO: ReportSummary = {
  ordenesPorEstado: { INGRESADA: 2, CERRADA: 5 },
  total: 7,
  tiempoPromedioCierreHoras: 36.5,
  totalEventosAuditoria: 12,
};

describe('Reports (página)', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Reports],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('carga el resumen al crearse', async () => {
    const fixture = TestBed.createComponent(Reports);

    const req = httpMock.expectOne('/api/v1/reports/summary');
    req.flush(RESUMEN_EJEMPLO);
    await fixture.whenStable();

    expect(fixture.componentInstance.resumen()).toEqual(RESUMEN_EJEMPLO);
    expect(fixture.componentInstance.error()).toBeNull();
  });

  it('muestra un mensaje legible si el BFF responde 403', async () => {
    const fixture = TestBed.createComponent(Reports);

    const req = httpMock.expectOne('/api/v1/reports/summary');
    req.flush({ message: 'sin permiso' }, { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();

    expect(fixture.componentInstance.error()).toContain('403');
  });

  it('no busca un certificado si no se ingresa un id de orden', async () => {
    const fixture = TestBed.createComponent(Reports);
    httpMock.expectOne('/api/v1/reports/summary').flush(RESUMEN_EJEMPLO);
    await fixture.whenStable();

    fixture.componentInstance.ordenBuscada = '  ';
    await fixture.componentInstance.buscarCertificado();

    httpMock.expectNone((r) => r.url.includes('/certificate'));
    expect(fixture.componentInstance.errorCertificado()).toContain('Ingresa');
  });

  it('muestra 409 con un mensaje legible si la orden no esta cerrada', async () => {
    const fixture = TestBed.createComponent(Reports);
    httpMock.expectOne('/api/v1/reports/summary').flush(RESUMEN_EJEMPLO);
    await fixture.whenStable();

    fixture.componentInstance.ordenBuscada = 'OT-0002';
    const promesa = fixture.componentInstance.buscarCertificado();

    const req = httpMock.expectOne('/api/v1/reports/orders/OT-0002/certificate');
    req.flush({ message: 'La orden OT-0002 aun no esta cerrada' }, { status: 409, statusText: 'Conflict' });
    await promesa;

    expect(fixture.componentInstance.errorCertificado()).toContain('409');
  });
});
