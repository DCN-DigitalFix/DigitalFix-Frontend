import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Cluster, ConsumerGroupDetalle, ConsumerGroupResumen, Topico } from './kafka-admin.model';
import { KafkaAdminService } from './kafka-admin.service';

const TOPICO_EJEMPLO: Topico = {
  nombre: 'digitalfix.workorders.events',
  particiones: 3,
  factorReplicacion: 3,
  configuracion: { 'retention.ms': '604800000' },
};

const GRUPO_EJEMPLO: ConsumerGroupResumen = {
  groupId: 'audit-timeline',
  estado: 'Stable',
  miembros: 3,
};

const DETALLE_EJEMPLO: ConsumerGroupDetalle = {
  groupId: 'audit-timeline',
  estado: 'Stable',
  miembros: [],
  offsets: [{ topico: 'digitalfix.workorders.events', particion: 0, offsetActual: 5, offsetFinal: 5, lag: 0 }],
};

const CLUSTER_EJEMPLO: Cluster = {
  clusterId: 'abc123',
  controlador: { id: 1, host: 'localhost', puerto: 9092 },
  brokers: [{ id: 1, host: 'localhost', puerto: 9092 }],
};

describe('KafkaAdminService', () => {
  let service: KafkaAdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(KafkaAdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lista topicos', async () => {
    const promesa = service.listarTopicos();

    const req = httpMock.expectOne('/api/v1/kafka/topics');
    expect(req.request.method).toBe('GET');
    req.flush([TOPICO_EJEMPLO]);

    await expect(promesa).resolves.toEqual([TOPICO_EJEMPLO]);
  });

  it('crea un topico con POST', async () => {
    const promesa = service.crearTopico({ nombre: 'nuevo.topico', particiones: 3, factorReplicacion: 3 });

    const req = httpMock.expectOne('/api/v1/kafka/topics');
    expect(req.request.method).toBe('POST');
    req.flush(TOPICO_EJEMPLO);

    await expect(promesa).resolves.toEqual(TOPICO_EJEMPLO);
  });

  it('amplia particiones con PUT', async () => {
    const promesa = service.ampliarParticiones('digitalfix.workorders.events', 6);

    const req = httpMock.expectOne('/api/v1/kafka/topics/digitalfix.workorders.events/partitions');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ particiones: 6 });
    req.flush(null);

    await expect(promesa).resolves.toBeNull();
  });

  it('elimina un topico y propaga un 409 si esta protegido', async () => {
    const promesa = service.eliminarTopico('digitalfix.workorders.events');

    const req = httpMock.expectOne('/api/v1/kafka/topics/digitalfix.workorders.events');
    expect(req.request.method).toBe('DELETE');
    req.flush(
      { message: "'digitalfix.workorders.events' es un topico protegido" },
      { status: 409, statusText: 'Conflict' }
    );

    await expect(promesa).rejects.toMatchObject({ status: 409 });
  });

  it('lista consumer groups', async () => {
    const promesa = service.listarConsumerGroups();

    const req = httpMock.expectOne('/api/v1/kafka/consumer-groups');
    req.flush([GRUPO_EJEMPLO]);

    await expect(promesa).resolves.toEqual([GRUPO_EJEMPLO]);
  });

  it('obtiene el detalle de un consumer group con sus offsets', async () => {
    const promesa = service.obtenerConsumerGroup('audit-timeline');

    const req = httpMock.expectOne('/api/v1/kafka/consumer-groups/audit-timeline');
    req.flush(DETALLE_EJEMPLO);

    await expect(promesa).resolves.toEqual(DETALLE_EJEMPLO);
  });

  it('obtiene el estado del cluster', async () => {
    const promesa = service.obtenerCluster();

    const req = httpMock.expectOne('/api/v1/kafka/cluster');
    req.flush(CLUSTER_EJEMPLO);

    await expect(promesa).resolves.toEqual(CLUSTER_EJEMPLO);
  });
});
