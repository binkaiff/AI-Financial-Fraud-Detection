import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import api from "../api/axios";

function Settings() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get("/api/auth/me");
        setUser(response.data);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("access_token");
          navigate("/login");
          return;
        }

        setError(
          error.response?.data?.detail ||
            "Unable to load account settings."
        );
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  const handleResetData = async () => {
    setResetting(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.delete(
        "/api/transactions/reset"
      );

      setSuccess(
        `${response.data.message} Deleted ${response.data.deleted_transactions} transaction(s) and ${response.data.deleted_receipts} receipt record(s).`
      );

      setShowResetModal(false);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.detail ||
          "Unable to reset your data."
      );
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />

      <div className="page-header">
        <div>
          <p className="dashboard-eyebrow">
            Account Preferences
          </p>

          <h1>Settings</h1>

          <p>
            Review your account information and manage the
            transaction data stored for your profile.
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

      <div className="settings-grid">
        <section className="form-card settings-card">
          <div className="form-card-header">
            <p className="dashboard-eyebrow">
              Profile
            </p>

            <h2>Account Information</h2>

            <p>
              These details identify the account currently
              signed in to FraudGuard.
            </p>
          </div>

          <div className="settings-profile-list">
            <div>
              <span>Full Name</span>
              <strong>{user?.full_name || "-"}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{user?.email || "-"}</strong>
            </div>

            <div>
              <span>Role</span>
              <strong className="settings-role">
                {user?.role || "user"}
              </strong>
            </div>
          </div>
        </section>

        <section className="form-card settings-card danger-zone-card">
          <div className="form-card-header">
            <p className="dashboard-eyebrow danger-eyebrow">
              Data Controls
            </p>

            <h2>Reset My Data</h2>

            <p>
              Remove all transactions, receipt records and
              uploaded receipt files that belong to your account.
              Your login account will stay active.
            </p>
          </div>

          <div className="danger-zone-content">
            <div>
              <strong>Start with a clean account</strong>
              <p>
                This is useful for demos or when you want to test
                the application again as a fresh user.
              </p>
            </div>

            <button
              type="button"
              className="danger-button"
              onClick={() => setShowResetModal(true)}
            >
              Reset My Data
            </button>
          </div>
        </section>
      </div>

      {showResetModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => {
            if (!resetting) {
              setShowResetModal(false);
            }
          }}
        >
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-data-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="confirm-modal-icon danger-modal-icon">
              !
            </div>

            <h2 id="reset-data-title">
              Reset all your data?
            </h2>

            <p>
              This permanently deletes your transactions,
              confirmed receipt records and uploaded receipt files.
              Your account and login will not be deleted.
            </p>

            <div className="confirm-modal-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={resetting}
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger-button"
                disabled={resetting}
                onClick={handleResetData}
              >
                {resetting
                  ? "Resetting..."
                  : "Yes, Reset My Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
