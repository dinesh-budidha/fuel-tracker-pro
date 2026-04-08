import { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import { type FuelEntry } from "@/lib/fuel-types";

interface Props {
  entries: FuelEntry[];
  onEdit: (updated: FuelEntry) => void;
  onDelete: (slNo: number) => void;
}

export default function FuelTable({ entries, onEdit, onDelete }: Props) {
  const { toast } = useToast();
  const [editingSlNo, setEditingSlNo] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<FuelEntry>>({});

  const startEdit = (entry: FuelEntry) => {
    setEditingSlNo(entry.slNo);
    setEditData({ ...entry });
  };

  const cancelEdit = () => {
    setEditingSlNo(null);
    setEditData({});
  };

  const saveEdit = () => {
    const updated = { ...editData } as FuelEntry;
    updated.issued = (updated.issuedThroughIndentLtrs || 0) + (updated.issuedThroughBarrelLtrs || 0);
    updated.balance = (updated.openingBalance || 0) + updated.purchased - updated.issued;
    onEdit(updated);
    toast({ title: "Entry updated!" });
    setEditingSlNo(null);
    setEditData({});
  };

  const handleDelete = (slNo: number) => {
    onDelete(slNo);
    toast({ title: "Entry deleted!" });
  };

  const setField = (key: keyof FuelEntry, val: any) => {
    setEditData(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SL.NO.</TableHead>
            <TableHead>DATE</TableHead>
            <TableHead>SITE NAME</TableHead>
            <TableHead>FUEL TYPE</TableHead>
            <TableHead>OPENING BALANCE (LTRS)</TableHead>
            <TableHead>FUEL PURCHASED (LTRS)</TableHead>
            <TableHead>INDENT NO.</TableHead>
            <TableHead>FUEL ISSUED THROUGH INDENT (LTRS)</TableHead>
            <TableHead>FUEL ISSUED THROUGH BARREL (LTRS)</TableHead>
            <TableHead>TOTAL FUEL ISSUED (LTRS)</TableHead>
            <TableHead>BALANCE FUEL (LTRS)</TableHead>
            <TableHead>ACTION</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 && (
            <TableRow>
              <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                No entries yet. Add your first fuel entry above.
              </TableCell>
            </TableRow>
          )}
          {entries.map((entry) => {
            const isEditing = editingSlNo === entry.slNo;
            const d = isEditing ? editData : entry;
            const editOB = Number(d.openingBalance) || 0;
            const editPurchased = Number(d.purchased) || 0;
            const editIndent = Number(d.issuedThroughIndentLtrs) || 0;
            const editBarrel = Number(d.issuedThroughBarrelLtrs) || 0;
            const editIssued = editIndent + editBarrel;
            const editBalance = editOB + editPurchased - editIssued;

            return (
              <TableRow key={entry.slNo}>
                <TableCell>{entry.slNo}</TableCell>
                <TableCell>{entry.date}</TableCell>
                <TableCell>{entry.siteName}</TableCell>
                <TableCell>{entry.fuelType}</TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input type="number" className="w-24" value={d.openingBalance} onChange={e => setField("openingBalance", Number(e.target.value))} />
                  ) : (entry.openingBalance ?? 0).toLocaleString("en-IN")}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input type="number" className="w-24" value={d.purchased} onChange={e => setField("purchased", Number(e.target.value))} />
                  ) : entry.purchased.toLocaleString("en-IN")}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input className="w-24" value={d.indentNumber} onChange={e => setField("indentNumber", e.target.value.toUpperCase())} />
                  ) : (entry.indentNumber || "—")}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input type="number" className="w-24" value={d.issuedThroughIndentLtrs} onChange={e => setField("issuedThroughIndentLtrs", Number(e.target.value))} />
                  ) : (entry.issuedThroughIndentLtrs ?? 0).toLocaleString("en-IN")}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input type="number" className="w-24" value={d.issuedThroughBarrelLtrs} onChange={e => setField("issuedThroughBarrelLtrs", Number(e.target.value))} />
                  ) : (entry.issuedThroughBarrelLtrs ?? 0).toLocaleString("en-IN")}
                </TableCell>
                <TableCell>
                  {isEditing ? editIssued.toLocaleString("en-IN") : entry.issued.toLocaleString("en-IN")}
                </TableCell>
                <TableCell>
                  {isEditing ? editBalance.toLocaleString("en-IN") : entry.balance.toLocaleString("en-IN")}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={saveEdit}><Check className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={cancelEdit}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(entry)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(entry.slNo)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
