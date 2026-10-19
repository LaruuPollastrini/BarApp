import { useState, useEffect } from "react";
import { formulariosApi, modulosApi, accionesApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type {
  Formulario,
  CreateFormularioDto,
  UpdateFormularioDto,
  Modulo,
  Accion,
} from "../types";
import Modal from "../components/Modal";

const FormulariosPage = () => {
  const { hasAccessToAccion } = useAuth();
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [acciones, setAcciones] = useState<Accion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingFormulario, setEditingFormulario] = useState<Formulario | null>(
    null,
  );
  const [viewingFormulario, setViewingFormulario] = useState<Formulario | null>(
    null,
  );
  const [deletingFormulario, setDeletingFormulario] =
    useState<Formulario | null>(null);
  const [formData, setFormData] = useState<CreateFormularioDto>({
    nombre: "",
    moduloId: 0,
    accionesIds: [],
  });

  const [busquedaAccion, setBusquedaAccion] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  // Al abrir el modal, el buscador de acciones arranca vacío
  useEffect(() => {
    if (isModalOpen) setBusquedaAccion("");
  }, [isModalOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [formulariosData, modulosData, accionesData] = await Promise.all([
        formulariosApi.getAll(),
        modulosApi.getAll(),
        accionesApi.getAll(),
      ]);
      setFormularios(formulariosData);
      setModulos(modulosData);
      setAcciones(accionesData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFormulario(null);
    setFormData({ nombre: "", moduloId: 0, accionesIds: [] });
    setIsModalOpen(true);
  };

  const handleEdit = (formulario: Formulario) => {
    setEditingFormulario(formulario);
    setViewingFormulario(null);
    setFormData({
      nombre: formulario.nombre,
      moduloId: formulario.modulo?.id || 0,
      accionesIds: formulario.acciones?.map((a) => a.id) || [],
    });
    setIsModalOpen(true);
    setIsViewModalOpen(false);
  };

  const handleView = async (formulario: Formulario) => {
    try {
      // Fetch full details with acciones
      const fullFormulario = await formulariosApi.getById(formulario.id);
      setViewingFormulario(fullFormulario);
      setEditingFormulario(null);
      setIsViewModalOpen(true);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error loading formulario details:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const accionesIds = formData.accionesIds ?? [];
      if (editingFormulario) {
        await formulariosApi.update(editingFormulario.id, {
          nombre: formData.nombre,
          moduloId: formData.moduloId,
          accionesIds,
        });
      } else {
        await formulariosApi.create({
          nombre: formData.nombre,
          moduloId: formData.moduloId,
          ...(accionesIds.length > 0 && { accionesIds }),
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error("Error saving formulario:", error);
    }
  };

  // ---------- Organización de la lista de acciones (solo visual) ----------
  // Una acción pertenece a un módulo a través de los formularios de ese módulo.
  const moduloSeleccionado = modulos.find((m) => m.id === formData.moduloId);

  const idsAccionesDelModulo = new Set<number>(
    formularios
      .filter((f) => f.modulo?.id === formData.moduloId)
      .flatMap((f) => (f.acciones || []).map((a) => a.id)),
  );

  const textoBusqueda = busquedaAccion.trim().toLowerCase();
  const accionesFiltradas = acciones
    .filter((a) => a.nombre.toLowerCase().includes(textoBusqueda))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const accionesDelModulo = accionesFiltradas.filter((a) =>
    idsAccionesDelModulo.has(a.id),
  );
  const otrasAcciones = accionesFiltradas.filter(
    (a) => !idsAccionesDelModulo.has(a.id),
  );

  const cantidadMarcadas = (formData.accionesIds ?? []).length;

  const renderAccion = (accion: Accion) => (
    <li key={accion.id}>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={(formData.accionesIds ?? []).includes(accion.id)}
          onChange={() => toggleAccion(accion.id)}
          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
        />
        <span className="text-sm text-gray-800">{accion.nombre}</span>
      </label>
    </li>
  );

  const tituloBloque = (texto: string, cantidad: number) => (
    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
      {texto} ({cantidad})
    </p>
  );

  const toggleAccion = (accionId: number) => {
    const current = formData.accionesIds ?? [];
    if (current.includes(accionId)) {
      setFormData({
        ...formData,
        accionesIds: current.filter((id) => id !== accionId),
      });
    } else {
      setFormData({
        ...formData,
        accionesIds: [...current, accionId],
      });
    }
  };

  const handleDeleteClick = (formulario: Formulario) => {
    setDeletingFormulario(formulario);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingFormulario) return;
    try {
      await formulariosApi.delete(deletingFormulario.id);
      setIsDeleteModalOpen(false);
      setDeletingFormulario(null);
      loadData();
    } catch (error) {
      console.error("Error deleting formulario:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Formularios</h1>
          <p className="mt-2 text-sm text-gray-600">Gestionar formularios</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={!hasAccessToAccion("Formularios.Crear Formulario")}
          className={`px-4 py-2 rounded-md ${
            hasAccessToAccion("Formularios.Crear Formulario")
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          title={
            !hasAccessToAccion("Formularios.Crear Formulario")
              ? "No tienes permisos para crear formularios"
              : "Crear nuevo formulario"
          }
        >
          Nuevo Formulario
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {formularios.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No hay formularios
            </li>
          ) : (
            formularios.map((formulario) => (
              <li key={formulario.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {formulario.nombre}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Módulo: {formulario.modulo?.nombre || "N/A"}
                    </p>
                    {formulario.acciones && (
                      <p className="text-sm text-gray-500">
                        {formulario.acciones.length} acción(es)
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleView(formulario)}
                      disabled={
                        !hasAccessToAccion("Formularios.Ver Formularios")
                      }
                      className={`${
                        hasAccessToAccion("Formularios.Ver Formularios")
                          ? "text-green-600 hover:text-green-800"
                          : "text-gray-300 cursor-not-allowed"
                      }`}
                      title={
                        !hasAccessToAccion("Formularios.Ver Formularios")
                          ? "No tienes permisos para ver formularios"
                          : "Ver"
                      }
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => handleEdit(formulario)}
                      disabled={
                        !hasAccessToAccion("Formularios.Editar Formulario")
                      }
                      className={`${
                        hasAccessToAccion("Formularios.Editar Formulario")
                          ? "text-blue-600 hover:text-blue-800"
                          : "text-gray-300 cursor-not-allowed"
                      }`}
                      title={
                        !hasAccessToAccion("Formularios.Editar Formulario")
                          ? "No tienes permisos para editar formularios"
                          : "Editar"
                      }
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(formulario)}
                      disabled={
                        !hasAccessToAccion("Formularios.Eliminar Formulario")
                      }
                      className={`${
                        hasAccessToAccion("Formularios.Eliminar Formulario")
                          ? "text-red-600 hover:text-red-800"
                          : "text-gray-300 cursor-not-allowed"
                      }`}
                      title={
                        !hasAccessToAccion("Formularios.Eliminar Formulario")
                          ? "No tienes permisos para eliminar formularios"
                          : "Eliminar"
                      }
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFormulario ? "Editar Formulario" : "Nuevo Formulario"}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="nombre"
              className="block text-sm font-medium text-gray-700"
            >
              Nombre
            </label>
            <input
              type="text"
              id="nombre"
              required
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="moduloId"
              className="block text-sm font-medium text-gray-700"
            >
              Módulo
            </label>
            <select
              id="moduloId"
              required
              value={formData.moduloId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  moduloId: parseInt(e.target.value),
                })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value={0}>Seleccione un módulo</option>
              {modulos.map((modulo) => (
                <option key={modulo.id} value={modulo.id}>
                  {modulo.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Acciones asignadas
              </label>
              <span className="text-xs text-gray-500">
                {cantidadMarcadas} marcada{cantidadMarcadas !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Marca las acciones que pertenecen a este formulario.
            </p>
            <input
              type="text"
              value={busquedaAccion}
              onChange={(e) => setBusquedaAccion(e.target.value)}
              placeholder="Buscar acción..."
              className="mb-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
            <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md p-2">
              {acciones.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No hay acciones disponibles
                </p>
              ) : accionesFiltradas.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Ninguna acción coincide con "{busquedaAccion}"
                </p>
              ) : !moduloSeleccionado ? (
                <>
                  {tituloBloque("Todas las acciones", accionesFiltradas.length)}
                  <ul className="space-y-1">
                    {accionesFiltradas.map(renderAccion)}
                  </ul>
                </>
              ) : (
                <>
                  {accionesDelModulo.length > 0 && (
                    <div className="mb-3">
                      {tituloBloque(
                        `Acciones del módulo ${moduloSeleccionado.nombre}`,
                        accionesDelModulo.length,
                      )}
                      <ul className="space-y-1">
                        {accionesDelModulo.map(renderAccion)}
                      </ul>
                    </div>
                  )}
                  {otrasAcciones.length > 0 && (
                    <div
                      className={
                        accionesDelModulo.length > 0
                          ? "pt-3 border-t border-gray-200"
                          : ""
                      }
                    >
                      {tituloBloque("Otras acciones", otrasAcciones.length)}
                      <ul className="space-y-1">
                        {otrasAcciones.map(renderAccion)}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {editingFormulario ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Formulario"
      >
        {viewingFormulario && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <p className="text-gray-900 font-medium">
                {viewingFormulario.nombre}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Módulo
              </label>
              <p className="text-gray-900">
                {viewingFormulario.modulo?.nombre || "N/A"}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Acciones ({viewingFormulario.acciones?.length || 0})
              </label>
              {viewingFormulario.acciones &&
              viewingFormulario.acciones.length > 0 ? (
                <div className="border border-gray-300 rounded-md p-3 max-h-64 overflow-y-auto">
                  <ul className="space-y-2">
                    {viewingFormulario.acciones.map((accion) => (
                      <li key={accion.id} className="text-sm text-gray-700">
                        • {accion.nombre}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No hay acciones asociadas
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingFormulario(null);
        }}
        title="Eliminar Formulario"
      >
        {deletingFormulario && (
          <div>
            <p className="mb-4 text-gray-700">
              ¿Está seguro de eliminar el formulario{" "}
              <strong>{deletingFormulario.nombre}</strong>?
            </p>
            {deletingFormulario.acciones &&
              deletingFormulario.acciones.length > 0 && (
                <p className="mb-4 text-sm text-red-600">
                  Advertencia: Este formulario tiene{" "}
                  {deletingFormulario.acciones.length} acción(es) asociada(s).
                </p>
              )}
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingFormulario(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FormulariosPage;