import axios from "axios";
import type {
  Modulo,
  Formulario,
  Accion,
  Grupo,
  User,
  CreateModuloDto,
  UpdateModuloDto,
  CreateFormularioDto,
  UpdateFormularioDto,
  CreateAccionDto,
  UpdateAccionDto,
  CreateGrupoDto,
  UpdateGrupoDto,
  CreateUserDto,
  UpdateUserDto,
  Producto,
  CreatePedidoDto,
  DetallePedidoDto,
  Mesa,
  Categoria,
  Ticket,
} from "../types";

const API_BASE_URL = "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh-token`,
            {
              refreshToken,
            },
          );
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  },
);

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh-token`,
            {
              refreshToken,
            },
          );
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  },
);

// Modulos
export const modulosApi = {
  getAll: async (): Promise<Modulo[]> => {
    const response = await api.get<Modulo[]>("/modulos");
    return response.data;
  },
  getById: async (id: number): Promise<Modulo> => {
    const response = await api.get<Modulo>(`/modulos/${id}`);
    return response.data;
  },
  create: async (data: CreateModuloDto): Promise<Modulo> => {
    const response = await api.post<Modulo>("/modulos", data);
    return response.data;
  },
  update: async (id: number, data: UpdateModuloDto): Promise<Modulo> => {
    const response = await api.put<Modulo>(`/modulos/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/modulos/${id}`);
  },
};

// Formularios
export const formulariosApi = {
  getAll: async (): Promise<Formulario[]> => {
    const response = await api.get<Formulario[]>("/formularios");
    return response.data;
  },
  getById: async (id: number): Promise<Formulario> => {
    const response = await api.get<Formulario>(`/formularios/${id}`);
    return response.data;
  },
  create: async (data: CreateFormularioDto): Promise<Formulario> => {
    const response = await api.post<Formulario>("/formularios", data);
    return response.data;
  },
  update: async (
    id: number,
    data: UpdateFormularioDto,
  ): Promise<Formulario> => {
    const response = await api.put<Formulario>(`/formularios/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/formularios/${id}`);
  },
};

// Acciones
export const accionesApi = {
  getAll: async (): Promise<Accion[]> => {
    const response = await api.get<Accion[]>("/acciones");
    return response.data;
  },
  getById: async (id: number): Promise<Accion> => {
    const response = await api.get<Accion>(`/acciones/${id}`);
    return response.data;
  },
  create: async (data: CreateAccionDto): Promise<Accion> => {
    const response = await api.post<Accion>("/acciones", data);
    return response.data;
  },
  update: async (id: number, data: UpdateAccionDto): Promise<Accion> => {
    const response = await api.put<Accion>(`/acciones/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/acciones/${id}`);
  },
  getPredefinedActions: async (): Promise<
    Array<{ key: string; label: string }>
  > => {
    const response = await api.get<Array<{ key: string; label: string }>>(
      "/acciones/predefinidas/listado",
    );
    return response.data;
  },
  getPredefinedActionsWithGrupos: async (): Promise<
    Array<{
      key: string;
      label: string;
      formulario: string;
      accionNombre: string;
      accionId: number;
      formularios: Array<{ id: number; nombre: string }>;
      grupos: Array<{ id: number; nombre: string }>;
      existsInDb: boolean;
      dbId?: number;
    }>
  > => {
    const response = await api.get<
      Array<{
        key: string;
        label: string;
        formulario: string;
        accionNombre: string;
        accionId: number;
        formularios: Array<{ id: number; nombre: string }>;
        grupos: Array<{ id: number; nombre: string }>;
        existsInDb: boolean;
        dbId?: number;
      }>
    >("/acciones/predefinidas/con-grupos");
    return response.data;
  },
  verifyMatch: async (): Promise<{
    totalInDb: number;
    acciones: Array<{
      id: number;
      nombre: string;
      formulario: string;
      modulo: string;
      key: string;
    }>;
  }> => {
    const response = await api.get("/acciones/verify-match");
    return response.data;
  },
};

// Grupos
export const gruposApi = {
  getAll: async (): Promise<Grupo[]> => {
    const response = await api.get<Grupo[]>("/grupos");
    return response.data;
  },
  getById: async (id: number): Promise<Grupo> => {
    const response = await api.get<Grupo>(`/grupos/${id}`);
    return response.data;
  },
  create: async (data: CreateGrupoDto): Promise<Grupo> => {
    const response = await api.post<Grupo>("/grupos", data);
    return response.data;
  },
  update: async (id: number, data: UpdateGrupoDto): Promise<Grupo> => {
    const response = await api.put<Grupo>(`/grupos/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/grupos/${id}`);
  },
};

// Usuarios
export const usuariosApi = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get<User[]>("/users");
    return response.data;
  },
  getById: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },
  create: async (data: CreateUserDto): Promise<User> => {
    const response = await api.post<User>("/users", data);
    return response.data;
  },
  update: async (id: number, data: UpdateUserDto): Promise<User> => {
    const response = await api.put<User>(`/users/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

