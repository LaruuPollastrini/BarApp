import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { authApi, accionesApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setUser } = useAuth();
  const [formData, setFormData] = useState({
    correo: "",
    contrasena: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setSuccessMessage("Contraseña actualizada. Ya puedes iniciar sesión.");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authApi.login(
        formData.correo,
        formData.contrasena,
      );

      // Store tokens
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.user));

      // Fetch acciones accesibles y grupos del usuario
      let accionesAccesibles: string[] = [];
      let grupos: Array<{ id: number; nombre: string }> = [];
      try {
        [accionesAccesibles, grupos] = await Promise.all([
          authApi.getAccionesAccesibles(),
          authApi.getUserGrupos(),
        ]);
      } catch (err) {
        console.error("Error fetching permissions:", err);
      }

      // Update auth context (incluye grupos para saber si es Admin)
      const userData = {
        id: response.user.id,
        modulosAccesibles: response.user.modulosAccesibles || [],
        accionesAccesibles,
        grupos: Array.isArray(grupos)
          ? grupos.map((g: { id: number; nombre: string }) => ({
              id: g.id,
              nombre: g.nombre,
            }))
          : [],
      };
      setUser(userData);

      // Debug: Log user permissions
      try {
        const [debugInfo, accionesMatch] = await Promise.all([
          authApi.debugPermissions(),
          accionesApi.verifyMatch().catch(() => null),
        ]);

        console.log("=== USER PERMISSIONS DEBUG ===");
        console.log("User ID:", userData.id);
        console.log("Grupos:", userData.grupos);
        console.log("Módulos Accesibles:", userData.modulosAccesibles);
        console.log("Acciones Accesibles:", userData.accionesAccesibles);
        console.log("Debug Info (detailed):", debugInfo);
        if (accionesMatch) {
          console.log("=== ACCIONES MATCH VERIFICATION ===");
          console.log("Total in Constants:", accionesMatch.totalInConstants);
          console.log("Total in DB:", accionesMatch.totalInDb);
          console.log("Missing in DB:", accionesMatch.missingInDb);
          console.log("Extra in DB:", accionesMatch.extraInDb);
          console.log("===================================");
        }
        console.log("==============================");
      } catch (err) {
        console.error("Error fetching debug info:", err);
      }

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tus credenciales para acceder
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
          {successMessage && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-800">{successMessage}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="correo" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="correo"
                name="correo"
                type="email"
                autoComplete="email"
                required
                value={formData.correo}
                onChange={(e) =>
                  setFormData({ ...formData, correo: e.target.value })
                }
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Correo electrónico"
              />
            </div>
            <div>
              <label htmlFor="contrasena" className="sr-only">
                Contraseña
              </label>
              <input
                id="contrasena"
                name="contrasena"
                type="password"
                autoComplete="current-password"
                required
                value={formData.contrasena}
                onChange={(e) =>
                  setFormData({ ...formData, contrasena: e.target.value })
                }
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
