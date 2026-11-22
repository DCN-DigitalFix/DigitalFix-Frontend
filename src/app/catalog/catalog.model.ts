/** Espeja los DTO reales de ms-digitalfix-catalog (RepuestoResponse, ServicioResponse). */

export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string | null;
  tarifa: number;
  activo: boolean;
}

export interface Repuesto {
  id: number;
  codigo: string;
  nombre: string;
  stock: number;
  precioUnitario: number;
}

export interface CrearServicioRequest {
  nombre: string;
  descripcion?: string | null;
  tarifa: number;
}

export interface CrearRepuestoRequest {
  codigo: string;
  nombre: string;
  stock: number;
  precioUnitario: number;
}

export interface DescontarStockRequest {
  cantidad: number;
}
