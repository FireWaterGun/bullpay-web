import { createRoot } from "react-dom/client";
import AppRouter from "./routes/AppRouter";
import "./i18n";

createRoot(document.getElementById("root")).render(<AppRouter />);
