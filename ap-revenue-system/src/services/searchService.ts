// ============================================================
// AP Revenue ICAMS - NLP Search Service
// ============================================================

import Fuse from 'fuse.js';
import nlp from 'compromise';
import { NLPSearchQuery, SearchResult, Citizen, LandRecord, HouseProperty, Vehicle, RationCard } from '../types';
import { citizenDB, landDB, propertyDB, vehicleDB, rationCardDB } from './dbService';

// Extract 12-digit Aadhaar from text
function extractAadhaar(text: string): string | undefined {
  const match = text.match(/\b(\d{12})\b/);
  return match ? match[1] : undefined;
}

// Determine search intent from query
function detectIntent(query: string): NLPSearchQuery['intent'] {
  const lower = query.toLowerCase();

  // All assets intent
  if (/(all assets|complete profile|everything|full details|all records|all information)/i.test(lower)) {
    return 'find_all_assets';
  }
  // Land intent
  if (/(land|survey|patta|agriculture|plot|extent|acr|survey no|land record)/i.test(lower)) {
    return 'find_lands';
  }
  // Property intent
  if (/(house|property|propert|flat|apartment|building|constructed|door no|dwelling|villa)/i.test(lower)) {
    return 'find_properties';
  }
  // Vehicle intent
  if (/(vehicle|car|bike|motorcycle|scooter|two wheeler|four wheeler|registr|transport|engine)/i.test(lower)) {
    return 'find_vehicles';
  }
  // Ration card intent
  if (/(ration|card|ration card|phh|aay|food|bpl|apl|nphh|shop|entitlement)/i.test(lower)) {
    return 'find_ration_card';
  }
  // Citizen intent (default for aadhaar searches)
  if (/(citizen|person|detail|profile|name|aadhaar|aadhar)/i.test(lower)) {
    return 'find_citizen';
  }

  return 'find_citizen';
}

// Parse NLP query
export function parseNLPQuery(rawQuery: string): NLPSearchQuery {
  const doc = nlp(rawQuery);
  const aadhaar = extractAadhaar(rawQuery);
  const intent = detectIntent(rawQuery);

  // Extract named entities using compromise
  const people = doc.people().out('array') as string[];
  const places = doc.places().out('array') as string[];

  const extractedEntities: Record<string, string> = {};
  if (people.length > 0) extractedEntities['name'] = people[0];
  if (places.length > 0) extractedEntities['location'] = places[0];
  if (aadhaar) extractedEntities['aadhaar'] = aadhaar;

  return {
    originalQuery: rawQuery,
    intent,
    aadhaarNumber: aadhaar,
    name: people[0],
    extractedEntities,
  };
}

// Main search function
export async function performNLPSearch(query: string): Promise<{ results: SearchResult[]; parsedQuery: NLPSearchQuery }> {
  const parsedQuery = parseNLPQuery(query);
  const results: SearchResult[] = [];

  // Search by Aadhaar number (exact match)
  if (parsedQuery.aadhaarNumber) {
    const aadhaar = parsedQuery.aadhaarNumber;

    if (parsedQuery.intent === 'find_citizen' || parsedQuery.intent === 'find_all_assets') {
      const citizen = await citizenDB.getByAadhaar(aadhaar);
      if (citizen) results.push({ type: 'citizen', data: citizen });
    }

    if (parsedQuery.intent === 'find_lands' || parsedQuery.intent === 'find_all_assets') {
      const lands = await landDB.getByAadhaar(aadhaar);
      lands.forEach(l => results.push({ type: 'land', data: l }));
    }

    if (parsedQuery.intent === 'find_properties' || parsedQuery.intent === 'find_all_assets') {
      const props = await propertyDB.getByAadhaar(aadhaar);
      props.forEach(p => results.push({ type: 'property', data: p }));
    }

    if (parsedQuery.intent === 'find_vehicles' || parsedQuery.intent === 'find_all_assets') {
      const vehs = await vehicleDB.getByAadhaar(aadhaar);
      vehs.forEach(v => results.push({ type: 'vehicle', data: v }));
    }

    if (parsedQuery.intent === 'find_ration_card' || parsedQuery.intent === 'find_all_assets') {
      const rcs = await rationCardDB.getByAadhaar(aadhaar);
      rcs.forEach(r => results.push({ type: 'ration_card', data: r }));
    }
  }

  // Fuzzy search by name if no Aadhaar
  if (results.length === 0 && query.trim().length >= 3) {
    const allCitizens = await citizenDB.getAll();
    const fuse = new Fuse(allCitizens, {
      keys: [
        { name: 'firstName', weight: 2 },
        { name: 'lastName', weight: 2 },
        { name: 'aadhaarNumber', weight: 3 },
        { name: 'mobile', weight: 1.5 },
        { name: 'address.district', weight: 1 },
        { name: 'address.mandal', weight: 1 },
      ],
      threshold: 0.4,
      includeScore: true,
    });

    // Clean query - remove common keywords
    const cleanQuery = query
      .replace(/(show|find|get|display|list|all|assets|details|for|of|citizen|person|linked to|aadhaar|aadhar)/gi, '')
      .trim();

    const fuseResults = fuse.search(cleanQuery.length >= 2 ? cleanQuery : query);
    for (const fr of fuseResults.slice(0, 10)) {
      results.push({ type: 'citizen', data: fr.item, score: fr.score });
    }
  }

  return { results, parsedQuery };
}

// Global text search across all entities
export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  const results: SearchResult[] = [];
  const lower = query.toLowerCase();

  // Search citizens
  const citizens = await citizenDB.getAll();
  const citizenFuse = new Fuse(citizens, {
    keys: ['firstName', 'lastName', 'aadhaarNumber', 'mobile', 'address.district', 'address.mandal'],
    threshold: 0.35,
    includeScore: true,
  });
  citizenFuse.search(query).slice(0, 5).forEach(r => results.push({ type: 'citizen', data: r.item, score: r.score }));

  // Search lands
  const lands = await landDB.getAll();
  const landFuse = new Fuse(lands, {
    keys: ['surveyNumber', 'village', 'mandal', 'district', 'pattaNumber'],
    threshold: 0.35,
    includeScore: true,
  });
  landFuse.search(query).slice(0, 3).forEach(r => results.push({ type: 'land', data: r.item, score: r.score }));

  // Search vehicles by registration
  const vehicles = await vehicleDB.getAll();
  const vehFuse = new Fuse(vehicles, {
    keys: ['registrationNumber', 'make', 'model', 'engineNumber', 'chassisNumber'],
    threshold: 0.3,
    includeScore: true,
  });
  vehFuse.search(query).slice(0, 3).forEach(r => results.push({ type: 'vehicle', data: r.item, score: r.score }));

  // Search ration cards
  const rcs = await rationCardDB.getAll();
  const rcFuse = new Fuse(rcs, {
    keys: ['cardNumber', 'headOfFamily', 'shop'],
    threshold: 0.35,
    includeScore: true,
  });
  rcFuse.search(lower).slice(0, 2).forEach(r => results.push({ type: 'ration_card', data: r.item, score: r.score }));

  return results.sort((a, b) => (a.score || 0) - (b.score || 0));
}

// Suggested NLP queries for the search help panel
export const SUGGESTED_QUERIES = [
  'Show all assets for Aadhaar 234567890123',
  'Find land records for Aadhaar 234567890123',
  'Display vehicles linked to Aadhaar 234567890123',
  'Show house properties for Aadhaar 234567890123',
  'Get ration card details for Aadhaar 234567890123',
  'Show complete profile for citizen',
  'Find all two wheelers in Guntur district',
  'List citizens in Vijayawada mandal',
];
