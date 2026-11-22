/** Espeja los DTO de ms-digitalfix-kafka-admin (via el BFF). */

export interface Topico {
  nombre: string;
  particiones: number;
  factorReplicacion: number;
  configuracion: Record<string, string>;
}

export interface CrearTopicoRequest {
  nombre: string;
  particiones: number;
  factorReplicacion: number;
  configuraciones?: Record<string, string> | null;
}

export interface ConsumerGroupResumen {
  groupId: string;
  estado: string;
  miembros: number;
}

export interface MiembroConsumerGroup {
  memberId: string;
  clientId: string;
  host: string;
  particionesAsignadas: string[];
}

export interface OffsetParticion {
  topico: string;
  particion: number;
  /** null si el grupo nunca consumio esa particion. */
  offsetActual: number | null;
  offsetFinal: number;
  /** null si offsetActual es null. */
  lag: number | null;
}

export interface ConsumerGroupDetalle {
  groupId: string;
  estado: string;
  miembros: MiembroConsumerGroup[];
  offsets: OffsetParticion[];
}

export interface Broker {
  id: number;
  host: string;
  puerto: number;
}

export interface Cluster {
  clusterId: string;
  controlador: Broker;
  brokers: Broker[];
}
