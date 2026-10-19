import { ClerkProvider } from "@clerk/react";
import axios from "axios";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </React.StrictMode>,
);

// Ensure axios sends cookies (Clerk session) to backend so server-side
// Clerk middleware can validate sessions during API calls.
axios.defaults.withCredentials = true;