import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type FuelEntry, getStoredEntries, saveEntries } from "@/lib/fuel-types";
import { useToast } from "@/hooks/use-toast";

const POLL_INTERVAL = 30_000; // 30 seconds

export function useGoogleSheetsSync() {
  const [entries, setEntries] = useState<FuelEntry[]>(getStoredEntries());
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const writeQueue = useRef<FuelEntry[] | null>(null);
  const isWriting = useRef(false);

  const fetchFromSheets = useCallback(async () => {
    try {
      setSyncing(true);
      setError(null);
      const { data, error: fnError } = await supabase.functions.invoke("google-sheets-sync", {
        body: { action: "read" },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const sheetEntries: FuelEntry[] = data.entries || [];
      setEntries(sheetEntries);
      saveEntries(sheetEntries);
      setLastSynced(new Date());
      return sheetEntries;
    } catch (err: any) {
      console.error("Fetch from sheets failed:", err);
      setError(err.message);
      return null;
    } finally {
      setSyncing(false);
    }
  }, []);

  const writeToSheets = useCallback(async (entriesToWrite: FuelEntry[]) => {
    if (isWriting.current) {
      writeQueue.current = entriesToWrite;
      return;
    }
    isWriting.current = true;
    try {
      setError(null);
      const { data, error: fnError } = await supabase.functions.invoke("google-sheets-sync", {
        body: { action: "write", entries: entriesToWrite },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setLastSynced(new Date());
    } catch (err: any) {
      console.error("Write to sheets failed:", err);
      setError(err.message);
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    } finally {
      isWriting.current = false;
      if (writeQueue.current) {
        const queued = writeQueue.current;
        writeQueue.current = null;
        writeToSheets(queued);
      }
    }
  }, [toast]);

  const updateEntries = useCallback((newEntries: FuelEntry[]) => {
    setEntries(newEntries);
    saveEntries(newEntries);
    writeToSheets(newEntries);
  }, [writeToSheets]);

  const addEntry = useCallback((entry: FuelEntry) => {
    const updated = [...entries, entry];
    updateEntries(updated);
    return updated;
  }, [entries, updateEntries]);

  const editEntry = useCallback((updated: FuelEntry) => {
    const newEntries = entries.map(e => e.slNo === updated.slNo ? updated : e);
    updateEntries(newEntries);
    return newEntries;
  }, [entries, updateEntries]);

  const deleteEntry = useCallback((slNo: number) => {
    const newEntries = entries.filter(e => e.slNo !== slNo);
    updateEntries(newEntries);
    return newEntries;
  }, [entries, updateEntries]);

  // Initial fetch
  useEffect(() => {
    fetchFromSheets();
  }, [fetchFromSheets]);

  // Poll every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchFromSheets, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchFromSheets]);

  return {
    entries,
    syncing,
    lastSynced,
    error,
    addEntry,
    editEntry,
    deleteEntry,
    refresh: fetchFromSheets,
  };
}
