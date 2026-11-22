import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Auth } from '../auth/auth';
import { ROLES } from '../../environments/environments';
import { Dashboard } from './dashboard';

/** Mismo doble que en catalog.spec.ts: Auth necesita MSAL real para construirse. */
function authFalso(roles: string[]): Pick<Auth, 'hasAnyRole'> {
  return { hasAnyRole: (allowed: readonly string[]) => allowed.some((r) => roles.includes(r)) };
}

describe('Dashboard (página)', () => {
  let httpMock: HttpTestingController;

  function configurar(roles: string[]): void {
    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: Auth, useValue: authFalso(roles) },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpMock.verify();
  });

  it('Admin ve el resumen de reportes', async () => {
    configurar([ROLES.ADMIN]);
    const fixture = TestBed.createComponent(Dashboard);

    const req = httpMock.expectOne('/api/v1/reports/summary');
    req.flush({ ordenesPorEstado: { CERRADA: 2 }, total: 2, tiempoPromedioCierreHoras: 10, totalEventosAuditoria: 4 });
    await fixture.whenStable();

    expect(fixture.componentInstance.resumen()?.total).toBe(2);
  });

  it('Auditor ve los ultimos eventos de auditoria', async () => {
    configurar([ROLES.AUDITOR]);
    const fixture = TestBed.createComponent(Dashboard);

    const req = httpMock.expectOne((r) => r.url === '/api/v1/audit/events');
    req.flush([]);
    await fixture.whenStable();

    expect(fixture.componentInstance.eventos()).toEqual([]);
  });

  it('Supervisor ve sus ordenes de trabajo', async () => {
    configurar([ROLES.SUPERVISOR]);
    const fixture = TestBed.createComponent(Dashboard);

    const req = httpMock.expectOne('/api/v1/workorders');
    req.flush([]);
    await fixture.whenStable();

    expect(fixture.componentInstance.ordenes()).toEqual([]);
  });

  it('un rol sin dato asociado no llama a ningun backend', async () => {
    configurar([]);
    const fixture = TestBed.createComponent(Dashboard);
    await fixture.whenStable();

    httpMock.expectNone(() => true);
  });
});
