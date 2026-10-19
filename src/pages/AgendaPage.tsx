import { useState, useEffect } from "react";
import { agendaApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { TurnoAgenda } from "../types";
import {
  formatearFechaTurno,
  formatearHorario,
  hoyISO,
} from "../utils/reservas";

const DIAS_SEMANA = [
  { valor: 1, nombre: "Lun" },
  { valor: 2, nombre: "Mar" },
  { valor: 3, nombre: "Mié" },
  { valor: 4, nombre: "Jue" },
  { valor: 5, nombre: "Vie" },
  { valor: 6, nombre: "Sáb" },
  { valor: 0, nombre: "Dom" },
];

interface TurnoFormData {
  fecha: string;
  horario: string;
  capacidad: string;
}

interface RangoFormData {
  fechaDesde: string;
  fechaHasta: string;
  diasSemana: number[];
  horaInicio: string;
  horaFin: string;
  intervaloMinutos: string;
  capacidad: string;
}

const initialTurno: TurnoFormData = { fecha: "", horario: "", capacidad: "" };

const initialRango: RangoFormData = {
  fechaDesde: "",
  fechaHasta: "",
  diasSemana: [5, 6],
  horaInicio: "20:00",
  horaFin: "23:00",
  intervaloMinutos: "60",
  capacidad: "",
};

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

const AgendaPage = () => {
  const { hasAccessToAccion } = useAuth();
  const [turnos, setTurnos] = useState<TurnoAgenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // Filtros
  const [desde, setDesde] = useState(hoyISO());
  const [hasta, setHasta] = useState("");
  const [mostrarEliminados, setMostrarEliminados] = useState(false);

  // Modales
  const [modalTurno, setModalTurno] = useState(false);
  const [turnoForm, setTurnoForm] = useState<TurnoFormData>(initialTurno);
  const [modalRango, setModalRango] = useState(false);
  const [rangoForm, setRangoForm] = useState<RangoFormData>(initialRango);
  const [editando, setEditando] = useState<TurnoAgenda | null>(null);
  const [nuevaCapacidad, setNuevaCapacidad] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<TurnoAgenda | null>(null);

  const puedeCargar = hasAccessToAccion("Gestionar Agenda.Cargar Disponibilidad");
  const puedeEliminar = hasAccessToAccion(
    "Gestionar Agenda.Eliminar Disponibilidad",
  );

  useEffect(() => {
    loadTurnos();
  }, [desde, hasta]);

  const loadTurnos = async () => {
    try {
      setLoading(true);
      const data = await agendaApi.getAll(desde || undefined, hasta || undefined);
      setTurnos(data || []);
    } catch (err: any) {
      console.error("Error loading agenda:", err);
      setError(err.response?.data?.message || "Error al cargar la agenda");
    } finally {
      setLoading(false);
    }
  };

  const mostrarExito = (mensaje: string) => {
    setSuccessMessage(mensaje);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const turnosVisibles = turnos.filter((t) => mostrarEliminados || t.estaActiva);

  // ---------- Nuevo turno ----------
  const handleCrearTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      await agendaApi.create({
        fecha: turnoForm.fecha,
        horario: turnoForm.horario,
        capacidad: Number(turnoForm.capacidad),
      });
      mostrarExito("Turno publicado correctamente");
      setModalTurno(false);
      setTurnoForm(initialTurno);
      await loadTurnos();
    } catch (err: any) {
      console.error("Error creating turno:", err);
      setError(err.response?.data?.message || "Error al publicar el turno");
    } finally {
      setSaving(false);
    }
  };

  // ---------- Rango de turnos ----------
  const toggleDia = (dia: number) => {
    const dias = rangoForm.diasSemana.includes(dia)
      ? rangoForm.diasSemana.filter((d) => d !== dia)
      : [...rangoForm.diasSemana, dia];
    setRangoForm({ ...rangoForm, diasSemana: dias });
  };

  const handleCrearRango = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rangoForm.diasSemana.length === 0) {
      setError("Selecciona al menos un día de la semana");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const resultado = await agendaApi.createRango({
        fechaDesde: rangoForm.fechaDesde,
        fechaHasta: rangoForm.fechaHasta,
        diasSemana: rangoForm.diasSemana,
        horaInicio: rangoForm.horaInicio,
        horaFin: rangoForm.horaFin,
        intervaloMinutos: Number(rangoForm.intervaloMinutos),
        capacidad: Number(rangoForm.capacidad),
      });
      mostrarExito(
        `Se publicaron ${resultado.creados} turno${
          resultado.creados !== 1 ? "s" : ""
        }` +
          (resultado.omitidos > 0
            ? ` (${resultado.omitidos} ya existía${
                resultado.omitidos !== 1 ? "n" : ""
              } y se omitieron)`
            : ""),
      );
      setModalRango(false);
      setRangoForm(initialRango);
      await loadTurnos();
    } catch (err: any) {
      console.error("Error creating rango:", err);
      setError(err.response?.data?.message || "Error al publicar los turnos");
    } finally {
      setSaving(false);
    }
  };

  // ---------- Capacidad ----------
  const abrirEditar = (turno: TurnoAgenda) => {
    setEditando(turno);
    setNuevaCapacidad(String(turno.capacidad));
  };

  const handleCapacidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    try {
      setSaving(true);
      setError("");
      await agendaApi.updateCapacidad(editando.idAgenda, Number(nuevaCapacidad));
      mostrarExito("Capacidad actualizada correctamente");
      setEditando(null);
      await loadTurnos();
    } catch (err: any) {
      console.error("Error updating capacidad:", err);
      setError(err.response?.data?.message || "Error al cambiar la capacidad");
      setEditando(null);
    } finally {
      setSaving(false);
    }
  };

  // ---------- Eliminar ----------
  const handleDelete = async (turno: TurnoAgenda) => {
    try {
      setSaving(true);
      setError("");
      await agendaApi.delete(turno.idAgenda);
      mostrarExito("Turno eliminado correctamente");
      setDeleteConfirm(null);
      await loadTurnos();
    } catch (err: any) {
      console.error("Error deleting turno:", err);
      setError(err.response?.data?.message || "Error al eliminar el turno");
      setDeleteConfirm(null);
    } finally {
      setSaving(false);
    }
  };

  const colorOcupacion = (porcentaje: number) => {
    if (porcentaje >= 90) return "bg-red-500";
    if (porcentaje >= 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  const botonCerrar = (onClick: () => void) => (
    <button
      onClick={onClick}
      className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Agenda</h1>
          <p className="text-gray-600 mt-1">
            Turnos publicados para que los clientes reserven
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setRangoForm(initialRango);
              setModalRango(true);
            }}
            disabled={!puedeCargar}
            className={`px-4 py-2 rounded-md ${
              puedeCargar
                ? "text-gray-700 bg-gray-100 hover:bg-gray-200"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            title={
              puedeCargar
                ? "Publicar varios turnos de una vez"
                : "No tienes permisos para cargar disponibilidad"
            }
          >
            Cargar Rango
          </button>
          <button
            onClick={() => {
              setTurnoForm(initialTurno);
              setModalTurno(true);
            }}
            disabled={!puedeCargar}
            className={`px-4 py-2 rounded-md flex items-center gap-2 ${
              puedeCargar
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            title={
              puedeCargar
                ? "Publicar un turno"
                : "No tienes permisos para cargar disponibilidad"
            }
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nuevo Turno
          </button>
        </div>
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

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col sm:flex-row sm:items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Desde
          </label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className={inputClass}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 sm:pb-2">
          <input
            type="checkbox"
            checked={mostrarEliminados}
            onChange={(e) => setMostrarEliminados(e.target.checked)}
            className="rounded border-gray-300"
          />
          Mostrar turnos eliminados
        </label>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : turnosVisibles.length === 0 ? (
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-500">No hay turnos en el período elegido</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ocupación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {turnosVisibles.map((turno) => {
                const porcentaje = turno.capacidad
                  ? Math.round((turno.ocupados / turno.capacidad) * 100)
                  : 0;
                return (
                  <tr
                    key={turno.idAgenda}
                    className={turno.estaActiva ? "" : "bg-gray-50 opacity-60"}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatearFechaTurno(turno.fecha)}
                      {!turno.estaActiva && (
                        <span className="ml-2 text-xs text-gray-500">
                          (eliminado)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatearHorario(turno.horario)} hs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {turno.capacidad} personas
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${colorOcupacion(porcentaje)}`}
                            style={{ width: `${Math.min(porcentaje, 100)}%` }}
                          />
                        </div>
                        <span>
                          {turno.ocupados}/{turno.capacidad} ({turno.cupoDisponible}{" "}
                          libres)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {turno.estaActiva && (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => abrirEditar(turno)}
                            disabled={!puedeCargar}
                            className={`p-1.5 rounded transition-colors ${
                              puedeCargar
                                ? "text-blue-600 hover:bg-blue-50"
                                : "text-gray-300 cursor-not-allowed"
                            }`}
                            title={
                              puedeCargar
                                ? "Cambiar capacidad"
                                : "No tienes permisos para editar turnos"
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
                            onClick={() => setDeleteConfirm(turno)}
                            disabled={!puedeEliminar}
                            className={`p-1.5 rounded transition-colors ${
                              puedeEliminar
                                ? "text-red-600 hover:bg-red-50"
                                : "text-gray-300 cursor-not-allowed"
                            }`}
                            title={
                              puedeEliminar
                                ? "Eliminar"
                                : "No tienes permisos para eliminar turnos"
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
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Nuevo turno */}
      {modalTurno && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setModalTurno(false)}
          />
          <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full bg-white rounded-lg shadow-xl z-50 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Nuevo Turno</h2>
              {botonCerrar(() => setModalTurno(false))}
            </div>
            <form onSubmit={handleCrearTurno} className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    min={hoyISO()}
                    value={turnoForm.fecha}
                    onChange={(e) =>
                      setTurnoForm({ ...turnoForm, fecha: e.target.value })
                    }
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horario *
                  </label>
                  <input
                    type="time"
                    value={turnoForm.horario}
                    onChange={(e) =>
                      setTurnoForm({ ...turnoForm, horario: e.target.value })
                    }
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacidad (personas) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={turnoForm.capacidad}
                    onChange={(e) =>
                      setTurnoForm({ ...turnoForm, capacidad: e.target.value })
                    }
                    className={inputClass}
                    placeholder="Ej: 30"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalTurno(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Guardando..." : "Publicar turno"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Modal: Rango */}
      {modalRango && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setModalRango(false)}
          />
          <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full bg-white rounded-lg shadow-xl z-50 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Cargar Rango de Turnos
              </h2>
              {botonCerrar(() => setModalRango(false))}
            </div>
            <form onSubmit={handleCrearRango} className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Desde *
                    </label>
                    <input
                      type="date"
                      min={hoyISO()}
                      value={rangoForm.fechaDesde}
                      onChange={(e) =>
                        setRangoForm({ ...rangoForm, fechaDesde: e.target.value })
                      }
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hasta *
                    </label>
                    <input
                      type="date"
                      min={rangoForm.fechaDesde || hoyISO()}
                      value={rangoForm.fechaHasta}
                      onChange={(e) =>
                        setRangoForm({ ...rangoForm, fechaHasta: e.target.value })
                      }
                      className={inputClass}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Días de la semana *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DIAS_SEMANA.map((dia) => (
                      <button
                        key={dia.valor}
                        type="button"
                        onClick={() => toggleDia(dia.valor)}
                        className={`px-3 py-1 text-sm rounded-full border ${
                          rangoForm.diasSemana.includes(dia.valor)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {dia.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primer turno *
                    </label>
                    <input
                      type="time"
                      value={rangoForm.horaInicio}
                      onChange={(e) =>
                        setRangoForm({ ...rangoForm, horaInicio: e.target.value })
                      }
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Último turno *
                    </label>
                    <input
                      type="time"
                      value={rangoForm.horaFin}
                      onChange={(e) =>
                        setRangoForm({ ...rangoForm, horaFin: e.target.value })
                      }
                      className={inputClass}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cada (minutos) *
                    </label>
                    <input
                      type="number"
                      min={15}
                      step={15}
                      value={rangoForm.intervaloMinutos}
                      onChange={(e) =>
                        setRangoForm({
                          ...rangoForm,
                          intervaloMinutos: e.target.value,
                        })
                      }
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacidad *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={rangoForm.capacidad}
                      onChange={(e) =>
                        setRangoForm({ ...rangoForm, capacidad: e.target.value })
                      }
                      className={inputClass}
                      placeholder="Personas"
                      required
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  Ejemplo: de 20:00 a 23:00 cada 60 minutos genera turnos a las
                  20, 21, 22 y 23 hs. Los turnos que ya existen no se duplican.
                </p>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalRango(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Guardando..." : "Publicar turnos"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Modal: Cambiar capacidad */}
      {editando && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setEditando(null)}
          />
          <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full bg-white rounded-lg shadow-xl z-50 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Cambiar Capacidad
              </h2>
              {botonCerrar(() => setEditando(null))}
            </div>
            <form onSubmit={handleCapacidad} className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-semibold text-gray-900">
                    {formatearFechaTurno(editando.fecha)} —{" "}
                    {formatearHorario(editando.horario)} hs
                  </p>
                  <p className="text-sm text-gray-500">
                    Ya hay {editando.ocupados} persona
                    {editando.ocupados !== 1 ? "s" : ""} con reserva
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva capacidad *
                  </label>
                  <input
                    type="number"
                    min={Math.max(1, editando.ocupados)}
                    max={500}
                    value={nuevaCapacidad}
                    onChange={(e) => setNuevaCapacidad(e.target.value)}
                    className={inputClass}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditando(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Confirmación de eliminación */}
      {deleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Eliminar Turno
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar el turno del{" "}
              <strong>
                {formatearFechaTurno(deleteConfirm.fecha).toLowerCase()} a las{" "}
                {formatearHorario(deleteConfirm.horario)}
              </strong>
              ? Los clientes ya no podrán reservarlo. Si tiene reservas
              pendientes o aceptadas, no se podrá eliminar.
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

export default AgendaPage;