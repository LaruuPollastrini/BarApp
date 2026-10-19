import { useState, useEffect } from "react";
import { auditoriaApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { ReporteSesiones, CambioReserva } from "../types";
import {
  formatearFechaISO,
  formatearFechaHora,
  formatearFechaTurno,
  formatearHorario,
  getEstadoReservaColor,
  hoyISO,
} from "../utils/reservas";

type AuditoriaTabKey = "sesiones" | "reservas";

const AUDITORIA_TABS: { key: AuditoriaTabKey; label: string; action: string }[] =
  [
    {
      key: "sesiones",
      label: "Inicios y Cierres de Sesión",
      action: "Auditoria.Ver Auditoria de Sesiones",
    },
    {
      key: "reservas",
      label: "Trazabilidad de Reservas",
      action: "Auditoria.Ver Auditoria de Reservas",
    },
  ];

const TIPOS_SESION: Record<string, { label: string; color: string }> = {
  LOGIN: {
    label: "Inicio de sesión",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  LOGIN_FALLIDO: {
    label: "Intento fallido",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  LOGOUT: {
    label: "Cierre de sesión",
    color: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

const inputClass =
  "block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500";

const haceDias = (dias: number) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return formatearFechaISO(fecha);
};

const AuditoriaPage = () => {
  const { hasAccessToAccion } = useAuth();
  const [activeTab, setActiveTab] = useState<AuditoriaTabKey>("sesiones");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros comunes: por defecto, los últimos 7 días
  const [desde, setDesde] = useState(haceDias(7));
  const [hasta, setHasta] = useState(hoyISO());
  // Filtros propios de cada pestaña
  const [tipo, setTipo] = useState("");
  const [idReserva, setIdReserva] = useState("");

  const [sesiones, setSesiones] = useState<ReporteSesiones | null>(null);
  const [cambios, setCambios] = useState<CambioReserva[]>([]);

  const visibleTabs = AUDITORIA_TABS.filter((tab) =>
    hasAccessToAccion(tab.action),
  );
  const visibleTabKeys = visibleTabs.map((t) => t.key);

  // Si la pestaña activa no está permitida, cambiar a la primera visible
  useEffect(() => {
    if (visibleTabKeys.length > 0 && !visibleTabKeys.includes(activeTab)) {
      setActiveTab(visibleTabKeys[0]);
    }
  }, [visibleTabKeys.join(","), activeTab]);

  useEffect(() => {
    if (!visibleTabKeys.includes(activeTab)) return;
    if (activeTab === "sesiones") {
      cargarSesiones();
    } else {
      cargarCambios();
    }
  }, [activeTab, desde, hasta, tipo, idReserva, visibleTabKeys.join(",")]);

  const mensajeError = (err: any, porDefecto: string) =>
    err.response?.data?.message || porDefecto;

  const cargarSesiones = async () => {
    setError(null);
    try {
      setLoading(true);
      setSesiones(
        await auditoriaApi.getSesiones({
          desde: desde || undefined,
          hasta: hasta || undefined,
          tipo: tipo || undefined,
        }),
      );
    } catch (err: any) {
      console.error("Error loading auditoria de sesiones:", err);
      setError(mensajeError(err, "Error al cargar la auditoría de sesiones"));
      setSesiones(null);
    } finally {
      setLoading(false);
    }
  };

  const cargarCambios = async () => {
    setError(null);
    try {
      setLoading(true);
      // Si se busca una reserva puntual, se muestra toda su historia (sin filtro de fechas)
      const data = await auditoriaApi.getReservas(
        idReserva
          ? { idReserva }
          : { desde: desde || undefined, hasta: hasta || undefined },
      );
      setCambios(data || []);
    } catch (err: any) {
      console.error("Error loading auditoria de reservas:", err);
      setError(mensajeError(err, "Error al cargar la trazabilidad de reservas"));
      setCambios([]);
    } finally {
      setLoading(false);
    }
  };

  const thClass =
    "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
  const tdClass = "px-6 py-4 whitespace-nowrap text-sm text-gray-500";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Auditoría</h1>
        <p className="mt-2 text-sm text-gray-600">
          Registro de accesos al sistema y de cada cambio en las reservas
        </p>
      </div>

      {/* Tabs: solo las pestañas para las que el usuario tiene acción */}
      <div className="border-b border-gray-200 mb-6">
        {visibleTabs.length === 0 ? (
          <p className="py-4 text-gray-500 text-sm">
            No tienes permisos para visualizar la auditoría.
          </p>
        ) : (
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`${
                  activeTab === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        )}
      </div>

      {visibleTabs.length > 0 && (
        <>
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Filtros */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                max={hasta || undefined}
                disabled={activeTab === "reservas" && !!idReserva}
                className={`${inputClass} disabled:bg-gray-100`}
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
                min={desde || undefined}
                disabled={activeTab === "reservas" && !!idReserva}
                className={`${inputClass} disabled:bg-gray-100`}
              />
            </div>
            {activeTab === "sesiones" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de evento
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Todos</option>
                  {Object.entries(TIPOS_SESION).map(([valor, t]) => (
                    <option key={valor} value={valor}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de reserva
                </label>
                <input
                  type="number"
                  min={1}
                  value={idReserva}
                  onChange={(e) => setIdReserva(e.target.value)}
                  placeholder="Ver la historia completa de una reserva"
                  className={inputClass}
                />
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">Cargando...</div>
          ) : activeTab === "sesiones" ? (
            sesiones && (
              <div>
                {/* Resumen */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-500">
                      Inicios de Sesión
                    </h3>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {sesiones.resumen.logins}
                    </p>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-500">
                      Intentos Fallidos
                    </h3>
                    <p className="text-2xl font-bold text-red-600 mt-2">
                      {sesiones.resumen.loginsFallidos}
                    </p>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-500">
                      Cierres de Sesión
                    </h3>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {sesiones.resumen.logouts}
                    </p>
                  </div>
                </div>

                {sesiones.eventos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No hay eventos en el período elegido
                  </div>
                ) : (
                  <div className="bg-white shadow rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className={thClass}>Fecha y Hora</th>
                          <th className={thClass}>Evento</th>
                          <th className={thClass}>Usuario</th>
                          <th className={thClass}>Correo</th>
                          <th className={thClass}>Detalle</th>
                          <th className={thClass}>IP</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sesiones.eventos.map((e) => (
                          <tr key={e.id}>
                            <td className={tdClass}>
                              {formatearFechaHora(e.fecha)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 text-sm font-medium rounded-full border ${
                                  TIPOS_SESION[e.tipo]?.color ?? ""
                                }`}
                              >
                                {TIPOS_SESION[e.tipo]?.label ?? e.tipo}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {e.usuario ?? "-"}
                            </td>
                            <td className={tdClass}>{e.correo}</td>
                            <td className={tdClass}>{e.detalle ?? "-"}</td>
                            <td className={tdClass}>{e.ip ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          ) : cambios.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay cambios registrados con estos filtros
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={thClass}>Fecha y Hora</th>
                    <th className={thClass}>Reserva</th>
                    <th className={thClass}>Cliente</th>
                    <th className={thClass}>Turno</th>
                    <th className={thClass}>Cambio de Estado</th>
                    <th className={thClass}>Realizado por</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cambios.map((c) => (
                    <tr key={c.idHistorial}>
                      <td className={tdClass}>{formatearFechaHora(c.fecha)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <button
                          onClick={() => setIdReserva(String(c.idReserva))}
                          className="text-blue-600 hover:text-blue-800 underline"
                          title="Ver la historia completa de esta reserva"
                        >
                          #{c.idReserva}
                        </button>
                      </td>
                      <td className={tdClass}>
                        {c.cliente ?? "-"}
                        {c.cantidadPersonas !== null && (
                          <p className="text-xs text-gray-400">
                            {c.cantidadPersonas} persona
                            {c.cantidadPersonas !== 1 ? "s" : ""}
                          </p>
                        )}
                      </td>
                      <td className={tdClass}>
                        {c.turno
                          ? `${formatearFechaTurno(c.turno.fecha)} — ${formatearHorario(
                              c.turno.horario,
                            )} hs`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm">
                          {c.estadoAnterior ? (
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getEstadoReservaColor(
                                c.estadoAnterior,
                              )}`}
                            >
                              {c.estadoAnterior}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Creación
                            </span>
                          )}
                          <span className="text-gray-400">→</span>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getEstadoReservaColor(
                              c.estadoNuevo,
                            )}`}
                          >
                            {c.estadoNuevo}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {c.realizadoPor ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditoriaPage;