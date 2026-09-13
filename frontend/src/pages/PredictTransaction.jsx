import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import api from "../api/axios";

function PredictTransaction() {
  const navigate = useNavigate();

  const [transactionType, setTransactionType] =
    useState("purchase");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [location, setLocation] = useState("");
  const [deviceType, setDeviceType] = useState("mobile");

  const [time, setTime] = useState("");

  const [features, setFeatures] = useState(
    Array.from({ length: 28 }, () => "")
  );

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFeatureChange = (index, value) => {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setResult(null);
    setLoading(true);

    try {
      const fraudFeatures = {
        Time: Number(time),
        Amount: Number(amount),
      };

      features.forEach((value, index) => {
        fraudFeatures[`V${index + 1}`] = Number(value);
      });

      const response = await api.post(
        "/api/transactions/predict",
        {
          transaction_data: {
            transaction_type: transactionType,
            amount: Number(amount),
            merchant,
            location,
            device_type: deviceType,
          },

          fraud_features: fraudFeatures,
        }
      );

      setResult(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.detail ||
          "Fraud prediction failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const fraudPercentage = result
    ? (result.fraud_probability * 100).toFixed(2)
    : "0.00";

  const resultClass =
    result?.status === "fraud"
      ? "prediction-result prediction-danger"
      : "prediction-result prediction-success";

  return (
    <div className="page-container">
      <Navbar />

      <div className="page-header">
        <div>
          <p className="dashboard-eyebrow">
            Machine Learning Analysis
          </p>

          <h1>Fraud Prediction</h1>

          <p>
            Analyse a transaction using the trained fraud
            detection model.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => navigate("/transactions")}
        >
          Transaction History
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-card">
          <div className="form-card-header">
            <h2>Transaction Information</h2>

            <p>
              Enter the transaction details associated with the
              ML feature data.
            </p>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Transaction Type</label>

              <select
                value={transactionType}
                onChange={(event) =>
                  setTransactionType(event.target.value)
                }
              >
                <option value="purchase">Purchase</option>
                <option value="transfer">Transfer</option>
                <option value="payment">Payment</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="deposit">Deposit</option>
              </select>
            </div>

            <div className="form-group">
              <label>Amount</label>

              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                placeholder="149.62"
                required
              />
            </div>

            <div className="form-group">
              <label>Merchant</label>

              <input
                value={merchant}
                onChange={(event) =>
                  setMerchant(event.target.value)
                }
                placeholder="Merchant name"
                required
              />
            </div>

            <div className="form-group">
              <label>Location</label>

              <input
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                placeholder="Transaction location"
                required
              />
            </div>

            <div className="form-group">
              <label>Device Type</label>

              <select
                value={deviceType}
                onChange={(event) =>
                  setDeviceType(event.target.value)
                }
              >
                <option value="mobile">Mobile</option>
                <option value="desktop">Desktop</option>
                <option value="tablet">Tablet</option>
                <option value="pos">POS Terminal</option>
                <option value="atm">ATM</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <h2>Model Features</h2>

            <p>
              The ULB Credit Card Fraud Detection dataset uses
              anonymised PCA features V1–V28.
            </p>
          </div>

          <div className="info-box">
            V1–V28 are anonymised numerical features supplied by
            the research dataset. They are not merchant, device
            or location values.
          </div>

          <div className="feature-grid">
            <div className="form-group">
              <label>Time</label>

              <input
                type="number"
                step="any"
                min="0"
                value={time}
                onChange={(event) =>
                  setTime(event.target.value)
                }
                required
              />
            </div>

            {features.map((value, index) => (
              <div
                className="form-group"
                key={index}
              >
                <label>V{index + 1}</label>

                <input
                  type="number"
                  step="any"
                  value={value}
                  onChange={(event) =>
                    handleFeatureChange(
                      index,
                      event.target.value
                    )
                  }
                  required
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Analysing Transaction..."
                : "Analyse Transaction"}
            </button>
          </div>
        </div>
      </form>

      {result && (
        <div className={resultClass}>
          <div className="prediction-result-header">
            <div>
              <p className="dashboard-eyebrow">
                Analysis Complete
              </p>

              <h2>
                {result.status === "fraud"
                  ? "Suspicious Transaction Detected"
                  : "Transaction Appears Legitimate"}
              </h2>
            </div>

            <span
              className={
                result.status === "fraud"
                  ? "badge badge-danger"
                  : "badge badge-success"
              }
            >
              {result.status}
            </span>
          </div>

          <div className="prediction-grid">
            <div>
              <span>Transaction ID</span>
              <strong>#{result.id}</strong>
            </div>

            <div>
              <span>Merchant</span>
              <strong>{result.merchant}</strong>
            </div>

            <div>
              <span>Amount</span>
              <strong>
                {Number(result.amount).toFixed(2)}
              </strong>
            </div>

            <div>
              <span>Fraud Probability</span>
              <strong>{fraudPercentage}%</strong>
            </div>

            <div>
              <span>Risk Level</span>

              <strong>
                {result.risk_level}
              </strong>
            </div>

            <div>
              <span>Location</span>
              <strong>{result.location}</strong>
            </div>
          </div>

          <div className="form-actions">
            <button
              onClick={() =>
                navigate("/transactions")
              }
            >
              View Transaction
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                navigate("/fraud-alerts")
              }
            >
              View Fraud Alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PredictTransaction;