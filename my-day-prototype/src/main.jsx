import React from "react";
import { createRoot } from "react-dom/client";
import { DesktopWidget } from "./DesktopWidget.jsx";
import { App } from "./App.jsx";
import "./styles.css";
import "./playful.css";
import "./goals-reference.css";
import "./inspirations.css";
import "./projects.css";
import "./review.css";
import "./focus.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {window.location.hash === "#desktop-widget" ? <DesktopWidget /> : <App />}
  </React.StrictMode>,
);
