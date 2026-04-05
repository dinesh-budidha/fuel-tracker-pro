import { useState, useMemo } from "react";
import logo from "@/assets/logo.png";
import DashboardCards from "@/components/DashboardCards";
import FuelEntryForm from "@/components/FuelEntryForm";
import FuelTable from "@/components/FuelTable";
import SiteFilter from "@/components/SiteFilter";
import ExportButton from "@/components/ExportButton";
import { getStoredEntries, saveEntries, type FuelEntry } from "@/lib/fuel-types";

export default function Index() {
  const [entries, setEntries] = useState(getStoredEntries());
  const [siteFilter, setSiteFilter] = useState("ALL SITES");

  const handleNewEntry = (entry: FuelEntry) => {
    const updated = [...entries, entry];
    setEntries(updated);
    saveEntries(updated);
  };

  const handleEdit = (updated: FuelEntry) => {
    const newEntries = entries.map(e => e.slNo === updated.slNo ? updated : e);
    setEntries(newEntries);
    saveEntries(newEntries);
  };

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
        <div>
          <h1 className="text-xl font-bold text-foreground">SRI KEERTHI PROJECTS PVT. LTD.</h1>
          <p className="text-sm text-muted-foreground">FUEL CONSUMPTION MANAGEMENT SYSTEM</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <DashboardCards entries={entries} />
        <FuelEntryForm onSubmit={handleNewEntry} nextSlNo={nextSlNo} />

        <div className="flex items-center justify-between flex-wrap gap-3">
          <SiteFilter value={siteFilter} onChange={setSiteFilter} usedSites={usedSites} />
          <ExportButton entries={filtered} />
        </div>

        <FuelTable entries={filtered} onEdit={handleEdit} />
      </main>
    </div>
  );
}
