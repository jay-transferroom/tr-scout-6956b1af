import { useAuth } from "@/contexts/AuthContext";

export type ChelseaUserRole = "scout" | "recruitment" | "director";

export interface ChelseaUser {
  id: string;
  email: string;
  displayName: string;
  role: ChelseaUserRole;
  initials: string;
}

// Prototype-only roster of Chelsea demo users — mirrors the Demo Accounts
// available on the sign-in screen. Keyed by email so the active user
// follows whichever demo account is currently signed in.
const CHELSEA_USERS: ChelseaUser[] = [
  {
    id: "demo-scout-1",
    email: "scout@demo.com",
    displayName: "Oliver Smith",
    role: "scout",
    initials: "OS",
  },
  {
    id: "demo-scout-2",
    email: "scout2@demo.com",
    displayName: "Emma Johnson",
    role: "scout",
    initials: "EJ",
  },
  {
    id: "demo-manager",
    email: "manager@demo.com",
    displayName: "Dave Chester",
    role: "recruitment",
    initials: "DC",
  },
];

const FALLBACK_USER = CHELSEA_USERS[2]; // Recruitment Manager

export const useChelseaUsers = () => CHELSEA_USERS;

/**
 * Returns the Chelsea demo user that matches the currently signed-in account.
 * Falls back to the recruitment manager when no match is found (e.g. running
 * the prototype without auth wired up).
 */
export const useCurrentUser = (): ChelseaUser => {
  const { user, profile } = useAuth();
  const email = (profile?.email ?? user?.email ?? "").toLowerCase();
  if (!email) return FALLBACK_USER;
  return CHELSEA_USERS.find((u) => u.email === email) ?? FALLBACK_USER;
};
