import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environments';
import {
  Cluster,
  ConsumerGroupDetalle,
  ConsumerGroupResumen,
  CrearTopicoRequest,
  Topico,
} from './kafka-admin.model';

/**
 * Cliente HTTP del BFF para administracion de Kafka (ms-digitalfix-kafka-admin).
 * No agrega el header Authorization: de eso se encarga MsalInterceptor.
 */
@Injectable({ providedIn: 'root' })
export class KafkaAdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/api/kafka`;

  listarTopicos(): Promise<Topico[]> {
    return firstValueFrom(this.http.get<Topico[]>(`${this.base}/topics`));
  }

  crearTopico(request: CrearTopicoRequest): Promise<Topico> {
    return firstValueFrom(this.http.post<Topico>(`${this.base}/topics`, request));
  }

  ampliarParticiones(nombre: string, particiones: number): Promise<void> {
    return firstValueFrom(
      this.http.put<void>(`${this.base}/topics/${nombre}/partitions`, { particiones })
    );
  }

  actualizarConfiguracion(nombre: string, configuraciones: Record<string, string>): Promise<void> {
    return firstValueFrom(
      this.http.put<void>(`${this.base}/topics/${nombre}/config`, { configuraciones })
    );
  }

  /** El BFF responde 409 si el topico es protegido. */
  eliminarTopico(nombre: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/topics/${nombre}`));
  }

  listarConsumerGroups(): Promise<ConsumerGroupResumen[]> {
    return firstValueFrom(
      this.http.get<ConsumerGroupResumen[]>(`${this.base}/consumer-groups`)
    );
  }

  obtenerConsumerGroup(groupId: string): Promise<ConsumerGroupDetalle> {
    return firstValueFrom(
      this.http.get<ConsumerGroupDetalle>(`${this.base}/consumer-groups/${groupId}`)
    );
  }

  obtenerCluster(): Promise<Cluster> {
    return firstValueFrom(this.http.get<Cluster>(`${this.base}/cluster`));
  }
}
