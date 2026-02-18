import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "./Loading";

function UserProtectedWrapper({ children }) {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  if (!token) {
    return <Loading />;
  }

  return <>{children}</>;
}


export default UserProtectedWrapper;
