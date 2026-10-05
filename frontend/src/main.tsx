import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { queryClient } from "./lib/queryClient";
import { HomePage } from "./pages/HomePage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { EventsListPage } from "./pages/EventsListPage";
import { InviteConfirmPage } from "./pages/InviteConfirmPage";
import { MotmBallotPage } from "./pages/MotmBallotPage";
import { PlayersPage } from "./pages/PlayersPage";
import { AdminPage } from "./pages/AdminPage";
import { TermsPage } from "./pages/TermsPage";
import { YouPage } from "./pages/YouPage";
import { LandingPage } from "./pages/LandingPage";
import { useSession } from "./hooks/useSession";
import { useAnalytics } from "./hooks/useAnalytics";
import { AnalyticsConsent } from "./components/features/analytics/AnalyticsConsent";
import "@fontsource-variable/anybody/standard.css";
import "@fontsource-variable/schibsted-grotesk";
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

/** Routes reached from a WhatsApp link sit OUTSIDE AppShell.
 *
 * They open in the in-app browser, where AppShell's non-dismissible install
 * banner would sit above the answer the player tapped for, in a browser that
 * often cannot install a PWA at all. They use the bare LinkLayout instead. */
function App() {
  const { isSessionSet } = useSession();
  useAnalytics();

  return (
    <Routes>
      <Route path="/invite/:token" element={<InviteConfirmPage />} />
      <Route path="/motm/:token" element={<MotmBallotPage />} />
      {/* The root is the public landing page for anyone this browser doesn't
          know yet; members (and the installed PWA, which always has a name)
          go straight to the app's home. */}
      {!isSessionSet && <Route path="/" element={<LandingPage />} />}
      <Route
        path="*"
        element={
          <AppShell>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventsListPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/events/new" element={<Navigate to="/?create=1" replace />} />
              {/* The Pitch tab was retired: the formation editor lives in the match sheet. */}
              <Route path="/pitch" element={<Navigate to="/" replace />} />
              <Route path="/you" element={<YouPage />} />
              <Route path="/players" element={<PlayersPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/terms" element={<TermsPage />} />
            </Routes>
          </AppShell>
        }
      />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <AnalyticsConsent />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
