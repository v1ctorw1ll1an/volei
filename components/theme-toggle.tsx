"use client";

import { useSyncExternalStore } from "react";

type Mode = "system" | "light" | "dark";
const KEY = "volei-theme";

declare global {
  interface Window {
    __applyTheme?: () => void;
  }
}

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getMode(): Mode {
  const saved = localStorage.getItem(KEY);
  return saved === "light" || saved === "dark" ? saved : "system";
}
function setMode(mode: Mode) {
  if (mode === "system") localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, mode);
  window.__applyTheme?.();
  listeners.forEach((l) => l());
}

const OPTIONS: { mode: Mode; label: string; icon: string }[] = [
  { mode: "system", label: "Automático", icon: "◐" },
  { mode: "light", label: "Claro", icon: "☀" },
  { mode: "dark", label: "Escuro", icon: "☾" },
];

export function ThemeToggle() {
  const mode = useSyncExternalStore(subscribe, getMode, () => "system" as Mode);
  const current = OPTIONS.find((o) => o.mode === mode)!;
  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-square" aria-label="Tema">
        <span className="text-lg leading-none">{current.icon}</span>
      </div>
      <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-10 w-40 p-2 shadow">
        {OPTIONS.map((o) => (
          <li key={o.mode}>
            <button className={o.mode === mode ? "menu-active" : ""} onClick={() => setMode(o.mode)}>
              <span className="w-4 text-center">{o.icon}</span> {o.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
