import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Auth } from '../auth/auth';
import { Repuesto, Servicio } from '../catalog/catalog.model';
import { Catalog } from './catalog';

/**
 * Catalog inyecta Auth, que a su vez necesita MsalService/MsalBroadcastService
 * reales para construirse. Para estas pruebas basta con un doble que siempre
 * autoriza: lo que se prueba aqui es el manejo de HTTP y errores de Catalog,
 * no la logica de roles (esa ya la cubre role-guard).
 */
const AUTH_FALSO: Pick<Auth, 'hasAnyRole'> = {
  hasAnyRole: () => true,
};

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

describe('Catalog (página)', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Catalog],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Auth, useValue: AUTH_FALSO },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  /** El constructor dispara las dos cargas (servicios y repuestos) a la vez. */
  function crearYResponder(): ReturnType<typeof TestBed.createComponent<Catalog>> {
    const fixture = TestBed.createComponent(Catalog);
    httpMock.expectOne((r) => r.url === '/api/v1/catalog/services').flush([SERVICIO_EJEMPLO]);
    httpMock.expectOne((r) => r.url === '/api/v1/catalog/repuestos').flush([REPUESTO_EJEMPLO]);
    return fixture;
  }

  it('carga servicios y repuestos al crearse', async () => {
    const fixture = crearYResponder();
    await fixture.whenStable();

    expect(fixture.componentInstance.servicios()).toEqual([SERVICIO_EJEMPLO]);
    expect(fixture.componentInstance.repuestos()).toEqual([REPUESTO_EJEMPLO]);
    expect(fixture.componentInstance.error()).toBeNull();
  });

  it('muestra el mensaje de stock insuficiente al descontar', async () => {
    const fixture = crearYResponder();
    await fixture.whenStable();

    fixture.componentInstance.cantidadesDescuento['RP-001'] = 999;
    const promesa = fixture.componentInstance.descontarStock(REPUESTO_EJEMPLO);

    const req = httpMock.expectOne('/api/v1/catalog/repuestos/RP-001/descontar');
    req.flush(
      { message: 'Stock insuficiente de RP-001: hay 5, se requieren 999' },
      { status: 409, statusText: 'Conflict' }
    );
    await promesa;

    expect(fixture.componentInstance.error()).toBe(
      'Stock insuficiente de RP-001: hay 5, se requieren 999'
    );
  });

  it('no llama al backend si la cantidad a descontar es invalida', async () => {
    const fixture = crearYResponder();
    await fixture.whenStable();

    fixture.componentInstance.cantidadesDescuento['RP-001'] = 0;
    await fixture.componentInstance.descontarStock(REPUESTO_EJEMPLO);

    httpMock.expectNone('/api/v1/catalog/repuestos/RP-001/descontar');
    expect(fixture.componentInstance.error()).toContain('cantidad');
  });
});
