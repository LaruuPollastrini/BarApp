import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

interface RegisterFormData {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  contrasena: string;
  confirmarContrasena: string;
}

const initialFormData: RegisterFormData = {
  nombre: "",
  apellido: "",
  correo: "",
  telefono: "",
  contrasena: "",
  confirmarContrasena: "",
};

const inputBase =
  "appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm";

/**
 * Registro de clientes. Al registrarse, el backend asigna el grupo "Cliente"
 * (permisos para reservar). Después del registro se inicia sesión automáticamente.
 */
const RegisterPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [formData, setFormData] = useState<RegisterFormData>(initialFormData);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (campo: keyof RegisterFormData, valor: string) => {
    setFormData({ ...formData, [campo]: valor });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.contrasena.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (formData.contrasena !== formData.confirmarContrasena) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.register({
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        correo: formData.correo.trim(),
        telefono: formData.telefono.trim(),
        contrasena: formData.contrasena,
      });

      // Mismo flujo que el login: guardar tokens y cargar permisos
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.user));

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

      setUser({
        id: response.user.id,
        modulosAccesibles: response.user.modulosAccesibles || [],
        accionesAccesibles,
        grupos: Array.isArray(grupos)
          ? grupos.map((g: { id: number; nombre: string }) => ({
              id: g.id,
              nombre: g.nombre,
            }))
          : [],
      });

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Regístrate para poder realizar reservas
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="nombre" className="sr-only">
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                autoComplete="given-name"
                required
                value={formData.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                className={`${inputBase} rounded-none rounded-t-md`}
                placeholder="Nombre"
              />
            </div>
            <div>
              <label htmlFor="apellido" className="sr-only">
                Apellido
              </label>
              <input
                id="apellido"
                type="text"
                autoComplete="family-name"
                required
                value={formData.apellido}
                onChange={(e) => handleChange("apellido", e.target.value)}
                className={`${inputBase} rounded-none`}
                placeholder="Apellido"
              />
            </div>
            <div>
              <label htmlFor="correo" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="correo"
                type="email"
                autoComplete="email"
                required
                value={formData.correo}
                onChange={(e) => handleChange("correo", e.target.value)}
                className={`${inputBase} rounded-none`}
                placeholder="Correo electrónico"
              />
            </div>
            <div>
              <label htmlFor="telefono" className="sr-only">
                Teléfono
              </label>
              <input
                id="telefono"
                type="tel"
                autoComplete="tel"
                required
                value={formData.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
                className={`${inputBase} rounded-none`}
                placeholder="Teléfono"
              />
            </div>
            <div>
              <label htmlFor="contrasena" className="sr-only">
                Contraseña
              </label>
              <input
                id="contrasena"
                type="password"
                autoComplete="new-password"
                required
                value={formData.contrasena}
                onChange={(e) => handleChange("contrasena", e.target.value)}
                className={`${inputBase} rounded-none`}
                placeholder="Contraseña (mínimo 6 caracteres)"
              />
            </div>
            <div>
              <label htmlFor="confirmarContrasena" className="sr-only">
                Confirmar contraseña
              </label>
              <input
                id="confirmarContrasena"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmarContrasena}
                onChange={(e) =>
                  handleChange("confirmarContrasena", e.target.value)
                }
                className={`${inputBase} rounded-none rounded-b-md`}
                placeholder="Confirmar contraseña"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                ¿Ya tienes cuenta? Inicia sesión
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;