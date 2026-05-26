import type { Fixture } from "@/hooks/useFixturesData";

const STORAGE_KEY = "customFixtures";
const EVENT_NAME = "custom-fixtures-changed";

export const loadCustomFixtures = (): Fixture[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Fixture[]) : [];
  } catch {
    return [];
  }
};

export const addCustomFixture = (fixture: Fixture) => {
  const list = loadCustomFixtures();
  list.push(fixture);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
};

export const subscribeCustomFixtures = (cb: () => void) => {
  const handler = () => cb();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
};

export const isCustomFixture = (f: { source?: string | null }) => f.source === "custom";
