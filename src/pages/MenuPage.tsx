import { useState, useEffect } from "react";
import { productosApi } from "../services/api";
import { useCart } from "../contexts/CartContext";
import CartPanel from "../components/CartPanel";
import { getCategoriaDisplay } from "../utils/categoria";
import type { Producto } from "../types";

const MenuPage = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { addItem, getTotalItems } = useCart();

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
    try {
      setLoading(true);
      const data = await productosApi.getAll();
      setProductos(data);
    } catch (error) {
      console.error("Error loading productos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group productos by categoria
  const productosByCategoria = productos.reduce((acc, producto) => {
    const cat = getCategoriaDisplay(producto.categoriaName);
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(producto);
    return acc;
  }, {} as Record<string, Producto[]>);

  const categorias = Object.keys(productosByCategoria);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando menú...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Menú</h1>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="lg:grid lg:grid-cols-4 lg:gap-6">
          {/* Menu Content */}
          <div className="lg:col-span-3">
            {categorias.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay productos disponibles</p>
              </div>
            ) : (
              <div className="space-y-8">
                {categorias.map((categoria) => (
                  <div key={categoria}>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b">
                      {categoria}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {productosByCategoria[categoria].map((producto) => (
                        <div
                          key={producto.id}
                          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                        >
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {producto.nombre}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {producto.descripcion}
                          </p>
                          <div className="flex items-center justify-between mt-4">
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
                ))}
              </div>
            )}
          </div>

          {/* Cart Panel - Desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <CartPanel isOpen={true} onClose={() => {}} />
          </div>
        </div>
      </div>

      {/* Cart Panel - Mobile (Slide) */}
      <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default MenuPage;
