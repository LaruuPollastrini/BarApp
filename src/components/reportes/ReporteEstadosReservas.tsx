import { useState, useEffect } from "react";
import { reportesReservaApi } from "../../services/api";
import type { ReporteEstadosReservas as Reporte } from "../../types";
import { formatearFechaISO, getEstadoReservaColor } from "../../utils/reservas";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const inputClass =
  "block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500";

// Mismos colores que los badges de estado
const COLORES_ESTADO: Record<string, string> = {
  Pendiente: "#eab308",
  Aceptada: "#22c55e",
  Rechazada: "#ef4444",
  Cancelada: "#9ca3af",
  Cerrada: "#3b82f6",
};

const primerDiaDelMes = () => {
  const hoy = new Date();
  return formatearFechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
};

const ultimoDiaDelMes = () => {
  const hoy = new Date();
  return formatearFechaISO(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
};

/**
 * Reporte: reservas por estado en un período (según la fecha del turno).
 * Muestra la tasa de cancelación, de rechazo y de asistencia.
 */
const ReporteEstadosReservas = () => {
  const [desde, setDesde] = useState(primerDiaDelMes());
  const [hasta, setHasta] = useState(ultimoDiaDelMes());
  const [reporte, setReporte] = useState<Reporte | null>(null);
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
      setReporte(await reportesReservaApi.getEstados(desde, hasta));
    } catch (err: any) {
      console.error("Error loading reporte de estados:", err);
      setError(
        err.response?.data?.message ||
          "Error al cargar el reporte de estados. Verifica las fechas e intenta de nuevo.",
      );
      setReporte(null);
    } finally {
      setLoading(false);
    }
  };

  // El gráfico de torta solo muestra los estados que tienen reservas
  const datosGrafico = reporte
    ? reporte.porEstado.filter((e) => e.cantidad > 0)
    : [];

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
      ) : !reporte ? null : reporte.resumen.totalReservas === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No hay reservas para turnos del período elegido
        </div>
      ) : (
        <div>
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">
                Total Reservas
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {reporte.resumen.totalReservas}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {reporte.resumen.totalPersonas} personas
              </p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">
                Tasa de Cancelación
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {reporte.resumen.tasaCancelacion}%
              </p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">
                Tasa de Rechazo
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {reporte.resumen.tasaRechazo}%
              </p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">
                Tasa de Asistencia
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {reporte.resumen.tasaAsistencia !== null
                  ? `${reporte.resumen.tasaAsistencia}%`
                  : "—"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {reporte.resumen.tasaAsistencia !== null
                  ? "De las aceptadas cuyo turno ya pasó"
                  : "Todavía no pasó ningún turno con reservas aceptadas"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Distribución por Estado
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={datosGrafico}
                    dataKey="cantidad"
                    nameKey="estado"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {datosGrafico.map((e) => (
                      <Cell
                        key={e.estado}
                        fill={COLORES_ESTADO[e.estado] || "#6b7280"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Tabla */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Detalle</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reservas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Personas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reporte.porEstado.map((e) => (
                      <tr key={e.estado}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 text-sm font-medium rounded-full border ${getEstadoReservaColor(
                              e.estado,
                            )}`}
                          >
                            {e.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {e.cantidad}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {e.personas}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {e.porcentaje}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReporteEstadosReservas;