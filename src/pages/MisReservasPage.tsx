import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { reservasApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { Reserva } from "../types";
import {
  formatearFechaTurno,
  formatearHorario,
  formatearFechaHora,
  getEstadoReservaColor,
} from "../utils/reservas";

/** Explicación del estado pensada para el cliente */
const MENSAJE_ESTADO: Record<string, string> = {
  Pendiente: "Esperando la confirmación del bar",
  Aceptada: "¡Confirmada! Te esperamos",
  Rechazada: "El bar no pudo aceptar esta reserva",
  Cancelada: "Reserva cancelada",
  Cerrada: "¡Gracias por venir!",
};

const MisReservasPage = () => {
  const { hasAccessToAccion } = useAuth();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState<Reserva | null>(null);
  const [detalle, setDetalle] = useState<Reserva | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const puedeCancelar = hasAccessToAccion("Realizar Reserva.Cancelar Mi Reserva");

  useEffect(() => {
    loadReservas();
  }, []);

  const loadReservas = async () => {
    try {
      setLoading(true);
      const data = await reservasApi.getMias();
      setReservas(data || []);
    } catch (err: any) {
      console.error("Error loading reservas:", err);
      setError("Error al cargar tus reservas");
    } finally {
      setLoading(false);
    }
  };

  // Próximas: las que todavía se pueden cancelar (pendientes o aceptadas de turnos futuros)
  const proximas = reservas.filter((r) => r.puedeCancelar);
  const historial = reservas.filter((r) => !r.puedeCancelar);

  const handleCancelar = async (reserva: Reserva) => {
    try {
      setSaving(true);
      setError("");
      await reservasApi.cancelar(reserva.idReserva);
      setSuccessMessage("Reserva cancelada correctamente");
      setTimeout(() => setSuccessMessage(""), 3000);
      setCancelConfirm(null);
      await loadReservas();
    } catch (err: any) {
      console.error("Error canceling reserva:", err);
      setError(err.response?.data?.message || "Error al cancelar la reserva");
      setCancelConfirm(null);
    } finally {
      setSaving(false);
    }
  };

  const verDetalle = async (reserva: Reserva) => {
    try {
      setLoadingDetalle(true);
      setDetalle(reserva);
      const data = await reservasApi.getById(reserva.idReserva);
      setDetalle(data);
    } catch (err: any) {
      console.error("Error loading detalle:", err);
      setError("Error al cargar el detalle de la reserva");
      setDetalle(null);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const renderReserva = (reserva: Reserva) => (
    <div
      key={reserva.idReserva}
      className="bg-white rounded-lg shadow border overflow-hidden"
    >
      <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="font-semibold text-gray-900">
              {reserva.turno
                ? `${formatearFechaTurno(reserva.turno.fecha)} — ${formatearHorario(
                    reserva.turno.horario,
                  )} hs`
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
          <button
            onClick={() => verDetalle(reserva)}
            className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Ver detalle
          </button>
          {reserva.puedeCancelar && (
            <button
              onClick={() => setCancelConfirm(reserva)}
              disabled={saving || !puedeCancelar}
              className={`px-3 py-1.5 text-white text-sm rounded-md disabled:opacity-50 ${
                puedeCancelar
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              title={
                puedeCancelar
                  ? "Cancelar reserva"
                  : "No tienes permisos para cancelar reservas"
              }
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
      <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-gray-700">
          <span className="font-medium">{reserva.cantidadPersonas}</span>{" "}
          persona{reserva.cantidadPersonas !== 1 ? "s" : ""}
        </p>
        <p className="text-sm text-gray-500">
          {MENSAJE_ESTADO[reserva.estado] ?? ""}
        </p>
      </div>
    </div>
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Mis Reservas</h1>
          <p className="text-gray-600 mt-1">
            {reservas.length} reserva{reservas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          to="/reservar"
          className="px-4 py-2 rounded-md flex items-center gap-2 self-start sm:self-auto bg-blue-600 text-white hover:bg-blue-700"
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
          Nueva Reserva
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
        </div>
      )}

      {reservas.length === 0 ? (
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
          <p className="text-gray-500">Todavía no has hecho ninguna reserva</p>
          <Link
            to="/reservar"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800 underline"
          >
            Hacer mi primera reserva
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Próximas
            </h2>
            {proximas.length === 0 ? (
              <p className="text-gray-500 bg-white rounded-lg shadow p-4">
                No tienes reservas próximas
              </p>
            ) : (
              <div className="space-y-4">{proximas.map(renderReserva)}</div>
            )}
          </div>

          {historial.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Historial
              </h2>
              <div className="space-y-4">{historial.map(renderReserva)}</div>
            </div>
          )}
        </>
      )}

      {/* Confirmación de cancelación */}
      {cancelConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setCancelConfirm(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cancelar Reserva
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas cancelar tu reserva del{" "}
              <strong>
                {cancelConfirm.turno
                  ? `${formatearFechaTurno(
                      cancelConfirm.turno.fecha,
                    ).toLowerCase()} a las ${formatearHorario(
                      cancelConfirm.turno.horario,
                    )}`
                  : `#${cancelConfirm.idReserva}`}
              </strong>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCancelConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Volver
              </button>
              <button
                onClick={() => handleCancelar(cancelConfirm)}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "Cancelando..." : "Cancelar reserva"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Detalle con historial de estados */}
      {detalle && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setDetalle(null)}
          />
          <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full bg-white rounded-lg shadow-xl z-50 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Reserva #{detalle.idReserva}
              </h2>
              <button
                onClick={() => setDetalle(null)}
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

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                {detalle.turno && (
                  <p className="font-semibold text-gray-900">
                    {formatearFechaTurno(detalle.turno.fecha)} —{" "}
                    {formatearHorario(detalle.turno.horario)} hs
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  {detalle.cantidadPersonas} persona
                  {detalle.cantidadPersonas !== 1 ? "s" : ""}
                </p>
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getEstadoReservaColor(
                    detalle.estado,
                  )}`}
                >
                  {detalle.estado}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Historial de la reserva
                </h3>
                {loadingDetalle ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {(detalle.historial || []).map((h, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-900">
                            {h.estadoAnterior
                              ? `${h.estadoAnterior} → ${h.estadoNuevo}`
                              : `Reserva solicitada (${h.estadoNuevo})`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatearFechaHora(h.fecha)}
                            {h.usuario ? ` · ${h.usuario}` : ""}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setDetalle(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MisReservasPage;