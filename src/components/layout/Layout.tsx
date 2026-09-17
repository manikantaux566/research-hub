import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { CommandPalette } from "../ui/CommandPalette";
import { Icon } from "../ui/Icon";
import { Badge } from "../ui/Badge";
import { searchAll } from "../../lib/search";
import { useAuth } from "../../lib/auth/useAuth";

export function Layout() {
  const { status } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur lg:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-foreground lg:hidden"
            aria-label="Toggle navigation"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="group hidden h-9 w-full max-w-md items-center gap-2.5 rounded-lg border border-border bg-surface-muted px-3 text-[13px] text-faint transition-colors hover:border-border-strong hover:bg-surface sm:flex"
          >
            <Icon name="search" className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Search research or run a command…</span>
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10.5px] text-faint">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-foreground sm:hidden"
            aria-label="Search and commands"
          >
            <Icon name="search" className="h-5 w-5" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {status.status === "authenticated" && status.demo && (
              <Badge label="Demo session" tone="gray" title="No account — research is saved only in this browser." />
            )}
            <UserMenu />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        search={searchAll}
      />
    </div>
  );
}
