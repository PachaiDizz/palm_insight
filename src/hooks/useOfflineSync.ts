"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  queueWrite,
  getPendingWrites,
  removePendingWrite,
  getPendingCount,
  type PendingWrite,
} from "@/lib/offlineSync";

interface UseOfflineSyncReturn {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  enqueueWrite: (write: Omit<PendingWrite, "timestamp" | "retries">) => Promise<void>;
  syncPending: () => Promise<{ synced: number; failed: number }>;
}

async function replayWrite(write: PendingWrite): Promise<boolean> {
  try {
    switch (write.operation) {
      case "insert": {
        const { error } = await supabase.from(write.table).insert(write.data);
        if (error) throw error;
        break;
      }
      case "update": {
        if (!write.recordId) throw new Error("Missing recordId for update");
        const { error } = await supabase
          .from(write.table)
          .update(write.data)
          .eq("id", write.recordId);
        if (error) throw error;
        break;
      }
      case "delete": {
        if (!write.recordId) throw new Error("Missing recordId for delete");
        const { error } = await supabase
          .from(write.table)
          .delete()
          .eq("id", write.recordId);
        if (error) throw error;
        break;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);

  // Track online/offline status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Refresh pending count on mount and when online changes
  useEffect(() => {
    getPendingCount().then(setPendingCount);
  }, [isOnline]);

  const syncPending = useCallback(async () => {
    if (syncingRef.current) return { synced: 0, failed: 0 };
    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const writes = await getPendingWrites();
      let synced = 0;
      let failed = 0;

      for (const write of writes) {
        const success = await replayWrite(write);
        if (success) {
          await removePendingWrite(write.id!);
          synced++;
        } else {
          failed++;
        }
      }

      setPendingCount(Math.max(0, writes.length - synced));
      return { synced, failed };
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !syncingRef.current) {
      syncPending();
    }
  }, [isOnline, pendingCount, syncPending]);

  const enqueueWrite = useCallback(
    async (write: Omit<PendingWrite, "timestamp" | "retries">) => {
      await queueWrite(write);
      setPendingCount((c) => c + 1);
    },
    []
  );

  return { isOnline, pendingCount, isSyncing, enqueueWrite, syncPending };
}
