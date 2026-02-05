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
