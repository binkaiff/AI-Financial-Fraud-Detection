import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import api from "../api/axios";

function Transactions() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [filters, setFilters] = useState({
    transaction_type: "",
    merchant: "",
    location: "",
    status_filter: "",
    risk_level: "",
    min_amount: "",
    max_amount: "",
  });

  const loadTransactions = async (customFilters = filters) => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      Object.entries(customFilters).forEach(([key, value]) => {
        if (value !== "") {
          params[key] = value;
        }
      });

      const response = await api.get("/api/transactions", {
        params,
      });

      setTransactions(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.detail ||
          "Failed to load transactions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    loadTransactions(filters);
  };

  const handleReset = () => {
    const emptyFilters = {
      transaction_type: "",
      merchant: "",
      location: "",
      status_filter: "",
      risk_level: "",
      min_amount: "",
      max_amount: "",
    };

    setFilters(emptyFilters);
    loadTransactions(emptyFilters);
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      await api.delete(
        `/api/transactions/${selectedTransaction.id}`
      );

      setTransactions((previous) =>
        previous.filter(
          (transaction) =>
            transaction.id !== selectedTransaction.id
        )
      );

      setSuccess(
        `Transaction #${selectedTransaction.id} was deleted successfully.`
      );

      setSelectedTransaction(null);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.detail ||
          "Unable to delete the transaction."
      );
    } finally {
      setDeleting(false);
    }
  };

  const formatProbability = (probability) => {
    if (probability === null || probability === undefined) {
      return "-";
    }

    return `${(probability * 100).toFixed(2)}%`;
  };

  const getStatusClass = (status) => {
    if (status === "fraud") {
      return "badge badge-danger";
    }

    if (status === "legitimate") {
      return "badge badge-success";
    }

    return "badge badge-neutral";
  };

  const getRiskClass = (riskLevel) => {
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

  return (
    <div className="page-container">
      <Navbar />

      <div className="page-header">
        <div>
          <p className="dashboard-eyebrow">
            Transaction Management
          </p>

          <h1>Transactions</h1>

          <p>
            Review, search, filter and manage your financial
            transaction history.
          </p>
        </div>

        <button
          onClick={() => navigate("/create-transaction")}
        >
          + Create Transaction
        </button>
      </div>

      <div className="filter-card">
        <div className="section-heading">
          <div>
            <h2>Filters</h2>
            <p>
              Narrow transactions by type, status, risk or amount.
            </p>
          </div>
        </div>

        <form onSubmit={handleFilterSubmit}>
          <div className="filter-grid">
            <div>
              <label>Transaction Type</label>

              <input
                name="transaction_type"
                value={filters.transaction_type}
                onChange={handleFilterChange}
                placeholder="e.g. purchase"
              />
            </div>

            <div>
              <label>Merchant</label>

              <input
                name="merchant"
                value={filters.merchant}
                onChange={handleFilterChange}
                placeholder="Search merchant"
              />
            </div>

            <div>
              <label>Location</label>

              <input
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="Search location"
              />
            </div>

            <div>
              <label>Status</label>

              <select
                name="status_filter"
                value={filters.status_filter}
                onChange={handleFilterChange}
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="legitimate">Legitimate</option>
                <option value="fraud">Fraud</option>
              </select>
            </div>

            <div>
              <label>Risk Level</label>

              <select
                name="risk_level"
                value={filters.risk_level}
                onChange={handleFilterChange}
              >
                <option value="">All risk levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label>Minimum Amount</label>

              <input
                type="number"
                min="0"
                step="0.01"
                name="min_amount"
                value={filters.min_amount}
                onChange={handleFilterChange}
                placeholder="0.00"
              />
            </div>

            <div>
              <label>Maximum Amount</label>

              <input
                type="number"
                min="0"
                step="0.01"
                name="max_amount"
                value={filters.max_amount}
                onChange={handleFilterChange}
                placeholder="1000.00"
              />
            </div>
          </div>

          <div className="filter-actions">
            <button type="submit">
              Apply Filters
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={handleReset}
            >
              Reset Filters
            </button>
          </div>
        </form>
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

      <div className="transaction-card">
        <div className="table-header">
          <div>
            <h2>Transaction History</h2>
            <p>
              {transactions.length} transaction
              {transactions.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {loading ? (
          <p>Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <h3>No transactions found</h3>
            <p>
              Create a transaction or upload a receipt to begin
              building your history.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Merchant</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Fraud Probability</th>
                  <th>Risk</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>#{transaction.id}</td>

                    <td>
                      <strong>{transaction.merchant}</strong>
                    </td>

                    <td>{transaction.transaction_type}</td>

                    <td>
                      {Number(transaction.amount).toFixed(2)}
                    </td>

                    <td>{transaction.location}</td>

                    <td>
                      <span
                        className={getStatusClass(
                          transaction.status
                        )}
                      >
                        {transaction.status}
                      </span>
                    </td>

                    <td>
                      {formatProbability(
                        transaction.fraud_probability
                      )}
                    </td>

                    <td>
                      <span
                        className={getRiskClass(
                          transaction.risk_level
                        )}
                      >
                        {transaction.risk_level || "N/A"}
                      </span>
                    </td>

                    <td>
                      {new Date(
                        transaction.created_at
                      ).toLocaleString()}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="table-action-button table-delete-button"
                        onClick={() =>
                          setSelectedTransaction(transaction)
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTransaction && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => {
            if (!deleting) {
              setSelectedTransaction(null);
            }
          }}
        >
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-transaction-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="confirm-modal-icon danger-modal-icon">
              !
            </div>

            <h2 id="delete-transaction-title">
              Delete transaction #{selectedTransaction.id}?
            </h2>

            <p>
              This permanently removes this transaction and any
              linked receipt record or uploaded receipt file.
            </p>

            <div className="delete-preview">
              <span>{selectedTransaction.merchant}</span>
              <strong>
                {Number(selectedTransaction.amount).toFixed(2)}
              </strong>
            </div>

            <div className="confirm-modal-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={deleting}
                onClick={() => setSelectedTransaction(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger-button"
                disabled={deleting}
                onClick={handleDeleteTransaction}
              >
                {deleting ? "Deleting..." : "Delete Transaction"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;
