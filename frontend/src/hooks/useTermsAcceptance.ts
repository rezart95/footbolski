import { useCallback, useEffect, useState } from "react";
import { acceptTerms, getTermsStatus } from "../services/consent.service";
import { useSession } from "./useSession";

const ACCEPTED_VERSION_KEY = "accepted_terms_version";

/** Tracks whether the current user still needs to accept the terms.
 *
 * Acceptance is stored per version rather than as a boolean, so bumping
 * CURRENT_TERMS_VERSION on the backend re-prompts everyone. The local copy is
 * only a cache to avoid a network round-trip on every load; the backend record
 * is the one that counts.
 *
 * While the version is unknown (first load, or the API is unreachable) we do NOT
 * prompt. Showing a legal gate to someone because their connection dropped would
 * lock them out of an app that otherwise works offline. */
export function useTermsAcceptance() {
  const { sessionName } = useSession();
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [acceptedVersion, setAcceptedVersion] = useState<string | null>(() =>
    localStorage.getItem(ACCEPTED_VERSION_KEY)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTermsStatus(sessionName)
      .then((status) => {
        if (cancelled) return;
        setCurrentVersion(status.current_version);
        if (status.accepted) {
          localStorage.setItem(ACCEPTED_VERSION_KEY, status.current_version);
          setAcceptedVersion(status.current_version);
        }
      })
      .catch(() => {
        // Offline or backend down: stay silent rather than gating the app.
      });
    return () => {
      cancelled = true;
    };
  }, [sessionName]);

  const accept = useCallback(
    async (displayName: string) => {
      if (!currentVersion) return true; // nothing to accept yet
      setIsSaving(true);
      setError(null);
      try {
        await acceptTerms(displayName, currentVersion);
        localStorage.setItem(ACCEPTED_VERSION_KEY, currentVersion);
        setAcceptedVersion(currentVersion);
        return true;
      } catch {
        setError("Could not save your acceptance. Check your connection and try again.");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [currentVersion]
  );

  return {
    needsAcceptance: currentVersion !== null && acceptedVersion !== currentVersion,
    accept,
    isSaving,
    error
  };
}
