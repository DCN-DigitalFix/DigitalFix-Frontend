/** Espeja ReportSummaryView y CertificateView de ms-digitalfix-report (via el BFF). */

export interface ReportSummary {
  /** No todos los estados estan necesariamente presentes como clave. */
  ordenesPorEstado: Partial<Record<string, number>>;
  total: number;
  /** null si todavia no hay ninguna orden CERRADA. */
  tiempoPromedioCierreHoras: number | null;
  totalEventosAuditoria: number;
}

export interface Certificate {
  ordenId: string;
  cliente: string | null;
  tecnicoAsignado: string | null;
  creadaEn: string;
  cerradaEn: string;
  duracionHoras: number | null;
}
