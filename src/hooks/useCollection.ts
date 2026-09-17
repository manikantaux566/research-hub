import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CreateInput, Entity, Repository, UpdateInput } from "../lib/storage";
import { subscribeToChanges } from "../lib/storage";

export function useCollection<T extends Entity>(
  repository: Repository<T>,
  projectId?: string,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);
  const aliveRef = useRef(true);

  const load = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const rows = projectId
        ? await repository.listByProject(projectId)
        : await repository.list();
      if (aliveRef.current && seq === requestSeq.current) {
        setItems(rows);
        setLoading(false);
      }
    } catch (e) {
      if (aliveRef.current && seq === requestSeq.current) {
        setError(e instanceof Error ? e.message : "Failed to load data.");
        setLoading(false);
      }
    }
  }, [repository, projectId]);

  useEffect(() => {
    aliveRef.current = true;
    void load();
    const unsubscribe = subscribeToChanges(() => {
      void load();
    });
    return () => {
      aliveRef.current = false;
      unsubscribe();
    };
  }, [load]);

  const create = useCallback(
    async (input: CreateInput<T>) => {
      const created = await repository.create(input);
      await load();
      return created;
    },
    [repository, load],
  );

  const update = useCallback(
    async (id: string, input: UpdateInput<T>) => {
      const updated = await repository.update(id, input);
      await load();
      return updated;
    },
    [repository, load],
  );

  const remove = useCallback(
    async (id: string) => {
      await repository.remove(id);
      await load();
    },
    [repository, load],
  );

  const byId = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  return { items, byId, loading, error, create, update, remove, refresh: load };
}

export function useEntityMap<T extends Entity>(
  repository: Repository<T>,
  projectId?: string,
) {
  const collection = useCollection(repository, projectId);
  const map = useMemo(
    () => new Map(collection.items.map((item) => [item.id, item])),
    [collection.items],
  );
  return { ...collection, map };
}