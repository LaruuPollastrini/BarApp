import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { pedidosApi, productosApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { getCategoriaDisplay } from "../utils/categoria";
import type { Pedido, Producto, DetallePedidoDto } from "../types";

type EstadoPedido = "Pendiente" | "Confirmado" | "Rechazado";

const AdminPedidosMesaPage = () => {
  const { numeroMesa } = useParams<{ numeroMesa: string }>();
  const navigate = useNavigate();
  const { hasAccessToAccion } = useAuth();
  const mesaNumber = parseInt(numeroMesa || "0");

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [editedDetalles, setEditedDetalles] = useState<DetallePedidoDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    if (mesaNumber <= 0) {
      setError("Número de mesa inválido");
      setLoading(false);
      return;
    }
    loadData();
  }, [mesaNumber]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [pedidosData, productosData] = await Promise.all([
        pedidosApi.getByMesaAdmin(mesaNumber),
        productosApi.getAll(),
      ]);
      setPedidos(pedidosData || []);
      setProductos(
        (productosData || []).filter((p: Producto) => !p.estaEliminado)
      );
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEstado = async (pedidoId: number, estado: EstadoPedido) => {
    try {
      setSaving(true);
      await pedidosApi.updateEstado(pedidoId, estado);
      setSuccessMessage(`Estado actualizado a ${estado}`);
      setTimeout(() => setSuccessMessage(""), 3000);
      await loadData();
    } catch (err: any) {
      console.error("Error updating estado:", err);
      setError(err.response?.data?.message || "Error al actualizar el estado");
    } finally {
      setSaving(false);
    }
  };

  const startEditingPedido = (pedido: Pedido) => {
    setEditingPedido(pedido);
    setEditedDetalles(
      pedido.detallespedido.map((d) => ({
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        producto: { id: d.producto.id },
      }))
    );
    // Reset filters when opening modal
    setProductSearch("");
    setSelectedCategory("all");
  };

  const cancelEditing = () => {
    setEditingPedido(null);
    setEditedDetalles([]);
  };

  const updateDetalleCantidad = (index: number, cantidad: number) => {
    if (cantidad < 0) return;
    const newDetalles = [...editedDetalles];
    if (cantidad === 0) {
      // Remove item
      newDetalles.splice(index, 1);
    } else {
      newDetalles[index] = { ...newDetalles[index], cantidad };
    }
    setEditedDetalles(newDetalles);
  };

  const addProductToDetalles = (productoId: number) => {
    const producto = productos.find((p) => p.id === productoId);
    if (!producto) return;

    // Check if product already exists in detalles
    const existingIndex = editedDetalles.findIndex(
      (d) => d.producto.id === productoId
    );
    if (existingIndex >= 0) {
      // Increment quantity
      updateDetalleCantidad(
        existingIndex,
        editedDetalles[existingIndex].cantidad + 1
      );
    } else {
      // Add new item
      setEditedDetalles([
        ...editedDetalles,
        {
          cantidad: 1,
          precioUnitario: producto.precio,
          producto: { id: producto.id },
        },
      ]);
    }
  };

  const saveEditedPedido = async () => {
    if (!editingPedido || editedDetalles.length === 0) return;

    try {
      setSaving(true);
      await pedidosApi.updateDetalles(editingPedido.idpedido, editedDetalles);
      setSuccessMessage("Pedido actualizado correctamente");
      setTimeout(() => setSuccessMessage(""), 3000);
      setEditingPedido(null);
      setEditedDetalles([]);
      await loadData();
    } catch (err: any) {
      console.error("Error saving pedido:", err);
      setError(err.response?.data?.message || "Error al guardar el pedido");
    } finally {
      setSaving(false);
    }
  };

  const getProductoById = (id: number) => productos.find((p) => p.id === id);

  // Get unique categories from products
  const categories = Array.from(
    new Set(
      productos.map((p) => getCategoriaDisplay(p.categoriaName))
    )
  ).sort();

  // Filter products by search and category
  const filteredProductos = productos.filter((producto) => {
    const matchesSearch = producto.nombre
      .toLowerCase()
      .includes(productSearch.toLowerCase());
    const productCategory =
      getCategoriaDisplay(producto.categoriaName);
    const matchesCategory =
      selectedCategory === "all" || productCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Confirmado":
        return "bg-green-100 text-green-800 border-green-200";
      case "Rechazado":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate("/mesas")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver a Mesas
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Pedidos - Mesa {mesaNumber}
          </h1>
          <p className="text-gray-600 mt-1">
            {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""} encontrado
            {pedidos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError("")}
            className="text-red-600 underline text-sm mt-1"
          >
            Cerrar
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Pedidos List */}
      {pedidos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-gray-500">No hay pedidos para esta mesa</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <div
              key={pedido.idpedido}
              className="bg-white rounded-lg shadow border overflow-hidden"
            >
              {/* Pedido Header */}
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Pedido #{pedido.idpedido}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(pedido.fecha).toLocaleString("es-AR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    {pedido.codigoVerificacion && (
                      <p className="text-xs text-gray-400">
                        Código: {pedido.codigoVerificacion}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full border ${getEstadoColor(
                      pedido.estado
                    )}`}
                  >
                    {pedido.estado}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Estado Buttons */}
                  {pedido.estado === "Pendiente" && (
                    <>
                      <button
                        onClick={() =>
                          handleChangeEstado(pedido.idpedido, "Confirmado")
                        }
                        disabled={saving || !hasAccessToAccion("Pedidos.Confirmar Pedido")}
                        className={`px-3 py-1.5 text-white text-sm rounded-md disabled:opacity-50 ${
                          hasAccessToAccion("Pedidos.Confirmar Pedido")
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                        title={
                          !hasAccessToAccion("Pedidos.Confirmar Pedido")
                            ? "No tienes permisos para confirmar pedidos"
                            : "Confirmar pedido"
                        }
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() =>
                          handleChangeEstado(pedido.idpedido, "Rechazado")
                        }
                        disabled={saving || !hasAccessToAccion("Pedidos.Rechazar Pedido")}
                        className={`px-3 py-1.5 text-white text-sm rounded-md disabled:opacity-50 ${
                          hasAccessToAccion("Pedidos.Rechazar Pedido")
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                        title={
                          !hasAccessToAccion("Pedidos.Rechazar Pedido")
                            ? "No tienes permisos para rechazar pedidos"
                            : "Rechazar pedido"
                        }
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                  {pedido.estado !== "Pendiente" && (
                    <button
                      onClick={() =>
                        handleChangeEstado(pedido.idpedido, "Pendiente")
                      }
                      disabled={saving || (!hasAccessToAccion("Pedidos.Confirmar Pedido") && !hasAccessToAccion("Pedidos.Rechazar Pedido"))}
                      className={`px-3 py-1.5 text-white text-sm rounded-md disabled:opacity-50 ${
                        (hasAccessToAccion("Pedidos.Confirmar Pedido") || hasAccessToAccion("Pedidos.Rechazar Pedido"))
                          ? "bg-yellow-500 hover:bg-yellow-600"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                      title={
                        (!hasAccessToAccion("Pedidos.Confirmar Pedido") && !hasAccessToAccion("Pedidos.Rechazar Pedido"))
                          ? "No tienes permisos para cambiar el estado de pedidos"
                          : "Volver a pendiente"
                      }
                    >
                      Volver a Pendiente
                    </button>
                  )}
                  {/* Edit Button */}
                  <button
                    onClick={() => startEditingPedido(pedido)}
                    disabled={!hasAccessToAccion("Mesas.Editar Pedido")}
                    className={`px-3 py-1.5 text-white text-sm rounded-md ${
                      hasAccessToAccion("Mesas.Editar Pedido")
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                    title={
                      !hasAccessToAccion("Mesas.Editar Pedido")
                        ? "No tienes permisos para editar pedidos"
                        : "Editar pedido"
                    }
                  >
                    Editar
                  </button>
                </div>
              </div>

              {/* Pedido Items */}
              <div className="p-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="pb-2">Producto</th>
                      <th className="pb-2 text-center">Cantidad</th>
                      <th className="pb-2 text-right">Precio Unit.</th>
                      <th className="pb-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedido.detallespedido?.map((detalle, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-2 font-medium text-gray-900">
                          {detalle.producto?.nombre || "Producto"}
                        </td>
                        <td className="py-2 text-center">{detalle.cantidad}</td>
                        <td className="py-2 text-right">
                          ${detalle.precioUnitario.toFixed(2)}
                        </td>
                        <td className="py-2 text-right font-medium">
                          $
                          {(detalle.cantidad * detalle.precioUnitario).toFixed(
                            2
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                      <td colSpan={3} className="pt-3 text-right">
                        Total:
                      </td>
                      <td className="pt-3 text-right">
                        $
                        {pedido.detallespedido
                          ?.reduce(
                            (sum, d) => sum + d.cantidad * d.precioUnitario,
                            0
                          )
                          .toFixed(2) || "0.00"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingPedido && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={cancelEditing}
          />
          <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-2xl md:w-full bg-white rounded-lg shadow-xl z-50 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Editar Pedido #{editingPedido.idpedido}
              </h2>
              <button
                onClick={cancelEditing}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Current Items */}
              <h3 className="font-semibold text-gray-900 mb-3">
                Items del pedido
              </h3>
              {editedDetalles.length === 0 ? (
                <p className="text-gray-500 mb-4">No hay items en el pedido</p>
              ) : (
                <div className="space-y-2 mb-6">
                  {editedDetalles.map((detalle, idx) => {
                    const producto = getProductoById(detalle.producto.id);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {producto?.nombre || "Producto desconocido"}
                          </p>
                          <p className="text-sm text-gray-500">
                            ${producto?.precio.toFixed(2) || "0.00"} c/u
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateDetalleCantidad(idx, detalle.cantidad - 1)
                            }
                            className="w-8 h-8 flex items-center justify-center border rounded text-gray-600 hover:bg-gray-200"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">
                            {detalle.cantidad}
                          </span>
                          <button
                            onClick={() =>
                              updateDetalleCantidad(idx, detalle.cantidad + 1)
                            }
                            className="w-8 h-8 flex items-center justify-center border rounded text-gray-600 hover:bg-gray-200"
                          >
                            +
                          </button>
                          <button
                            onClick={() => updateDetalleCantidad(idx, 0)}
                            className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Product */}
              <h3 className="font-semibold text-gray-900 mb-3">
                Agregar producto
              </h3>

              {/* Search and Filter */}
              <div className="space-y-3 mb-4">
                {/* Search Input */}
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar producto..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  {productSearch && (
                    <button
                      onClick={() => setProductSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      selectedCategory === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Todos
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                        selectedCategory === category
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {filteredProductos.length === 0 ? (
                  <p className="col-span-full text-center text-gray-500 py-4">
                    No se encontraron productos
                  </p>
                ) : (
                  filteredProductos.map((producto) => (
                    <button
                      key={producto.id}
                      onClick={() => addProductToDetalles(producto.id)}
                      className="p-2 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {producto.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        ${producto.precio.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {getCategoriaDisplay(producto.categoriaName)}
                      </p>
                    </button>
                  ))
                )}
              </div>

              {/* Total */}
              <div className="mt-6 pt-4 border-t flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-gray-900">
                  $
                  {editedDetalles
                    .reduce((sum, d) => {
                      const producto = getProductoById(d.producto.id);
                      return sum + d.cantidad * (producto?.precio || 0);
                    }, 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex justify-end gap-3">
              <button
                onClick={cancelEditing}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={saveEditedPedido}
                disabled={saving || editedDetalles.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPedidosMesaPage;
