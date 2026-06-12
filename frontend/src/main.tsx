import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles.css";
import LoginPage from "./pages/login";
import DiscoverPage from "./pages/discover";
import AnalyzePage from "./pages/analyze";
import SimulatePage from "./pages/simulate";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/simulate" element={<SimulatePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
