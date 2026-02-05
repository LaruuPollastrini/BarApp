/**
 * Obtiene el nombre de categoría para mostrar.
 * BE devuelve "" cuando no hay categoría; FE usa "Otros" para agrupar esos casos.
 */
export function getCategoriaDisplay(categoriaName: string | undefined): string {
  return (categoriaName ?? "").trim() || "Otros";
}
