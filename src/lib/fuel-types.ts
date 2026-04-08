export interface FuelEntry {
  slNo: number;
  date: string;
  siteName: string;
  fuelType: "PETROL" | "DIESEL";
  openingBalance: number;
  purchased: number;
  indentNumber: string;
  issuedThroughIndentLtrs: number;
  issuedThroughBarrelLtrs: number;
  issued: number;
  balance: number;
}

export const DEFAULT_SITES = [
  "BHOSGA", "ALAND", "ANNIGERI", "HEXA", "RONA",
  "AYANA", "GUNNAL", "VIVID", "MANAGOLI",
  "TATA ELECTRICAL (MUDHOL)"
] as const;

export const FUEL_TYPES = ["PETROL", "DIESEL"] as const;

export function formatDateDDMMYYYY(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

export function parseDateDDMMYYYY(str: string): Date | null {
  const parts = str.split("-");
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const y = parseInt(parts[2], 10);
  const date = new Date(y, m, d);
  if (isNaN(date.getTime())) return null;
  return date;
}

export function getYesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

export function getStoredCustomSites(): string[] {
  try {
    return JSON.parse(localStorage.getItem("customSites") || "[]");
  } catch { return []; }
}

export function saveCustomSites(sites: string[]) {
  localStorage.setItem("customSites", JSON.stringify(sites));
}

export function getStoredEntries(): FuelEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem("fuelEntries") || "[]");
    return raw.map((e: any) => ({
      ...e,
      openingBalance: e.openingBalance ?? 0,
      indentNumber: e.indentNumber || "",
      issuedThroughIndentLtrs: e.issuedThroughIndentLtrs ?? 0,
      issuedThroughBarrelLtrs: e.issuedThroughBarrelLtrs ?? 0,
    }));
  } catch { return []; }
}

export function saveEntries(entries: FuelEntry[]) {
  localStorage.setItem("fuelEntries", JSON.stringify(entries));
}

/**
 * Get the last balance for a given site + fuel type from existing entries.
 * Returns 0 if no previous entry exists.
 */
export function getLastBalanceForSite(
  entries: FuelEntry[],
  siteName: string,
  fuelType: "PETROL" | "DIESEL"
): number {
  const siteEntries = entries.filter(
    e => e.siteName === siteName && e.fuelType === fuelType
  );
  if (siteEntries.length === 0) return 0;
  // Use the last entry's balance (entries are ordered by slNo)
  const last = siteEntries[siteEntries.length - 1];
  return last.balance;
}
