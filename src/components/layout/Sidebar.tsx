import { NavLink } from "react-router-dom";
import { Icon } from "../ui/Icon";
import type { IconName } from "../ui/Icon";

type NavItem = {
  label: string;
  path: string;
  icon: IconName;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [{ label: "Dashboard", path: "/", icon: "dashboard" }],
  },
  {
    label: "Research",
    items: [
      { label: "Projects", path: "/projects", icon: "projects" },
      { label: "Sources", path: "/sources", icon: "sources" },
      { label: "Questions", path: "/questions", icon: "questions" },
      { label: "Findings", path: "/findings", icon: "findings" },
      { label: "Insights", path: "/insights", icon: "insights" },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { label: "Writing", path: "/writing", icon: "writing" },
      { label: "Search", path: "/search", icon: "search" },
      { label: "Tags", path: "/tags", icon: "tags" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Review", path: "/review", icon: "review" },
      { label: "Settings", path: "/settings", icon: "settings" },
    ],
  },
];

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-[13px] font-semibold text-primary-fg shadow-xs">
        R
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold tracking-tight text-foreground">
          Research Hub
        </p>
        <p className="truncate text-[11px] text-faint">Local-first workspace</p>
      </div>
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {navGroups.map((group, groupIndex) => (
        <div key={group.label} className={groupIndex > 0 ? "mt-6" : ""}>
          <p className="mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/15"
                        : "text-muted hover:bg-surface-hover hover:text-foreground"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        name={item.icon}
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive ? "text-primary" : "text-faint group-hover:text-muted"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const inner = (
    <>
      <div className="flex h-16 items-center border-b border-border px-4">
        <Wordmark />
      </div>
      <SidebarNav onNavigate={onClose} />
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2 text-[11px] text-faint">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          <span>Local-first · v1.0</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        {inner}
      </aside>

      <div
        className={`fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />
        <aside
          className={`absolute inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface shadow-overlay transition-transform duration-200 ease-out lg:hidden ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {inner}
        </aside>
      </div>
    </>
  );
}
