import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth/useAuth";
import { Icon } from "../ui/Icon";

export function UserMenu() {
  const { status, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const user = status.status === "authenticated" ? status.user : null;
  const demo = status.status === "authenticated" && status.demo;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  if (!user) return null;

  const initial = (user.displayName || user.email || "?").charAt(0).toUpperCase();

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        data-user-menu
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-fg ring-offset-background transition-shadow hover:shadow-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        title={user.displayName || user.email}
      >
        {initial}
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 top-10 z-40 w-60 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-overlay animate-zoom-in"
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-fg">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-foreground">
                {user.displayName || "User"}
              </p>
              <p className="truncate text-xs text-muted">{demo ? "Demo session" : user.email}</p>
            </div>
          </div>
          <div className="p-1.5">
            <Link
              to="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-foreground transition-colors hover:bg-surface-hover"
            >
              <Icon name="settings" className="h-4 w-4 text-faint" />
              Account &amp; settings
            </Link>
            {demo ? (
              <p className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-xs leading-relaxed text-muted">
                <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
                No account — research is saved only in this browser.
              </p>
            ) : (
              <button
                type="button"
                role="menuitem"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-danger transition-colors hover:bg-danger/10"
              >
                <Icon name="logout" className="h-4 w-4" />
                Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
