import { useState, useEffect } from "react";
import { reservasApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { Reserva } from "../types";
import DetalleReservaModal from "../components/DetalleReservaModal";
import {
  formatearFechaTurno,
  formatearHorario,
  formatearFechaHora,
  getEstadoReservaColor,
  hoyISO,
} from "../utils/reservas";

const ESTADOS = ["Pendiente", "Aceptada", "Rechazada", "Cancelada", "Cerrada"];

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

const GestionReservasPage = () => {
  const { hasAccessToAccion } = useAuth();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [detalleId, setDetalleId] = useState<number | null>(null);

  // Filtros: por defecto, las pendientes desde hoy (lo que hay que resolver)
  const [estado, setEstado] = useState("Pendiente");
  const [desde, setDesde] = useState(hoyISO());
  const [hasta, setHasta] = useState("");

  const puedeAceptar = hasAccessToAccion("Gestionar Reservas.Aceptar Reserva");
  const puedeRechazar = hasAccessToAccion("Gestionar Reservas.Rechazar Reserva");

  useEffect(() => {
    loadReservas();
  }, [estado, desde, hasta]);

  const loadReservas = async () => {
    try {
      setLoading(true);
      const data = await reservasApi.getAll({
        estado: estado || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
      });
      setReservas(data || []);
    } catch (err: any) {
      console.error("Error loading reservas:", err);
      setError(err.response?.data?.message || "Error al cargar las reservas");
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (
    reserva: Reserva,
    accion: "aceptar" | "rechazar",
  ) => {
    try {
      setSaving(true);
      setError("");
      if (accion === "aceptar") {
        await reservasApi.aceptar(reserva.idReserva);
      } else {
        await reservasApi.rechazar(reserva.idReserva);
      }
      setSuccessMessage(
        `Reserva #${reserva.idReserva} ${
          accion === "aceptar" ? "aceptada" : "rechazada"
        } correctamente`,
      );
      setTimeout(() => setSuccessMessage(""), 3000);
      await loadReservas();
    } catch (err: any) {
      console.error("Error changing estado:", err);
      setError(err.response?.data?.message || "Error al cambiar el estado");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Reservas</h1>
        <p className="text-gray-600 mt-1">
          {reservas.length} reserva{reservas.length !== 1 ? "s" : ""}
          {estado ? ` en estado ${estado}` : ""}
        </p>
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
      <div className="bg-white rounded-lg shadow p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className={inputClass}
          >
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Turnos desde
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
            Turnos hasta
          </label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : reservas.length === 0 ? (
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-gray-500">No hay reservas con estos filtros</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservas.map((reserva) => (
            <div
              key={reserva.idReserva}
              className="bg-white rounded-lg shadow border overflow-hidden"
            >
              <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {reserva.turno
                        ? `${formatearFechaTurno(
                            reserva.turno.fecha,
                          )} — ${formatearHorario(reserva.turno.horario)} hs`
                        : `Reserva #${reserva.idReserva}`}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Reserva #{reserva.idReserva} · Solicitada el{" "}
                      {formatearFechaHora(reserva.fechaSolicitud)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full border ${getEstadoReservaColor(
                      reserva.estado,
                    )}`}
                  >
                    {reserva.estado}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {reserva.estado === "Pendiente" && (
                    <>
                      <button
                        onClick={() => cambiarEstado(reserva, "aceptar")}
                        disabled={saving || !puedeAceptar}
                        className={`px-3 py-1.5 text-white text-sm rounded-md disabled:opacity-50 ${
                          puedeAceptar
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                        title={
                          puedeAceptar
                            ? "Aceptar reserva"
                            : "No tienes permisos para aceptar reservas"
                        }
                      >
                        Aceptar
                      </button>
                      <button
                        onClick={() => cambiarEstado(reserva, "rechazar")}
                        disabled={saving || !puedeRechazar}
                        className={`px-3 py-1.5 text-white text-sm rounded-md disabled:opacity-50 ${
                          puedeRechazar
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                        title={
                          puedeRechazar
                            ? "Rechazar reserva"
                            : "No tienes permisos para rechazar reservas"
                        }
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setDetalleId(reserva.idReserva)}
                    className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Ver detalle
                  </button>
                </div>
              </div>
              <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                <p className="text-gray-900">
                  {reserva.cliente
                    ? `${reserva.cliente.nombre} ${reserva.cliente.apellido}`
                    : "Cliente"}
                  {reserva.cliente?.telefono && (
                    <span className="text-gray-500">
                      {" "}
                      · {reserva.cliente.telefono}
                    </span>
                  )}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">{reserva.cantidadPersonas}</span>{" "}
                  persona{reserva.cantidadPersonas !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <DetalleReservaModal
        idReserva={detalleId}
        onClose={() => setDetalleId(null)}
      />
    </div>
  );
};

export default GestionReservasPage;