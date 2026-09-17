const PREFIX = "research-hub:ux:";

export type UxItem = {
  id: string;
  kind: string;
  title: string;
  href: string;
  at: string;
};

export type SavedView = {
  id: string;
  name: string;
  filters: Record<string, string>;
  createdAt: string;
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(`${PREFIX}${key}`);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // UX-only state; never fatal.
  }
}

const RECENT = "recent";
const PINNED = "pinned";
const RECENT_SEARCHES = "recentSearches";
const SAVED_VIEWS = "savedViews";

function dedupe(items: UxItem[]): UxItem[] {
  const seen = new Set<string>();
  const result: UxItem[] = [];
  for (const item of items) {
    const key = `${item.kind}:${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export function addRecent(kind: string, id: string, title: string, href: string): void {
  const items = read<UxItem[]>(RECENT, []);
  write(RECENT, dedupe([{ id, kind, title, href, at: new Date().toISOString() }, ...items]).slice(0, 12));
}

export function getRecents(): UxItem[] {
  return read<UxItem[]>(RECENT, []);
}

export function togglePinned(kind: string, id: string, title: string, href: string): boolean {
  const items = read<UxItem[]>(PINNED, []);
  const key = `${kind}:${id}`;
  const exists = items.some((item) => `${item.kind}:${item.id}` === key);
  const next = exists
    ? items.filter((item) => `${item.kind}:${item.id}` !== key)
    : [...items, { id, kind, title, href, at: new Date().toISOString() }];
  write(PINNED, next);
  return !exists;
}

export function getPinned(): UxItem[] {
  return read<UxItem[]>(PINNED, []);
}

export function isPinned(kind: string, id: string): boolean {
  return getPinned().some((item) => `${item.kind}:${item.id}` === `${kind}:${id}`);
}

export function addRecentSearch(query: string): void {
  const q = query.trim();
  if (!q) return;
  const items = read<string[]>(RECENT_SEARCHES, []);
  write(RECENT_SEARCHES, [q, ...items.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(0, 8));
}

export function getRecentSearches(): string[] {
  return read<string[]>(RECENT_SEARCHES, []);
}

export function saveView(name: string, filters: Record<string, string>): SavedView {
  const items = read<SavedView[]>(SAVED_VIEWS, []);
  const view: SavedView = {
    id: `${Date.now().toString(36)}`,
    name,
    filters,
    createdAt: new Date().toISOString(),
  };
  write(SAVED_VIEWS, [...items, view]);
  return view;
}

export function getSavedViews(): SavedView[] {
  return read<SavedView[]>(SAVED_VIEWS, []);
}

export function removeSavedView(id: string): void {
  write(SAVED_VIEWS, getSavedViews().filter((view) => view.id !== id));
}