/**
 * Utilidades compartidas por las pantallas de reservas.
 * Las fechas de turnos llegan como 'YYYY-MM-DD' y los horarios como 'HH:MM:SS'.
 */

/** 'YYYY-MM-DD' → Date local (sin desfase de zona horaria) */
export function parsearFecha(fecha: string): Date {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

/** Date → 'YYYY-MM-DD' */
export function formatearFechaISO(fecha: Date): string {
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mm}-${dd}`;
}

export function hoyISO(): string {
  return formatearFechaISO(new Date());
}

/** '2026-10-24' → 'Viernes, 24 de octubre' */
export function formatearFechaTurno(fecha: string): string {
  const texto = parsearFecha(fecha).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** '21:00:00' → '21:00' */
export function formatearHorario(horario: string): string {
  return horario.slice(0, 5);
}

/** Fecha y hora completas (para fecha de solicitud e historial) */
export function formatearFechaHora(valor: string): string {
  return new Date(valor).toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Colores del badge de estado (mismo estilo que los estados de pedidos) */
export function getEstadoReservaColor(estado: string): string {
  switch (estado) {
    case "Aceptada":
      return "bg-green-100 text-green-800 border-green-200";
    case "Rechazada":
      return "bg-red-100 text-red-800 border-red-200";
    case "Cancelada":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "Cerrada":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-yellow-100 text-yellow-800 border-yellow-200"; // Pendiente
  }
}