import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { assertStorageReadable, migrateStorage } from "./lib/storage";
import { applyTheme, readThemePreference } from "./lib/theme/theme";

applyTheme(readThemePreference());

let bootError: string | null = null;

try {
  assertStorageReadable();
  const { migrated } = migrateStorage();
  if (migrated.length > 0) {
    console.log("[Research Hub] Migrated tables:", migrated.join(", "));
  }
} catch (e) {
  bootError =
    e instanceof Error ? e.message : "Unable to access browser storage.";
  console.error("[Research Hub] Boot error:", e);
}

const rootEl = document.getElementById("root")!;

if (bootError) {
  rootEl.innerHTML = `
    <div style="display:flex;min-height:100vh;align-items:center;justify-content:center;padding:2rem;font-family:system-ui,sans-serif;">
      <div style="max-width:28rem;text-align:center;">
        <div style="font-size:2rem;margin-bottom:1rem;">⚠</div>
        <h1 style="font-size:1.125rem;font-weight:600;color:#1e293b;margin-bottom:0.5rem;">
          Unable to load Research Hub
        </h1>
        <p style="font-size:0.875rem;color:#64748b;margin-bottom:1.5rem;">
          ${bootError}
        </p>
        <p style="font-size:0.8125rem;color:#94a3b8;">
          Try clearing site data in your browser's settings, or open this app
          in a new private window.
        </p>
      </div>
    </div>
  `;
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
