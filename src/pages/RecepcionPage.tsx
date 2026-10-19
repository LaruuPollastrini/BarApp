import { useState, useEffect } from "react";
import { reservasApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { Reserva } from "../types";
import DetalleReservaModal from "../components/DetalleReservaModal";
import {
  formatearFechaTurno,
  formatearHorario,
  getEstadoReservaColor,
  hoyISO,
} from "../utils/reservas";

/**
 * Recepción: reservas aceptadas del día. Cuando el cliente llega,
 * se registra su llegada (la reserva pasa a "Cerrada").
 */
const RecepcionPage = () => {
  const { hasAccessToAccion } = useAuth();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [fecha, setFecha] = useState(hoyISO());
  const [detalleId, setDetalleId] = useState<number | null>(null);

  const puedeCerrar = hasAccessToAccion("Recibir Reservas.Cerrar Reserva");

  useEffect(() => {
    loadReservas();
  }, [fecha]);

  const loadReservas = async () => {
    try {
      setLoading(true);
      const data = await reservasApi.getDelDia(fecha || undefined);
      setReservas(data || []);
    } catch (err: any) {
      console.error("Error loading reservas del dia:", err);
      setError(err.response?.data?.message || "Error al cargar las reservas");
    } finally {
      setLoading(false);
    }
  };

  const registrarLlegada = async (reserva: Reserva) => {
    try {
      setSaving(true);
      setError("");
      await reservasApi.cerrar(reserva.idReserva);
      setSuccessMessage(
        `Llegada registrada: ${
          reserva.cliente
            ? `${reserva.cliente.nombre} ${reserva.cliente.apellido}`
            : `reserva #${reserva.idReserva}`
        }`,
      );
      setTimeout(() => setSuccessMessage(""), 3000);
      await loadReservas();
    } catch (err: any) {
      console.error("Error closing reserva:", err);
      setError(err.response?.data?.message || "Error al registrar la llegada");
    } finally {
      setSaving(false);
    }
  };

  const esperadas = reservas.filter((r) => r.estado === "Aceptada");
  const llegaron = reservas.filter((r) => r.estado === "Cerrada");
  const personasEsperadas = esperadas.reduce(
    (total, r) => total + r.cantidadPersonas,
    0,
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recepción del Día</h1>
          <p className="text-gray-600 mt-1">
            {fecha ? formatearFechaTurno(fecha) : ""}
          </p>
        </div>
        <div className="self-start sm:self-auto">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Por llegar</p>
          <p className="text-2xl font-bold text-gray-900">{esperadas.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Personas esperadas</p>
          <p className="text-2xl font-bold text-gray-900">{personasEsperadas}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Ya llegaron</p>
          <p className="text-2xl font-bold text-green-600">{llegaron.length}</p>
        </div>
      </div>

      {/* Tabla */}
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-500">No hay reservas aceptadas para este día</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Personas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reservas.map((reserva) => (
                <tr key={reserva.idReserva}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {reserva.turno ? `${formatearHorario(reserva.turno.horario)} hs` : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reserva.cliente
                      ? `${reserva.cliente.nombre} ${reserva.cliente.apellido}`
                      : "-"}
                    {reserva.cliente?.telefono && (
                      <p className="text-xs text-gray-500">
                        {reserva.cliente.telefono}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reserva.cantidadPersonas}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full border ${getEstadoReservaColor(
                        reserva.estado,
                      )}`}
                    >
                      {reserva.estado === "Cerrada" ? "Llegó" : "Esperando"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      {reserva.estado === "Aceptada" && (
                        <button
                          onClick={() => registrarLlegada(reserva)}
                          disabled={saving || !puedeCerrar}
                          className={`px-3 py-1.5 text-white text-sm rounded-md disabled:opacity-50 ${
                            puedeCerrar
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-gray-400 cursor-not-allowed"
                          }`}
                          title={
                            puedeCerrar
                              ? "El cliente llegó: cerrar la reserva"
                              : "No tienes permisos para cerrar reservas"
                          }
                        >
                          Registrar llegada
                        </button>
                      )}
                      <button
                        onClick={() => setDetalleId(reserva.idReserva)}
                        className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        Ver detalle
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DetalleReservaModal
        idReserva={detalleId}
        onClose={() => setDetalleId(null)}
      />
    </div>
  );
};

export default RecepcionPage;