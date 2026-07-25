/** Who-can-do-what, by session name. Identity in this app is a free-text name
 * in localStorage with no real auth — these checks mirror the server-side ones
 * in `backend/app/services/player_service.py`, which are the actual enforcement
 * boundary. The frontend copies only decide what UI to show; every privileged
 * action is re-checked on the backend.
 *
 * Matched case-insensitively and on first name alone, since the session name is
 * whatever the person typed (same convention as the event-creator checks). */

/** Maintains everyone's ratings — the only person who can edit player cards. */
const EDITOR_NAME = "jetmir çenko";

/** Reach the admin portal: delete cards and edit scouting notes. */
const ADMIN_NAMES = ["rezart abazi", "jetmir çenko", "bledar ndreca"];

function matches(sessionName: string, fullName: string): boolean {
  const claimed = sessionName.trim().toLowerCase();
  return claimed === fullName || claimed === fullName.split(" ")[0];
}

export function isEditorSession(sessionName: string): boolean {
  return matches(sessionName, EDITOR_NAME);
}

export function isAdminSession(sessionName: string): boolean {
  return ADMIN_NAMES.some((name) => matches(sessionName, name));
}
