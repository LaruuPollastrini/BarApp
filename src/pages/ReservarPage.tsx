import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { agendaApi, reservasApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { TurnoAgenda } from "../types";
import { formatearFechaTurno, formatearHorario } from "../utils/reservas";

const ReservarPage = () => {
  const { hasAccessToAccion } = useAuth();
  const [turnos, setTurnos] = useState<TurnoAgenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [turnoSeleccionado, setTurnoSeleccionado] =
    useState<TurnoAgenda | null>(null);
  const [cantidadPersonas, setCantidadPersonas] = useState("2");
  const [saving, setSaving] = useState(false);

  const puedeReservar = hasAccessToAccion("Realizar Reserva.Crear Reserva");

  useEffect(() => {
    loadTurnos();
  }, []);

  const loadTurnos = async () => {
    try {
      setLoading(true);
      const data = await agendaApi.getDisponibles();
      setTurnos(data || []);
    } catch (err: any) {
      console.error("Error loading turnos:", err);
      setError("Error al cargar los turnos disponibles");
    } finally {
      setLoading(false);
    }
  };

  // Agrupar los turnos por fecha (vienen ordenados por fecha y horario)
  const turnosPorFecha = turnos.reduce<Record<string, TurnoAgenda[]>>(
    (grupos, turno) => {
      (grupos[turno.fecha] = grupos[turno.fecha] || []).push(turno);
      return grupos;
    },
    {},
  );

  const abrirReserva = (turno: TurnoAgenda) => {
    setTurnoSeleccionado(turno);
    setCantidadPersonas(String(Math.min(2, turno.cupoDisponible)));
    setError("");
  };

  const cerrarModal = () => {
    setTurnoSeleccionado(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnoSeleccionado) return;

    const cantidad = Number(cantidadPersonas);
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      setError("Ingresa una cantidad de personas válida");
      return;
    }
    if (cantidad > turnoSeleccionado.cupoDisponible) {
      setError(
        `Solo quedan ${turnoSeleccionado.cupoDisponible} lugares para este turno`,
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      await reservasApi.create({
        agendaId: turnoSeleccionado.idAgenda,
        cantidadPersonas: cantidad,
      });
      setSuccessMessage(
        `¡Reserva solicitada para el ${formatearFechaTurno(
          turnoSeleccionado.fecha,
        ).toLowerCase()} a las ${formatearHorario(
          turnoSeleccionado.horario,
        )}! Queda pendiente hasta que el bar la confirme.`,
      );
      cerrarModal();
      await loadTurnos();
    } catch (err: any) {
      console.error("Error creating reserva:", err);
      setError(err.response?.data?.message || "Error al solicitar la reserva");
      cerrarModal();
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
          <h1 className="text-2xl font-bold text-gray-900">Reservar una Mesa</h1>
          <p className="text-gray-600 mt-1">
            Elige un turno disponible y la cantidad de personas
          </p>
        </div>
        <Link
          to="/mis-reservas"
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 self-start sm:self-auto"
        >
          Ver mis reservas
        </Link>
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
          <Link
            to="/mis-reservas"
            className="text-green-700 underline text-sm mt-1 inline-block"
          >
            Ver mis reservas
          </Link>
        </div>
      )}

      {/* Turnos */}
      {turnos.length === 0 ? (
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
          <p className="text-gray-500">
            No hay turnos disponibles por el momento
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(turnosPorFecha).map(([fecha, turnosDelDia]) => (
            <div key={fecha} className="bg-white rounded-lg shadow border p-4">
              <h2 className="font-semibold text-gray-900 text-lg mb-3">
                {formatearFechaTurno(fecha)}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {turnosDelDia.map((turno) => (
                  <button
                    key={turno.idAgenda}
                    onClick={() => abrirReserva(turno)}
                    disabled={!puedeReservar}
                    className={`border-2 rounded-lg p-3 text-left transition-colors ${
                      puedeReservar
                        ? "border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                        : "border-gray-200 cursor-not-allowed opacity-60"
                    }`}
                    title={
                      puedeReservar
                        ? "Reservar este turno"
                        : "No tienes permisos para crear reservas"
                    }
                  >
                    <p className="text-xl font-semibold text-gray-900">
                      {formatearHorario(turno.horario)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {turno.cupoDisponible} lugar
                      {turno.cupoDisponible !== 1 ? "es" : ""} disponible
                      {turno.cupoDisponible !== 1 ? "s" : ""}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación */}
      {turnoSeleccionado && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={cerrarModal}
          />
          <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full bg-white rounded-lg shadow-xl z-50 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Confirmar Reserva
              </h2>
              <button
                onClick={cerrarModal}
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

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Turno elegido</p>
                  <p className="font-semibold text-gray-900">
                    {formatearFechaTurno(turnoSeleccionado.fecha)} —{" "}
                    {formatearHorario(turnoSeleccionado.horario)} hs
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad de personas *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={turnoSeleccionado.cupoDisponible}
                    value={cantidadPersonas}
                    onChange={(e) => setCantidadPersonas(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo {turnoSeleccionado.cupoDisponible} para este turno
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Enviando..." : "Solicitar reserva"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ReservarPage;