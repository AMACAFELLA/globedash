import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/Accessibility.css";
/**
 * Dynamically load Google Maps JavaScript API
 * Uses environment variable for API key
 * Supports 3D maps, geometry, and places libraries
 */
const loadGoogleMapsAPI = () => {
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${
    import.meta.env.VITE_MAPS_API_KEY
  }&v=alpha&libraries=maps3d,geometry,places`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
};

loadGoogleMapsAPI();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
