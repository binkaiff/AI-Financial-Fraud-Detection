import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import api from "../api/axios";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get(
          "/api/auth/me"
        );

        setUser(response.data);
      } catch (error) {
        setUser(null);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleNavigate = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setMenuOpen(false);
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      label: "Upload Receipt",
      path: "/receipt-upload",
    },
    {
      label: "Create Transaction",
      path: "/create-transaction",
    },
    {
      label: "Transactions",
      path: "/transactions",
    },
    {
      label: "Fraud Alerts",
      path: "/fraud-alerts",
    },
    {
      label: "Settings",
      path: "/settings",
    },
  ];

  if (user?.role === "admin") {
    navItems.push({
      label: "Admin",
      path: "/admin",
    });
  }

  return (
    <nav className="app-navbar">
      <div className="navbar-top">
        <button
          type="button"
          className="navbar-brand"
          onClick={() =>
            handleNavigate("/dashboard")
          }
        >
          <span className="navbar-brand-icon">
            AI
          </span>

          <span className="navbar-brand-text">
            FraudGuard
          </span>
        </button>

        <button
          type="button"
          className="navbar-menu-toggle"
          onClick={() =>
            setMenuOpen((previous) => !previous)
          }
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span
            className={
              menuOpen
                ? "menu-icon menu-icon-open"
                : "menu-icon"
            }
          >
            {menuOpen ? "×" : "☰"}
          </span>
        </button>
      </div>

      <div
        className={
          menuOpen
            ? "navbar-links navbar-links-open"
            : "navbar-links"
        }
      >
        {navItems.map((item) => (
          <button
            key={item.path}
            type="button"
            className={
              isActive(item.path)
                ? "navbar-link navbar-link-active"
                : "navbar-link"
            }
            onClick={() =>
              handleNavigate(item.path)
            }
          >
            {item.label}
          </button>
        ))}

        <button
          type="button"
          className="navbar-link navbar-logout"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;