import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuditEvent } from './audit.model';
import { AuditService } from './audit.service';

const EVENTO_EJEMPLO: AuditEvent = {
  eventId: 'e-1',
  eventType: 'ORDEN_CREADA',
  ordenId: 'OT-0001',
  estadoAnterior: null,
  estadoNuevo: 'INGRESADA',
  cliente: 'Cliente Prueba',
  tecnicoAsignado: null,
  actor: 'sistema',
  occurredAt: '2026-11-21T22:00:00Z',
  registradoEn: '2026-11-21T22:00:01Z',
};

describe('AuditService', () => {
  let service: AuditService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuditService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lista los ultimos eventos pasando el limite como query param', async () => {
    const promesa = service.listarUltimos(50);

    const req = httpMock.expectOne((r) => r.url === '/api/v1/audit/events');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limite')).toBe('50');
    req.flush([EVENTO_EJEMPLO]);

    await expect(promesa).resolves.toEqual([EVENTO_EJEMPLO]);
  });

  it('busca la linea de tiempo de una orden', async () => {
    const promesa = service.timelineDeOrden('OT-0001');

    const req = httpMock.expectOne('/api/v1/audit/orders/OT-0001/timeline');
    expect(req.request.method).toBe('GET');
    req.flush([EVENTO_EJEMPLO]);

    await expect(promesa).resolves.toEqual([EVENTO_EJEMPLO]);
  });

  it('propaga un 404 cuando la orden no tiene eventos registrados', async () => {
    const promesa = service.timelineDeOrden('OT-9999');

    const req = httpMock.expectOne('/api/v1/audit/orders/OT-9999/timeline');
    req.flush(
      { message: 'No hay eventos de auditoria para la orden OT-9999' },
      { status: 404, statusText: 'Not Found' }
    );

    await expect(promesa).rejects.toMatchObject({ status: 404 });
  });
});
