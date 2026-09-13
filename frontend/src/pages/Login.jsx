import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem(
        "access_token",
        response.data.access_token
      );

      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand">
          <div className="auth-logo">AF</div>

          <h1>AI Fraud Detection</h1>

          <p>
            Intelligent financial transaction monitoring powered
            by machine learning.
          </p>

          <div className="auth-feature-list">
            <div>✓ AI-based fraud detection</div>
            <div>✓ Real-time transaction analytics</div>
            <div>✓ Risk-level classification</div>
            <div>✓ Secure user authentication</div>
          </div>
        </div>

        <div className="auth-card">
          <p className="dashboard-eyebrow">
            Welcome Back
          </p>

          <h2>Sign in to your account</h2>

          <p className="auth-description">
            Enter your credentials to access the fraud detection
            dashboard.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="name@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account?{" "}
            <Link to="/register">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;