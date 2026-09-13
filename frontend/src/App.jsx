import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";

import AdminDashboard from "./pages/AdminDashboard";
import CreateTransaction from "./pages/CreateTransaction";
import Dashboard from "./pages/Dashboard";
import FraudAlerts from "./pages/FraudAlerts";
import Login from "./pages/Login";
import PredictTransaction from "./pages/PredictTransaction";
import ReceiptUpload from "./pages/ReceiptUpload";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import Transactions from "./pages/Transactions";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/receipt-upload"
          element={
            <ProtectedRoute>
              <ReceiptUpload />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/fraud-alerts"
          element={
            <ProtectedRoute>
              <FraudAlerts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-transaction"
          element={
            <ProtectedRoute>
              <CreateTransaction />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/predict-transaction"
          element={
            <ProtectedRoute>
              <PredictTransaction />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;