import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./App.css";
import "./components/ui/ui.css";
import "./components/ui/custom.css";
import "./components/ui/mood-styles.css";

createRoot(document.getElementById("root")!).render(<App />);
