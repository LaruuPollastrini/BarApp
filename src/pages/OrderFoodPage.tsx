import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  productosApi,
  sessionApi,
  pedidosApi,
  mesasApi,
} from "../services/api";
import { useCart } from "../contexts/CartContext";
import { getCategoriaDisplay } from "../utils/categoria";
import type { Producto, Mesa, Pedido } from "../types";
import ToastNotification, { ToastType } from "../components/ToastNotification";

// Polling interval for pedidos status (1 minute)
const PEDIDOS_POLLING_INTERVAL = 60000;

const OrderFoodPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableNumber = parseInt(searchParams.get("t") || "0");

  const [productos, setProductos] = useState<Producto[]>([]);
  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPedidosOpen, setIsPedidosOpen] = useState(false);
  const [error, setError] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [visitToken, setVisitToken] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [isVerified, setIsVerified] = useState(() => {
    // Check if already verified for this table
    return localStorage.getItem(`verified_${tableNumber}`) === "true";
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    visible: boolean;
  }>({ message: "", type: "success", visible: false });
  const { addItem, getTotalItems, items, clearCart, getTotalPrice } = useCart();

  // Ref to store previous pedidos for comparison during polling
  const previousPedidosRef = useRef<Pedido[]>([]);
  // Ref to track if polling is active
  const pollingIntervalRef = useRef<number | null>(null);

  // Toast helper function
  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type, visible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  /**
   * Load pedidos and check for status changes to show toast notifications
   * @param showStatusChangeToast - Whether to show toast when status changes (used during polling)
   */
  const loadPedidos = useCallback(
    async (showStatusChangeToast: boolean = false) => {
      // Get stored verification code from localStorage
      const code = localStorage.getItem(`verificationCode_${tableNumber}`);
      console.log("loadPedidos called, code:", code);
      if (!code) {
        // No verification code stored, can't fetch pedidos
        console.log("No verification code found, skipping pedidos fetch");
        return;
      }
      try {
        console.log("Fetching pedidos for mesa:", tableNumber, "code:", code);
        const pedidosData: Pedido[] = await pedidosApi.getByMesa(
          tableNumber,
          code
        );
        console.log("Pedidos fetched:", pedidosData);

        // Check for status changes if we have previous pedidos and showStatusChangeToast is true
        if (showStatusChangeToast && previousPedidosRef.current.length > 0) {
          const statusChanges: string[] = [];

          pedidosData.forEach((newPedido) => {
            const oldPedido = previousPedidosRef.current.find(
              (p) => p.idpedido === newPedido.idpedido
            );

            if (oldPedido && oldPedido.estado !== newPedido.estado) {
              // Status changed!
              const statusText =
                newPedido.estado === "Confirmado"
                  ? "✓ Confirmado"
                  : newPedido.estado === "Rechazado"
                  ? "✗ Rechazado"
                  : newPedido.estado;
              statusChanges.push(
                `Pedido #${newPedido.idpedido}: ${statusText}`
              );
            }
          });

          // Show toast if there are status changes
          if (statusChanges.length > 0) {
            const firstChange = pedidosData.find((p) => {
              const old = previousPedidosRef.current.find(
                (op) => op.idpedido === p.idpedido
              );
              return old && old.estado !== p.estado;
            });

            const toastType: ToastType =
              firstChange?.estado === "Confirmado"
                ? "success"
                : firstChange?.estado === "Rechazado"
                ? "error"
                : "info";

            showToast(statusChanges.join("\n"), toastType);
          }
        }

        // Update previous pedidos ref for next comparison
        previousPedidosRef.current = pedidosData;
        setPedidos(pedidosData || []);
      } catch (err: any) {
        console.error("Error loading pedidos:", err);
        // Non-critical - don't block the user
      }
    },
    [tableNumber]
  );

  useEffect(() => {
    if (!tableNumber || tableNumber <= 0) {
      setError("Número de mesa inválido");
      setLoading(false);
      return;
    }
    // Always load mesa info first, then decide based on verification status
    loadMesaInfoAndCheckVerification();
  }, [tableNumber]);

  // Set up polling for pedidos status updates
  useEffect(() => {
    // Only start polling if user is verified
    if (!isVerified) {
      // Clear any existing interval when not verified
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Check if there are any pending pedidos - only poll if at least one is pending
    const hasPendingPedidos = pedidos.some((p) => p.estado === "Pendiente");

    if (!hasPendingPedidos && pedidos.length > 0) {
      // No pending pedidos - stop polling
      console.log("No pending pedidos, stopping polling");
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Start polling (only if we have pending pedidos or no pedidos yet)
    console.log("Starting pedidos polling (every 1 minute)");
    pollingIntervalRef.current = window.setInterval(() => {
      console.log("Polling pedidos for status updates...");
      loadPedidos(true); // true = show toast on status change
    }, PEDIDOS_POLLING_INTERVAL);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (pollingIntervalRef.current) {
        console.log("Stopping pedidos polling");
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isVerified, loadPedidos, pedidos]);

  const loadMesaInfoAndCheckVerification = async () => {
    try {
      setLoading(true);
      const mesaData = await mesasApi.getByNumero(tableNumber);
      if (mesaData) {
        setMesa(mesaData);

        if (!mesaData.estaAbierta) {
          // Table is closed - clear any stored verification and show verification screen
          // User can still enter code and wait for table to be opened
          localStorage.removeItem(`verified_${tableNumber}`);
          localStorage.removeItem(`verificationCode_${tableNumber}`);
          setIsVerified(false);
          setLoading(false);
          return;
        }

        // Table is open - check if already verified AND has verification code
        const storedVerified =
          localStorage.getItem(`verified_${tableNumber}`) === "true";
        const storedCode = localStorage.getItem(
          `verificationCode_${tableNumber}`
        );

        if (storedVerified && storedCode) {
          setIsVerified(true);
          // Initialize session since table is open and user is verified
          await initializeSessionForMesa(mesaData);
        } else {
          // Clear incomplete verification state
          if (storedVerified && !storedCode) {
            localStorage.removeItem(`verified_${tableNumber}`);
          }
          setIsVerified(false);
          setLoading(false);
        }
      } else {
        setError("Mesa no encontrada");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Error loading mesa:", err);
      setError("Error al cargar información de la mesa");
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setVerificationError("Por favor ingresa el código");
      return;
    }

    if (!mesa) {
      setVerificationError("Mesa no encontrada");
      return;
    }

    setVerifying(true);
    setVerificationError("");

    try {
      const result = await mesasApi.verifyCode(mesa.numero, verificationCode);
      if (result.valid) {
        // Store verification and code in localStorage
        localStorage.setItem(`verified_${tableNumber}`, "true");
        localStorage.setItem(
          `verificationCode_${tableNumber}`,
          verificationCode
        );
        setIsVerified(true);
        setVerificationError("");
        // Initialize session after successful verification
        await initializeSessionForMesa(mesa);
      } else {
        setVerificationError(result.message || "Código incorrecto");
      }
    } catch (err: any) {
      console.error("Error verifying code:", err);
      setVerificationError("Error al verificar el código. Intenta nuevamente.");
    } finally {
      setVerifying(false);
    }
  };

  /**
   * Initialize session for a specific mesa (used after verification or when already verified)
   */
  const initializeSessionForMesa = async (_mesaData: Mesa) => {
    try {
      setLoading(true);
      setError("");

      // Check localStorage for existing session
      const storedSessionId = localStorage.getItem(`session_${tableNumber}`);
      const storedVisitToken = localStorage.getItem(
        `visitToken_${tableNumber}`
      );

      if (storedSessionId && storedVisitToken) {
        // Validate existing session
        const validation = await sessionApi.validate(
          storedSessionId,
          storedVisitToken
        );

        if (validation.valid) {
          setSessionId(storedSessionId);
          setVisitToken(validation.visitToken || storedVisitToken);
          await loadProductos();
          await loadPedidos(false); // false = don't show toast for initial load
          setLoading(false);
          return;
        } else {
          // Session invalid - clear and create new
          localStorage.removeItem(`session_${tableNumber}`);
          localStorage.removeItem(`visitToken_${tableNumber}`);
        }
      }

      // Create new session by scanning table
      const scanResult = await sessionApi.scanTable(tableNumber);

      if (!scanResult || !scanResult.sessionId || !scanResult.visitToken) {
        throw new Error("Respuesta inválida del servidor");
      }

      setSessionId(scanResult.sessionId);
      setVisitToken(scanResult.visitToken);

      // Store in localStorage
      localStorage.setItem(`session_${tableNumber}`, scanResult.sessionId);
      localStorage.setItem(`visitToken_${tableNumber}`, scanResult.visitToken);

      await loadProductos();
      await loadPedidos(false); // false = don't show toast for initial load
    } catch (err: any) {
      console.error("Error initializing session:", err);
      setError("Error al inicializar sesión. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const loadProductos = async () => {
    try {
      const productosData = await productosApi.getAll();
      console.log("Productos loaded from API:", productosData);
      console.log("Productos count:", productosData?.length || 0);
      console.log("Is array?", Array.isArray(productosData));

      // Filter out deleted products and ensure we have valid data
      const validProductos = Array.isArray(productosData)
        ? productosData.filter((p: Producto) => !p.estaEliminado)
        : [];
      console.log("Valid productos count:", validProductos.length);
      console.log("Setting productos state with:", validProductos);

      setProductos(validProductos);

      // Verify state was set (this will log on next render)
      setTimeout(() => {
        console.log("Productos state after setProductos:", validProductos);
      }, 100);

      // Success - don't set error here, let the caller handle error clearing
    } catch (err: any) {
      console.error("Error loading productos:", err);
      // Don't set error here - let the caller decide based on context
      throw err; // Re-throw so caller can handle appropriately
    }
  };

  const handleSubmitOrder = async () => {
    if (!mesa || items.length === 0 || !sessionId || !visitToken) return;

    try {
      const detallesPedido = items.map((item) => ({
        cantidad: item.cantidad,
        precioUnitario: item.producto.precio,
        producto: {
          id: item.producto.id,
        },
      }));

      await pedidosApi.createAnonimo(
        mesa.numero,
        detallesPedido,
        sessionId,
        visitToken
      );

      clearCart();
      setIsCartOpen(false);
      showToast("¡Pedido enviado exitosamente!", "success");
      // Refresh pedidos list (false = don't show toast for this refresh, user just submitted)
      loadPedidos(false);
    } catch (err: any) {
      console.error("Error al enviar pedido:", err);
      const errorMessage =
        err.response?.data?.message || "Error al enviar el pedido";

      // Check if session/token is invalid
      if (
        errorMessage.includes("Sesión inválida") ||
        errorMessage.includes("SESSION_INVALID") ||
        errorMessage.includes("TOKEN_MISMATCH")
      ) {
        // Clear session and verification - force user to re-verify
        localStorage.removeItem(`session_${tableNumber}`);
        localStorage.removeItem(`visitToken_${tableNumber}`);
        localStorage.removeItem(`verified_${tableNumber}`);
        localStorage.removeItem(`verificationCode_${tableNumber}`);
        setSessionId(null);
        setVisitToken(null);
        setIsVerified(false);
        setPedidos([]);
        showToast(
          "Tu sesión ha expirado. Por favor, ingresa el código nuevamente.",
          "error"
        );
      } else {
        showToast(errorMessage, "error");
      }
    }
  };

  // Handle exit - clear session and go back to verification screen
  const handleExit = () => {
    // Stop polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    // Clear all stored data for this table
    localStorage.removeItem(`session_${tableNumber}`);
    localStorage.removeItem(`visitToken_${tableNumber}`);
    localStorage.removeItem(`verified_${tableNumber}`);
    localStorage.removeItem(`verificationCode_${tableNumber}`);
    // Clear cart
    clearCart();
    // Reset state
    setSessionId(null);
    setVisitToken(null);
    setIsVerified(false);
    setProductos([]);
    setPedidos([]);
    // Clear previous pedidos ref
    previousPedidosRef.current = [];
  };

  // Group products by categoria, handling empty strings
  const productosByCategoria = productos.reduce((acc, producto) => {
    const categoriaKey =
      getCategoriaDisplay(producto.categoriaName);
    if (!acc[categoriaKey]) {
      acc[categoriaKey] = [];
    }
    acc[categoriaKey].push(producto);
    return acc;
  }, {} as Record<string, Producto[]>);

  const categorias = Object.keys(productosByCategoria);

  console.log("Productos state:", productos);
  console.log("Categorias:", categorias);
  console.log("Productos by categoria:", productosByCategoria);

  // Toggle category expansion
  const toggleCategory = (categoria: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoria)) {
        newSet.delete(categoria);
      } else {
        newSet.add(categoria);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando menú...</p>
        </div>
      </div>
    );
  }

  // Only show error screen if we have a critical error AND not verified
  if (error && !isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Verification screen - show before menu access
  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Mesa {mesa?.numero || tableNumber}
              </h1>
              <p className="text-gray-600 mt-2">
                Ingresa el código de verificación proporcionado por el mesero
              </p>
            </div>

            {/* Warning if table is closed */}
            {mesa && !mesa.estaAbierta && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-amber-600 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-sm text-amber-800">
                    Esta mesa está cerrada. Solicita al mesero que la abra para
                    poder realizar pedidos.
                  </p>
                </div>
              </div>
            )}

            {/* Verification Form */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Código de verificación
                </label>
                <input
                  type="text"
                  id="code"
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value);
                    setVerificationError("");
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleVerifyCode();
                    }
                  }}
                  placeholder="Ingresa el código de 6 dígitos"
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={6}
                  autoFocus
                />
              </div>

              {verificationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 text-center">
                    {verificationError}
                  </p>
                </div>
              )}

              <button
                onClick={handleVerifyCode}
                disabled={verifying || !verificationCode.trim()}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition-colors"
              >
                {verifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Verificando...
                  </span>
                ) : (
                  "Verificar código"
                )}
              </button>
            </div>

            {/* Help text */}
            <p className="text-center text-sm text-gray-500 mt-6">
              ¿No tienes el código? Solicítalo al mesero
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-4">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Menú</h1>
              <p className="text-sm text-gray-600">Mesa {mesa?.numero}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Exit Button */}
              <button
                onClick={handleExit}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden sm:inline">Salir</span>
              </button>
              {/* Mis Pedidos Button */}
              <button
                onClick={() => setIsPedidosOpen(true)}
                className="relative flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                <span className="hidden sm:inline">Mis Pedidos</span>
                {pedidos.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pedidos.length}
                  </span>
                )}
              </button>
              {/* Cart Button - Mobile */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="lg:hidden relative p-2 text-gray-600 hover:text-gray-900"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {getTotalItems() > 0 && (
                  <span className="absolute top-0 right-0 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Show error banner if there's an error but we still have products */}
        {error && productos.length > 0 && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">{error}</p>
              </div>
            </div>
          </div>
        )}
        <div className="lg:grid lg:grid-cols-4 lg:gap-6">
          {/* Menu Content */}
          <div className="lg:col-span-3">
            {categorias.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay productos disponibles</p>
                {productos.length > 0 && (
                  <p className="text-sm text-gray-400 mt-2">
                    Debug: {productos.length} productos en estado pero no
                    agrupados. Categorias: {categorias.join(", ")}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {categorias.map((categoria) => {
                  const isExpanded = expandedCategories.has(categoria);
                  const productosCount = productosByCategoria[categoria].length;

                  return (
                    <div
                      key={categoria}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                    >
                      {/* Category Header - Clickable */}
                      <button
                        onClick={() => toggleCategory(categoria)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl font-bold text-gray-900">
                            {getCategoriaDisplay(categoria)}
                          </h2>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {productosCount}{" "}
                            {productosCount === 1 ? "producto" : "productos"}
                          </span>
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* Category Content - Expandable */}
                      {isExpanded && (
                        <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            {productosByCategoria[categoria].map((producto) => (
                              <div
                                key={producto.id}
                                className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow flex flex-col h-full"
                              >
                                <div className="flex-grow">
                                  <h3 className="font-semibold text-gray-900 mb-1">
                                    {producto.nombre}
                                  </h3>
                                  <p className="text-sm text-gray-600 mb-2">
                                    {producto.descripcion}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between mt-auto pt-4">
                                  <span className="text-lg font-bold text-blue-600">
                                    ${producto.precio.toFixed(2)}
                                  </span>
                                  <button
                                    onClick={() => addItem(producto)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm font-medium"
                                  >
                                    Agregar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Panel - Desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <AnonymousCartPanel
              mesa={mesa}
              onSubmitOrder={handleSubmitOrder}
              canSubmit={!!sessionId && !!visitToken && isVerified}
              isVerified={isVerified}
              onVerificationChange={setIsVerified}
            />
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTA Button - Mobile & Tablet */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 shadow-lg">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-blue-600 text-white py-4 px-6 flex items-center justify-between hover:bg-blue-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <div className="text-left">
                <span className="font-semibold">Ver pedido</span>
                <span className="block text-sm opacity-90">
                  {getTotalItems()}{" "}
                  {getTotalItems() === 1 ? "artículo" : "artículos"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-lg">
                ${getTotalPrice().toFixed(2)}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Cart Panel - Mobile (Slide) */}
      <AnonymousCartPanel
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        mesa={mesa}
        onSubmitOrder={handleSubmitOrder}
        canSubmit={!!sessionId && !!visitToken && isVerified}
        isVerified={isVerified}
        onVerificationChange={setIsVerified}
      />

      {/* Pedidos Panel (Slide) */}
      {isPedidosOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsPedidosOpen(false)}
          />
          {/* Panel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Mis Pedidos</h2>
                <p className="text-sm text-gray-600">Mesa {mesa?.numero}</p>
              </div>
              <button
                onClick={() => setIsPedidosOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <svg
                  className="w-6 h-6"
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

            {/* Pedidos List */}
            <div className="flex-1 overflow-y-auto p-4">
              {pedidos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <svg
                    className="w-16 h-16 mb-4"
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
                  <p className="text-center">No has realizado pedidos aún</p>
                  <p className="text-sm text-center mt-2">
                    Agrega productos al carrito y envía tu pedido
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pedidos.map((pedido) => (
                    <div
                      key={pedido.idpedido}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-900">
                          Pedido #{pedido.idpedido}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            pedido.estado === "Confirmado"
                              ? "bg-green-100 text-green-800"
                              : pedido.estado === "Rechazado"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {pedido.estado}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        {new Date(pedido.fecha).toLocaleString("es-AR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                      <div className="space-y-2">
                        {pedido.detallespedido?.map((detalle, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-gray-700">
                              {detalle.cantidad}x{" "}
                              {detalle.producto?.nombre || "Producto"}
                            </span>
                            <span className="text-gray-900 font-medium">
                              $
                              {(
                                detalle.cantidad * detalle.precioUnitario
                              ).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
                        <span className="font-medium text-gray-900">
                          Total:
                        </span>
                        <span
                          className={`font-bold ${
                            pedido.estado === "Rechazado"
                              ? "text-gray-400 line-through"
                              : "text-gray-900"
                          }`}
                        >
                          $
                          {pedido.detallespedido
                            ?.reduce(
                              (sum, d) => sum + d.cantidad * d.precioUnitario,
                              0
                            )
                            .toFixed(2) || "0.00"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with total - only sum Confirmado pedidos */}
            {pedidos.length > 0 && (
              <div className="border-t p-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total de pedidos:</span>
                  <span>
                    $
                    {pedidos
                      .filter((p) => p.estado === "Confirmado")
                      .reduce(
                        (total, pedido) =>
                          total +
                          (pedido.detallespedido?.reduce(
                            (sum, d) => sum + d.cantidad * d.precioUnitario,
                            0
                          ) || 0),
                        0
                      )
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Toast Notification */}
      <ToastNotification
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
      />
    </div>
  );
};

interface AnonymousCartPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  mesa: Mesa | null;
  onSubmitOrder: () => void;
  canSubmit?: boolean;
  isVerified?: boolean;
  onVerificationChange?: (verified: boolean) => void;
}

const AnonymousCartPanel: React.FC<AnonymousCartPanelProps> = ({
  isOpen = true,
  onClose,
  mesa,
  onSubmitOrder,
  canSubmit = false,
  isVerified = false,
  onVerificationChange,
}) => {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState("");

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      setVerificationError("Por favor ingresa el código de verificación");
      return;
    }

    if (!mesa) {
      setVerificationError("Mesa no encontrada");
      return;
    }

    try {
      const result = await mesasApi.verifyCode(mesa.numero, verificationCode);
      if (result.valid) {
        setVerificationError("");
        if (onVerificationChange) {
          onVerificationChange(true);
        }
      } else {
        setVerificationError(result.message || "Código incorrecto");
      }
    } catch (error: any) {
      console.error("Error verifying code:", error);
      setVerificationError("Error al verificar el código. Intenta nuevamente.");
    }
  };

  const handleSubmit = async () => {
    if (!mesa || items.length === 0 || !canSubmit || !isVerified) return;

    setIsSubmitting(true);
    try {
      await onSubmitOrder();
      // Keep user verified - they can make multiple orders
      // Mesa closed check is done on backend side
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && onClose) return null;
  return (
    <>
      {/* Overlay for mobile */}
      {onClose && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      {/* Panel */}
      <div
        className={`${
          onClose
            ? "fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col lg:relative lg:max-w-sm lg:shadow-lg"
            : "bg-white shadow-lg flex flex-col"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Carrito</h2>
            {mesa && (
              <p className="text-sm text-gray-600">Mesa {mesa.numero}</p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 lg:hidden"
            >
              <svg
                className="w-6 h-6"
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
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.producto.id}
                  className="flex items-start justify-between p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {item.producto.nombre}
                    </h3>
                    <p className="text-sm text-gray-500">
                      ${item.producto.precio.toFixed(2)} c/u
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.producto.id, item.cantidad - 1)
                        }
                        className="w-8 h-8 flex items-center justify-center border rounded bg-white text-gray-600 hover:bg-gray-100 shadow-sm"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.cantidad}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.producto.id, item.cantidad + 1)
                        }
                        className="w-8 h-8 flex items-center justify-center border rounded bg-white text-gray-600 hover:bg-gray-100 shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="font-medium text-gray-900">
                      ${(item.producto.precio * item.cantidad).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeItem(item.producto.id)}
                      className="text-sm text-red-600 hover:text-red-800 mt-1"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {mesa && !mesa.estaAbierta && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">
                  La mesa está cerrada. No se pueden realizar pedidos.
                </p>
              </div>
            )}

            {/* Verification Section */}
            {!isVerified && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de verificación
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Solicita el código al mesero para confirmar tu pedido
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => {
                        setVerificationCode(e.target.value);
                        setVerificationError("");
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleVerify();
                        }
                      }}
                      placeholder="Ingresa el código"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleVerify}
                      disabled={!verificationCode.trim()}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      Verificar
                    </button>
                  </div>
                  {verificationError && (
                    <p className="text-sm text-red-600 mt-1">
                      {verificationError}
                    </p>
                  )}
                </div>
              </div>
            )}

            {isVerified && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-green-800 font-medium">
                  Código verificado correctamente
                </p>
                <button
                  onClick={() => {
                    setVerificationCode("");
                    if (onVerificationChange) {
                      onVerificationChange(false);
                    }
                  }}
                  className="ml-auto text-sm text-green-700 hover:text-green-900 underline"
                >
                  Cambiar código
                </button>
              </div>
            )}

            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !mesa || !canSubmit || !isVerified}
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? "Enviando..." : "Enviar Pedido"}
            </button>
            {!isVerified && (
              <p className="text-xs text-center text-gray-500">
                Debes verificar el código antes de enviar el pedido
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default OrderFoodPage;
