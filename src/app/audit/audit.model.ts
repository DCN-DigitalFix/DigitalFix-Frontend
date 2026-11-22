/**
 * Espeja la forma real de ms-digitalfix-audit (GET /api/audit/events y
 * GET /api/audit/orders/{id}/timeline), reenviada tal cual por el BFF.
 *
 * No incluye particion ni offset de Kafka: esa API no los expone. Si en algun
 * momento audit agrega esos campos, aqui es donde habria que sumarlos.
 */
export type AuditEventType = 'ORDEN_CREADA' | 'ESTADO_CAMBIADO';

export interface AuditEvent {
  eventId: string;
  eventType: AuditEventType;
  ordenId: string;
  estadoAnterior: string | null;
  estadoNuevo: string;
  cliente: string | null;
  tecnicoAsignado: string | null;
  actor: string | null;
  /** Momento del hecho de negocio (ISO-8601). */
  occurredAt: string;
  /** Momento en que audit guardo el evento (ISO-8601). */
  registradoEn: string;
}