// Auth
export const authApi = {
  login: async (correo: string, contrasena: string) => {
    const response = await api.post("/auth/login", { correo, contrasena });
    return response.data;
  },
  register: async (data: {
    nombre: string;
    apellido: string;
    correo: string;
    contrasena: string;
    telefono: string;
  }) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },
  requestPasswordReset: async (correo: string) => {
    const response = await api.post("/auth/request-password-reset", { correo });
    return response.data;
  },
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post("/auth/reset-password", {
      token,
      newPassword,
    });
    return response.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
  getModulosAccesibles: async () => {
    const response = await api.get("/auth/modulos-accesibles");
    return response.data;
  },
  puedeAccederModulo: async (moduloNombre: string) => {
    const response = await api.get(`/auth/puede-acceder/${moduloNombre}`);
    return response.data;
  },
  refreshPermissions: async () => {
    const response = await api.get("/auth/modulos-accesibles");
    return response.data;
  },
  getAccionesAccesibles: async () => {
    const response = await api.get("/auth/acciones-accesibles");
    return response.data;
  },
  getUserGrupos: async () => {
    const response = await api.get("/auth/user-grupos");
    return response.data;
  },
  debugPermissions: async () => {
    const response = await api.get("/auth/debug-permissions");
    return response.data;
  },
};

// Productos
export const productosApi = {
  getAll: async (): Promise<Producto[]> => {
    const response = await api.get<Producto[] | string>("/productos");
    const data = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
    return data ?? [];
  },
  getById: async (id: number): Promise<Producto> => {
    const response = await api.get<Producto | string>(`/productos/${id}`);
    const data = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
    return data;
  },
  create: async (data: {
    nombre: string;
    descripcion: string;
    precio: number;
    categoriaId?: number | null;
  }): Promise<string> => {
    const response = await api.post("/productos", data);
    return response.data;
  },
  update: async (data: {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    categoriaId?: number | null;
  }): Promise<string> => {
    const response = await api.put("/productos", data);
    return response.data;
  },
  delete: async (id: number): Promise<string> => {
    const response = await api.delete(`/productos/${id}`);
    return response.data;
  },
};

// Mesas
export const mesasApi = {
  getAll: async (): Promise<Mesa[]> => {
    const response = await api.get("/mesas");
    // Backend returns JSON.stringify, axios parses it as a string, so we need to parse
    const data =
      typeof response.data === "string"
        ? JSON.parse(response.data)
        : response.data;
    return data;
  },
  getByNumero: async (numero: number): Promise<Mesa> => {
    const response = await api.get(`/mesas/numero/${numero}`);
    // Backend returns JSON.stringify, axios parses it as a string, so we need to parse
    const data =
      typeof response.data === "string"
        ? JSON.parse(response.data)
        : response.data;
    return data;
  },
  updateStatus: async (
    idmesa: number,
    estaAbierta: boolean,
  ): Promise<string> => {
    const response = await api.put(`/mesas/${idmesa}/estado`, { estaAbierta });
    return response.data;
  },
  create: async (numero: number): Promise<string> => {
    const response = await api.post("/mesas", { numero });
    return response.data;
  },
  delete: async (idmesa: number): Promise<string> => {
    const response = await api.delete(`/mesas/${idmesa}`);
    return response.data;
  },
  verifyCode: async (
    numeroMesa: number,
    codigo: string,
  ): Promise<{ valid: boolean; message: string }> => {
    const response = await api.post("/mesas/verificar-codigo", {
      numeroMesa,
      codigo,
    });
    return response.data;
  },
};

// Session
export const sessionApi = {
  scanTable: async (numeroMesa: number) => {
    const response = await api.post("/session/scan-table", {
      numeroMesa,
    });
    return response.data;
  },
  validate: async (sessionId: string, visitToken: string) => {
    const response = await api.post("/session/validate", {
      sessionId,
      visitToken,
    });
    return response.data;
  },
};

