import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import Dashboard from "./pages/Dashboard";
import ModulosPage from "./pages/ModulosPage";
import FormulariosPage from "./pages/FormulariosPage";
import AccionesPage from "./pages/AccionesPage";
import GruposPage from "./pages/GruposPage";
import UsuariosPage from "./pages/UsuariosPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import MenuPage from "./pages/MenuPage";
import OrderFoodPage from "./pages/OrderFoodPage";
import MesasPage from "./pages/MesasPage";
import AdminPedidosMesaPage from "./pages/AdminPedidosMesaPage";
import MesaHistoryPage from "./pages/MesaHistoryPage";
import ProductosPage from "./pages/ProductosPage";
import CategoriasPage from "./pages/CategoriasPage";
import ReportesPage from "./pages/ReportesPage";
import Layout from "./components/Layout";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/modulos"
              element={
                <ProtectedRoute verAccion="Modulos.Ver Modulos">
                  <Layout>
                    <ModulosPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/formularios"
              element={
                <ProtectedRoute verAccion="Formularios.Ver Formularios">
                  <Layout>
                    <FormulariosPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/acciones"
              element={
                <ProtectedRoute verAccion="Acciones.Ver Acciones">
                  <Layout>
                    <AccionesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/grupos"
              element={
                <ProtectedRoute verAccion="Grupos.Ver Grupos">
                  <Layout>
                    <GruposPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute verAccion="Usuarios.Ver Usuarios">
                  <Layout>
                    <UsuariosPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/menu"
              element={
                <ProtectedRoute>
                  <MenuPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-food"
              element={
                <CartProvider>
                  <OrderFoodPage />
                </CartProvider>
              }
            />
            <Route
              path="/mesas"
              element={
                <ProtectedRoute verAccion="Mesas.Ver Pedidos">
                  <Layout>
                    <MesasPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/productos"
              element={
                <ProtectedRoute verAccion="Productos.Ver Productos">
                  <Layout>
                    <ProductosPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/categorias"
              element={
                <ProtectedRoute verAccion="Categorias.Ver Categorias">
                  <Layout>
                    <CategoriasPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mesas/:numeroMesa/pedidos"
              element={
                <ProtectedRoute verAccion="Mesas.Ver Pedidos">
                  <Layout>
                    <AdminPedidosMesaPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mesas/:numeroMesa/historial"
              element={
                <ProtectedRoute verAccion="Mesas.Ver Historial de Pedidos">
                  <Layout>
                    <MesaHistoryPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reportes"
              element={
                <ProtectedRoute verAccion="Reportes.Ver Reportes">
                  <Layout>
                    <ReportesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
