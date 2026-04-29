import { useEffect, useState, useCallback } from "react";

/**
 * Reads the "Recommendations" activation flag from Club Settings.
 *
 * Currently backed by localStorage so it can be flipped from the demo route
 * without a backend round-trip. Defaults to ON.
 *
 * Components that render recommendation UI (badges, dropdowns, columns)
 * should gate themselves on this hook so when an admin disables the feature
 * in Club Settings, nothing leaks through anywhere in the app.
 */
const STORAGE_KEY = "club-settings.recommendationsActive";
const EVENT_NAME = "recommendations-active-changed";

const readFlag = (): boolean => {
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) return true; // default ON
  return raw === "true";
};

export const setRecommendationsActive = (active: boolean) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, active ? "true" : "false");
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: active }));
};

export const useRecommendationsActive = (): boolean => {
  const [active, setActive] = useState<boolean>(readFlag);

  useEffect(() => {
    const onChange = () => setActive(readFlag());
    window.addEventListener(EVENT_NAME, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT_NAME, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return active;
};

/** Convenience helper for non-component code. */
export const useToggleRecommendationsActive = () => {
  const active = useRecommendationsActive();
  const toggle = useCallback(() => setRecommendationsActive(!active), [active]);
  return { active, toggle, setActive: setRecommendationsActive };
};
