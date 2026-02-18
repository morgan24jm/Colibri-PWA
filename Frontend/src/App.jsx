import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import {
  GetStarted,
  UserLogin,
  RiderLogin,
  UserHomeScreen,
  RiderHomeScreen,
  UserProtectedWrapper,
  RiderProtectedWrapper,
  UserSignup,
  RiderSignup,
  RideHistory,
  UserEditProfile,
  UserIndex,
  RiderEditProfile,
  Error,
  ChatScreen,
  VerifyEmail,
  ResetPassword,
  ForgotPassword,
  RideShare
} from "./screens/";
import { logger } from "./utils/logger";
import { SocketDataContext } from "./contexts/SocketContext";
import { useEffect, useContext } from "react";
import { ChevronLeft, Trash2 } from "lucide-react";

function App() {
  return (
    <div className="w-full h-dvh flex items-center">
      <div className="relative w-full sm:min-w-96 sm:w-96 h-full bg-white overflow-hidden">
        {/* Force Reset Button to clear data */}
        <div className="absolute top-36 -right-11 opacity-20 hover:opacity-100 z-50 flex items-center p-1 PL-0 gap-1 bg-zinc-50 border-2 border-r-0 border-gray-300 hover:-translate-x-11 rounded-l-md transition-all duration-300">
          <ChevronLeft />
          <button className="flex justify-center items-center w-10 h-10 rounded-lg border-2 border-red-300 bg-red-200 text-red-500" onClick={() => {
            alert("Esto limpiará todos tus datos y cerrará tu sesión para arreglar la app en caso de corrupción. Confirma para continuar.");
            const confirmation = confirm("¿Estás seguro de que deseas reiniciar la app?")

            if (confirmation === true) {
              localStorage.clear();
              window.location.reload();
            }
          }}>
            <Trash2 strokeWidth={1.8} width={18} />
          </button>
        </div>

        <BrowserRouter>
          <LoggingWrapper />
          <Routes>
            <Route path="/" element={<GetStarted />} />
            <Route
              path="/user/home"
              element={
                <UserProtectedWrapper>
                  <UserHomeScreen />
                </UserProtectedWrapper>
              }
            />
            <Route
              path="/user/index"
              element={
                <UserProtectedWrapper>
                  <UserIndex />
                </UserProtectedWrapper>
              }
            />
            <Route path="/login" element={<UserLogin />} />
            <Route path="/signup" element={<UserSignup />} />
            <Route
              path="/user/edit-profile"
              element={
                <UserProtectedWrapper>
                  <UserEditProfile />
                </UserProtectedWrapper>
              }
            />
            <Route
              path="/user/rides"
              element={
                <UserProtectedWrapper>
                  <RideHistory />
                </UserProtectedWrapper>
              }
            />

            <Route
              path="/rider/home"
              element={
                <RiderProtectedWrapper>
                  <RiderHomeScreen />
                </RiderProtectedWrapper>
              }
            />
            <Route path="/rider/login" element={<RiderLogin />} />
            <Route path="/rider/signup" element={<RiderSignup />} />
            <Route
              path="/rider/edit-profile"
              element={
                <RiderProtectedWrapper>
                  <RiderEditProfile />
                </RiderProtectedWrapper>
              }
            />
            <Route
              path="/rider/rides"
              element={
                <RiderProtectedWrapper>
                  <RideHistory />
                </RiderProtectedWrapper>
              }
            />
            <Route path="/:userType/chat/:rideId" element={<ChatScreen />} />
            <Route path="/ride/share/:rideId" element={<RideShare />} />
            <Route path="/:userType/verify-email/" element={<VerifyEmail />} />
            <Route path="/:userType/forgot-password/" element={<ForgotPassword />} />
            <Route path="/:userType/reset-password/" element={<ResetPassword />} />

            <Route path="*" element={<Error />} />
          </Routes>
        </BrowserRouter>
      </div>
      <div className="hidden sm:block w-full h-full bg-[#eae1fe] overflow-hidden  select-none border-l-2 border-black">
        <img
          className="h-full object-cover mx-auto  select-none "
          src="https://img.freepik.com/free-vector/taxi-app-service-concept_23-2148497472.jpg?semt=ais_hybrid"
          alt="Side image"
        />
      </div>
    </div>
  );
}

export default App;

function LoggingWrapper() {
  const location = useLocation();
  const { socket } = useContext(SocketDataContext);

  useEffect(() => {
    if (socket) {
      logger(socket);
    }
  }, [location.pathname, location.search]);
  return null;
}