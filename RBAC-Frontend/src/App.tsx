import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import ProtectedRoute from "./components/layout/protectedRoute";

// Import Global Notification System Elements
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Branches from "./pages/Branches";
import Products from "./pages/Products";
import CategoryFilteredProducts from "./pages/CategoryFilteredProducts";
import Variations from "./pages/Variations";
import Orders from "./pages/Orders"; // 👈 Integrated new orders dashboard screen

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Main Management Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute>
                <Roles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/branches"
            element={
              <ProtectedRoute>
                <Branches />
              </ProtectedRoute>
            }
          />

          {/* Protected Products Catalog & Subscreen Links */}
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/categories"
            element={
              <ProtectedRoute>
                <CategoryFilteredProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/variations"
            element={
              <ProtectedRoute>
                <Variations />
              </ProtectedRoute>
            }
          />

          {/* Protected Live POS Orders Ledger Terminal Screen */}
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />

          {/* Fallback Catch-All Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        {/* Global Toast Notification Engine Container Mount */}
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          pauseOnHover
          theme="colored"
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
