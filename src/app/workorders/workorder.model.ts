/** Espeja los DTO del BFF (cl.duoc.ms_digitalfix_bff.dto). */

export type EstadoOT =
  | 'INGRESADA'
  | 'ASIGNADA'
  | 'EN_EJECUCION'
  | 'CERRADA'
  | 'ANULADA';

export const ESTADOS: EstadoOT[] = [
  'INGRESADA',
  'ASIGNADA',
  'EN_EJECUCION',
  'CERRADA',
  'ANULADA',
];

export interface WorkOrder {
  id: string;
  cliente: string;
  descripcion: string;
  direccion: string;
  estado: EstadoOT;
  tecnicoAsignado: string | null;
  creadaPor: string;
  creadaEn: string;
  actualizadaEn: string;
  codigoRepuesto: string | null;
  cantidadRepuesto: number | null;
}

export interface CrearWorkOrderRequest {
  cliente: string;
  descripcion: string;
  direccion: string;
}

export interface CambiarEstadoRequest {
  estado: EstadoOT;
  tecnicoAsignado?: string | null;
  codigoRepuesto?: string | null;
  cantidadRepuesto?: number | null;
}