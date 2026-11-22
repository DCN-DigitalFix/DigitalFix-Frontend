import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Repuesto, Servicio } from './catalog.model';
import { CatalogService } from './catalog.service';

const SERVICIO_EJEMPLO: Servicio = {
  id: 1,
  nombre: 'Revisión de tablero',
  descripcion: 'Inspección general',
  tarifa: 25000,
  activo: true,
};

const REPUESTO_EJEMPLO: Repuesto = {
  id: 1,
  codigo: 'RP-001',
  nombre: 'Disyuntor 20A',
  stock: 5,
  precioUnitario: 8500,
};

describe('CatalogService', () => {
  let service: CatalogService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CatalogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lista servicios pasando soloActivos como query param', async () => {
    const promesa = service.listarServicios(true);

    const req = httpMock.expectOne((r) => r.url === '/api/v1/catalog/services');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('soloActivos')).toBe('true');
    req.flush([SERVICIO_EJEMPLO]);

    await expect(promesa).resolves.toEqual([SERVICIO_EJEMPLO]);
  });

  it('crea un servicio con POST', async () => {
    const promesa = service.crearServicio({
      nombre: 'Revisión de tablero',
      descripcion: 'Inspección general',
      tarifa: 25000,
    });

    const req = httpMock.expectOne('/api/v1/catalog/services');
    expect(req.request.method).toBe('POST');
    req.flush(SERVICIO_EJEMPLO);

    await expect(promesa).resolves.toEqual(SERVICIO_EJEMPLO);
  });

  it('lista repuestos', async () => {
    const promesa = service.listarRepuestos();

    const req = httpMock.expectOne('/api/v1/catalog/repuestos');
    expect(req.request.method).toBe('GET');
    req.flush([REPUESTO_EJEMPLO]);

    await expect(promesa).resolves.toEqual([REPUESTO_EJEMPLO]);
  });

  it('descuenta stock con POST al codigo del repuesto', async () => {
    const promesa = service.descontarStock('RP-001', { cantidad: 2 });

    const req = httpMock.expectOne('/api/v1/catalog/repuestos/RP-001/descontar');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ cantidad: 2 });
    req.flush({ ...REPUESTO_EJEMPLO, stock: 3 });

    await expect(promesa).resolves.toEqual({ ...REPUESTO_EJEMPLO, stock: 3 });
  });

  it('propaga un 409 con el mensaje cuando el stock no alcanza', async () => {
    const promesa = service.descontarStock('RP-001', { cantidad: 999 });

    const req = httpMock.expectOne('/api/v1/catalog/repuestos/RP-001/descontar');
    req.flush(
      { message: 'Stock insuficiente de RP-001: hay 5, se requieren 999' },
      { status: 409, statusText: 'Conflict' }
    );

    await expect(promesa).rejects.toMatchObject({
      status: 409,
      error: { message: 'Stock insuficiente de RP-001: hay 5, se requieren 999' },
    });
  });
});
