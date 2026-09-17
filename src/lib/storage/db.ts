const PREFIX = "research-hub:";

export const CHANGE_EVENT = "research-hub:changed";

export function readTable<T>(table: string): T[] {
  const key = tableKey(table);
  const raw = window.localStorage.getItem(key);
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`table is not an array`);
    }
    return parsed as T[];
  } catch {
    console.error(`[storage] failed to read table "${table}"`);
    throw new Error(
      `Stored "${table}" data could not be read and may be corrupted.`,
    );
  }
}

export function writeTable(table: string, rows: unknown[]): void {
  try {
    window.localStorage.setItem(tableKey(table), JSON.stringify(rows));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { table } }));
  } catch {
    console.error(`[storage] failed to write table "${table}"`);
    throw new Error(
      "Failed to save data. Browser storage may be full or unavailable.",
    );
  }
}

export function clearAll(): void {
  const keys = Object.keys(window.localStorage).filter((key) =>
    key.startsWith(PREFIX),
  );
  keys.forEach((key) => window.localStorage.removeItem(key));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { table: "*" } }));
}

export function tableNames(): string[] {
  return Object.keys(window.localStorage)
    .filter((key) => key.startsWith(PREFIX))
    .map((key) => key.slice(PREFIX.length))
    .filter((name) => name !== "*" && !name.includes(":"));
}

export function tableKey(name: string): string {
  return `${PREFIX}${name}`;
}

export function writeBatch(tables: Record<string, unknown[]>): void {
  const previous: Record<string, string | null> = {};
  const keys = Object.keys(tables);
  try {
    for (const name of keys) {
      previous[name] = window.localStorage.getItem(tableKey(name));
      window.localStorage.setItem(tableKey(name), JSON.stringify(tables[name]));
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { table: "*" } }));
  } catch (e) {
    for (const name of keys) {
      const value = previous[name];
      if (value === null) {
        window.localStorage.removeItem(tableKey(name));
      } else {
        window.localStorage.setItem(tableKey(name), value);
      }
    }
    console.error("[storage] failed to write a batch of tables");
    throw e;
  }
}

export function dumpAllRaw(): Record<string, string> {
  return Object.fromEntries(
    tableNames().map((name) => [name, window.localStorage.getItem(tableKey(name)) ?? "[]"]),
  );
}

export function subscribeToChanges(listener: () => void): () => void {
  const handler = () => listener();
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}