import React, { useState, useRef } from 'react';
import { Search, Zap, User, Map, Home, Car, ShoppingBag, Loader, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SearchResult, NLPSearchQuery, Citizen, LandRecord, HouseProperty, Vehicle, RationCard } from '../types';
import { performNLPSearch, SUGGESTED_QUERIES } from '../services/searchService';

const INTENT_LABELS: Record<string, { label: string; color: string }> = {
  find_citizen:    { label: 'Citizen Search',     color: 'bg-blue-100 text-blue-700' },
  find_lands:      { label: 'Land Records',       color: 'bg-green-100 text-green-700' },
  find_properties: { label: 'Properties',         color: 'bg-purple-100 text-purple-700' },
  find_vehicles:   { label: 'Vehicles',           color: 'bg-indigo-100 text-indigo-700' },
  find_ration_card:{ label: 'Ration Cards',       color: 'bg-yellow-100 text-yellow-700' },
  find_all_assets: { label: 'Complete Profile',   color: 'bg-ap-gold/20 text-ap-gold-dark' },
  unknown:         { label: 'General Search',     color: 'bg-gray-100 text-gray-600' },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  citizen:     <User size={16} />,
  land:        <Map size={16} />,
  property:    <Home size={16} />,
  vehicle:     <Car size={16} />,
  ration_card: <ShoppingBag size={16} />,
};

const TYPE_LABELS: Record<string, string> = {
  citizen: 'Citizen', land: 'Land', property: 'Property', vehicle: 'Vehicle', ration_card: 'Ration Card',
};

const TYPE_COLORS: Record<string, string> = {
  citizen: 'bg-blue-50 border-blue-200 text-blue-700',
  land: 'bg-green-50 border-green-200 text-green-700',
  property: 'bg-purple-50 border-purple-200 text-purple-700',
  vehicle: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  ration_card: 'bg-yellow-50 border-yellow-200 text-yellow-700',
};

