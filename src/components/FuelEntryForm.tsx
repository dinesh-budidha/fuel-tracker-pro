import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  DEFAULT_SITES, FUEL_TYPES, formatDateDDMMYYYY, getYesterday,
  getStoredCustomSites, saveCustomSites, type FuelEntry,
} from "@/lib/fuel-types";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  onSubmit: (entry: FuelEntry) => void;
  nextSlNo: number;
}

export default function FuelEntryForm({ onSubmit, nextSlNo }: Props) {
  const { toast } = useToast();
  const [customSites, setCustomSites] = useState(getStoredCustomSites());
  const allSites = [...DEFAULT_SITES, ...customSites, "OTHER"];

  const yesterday = getYesterday();
  const [date, setDate] = useState(formatDateDDMMYYYY(yesterday));
  const [siteName, setSiteName] = useState("");
  const [otherSite, setOtherSite] = useState("");
  const [fuelType, setFuelType] = useState<"PETROL" | "DIESEL">("DIESEL");
  const [purchased, setPurchased] = useState("");
  const [indentNumber, setIndentNumber] = useState("");
  const [issuedThroughIndentLtrs, setIssuedThroughIndentLtrs] = useState("");
  const [issuedThroughBarrelLtrs, setIssuedThroughBarrelLtrs] = useState("");
  const [balance, setBalance] = useState("");

  const computedIssued = (Number(issuedThroughIndentLtrs) || 0) + (Number(issuedThroughBarrelLtrs) || 0);

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
    const finalSite = siteName === "OTHER" ? otherSite.trim().toUpperCase() : siteName;
    if (!finalSite || !date || !purchased || !balance) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }

    const totalIssued = (Number(issuedThroughIndentLtrs) || 0) + (Number(issuedThroughBarrelLtrs) || 0);

    const entry: FuelEntry = {
      slNo: nextSlNo,
      date: date.toUpperCase(),
      siteName: finalSite.toUpperCase(),
      fuelType,
      purchased: Number(purchased),
      indentNumber: indentNumber.trim().toUpperCase(),
      issuedThroughIndentLtrs: Number(issuedThroughIndentLtrs) || 0,
      issuedThroughBarrelLtrs: Number(issuedThroughBarrelLtrs) || 0,
      issued: totalIssued,
      balance: Number(balance),
    };

    onSubmit(entry);
    toast({ title: "Entry saved!" });
    setPurchased(""); setBalance("");
    setIndentNumber(""); setIssuedThroughIndentLtrs(""); setIssuedThroughBarrelLtrs("");
  };

  const handlePurchasedChange = (val: string) => {
    setPurchased(val);
    const totalIssued = (Number(issuedThroughIndentLtrs) || 0) + (Number(issuedThroughBarrelLtrs) || 0);
    if (val) setBalance(String(Number(val) - totalIssued));
  };

  const handleIndentLtrsChange = (val: string) => {
    setIssuedThroughIndentLtrs(val);
    const totalIssued = (Number(val) || 0) + (Number(issuedThroughBarrelLtrs) || 0);
    if (purchased) setBalance(String(Number(purchased) - totalIssued));
  };

  const handleBarrelLtrsChange = (val: string) => {
    setIssuedThroughBarrelLtrs(val);
    const totalIssued = (Number(issuedThroughIndentLtrs) || 0) + (Number(val) || 0);
    if (purchased) setBalance(String(Number(purchased) - totalIssued));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-xl border p-6 space-y-4">
      <h2 className="text-xl font-bold text-foreground">New Fuel Entry</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Date (DD-MM-YYYY)</Label>
          <Input value={date} onChange={e => setDate(e.target.value)} placeholder="DD-MM-YYYY" />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Fuel Purchased (Ltrs)</Label>
          <Input type="number" value={purchased} onChange={e => handlePurchasedChange(e.target.value)} />
        </div>
        <div>
          <Label>Indent Number</Label>
          <Input value={indentNumber} onChange={e => setIndentNumber(e.target.value)} placeholder="Enter indent number (if any)" />
        </div>
        <div>
          <Label>Fuel Issued Through Indent (Ltrs)</Label>
          <Input type="number" value={issuedThroughIndentLtrs} onChange={e => handleIndentLtrsChange(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Fuel Issued Through Barrel (Ltrs)</Label>
          <Input type="number" value={issuedThroughBarrelLtrs} onChange={e => handleBarrelLtrsChange(e.target.value)} />
        </div>
        <div>
          <Label>Total Fuel Issued (Ltrs)</Label>
          <Input type="number" value={computedIssued} readOnly />
        </div>
        <div>
          <Label>Balance Fuel (Ltrs)</Label>
          <Input type="number" value={balance} onChange={e => setBalance(e.target.value)} />
        </div>
      </div>

      <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Submit Entry</Button>
    </form>
  );
}
