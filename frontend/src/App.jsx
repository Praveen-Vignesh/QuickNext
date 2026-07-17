import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Nav from "./components/Nav";
import ProtectedRoute from "./components/ProtectedRoute";

import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import RoleSelect from "./pages/RoleSelect";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";

// Split out of the main bundle: the charting library is ~450kB and only vendors
// ever see it. Shoppers — most visitors, often on phones — shouldn't pay to
// download it.
const VendorDashboard = lazy(() => import("./pages/VendorDashboard"));
const VendorCatalog = lazy(() => import("./pages/VendorCatalog"));

export default function App() {
  return (
    // CartProvider is inside AuthProvider because the basket is per-user.
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Nav />
          <main>
            <Suspense
              fallback={<div className="container muted">Loading…</div>}
            >
              <Routes>
                <Route path="/" element={<Catalog />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />

                <Route
                  path="/role"
                  element={
                    <ProtectedRoute>
                      <RoleSelect />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute>
                      <Cart />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/vendor"
                  element={
                    <ProtectedRoute vendorOnly>
                      <VendorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vendor/catalog"
                  element={
                    <ProtectedRoute vendorOnly>
                      <VendorCatalog />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="*"
                  element={
                    <div className="container">
                      <h2>Page not found</h2>
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </main>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
