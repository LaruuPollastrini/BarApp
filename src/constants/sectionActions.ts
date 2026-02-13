/**
 * Nombres de acción (parte después del punto en "Formulario.NombreAccion")
 * que otorgan acceso a ver cada sección. Si el usuario tiene al menos una
 * de estas acciones (cualquier formulario), puede ver la pestaña y entrar a la ruta.
 *
 * Mesas: incluye todas las acciones de mesas Y de pedidos, porque los pedidos
 * solo se ven y gestionan por mesa; no hay forma de acceder a pedidos sin pasar por Mesas.
 */
export const SECTION_ACTIONS: Record<string, string[]> = {
  Mesas: [
    "Ver Mesa",
    "Abrir Mesa",
    "Cerrar Mesa",
    "Eliminar Mesa",
    "Ver Pedidos",
    "Editar Pedido",
    "Crear Pedido",
    "Confirmar Pedido",
    "Rechazar Pedido",
    "Cancelar Pedido",
    "Cambiar Estado de Pedido",
    "Ver Historial de Pedidos",
    "Imprimir Ticket",
  ],
  Productos: [
    "Ver Productos",
    "Agregar Producto",
    "Editar Producto",
    "Eliminar Producto",
  ],
  Categorias: [
    "Ver Categorias",
    "Agregar Categoria",
    "Editar Categoria",
    "Eliminar Categoria",
  ],
  Reportes: [
    "Ver Reportes",
    "Ver Productos Mas Pedidos",
    "Ver Productos Menos Pedidos",
    "Ver Productos Nunca Pedidos",
    "Exportar Reportes",
  ],
  // Seguridad: cada subsección visible si tiene al menos una acción de esa área
  Modulos: ["Ver Modulos", "Crear Modulo", "Editar Modulo", "Eliminar Modulo"],
  Formularios: [
    "Ver Formularios",
    "Crear Formulario",
    "Editar Formulario",
    "Eliminar Formulario",
  ],
  Acciones: ["Ver Acciones"],
  Grupos: ["Ver Grupos", "Crear Grupo", "Editar Grupo", "Eliminar Grupo"],
  Usuarios: [
    "Ver Usuarios",
    "Crear Usuario",
    "Editar Usuario",
    "Eliminar Usuario",
  ],
};

/** Extrae el nombre de la acción (parte después del último punto) */
export function getActionName(accionCompleta: string): string {
  const idx = accionCompleta.lastIndexOf(".");
  return idx >= 0 ? accionCompleta.slice(idx + 1).trim() : accionCompleta.trim();
}
