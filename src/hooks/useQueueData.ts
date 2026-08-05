import { useCallback, useMemo, useState } from "react";
import { queueEntries } from "../data/mockData";
import { QueueEntry } from "../types";

/**
 * Adaptateur de données pour la démo.
 * Remplacez les mutations locales par des appels vers votre API FastAPI.
 */
export function useQueueData() {
  const [entries, setEntries] = useState<QueueEntry[]>(queueEntries);
  const activeEntries = useMemo(() => entries.filter((entry) => ["waiting", "called", "serving"].includes(entry.state)), [entries]);
  const updateState = useCallback((entryId: string, state: QueueEntry["state"]) => {
    setEntries((current) => current.map((entry) => entry.id === entryId ? { ...entry, state } : entry));
  }, []);
  return { entries, activeEntries, updateState, isLoading: false, error: null };
}