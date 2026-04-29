import { useSyncExternalStore } from "react";

export type ChelseaUserRole = "scout" | "recruitment" | "director";

export interface ChelseaUser {
  id: string;
  displayName: string;
  role: ChelseaUserRole;
  initials: string;
}

// Prototype-only mock roster of Chelsea users for demoing role-gated UI.
const CHELSEA_USERS: ChelseaUser[] = [
  { id: "chelsea-director", displayName: "Laurence Stewart", role: "director", initials: "LS" },
  { id: "chelsea-recruitment", displayName: "Sam Jewell", role: "recruitment", initials: "SJ" },
  { id: "chelsea-scout-1", displayName: "Joe Shields", role: "scout", initials: "JS" },
  { id: "chelsea-scout-2", displayName: "Cyrus Mehrkhah", role: "scout", initials: "CM" },
];

export const useChelseaUsers = () => CHELSEA_USERS;

// ---- Global current-user store (prototype, in-memory) ----

let currentUserId: string = CHELSEA_USERS[1].id; // default: recruitment manager
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => currentUserId;

export const setCurrentUserId = (id: string) => {
  if (currentUserId === id) return;
  currentUserId = id;
  listeners.forEach((l) => l());
};

export const useCurrentUser = (): ChelseaUser => {
  const id = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return CHELSEA_USERS.find((u) => u.id === id) ?? CHELSEA_USERS[0];
};
