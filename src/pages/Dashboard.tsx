import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/** Módulos principales: visibilidad si tiene al menos una acción de esa sección (Ver/Editar/Agregar/Eliminar, etc.) */
const NAV_ITEMS = [
  {
    name: "Mesas",
    href: "/mesas",
    seccion: "Mesas",
    description: "Ver y gestionar mesas",
    color: "blue" as const,
  },
  {
    name: "Productos",
    href: "/productos",
    seccion: "Productos",
    description: "Gestionar productos",
    color: "green" as const,
  },
  {
    name: "Categorías",
    href: "/categorias",
    seccion: "Categorias",
    description: "Gestionar categorías",
    color: "purple" as const,
  },
  {
    name: "Reportes",
    href: "/reportes",
    seccion: "Reportes",
    description: "Ver reportes y estadísticas",
    color: "indigo" as const,
  },
];

/** Seguridad: visibilidad si tiene al menos una acción de esa sección (Ver/Crear/Editar/Eliminar) */
const SEGURIDAD_ITEMS = [
  {
    name: "Módulos",
    href: "/modulos",
    seccion: "Modulos",
    description: "Gestionar módulos del sistema",
    color: "blue" as const,
  },
  {
    name: "Formularios",
    href: "/formularios",
    seccion: "Formularios",
    description: "Gestionar formularios",
    color: "green" as const,
  },
  {
    name: "Acciones",
    href: "/acciones",
    seccion: "Acciones",
    description: "Gestionar acciones",
    color: "purple" as const,
  },
  {
    name: "Grupos",
    href: "/grupos",
    seccion: "Grupos",
    description: "Gestionar grupos de usuarios",
    color: "yellow" as const,
  },
  {
    name: "Usuarios",
    href: "/usuarios",
    seccion: "Usuarios",
    description: "Gestionar usuarios",
    color: "red" as const,
  },
];

const BORDER_CLASSES: Record<string, string> = {
  blue: "border-blue-200 hover:border-blue-400 bg-white",
  green: "border-green-200 hover:border-green-400 bg-white",
  purple: "border-purple-200 hover:border-purple-400 bg-white",
  yellow: "border-amber-200 hover:border-amber-400 bg-white",
  red: "border-rose-200 hover:border-rose-400 bg-white",
  indigo: "border-indigo-200 hover:border-indigo-400 bg-white",
};

const Dashboard = () => {
  const { hasAccessToSeccion } = useAuth();

  const visibleNav = NAV_ITEMS.filter((item) =>
    hasAccessToSeccion(item.seccion),
  );
  const visibleSeguridad = SEGURIDAD_ITEMS.filter((item) =>
    hasAccessToSeccion(item.seccion),
  );

  const hasAnyAccess = visibleNav.length > 0 || visibleSeguridad.length > 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Acceso rápido a los módulos disponibles para tu usuario
        </p>
      </div>

      {!hasAnyAccess ? (
        <p className="text-gray-500 py-8">
          No tienes acceso a ningún módulo. Contacta al administrador.
        </p>
      ) : (
        <>
          {visibleNav.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Módulos
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleNav.map((card) => (
                  <Link
                    key={card.href}
                    to={card.href}
                    className={`block rounded-lg shadow-md border-2 p-6 text-gray-900 transition-colors ${
                      BORDER_CLASSES[card.color]
                    }`}
                  >
                    <h3 className="text-xl font-semibold mb-2">{card.name}</h3>
                    <p className="text-gray-600 text-sm">{card.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {visibleSeguridad.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Seguridad
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleSeguridad.map((card) => (
                  <Link
                    key={card.href}
                    to={card.href}
                    className={`block rounded-lg shadow-md border-2 p-6 text-gray-900 transition-colors ${
                      BORDER_CLASSES[card.color]
                    }`}
                  >
                    <h3 className="text-xl font-semibold mb-2">{card.name}</h3>
                    <p className="text-gray-600 text-sm">{card.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
