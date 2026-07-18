import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { queryClient } from "./lib/queryClient";
import { HomePage } from "./pages/HomePage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { EventsListPage } from "./pages/EventsListPage";
import { PitchPage } from "./pages/PitchPage";
import { PlayersPage } from "./pages/PlayersPage";
import { TermsPage } from "./pages/TermsPage";
import "./index.css";

// Reload the page whenever a new service worker takes control so users
// always get the latest version without needing to clear browser data.
if ("serviceWorker" in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!reloading) {
      reloading = true;
      window.location.reload();
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsListPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/events/new" element={<Navigate to="/?create=1" replace />} />
            <Route path="/pitch" element={<PitchPage />} />
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/terms" element={<TermsPage />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
