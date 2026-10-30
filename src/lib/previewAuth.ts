import { User } from "firebase/auth";

/**
 * vercel preview builds set VITE_PREVIEW_AUTH=true. google sign-in can't run on
 * preview urls (firebase won't authorize them), so this swaps in a fake local
 * user and turns writes into no-ops so prod data is never touched.
 */
export const IS_PREVIEW_AUTH = import.meta.env.VITE_PREVIEW_AUTH === "true";

const STORAGE_KEY = "previewSignedIn";

// only the fields the app actually reads; firebase methods are never called
const PREVIEW_USER = {
  uid: "preview-user",
  displayName: "Preview User",
  email: "preview@g.ucla.edu",
  photoURL: null,
  isAnonymous: false,
} as unknown as User;

const listeners = new Set<(user: User | null) => void>();

const currentUser = () =>
  localStorage.getItem(STORAGE_KEY) === "true" ? PREVIEW_USER : null;

export const subscribeToPreviewAuth = (
  callback: (user: User | null) => void,
) => {
  listeners.add(callback);
  callback(currentUser());
  return () => {
    listeners.delete(callback);
  };
};

export const setPreviewSignedIn = (signedIn: boolean) => {
  if (signedIn) localStorage.setItem(STORAGE_KEY, "true");
  else localStorage.removeItem(STORAGE_KEY);
  listeners.forEach((cb) => cb(currentUser()));
};

/** returns true (and logs) when a write should be skipped in preview mode. */
export const skipPreviewWrite = (action: string) => {
  if (!IS_PREVIEW_AUTH) return false;
  console.info(`[preview] skipped ${action}`);
  return true;
};
