import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { NameEntryModal } from "./components/features/session/NameEntryModal";
import { queryClient } from "./lib/queryClient";
import { HomePage } from "./pages/HomePage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { EventsListPage } from "./pages/EventsListPage";
import { PlayersPage } from "./pages/PlayersPage";
import "./index.css";

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
            <Route path="/players" element={<PlayersPage />} />
          </Routes>
        </AppShell>
        <NameEntryModal />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
