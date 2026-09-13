import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import api from "../api/axios";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const userResponse = await api.get("/api/auth/me");
        setUser(userResponse.data);

        const analyticsResponse = await api.get(
          "/api/transactions/analytics"
        );

        setAnalytics(analyticsResponse.data);
      } catch (error) {
        localStorage.removeItem("access_token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const fraudProbability =
    ((analytics?.average_fraud_probability ?? 0) * 100).toFixed(2);

  const totalAmount =
    Number(analytics?.total_transaction_amount ?? 0).toFixed(2);

  return (
    <div className="page-container">
      <Navbar />

      <div className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">
            AI Financial Fraud Detection
          </p>

          <h1>Dashboard</h1>

          <p>
            Welcome back,{" "}
            <strong>{user?.full_name}</strong>.
            Here is your latest transaction overview.
          </p>
        </div>

        <div className="user-summary">
          <div className="user-avatar">
            {user?.full_name?.charAt(0)?.toUpperCase()}
          </div>

          <div>
            <strong>{user?.full_name}</strong>
            <p>{user?.email}</p>

            <span className="role-badge">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Transaction Analytics</h2>
            <p>
              Real-time statistics from your transaction history.
            </p>
          </div>
        </div>

        <div className="analytics-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <span>Total Transactions</span>
              <span className="stat-icon">↗</span>
            </div>

            <strong className="stat-value">
              {analytics?.total_transactions ?? 0}
            </strong>

            <p>All recorded transactions</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span>Legitimate</span>
              <span className="status-dot success-dot" />
            </div>

            <strong className="stat-value">
              {analytics?.legitimate_transactions ?? 0}
            </strong>

            <p>Verified legitimate transactions</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span>Fraud Detected</span>
              <span className="status-dot danger-dot" />
            </div>

            <strong className="stat-value">
              {analytics?.fraud_transactions ?? 0}
            </strong>

            <p>Transactions classified as fraud</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span>High Risk</span>
              <span className="status-dot warning-dot" />
            </div>

            <strong className="stat-value">
              {analytics?.high_risk_transactions ?? 0}
            </strong>

            <p>Transactions requiring attention</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span>Average Fraud Probability</span>
              <span className="stat-icon">%</span>
            </div>

            <strong className="stat-value">
              {fraudProbability}%
            </strong>

            <p>Average ML fraud confidence</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span>Total Transaction Amount</span>
              <span className="stat-icon">$</span>
            </div>

            <strong className="stat-value">
              {totalAmount}
            </strong>

            <p>Combined value of transactions</p>
          </div>
        </div>
      </div>

      <div className="quick-actions-card">
        <div>
          <h2>Quick Actions</h2>
          <p>
            Create a transaction or run an AI fraud analysis.
          </p>
        </div>

        <div className="quick-actions">
          <button
            onClick={() =>
              navigate("/create-transaction")
            }
          >
            Create Transaction
          </button>

          <button
            className="secondary-button"
            onClick={() =>
              navigate("/predict-transaction")
            }
          >
            Run ML Prediction
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;