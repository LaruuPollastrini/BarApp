import { useState, useEffect } from "react";
import { reportesReservaApi } from "../../services/api";
import type { ReporteOcupacion } from "../../types";
import {
  formatearFechaISO,
  formatearFechaTurno,
} from "../../utils/reservas";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const inputClass =
  "block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500";

const primerDiaDelMes = () => {
  const hoy = new Date();
  return formatearFechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
};

const ultimoDiaDelMes = () => {
  const hoy = new Date();
  return formatearFechaISO(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
};

/**
 * Reporte: ocupación de los turnos de la agenda.
 * Ayuda a decidir qué días y horarios conviene abrir más turnos.
 */
const ReporteOcupacionReservas = () => {
  const [desde, setDesde] = useState(primerDiaDelMes());
  const [hasta, setHasta] = useState(ultimoDiaDelMes());
  const [reporte, setReporte] = useState<ReporteOcupacion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargar();
  }, [desde, hasta]);

  const cargar = async () => {
    if (!desde || !hasta) return;
    setError(null);
    try {
      setLoading(true);
      setReporte(await reportesReservaApi.getOcupacion(desde, hasta));
    } catch (err: any) {
      console.error("Error loading reporte de ocupacion:", err);
      setError(
        err.response?.data?.message ||
          "Error al cargar el reporte de ocupación. Verifica las fechas e intenta de nuevo.",
      );
      setReporte(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha Inicio
          </label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            max={hasta}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha Fin
          </label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            min={desde}
            className={inputClass}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Cargando...</div>
      ) : !reporte ? null : reporte.resumen.turnos === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No hay turnos publicados en el período elegido
        </div>
      ) : (
        <div>
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">
                Turnos Publicados
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {reporte.resumen.turnos}
              </p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">
                Capacidad Total
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {reporte.resumen.capacidadTotal} personas
              </p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">
                Personas con Reserva
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {reporte.resumen.personasReservadas}
              </p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">
                Ocupación Promedio
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {reporte.resumen.ocupacionPromedio}%
              </p>
            </div>
          </div>

          {reporte.resumen.turnoMasDemandado && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-800 text-sm">
                <strong>Turno más demandado:</strong>{" "}
                {formatearFechaTurno(reporte.resumen.turnoMasDemandado.fecha)} a
                las {reporte.resumen.turnoMasDemandado.horario} hs (
                {reporte.resumen.turnoMasDemandado.porcentajeOcupacion}% de
                ocupación)
              </p>
            </div>
          )}

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Ocupación por Día de la Semana
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reporte.porDiaSemana}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="etiqueta" />
                  <YAxis unit="%" domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="porcentajeOcupacion"
                    fill="#3b82f6"
                    name="Ocupación (%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Ocupación por Horario
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reporte.porHorario}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="etiqueta" />
                  <YAxis unit="%" domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="porcentajeOcupacion"
                    fill="#10b981"
                    name="Ocupación (%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detalle por turno */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Detalle por Turno</h3>
            <div className="overflow-x-auto">
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
                      Reservas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Personas / Capacidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ocupación
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reporte.porTurno.map((t) => (
                    <tr key={t.idAgenda}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatearFechaTurno(t.fecha)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {t.horario} hs
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {t.reservas}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {t.personasReservadas} / {t.capacidad}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {t.porcentajeOcupacion}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReporteOcupacionReservas;