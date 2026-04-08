import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import type { FuelEntry } from "@/lib/fuel-types";

interface Props {
  entries: FuelEntry[];
}

export default function ExportButton({ entries }: Props) {
  const handleExport = () => {
    const data = entries.map(e => ({
      "SL.NO.": e.slNo,
      "DATE": e.date,
      "SITE NAME": e.siteName,
      "FUEL TYPE": e.fuelType,
      "OPENING BALANCE (LTRS)": e.openingBalance ?? 0,
      "FUEL PURCHASED (LTRS)": e.purchased,
      "INDENT NO.": e.indentNumber || "",
      "FUEL ISSUED THROUGH INDENT (LTRS)": e.issuedThroughIndentLtrs,
      "FUEL ISSUED THROUGH BARREL (LTRS)": e.issuedThroughBarrelLtrs,
      "TOTAL FUEL ISSUED (LTRS)": e.issued,
      "BALANCE FUEL (LTRS)": e.balance,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fuel Report");
    XLSX.writeFile(wb, "Fuel_Report.xlsx");
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Download Excel
    </Button>
  );
}
