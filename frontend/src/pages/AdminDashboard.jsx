import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import api from "../api/axios";

function AdminDashboard() {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadAdminDashboard = async () => {
    try {
      const analyticsResponse = await api.get(
        "/api/admin/analytics"
      );

      const usersResponse = await api.get(
        "/api/admin/users"
      );

      setAnalytics(analyticsResponse.data);
      setUsers(usersResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      if (error.response?.status === 403) {
        navigate("/dashboard");
        return;
      }

      setError(
        error.response?.data?.detail ||
          "Failed to load admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteUser = async () => {
    if (!selectedUser) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      await api.delete(
        `/api/admin/users/${selectedUser.id}`
      );

      setSelectedUser(null);
      setSuccess(
        `${selectedUser.full_name}'s account and associated data were deleted successfully.`
      );

      await loadAdminDashboard();
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      if (error.response?.status === 403) {
        setError(
          error.response?.data?.detail ||
            "This account cannot be deleted."
        );
      } else {
        setError(
          error.response?.data?.detail ||
            "Unable to delete the user."
        );
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />

      <div className="page-header">
        <div>
          <p className="dashboard-eyebrow">
            Administration
          </p>

          <h1>Admin Dashboard</h1>

          <p>
            Monitor users, transactions and fraud detection
            activity across the system.
          </p>
        </div>
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

      {!error && (
        <>
          <div className="admin-analytics-grid">
            <div className="stat-card">
              <div className="stat-card-header">
                <span>Total Users</span>
                <span className="stat-icon">U</span>
              </div>

              <strong className="stat-value">
                {analytics?.total_users ?? 0}
              </strong>

              <p>Registered system users</p>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span>Total Transactions</span>
                <span className="stat-icon">T</span>
              </div>

              <strong className="stat-value">
                {analytics?.total_transactions ?? 0}
              </strong>

              <p>Transactions across all users</p>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span>Legitimate</span>
                <span className="status-dot success-dot" />
              </div>

              <strong className="stat-value">
                {analytics?.legitimate_transactions ?? 0}
              </strong>

              <p>Legitimate transactions</p>
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

              <p>High-risk transactions</p>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span>Total Amount</span>
                <span className="stat-icon">$</span>
              </div>

              <strong className="stat-value">
                {Number(
                  analytics?.total_transaction_amount ?? 0
                ).toFixed(2)}
              </strong>

              <p>Combined transaction value</p>
            </div>
          </div>

          <div className="transaction-card">
            <div className="table-header">
              <div>
                <h2>User Management</h2>

                <p>
                  {users.length} user
                  {users.length !== 1 ? "s" : ""} registered
                </p>
              </div>
            </div>

            {users.length === 0 ? (
              <div className="empty-state">
                <h3>No users found</h3>
                <p>
                  No registered users are currently available.
                </p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>#{user.id}</td>

                        <td>
                          <strong>{user.full_name}</strong>
                        </td>

                        <td>{user.email}</td>

                        <td>
                          <span
                            className={
                              user.role === "admin"
                                ? "badge badge-warning"
                                : "badge badge-neutral"
                            }
                          >
                            {user.role}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              user.is_active
                                ? "badge badge-success"
                                : "badge badge-danger"
                            }
                          >
                            {user.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          {new Date(
                            user.created_at
                          ).toLocaleString()}
                        </td>

                        <td>
                          {user.role === "admin" ? (
                            <span className="protected-label">
                              Protected
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="table-action-button table-delete-button"
                              onClick={() => setSelectedUser(user)}
                            >
                              Delete User
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {selectedUser && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => {
            if (!deleting) {
              setSelectedUser(null);
            }
          }}
        >
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="confirm-modal-icon danger-modal-icon">
              !
            </div>

            <h2 id="delete-user-title">
              Delete {selectedUser.full_name}?
            </h2>

            <p>
              This permanently deletes the user account, all of
              their transactions, receipt records and uploaded
              receipt files. This action cannot be undone.
            </p>

            <div className="delete-preview delete-preview-user">
              <span>{selectedUser.full_name}</span>
              <strong>{selectedUser.email}</strong>
            </div>

            <div className="confirm-modal-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={deleting}
                onClick={() => setSelectedUser(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger-button"
                disabled={deleting}
                onClick={handleDeleteUser}
              >
                {deleting ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
