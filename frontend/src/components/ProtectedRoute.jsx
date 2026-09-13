import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/axios";

function ProtectedRoute({ children }) {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        await api.get("/api/auth/me");
        setAllowed(true);
      } catch (error) {
        localStorage.removeItem("access_token");
        setAllowed(false);
      }
    };

    checkAuthentication();
  }, []);

  if (allowed === null) {
    return <p>Checking authentication...</p>;
  }

  if (!allowed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;