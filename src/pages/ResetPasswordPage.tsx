import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { authApi } from "../services/api";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  const tokenFromState = (location.state as { token?: string })?.token;

  const [token, setToken] = useState(
    tokenFromUrl || tokenFromState || ""
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    const resetToken = tokenFromUrl || tokenFromState || token;
    if (!resetToken) {
      setError("Token inválido o expirado. Solicita un nuevo enlace de recuperación.");
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(resetToken, newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/login?reset=success"), 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Error al restablecer la contraseña";
      setError(
        msg === "Token expirado"
          ? "El enlace ha expirado. Solicita uno nuevo desde Recuperar Contraseña."
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="rounded-md bg-green-50 p-6">
            <p className="text-green-800 font-medium">
              Contraseña actualizada correctamente.
            </p>
            <p className="text-green-700 text-sm mt-2">
              Redirigiendo al inicio de sesión...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Nueva Contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tu nueva contraseña
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
          {!tokenFromUrl && !tokenFromState && (
            <div>
              <label
                htmlFor="token"
                className="block text-sm font-medium text-gray-700"
              >
                Código de recuperación
              </label>
              <input
                id="token"
                name="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Pega el código que recibiste"
              />
            </div>
          )}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Nueva contraseña
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Repite la contraseña"
            />
          </div>
          <div className="flex items-center justify-between">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Solicitar nuevo enlace
            </Link>
            <Link
              to="/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Volver al login
            </Link>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Guardando..." : "Restablecer contraseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
