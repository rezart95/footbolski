import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { startAnalytics, trackPageView } from "../lib/analytics";

/** Starts GA once and reports a page view on every route change. */
export function useAnalytics() {
  const { pathname } = useLocation();

  useEffect(() => {
    startAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
}
