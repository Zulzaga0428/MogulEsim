import React, { useState } from 'react';
import { Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useListCountries } from '@workspace/api-client-react';
import { Search, MapPin, ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// With every Airalo destination listed, one catch-all tab held over a
// hundred countries, so each part of the world gets its own.
const REGION_TABS = [
  { key: 'asia',     labelMn: 'Ази',          labelEn: 'Asia',          regions: ['Asia'] },
  { key: 'europe',   labelMn: 'Европ',        labelEn: 'Europe',        regions: ['Europe'] },
  { key: 'americas', labelMn: 'Америк',       labelEn: 'Americas',      regions: ['North America', 'South America'] },
  { key: 'mideast',  labelMn: 'Ойрх Дорнод',  labelEn: 'Middle East',   regions: ['Middle East'] },
  { key: 'africa',   labelMn: 'Африк',        labelEn: 'Africa',        regions: ['Africa'] },
  { key: 'oceania',  labelMn: 'Номхон далай', labelEn: 'Oceania',       regions: ['Oceania'] },
];

export default function Countries() {
  const { lang } = useLanguage();
  const { data, isLoading } = useListCountries({});
  // The landing's search box hands its term over as ?q=.
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get('q') ?? '');
  const [activeTab, setActiveTab] = useState('asia');

  const countries = data?.countries || [];

  const filtered = countries.filter(c => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.nameMn.toLowerCase().includes(search.toLowerCase());

    const matchesRegion =
      search.length > 0 ||
      (REGION_TABS.find(t => t.key === activeTab)?.regions.includes(c.region || '') ?? false);

    return matchesSearch && matchesRegion;
  });

  return (
    <div className="w-full pb-20">
      <div className="sticky top-0 z-20 bg-background border-b border-border/50">
        <div className="container max-w-2xl md:max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <button className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'mn' ? 'Улс хайх...' : 'Search countries...'}
              className="pl-9 h-10 rounded-xl bg-muted border-0 text-sm"
            />
          </div>
        </div>

        {!search && (
          <div className="container max-w-2xl md:max-w-4xl mx-auto px-4 pb-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {REGION_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    activeTab === tab.key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-muted-foreground border-border/50 hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  {lang === 'mn' ? tab.labelMn : tab.labelEn}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="container max-w-2xl md:max-w-4xl mx-auto px-4 pt-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-foreground" />
          <span className="text-sm text-muted-foreground">
            {filtered.length} {lang === 'mn' ? 'улс орон' : 'countries'}
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <SearchX className="h-10 w-10 text-muted-foreground/60" />
            <p className="text-sm">{lang === 'mn' ? 'Олдсонгүй' : 'No results found'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((country) => {
              const code = [...country.flag].map(c => String.fromCharCode(c.codePointAt(0)! - 0x1F1E6 + 65)).join('').toLowerCase();
              return (
                <Link key={country.id} href={`/countries/${country.slug}`}>
                  <Card className="group h-full cursor-pointer rounded-2xl border-0 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.07] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)] hover:ring-brand active:scale-95">
                    <CardContent className="p-4 flex flex-col gap-3 min-h-[100px] justify-between">
                      <div className="flex items-center gap-2.5">
                        {code.length === 2 ? (
                          <img src={`https://flagcdn.com/w80/${code}.png`} alt={country.name} className="h-6 w-9 shrink-0 rounded object-cover ring-1 ring-black/10" loading="lazy" />
                        ) : (
                          <span className="text-2xl">{country.flag}</span>
                        )}
                        <h3 className="font-bold text-foreground text-sm leading-tight">
                          {lang === 'mn' ? country.nameMn : country.name}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between">
                        {/* Most of the 200+ destinations sell capped data, not
                            Unlimited, so say only what is true for every one. */}
                        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-ink">
                          {country.packageCount} {lang === 'mn' ? 'багц' : country.packageCount === 1 ? 'plan' : 'plans'}
                        </span>
                        <ChevronRight className="h-4 w-4 text-brand transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
