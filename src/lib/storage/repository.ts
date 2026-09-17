import { readTable, writeTable } from "./db";
import { newId } from "../id";

export type Entity = { id: string; createdAt: string; updatedAt: string };

export type CreateInput<T extends Entity> = Omit<
  T,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateInput<T extends Entity> = Partial<
  Omit<T, "id" | "createdAt" | "updatedAt">
>;

export type Repository<T extends Entity> = {
  create(input: CreateInput<T>): Promise<T>;
  getById(id: string): Promise<T | undefined>;
  list(): Promise<T[]>;
  listByProject(projectId: string): Promise<T[]>;
  update(id: string, input: UpdateInput<T>): Promise<T>;
  remove(id: string): Promise<void>;
};

export function createRepository<T extends Entity>(
  table: string,
  projectOf: (row: T) => string | undefined,
): Repository<T> {
  return {
    async create(input) {
      const rows = readTable<T>(table);
      const now = new Date().toISOString();
      const row = {
        ...input,
        id: newId(),
        createdAt: now,
        updatedAt: now,
      } as T;
      rows.push(row);
      writeTable(table, rows);
      return row;
    },
    async getById(id) {
      const rows = readTable<T>(table);
      return rows.find((row) => row.id === id);
    },
    async list() {
      return readTable<T>(table);
    },
    async listByProject(projectId) {
      const rows = readTable<T>(table);
      return rows.filter((row) => projectOf(row) === projectId);
    },
    async update(id, input) {
      const rows = readTable<T>(table);
      const index = rows.findIndex((row) => row.id === id);
      if (index === -1) {
        throw new Error(`Record ${id} was not found in "${table}".`);
      }
      const existing = rows[index];
      const updated = {
        ...existing,
        ...input,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
      } as T;
      rows[index] = updated;
      writeTable(table, rows);
      return updated;
    },
    async remove(id) {
      const rows = readTable<T>(table);
      writeTable(
        table,
        rows.filter((row) => row.id !== id),
      );
    },
  };
}