function CitizenCard({ c, navigate }: { c: Citizen; navigate: (to: string) => void }) {
  return (
    <div
      onClick={() => navigate(`/citizens/${c.id}`)}
      className="p-4 rounded-lg border border-gray-200 hover:border-ap-blue/40 hover:shadow-sm cursor-pointer transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-ap-blue/10 flex items-center justify-center flex-shrink-0">
          <span className="text-ap-blue font-bold text-sm">{c.firstName.charAt(0)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-800 group-hover:text-ap-blue">{c.firstName} {c.lastName}</div>
          <div className="text-xs text-gray-500 mt-0.5">{c.address.mandal}, {c.address.district}</div>
          <div className="text-xs text-gray-400 font-mono mt-1">Aadhaar: {c.aadhaarNumber}</div>
        </div>
        <ChevronRight size={16} className="text-gray-300 group-hover:text-ap-blue flex-shrink-0" />
      </div>
    </div>
  );
}

function LandCard({ l }: { l: LandRecord }) {
  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  return (
    <div className="p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-gray-800">Survey: {l.surveyNumber}</div>
          <div className="text-xs text-gray-500">{l.village}, {l.mandal}, {l.district}</div>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{l.landType}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
        <span className="text-gray-500">Extent: <b>{l.extentInAcres} acres</b></span>
        <span className="text-gray-500">Value: <b>{fmt(l.marketValue)}</b></span>
      </div>
    </div>
  );
}

function PropertyCard({ p }: { p: HouseProperty }) {
  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  return (
    <div className="p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-gray-800">{p.doorNo}, {p.street}</div>
          <div className="text-xs text-gray-500">{p.village}, {p.mandal}, {p.district}</div>
        </div>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{p.propertyType}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
        <span className="text-gray-500">Area: <b>{p.builtUpArea} sq ft</b></span>
        <span className="text-gray-500">Value: <b>{fmt(p.marketValue)}</b></span>
      </div>
    </div>
  );
}

function VehicleCard({ v }: { v: Vehicle }) {
  return (
    <div className="p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-gray-800 font-mono">{v.registrationNumber}</div>
          <div className="text-xs text-gray-500">{v.make} {v.model} ({v.year})</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${v.vehicleType === 'Four Wheeler' ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'}`}>{v.vehicleType}</span>
      </div>
      <div className="text-xs text-gray-500 mt-2">Color: {v.color} · Fuel: {v.fuelType}</div>
    </div>
  );
}

function RationCardCard({ r }: { r: RationCard }) {
  return (
    <div className="p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-gray-800 font-mono">{r.cardNumber}</div>
          <div className="text-xs text-gray-500">HoF: {r.headOfFamily}</div>
        </div>
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{r.cardType}</span>
      </div>
      <div className="text-xs text-gray-500 mt-2">Family: {r.familySize} members · Shop: {r.shop}</div>
    </div>
  );
}

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [parsedQuery, setParsedQuery] = useState<NLPSearchQuery | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = async (q?: string) => {
    const searchTerm = q || query;
    if (!searchTerm.trim() || searchTerm.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const { results: r, parsedQuery: p } = await performNLPSearch(searchTerm);
      setResults(r);
      setParsedQuery(p);
    } catch (e) {
      setResults([]);
    }
    setLoading(false);
  };

  const handleSuggestion = (s: string) => {
    setQuery(s);
    doSearch(s);
    inputRef.current?.focus();
  };

  // Group results by type
  const grouped = results.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const intentInfo = parsedQuery ? INTENT_LABELS[parsedQuery.intent] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Sparkles size={24} className="text-ap-gold" /> NLP Smart Search
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Search in natural language — by Aadhaar, name, district, or asset type
        </p>
      </div>

      {/* Search Bar */}
      <div className="gov-card">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              className="gov-input pl-10 py-3 text-base"
              placeholder="e.g. Show all assets for 234567890123 or find land records in Guntur..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
            />
          </div>
          <button
            onClick={() => doSearch()}
            disabled={loading || !query.trim()}
            className="btn-primary px-6 py-3 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
            Search
          </button>
        </div>

        {/* Suggested Queries */}
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Try these queries</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUERIES.slice(0, 5).map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-ap-blue hover:text-ap-blue hover:bg-ap-blue/5 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          {/* Search metadata */}
          {parsedQuery && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Zap size={14} className="text-ap-gold" />
                <span>Detected intent:</span>
              </div>
              {intentInfo && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${intentInfo.color}`}>
                  {intentInfo.label}
                </span>
              )}
              {parsedQuery.aadhaarNumber && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-mono">
                  Aadhaar: {parsedQuery.aadhaarNumber}
                </span>
              )}
              {parsedQuery.name && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  Name: {parsedQuery.name}
                </span>
              )}
              <span className="text-xs text-gray-400 ml-auto">{results.length} result{results.length !== 1 ? 's' : ''} found</span>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <Loader size={32} className="animate-spin mx-auto text-ap-blue mb-3" />
              <p className="text-gray-500">Searching across all records...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="gov-card text-center py-12">
              <Search size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500 font-medium">No results found</p>
              <p className="text-sm text-gray-400 mt-1">Try a different query or check the Aadhaar number</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([type, typeResults]) => (
                <div key={type}>
                  <div className={`inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full border mb-3 ${TYPE_COLORS[type]}`}>
                    {TYPE_ICONS[type]}
                    {TYPE_LABELS[type]} ({typeResults.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {typeResults.map((r, i) => {
                      if (r.type === 'citizen') return <CitizenCard key={i} c={r.data as Citizen} navigate={navigate} />;
                      if (r.type === 'land') return <LandCard key={i} l={r.data as LandRecord} />;
                      if (r.type === 'property') return <PropertyCard key={i} p={r.data as HouseProperty} />;
                      if (r.type === 'vehicle') return <VehicleCard key={i} v={r.data as Vehicle} />;
                      if (r.type === 'ration_card') return <RationCardCard key={i} r={r.data as RationCard} />;
                      return null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!searched && (
        <div className="gov-card text-center py-16">
          <div className="w-20 h-20 rounded-full bg-ap-blue/10 flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-ap-blue" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Intelligent Citizen Search</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Enter a natural language query. You can search by Aadhaar number, citizen name, district, or specify what assets you're looking for.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
            {[
              { icon: '🏷️', text: 'Aadhaar-based lookup' },
              { icon: '👤', text: 'Citizen name search' },
              { icon: '🌾', text: 'Land & property search' },
              { icon: '🚗', text: 'Vehicle registration search' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                <span>{item.icon}</span> {item.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
