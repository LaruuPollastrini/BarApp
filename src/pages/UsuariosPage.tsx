import { useState, useEffect } from "react";
import { usuariosApi, gruposApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { User, CreateUserDto, UpdateUserDto, Grupo } from "../types";
import Modal from "../components/Modal";

const isUserAdmin = (user: User) =>
  user.grupos?.some((g) => g.nombre?.trim().toLowerCase() === "admin") ?? false;

const getAdminGrupoId = (grupos: Grupo[]) =>
  grupos.find((g) => g.nombre?.trim().toLowerCase() === "admin")?.id;

const UsuariosPage = () => {
  const {
    user: currentUser,
    refreshPermissions,
    hasAccessToAccion,
  } = useAuth();
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<User | null>(null);
  const [viewingUsuario, setViewingUsuario] = useState<User | null>(null);
  const [deletingUsuario, setDeletingUsuario] = useState<User | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState<CreateUserDto>({
    nombre: "",
    apellido: "",
    correo: "",
    contrasena: "",
    telefono: "",
    estaActivo: true,
    gruposIds: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usuariosData, gruposData] = await Promise.all([
        usuariosApi.getAll(),
        gruposApi.getAll(),
      ]);
      setUsuarios(usuariosData || []);
      setGrupos(gruposData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUsuario(null);
    setFormData({
      nombre: "",
      apellido: "",
      correo: "",
      contrasena: "",
      telefono: "",
      estaActivo: true,
      gruposIds: [],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (usuario: User) => {
    setEditingUsuario(usuario);
    setFormData({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      contrasena: "",
      telefono: usuario.telefono,
      estaActivo: usuario.estaActivo,
      gruposIds: usuario.grupos?.map((g) => g.id) || [],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    try {
      if (editingUsuario) {
        const updateData: UpdateUserDto = {
          nombre: formData.nombre,
          apellido: formData.apellido,
          correo: formData.correo,
          telefono: formData.telefono,
          estaActivo: formData.estaActivo,
          gruposIds: formData.gruposIds,
        };
        const updatedUser = await usuariosApi.update(
          editingUsuario.id,
          updateData,
        );

        // Si actualizamos al usuario logueado, recargar permisos y acciones
        if (currentUser && editingUsuario.id === currentUser.id) {
          await refreshPermissions();
          setSuccessMessage(
            "Usuario actualizado. Tus permisos y acciones se han recargado.",
          );
        } else {
          setSuccessMessage("Usuario actualizado correctamente.");
        }
      } else {
        await usuariosApi.create(formData);
        setSuccessMessage("Usuario creado correctamente.");
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error("Error saving usuario:", error);
      setError("Error al guardar el usuario. Por favor, intenta nuevamente.");
    }
  };

  const handleDeleteClick = (usuario: User) => {
    setDeletingUsuario(usuario);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUsuario) return;
    try {
      await usuariosApi.delete(deletingUsuario.id);
      setIsDeleteModalOpen(false);
      setDeletingUsuario(null);
      loadData();
    } catch (error) {
      console.error("Error deleting usuario:", error);
    }
  };

  const toggleGrupo = (grupoId: number) => {
    const adminId = getAdminGrupoId(grupos);
    if (adminId !== undefined && grupoId === adminId) return; // Admin no se puede asignar
    const currentIds = formData.gruposIds || [];
    if (currentIds.includes(grupoId)) {
      setFormData({
        ...formData,
        gruposIds: currentIds.filter((id) => id !== grupoId),
      });
    } else {
      setFormData({
        ...formData,
        gruposIds: [...currentIds, grupoId],
      });
    }
  };

  const canDelete = (usuario: User) => !isUserAdmin(usuario);

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestionar usuarios del sistema
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={!hasAccessToAccion("Usuarios.Crear Usuario")}
          className={`px-4 py-2 rounded-md ${
            hasAccessToAccion("Usuarios.Crear Usuario")
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          title={
            !hasAccessToAccion("Usuarios.Crear Usuario")
              ? "No tienes permisos para crear usuarios"
              : "Crear nuevo usuario"
          }
        >
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {usuarios.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No hay usuarios
            </li>
          ) : (
            usuarios.map((usuario) => (
              <li key={usuario.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {usuario.nombre} {usuario.apellido}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          usuario.estaActivo
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {usuario.estaActivo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{usuario.correo}</p>
                    <p className="text-sm text-gray-500">{usuario.telefono}</p>
                    {usuario.grupos && (
                      <p className="text-sm text-gray-500 mt-1">
                        {usuario.grupos.length} grupo(s)
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setViewingUsuario(usuario);
                        setIsViewModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                      title="Ver"
                    >
                      Ver
                    </button>
                    {!isUserAdmin(usuario) && (
                      <>
                        <button
                          onClick={() => handleEdit(usuario)}
                          disabled={
                            !hasAccessToAccion("Usuarios.Editar Usuario")
                          }
                          className={`${
                            hasAccessToAccion("Usuarios.Editar Usuario")
                              ? "text-blue-600 hover:text-blue-800"
                              : "text-gray-300 cursor-not-allowed"
                          }`}
                          title={
                            !hasAccessToAccion("Usuarios.Editar Usuario")
                              ? "No tienes permisos para editar usuarios"
                              : "Editar"
                          }
                        >
                          Editar
                        </button>
                        {canDelete(usuario) && (
                          <button
                            onClick={() => handleDeleteClick(usuario)}
                            disabled={
                              !hasAccessToAccion("Usuarios.Eliminar Usuario")
                            }
                            className={`${
                              hasAccessToAccion("Usuarios.Eliminar Usuario")
                                ? "text-red-600 hover:text-red-800"
                                : "text-gray-300 cursor-not-allowed"
                            }`}
                            title={
                              !hasAccessToAccion("Usuarios.Eliminar Usuario")
                                ? "No tienes permisos para eliminar usuarios"
                                : "Eliminar"
                            }
                          >
                            Eliminar
                          </button>
                        )}
                      </>
                    )}
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
        title={editingUsuario ? "Editar Usuario" : "Nuevo Usuario"}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="Nombre"
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="Apellido"
              className="block text-sm font-medium text-gray-700"
            >
              Apellido
            </label>
            <input
              type="text"
              id="apellido"
              required
              value={formData.apellido}
              onChange={(e) =>
                setFormData({ ...formData, apellido: e.target.value })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="Correo"
              className="block text-sm font-medium text-gray-700"
            >
              Correo
            </label>
            <input
              type="email"
              id="correo"
              required
              value={formData.correo}
              onChange={(e) =>
                setFormData({ ...formData, correo: e.target.value })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          {!editingUsuario && (
            <div className="mb-4">
              <label
                htmlFor="Contrasena"
                className="block text-sm font-medium text-gray-700"
              >
                Contraseña
              </label>
              <input
                type="password"
                id="contrasena"
                required={!editingUsuario}
                value={formData.contrasena}
                onChange={(e) =>
                  setFormData({ ...formData, contrasena: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
            </div>
          )}
          <div className="mb-4">
            <label
              htmlFor="Telefono"
              className="block text-sm font-medium text-gray-700"
            >
              Teléfono
            </label>
            <input
              type="tel"
              id="telefono"
              required
              value={formData.telefono}
              onChange={(e) =>
                setFormData({ ...formData, telefono: e.target.value })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.estaActivo}
                onChange={(e) =>
                  setFormData({ ...formData, estaActivo: e.target.checked })
                }
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="ml-2 text-sm text-gray-700">Activo</span>
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grupos
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2">
              {grupos.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No hay grupos disponibles
                </p>
              ) : (
                grupos.map((grupo) => {
                  const isAdmin =
                    grupo.nombre?.trim().toLowerCase() === "admin";
                  const isChecked =
                    formData.gruposIds?.includes(grupo.id) || false;
                  return (
                    <label
                      key={grupo.id}
                      className={`flex items-center py-1 ${
                        isAdmin ? "opacity-60" : ""
                      }`}
                      title={
                        isAdmin
                          ? "El grupo Admin no se puede asignar (usuario root único)"
                          : undefined
                      }
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleGrupo(grupo.id)}
                        disabled={isAdmin}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:cursor-not-allowed"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {grupo.nombre}
                      </span>
                    </label>
                  );
                })
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
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              {editingUsuario ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingUsuario(null);
        }}
        title="Ver Usuario"
      >
        {viewingUsuario && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Nombre
              </label>
              <p className="mt-1 text-gray-900">
                {viewingUsuario.nombre} {viewingUsuario.apellido}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Correo
              </label>
              <p className="mt-1 text-gray-900">{viewingUsuario.correo}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Teléfono
              </label>
              <p className="mt-1 text-gray-900">{viewingUsuario.telefono}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Estado
              </label>
              <p className="mt-1">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    viewingUsuario.estaActivo
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {viewingUsuario.estaActivo ? "Activo" : "Inactivo"}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Grupos
              </label>
              <p className="mt-1 text-gray-900">
                {viewingUsuario.grupos?.length
                  ? viewingUsuario.grupos.map((g) => g.nombre).join(", ")
                  : "Sin grupos"}
              </p>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingUsuario(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
          setDeletingUsuario(null);
        }}
        title="Eliminar Usuario"
      >
        {deletingUsuario && (
          <div>
            <p className="mb-4 text-gray-700">
              ¿Está seguro de eliminar al usuario{" "}
              <strong>
                {deletingUsuario.nombre} {deletingUsuario.apellido}
              </strong>
              ?
            </p>
            {deletingUsuario.grupos && deletingUsuario.grupos.length > 0 && (
              <p className="mb-4 text-sm text-red-600">
                Advertencia: Este usuario pertenece a{" "}
                {deletingUsuario.grupos.length} grupo(s).
              </p>
            )}
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingUsuario(null);
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

export default UsuariosPage;
