import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuditEvent } from '../audit/audit.model';
import { Audit } from './audit';

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

describe('Audit (página)', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Audit],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('carga los ultimos eventos al crearse', async () => {
    const fixture = TestBed.createComponent(Audit);

    const req = httpMock.expectOne((r) => r.url === '/api/v1/audit/events');
    req.flush([EVENTO_EJEMPLO]);
    await fixture.whenStable();

    expect(fixture.componentInstance.eventos()).toEqual([EVENTO_EJEMPLO]);
    expect(fixture.componentInstance.cargando()).toBe(false);
    expect(fixture.componentInstance.error()).toBeNull();
  });

  it('muestra un mensaje legible si el BFF responde 403', async () => {
    const fixture = TestBed.createComponent(Audit);

    const req = httpMock.expectOne((r) => r.url === '/api/v1/audit/events');
    req.flush(
      { message: 'tu rol no alcanza' },
      { status: 403, statusText: 'Forbidden' }
    );
    await fixture.whenStable();

    expect(fixture.componentInstance.error()).toContain('403');
  });

  it('la busqueda de timeline trata un 404 como "sin eventos", no como error', async () => {
    const fixture = TestBed.createComponent(Audit);
    httpMock.expectOne((r) => r.url === '/api/v1/audit/events').flush([]);
    await fixture.whenStable();

    fixture.componentInstance.ordenBuscada = 'OT-9999';
    const promesaBusqueda = fixture.componentInstance.buscarTimeline();

    const req = httpMock.expectOne('/api/v1/audit/orders/OT-9999/timeline');
    req.flush({ message: 'sin eventos' }, { status: 404, statusText: 'Not Found' });
    await promesaBusqueda;

    expect(fixture.componentInstance.timelineVacio()).toBe(true);
    expect(fixture.componentInstance.timelineError()).toBeNull();
  });

  it('la busqueda de timeline muestra un error real cuando no es 404', async () => {
    const fixture = TestBed.createComponent(Audit);
    httpMock.expectOne((r) => r.url === '/api/v1/audit/events').flush([]);
    await fixture.whenStable();

    fixture.componentInstance.ordenBuscada = 'OT-0001';
    const promesaBusqueda = fixture.componentInstance.buscarTimeline();

    const req = httpMock.expectOne('/api/v1/audit/orders/OT-0001/timeline');
    req.flush({ message: 'fallo interno' }, { status: 500, statusText: 'Server Error' });
    await promesaBusqueda;

    expect(fixture.componentInstance.timelineVacio()).toBe(false);
    expect(fixture.componentInstance.timelineError()).toContain('500');
  });
});
