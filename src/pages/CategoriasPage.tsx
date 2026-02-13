import { useState, useEffect } from "react";
import { categoriasApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { Categoria } from "../types";

interface CategoriaFormData {
  nombre: string;
  descripcion: string;
}

const initialFormData: CategoriaFormData = {
  nombre: "",
  descripcion: "",
};

const CategoriasPage = () => {
  const { hasAccessToAccion } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(
    null
  );
  const [formData, setFormData] = useState<CategoriaFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Categoria | null>(null);

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await categoriasApi.getAll();
      setCategorias(data || []);
    } catch (err: any) {
      console.error("Error loading categorias:", err);
      setError("Error al cargar las categorías");
    } finally {
      setLoading(false);
    }
  };

  // Filter categories
  const filteredCategorias = categorias.filter((categoria) =>
    categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingCategoria(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openEditModal = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategoria(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEdit = editingCategoria != null && Number.isInteger(editingCategoria.id);
    if (!isEdit && !formData.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (isEdit) {
        // Siempre PUT al editar: solo actualizar (nombre y/o descripcion)
        await categoriasApi.update(editingCategoria!.id, {
          nombre: formData.nombre.trim() || editingCategoria!.nombre,
          descripcion: formData.descripcion.trim() || undefined,
        });
        setSuccessMessage("Categoría actualizada correctamente");
      } else {
        await categoriasApi.create({
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim() || undefined,
        });
        setSuccessMessage("Categoría creada correctamente");
      }

      setTimeout(() => setSuccessMessage(""), 3000);
      closeModal();
      await loadCategorias();
    } catch (err: any) {
      console.error("Error saving categoria:", err);
      setError(err.response?.data?.message || "Error al guardar la categoría");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoria: Categoria) => {
    try {
      setSaving(true);
      await categoriasApi.delete(categoria.id);
      setSuccessMessage("Categoría eliminada correctamente");
      setTimeout(() => setSuccessMessage(""), 3000);
      setDeleteConfirm(null);
      await loadCategorias();
    } catch (err: any) {
      console.error("Error deleting categoria:", err);
      setError(err.response?.data?.message || "Error al eliminar la categoría");
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
            Gestión de Categorías
          </h1>
          <p className="text-gray-600 mt-1">
            {categorias.length} categoría{categorias.length !== 1 ? "s" : ""}{" "}
            registrada{categorias.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={!hasAccessToAccion("Categorias.Agregar Categoria")}
          className={`px-4 py-2 rounded-md flex items-center gap-2 self-start sm:self-auto ${
            hasAccessToAccion("Categorias.Agregar Categoria")
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          title={
            !hasAccessToAccion("Categorias.Agregar Categoria")
              ? "No tienes permisos para agregar categorías"
              : "Agregar nueva categoría"
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
          Nueva Categoría
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

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative">
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
            placeholder="Buscar categoría..."
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
      </div>

      {/* Categories Grid */}
      {filteredCategorias.length === 0 ? (
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
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          <p className="text-gray-500">
            {searchTerm
              ? "No se encontraron categorías"
              : "No hay categorías registradas"}
          </p>
          {!searchTerm && (
            <button
              onClick={openCreateModal}
              className="mt-4 text-blue-600 hover:text-blue-800 underline"
            >
              Crear primera categoría
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategorias.map((categoria) => (
            <div
              key={categoria.id}
              className="bg-white rounded-lg shadow border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {categoria.nombre}
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(categoria)}
                    disabled={!hasAccessToAccion("Categorias.Editar Categoria")}
                    className={`p-1.5 rounded transition-colors ${
                      hasAccessToAccion("Categorias.Editar Categoria")
                        ? "text-blue-600 hover:bg-blue-50"
                        : "text-gray-300 cursor-not-allowed"
                    }`}
                    title={
                      !hasAccessToAccion("Categorias.Editar Categoria")
                        ? "No tienes permisos para editar categorías"
                        : "Editar"
                    }
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(categoria)}
                    disabled={!hasAccessToAccion("Categorias.Eliminar Categoria")}
                    className={`p-1.5 rounded transition-colors ${
                      hasAccessToAccion("Categorias.Eliminar Categoria")
                        ? "text-red-600 hover:bg-red-50"
                        : "text-gray-300 cursor-not-allowed"
                    }`}
                    title={
                      !hasAccessToAccion("Categorias.Eliminar Categoria")
                        ? "No tienes permisos para eliminar categorías"
                        : "Eliminar"
                    }
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              {categoria.descripcion && (
                <p className="text-sm text-gray-500">{categoria.descripcion}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeModal}
          />
          <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full bg-white rounded-lg shadow-xl z-50 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategoria ? "Editar Categoría" : "Nueva Categoría"}
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
                    placeholder="Ej: Comidas, Bebidas, Postres..."
                    required
                    autoFocus
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
                    placeholder="Descripción opcional..."
                    rows={3}
                  />
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
                    : editingCategoria
                    ? "Guardar cambios"
                    : "Crear categoría"}
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
              Eliminar Categoría
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar la categoría{" "}
              <strong>{deleteConfirm.nombre}</strong>? Los productos de esta
              categoría no serán eliminados.
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

export default CategoriasPage;
