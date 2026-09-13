import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import api from "../api/axios";

function CreateTransaction() {
  const navigate = useNavigate();

  const [transactionType, setTransactionType] = useState("purchase");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [location, setLocation] = useState("");
  const [deviceType, setDeviceType] = useState("mobile");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/api/transactions", {
        transaction_type: transactionType,
        amount: Number(amount),
        merchant,
        location,
        device_type: deviceType,
      });

      setSuccess("Transaction created successfully.");

      setTransactionType("purchase");
      setAmount("");
      setMerchant("");
      setLocation("");
      setDeviceType("mobile");
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.detail ||
          "Failed to create transaction."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Navbar />

      <div className="page-header">
        <div>
          <p className="dashboard-eyebrow">
            Transaction Management
          </p>

          <h1>Create Transaction</h1>

          <p>
            Record a new financial transaction in the system.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => navigate("/transactions")}
        >
          View Transactions
        </button>
      </div>

      <div className="form-card">
        <div className="form-card-header">
          <h2>Transaction Details</h2>

          <p>
            Enter the transaction information below.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Transaction Type</label>

              <select
                value={transactionType}
                onChange={(event) =>
                  setTransactionType(event.target.value)
                }
                required
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
                min="0.01"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-group">
              <label>Merchant</label>

              <input
                type="text"
                value={merchant}
                onChange={(event) =>
                  setMerchant(event.target.value)
                }
                placeholder="e.g. Demo Store"
                required
              />
            </div>

            <div className="form-group">
              <label>Location</label>

              <input
                type="text"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                placeholder="e.g. Colombo"
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
                required
              >
                <option value="mobile">Mobile</option>
                <option value="desktop">Desktop</option>
                <option value="tablet">Tablet</option>
                <option value="pos">POS Terminal</option>
                <option value="atm">ATM</option>
              </select>
            </div>
          </div>

          <div className="info-box">
            This creates a standard transaction with a pending
            status. To analyse a transaction using the ML model,
            use the ML Prediction page.
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Creating Transaction..."
                : "Create Transaction"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate("/predict-transaction")
              }
            >
              Run ML Analysis
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTransaction;