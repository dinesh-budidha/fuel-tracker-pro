import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DEFAULT_SITES, getStoredCustomSites } from "@/lib/fuel-types";

interface Props {
  value: string;
  onChange: (v: string) => void;
  usedSites: string[];
}

export default function SiteFilter({ value, onChange, usedSites }: Props) {
  const allSites = Array.from(new Set([...DEFAULT_SITES, ...getStoredCustomSites(), ...usedSites]));

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Filter:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL SITES">ALL SITES</SelectItem>
          {allSites.map(s => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
