import { useState, useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SITES, FUEL_TYPES, formatDateDDMMYYYY, parseDateDDMMYYYY, getYesterday,
  getStoredCustomSites, saveCustomSites, getLastBalanceForSite,
  type FuelEntry,
} from "@/lib/fuel-types";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  onSubmit: (entry: FuelEntry) => void;
  nextSlNo: number;
  entries: FuelEntry[];
}

export default function FuelEntryForm({ onSubmit, nextSlNo, entries }: Props) {
  const { toast } = useToast();
  const [customSites, setCustomSites] = useState(getStoredCustomSites());
  const allSites = [...DEFAULT_SITES, ...customSites, "OTHER"];

  const yesterday = getYesterday();
  const [date, setDate] = useState(formatDateDDMMYYYY(yesterday));
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(yesterday);
  const [siteName, setSiteName] = useState("");
  const [otherSite, setOtherSite] = useState("");
  const [fuelType, setFuelType] = useState<"PETROL" | "DIESEL">("DIESEL");
  const [purchased, setPurchased] = useState("");
  const [indentNumber, setIndentNumber] = useState("");
  const [issuedThroughIndentLtrs, setIssuedThroughIndentLtrs] = useState("");
  const [issuedThroughBarrelLtrs, setIssuedThroughBarrelLtrs] = useState("");
  const [openingBalanceManual, setOpeningBalanceManual] = useState<string>("");

  const finalSiteName = siteName === "OTHER" ? otherSite.trim().toUpperCase() : siteName;

  // Auto-calculate opening balance from last entry, but allow manual override
  const autoOpeningBalance = useMemo(() => {
    if (!finalSiteName) return 0;
    return getLastBalanceForSite(entries, finalSiteName, fuelType);
  }, [entries, finalSiteName, fuelType]);

  const openingBalance = openingBalanceManual !== "" ? Number(openingBalanceManual) : autoOpeningBalance;

  // Sync manual field when auto value changes
  useMemo(() => {
    setOpeningBalanceManual("");
  }, [finalSiteName, fuelType]);

  const computedIssued = (Number(issuedThroughIndentLtrs) || 0) + (Number(issuedThroughBarrelLtrs) || 0);
  const computedBalance = openingBalance + (Number(purchased) || 0) - computedIssued;

  const handleCalendarSelect = (selected: Date | undefined) => {
    if (selected) {
      setCalendarDate(selected);
      setDate(formatDateDDMMYYYY(selected));
    }
  };

  const handleDateInputChange = (val: string) => {
    setDate(val);
    const parsed = parseDateDDMMYYYY(val);
    if (parsed) setCalendarDate(parsed);
  };

  const handleAddCustomSite = () => {
    const name = otherSite.trim().toUpperCase();
    if (!name) return;
    if ([...DEFAULT_SITES, ...customSites].includes(name as any)) {
      toast({ title: "Site already exists", variant: "destructive" });
      return;
    }
    const updated = [...customSites, name];
    setCustomSites(updated);
    saveCustomSites(updated);
    setSiteName(name);
    setOtherSite("");
    toast({ title: `Site "${name}" added` });
  };

  const handleDeleteCustomSite = (site: string) => {
    const updated = customSites.filter(s => s !== site);
    setCustomSites(updated);
    saveCustomSites(updated);
    if (siteName === site) setSiteName("");
    toast({ title: `Site "${site}" removed` });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalSiteName || !date || !purchased) {
      toast({ title: "Date, Site, and Purchased are required", variant: "destructive" });
      return;
    }

    const totalIssued = (Number(issuedThroughIndentLtrs) || 0) + (Number(issuedThroughBarrelLtrs) || 0);
    const balance = openingBalance + Number(purchased) - totalIssued;

    const entry: FuelEntry = {
      slNo: nextSlNo,
      date: date.toUpperCase(),
      siteName: finalSiteName.toUpperCase(),
      fuelType,
      openingBalance,
      purchased: Number(purchased),
      indentNumber: indentNumber.trim().toUpperCase(),
      issuedThroughIndentLtrs: Number(issuedThroughIndentLtrs) || 0,
      issuedThroughBarrelLtrs: Number(issuedThroughBarrelLtrs) || 0,
      issued: totalIssued,
      balance,
    };

    onSubmit(entry);
    toast({ title: "Entry saved!" });
    setPurchased("");
    setOpeningBalanceManual("");
    setIndentNumber(""); setIssuedThroughIndentLtrs(""); setIssuedThroughBarrelLtrs("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-xl border p-6 space-y-4">
      <h2 className="text-xl font-bold text-foreground">New Fuel Entry</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Date (DD-MM-YYYY)</Label>
          <div className="flex gap-2">
            <Input value={date} onChange={e => handleDateInputChange(e.target.value)} placeholder="DD-MM-YYYY" className="flex-1" />
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="icon">
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={calendarDate}
                  onSelect={handleCalendarSelect}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div>
          <Label>Site Name</Label>
          <Select value={siteName} onValueChange={setSiteName}>
            <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
            <SelectContent>
              {allSites.map(s => (
                <SelectItem key={s} value={s}>
                  <div className="flex items-center justify-between w-full gap-2">
                    {s}
                    {customSites.includes(s) && (
                      <Trash2 className="h-3 w-3 text-destructive cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDeleteCustomSite(s); }} />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {siteName === "OTHER" && (
          <div>
            <Label>Custom Site Name</Label>
            <div className="flex gap-2">
              <Input value={otherSite} onChange={e => setOtherSite(e.target.value)} placeholder="Enter site name" />
              <Button type="button" size="icon" onClick={handleAddCustomSite}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        <div>
          <Label>Fuel Type</Label>
          <Select value={fuelType} onValueChange={v => setFuelType(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FUEL_TYPES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label>Opening Balance (Ltrs)</Label>
          <Input
            type="number"
            value={openingBalanceManual !== "" ? openingBalanceManual : String(autoOpeningBalance)}
            onChange={e => setOpeningBalanceManual(e.target.value)}
            placeholder="Auto or enter manually"
          />
        </div>
        <div>
          <Label>Fuel Purchased (Ltrs)</Label>
          <Input type="number" value={purchased} onChange={e => setPurchased(e.target.value)} />
        </div>
        <div>
          <Label>Indent Number</Label>
          <Input value={indentNumber} onChange={e => setIndentNumber(e.target.value)} placeholder="Enter indent number (if any)" />
        </div>
        <div>
          <Label>Fuel Issued Through Indent (Ltrs)</Label>
          <Input type="number" value={issuedThroughIndentLtrs} onChange={e => setIssuedThroughIndentLtrs(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Fuel Issued Through Barrel (Ltrs)</Label>
          <Input type="number" value={issuedThroughBarrelLtrs} onChange={e => setIssuedThroughBarrelLtrs(e.target.value)} />
        </div>
        <div>
          <Label>Total Fuel Issued (Ltrs)</Label>
          <Input type="number" value={computedIssued} readOnly className="bg-muted" />
        </div>
        <div>
          <Label>Balance Fuel (Ltrs)</Label>
          <Input type="number" value={computedBalance} readOnly className="bg-muted" />
        </div>
      </div>

      <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Submit Entry</Button>
    </form>
  );
}