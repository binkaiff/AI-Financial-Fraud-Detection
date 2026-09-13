import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import api from "../api/axios";

function FraudAlerts() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const response = await api.get(
          "/api/transactions/alerts"
        );

        setAlerts(response.data);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem(
            "access_token"
          );

          navigate("/login");
          return;
        }

        setError(
          error.response?.data?.detail ||
            "Failed to load fraud alerts."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [navigate]);

  const formatProbability = (
    probability
  ) => {
    if (
      probability === null ||
      probability === undefined
    ) {
      return "N/A";
    }

    return `${(
      probability * 100
    ).toFixed(2)}%`;
  };

  const getRiskClass = (
    riskLevel
  ) => {
    if (riskLevel === "high") {
      return "badge badge-danger";
    }

    if (riskLevel === "medium") {
      return "badge badge-warning";
    }

    if (riskLevel === "low") {
      return "badge badge-success";
    }

    return "badge badge-neutral";
  };

  const getStatusClass = (
    status
  ) => {
    if (status === "fraud") {
      return "badge badge-danger";
    }

    if (status === "legitimate") {
      return "badge badge-success";
    }

    return "badge badge-neutral";
  };

  const formatStatus = (
    status
  ) => {
    if (!status) {
      return "Unknown";
    }

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1)
    );
  };

  const formatRiskLevel = (
    riskLevel
  ) => {
    if (!riskLevel) {
      return "N/A";
    }

    return (
      riskLevel.charAt(0).toUpperCase() +
      riskLevel.slice(1)
    );
  };

  return (
    <div className="page-container">
      <Navbar />

      <div className="page-header">
        <div>
          <p className="dashboard-eyebrow">
            Risk Monitoring
          </p>

          <h1>Fraud & Risk Alerts</h1>

          <p>
            Review transactions that require
            attention based on receipt risk
            screening or fraud detection results.
          </p>
        </div>

        <button
          onClick={() =>
            navigate("/receipt-upload")
          }
        >
          Analyse Receipt
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="alert-summary-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span>
              Total Alerts
            </span>

            <span className="stat-icon">
              !
            </span>
          </div>

          <strong className="stat-value">
            {alerts.length}
          </strong>

          <p>
            Transactions requiring review
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span>
              High Risk
            </span>

            <span className="status-dot danger-dot" />
          </div>

          <strong className="stat-value">
            {
              alerts.filter(
                (alert) =>
                  alert.risk_level ===
                  "high"
              ).length
            }
          </strong>

          <p>
            Transactions assessed as high risk
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span>
              Fraud Detected
            </span>

            <span className="status-dot danger-dot" />
          </div>

          <strong className="stat-value">
            {
              alerts.filter(
                (alert) =>
                  alert.status === "fraud"
              ).length
            }
          </strong>

          <p>
            Transactions classified as fraud
          </p>
        </div>
      </div>

      <div className="transaction-card">
        <div className="table-header">
          <div>
            <h2>
              Transactions Requiring Review
            </h2>

            <p>
              {alerts.length} alert
              {alerts.length !== 1
                ? "s"
                : ""}{" "}
              found
            </p>
          </div>
        </div>

        {loading ? (
          <p>
            Loading fraud and risk alerts...
          </p>
        ) : alerts.length === 0 ? (
          <div className="empty-state">
            <h3>
              No alerts detected
            </h3>

            <p>
              No medium-risk, high-risk or
              fraudulent transactions currently
              require review.
            </p>

            <button
              onClick={() =>
                navigate("/receipt-upload")
              }
            >
              Analyse a Receipt
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>

                  <th>
                    Merchant / Payee
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Location
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    ML Probability
                  </th>

                  <th>
                    Risk Level
                  </th>

                  <th>
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {alerts.map(
                  (alert) => (
                    <tr key={alert.id}>
                      <td>
                        #{alert.id}
                      </td>

                      <td>
                        <strong>
                          {alert.merchant ||
                            "Not provided"}
                        </strong>
                      </td>

                      <td>
                        {Number(
                          alert.amount
                        ).toFixed(2)}
                      </td>

                      <td>
                        {alert.location ||
                          "Not provided"}
                      </td>

                      <td>
                        <span
                          className={getStatusClass(
                            alert.status
                          )}
                        >
                          {formatStatus(
                            alert.status
                          )}
                        </span>
                      </td>

                      <td>
                        {formatProbability(
                          alert.fraud_probability
                        )}
                      </td>

                      <td>
                        <span
                          className={getRiskClass(
                            alert.risk_level
                          )}
                        >
                          {formatRiskLevel(
                            alert.risk_level
                          )}
                        </span>
                      </td>

                      <td>
                        {new Date(
                          alert.created_at
                        ).toLocaleString()}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="info-message">
        Receipt-upload transactions use
        explainable receipt risk screening.
        ML probability is only available for
        transactions analysed by the legacy
        machine-learning model.
      </div>
    </div>
  );
}

export default FraudAlerts;