// Tickets
export const ticketsApi = {
  getByMesa: async (mesaId: number): Promise<Ticket[]> => {
    const response = await api.get<Ticket[]>(`/tickets/by-mesa/${mesaId}`);
    return response.data;
  },
  getById: async (id: number): Promise<Ticket> => {
    const response = await api.get<Ticket>(`/tickets/${id}`);
    return response.data;
  },
  generate: async (pedidoId: number): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>("/tickets/", {
      pedidoId,
    });
    return response.data;
  },
};

// Pedidos
export const pedidosApi = {
  create: async (data: CreatePedidoDto) => {
    // The backend expects: detallesPedido, usuario (id), mesa (id)
    const response = await api.post("/pedidos", {
      detallesPedido: data.detallesPedido,
      usuario: data.user?.id || 0,
      mesa: data.mesaId,
    });
    return response.data;
  },
  createAnonimo: async (
    numeroMesa: number,
    detallesPedido: DetallePedidoDto[],
    sessionId: string,
    visitToken: string,
  ) => {
    const response = await api.post("/pedidos/anonimo", {
      numeroMesa,
      detallesPedido,
      sessionId,
      visitToken,
    });
    return response.data;
  },
  getByMesa: async (numeroMesa: number, codigoVerificacion: string) => {
    const response = await api.get(
      `/pedidos/mesa/${numeroMesa}?codigo=${codigoVerificacion}`,
    );
    return response.data;
  },
  // Admin endpoints
  getByMesaAdmin: async (numeroMesa: number) => {
    const response = await api.get(`/pedidos/admin/mesa/${numeroMesa}`);
    return response.data;
  },
  getPendientesPorMesa: async (): Promise<
    Array<{ mesaId: number; count: number }>
  > => {
    const response = await api.get<Array<{ mesaId: number; count: number }>>(
      "/pedidos/pendientes-por-mesa",
    );
    return response.data ?? [];
  },
  updateEstado: async (pedidoId: number, estado: string) => {
    const response = await api.put(`/pedidos/${pedidoId}/estado`, { estado });
    return response.data;
  },
  updateDetalles: async (
    pedidoId: number,
    detallesPedido: DetallePedidoDto[],
  ) => {
    const response = await api.put(`/pedidos/${pedidoId}`, { detallesPedido });
    return response.data;
  },
  getMostOrderedProducts: async (categoria?: string) => {
    const url = categoria
      ? `/pedidos/reportes/productos-mas-pedidos?categoria=${encodeURIComponent(
          categoria,
        )}`
      : "/pedidos/reportes/productos-mas-pedidos";
    const response = await api.get(url);
    return response.data;
  },
  getIncomeReport: async (startDate: string, endDate: string) => {
    const params = new URLSearchParams();
    params.append("startDate", startDate);
    params.append("endDate", endDate);
    const url = `/pedidos/reportes/ingresos?${params.toString()}`;
    const response = await api.get(url);
    return response.data;
  },
  getAverageTicket: async (startDate: string, endDate: string) => {
    const params = new URLSearchParams();
    params.append("startDate", startDate);
    params.append("endDate", endDate);
    const url = `/pedidos/reportes/ticket-promedio?${params.toString()}`;
    const response = await api.get(url);
    return response.data;
  },
  getLeastOrderedProducts: async (categoria?: string) => {
    const url = categoria
      ? `/pedidos/reportes/productos-menos-pedidos?categoria=${encodeURIComponent(
          categoria,
        )}`
      : "/pedidos/reportes/productos-menos-pedidos";
    const response = await api.get(url);
    return response.data;
  },
  getNeverOrderedProducts: async (categoria?: string) => {
    const url = categoria
      ? `/pedidos/reportes/productos-nunca-pedidos?categoria=${encodeURIComponent(
          categoria,
        )}`
      : "/pedidos/reportes/productos-nunca-pedidos";
    const response = await api.get(url);
    return response.data;
  },
};

// Categorias
export const categoriasApi = {
  getAll: async (): Promise<Categoria[]> => {
    const response = await api.get<Categoria[]>("/categorias");
    return response.data;
  },
  getById: async (id: number): Promise<Categoria> => {
    const response = await api.get<Categoria>(`/categorias/${id}`);
    return response.data;
  },
  create: async (data: {
    nombre: string;
    descripcion?: string;
  }): Promise<Categoria> => {
    const response = await api.post<Categoria>("/categorias", data);
    return response.data;
  },
  update: async (
    id: number,
    data: { nombre: string; descripcion?: string },
  ): Promise<Categoria> => {
    const response = await api.put<Categoria>(`/categorias/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<string> => {
    const response = await api.delete(`/categorias/${id}`);
    return response.data;
  },
};

export default api;
