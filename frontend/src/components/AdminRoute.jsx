import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/axios";

function AdminRoute({ children }) {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await api.get("/api/auth/me");

        if (response.data.role === "admin") {
          setAllowed(true);
        } else {
          setAllowed(false);
        }
      } catch (error) {
        localStorage.removeItem("access_token");
        setAllowed(false);
      }
    };

    checkAdmin();
  }, []);

  if (allowed === null) {
    return <p>Checking admin access...</p>;
  }

  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default AdminRoute;