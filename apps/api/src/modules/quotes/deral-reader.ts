import { inflateRawSync } from 'node:zlib';

// A deliberately bounded reader for the public SIMA XLSX, not an Excel engine.
// Reads cached cells only. Never evaluates formulas, follows external links or
// extracts archive paths to disk. Unexpected layouts fail closed.
export function xlsxPart(zip: Buffer, name: string): string {
  if (zip.length > 2_000_000) throw new Error('SIMA archive too large');
  let end = zip.length - 22;
  while (end >= Math.max(0, zip.length - 65557) && zip.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0 || zip.readUInt32LE(end) !== 0x06054b50) throw new Error('Invalid ZIP');
  const entries = zip.readUInt16LE(end + 10);
  let offset = zip.readUInt32LE(end + 16);
  if (entries > 300) throw new Error('Too many ZIP entries');
  for (let i = 0; i < entries; i++) {
    if (offset + 46 > zip.length || zip.readUInt32LE(offset) !== 0x02014b50) throw new Error('Invalid directory');
    const size = zip.readUInt32LE(offset + 20);
    const expanded = zip.readUInt32LE(offset + 24);
    const length = zip.readUInt16LE(offset + 28);
    const extra = zip.readUInt16LE(offset + 30);
    const comment = zip.readUInt16LE(offset + 32);
    const path = zip.subarray(offset + 46, offset + 46 + length).toString('utf8');
    if (path === name) {
      const local = zip.readUInt32LE(offset + 42);
      const method = zip.readUInt16LE(offset + 10);
      if (expanded > 2_000_000 || size > 2_000_000 || (zip.readUInt16LE(offset + 8) & 1) || local + 30 > zip.length || zip.readUInt32LE(local) !== 0x04034b50) throw new Error('Unsupported ZIP entry');
      const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
      if (start + size > zip.length) throw new Error('Truncated ZIP');
      const data = zip.subarray(start, start + size);
      const result = method === 0 ? data : method === 8 ? inflateRawSync(data, { maxOutputLength: 2_000_000 }) : null;
      if (!result || result.length !== expanded) throw new Error('Invalid ZIP size');
      return result.toString('utf8');
    }
    offset += 46 + length + extra + comment;
  }
  throw new Error('Missing XLSX part');
}

const text = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(m => m[1]).join('')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").trim();

export interface GrainPrice { symbol: string; name: string; price: number; region: string; observedOn: string; unit: string }

export function parseSima(zip: Buffer, date: string): GrainPrice[] {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(date)) throw new Error('Invalid SIMA date');
  const [day, month, year] = date.split('-');
  const observedOn = `${year}-${month}-${day}`;
  const parsedDate = new Date(`${observedOn}T00:00:00Z`);
  if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== observedOn) throw new Error('Invalid SIMA date');
  const workbook = xlsxPart(zip, 'xl/workbook.xml');
  const first = workbook.match(/<sheet\s[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/);
  if (!first || first[1] !== date) throw new Error('SIMA date mismatch');
  const relationships = xlsxPart(zip, 'xl/_rels/workbook.xml.rels');
  const relationship = [...relationships.matchAll(/<Relationship\s[^>]*\/>/g)].find(m => m[0].includes(`Id="${first[2]}"`))?.[0];
  const path = relationship?.match(/Target="(worksheets\/sheet\d+\.xml)"/)?.[1];
  if (!path) throw new Error('Unexpected sheet relationship');
  const strings = [...xlsxPart(zip, 'xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => text(m[1]));
  const cells = new Map<string, string | number>();
  const sheet = xlsxPart(zip, `xl/${path}`).replace(/<c\b[^>]*\/>/g, '');
  for (const m of sheet.matchAll(/<c\s([^>]+)>([\s\S]*?)<\/c>/g)) {
    const address = m[1].match(/\br="([A-Z]+\d+)"/)?.[1];
    const value = m[2].match(/<v>([^<]+)<\/v>/)?.[1];
    if (!address || value === undefined) continue;
    cells.set(address, /\bt="s"/.test(m[1]) ? strings[Number(value)] : /\bt=/.test(m[1]) ? '' : Number(value));
  }
  if (cells.get('W4') !== 'Média' || cells.get('W5') !== 'Diária' || !String(cells.get('J3')).includes('ATACADISTAS PARANAENSES')) throw new Error('SIMA header changed');
  const prices: GrainPrice[] = [];
  for (const [address, label] of cells) {
    if (!/^A\d+$/.test(address) || typeof label !== 'string') continue;
    const symbol = /^Soja industrial tipo 1\s+sc 60 Kg$/i.test(label) ? 'SOJA' : /^Milho amarelo tipo 1\s+sc 60 Kg$/i.test(label) ? 'MILHO' : null;
    if (!symbol) continue;
    const row = Number(address.slice(1)) + 1;
    if (cells.get(`B${row}`) !== 'M_C') throw new Error('Missing common-price row');
    const price = cells.get(`W${row}`);
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0 || price > 10000) throw new Error('Invalid grain price');
    prices.push({ symbol, name: symbol === 'SOJA' ? 'Soja' : 'Milho', price, region: 'Paraná · média estadual', observedOn, unit: 'R$/saca 60 kg' });
  }
  if (prices.length !== 2 || new Set(prices.map(p => p.symbol)).size !== 2) throw new Error('Missing or duplicate grains');
  return prices.sort((a, b) => b.symbol.localeCompare(a.symbol));
}
