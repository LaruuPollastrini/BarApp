import { useState, useEffect } from "react";
import { reservasApi } from "../services/api";
import type { Reserva } from "../types";
import {
  formatearFechaTurno,
  formatearHorario,
  formatearFechaHora,
  getEstadoReservaColor,
} from "../utils/reservas";

interface DetalleReservaModalProps {
  idReserva: number | null;
  onClose: () => void;
}

/**
 * Detalle de una reserva para el personal del bar:
 * datos del cliente, turno, estado e historial completo de cambios (trazabilidad).
 */
const DetalleReservaModal: React.FC<DetalleReservaModalProps> = ({
  idReserva,
  onClose,
}) => {
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (idReserva === null) {
      setReserva(null);
      return;
    }
    const cargar = async () => {
      try {
        setLoading(true);
        setError("");
        setReserva(await reservasApi.getById(idReserva));
      } catch (err: any) {
        console.error("Error loading reserva:", err);
        setError(err.response?.data?.message || "Error al cargar la reserva");
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [idReserva]);

  if (idReserva === null) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full bg-white rounded-lg shadow-xl z-50 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Reserva #{idReserva}
          </h2>
          <button
            onClick={onClose}
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
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!loading && reserva && (
            <>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                {reserva.turno && (
                  <p className="font-semibold text-gray-900">
                    {formatearFechaTurno(reserva.turno.fecha)} —{" "}
                    {formatearHorario(reserva.turno.horario)} hs
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  {reserva.cantidadPersonas} persona
                  {reserva.cantidadPersonas !== 1 ? "s" : ""} · Solicitada el{" "}
                  {formatearFechaHora(reserva.fechaSolicitud)}
                </p>
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getEstadoReservaColor(
                    reserva.estado,
                  )}`}
                >
                  {reserva.estado}
                </span>
              </div>

              {reserva.cliente && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Cliente
                  </h3>
                  <div className="text-sm text-gray-600 space-y-0.5">
                    <p className="font-medium text-gray-900">
                      {reserva.cliente.nombre} {reserva.cliente.apellido}
                    </p>
                    <p>{reserva.cliente.correo}</p>
                    <p>{reserva.cliente.telefono}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Historial de la reserva
                </h3>
                <ul className="space-y-3">
                  {(reserva.historial || []).map((h, i) => (
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
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </>
  );
};

export default DetalleReservaModal;