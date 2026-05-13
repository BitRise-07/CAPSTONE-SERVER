import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import Analysis from "./pages/Analysis";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminUsers from "./pages/admin/AdminUsers";
import ScoringGuide from "./pages/admin/ScoringGuide";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Simulator from "./pages/Simulator";
import Transactions from "./pages/Transactions";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/auth" replace />;
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  return user?.accountType === "Admin" ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="simulate" element={<Simulator />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="analysis" element={<Analysis />} />
        <Route path="profile" element={<Profile />} />
        <Route
          path="admin"
          element={
            <AdminOnly>
              <AdminOverview />
            </AdminOnly>
          }
        />
        <Route
          path="admin/users"
          element={
            <AdminOnly>
              <AdminUsers />
            </AdminOnly>
          }
        />
        <Route
          path="admin/users/:userId"
          element={
            <AdminOnly>
              <AdminUserDetail />
            </AdminOnly>
          }
        />
        <Route
          path="admin/transactions"
          element={
            <AdminOnly>
              <AdminTransactions />
            </AdminOnly>
          }
        />
        <Route
          path="admin/scoring"
          element={
            <AdminOnly>
              <ScoringGuide />
            </AdminOnly>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
