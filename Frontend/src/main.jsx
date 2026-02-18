import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import UserContext from "./contexts/UserContext.jsx";
import RiderContext from "./contexts/RiderContext.jsx";
import SocketContext from "./contexts/SocketContext.jsx";

createRoot(document.getElementById("root")).render(
  // <StrictMode>
    <SocketContext>
      <UserContext>
        <RiderContext>
          <App />
        </RiderContext>
      </UserContext>
    </SocketContext>
  // </StrictMode>
);

// Register a manual service worker (production)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service worker registered:', reg.scope))
      .catch(err => console.error('SW registration failed:', err))
  })
}
