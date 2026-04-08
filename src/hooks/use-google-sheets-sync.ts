import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type FuelEntry, getStoredEntries, saveEntries } from "@/lib/fuel-types";
import { useToast } from "@/hooks/use-toast";

const POLL_INTERVAL = 30_000;

export function useGoogleSheetsSync() {
  const [entries, setEntries] = useState<FuelEntry[]>(getStoredEntries());
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const writeQueue = useRef<FuelEntry[] | null>(null);
  const isWriting = useRef(false);
  const pendingWrite = useRef<FuelEntry[] | null>(null);

  // Process pending writes outside of setState
  useEffect(() => {
    if (pendingWrite.current) {
      const toWrite = pendingWrite.current;
      pendingWrite.current = null;
      writeToSheets(toWrite);
    }
  });

  const fetchFromSheets = useCallback(async () => {
    try {
      setSyncing(true);
      setError(null);
      const { data, error: fnError } = await supabase.functions.invoke("google-sheets-sync", {
        body: { action: "read" },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const sheetEntries: FuelEntry[] = (data.entries || []).map((e: any) => ({
        ...e,
        openingBalance: e.openingBalance ?? 0,
        indentNumber: e.indentNumber || "",
        issuedThroughIndentLtrs: e.issuedThroughIndentLtrs ?? 0,
        issuedThroughBarrelLtrs: e.issuedThroughBarrelLtrs ?? 0,
      }));
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

  const addEntry = useCallback((entry: FuelEntry) => {
    setEntries(prev => {
      if (prev.some(e => e.slNo === entry.slNo)) {
        const maxSlNo = Math.max(...prev.map(e => e.slNo), 0);
        entry = { ...entry, slNo: maxSlNo + 1 };
      }
      const updated = [...prev, entry];
      saveEntries(updated);
      pendingWrite.current = updated;
      return updated;
    });
  }, []);

  const editEntry = useCallback((updated: FuelEntry) => {
    setEntries(prev => {
      const newEntries = prev.map(e => e.slNo === updated.slNo ? updated : e);
      saveEntries(newEntries);
      pendingWrite.current = newEntries;
      return newEntries;
    });
  }, []);

  const deleteEntry = useCallback((slNo: number) => {
    setEntries(prev => {
      const newEntries = prev.filter(e => e.slNo !== slNo);
      saveEntries(newEntries);
      pendingWrite.current = newEntries;
      return newEntries;
    });
  }, []);

  useEffect(() => {
    fetchFromSheets();
  }, [fetchFromSheets]);

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
