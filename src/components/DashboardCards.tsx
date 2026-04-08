import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Fuel, Droplets, FileText, Scale, Package, BookOpen, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DEFAULT_SITES, getStoredCustomSites, formatDateDDMMYYYY, type FuelEntry } from "@/lib/fuel-types";

interface Props {
  entries: FuelEntry[];
}

export default function DashboardCards({ entries }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dashboardSite, setDashboardSite] = useState("ALL SITES");

  const allSites = useMemo(() => {
    const custom = getStoredCustomSites();
    const used = Array.from(new Set(entries.map(e => e.siteName)));
    return Array.from(new Set([...DEFAULT_SITES, ...custom, ...used]));
  }, [entries]);

  const filtered = useMemo(() => {
    let result = entries;
    if (selectedDate) {
      const dateStr = formatDateDDMMYYYY(selectedDate);
      result = result.filter(e => e.date === dateStr);
    }
    if (dashboardSite !== "ALL SITES") {
      result = result.filter(e => e.siteName === dashboardSite);
    }
    return result;
  }, [entries, selectedDate, dashboardSite]);

  const diesel = filtered.filter(e => e.fuelType === "DIESEL");
  const petrol = filtered.filter(e => e.fuelType === "PETROL");

  const dieselCards = [
    { label: "DIESEL PURCHASED", value: diesel.reduce((s, e) => s + e.purchased, 0), icon: Droplets, unit: "Ltrs" },
    { label: "DIESEL ISSUED", value: diesel.reduce((s, e) => s + e.issued, 0), icon: Droplets, unit: "Ltrs" },
    { label: "DIESEL BALANCE", value: diesel.reduce((s, e) => s + e.balance, 0), icon: Scale, unit: "Ltrs" },
    { label: "DIESEL THROUGH INDENT", value: diesel.reduce((s, e) => s + e.issuedThroughIndentLtrs, 0), icon: BookOpen, unit: "Ltrs" },
    { label: "DIESEL THROUGH BARREL", value: diesel.reduce((s, e) => s + e.issuedThroughBarrelLtrs, 0), icon: Package, unit: "Ltrs" },
  ];

  const petrolCards = [
    { label: "PETROL PURCHASED", value: petrol.reduce((s, e) => s + e.purchased, 0), icon: Fuel, unit: "Ltrs" },
    { label: "PETROL ISSUED", value: petrol.reduce((s, e) => s + e.issued, 0), icon: Fuel, unit: "Ltrs" },
    { label: "PETROL BALANCE", value: petrol.reduce((s, e) => s + e.balance, 0), icon: Scale, unit: "Ltrs" },
    { label: "PETROL THROUGH INDENT", value: petrol.reduce((s, e) => s + e.issuedThroughIndentLtrs, 0), icon: BookOpen, unit: "Ltrs" },
  ];

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? formatDateDDMMYYYY(selectedDate) : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            {selectedDate && (
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setSelectedDate(undefined)}>Clear date</Button>
            )}
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} />
          </PopoverContent>
        </Popover>

        <Select value={dashboardSite} onValueChange={setDashboardSite}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL SITES">ALL SITES</SelectItem>
            {allSites.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Diesel Section - FIRST */}
      <h3 className="text-lg font-bold mb-3" style={{ color: "hsl(var(--fuel-blue))" }}>DIESEL</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {dieselCards.map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl p-4 text-primary-foreground" style={{ backgroundColor: "hsl(var(--fuel-blue))" }}>
            <card.icon className="h-5 w-5 mb-2 opacity-80" />
            <div className="text-2xl font-bold">{card.value.toLocaleString("en-IN")} <span className="text-sm font-normal">{card.unit}</span></div>
            <div className="text-xs opacity-80 mt-1">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Petrol Section - SECOND */}
      <h3 className="text-lg font-bold mb-3" style={{ color: "hsl(var(--fuel-green))" }}>PETROL</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {petrolCards.map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl p-4 text-primary-foreground" style={{ backgroundColor: "hsl(var(--fuel-green))" }}>
            <card.icon className="h-5 w-5 mb-2 opacity-80" />
            <div className="text-2xl font-bold">{card.value.toLocaleString("en-IN")} <span className="text-sm font-normal">{card.unit}</span></div>
            <div className="text-xs opacity-80 mt-1">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Total Entries */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="inline-block rounded-xl p-4 text-primary-foreground" style={{ backgroundColor: "hsl(var(--fuel-orange))" }}>
        <FileText className="h-5 w-5 mb-1 opacity-80" />
        <div className="text-2xl font-bold">{filtered.length}</div>
        <div className="text-xs opacity-80">TOTAL ENTRIES</div>
      </motion.div>
    </div>
  );
}
