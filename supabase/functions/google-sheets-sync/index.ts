const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FuelEntry {
  slNo: number;
  date: string;
  siteName: string;
  fuelType: string;
  openingBalance: number;
  purchased: number;
  indentNumber: string;
  issuedThroughIndentLtrs: number;
  issuedThroughBarrelLtrs: number;
  issued: number;
  balance: number;
}

const HEADERS = [
  "SL.NO.", "DATE", "SITE NAME", "FUEL TYPE", "OPENING BALANCE (LTRS)",
  "FUEL PURCHASED (LTRS)", "INDENT NO.", "FUEL ISSUED THROUGH INDENT (LTRS)",
  "FUEL ISSUED THROUGH BARREL (LTRS)", "TOTAL FUEL ISSUED (LTRS)", "BALANCE FUEL (LTRS)"
];

async function getAccessToken(serviceAccountKey: any): Promise<string> {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const claimSet = btoa(JSON.stringify({
    iss: serviceAccountKey.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }));

  const signInput = `${header}.${claimSet}`;
  const pemContent = serviceAccountKey.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5", cryptoKey,
    new TextEncoder().encode(signInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const jwt = `${header}.${claimSet}.${encodedSignature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(`Token error: ${JSON.stringify(tokenData)}`);
  return tokenData.access_token;
}

function rowToEntry(row: string[], index: number): FuelEntry {
  return {
    slNo: parseInt(row[0]) || index + 1,
    date: row[1] || "",
    siteName: row[2] || "",
    fuelType: (row[3] || "DIESEL") as "PETROL" | "DIESEL",
    openingBalance: parseFloat(row[4]) || 0,
    purchased: parseFloat(row[5]) || 0,
    indentNumber: row[6] || "",
    issuedThroughIndentLtrs: parseFloat(row[7]) || 0,
    issuedThroughBarrelLtrs: parseFloat(row[8]) || 0,
    issued: parseFloat(row[9]) || 0,
    balance: parseFloat(row[10]) || 0,
  };
}

function entryToRow(entry: FuelEntry): (string | number)[] {
  return [
    entry.slNo,
    entry.date,
    entry.siteName,
    entry.fuelType,
    entry.openingBalance ?? 0,
    entry.purchased,
    entry.indentNumber,
    entry.issuedThroughIndentLtrs,
    entry.issuedThroughBarrelLtrs,
    entry.issued,
    entry.balance,
  ];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const serviceAccountKeyRaw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    if (!serviceAccountKeyRaw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not configured");
    const sheetId = Deno.env.get("GOOGLE_SHEET_ID");
    if (!sheetId) throw new Error("GOOGLE_SHEET_ID is not configured");

    const serviceAccountKey = JSON.parse(serviceAccountKeyRaw);
    const accessToken = await getAccessToken(serviceAccountKey);
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`;

    const { action, entries } = await req.json();

    if (action === "read") {
      const res = await fetch(`${baseUrl}/values/Sheet1!A2:K?majorDimension=ROWS`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Sheets read error: ${JSON.stringify(data)}`);

      const rows = data.values || [];
      const fuelEntries: FuelEntry[] = rows
        .filter((row: string[]) => row.length > 0 && row[0])
        .map((row: string[], i: number) => rowToEntry(row, i));

      return new Response(JSON.stringify({ entries: fuelEntries }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "write") {
      if (!entries || !Array.isArray(entries)) {
        throw new Error("entries array is required for write action");
      }

      // Write headers
      await fetch(`${baseUrl}/values/Sheet1!A1:K1?valueInputOption=RAW`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [HEADERS] }),
      });

      // Clear old data
      await fetch(`${baseUrl}/values/Sheet1!A2:K?clear`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Write new data
      if (entries.length > 0) {
        const rows = entries.map((e: FuelEntry) => entryToRow(e));
        const writeRes = await fetch(
          `${baseUrl}/values/Sheet1!A2:K?valueInputOption=RAW`,
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ values: rows }),
          }
        );
        const writeData = await writeRes.json();
        if (!writeRes.ok) throw new Error(`Sheets write error: ${JSON.stringify(writeData)}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Google Sheets sync error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
