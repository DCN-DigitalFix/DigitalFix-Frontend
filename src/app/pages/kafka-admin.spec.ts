import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Topico } from '../kafka-admin/kafka-admin.model';
import { KafkaAdmin } from './kafka-admin';

const TOPICO_EJEMPLO: Topico = {
  nombre: 'digitalfix.workorders.events',
  particiones: 3,
  factorReplicacion: 3,
  configuracion: {},
};

describe('KafkaAdmin (página)', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [KafkaAdmin],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('carga los topicos al crearse', async () => {
    const fixture = TestBed.createComponent(KafkaAdmin);

    const req = httpMock.expectOne('/api/v1/kafka/topics');
    req.flush([TOPICO_EJEMPLO]);
    await fixture.whenStable();

    expect(fixture.componentInstance.topicos()).toEqual([TOPICO_EJEMPLO]);
  });

  it('carga los consumer groups solo al abrir esa pestaña', async () => {
    const fixture = TestBed.createComponent(KafkaAdmin);
    httpMock.expectOne('/api/v1/kafka/topics').flush([]);
    await fixture.whenStable();

    httpMock.expectNone('/api/v1/kafka/consumer-groups');

    fixture.componentInstance.irA('grupos');
    const req = httpMock.expectOne('/api/v1/kafka/consumer-groups');
    req.flush([]);
    await fixture.whenStable();

    expect(fixture.componentInstance.pestana()).toBe('grupos');
  });

  it('no permite ampliar particiones con un total menor o igual al actual', async () => {
    const fixture = TestBed.createComponent(KafkaAdmin);
    httpMock.expectOne('/api/v1/kafka/topics').flush([TOPICO_EJEMPLO]);
    await fixture.whenStable();

    fixture.componentInstance.particionesNuevas[TOPICO_EJEMPLO.nombre] = 2;
    await fixture.componentInstance.ampliarParticiones(TOPICO_EJEMPLO);

    httpMock.expectNone((r) => r.url.includes('/partitions'));
    expect(fixture.componentInstance.error()).toContain('mayor');
  });

  it('muestra un mensaje legible cuando el topico esta protegido (409)', async () => {
    const fixture = TestBed.createComponent(KafkaAdmin);
    httpMock.expectOne('/api/v1/kafka/topics').flush([TOPICO_EJEMPLO]);
    await fixture.whenStable();

    const promesa = fixture.componentInstance.eliminarTopico(TOPICO_EJEMPLO);
    const req = httpMock.expectOne('/api/v1/kafka/topics/digitalfix.workorders.events');
    req.flush(
      { message: "'digitalfix.workorders.events' es un topico protegido" },
      { status: 409, statusText: 'Conflict' }
    );
    await promesa;

    expect(fixture.componentInstance.error()).toContain('409');
  });
});
