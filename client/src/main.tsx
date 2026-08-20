import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/supplier-catalogue-refinement.css";

// Preserve legacy manual-upload links while moving public pages to crawlable URLs.
if (window.location.hash.startsWith("#/")) window.history.replaceState(null, "", window.location.hash.slice(1));

createRoot(document.getElementById("root")!).render(<App />);
