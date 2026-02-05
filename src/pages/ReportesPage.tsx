import { useState, useEffect } from "react";
import { pedidosApi, categoriasApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { getCategoriaDisplay } from "../utils/categoria";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

type ProductoStats = {
  productoId: number;
  nombre: string;
  categoria: string;
  totalCantidad: number;
  totalPedidos: number;
  precioUnitario: number;
};

type IncomeReport = {
  total: number;
  totalPedidos: number;
  period: string;
  breakdown?: Array<{ date: string; total: number; pedidos: number }>;
};

type AverageTicketReport = {
  average: number;
  totalTickets: number;
  totalRevenue: number;
  period: string;
};

type Categoria = {
  id: number;
  nombre: string;
};

type NeverOrderedProduct = {
  productoId: number;
  nombre: string;
  categoria: string;
  precio: number;
  descripcion: string;
};

type ReportTabKey =
  | "productos"
  | "menos-pedidos"
  | "nunca-pedidos"
  | "ingresos"
  | "ticket";

const REPORT_TABS: { key: ReportTabKey; label: string; action: string }[] = [
  {
    key: "productos",
    label: "Productos Más Pedidos",
    action: "Reportes.Ver Productos Mas Pedidos",
  },
  {
    key: "menos-pedidos",
    label: "Productos Menos Pedidos",
    action: "Reportes.Ver Productos Menos Pedidos",
  },
  {
    key: "nunca-pedidos",
    label: "Productos Nunca Pedidos",
    action: "Reportes.Ver Productos Nunca Pedidos",
  },
  {
    key: "ingresos",
    label: "Reporte de Ingresos",
    action: "Reportes.Reporte de Ingresos",
  },
  {
    key: "ticket",
    label: "Ticket Promedio",
    action: "Reportes.Ticket Promedio",
  },
];

const ReportesPage = () => {
  const { hasAccessToAccion } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportTabKey>("productos");
  const [productosStats, setProductosStats] = useState<ProductoStats[]>([]);
  const [leastOrderedStats, setLeastOrderedStats] = useState<ProductoStats[]>(
    [],
  );
  const [neverOrderedProducts, setNeverOrderedProducts] = useState<
    NeverOrderedProduct[]
  >([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string>("");
  const [incomeReport, setIncomeReport] = useState<IncomeReport | null>(null);
  const [averageTicketReport, setAverageTicketReport] =
    useState<AverageTicketReport | null>(null);
  const [incomeReportError, setIncomeReportError] = useState<string | null>(
    null,
  );
  const [averageTicketError, setAverageTicketError] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  // Date states - initialized to today
  const today = new Date();
  const [incomeStartDate, setIncomeStartDate] = useState<string>(
    today.toISOString().split("T")[0],
  );
  const [incomeEndDate, setIncomeEndDate] = useState<string>(
    today.toISOString().split("T")[0],
  );
  const [ticketStartDate, setTicketStartDate] = useState<string>(
    today.toISOString().split("T")[0],
  );
  const [ticketEndDate, setTicketEndDate] = useState<string>(
    today.toISOString().split("T")[0],
  );

  const visibleTabs = REPORT_TABS.filter((tab) =>
    hasAccessToAccion(tab.action),
  );
  const visibleTabKeys = visibleTabs.map((t) => t.key);

  useEffect(() => {
    loadCategorias();
  }, []);

  // Si el tab activo no está permitido, cambiar al primero visible
  useEffect(() => {
    if (visibleTabKeys.length > 0 && !visibleTabKeys.includes(activeTab)) {
      setActiveTab(visibleTabKeys[0]);
    }
  }, [visibleTabKeys.join(","), activeTab]);

  useEffect(() => {
    if (activeTab === "productos") {
      loadProductosStats();
    } else if (activeTab === "menos-pedidos") {
      loadLeastOrderedProducts();
    } else if (activeTab === "nunca-pedidos") {
      loadNeverOrderedProducts();
    } else if (activeTab === "ingresos") {
      loadIncomeReport();
    } else if (activeTab === "ticket") {
      loadAverageTicketReport();
    }
  }, [
    activeTab,
    selectedCategoria,
    incomeStartDate,
    incomeEndDate,
    ticketStartDate,
    ticketEndDate,
  ]);

  const loadCategorias = async () => {
    try {
      const data = await categoriasApi.getAll();
      setCategorias(data || []);
    } catch (error) {
      console.error("Error loading categorias:", error);
    }
  };

  const loadProductosStats = async () => {
    try {
      setLoading(true);
      const categoria = selectedCategoria || undefined;
      const data = await pedidosApi.getMostOrderedProducts(categoria);
      setProductosStats(data || []);
    } catch (error) {
      console.error("Error loading productos stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeastOrderedProducts = async () => {
    try {
      setLoading(true);
      const categoria = selectedCategoria || undefined;
      const data = await pedidosApi.getLeastOrderedProducts(categoria);
      setLeastOrderedStats(data || []);
    } catch (error) {
      console.error("Error loading least ordered products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadNeverOrderedProducts = async () => {
    try {
      setLoading(true);
      const categoria = selectedCategoria || undefined;
      const data = await pedidosApi.getNeverOrderedProducts(categoria);
      setNeverOrderedProducts(data || []);
    } catch (error) {
      console.error("Error loading never ordered products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadIncomeReport = async () => {
    if (!incomeStartDate || !incomeEndDate) return;
    setIncomeReportError(null);
    try {
      setLoading(true);
      const data = await pedidosApi.getIncomeReport(
        incomeStartDate,
        incomeEndDate,
      );
      setIncomeReport(data);
    } catch (error: unknown) {
      console.error("Error loading income report:", error);
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null;
      setIncomeReportError(
        message ||
          "Error al cargar el reporte de ingresos. Verifica las fechas e intenta de nuevo.",
      );
      setIncomeReport(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAverageTicketReport = async () => {
    if (!ticketStartDate || !ticketEndDate) return;
    setAverageTicketError(null);
    try {
      setLoading(true);
      const data = await pedidosApi.getAverageTicket(
        ticketStartDate,
        ticketEndDate,
      );
      setAverageTicketReport(data);
    } catch (error: unknown) {
      console.error("Error loading average ticket report:", error);
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null;
      setAverageTicketError(
        message ||
          "Error al cargar el reporte de ticket promedio. Verifica las fechas e intenta de nuevo.",
      );
      setAverageTicketReport(null);
    } finally {
      setLoading(false);
    }
  };

  // Generate consistent color for categories
  const getCategoriaColor = (categoria: string) => {
    let hash = 0;
    for (let i = 0; i < categoria.length; i++) {
      hash = categoria.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    const saturation = 70;
    const lightness = 45;
    const bg = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const text = lightness > 50 ? "#000000" : "#ffffff";
    return { bg, text };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="mt-2 text-sm text-gray-600">
          Visualiza estadísticas y reportes del sistema
        </p>
      </div>

      {/* Tabs: solo se muestran las pestañas para las que el usuario tiene acción */}
      <div className="border-b border-gray-200 mb-6">
        {visibleTabs.length === 0 ? (
          <p className="py-4 text-gray-500 text-sm">
            No tienes permisos para visualizar ningún reporte.
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

      {/* Contenido de reportes: solo si el usuario tiene al menos un tab visible */}
      {visibleTabs.length > 0 && (
        <>
          {/* Filtro por categoría (solo para tabs de productos) */}
          {(activeTab === "productos" ||
            activeTab === "menos-pedidos" ||
            activeTab === "nunca-pedidos") && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por Categoría
                </label>
                <select
                  value={selectedCategoria}
                  onChange={(e) => setSelectedCategoria(e.target.value)}
                  className="block w-full max-w-xs border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.nombre}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === "productos" && (
            <div>
              {loading ? (
                <div className="text-center py-12">Cargando...</div>
              ) : productosStats.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No hay datos disponibles
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg p-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={productosStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="nombre"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="totalCantidad"
                        fill="#3b82f6"
                        name="Cantidad Total"
                      />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Detalles</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Producto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Categoría
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cantidad Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Pedidos
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Precio Unitario
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {productosStats.map((producto) => {
                            const color = getCategoriaColor(
                              getCategoriaDisplay(producto.categoria),
                            );
                            return (
                              <tr key={producto.productoId}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {producto.nombre}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className="px-2 py-1 text-xs font-medium rounded-full"
                                    style={{
                                      backgroundColor: color.bg,
                                      color: color.text,
                                    }}
                                  >
                                    {getCategoriaDisplay(producto.categoria)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {producto.totalCantidad}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {producto.totalPedidos}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatCurrency(producto.precioUnitario)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Productos Menos Pedidos Tab */}
          {activeTab === "menos-pedidos" && (
            <div>
              {loading ? (
                <div className="text-center py-12">Cargando...</div>
              ) : leastOrderedStats.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No hay datos disponibles
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg p-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={leastOrderedStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="nombre"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="totalCantidad"
                        fill="#ef4444"
                        name="Cantidad Total"
                      />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Detalles</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Producto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Categoría
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cantidad Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Pedidos
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Precio Unitario
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {leastOrderedStats.map((producto) => {
                            const color = getCategoriaColor(
                              getCategoriaDisplay(producto.categoria),
                            );
                            return (
                              <tr key={producto.productoId}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {producto.nombre}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className="px-2 py-1 text-xs font-medium rounded-full"
                                    style={{
                                      backgroundColor: color.bg,
                                      color: color.text,
                                    }}
                                  >
                                    {getCategoriaDisplay(producto.categoria)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {producto.totalCantidad}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {producto.totalPedidos}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatCurrency(producto.precioUnitario)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Productos Nunca Pedidos Tab */}
          {activeTab === "nunca-pedidos" && (
            <div>
              {loading ? (
                <div className="text-center py-12">Cargando...</div>
              ) : neverOrderedProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No hay productos sin pedidos. Todos los productos han sido
                  pedidos al menos una vez.
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">
                      Productos que nunca se han pedido (
                      {neverOrderedProducts.length})
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Estos productos podrían necesitar promoción o revisión
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Categoría
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Precio
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Descripción
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {neverOrderedProducts.map((producto) => {
                          const color = getCategoriaColor(
                            getCategoriaDisplay(producto.categoria),
                          );
                          return (
                            <tr key={producto.productoId}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {producto.nombre}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className="px-2 py-1 text-xs font-medium rounded-full"
                                  style={{
                                    backgroundColor: color.bg,
                                    color: color.text,
                                  }}
                                >
                                  {getCategoriaDisplay(producto.categoria)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatCurrency(producto.precio)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {producto.descripcion || "Sin descripción"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reporte de Ingresos Tab */}
          {activeTab === "ingresos" && (
            <div>
              {incomeReportError && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {incomeReportError}
                </div>
              )}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={incomeStartDate}
                    onChange={(e) => setIncomeStartDate(e.target.value)}
                    max={incomeEndDate}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={incomeEndDate}
                    onChange={(e) => setIncomeEndDate(e.target.value)}
                    min={incomeStartDate}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">Cargando...</div>
              ) : incomeReportError ? (
                <div className="text-center py-8 text-gray-600">
                  Ajusta el rango de fechas y vuelve a cargar.
                </div>
              ) : incomeReport ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-sm font-medium text-gray-500">
                        Total Ingresos
                      </h3>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {formatCurrency(incomeReport.total)}
                      </p>
                    </div>
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-sm font-medium text-gray-500">
                        Total Pedidos
                      </h3>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {incomeReport.totalPedidos}
                      </p>
                    </div>
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-sm font-medium text-gray-500">
                        Ticket Promedio
                      </h3>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {formatCurrency(
                          incomeReport.totalPedidos > 0
                            ? incomeReport.total / incomeReport.totalPedidos
                            : 0,
                        )}
                      </p>
                    </div>
                  </div>

                  {incomeReport.breakdown &&
                    incomeReport.breakdown.length > 0 && (
                      <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">
                          Desglose por Día ({incomeReport.period})
                        </h3>
                        <ResponsiveContainer width="100%" height={400}>
                          <AreaChart data={incomeReport.breakdown}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Area
                              type="monotone"
                              dataKey="total"
                              stroke="#3b82f6"
                              fill="#3b82f6"
                              name="Ingresos"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Selecciona un rango de fechas para ver el reporte
                </div>
              )}
            </div>
          )}

          {/* Ticket Promedio Tab */}
          {activeTab === "ticket" && (
            <div>
              {averageTicketError && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {averageTicketError}
                </div>
              )}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={ticketStartDate}
                    onChange={(e) => setTicketStartDate(e.target.value)}
                    max={ticketEndDate}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={ticketEndDate}
                    onChange={(e) => setTicketEndDate(e.target.value)}
                    min={ticketStartDate}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">Cargando...</div>
              ) : averageTicketError ? (
                <div className="text-center py-8 text-gray-600">
                  Ajusta el rango de fechas y vuelve a cargar.
                </div>
              ) : averageTicketReport ? (
                <div>
                  <div className="bg-white shadow rounded-lg p-8 mb-6">
                    <div className="text-center">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Ticket Promedio
                      </h3>
                      <p className="text-5xl font-bold text-blue-600">
                        {formatCurrency(averageTicketReport.average)}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Período: {averageTicketReport.period}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-sm font-medium text-gray-500">
                        Total Tickets
                      </h3>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {averageTicketReport.totalTickets}
                      </p>
                    </div>
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-sm font-medium text-gray-500">
                        Ingresos Totales
                      </h3>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {formatCurrency(averageTicketReport.totalRevenue)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Selecciona un rango de fechas para ver el reporte
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportesPage;
