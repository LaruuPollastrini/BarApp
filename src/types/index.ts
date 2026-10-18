export interface Modulo {
  id: number;
  nombre: string;
  formularios?: Formulario[];
}

export interface Formulario {
  id: number;
  nombre: string;
  modulo?: Modulo;
  acciones?: Accion[];
}

export interface Accion {
  id: number;
  nombre: string;
  formularios?: Array<{ id: number; nombre: string }>;
}

export interface Grupo {
  id: number;
  nombre: string;
  estaActivo: boolean;
  usuarios?: User[];
  formularios?: Array<{ id: number; nombre: string }>;
  gruposPadres?: Grupo[];
  gruposHijos?: Grupo[];
}

export interface User {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  estaActivo: boolean;
  grupos?: Array<{
    id: number;
    nombre: string;
    estaActivo: boolean;
  }>;
}

export interface CreateModuloDto {
  nombre: string;
  /** IDs de formularios a asignar a este módulo (opcional) */
  formularioIds?: number[];
}

export interface UpdateModuloDto {
  nombre: string;
  /** IDs de formularios asignados a este módulo (opcional) */
  formularioIds?: number[];
}

export interface CreateFormularioDto {
  nombre: string;
  moduloId: number;
  accionesIds?: number[];
}

export interface UpdateFormularioDto {
  nombre: string;
  moduloId: number;
  accionesIds?: number[];
}

export interface CreateAccionDto {
  nombre: string;
  formulariosIds?: number[];
}

export interface UpdateAccionDto {
  nombre?: string;
  formulariosIds?: number[];
}

export interface CreateGrupoDto {
  nombre: string;
  estaActivo?: boolean;
  formulariosIds?: number[];
}

export interface UpdateGrupoDto {
  nombre: string;
  estaActivo?: boolean;
  formulariosIds?: number[];
}

export interface CreateUserDto {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  telefono: string;
  estaActivo?: boolean;
  gruposIds?: number[];
}

export interface UpdateUserDto {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  estaActivo?: boolean;
  gruposIds?: number[];
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoriaId: number | null;
  /** Nombre de la categoría (BE devuelve "" si no hay) */
  categoriaName?: string;
  estaEliminado: boolean;
}

export interface CartItem {
  producto: Producto;
  cantidad: number;
}

export interface DetallePedidoDto {
  id?: number;
  cantidad: number;
  precioUnitario?: number;
  producto: {
    id: number;
  };
  pedidoId?: number;
}

export interface CreatePedidoDto {
  mesaId: number;
  detallesPedido: DetallePedidoDto[];
  user?: {
    id: number;
  };
}

export interface Mesa {
  idmesa: number;
  numero: number;
  estaAbierta: boolean;
  visitToken?: string | null;
  codigoVerificacion?: string | null;
}

export interface DetallePedido {
  id: number;
  cantidad: number;
  precioUnitario: number;
  producto: Producto;
}

export interface Pedido {
  idpedido: number;
  fecha: string;
  estado: string;
  mesa: Mesa;
  detallespedido: DetallePedido[];
  codigoVerificacion?: string | null;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string | null;
  estaEliminado?: boolean;
}

export interface DetallePedidoTicket {
  idDetalle: number;
  cantidad: number;
  precioUnitario: number;
  producto: { id: number; nombre: string; precio?: number };
}

export interface PedidoTicket {
  idpedido: number;
  fecha?: string;
  detallespedido?: DetallePedidoTicket[];
}

export interface Ticket {
  idticket: number;
  total: number;
  fecha: string;
  mesaId: number | null;
  mesa?: Mesa | null;
  pedido?: PedidoTicket | null;
}

// =====================================================================
// RESERVAS (core 2)
// =====================================================================

export type EstadoReserva =
  | "Pendiente"
  | "Aceptada"
  | "Rechazada"
  | "Cancelada"
  | "Cerrada";

/** Turno publicado en la agenda, con el cupo calculado por el backend */
export interface TurnoAgenda {
  idAgenda: number;
  fecha: string; // 'YYYY-MM-DD'
  horario: string; // 'HH:MM:SS'
  capacidad: number;
  estaActiva: boolean;
  ocupados: number;
  cupoDisponible: number;
}

export interface CrearTurnoDto {
  fecha: string;
  horario: string; // 'HH:MM'
  capacidad: number;
}

export interface CrearRangoAgendaDto {
  fechaDesde: string;
  fechaHasta: string;
  diasSemana?: number[]; // 0 = domingo ... 6 = sábado
  horaInicio: string;
  horaFin: string;
  intervaloMinutos: number;
  capacidad: number;
}

export interface ResultadoRangoAgenda {
  creados: number;
  omitidos: number;
  turnos: TurnoAgenda[];
}

export interface HistorialReserva {
  estadoAnterior: string | null;
  estadoNuevo: string;
  fecha: string;
  usuario: string | null;
}

export interface Reserva {
  idReserva: number;
  cantidadPersonas: number;
  estado: EstadoReserva;
  fechaSolicitud: string;
  puedeCancelar: boolean;
  turno: { idAgenda: number; fecha: string; horario: string } | null;
  cliente?: {
    id: number;
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
  };
  historial?: HistorialReserva[];
}

// ---------------- Auditoría ----------------

export interface EventoSesion {
  id: number;
  fecha: string;
  tipo: "LOGIN" | "LOGIN_FALLIDO" | "LOGOUT";
  correo: string;
  usuario: string | null;
  detalle: string | null;
  ip: string | null;
}

export interface ReporteSesiones {
  resumen: { logins: number; loginsFallidos: number; logouts: number };
  eventos: EventoSesion[];
}

export interface CambioReserva {
  idHistorial: number;
  fecha: string;
  idReserva: number;
  cliente: string | null;
  turno: { fecha: string; horario: string } | null;
  cantidadPersonas: number | null;
  estadoAnterior: string | null;
  estadoNuevo: string;
  realizadoPor: string | null;
}

// ---------------- Reportes de reservas ----------------

export interface OcupacionTurno {
  idAgenda: number;
  fecha: string;
  horario: string;
  diaSemana: string;
  capacidad: number;
  reservas: number;
  personasReservadas: number;
  porcentajeOcupacion: number;
}

export interface OcupacionAgrupada {
  etiqueta: string;
  turnos: number;
  capacidad: number;
  personasReservadas: number;
  porcentajeOcupacion: number;
}

export interface ReporteOcupacion {
  resumen: {
    periodo: { desde: string; hasta: string };
    turnos: number;
    capacidadTotal: number;
    personasReservadas: number;
    ocupacionPromedio: number;
    turnoMasDemandado: OcupacionTurno | null;
  };
  porTurno: OcupacionTurno[];
  porDiaSemana: OcupacionAgrupada[];
  porHorario: OcupacionAgrupada[];
}

export interface ReporteEstadosReservas {
  resumen: {
    periodo: { desde: string; hasta: string };
    totalReservas: number;
    totalPersonas: number;
    tasaCancelacion: number;
    tasaRechazo: number;
    tasaAsistencia: number | null;
  };
  porEstado: {
    estado: string;
    cantidad: number;
    personas: number;
    porcentaje: number;
  }[];
}