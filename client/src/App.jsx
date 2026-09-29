import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import BuyerBrowse from "./pages/BuyerBrowse.jsx";
import BuyerOrders from "./pages/BuyerOrders.jsx";
import FarmerDashboard from "./pages/FarmerDashboard.jsx";
import FarmerListings from "./pages/FarmerListings.jsx";
import FarmerOrders from "./pages/FarmerOrders.jsx";
import FarmerAnalytics from "./pages/FarmerAnalytics.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminListings from "./pages/AdminListings.jsx";
import SubscriptionPlans from "./pages/SubscriptionPlans.jsx";

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/browse" replace />;
  if (user.role === "farmer") return <Navigate to="/farmer" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/browse" replace />;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<BuyerBrowse />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pricing" element={<SubscriptionPlans />} />

          {/* Buyer */}
          <Route
            path="/orders"
            element={
              <ProtectedRoute role="buyer">
                <BuyerOrders />
              </ProtectedRoute>
            }
          />

          {/* Farmer */}
          <Route
            path="/farmer"
            element={
              <ProtectedRoute role="farmer">
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/listings"
            element={
              <ProtectedRoute role="farmer">
                <FarmerListings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/orders"
            element={
              <ProtectedRoute role="farmer">
                <FarmerOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/analytics"
            element={
              <ProtectedRoute role="farmer">
                <FarmerAnalytics />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute role="admin">
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/listings"
            element={
              <ProtectedRoute role="admin">
                <AdminListings />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-brand-100 bg-white py-4 text-center text-xs text-brand-500">
        AgriLink · MERN demo · Node {`{express+mongoose}`} + React {`{Vite+Tailwind}`}
      </footer>
    </div>
  );
}
