import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../services/api";

const ForgotPasswordPage = () => {
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      await authApi.requestPasswordReset(correo);
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Error al solicitar restablecimiento de contraseña"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Recuperar Contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tu correo electrónico para restablecer tu contraseña
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-800">
                Si el correo existe en nuestra base de datos, recibirás un
                enlace para restablecer tu contraseña. Revisa tu bandeja de
                entrada y spam.
              </div>
            </div>
          )}
          <div>
            <label
              htmlFor="correo"
              className="block text-sm font-medium text-gray-700"
            >
              Correo electrónico
            </label>
            <input
              id="correo"
              name="correo"
              type="email"
              autoComplete="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || success}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Enviando..."
                : success
                ? "Enviado"
                : "Enviar enlace de recuperación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
