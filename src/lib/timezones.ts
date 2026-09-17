/**
 * Complete IANA Timezone Database & Utilities
 * Provides comprehensive timezone metadata, dynamic DST offset calculation,
 * region grouping, and search indexing for the Chatly UI.
 */

export interface TimezoneItem {
  iana: string;
  region: string;
  city: string;
  longName: string;
  shortName: string;
  offset: string;
  searchIndex: string;
}

export interface RegionGroup {
  region: string;
  timezones: TimezoneItem[];
}

export const ORDERED_REGIONS = [
  'Africa',
  'America',
  'Antarctica',
  'Asia',
  'Atlantic',
  'Australia',
  'Europe',
  'Indian',
  'Pacific',
  'Other'
] as const;

// Common country search keywords to enrich searchIndex
const COUNTRY_KEYWORDS: Record<string, string[]> = {
  'Asia/Kolkata': ['india', 'ist', 'delhi', 'mumbai', 'bangalore'],
  'Asia/Calcutta': ['india', 'ist', 'kolkata'],
  'Europe/London': ['uk', 'united kingdom', 'england', 'britain', 'gmt', 'bst'],
  'America/New_York': ['usa', 'us', 'united states', 'eastern', 'est', 'edt', 'nyc'],
  'America/Chicago': ['usa', 'us', 'united states', 'central', 'cst', 'cdt'],
  'America/Denver': ['usa', 'us', 'united states', 'mountain', 'mst', 'mdt'],
  'America/Los_Angeles': ['usa', 'us', 'united states', 'pacific', 'pst', 'pdt', 'california', 'sf', 'la'],
  'America/Phoenix': ['usa', 'us', 'arizona'],
  'America/Toronto': ['canada', 'ontario'],
  'America/Vancouver': ['canada', 'british columbia'],
  'Europe/Paris': ['france', 'cet', 'cest'],
  'Europe/Berlin': ['germany', 'deutschland', 'cet', 'cest'],
  'Europe/Kyiv': ['ukraine'],
  'Europe/Rome': ['italy'],
  'Europe/Madrid': ['spain'],
  'Europe/Amsterdam': ['netherlands', 'holland'],
  'Europe/Zurich': ['switzerland'],
  'Asia/Tokyo': ['japan', 'jst'],
  'Asia/Dubai': ['uae', 'united arab emirates', 'gulf'],
  'Asia/Singapore': ['singapore', 'sgt'],
  'Asia/Hong_Kong': ['hong kong', 'hkt'],
  'Asia/Shanghai': ['china', 'cst', 'beijing'],
  'Asia/Seoul': ['south korea', 'korea', 'kst'],
  'Asia/Jakarta': ['indonesia', 'wib'],
  'Asia/Bangkok': ['thailand'],
  'Asia/Riyadh': ['saudi arabia'],
  'Australia/Sydney': ['australia', 'nsw', 'aest', 'aedt'],
  'Australia/Melbourne': ['australia', 'victoria'],
  'Australia/Brisbane': ['australia', 'queensland'],
  'Australia/Perth': ['australia', 'awst'],
  'Pacific/Auckland': ['new zealand', 'nz', 'nzst', 'nzdt'],
  'America/Sao_Paulo': ['brazil', 'brasil'],
  'America/Mexico_City': ['mexico'],
  'America/Buenos_Aires': ['argentina'],
  'America/Bogota': ['colombia'],
  'Africa/Cairo': ['egypt'],
  'Africa/Johannesburg': ['south africa', 'sast'],
  'Africa/Lagos': ['nigeria', 'wat'],
  'Africa/Nairobi': ['kenya', 'eat'],
};

// Cached timezones list
let cachedTimezones: TimezoneItem[] | null = null;

/**
 * Normalizes legacy saved timezone strings like "America/Chicago (CST - UTC-6)"
 * to canonical IANA identifier "America/Chicago".
 */
export function normalizeIanaTimezone(raw: string | null | undefined): string {
  if (!raw) return 'America/Chicago';
  let cleaned = raw.trim();
  if (cleaned.includes(' ') && (cleaned.includes('(') || cleaned.includes('-') || cleaned.includes('+'))) {
    cleaned = cleaned.split(' ')[0].trim();
  }
  return cleaned || 'America/Chicago';
}

/**
 * Formats a city name cleanly from the IANA string (e.g. America/Argentina/Buenos_Aires -> Buenos Aires)
 */
export function formatCityName(iana: string): string {
  const parts = iana.split('/');
  if (parts.length <= 1) return iana;
  return parts.slice(1).join(' - ').replace(/_/g, ' ');
}

