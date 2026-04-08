import { useState, useMemo } from "react";
import logo from "@/assets/logo.png";
import DashboardCards from "@/components/DashboardCards";
import FuelEntryForm from "@/components/FuelEntryForm";
import FuelTable from "@/components/FuelTable";
import SiteFilter from "@/components/SiteFilter";
import ExportButton from "@/components/ExportButton";
import { useGoogleSheetsSync } from "@/hooks/use-google-sheets-sync";
import { RefreshCw, Cloud, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  const {
    entries, syncing, lastSynced, error,
    addEntry, editEntry, deleteEntry, refresh,
  } = useGoogleSheetsSync();

  const [siteFilter, setSiteFilter] = useState("ALL SITES");

  const filtered = useMemo(
    () => siteFilter === "ALL SITES" ? entries : entries.filter(e => e.siteName === siteFilter),
    [entries, siteFilter]
  );

  const usedSites = useMemo(() => Array.from(new Set(entries.map(e => e.siteName))), [entries]);
  const nextSlNo = entries.length > 0 ? Math.max(...entries.map(e => e.slNo)) + 1 : 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b px-6 py-3 flex items-center gap-4">
        <img src={logo} alt="SKPPL Logo" className="h-12 w-12 object-contain" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">SRI KEERTHI PROJECTS PVT. LTD.</h1>
          <p className="text-sm text-muted-foreground">FUEL CONSUMPTION MANAGEMENT SYSTEM</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {error ? (
            <span className="flex items-center gap-1 text-destructive">
              <CloudOff className="h-4 w-4" /> Sync error
            </span>
          ) : (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Cloud className="h-4 w-4 text-green-500" />
              {lastSynced ? `Synced ${lastSynced.toLocaleTimeString()}` : "Connecting..."}
            </span>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={refresh}
            disabled={syncing}
            title="Sync now"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <DashboardCards entries={entries} />
        <FuelEntryForm onSubmit={addEntry} nextSlNo={nextSlNo} entries={entries} />

        <div className="flex items-center justify-between flex-wrap gap-3">
          <SiteFilter value={siteFilter} onChange={setSiteFilter} usedSites={usedSites} />
          <ExportButton entries={filtered} />
        </div>

        <FuelTable entries={filtered} onEdit={editEntry} onDelete={deleteEntry} />
      </main>
    </div>
  );
}
