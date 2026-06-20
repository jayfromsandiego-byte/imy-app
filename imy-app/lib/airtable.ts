// Minimal Airtable client for the I Miss You Memorial app.
// Runs in the Next.js Node runtime (standard fetch; no proxy quirks in production).

const PAT = process.env.AIRTABLE_PAT!;
const BASE = process.env.AIRTABLE_BASE_ID!;
const API = `https://api.airtable.com/v0/${BASE}`;

async function af(pathAndQuery: string, init?: RequestInit) {
  const res = await fetch(`${API}/${pathAndQuery}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function createRecord(table: string, fields: Record<string, unknown>) {
  return af(encodeURIComponent(table), {
    method: "POST",
    body: JSON.stringify({ fields, typecast: true }),
  });
}

export async function getTributeBySlug(slug: string) {
  const formula = `{Slug}='${slug.replace(/'/g, "\\'")}'`;
  const data = await af(`Tributes?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`);
  return data.records?.[0] || null;
}
