import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./index.css";
import { HomePage } from "./pages-home";
import { StartPage } from "./pages-start";
import { PayPage } from "./pages-pay";
import { DealPage } from "./pages-deal";
import { VaultPage } from "./pages-vault";
import { StoreProvider } from "./store";
import { Shell } from "./ui";

function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/start" element={<StartPage />} />
            <Route path="/pay/:id" element={<PayPage />} />
            <Route path="/deal/:id" element={<DealPage />} />
            <Route path="/deal/:id/vault" element={<VaultPage />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </StoreProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
