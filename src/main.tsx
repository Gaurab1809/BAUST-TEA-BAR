import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Persist dark mode preference
const stored = localStorage.getItem("theme");
if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(<App />);
