import { useState, useEffect } from "react";
import { productosApi, categoriasApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { getCategoriaDisplay } from "../utils/categoria";
import type { Producto, Categoria } from "../types";

interface ProductoFormData {
  nombre: string;
  descripcion: string;
  precio: string;
  categoriaId: number;
}

const initialFormData: ProductoFormData = {
  nombre: "",
  descripcion: "",
  precio: "",
  categoriaId: 0,
};

const ProductosPage = () => {
  const { hasAccessToAccion } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [formData, setFormData] = useState<ProductoFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<Producto | null>(null);

  // Generate consistent color for a categoria based on its name
  const getCategoriaColor = (categoria: string): { bg: string; text: string } => {
    // Hash function to generate consistent color from categoria name
    let hash = 0;
    for (let i = 0; i < categoria.length; i++) {
      hash = categoria.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate hue from hash (0-360)
    const hue = Math.abs(hash) % 360;
    
    // Use a fixed saturation and lightness for better visibility
    // Slightly different lightness for background and text
    return {
      bg: `hsl(${hue}, 70%, 90%)`,
      text: `hsl(${hue}, 70%, 30%)`,
    };
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [productosData, categoriasData] = await Promise.all([
        productosApi.getAll(),
        categoriasApi.getAll(),
      ]);
      // Filter out deleted and sort by name
      setProductos(
        (productosData || [])
          .filter((p) => !p.estaEliminado)
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
      );
      setCategorias(categoriasData || []);
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  // Get category names from API categorias (for filter dropdown)
  const categoryNames = categorias.map((c) => c.nombre);

  // Helper to get display name for producto's categoria
  const getProductoCategoriaName = (p: Producto) =>
    getCategoriaDisplay(p.categoriaName);

  // Filter products
  const filteredProductos = productos.filter((producto) => {
    const matchesSearch =
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    const productCategory = getProductoCategoriaName(producto);
    const matchesCategory =
      selectedCategory === "all" || productCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openCreateModal = () => {
    setEditingProducto(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openEditModal = (producto: Producto) => {
    setEditingProducto(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || "",
      precio: producto.precio.toString(),
      categoriaId: producto.categoriaId ?? 0,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProducto(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const precio = parseFloat(formData.precio);
    if (isNaN(precio) || precio <= 0) {
      setError("El precio debe ser un número mayor a 0");
      return;
    }

    if (!formData.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingProducto) {
        // Update
        await productosApi.update({
          id: editingProducto.id,
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim(),
          precio,
          categoriaId: formData.categoriaId > 0 ? formData.categoriaId : undefined,
        });
        setSuccessMessage("Producto actualizado correctamente");
      } else {
        // Create
        await productosApi.create({
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim(),
          precio,
          categoriaId: formData.categoriaId > 0 ? formData.categoriaId : undefined,
        });
        setSuccessMessage("Producto creado correctamente");
      }

      setTimeout(() => setSuccessMessage(""), 3000);
      closeModal();
      await loadData();
    } catch (err: any) {
      console.error("Error saving producto:", err);
      setError(err.response?.data?.message || "Error al guardar el producto");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (producto: Producto) => {
    try {
      setSaving(true);
      await productosApi.delete(producto.id);
      setSuccessMessage("Producto eliminado correctamente");
      setTimeout(() => setSuccessMessage(""), 3000);
      setDeleteConfirm(null);
      await loadData();
    } catch (err: any) {
      console.error("Error deleting producto:", err);
      setError(err.response?.data?.message || "Error al eliminar el producto");
    } finally {
      setSaving(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Productos
          </h1>
          <p className="text-gray-600 mt-1">
            {productos.length} producto{productos.length !== 1 ? "s" : ""}{" "}
            registrado{productos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={!hasAccessToAccion("Productos.Agregar Producto")}
          className={`px-4 py-2 rounded-md flex items-center gap-2 self-start sm:self-auto ${
            hasAccessToAccion("Productos.Agregar Producto")
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          title={
            !hasAccessToAccion("Productos.Agregar Producto")
              ? "No tienes permisos para agregar productos"
              : "Agregar nuevo producto"
          }
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nuevo Producto
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

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o descripción..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
            )}
          </div>

          {/* Category Filter Dropdown */}
          <div className="relative min-w-[200px]">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer"
            >
              <option value="all">Todas las categorías</option>
              {categoryNames.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Products Table */}
      {filteredProductos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
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
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <p className="text-gray-500">
            {searchTerm || selectedCategory !== "all"
              ? "No se encontraron productos con los filtros aplicados"
              : "No hay productos registrados"}
          </p>
          {!searchTerm && selectedCategory === "all" && (
            <button
              onClick={openCreateModal}
              className="mt-4 text-blue-600 hover:text-blue-800 underline"
            >
              Crear primer producto
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredProductos.map((producto) => (
                  <tr key={producto.id} className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {producto.nombre}
                        </p>
                        {producto.descripcion && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {producto.descripcion}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-2 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: getCategoriaColor(getProductoCategoriaName(producto)).bg,
                          color: getCategoriaColor(getProductoCategoriaName(producto)).text,
                        }}
                      >
                        {getProductoCategoriaName(producto)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      ${producto.precio.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(producto)}
                          disabled={!hasAccessToAccion("Productos.Editar Producto")}
                          className={`p-2 rounded-lg transition-colors ${
                            hasAccessToAccion("Productos.Editar Producto")
                              ? "text-blue-600 hover:bg-blue-50"
                              : "text-gray-300 cursor-not-allowed"
                          }`}
                          title={
                            !hasAccessToAccion("Productos.Editar Producto")
                              ? "No tienes permisos para editar productos"
                              : "Editar"
                          }
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(producto)}
                          disabled={!hasAccessToAccion("Productos.Eliminar Producto")}
                          className={`p-2 rounded-lg transition-colors ${
                            hasAccessToAccion("Productos.Eliminar Producto")
                              ? "text-red-600 hover:bg-red-50"
                              : "text-gray-300 cursor-not-allowed"
                          }`}
                          title={
                            !hasAccessToAccion("Productos.Eliminar Producto")
                              ? "No tienes permisos para eliminar productos"
                              : "Eliminar"
                          }
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeModal}
          />
          <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full bg-white rounded-lg shadow-xl z-50 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProducto ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button
                onClick={closeModal}
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

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-4"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Hamburguesa clásica"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descripción del producto..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.precio}
                      onChange={(e) =>
                        setFormData({ ...formData, precio: e.target.value })
                      }
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formData.categoriaId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        categoriaId: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Sin categoría</option>
                    {categorias
                      .filter((c) => !c.estaEliminado)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </option>
                      ))}
                  </select>
                  {categorias.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No hay categorías.{" "}
                      <a href="/categorias" className="underline">
                        Crea una primero
                      </a>
                      .
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving
                    ? "Guardando..."
                    : editingProducto
                    ? "Guardar cambios"
                    : "Crear producto"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Eliminar Producto
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar{" "}
              <strong>{deleteConfirm.nombre}</strong>? Esta acción no se puede
              deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductosPage;
