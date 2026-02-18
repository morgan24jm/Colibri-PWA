import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRider } from "../contexts/RiderContext";
import VerifyEmail from "../components/VerifyEmail";
import Loading from "./Loading";

function RiderProtectedWrapper({ children }) {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { rider, setRider } = useRider();

  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/rider/login");
      return;
    }

    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/rider/profile`, {
        headers: {
          token: token,
        },
      })
      .then((response) => {
        if (response.status === 200) {
          const rider = response.data.rider;
          setRider(rider);
          localStorage.setItem(
            "userData",
            JSON.stringify({ type: "rider", data: rider, }));
        }
        setIsVerified(rider.emailVerified)
      })
      .catch((err) => {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        navigate("/rider/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  if (loading) return <Loading />;

  if (isVerified === false) {
    return <VerifyEmail user={rider} role={"rider"} />;
  }

  return <>{children}</>;
}

export default RiderProtectedWrapper;
