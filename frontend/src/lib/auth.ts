/** Google sign-in entry point for the landing page.
 *
 * Intentionally inert: the landing ships on the `frontend-design` branch ahead
 * of real auth, and that branch is not merged until Google login exists. Wire
 * the OAuth redirect here; every "Continue with Google" button calls this. */
export function signInWithGoogle(): void {
  // TODO(auth): start the Google OAuth flow.
}