/**
 * Gets the current system/browser detected IANA timezone
 */
export function getBrowserTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || 'America/Chicago';
  } catch {
    return 'America/Chicago';
  }
}

/**
 * Dynamically formats timezone details including live DST UTC offset
 */
export function buildTimezoneItem(iana: string, refDate: Date = new Date()): TimezoneItem {
  const parts = iana.split('/');
  const region = ORDERED_REGIONS.includes(parts[0] as any) ? parts[0] : 'Other';
  const city = formatCityName(iana);

  let longName = '';
  let shortName = '';
  let offset = 'UTC+00:00';

  try {
    const dtfLong = new Intl.DateTimeFormat('en-US', { timeZone: iana, timeZoneName: 'long' });
    const formattedParts = dtfLong.formatToParts(refDate);
    longName = formattedParts.find(p => p.type === 'timeZoneName')?.value || '';

    const dtfShort = new Intl.DateTimeFormat('en-US', { timeZone: iana, timeZoneName: 'short' });
    const shortParts = dtfShort.formatToParts(refDate);
    shortName = shortParts.find(p => p.type === 'timeZoneName')?.value || '';

    const dtfOffset = new Intl.DateTimeFormat('en-US', { timeZone: iana, timeZoneName: 'longOffset' });
    const offsetParts = dtfOffset.formatToParts(refDate);
    const rawOffset = offsetParts.find(p => p.type === 'timeZoneName')?.value || '';
    offset = rawOffset.replace('GMT', 'UTC');
    if (!offset.startsWith('UTC')) {
      offset = 'UTC' + offset;
    }
  } catch {
    longName = city;
    shortName = '';
    offset = 'UTC';
  }

  const extraKeywords = (COUNTRY_KEYWORDS[iana] || []).join(' ');
  const searchIndex = `${iana} ${city} ${longName} ${shortName} ${offset} ${extraKeywords}`.toLowerCase();

  return {
    iana,
    region,
    city,
    longName: longName || city,
    shortName,
    offset,
    searchIndex
  };
}

/**
 * Retrieves the full IANA timezone database with rich metadata, sorted by region and city
 */
export function getAllTimezones(): TimezoneItem[] {
  if (cachedTimezones) {
    return cachedTimezones;
  }

  let ianaList: string[] = [];

  if (typeof Intl !== 'undefined' && typeof (Intl as any).supportedValuesOf === 'function') {
    try {
      ianaList = (Intl as any).supportedValuesOf('timeZone');
    } catch {
      ianaList = [];
    }
  }

  // Ensure widely used aliases and key locations are always present
  const essentialTimezones = [
    'Asia/Kolkata',
    'Europe/Kyiv',
    'America/Nuuk',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Dubai',
    'Asia/Singapore',
    'Australia/Sydney',
    'Pacific/Auckland',
    'UTC'
  ];

  const combinedSet = new Set<string>([...ianaList, ...essentialTimezones]);
  const sortedIana = Array.from(combinedSet).sort((a, b) => a.localeCompare(b));

  const now = new Date();
  cachedTimezones = sortedIana.map(iana => buildTimezoneItem(iana, now));
  return cachedTimezones;
}

/**
 * Filter timezones by search query
 */
export function searchTimezones(query: string, items: TimezoneItem[] = getAllTimezones()): TimezoneItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  return items.filter(item => item.searchIndex.includes(q));
}

/**
 * Groups a list of timezone items by region
 */
export function groupTimezonesByRegion(items: TimezoneItem[]): RegionGroup[] {
  const groups: Record<string, TimezoneItem[]> = {};

  for (const item of items) {
    const r = item.region || 'Other';
    if (!groups[r]) {
      groups[r] = [];
    }
    groups[r].push(item);
  }

  const result: RegionGroup[] = [];
  for (const region of ORDERED_REGIONS) {
    if (groups[region] && groups[region].length > 0) {
      result.push({
        region,
        timezones: groups[region]
      });
    }
  }

  // Any other uncategorized
  for (const [region, tzs] of Object.entries(groups)) {
    if (!ORDERED_REGIONS.includes(region as any) && tzs.length > 0) {
      result.push({ region, timezones: tzs });
    }
  }

  return result;
}

/**
 * Finds details for a specific IANA identifier, falling back to a dynamically constructed item
 */
export function getTimezoneInfo(rawIana: string | null | undefined): TimezoneItem {
  const canonical = normalizeIanaTimezone(rawIana);
  const all = getAllTimezones();
  const found = all.find(t => t.iana === canonical);
  if (found) return found;

  // Fallback if not in pre-cached set
  return buildTimezoneItem(canonical);
}
