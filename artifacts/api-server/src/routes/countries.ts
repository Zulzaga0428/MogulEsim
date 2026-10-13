import { Router, type IRouter } from "express";
import { getPackagesByCountry, type AiraloPackage, getPackagesIndex } from "../lib/airalo";
import { WORLD_COUNTRIES, flagEmoji, slugFromName } from "../lib/world-countries";

const router: IRouter = Router();

const COUNTRIES = [
  { id: "1",  slug: "japan",        name: "Japan",           nameMn: "Япон",       flag: "🇯🇵", region: "Asia" },
  { id: "2",  slug: "south-korea",  name: "South Korea",     nameMn: "Солонгос",   flag: "🇰🇷", region: "Asia" },
  { id: "3",  slug: "china",        name: "China",           nameMn: "Хятад",      flag: "🇨🇳", region: "Asia" },
  { id: "4",  slug: "usa",          name: "United States",   nameMn: "АНУ",        flag: "🇺🇸", region: "North America" },
  { id: "5",  slug: "uk",           name: "United Kingdom",  nameMn: "Их Британи", flag: "🇬🇧", region: "Europe" },
  { id: "6",  slug: "germany",      name: "Germany",         nameMn: "Герман",     flag: "🇩🇪", region: "Europe" },
  { id: "7",  slug: "france",       name: "France",          nameMn: "Франц",      flag: "🇫🇷", region: "Europe" },
  { id: "8",  slug: "thailand",     name: "Thailand",        nameMn: "Тайланд",    flag: "🇹🇭", region: "Asia" },
  { id: "9",  slug: "vietnam",      name: "Vietnam",         nameMn: "Вьетнам",    flag: "🇻🇳", region: "Asia" },
  { id: "10", slug: "singapore",    name: "Singapore",       nameMn: "Сингапур",   flag: "🇸🇬", region: "Asia" },
  { id: "11", slug: "malaysia",     name: "Malaysia",        nameMn: "Малайз",     flag: "🇲🇾", region: "Asia" },
  { id: "12", slug: "indonesia",    name: "Indonesia",       nameMn: "Индонез",    flag: "🇮🇩", region: "Asia" },
  { id: "13", slug: "australia",    name: "Australia",       nameMn: "Австрали",   flag: "🇦🇺", region: "Oceania" },
  { id: "14", slug: "canada",       name: "Canada",          nameMn: "Канад",      flag: "🇨🇦", region: "North America" },
  { id: "15", slug: "turkey",       name: "Turkey",          nameMn: "Турк",       flag: "🇹🇷", region: "Europe" },
  { id: "16", slug: "italy",        name: "Italy",           nameMn: "Итали",      flag: "🇮🇹", region: "Europe" },
  { id: "17", slug: "spain",        name: "Spain",           nameMn: "Испани",     flag: "🇪🇸", region: "Europe" },
  { id: "18", slug: "dubai",        name: "UAE / Dubai",     nameMn: "Дубай / АНЭУ", flag: "🇦🇪", region: "Middle East" },
  { id: "19", slug: "philippines",  name: "Philippines",     nameMn: "Филиппин",   flag: "🇵🇭", region: "Asia" },
  { id: "20", slug: "hong-kong",    name: "Hong Kong",       nameMn: "Хонг Конг",  flag: "🇭🇰", region: "Asia" },
  { id: "21", slug: "taiwan",       name: "Taiwan",          nameMn: "Тайван",     flag: "🇹🇼", region: "Asia" },
  { id: "22", slug: "russia",       name: "Russia",          nameMn: "Орос",       flag: "🇷🇺", region: "Europe" },
  { id: "23", slug: "india",        name: "India",           nameMn: "Энэтхэг",    flag: "🇮🇳", region: "Asia" },
  { id: "24", slug: "cambodia",     name: "Cambodia",        nameMn: "Камбож",     flag: "🇰🇭", region: "Asia" },
  { id: "25", slug: "greece",       name: "Greece",          nameMn: "Грек",       flag: "🇬🇷", region: "Europe" },
  { id: "26", slug: "switzerland",  name: "Switzerland",     nameMn: "Швейцари",   flag: "🇨🇭", region: "Europe" },
  { id: "27", slug: "austria",      name: "Austria",         nameMn: "Австри",     flag: "🇦🇹", region: "Europe" },
  { id: "28", slug: "netherlands",  name: "Netherlands",     nameMn: "Нидерланд",  flag: "🇳🇱", region: "Europe" },
  { id: "29", slug: "norway",       name: "Norway",          nameMn: "Норвеги",    flag: "🇳🇴", region: "Europe" },
  { id: "30", slug: "sweden",       name: "Sweden",          nameMn: "Швед",       flag: "🇸🇪", region: "Europe" },
  { id: "31", slug: "denmark",      name: "Denmark",         nameMn: "Дани",       flag: "🇩🇰", region: "Europe" },
  { id: "32", slug: "finland",      name: "Finland",         nameMn: "Финланд",    flag: "🇫🇮", region: "Europe" },
  { id: "33", slug: "czech",        name: "Czech Republic",  nameMn: "Чех",        flag: "🇨🇿", region: "Europe" },
  { id: "34", slug: "poland",       name: "Poland",          nameMn: "Польш",      flag: "🇵🇱", region: "Europe" },
  { id: "35", slug: "portugal",     name: "Portugal",        nameMn: "Португал",   flag: "🇵🇹", region: "Europe" },
  { id: "36", slug: "hungary",      name: "Hungary",         nameMn: "Унгар",      flag: "🇭🇺", region: "Europe" },
  { id: "37", slug: "croatia",      name: "Croatia",         nameMn: "Хорват",     flag: "🇭🇷", region: "Europe" },
  { id: "38", slug: "belgium",      name: "Belgium",         nameMn: "Бельги",     flag: "🇧🇪", region: "Europe" },
  { id: "39", slug: "ireland",      name: "Ireland",         nameMn: "Ирланд",     flag: "🇮🇪", region: "Europe" },
  { id: "40", slug: "ukraine",      name: "Ukraine",         nameMn: "Украйн",     flag: "🇺🇦", region: "Europe" },
  { id: "41", slug: "kazakhstan",   name: "Kazakhstan",      nameMn: "Казахстан",  flag: "🇰🇿", region: "Asia" },
  { id: "42", slug: "kyrgyzstan",   name: "Kyrgyzstan",      nameMn: "Киргизстан", flag: "🇰🇬", region: "Asia" },
  { id: "43", slug: "uzbekistan",   name: "Uzbekistan",      nameMn: "Узбекистан", flag: "🇺🇿", region: "Asia" },
  { id: "44", slug: "egypt",        name: "Egypt",           nameMn: "Египет",     flag: "🇪🇬", region: "Middle East" },
  { id: "45", slug: "saudi-arabia", name: "Saudi Arabia",    nameMn: "Саудын Араб",flag: "🇸🇦", region: "Middle East" },
  { id: "46", slug: "new-zealand",  name: "New Zealand",     nameMn: "Шинэ Зеланд",flag: "🇳🇿", region: "Oceania" },
  { id: "47", slug: "nepal",        name: "Nepal",           nameMn: "Непал",      flag: "🇳🇵", region: "Asia" },
  { id: "48", slug: "laos",         name: "Laos",            nameMn: "Лаос",       flag: "🇱🇦", region: "Asia" },
  { id: "49", slug: "south-africa", name: "South Africa",    nameMn: "Өмнөд Африк",flag: "🇿🇦", region: "Africa" },
  { id: "50", slug: "mexico",       name: "Mexico",          nameMn: "Мексик",     flag: "🇲🇽", region: "North America" },
  { id: "51", slug: "mongolia",     name: "Mongolia",        nameMn: "Монгол",     flag: "🇲🇳", region: "Asia" },
  { id: "52", slug: "asialink",     name: "Asia (32 countries)", nameMn: "Ази (32 улс)",     flag: "🌏", region: "Asia" },
  { id: "53", slug: "eurolink",     name: "Europe (83 countries)", nameMn: "Европ (83 улс)", flag: "🌍", region: "Europe" },
];

// Slug → Airalo ISO country code (undefined = regional/keep hardcoded)
const SLUG_TO_ISO: Record<string, string> = {
  "japan": "JP", "south-korea": "KR", "china": "CN", "usa": "US",
  "uk": "GB", "germany": "DE", "france": "FR", "thailand": "TH",
  "vietnam": "VN", "singapore": "SG", "malaysia": "MY", "indonesia": "ID",
  "australia": "AU", "canada": "CA", "turkey": "TR", "italy": "IT",
  "spain": "ES", "dubai": "AE", "philippines": "PH", "hong-kong": "HK",
  "taiwan": "TW", "russia": "RU", "india": "IN", "cambodia": "KH",
  "greece": "GR", "switzerland": "CH", "austria": "AT", "netherlands": "NL",
  "norway": "NO", "sweden": "SE", "denmark": "DK", "finland": "FI",
  "czech": "CZ", "poland": "PL", "portugal": "PT", "hungary": "HU",
  "croatia": "HR", "belgium": "BE", "ireland": "IE", "ukraine": "UA",
  "kazakhstan": "KZ", "kyrgyzstan": "KG", "uzbekistan": "UZ", "egypt": "EG",
  "saudi-arabia": "SA", "new-zealand": "NZ", "nepal": "NP", "laos": "LA",
  "south-africa": "ZA", "mexico": "MX", "mongolia": "MN",
};

// Pricing formula: net_usd × 3,450 × 1.85 → rounded to nearest 500
const USD_TO_MNT = 3450;
const MARKUP = 1.85;

function roundToNearest500(n: number): number {
  return Math.round(n / 500) * 500;
}

export function priceFromUsd(usd: number): number {
  return roundToNearest500(usd * USD_TO_MNT * MARKUP);
}

// Manual retail prices (MNT) that override the formula. Keyed by country slug →
// validity days. Applies to unlimited packages only; limited-data packages and
// countries not listed here keep the formula price.
// Flat price for the rest of Asia: Japan/Korea minus 2,000 MNT.
const ASIA_FLAT = { 3: 32000, 5: 47500, 7: 67500, 10: 89500, 15: 143000, 30: 268000 };

// Flat price for Europe/Americas/Oceania/Middle East: Eurolink minus 2,000 MNT.
// The cost-floor guard keeps expensive markets (Russia, Canada, ...) on formula.
const EURO_FLAT = { 3: 35000, 5: 51500, 7: 65500, 10: 83500, 15: 158500, 30: 224500 };

const PRICE_OVERRIDES: Record<string, Record<number, number>> = {
  "japan":       { 3: 34000, 5: 49500, 7: 69500, 10: 91500, 15: 145000, 30: 270000 },
  "south-korea": { 3: 34000, 5: 49500, 7: 69500, 10: 91500, 15: 145000, 30: 270000 },
  "asialink":    { 3: 34000, 5: 49500, 7: 69500, 10: 91500, 15: 145000, 30: 270000 },
  "eurolink":    { 3: 37000, 5: 53500, 7: 67500, 10: 85500, 15: 160500, 30: 226500 },
  "china":       ASIA_FLAT,
  "thailand":    ASIA_FLAT,
  "vietnam":     ASIA_FLAT,
  "singapore":   ASIA_FLAT,
  "malaysia":    ASIA_FLAT,
  "indonesia":   ASIA_FLAT,
  "philippines": ASIA_FLAT,
  "hong-kong":   ASIA_FLAT,
  "taiwan":      ASIA_FLAT,
  "india":       ASIA_FLAT,
  "cambodia":    ASIA_FLAT,
  "kazakhstan":  ASIA_FLAT,
  "kyrgyzstan":  ASIA_FLAT,
  "uzbekistan":  ASIA_FLAT,
  "nepal":       ASIA_FLAT,
  "laos":        ASIA_FLAT,
  "mongolia":    ASIA_FLAT,
  "usa":          EURO_FLAT,
  "uk":           EURO_FLAT,
  "germany":      EURO_FLAT,
  "france":       EURO_FLAT,
  "italy":        EURO_FLAT,
  "spain":        EURO_FLAT,
  "turkey":       EURO_FLAT,
  "dubai":        EURO_FLAT,
  "russia":       EURO_FLAT,
  "greece":       EURO_FLAT,
  "switzerland":  EURO_FLAT,
  "austria":      EURO_FLAT,
  "netherlands":  EURO_FLAT,
  "norway":       EURO_FLAT,
  "sweden":       EURO_FLAT,
  "denmark":      EURO_FLAT,
  "finland":      EURO_FLAT,
  "czech":        EURO_FLAT,
  "poland":       EURO_FLAT,
  "portugal":     EURO_FLAT,
  "hungary":      EURO_FLAT,
  "croatia":      EURO_FLAT,
  "belgium":      EURO_FLAT,
  "ireland":      EURO_FLAT,
  "ukraine":      EURO_FLAT,
  "egypt":        EURO_FLAT,
  "saudi-arabia": EURO_FLAT,
  "australia":    EURO_FLAT,
  "new-zealand":  EURO_FLAT,
  "canada":       EURO_FLAT,
  "mexico":       EURO_FLAT,
  "south-africa": EURO_FLAT,
};

// An override must keep at least this much margin over the live Airalo cost;
// otherwise the formula price is used so a flat price can never sell at a loss.
const OVERRIDE_MIN_MARGIN = 1.1;

const ISO_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SLUG_TO_ISO).map(([slug, iso]) => [iso, slug]),
);

export function slugForCountryCode(countryCode: string): string | undefined {
  return ISO_TO_SLUG[countryCode];
}

export function overriddenPrice(
  slug: string | undefined,
  days: number,
  isUnlimited: boolean,
  netUsd?: number,
): number | null {
  if (!slug || !isUnlimited) return null;
  const override = PRICE_OVERRIDES[slug]?.[days];
  if (override == null) return null;
  if (netUsd !== undefined && override < netUsd * USD_TO_MNT * OVERRIDE_MIN_MARGIN) {
    console.warn(`[Pricing] Override ${override} MNT for ${slug} ${days}D is below the cost floor (net $${netUsd}) — using formula price`);
    return null;
  }
  return override;
}

function convertAiraloPackage(p: AiraloPackage, countrySlug: string, index: number): Package {
  const isUnlimited = p.is_unlimited || p.amount === -1;
  const priceInMnt = overriddenPrice(countrySlug, p.day, isUnlimited, p.net_price) ?? priceFromUsd(p.net_price);
  const dataLabel = p.data || (isUnlimited ? "Unlimited" : p.amount > 0 ? `${Math.round(p.amount / 1024)} GB` : "?");
  return {
    id: `${countrySlug}-${p.package_id}`,
    packageId: p.package_id,
    name: p.title,
    data: dataLabel,
    dataAmount: isUnlimited ? -1 : (p.amount || 0),
    validity: p.day,
    price: p.net_price,
    currency: "USD",
    priceInMnt,
    speed: "4G/5G",
    isUnlimited,
    networkType: "LTE/5G",
    rechargeable: p.rechargeable,
    voice: p.voice,
    sms: p.text,
  };
}

type Package = {
  id: string; packageId: string; name: string; data: string;
  dataAmount: number; validity: number; price: number; currency: string;
  priceInMnt: number; speed: string; isUnlimited: boolean; networkType: string;
  rechargeable?: boolean; voice?: number; sms?: number;
};

// Fallback catalog, used only when the Airalo API is unreachable or returns
// nothing for a country, and by findLocalPackage() when checkout prices an
// order the same way.
//
// `price` MUST be the Airalo *net* (wholesale) price in USD, not the
// recommended retail price — the loop below feeds it to overriddenPrice(),
// whose cost floor compares a manual flat price against it. Seeding retail
// prices here silently rejected 287 of 305 overrides and priced the fallback
// at up to 2.8x the intended amount. Values below come from the net-price
// report in attached_assets, dated 2026-09-11; re-run that export and update
// them together, never by hand one row at a time.
//
// Package ids move too. That export renamed 65 of these — "-unlimited" became
// "-UNL" for several operators, and others dropped or gained an infix
// ("hallo-mobil" -> "hallomobil", "indicomm" -> "indicomm-in"). An id that no
// longer exists is not a price bug; it is an order that fails at Airalo. Match
// on country and validity when reconciling, and only replace ids the export no
// longer lists — France deliberately sells the cheaper eu-connect regional
// bundle rather than its own elan- packages.
//
// Austria and Russia are the exception: Airalo no longer publishes any
// unlimited package for either, so their six entries each are stale and cannot
// be repointed. The live Airalo path still serves Austria its capped packages;
// only this fallback would fail.
//
// `priceInMnt` below is dead weight — the loop after this table overwrites
// every one of them.
const PACKAGES: Record<string, Package[]> = {
  japan: [
    { id: "jp-1", packageId: "moshi-moshi-3days-unlimited",  name: "Japan Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 5.0,  currency: "USD", priceInMnt: 48000,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "jp-2", packageId: "moshi-moshi-5days-unlimited",  name: "Japan Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 7.0,  currency: "USD", priceInMnt: 78000,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "jp-3", packageId: "moshi-moshi-7days-unlimited",  name: "Japan Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 8.8,  currency: "USD", priceInMnt: 106000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "jp-4", packageId: "moshi-moshi-10days-unlimited", name: "Japan Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 11.2, currency: "USD", priceInMnt: 148000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "jp-5", packageId: "moshi-moshi-15days-unlimited", name: "Japan Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 20.5, currency: "USD", priceInMnt: 218500, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "jp-6", packageId: "moshi-moshi-30days-unlimited", name: "Japan Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 28.8, currency: "USD", priceInMnt: 429000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  "south-korea": [
    { id: "kr-1", packageId: "jang-3days-unlimited",  name: "Korea Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 5.3,  currency: "USD", priceInMnt: 41800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "kr-2", packageId: "jang-5days-unlimited",  name: "Korea Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 7.4,  currency: "USD", priceInMnt: 60800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "kr-3", packageId: "jang-7days-unlimited",  name: "Korea Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 9.2,  currency: "USD", priceInMnt: 75800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "kr-4", packageId: "jang-10days-unlimited", name: "Korea Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 11.8, currency: "USD", priceInMnt: 112800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "kr-5", packageId: "jang-15days-unlimited", name: "Korea Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 20.9, currency: "USD", priceInMnt: 160800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "kr-6", packageId: "jang-30days-unlimited", name: "Korea Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 29.2, currency: "USD", priceInMnt: 330800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  china: [
    { id: "cn-1", packageId: "chinacom-3days-unlimited",  name: "China Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 5.2,  currency: "USD", priceInMnt: 35800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "cn-2", packageId: "chinacom-5days-unlimited",  name: "China Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 7.4,  currency: "USD", priceInMnt: 56800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "cn-3", packageId: "chinacom-7days-unlimited",  name: "China Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 11.1, currency: "USD", priceInMnt: 76800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "cn-4", packageId: "chinacom-10days-unlimited", name: "China Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 15.3, currency: "USD", priceInMnt: 97800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "cn-5", packageId: "chinacom-15days-unlimited", name: "China Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 22.3, currency: "USD", priceInMnt: 150800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "cn-6", packageId: "chinacom-30days-unlimited", name: "China Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 31.3, currency: "USD", priceInMnt: 300800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  usa: [
    { id: "us-1", packageId: "change-in-3days-UNL",  name: "USA Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 6.3,  currency: "USD", priceInMnt: 48000,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "us-2", packageId: "change-in-5days-UNL",  name: "USA Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 9.1,  currency: "USD", priceInMnt: 76000,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "us-3", packageId: "change-in-7days-UNL",  name: "USA Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 11.5, currency: "USD", priceInMnt: 106000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "us-4", packageId: "change-in-10days-UNL", name: "USA Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 14.8, currency: "USD", priceInMnt: 148000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "us-5", packageId: "change-in-15days-UNL", name: "USA Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 27.4, currency: "USD", priceInMnt: 218500, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "us-6", packageId: "change-in-30days-UNL", name: "USA Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 46,   currency: "USD", priceInMnt: 400000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  uk: [
    { id: "uk-1", packageId: "uki-mobile-3days-unlimited",  name: "UK Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 4.4,  currency: "USD", priceInMnt: 40800,  speed: "4G", isUnlimited: true, networkType: "LTE" },
    { id: "uk-2", packageId: "uki-mobile-5days-unlimited",  name: "UK Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 6.2,  currency: "USD", priceInMnt: 62800,  speed: "4G", isUnlimited: true, networkType: "LTE" },
    { id: "uk-3", packageId: "uki-mobile-7days-unlimited",  name: "UK Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 7.7,  currency: "USD", priceInMnt: 84800,  speed: "4G", isUnlimited: true, networkType: "LTE" },
    { id: "uk-4", packageId: "uki-mobile-10days-unlimited", name: "UK Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 11.1, currency: "USD", priceInMnt: 116800, speed: "4G", isUnlimited: true, networkType: "LTE" },
    { id: "uk-5", packageId: "uki-mobile-15days-unlimited", name: "UK Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 17.8, currency: "USD", priceInMnt: 171800, speed: "4G", isUnlimited: true, networkType: "LTE" },
    { id: "uk-6", packageId: "uki-mobile-30days-unlimited", name: "UK Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 24.8, currency: "USD", priceInMnt: 333800, speed: "4G", isUnlimited: true, networkType: "LTE" },
  ],
  germany: [
    { id: "de-1", packageId: "hallomobil-3days-unlimited",  name: "Germany Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3.3,  currency: "USD", priceInMnt: 40800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "de-2", packageId: "hallomobil-5days-unlimited",  name: "Germany Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 4.5,  currency: "USD", priceInMnt: 62800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "de-3", packageId: "hallomobil-7days-unlimited",  name: "Germany Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.5,  currency: "USD", priceInMnt: 84800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "de-4", packageId: "hallomobil-10days-unlimited", name: "Germany Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 7.1,  currency: "USD", priceInMnt: 116800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "de-5", packageId: "hallomobil-15days-unlimited", name: "Germany Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 12.2, currency: "USD", priceInMnt: 171800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "de-6", packageId: "hallomobil-30days-unlimited", name: "Germany Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 17.0, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  france: [
    { id: "fr-1", packageId: "eu-connect-in-3days-unlimited",  name: "France Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3,    currency: "USD", priceInMnt: 40800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "fr-2", packageId: "eu-connect-in-5days-unlimited",  name: "France Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 4.0,  currency: "USD", priceInMnt: 62800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "fr-3", packageId: "eu-connect-in-7days-unlimited",  name: "France Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5,    currency: "USD", priceInMnt: 84800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "fr-4", packageId: "eu-connect-in-10days-unlimited", name: "France Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 6.7,  currency: "USD", priceInMnt: 116800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "fr-5", packageId: "eu-connect-in-15days-unlimited", name: "France Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 11.4, currency: "USD", priceInMnt: 171800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "fr-6", packageId: "eu-connect-in-30days-unlimited", name: "France Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 18.5, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  thailand: [
    { id: "th-1", packageId: "maew-in-3days-UNL",  name: "Thailand Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 4.4,  currency: "USD", priceInMnt: 35800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "th-2", packageId: "maew-in-5days-UNL",  name: "Thailand Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 6.3,  currency: "USD", priceInMnt: 56800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "th-3", packageId: "maew-in-7days-UNL",  name: "Thailand Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 8.0,  currency: "USD", priceInMnt: 76800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "th-4", packageId: "maew-in-10days-UNL", name: "Thailand Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 10.2, currency: "USD", priceInMnt: 97800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "th-5", packageId: "maew-in-15days-UNL", name: "Thailand Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 18.9, currency: "USD", priceInMnt: 150800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "th-6", packageId: "maew-in-30days-UNL", name: "Thailand Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 26.5, currency: "USD", priceInMnt: 300800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  vietnam: [
    { id: "vn-1", packageId: "xin-chao-in-3days-unlimited",  name: "Vietnam Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 8.2,  currency: "USD", priceInMnt: 35800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "vn-2", packageId: "xin-chao-in-5days-unlimited",  name: "Vietnam Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 11.9, currency: "USD", priceInMnt: 56800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "vn-3", packageId: "xin-chao-in-7days-unlimited",  name: "Vietnam Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 15.3, currency: "USD", priceInMnt: 76800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "vn-4", packageId: "xin-chao-in-10days-unlimited", name: "Vietnam Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 21.6, currency: "USD", priceInMnt: 97800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "vn-5", packageId: "xin-chao-in-15days-unlimited", name: "Vietnam Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 37.1, currency: "USD", priceInMnt: 150800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "vn-6", packageId: "xin-chao-in-30days-unlimited", name: "Vietnam Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 52.4, currency: "USD", priceInMnt: 300800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  singapore: [
    { id: "sg-1", packageId: "connect-lah-in-3days-unlimited",  name: "Singapore Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3.9,  currency: "USD", priceInMnt: 35800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "sg-2", packageId: "connect-lah-in-5days-unlimited",  name: "Singapore Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 4.5,  currency: "USD", priceInMnt: 56800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "sg-3", packageId: "connect-lah-in-7days-unlimited",  name: "Singapore Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.5,  currency: "USD", priceInMnt: 76800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "sg-4", packageId: "connect-lah-in-10days-unlimited", name: "Singapore Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 8.3,  currency: "USD", priceInMnt: 97800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "sg-5", packageId: "connect-lah-in-15days-unlimited", name: "Singapore Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 12.2, currency: "USD", priceInMnt: 150800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "sg-6", packageId: "connect-lah-in-30days-unlimited", name: "Singapore Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 17.0, currency: "USD", priceInMnt: 300800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  malaysia: [
    { id: "my-1", packageId: "sambungkan-in-3days-unlimited",  name: "Malaysia Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 5.1,  currency: "USD", priceInMnt: 35800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "my-2", packageId: "sambungkan-in-5days-unlimited",  name: "Malaysia Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 7.3,  currency: "USD", priceInMnt: 56800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "my-3", packageId: "sambungkan-in-7days-unlimited",  name: "Malaysia Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 9.4,  currency: "USD", priceInMnt: 76800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "my-4", packageId: "sambungkan-in-10days-unlimited", name: "Malaysia Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 12,   currency: "USD", priceInMnt: 97800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "my-5", packageId: "sambungkan-in-15days-unlimited", name: "Malaysia Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 23,   currency: "USD", priceInMnt: 150800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "my-6", packageId: "sambungkan-in-30days-unlimited", name: "Malaysia Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 31.6, currency: "USD", priceInMnt: 300800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  indonesia: [
    { id: "id-1", packageId: "indotel-3days-unlimited",  name: "Indonesia Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 5.3,  currency: "USD", priceInMnt: 35800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "id-2", packageId: "indotel-5days-unlimited",  name: "Indonesia Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 7.4,  currency: "USD", priceInMnt: 56800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "id-3", packageId: "indotel-7days-unlimited",  name: "Indonesia Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 9.2,  currency: "USD", priceInMnt: 76800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "id-4", packageId: "indotel-10days-unlimited", name: "Indonesia Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 11.8,  currency: "USD", priceInMnt: 97800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "id-5", packageId: "indotel-15days-unlimited", name: "Indonesia Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 20.9, currency: "USD", priceInMnt: 150800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "id-6", packageId: "indotel-30days-unlimited", name: "Indonesia Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 29.2, currency: "USD", priceInMnt: 300800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  australia: [
    { id: "au-1", packageId: "yes-go-in-3days-unlimited",  name: "Australia Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 5,    currency: "USD", priceInMnt: 48000,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "au-2", packageId: "yes-go-in-5days-unlimited",  name: "Australia Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 7,    currency: "USD", priceInMnt: 74000,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "au-3", packageId: "yes-go-in-7days-unlimited",  name: "Australia Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 8.8,  currency: "USD", priceInMnt: 104000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "au-4", packageId: "yes-go-in-10days-unlimited", name: "Australia Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 11.2, currency: "USD", priceInMnt: 135500, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "au-5", packageId: "yes-go-in-15days-unlimited", name: "Australia Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 20.5, currency: "USD", priceInMnt: 200500, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "au-6", packageId: "yes-go-in-30days-unlimited", name: "Australia Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 28.8, currency: "USD", priceInMnt: 385500, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  canada: [
    { id: "ca-1", packageId: "canada-mobile-3days-unlimited",  name: "Canada Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 16.13, currency: "USD", priceInMnt: 79000,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ca-2", packageId: "canada-mobile-5days-unlimited",  name: "Canada Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 21.87, currency: "USD", priceInMnt: 107500, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ca-3", packageId: "canada-mobile-7days-unlimited",  name: "Canada Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 25.68, currency: "USD", priceInMnt: 126000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ca-4", packageId: "canada-mobile-10days-unlimited", name: "Canada Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 27.56, currency: "USD", priceInMnt: 144000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ca-5", packageId: "canada-mobile-15days-unlimited", name: "Canada Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 35.59, currency: "USD", priceInMnt: 196000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ca-6", packageId: "canada-mobile-30days-unlimited", name: "Canada Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 67.69, currency: "USD", priceInMnt: 492500, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  turkey: [
    { id: "tr-1", packageId: "merhaba-3days-unlimited-x",  name: "Turkey Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3.1,  currency: "USD", priceInMnt: 40800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "tr-2", packageId: "merhaba-5days-unlimited-x",  name: "Turkey Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 4.3,  currency: "USD", priceInMnt: 62800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "tr-3", packageId: "merhaba-7days-unlimited-x",  name: "Turkey Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.2,  currency: "USD", priceInMnt: 84800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "tr-4", packageId: "merhaba-10days-unlimited",   name: "Turkey Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 7.5,  currency: "USD", priceInMnt: 116800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "tr-5", packageId: "merhaba-15days-unlimited-x", name: "Turkey Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 11.4, currency: "USD", priceInMnt: 171800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "tr-6", packageId: "merhaba-30days-unlimited-x", name: "Turkey Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 15.8, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  italy: [
    { id: "it-1", packageId: "mamma-mia-in-3days-UNL",  name: "Italy Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3.1,  currency: "USD", priceInMnt: 40800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "it-2", packageId: "mamma-mia-in-5days-UNL",  name: "Italy Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 4.2,  currency: "USD", priceInMnt: 62800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "it-3", packageId: "mamma-mia-in-7days-UNL",  name: "Italy Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.3,  currency: "USD", priceInMnt: 84800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "it-4", packageId: "mamma-mia-in-10days-UNL", name: "Italy Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 6.6,  currency: "USD", priceInMnt: 116800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "it-5", packageId: "mamma-mia-in-15days-UNL", name: "Italy Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 12.0, currency: "USD", priceInMnt: 171800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "it-6", packageId: "mamma-mia-in-30days-UNL", name: "Italy Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 16.7, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  spain: [
    { id: "es-1", packageId: "guay-mobile-in-3days-UNL",  name: "Spain Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3.3,  currency: "USD", priceInMnt: 40800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "es-2", packageId: "guay-mobile-in-5days-UNL",  name: "Spain Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 4.5,  currency: "USD", priceInMnt: 62800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "es-3", packageId: "guay-mobile-in-7days-UNL",  name: "Spain Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.5,  currency: "USD", priceInMnt: 84800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "es-4", packageId: "guay-mobile-in-10days-UNL", name: "Spain Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 6.9,  currency: "USD", priceInMnt: 116800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "es-5", packageId: "guay-mobile-in-15days-UNL", name: "Spain Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 12.2, currency: "USD", priceInMnt: 171800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "es-6", packageId: "guay-mobile-in-30days-UNL", name: "Spain Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 17.0, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  dubai: [
    { id: "ae-1", packageId: "burj-mobile-3days-unlimited",  name: "UAE Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 10.3, currency: "USD", priceInMnt: 48000,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ae-2", packageId: "burj-mobile-5days-unlimited",  name: "UAE Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 14.9, currency: "USD", priceInMnt: 76000,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ae-3", packageId: "burj-mobile-7days-unlimited",  name: "UAE Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 19.1, currency: "USD", priceInMnt: 106000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ae-4", packageId: "burj-mobile-10days-unlimited", name: "UAE Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 24.5, currency: "USD", priceInMnt: 148000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ae-5", packageId: "burj-mobile-15days-unlimited", name: "UAE Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 45.9, currency: "USD", priceInMnt: 218500, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  philippines: [
    { id: "ph-1", packageId: "alpas-mobile-in-3days-unlimited",  name: "Philippines Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 4.5,  currency: "USD", priceInMnt: 35800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ph-2", packageId: "alpas-mobile-in-5days-unlimited",  name: "Philippines Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 7.0,  currency: "USD", priceInMnt: 56800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ph-3", packageId: "alpas-mobile-in-7days-unlimited",  name: "Philippines Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 8.2,  currency: "USD", priceInMnt: 76800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ph-4", packageId: "alpas-mobile-in-10days-unlimited", name: "Philippines Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 11.3, currency: "USD", priceInMnt: 97800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ph-5", packageId: "alpas-mobile-in-15days-unlimited", name: "Philippines Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 20.5, currency: "USD", priceInMnt: 150800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ph-6", packageId: "alpas-mobile-in-30days-unlimited", name: "Philippines Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 33,   currency: "USD", priceInMnt: 300800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  "hong-kong": [
    { id: "hk-1", packageId: "hkmobile-in-3days-unlimited",  name: "HK Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 5.5,  currency: "USD", priceInMnt: 35800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "hk-2", packageId: "hkmobile-in-5days-unlimited",  name: "HK Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 7.8,  currency: "USD", priceInMnt: 56800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "hk-3", packageId: "hkmobile-in-7days-unlimited",  name: "HK Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 9.9,  currency: "USD", priceInMnt: 76800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "hk-4", packageId: "hkmobile-in-10days-unlimited", name: "HK Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 12.6, currency: "USD", priceInMnt: 97800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "hk-5", packageId: "hkmobile-in-15days-unlimited", name: "HK Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 23.3, currency: "USD", priceInMnt: 150800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "hk-6", packageId: "hkmobile-in-30days-unlimited", name: "HK Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 32.7, currency: "USD", priceInMnt: 300800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  taiwan: [
    { id: "tw-1", packageId: "xie-xie-3days-unlimited-x",  name: "Taiwan Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 5.0,  currency: "USD", priceInMnt: 35800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "tw-2", packageId: "xie-xie-5days-unlimited-x",  name: "Taiwan Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 7.0,  currency: "USD", priceInMnt: 56800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "tw-3", packageId: "xie-xie-7days-unlimited-x",  name: "Taiwan Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 8.8,  currency: "USD", priceInMnt: 76800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "tw-4", packageId: "xie-xie-unlimited-10days",   name: "Taiwan Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 12.2, currency: "USD", priceInMnt: 97800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "tw-5", packageId: "xie-xie-15days-unlimited-x", name: "Taiwan Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 20.5, currency: "USD", priceInMnt: 150800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "tw-6", packageId: "xie-xie-30days-unlimited-x", name: "Taiwan Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 28.8, currency: "USD", priceInMnt: 300800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  russia: [
    { id: "ru-1", packageId: "ru-3days-unlimited",  name: "Russia Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 11.5, currency: "USD", priceInMnt: 48000,  speed: "4G", isUnlimited: true, networkType: "LTE" },
    { id: "ru-2", packageId: "ru-5days-unlimited",  name: "Russia Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 19,   currency: "USD", priceInMnt: 76000,  speed: "4G", isUnlimited: true, networkType: "LTE" },
    { id: "ru-3", packageId: "ru-7days-unlimited",  name: "Russia Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 27,   currency: "USD", priceInMnt: 106000, speed: "4G", isUnlimited: true, networkType: "LTE" },
    { id: "ru-4", packageId: "ru-10days-unlimited", name: "Russia Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 35,   currency: "USD", priceInMnt: 148000, speed: "4G", isUnlimited: true, networkType: "LTE" },
    { id: "ru-5", packageId: "ru-15days-unlimited", name: "Russia Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 49,   currency: "USD", priceInMnt: 218500, speed: "4G", isUnlimited: true, networkType: "LTE" },
    { id: "ru-6", packageId: "ru-30days-unlimited", name: "Russia Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 72.5, currency: "USD", priceInMnt: 420000, speed: "4G", isUnlimited: true, networkType: "LTE" },
  ],
  india: [
    { id: "in-1", packageId: "indicomm-in-3days-unlimited",  name: "India Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 10.6, currency: "USD", priceInMnt: 35800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "in-2", packageId: "indicomm-in-5days-unlimited",  name: "India Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 11.5, currency: "USD", priceInMnt: 56800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "in-3", packageId: "indicomm-in-7days-unlimited",  name: "India Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 14.8, currency: "USD", priceInMnt: 76800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "in-4", packageId: "indicomm-in-10days-unlimited", name: "India Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 19.0, currency: "USD", priceInMnt: 97800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "in-5", packageId: "indicomm-in-15days-unlimited", name: "India Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 48.3, currency: "USD", priceInMnt: 150800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  cambodia: [
    { id: "kh-1", packageId: "connect-cambodia-in-3days-unlimited",  name: "Cambodia Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 7.0,  currency: "USD", priceInMnt: 35800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "kh-2", packageId: "connect-cambodia-in-5days-unlimited",  name: "Cambodia Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 11.3, currency: "USD", priceInMnt: 56800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "kh-3", packageId: "connect-cambodia-in-7days-unlimited",  name: "Cambodia Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 13.2, currency: "USD", priceInMnt: 76800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "kh-4", packageId: "connect-cambodia-in-10days-unlimited", name: "Cambodia Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 17.1, currency: "USD", priceInMnt: 97800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "kh-5", packageId: "connect-cambodia-in-15days-unlimited", name: "Cambodia Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 32.3, currency: "USD", priceInMnt: 150800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "kh-6", packageId: "connect-cambodia-in-30days-unlimited", name: "Cambodia Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 45.7, currency: "USD", priceInMnt: 300800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  greece: [
    { id: "gr-1", packageId: "merakimobile-3days-unlimited",  name: "Greece Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3.5,  currency: "USD", priceInMnt: 40800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "gr-2", packageId: "merakimobile-5days-unlimited",  name: "Greece Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 4.7,  currency: "USD", priceInMnt: 62800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "gr-3", packageId: "merakimobile-7days-unlimited",  name: "Greece Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.8,  currency: "USD", priceInMnt: 84800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "gr-4", packageId: "merakimobile-10days-unlimited", name: "Greece Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 7.4,  currency: "USD", priceInMnt: 116800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "gr-5", packageId: "merakimobile-15days-unlimited", name: "Greece Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 12.6, currency: "USD", priceInMnt: 171800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "gr-6", packageId: "merakimobile-30days-unlimited", name: "Greece Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 17.4, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  switzerland: [
    { id: "ch-1", packageId: "pilatus-mobile-in-3days-unlimited",  name: "Switzerland Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3.1,  currency: "USD", priceInMnt: 40800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ch-2", packageId: "pilatus-mobile-in-5days-unlimited",  name: "Switzerland Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 4.2,  currency: "USD", priceInMnt: 62800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ch-3", packageId: "pilatus-mobile-in-7days-unlimited",  name: "Switzerland Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.3,  currency: "USD", priceInMnt: 84800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ch-4", packageId: "pilatus-mobile-in-10days-unlimited", name: "Switzerland Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 6.6,  currency: "USD", priceInMnt: 116800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ch-5", packageId: "pilatus-mobile-in-15days-unlimited", name: "Switzerland Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 12.5, currency: "USD", priceInMnt: 171800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ch-6", packageId: "pilatus-mobile-in-30days-unlimited", name: "Switzerland Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 16.7, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  austria: [
    { id: "at-1", packageId: "viennetz-mobil-in-3days-unlimited",  name: "Austria Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3,    currency: "USD", priceInMnt: 40800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "at-2", packageId: "viennetz-mobil-in-5days-unlimited",  name: "Austria Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 5,    currency: "USD", priceInMnt: 62800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "at-3", packageId: "viennetz-mobil-in-7days-unlimited",  name: "Austria Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.8,  currency: "USD", priceInMnt: 84800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "at-4", packageId: "viennetz-mobil-in-10days-unlimited", name: "Austria Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 6.7,  currency: "USD", priceInMnt: 116800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "at-5", packageId: "viennetz-mobil-in-15days-unlimited", name: "Austria Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 12.3, currency: "USD", priceInMnt: 171800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "at-6", packageId: "viennetz-mobil-in-30days-unlimited", name: "Austria Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 18.5, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  netherlands: [
    { id: "nl-1", packageId: "he-he-in-3days-unlimited",  name: "Netherlands Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3,    currency: "USD", priceInMnt: 40800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "nl-2", packageId: "he-he-in-5days-unlimited",  name: "Netherlands Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 4.2,  currency: "USD", priceInMnt: 62800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "nl-3", packageId: "he-he-in-7days-unlimited",  name: "Netherlands Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.3,  currency: "USD", priceInMnt: 84800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "nl-4", packageId: "he-he-in-10days-unlimited", name: "Netherlands Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 6.7,  currency: "USD", priceInMnt: 116800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "nl-5", packageId: "he-he-in-15days-unlimited", name: "Netherlands Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 12.0, currency: "USD", priceInMnt: 171800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "nl-6", packageId: "he-he-in-30days-unlimited", name: "Netherlands Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 16.7, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  norway: [
    { id: "no-1", packageId: "lofotel-in-3days-unlimited",  name: "Norway Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3.1,  currency: "USD", priceInMnt: 40800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "no-2", packageId: "lofotel-in-5days-unlimited",  name: "Norway Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 4.2,  currency: "USD", priceInMnt: 62800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "no-3", packageId: "lofotel-in-7days-unlimited",  name: "Norway Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.3,  currency: "USD", priceInMnt: 84800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "no-4", packageId: "lofotel-in-10days-unlimited", name: "Norway Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 8.3,  currency: "USD", priceInMnt: 116800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "no-5", packageId: "lofotel-in-15days-unlimited", name: "Norway Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 11.8, currency: "USD", priceInMnt: 171800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "no-6", packageId: "lofotel-in-30days-unlimited", name: "Norway Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 22.4, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  sweden: [
    { id: "se-1", packageId: "van-in-3days-unlimited",  name: "Sweden Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3.1,  currency: "USD", priceInMnt: 40800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "se-2", packageId: "van-in-5days-unlimited",  name: "Sweden Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 4.2,  currency: "USD", priceInMnt: 72800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "se-3", packageId: "van-in-7days-unlimited",  name: "Sweden Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.3,  currency: "USD", priceInMnt: 84800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "se-4", packageId: "van-in-10days-unlimited", name: "Sweden Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 6.6,  currency: "USD", priceInMnt: 116800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "se-5", packageId: "van-in-15days-unlimited", name: "Sweden Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 12.0, currency: "USD", priceInMnt: 195800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "se-6", packageId: "van-in-30days-unlimited", name: "Sweden Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 16.7, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  denmark: [
    { id: "dk-1", packageId: "teledansk-in-3days-unlimited",  name: "Denmark Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3.1,  currency: "USD", priceInMnt: 40800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "dk-2", packageId: "teledansk-in-5days-unlimited",  name: "Denmark Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 4.2,  currency: "USD", priceInMnt: 62800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "dk-3", packageId: "teledansk-in-7days-unlimited",  name: "Denmark Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.3,  currency: "USD", priceInMnt: 84800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "dk-4", packageId: "teledansk-in-10days-unlimited", name: "Denmark Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 6.6,  currency: "USD", priceInMnt: 116800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "dk-5", packageId: "teledansk-in-15days-unlimited", name: "Denmark Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 12.0, currency: "USD", priceInMnt: 171800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "dk-6", packageId: "teledansk-in-30days-unlimited", name: "Denmark Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 16.7, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  finland: [
    { id: "fi-1", packageId: "fin-comm-in-3days-unlimited",  name: "Finland Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3.1,  currency: "USD", priceInMnt: 40800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "fi-2", packageId: "fin-comm-in-5days-unlimited",  name: "Finland Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 4.2,  currency: "USD", priceInMnt: 62800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "fi-3", packageId: "fin-comm-in-7days-unlimited",  name: "Finland Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.3,  currency: "USD", priceInMnt: 84800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "fi-4", packageId: "fin-comm-in-10days-unlimited", name: "Finland Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 6.6,  currency: "USD", priceInMnt: 116800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "fi-5", packageId: "fin-comm-in-15days-unlimited", name: "Finland Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 12.0, currency: "USD", priceInMnt: 171800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "fi-6", packageId: "fin-comm-in-30days-unlimited", name: "Finland Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 16.7, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  czech: [
    { id: "cz-1", packageId: "prosim-in-3days-unlimited",  name: "Czech Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3.1,  currency: "USD", priceInMnt: 40800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "cz-2", packageId: "prosim-in-5days-unlimited",  name: "Czech Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 4.2,  currency: "USD", priceInMnt: 62800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "cz-3", packageId: "prosim-in-7days-unlimited",  name: "Czech Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.3,  currency: "USD", priceInMnt: 84800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "cz-4", packageId: "prosim-in-10days-unlimited", name: "Czech Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 6.6,  currency: "USD", priceInMnt: 116800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "cz-5", packageId: "prosim-in-15days-unlimited", name: "Czech Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 12.0, currency: "USD", priceInMnt: 171800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "cz-6", packageId: "prosim-in-30days-unlimited", name: "Czech Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 16.7, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  poland: [
    { id: "pl-1", packageId: "lekko-in-3days-unlimited",  name: "Poland Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3.1,  currency: "USD", priceInMnt: 40800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "pl-2", packageId: "lekko-in-5days-unlimited",  name: "Poland Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 4.2,  currency: "USD", priceInMnt: 62800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "pl-3", packageId: "lekko-in-7days-unlimited",  name: "Poland Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.3,  currency: "USD", priceInMnt: 84800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "pl-4", packageId: "lekko-in-10days-unlimited", name: "Poland Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 6.6,  currency: "USD", priceInMnt: 116800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "pl-5", packageId: "lekko-in-15days-unlimited", name: "Poland Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 12.0, currency: "USD", priceInMnt: 171800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "pl-6", packageId: "lekko-in-30days-unlimited", name: "Poland Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 16.7, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  portugal: [
    { id: "pt-1", packageId: "fofo-mobil-in-3days-unlimited",  name: "Portugal Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3.1,  currency: "USD", priceInMnt: 40800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "pt-2", packageId: "fofo-mobil-in-5days-unlimited",  name: "Portugal Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 4.2,  currency: "USD", priceInMnt: 62800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "pt-3", packageId: "fofo-mobil-in-7days-unlimited",  name: "Portugal Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.3,  currency: "USD", priceInMnt: 84800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "pt-4", packageId: "fofo-mobil-in-10days-unlimited", name: "Portugal Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 6.6,  currency: "USD", priceInMnt: 116800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "pt-5", packageId: "fofo-mobil-in-15days-unlimited", name: "Portugal Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 12,   currency: "USD", priceInMnt: 171800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "pt-6", packageId: "fofo-mobil-in-30days-unlimited", name: "Portugal Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 18.1, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  hungary: [
    { id: "hu-1", packageId: "szia-in-3days-unlimited",  name: "Hungary Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3.1,  currency: "USD", priceInMnt: 40800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "hu-2", packageId: "szia-in-5days-unlimited",  name: "Hungary Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 4.2,  currency: "USD", priceInMnt: 62800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "hu-3", packageId: "szia-in-7days-unlimited",  name: "Hungary Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.3,  currency: "USD", priceInMnt: 84800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "hu-4", packageId: "szia-in-10days-unlimited", name: "Hungary Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 6.6,  currency: "USD", priceInMnt: 116800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "hu-5", packageId: "szia-in-15days-unlimited", name: "Hungary Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 12.0, currency: "USD", priceInMnt: 171800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "hu-6", packageId: "szia-in-30days-unlimited", name: "Hungary Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 16.7, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  croatia: [
    { id: "hr-1", packageId: "cronet-3days-unlimited",  name: "Croatia Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3.3,  currency: "USD", priceInMnt: 40800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "hr-2", packageId: "cronet-5days-unlimited",  name: "Croatia Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 4.5,  currency: "USD", priceInMnt: 62800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "hr-3", packageId: "cronet-7days-unlimited",  name: "Croatia Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.5,  currency: "USD", priceInMnt: 84800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "hr-4", packageId: "cronet-10days-unlimited", name: "Croatia Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 7.1,  currency: "USD", priceInMnt: 116800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "hr-5", packageId: "cronet-15days-unlimited", name: "Croatia Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 12.2, currency: "USD", priceInMnt: 171800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "hr-6", packageId: "cronet-30days-unlimited", name: "Croatia Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 17.0, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  belgium: [
    { id: "be-1", packageId: "belganet-px-3days-unlimited",  name: "Belgium Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 2.8,  currency: "USD", priceInMnt: 40800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "be-2", packageId: "belganet-px-5days-unlimited",  name: "Belgium Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 3.6,  currency: "USD", priceInMnt: 62800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "be-3", packageId: "belganet-px-7days-unlimited",  name: "Belgium Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.3,  currency: "USD", priceInMnt: 84800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "be-4", packageId: "belganet-px-10days-unlimited", name: "Belgium Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 6.6,  currency: "USD", priceInMnt: 116800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "be-5", packageId: "belganet-px-15days-unlimited", name: "Belgium Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 12.0, currency: "USD", priceInMnt: 171800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "be-6", packageId: "belganet-px-30days-unlimited", name: "Belgium Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 16.7, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  ireland: [
    { id: "ie-1", packageId: "failte-in-3days-unlimited",  name: "Ireland Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3.1,  currency: "USD", priceInMnt: 45800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ie-2", packageId: "failte-in-5days-unlimited",  name: "Ireland Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 4.2,  currency: "USD", priceInMnt: 85800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ie-3", packageId: "failte-in-7days-unlimited",  name: "Ireland Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.3,  currency: "USD", priceInMnt: 86800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ie-4", packageId: "failte-in-10days-unlimited", name: "Ireland Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 10.0, currency: "USD", priceInMnt: 120800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ie-5", packageId: "failte-in-15days-unlimited", name: "Ireland Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 12.0, currency: "USD", priceInMnt: 233800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ie-6", packageId: "failte-in-30days-unlimited", name: "Ireland Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 16.4, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  ukraine: [
    { id: "ua-1", packageId: "lavranet-3days-unlimited",  name: "Ukraine Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 3.2,  currency: "USD", priceInMnt: 40800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ua-2", packageId: "lavranet-5days-unlimited",  name: "Ukraine Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 4.3,  currency: "USD", priceInMnt: 62800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ua-3", packageId: "lavranet-7days-unlimited",  name: "Ukraine Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 5.3,  currency: "USD", priceInMnt: 84800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ua-4", packageId: "lavranet-10days-unlimited", name: "Ukraine Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 6.9,  currency: "USD", priceInMnt: 116800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ua-5", packageId: "lavranet-15days-unlimited", name: "Ukraine Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 11.7, currency: "USD", priceInMnt: 171800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "ua-6", packageId: "lavranet-30days-unlimited", name: "Ukraine Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 16.2, currency: "USD", priceInMnt: 333800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  kazakhstan: [
    { id: "kz-1", packageId: "kazaknet-in-3days-unlimited",  name: "Kazakhstan Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 9.3,  currency: "USD", priceInMnt: 35800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "kz-2", packageId: "kazaknet-in-5days-unlimited",  name: "Kazakhstan Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 13.6, currency: "USD", priceInMnt: 56800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "kz-3", packageId: "kazaknet-in-7days-unlimited",  name: "Kazakhstan Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 17.5, currency: "USD", priceInMnt: 76800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "kz-4", packageId: "kazaknet-in-10days-unlimited", name: "Kazakhstan Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 22.6, currency: "USD", priceInMnt: 97800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "kz-5", packageId: "kazaknet-in-15days-unlimited", name: "Kazakhstan Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 42.6, currency: "USD", priceInMnt: 150800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "kz-6", packageId: "kazaknet-in-30days-unlimited", name: "Kazakhstan Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 60.3, currency: "USD", priceInMnt: 300800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  kyrgyzstan: [
    { id: "kg-1", packageId: "doske-3days-unlimited",  name: "Kyrgyzstan Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 8.2,  currency: "USD", priceInMnt: 35800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "kg-2", packageId: "doske-5days-unlimited",  name: "Kyrgyzstan Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 11.9, currency: "USD", priceInMnt: 56800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "kg-3", packageId: "doske-7days-unlimited",  name: "Kyrgyzstan Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 15.3, currency: "USD", priceInMnt: 76800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "kg-4", packageId: "doske-10days-unlimited", name: "Kyrgyzstan Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 19.8, currency: "USD", priceInMnt: 97800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "kg-5", packageId: "doske-15days-unlimited", name: "Kyrgyzstan Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 37.1, currency: "USD", priceInMnt: 150800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "kg-6", packageId: "doske-30days-unlimited", name: "Kyrgyzstan Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 52.4, currency: "USD", priceInMnt: 300800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  uzbekistan: [
    { id: "uz-1", packageId: "uzbeknet-3days-unlimited",  name: "Uzbekistan Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 9.2,  currency: "USD", priceInMnt: 35800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "uz-2", packageId: "uzbeknet-5days-unlimited",  name: "Uzbekistan Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 14.5, currency: "USD", priceInMnt: 56800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "uz-3", packageId: "uzbeknet-7days-unlimited",  name: "Uzbekistan Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 19.7, currency: "USD", priceInMnt: 76800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "uz-4", packageId: "uzbeknet-15days-unlimited", name: "Uzbekistan Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 41.3, currency: "USD", priceInMnt: 150800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  egypt: [
    { id: "eg-1", packageId: "giza-mobile-3days-unlimited",  name: "Egypt Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 10.5, currency: "USD", priceInMnt: 74000,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "eg-2", packageId: "giza-mobile-5days-unlimited",  name: "Egypt Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 15.6, currency: "USD", priceInMnt: 118000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "eg-3", packageId: "giza-mobile-10days-unlimited", name: "Egypt Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 25,   currency: "USD", priceInMnt: 159500, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  "saudi-arabia": [
    { id: "sa-1", packageId: "redsand-3days-unlimited",   name: "Saudi Arabia Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 8.3,  currency: "USD", priceInMnt: 64500,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "sa-2", packageId: "redsand-5days-unlimited",   name: "Saudi Arabia Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 12.0, currency: "USD", priceInMnt: 103000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "sa-3", packageId: "redsand-7days-unlimited",   name: "Saudi Arabia Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 15.3, currency: "USD", priceInMnt: 141000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "sa-4", packageId: "redsand-10days-unlimited",  name: "Saudi Arabia Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 19.9, currency: "USD", priceInMnt: 198000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "sa-5", packageId: "redsand-15days-unlimited",  name: "Saudi Arabia Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 36.8, currency: "USD", priceInMnt: 293500, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "sa-6", packageId: "redsand-30days-unlimited",  name: "Saudi Arabia Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 51.9,  currency: "USD", priceInMnt: 489000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  "new-zealand": [
    { id: "nz-1", packageId: "nzcom-in-3days-unlimited",  name: "New Zealand Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 5.9,  currency: "USD", priceInMnt: 35000,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "nz-2", packageId: "nzcom-in-5days-unlimited",  name: "New Zealand Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 8.6,  currency: "USD", priceInMnt: 64500,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "nz-3", packageId: "nzcom-in-7days-unlimited",  name: "New Zealand Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 11.0, currency: "USD", priceInMnt: 65000,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "nz-4", packageId: "nzcom-in-10days-unlimited", name: "New Zealand Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 14.2, currency: "USD", priceInMnt: 90500,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "nz-5", packageId: "nzcom-in-15days-unlimited", name: "New Zealand Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 27.3, currency: "USD", priceInMnt: 174000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "nz-6", packageId: "nzcom-in-30days-unlimited", name: "New Zealand Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 37.7, currency: "USD", priceInMnt: 267500, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  nepal: [
    { id: "np-1", packageId: "patancell-3days-unlimited", name: "Nepal Unlimited 3D", data: "Unlimited", dataAmount: -1, validity: 3, price: 6.9,  currency: "USD", priceInMnt: 35800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "np-2", packageId: "patancell-5days-unlimited", name: "Nepal Unlimited 5D", data: "Unlimited", dataAmount: -1, validity: 5, price: 10.5, currency: "USD", priceInMnt: 56800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "np-3", packageId: "patancell-7days-unlimited", name: "Nepal Unlimited 7D", data: "Unlimited", dataAmount: -1, validity: 7, price: 14.1, currency: "USD", priceInMnt: 76800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  laos: [
    { id: "la-1", packageId: "pak-ou-mobile-3days-unlimited",  name: "Laos Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 12.7, currency: "USD", priceInMnt: 35800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "la-2", packageId: "pak-ou-mobile-5days-unlimited",  name: "Laos Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 18.5, currency: "USD", priceInMnt: 56800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "la-3", packageId: "pak-ou-mobile-7days-unlimited",  name: "Laos Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 24.5, currency: "USD", priceInMnt: 76800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "la-4", packageId: "pak-ou-mobile-10days-unlimited", name: "Laos Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 31.7, currency: "USD", priceInMnt: 97800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  "south-africa": [
    { id: "za-1", packageId: "cellsa-3days-unlimited",  name: "South Africa Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 12.0, currency: "USD", priceInMnt: 67500,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "za-2", packageId: "cellsa-5days-unlimited",  name: "South Africa Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 17.8, currency: "USD", priceInMnt: 108000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "za-3", packageId: "cellsa-7days-unlimited",  name: "South Africa Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 23.0, currency: "USD", priceInMnt: 148000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "za-4", packageId: "cellsa-10days-unlimited", name: "South Africa Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 32.6, currency: "USD", priceInMnt: 208000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "za-5", packageId: "cellsa-15days-unlimited", name: "South Africa Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 56.5, currency: "USD", priceInMnt: 308500, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  mexico: [
    { id: "mx-1", packageId: "chorro-fon-in-3days-unlimited",  name: "Mexico Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 8.6,  currency: "USD", priceInMnt: 57000,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "mx-2", packageId: "chorro-fon-in-5days-unlimited",  name: "Mexico Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 13,   currency: "USD", priceInMnt: 83000,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "mx-3", packageId: "chorro-fon-in-7days-unlimited",  name: "Mexico Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 16.8, currency: "USD", priceInMnt: 107000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "mx-4", packageId: "chorro-fon-in-10days-unlimited", name: "Mexico Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 21.3, currency: "USD", priceInMnt: 138000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "mx-5", packageId: "chorro-fon-in-15days-unlimited", name: "Mexico Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 40.4, currency: "USD", priceInMnt: 260000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "mx-6", packageId: "chorro-fon-in-30days-unlimited", name: "Mexico Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 57.3, currency: "USD", priceInMnt: 367500, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  mongolia: [
    { id: "mn-1", packageId: "mongolia-3days-unlimited",  name: "Mongolia Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 4.8, currency: "USD", priceInMnt: 35800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "mn-2", packageId: "mongolia-5days-unlimited",  name: "Mongolia Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 7.0, currency: "USD", priceInMnt: 56800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "mn-3", packageId: "mongolia-7days-unlimited",  name: "Mongolia Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 8.9, currency: "USD", priceInMnt: 76800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "mn-4", packageId: "mongolia-10days-unlimited", name: "Mongolia Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 11.5, currency: "USD", priceInMnt: 97800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "mn-5", packageId: "mongolia-15days-unlimited", name: "Mongolia Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 21.3, currency: "USD", priceInMnt: 150800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "mn-6", packageId: "mongolia-30days-unlimited", name: "Mongolia Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 30.3, currency: "USD", priceInMnt: 300800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  asialink: [
    { id: "al-1", packageId: "asialink-3days-unlimited",  name: "Asialink Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 4.7,  currency: "USD", priceInMnt: 47800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "al-2", packageId: "asialink-5days-unlimited",  name: "Asialink Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 6.6,  currency: "USD", priceInMnt: 74800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "al-3", packageId: "asialink-7days-unlimited",  name: "Asialink Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 8.3,  currency: "USD", priceInMnt: 99800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "al-4", packageId: "asialink-10days-unlimited", name: "Asialink Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 9.9,  currency: "USD", priceInMnt: 139800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "al-5", packageId: "asialink-15days-unlimited", name: "Asialink Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 19.1, currency: "USD", priceInMnt: 203800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "al-6", packageId: "asialink-30days-unlimited", name: "Asialink Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 26.8, currency: "USD", priceInMnt: 397800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
  eurolink: [
    { id: "el-1", packageId: "eurolink-in-3days-UNL",  name: "Eurolink Unlimited 3D",  data: "Unlimited", dataAmount: -1, validity: 3,  price: 6.3,  currency: "USD", priceInMnt: 47800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "el-2", packageId: "eurolink-in-5days-UNL",  name: "Eurolink Unlimited 5D",  data: "Unlimited", dataAmount: -1, validity: 5,  price: 9.1,  currency: "USD", priceInMnt: 74800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "el-3", packageId: "eurolink-in-7days-UNL",  name: "Eurolink Unlimited 7D",  data: "Unlimited", dataAmount: -1, validity: 7,  price: 11.5, currency: "USD", priceInMnt: 99800,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "el-4", packageId: "eurolink-in-10days-UNL", name: "Eurolink Unlimited 10D", data: "Unlimited", dataAmount: -1, validity: 10, price: 14.6, currency: "USD", priceInMnt: 139800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "el-5", packageId: "eurolink-in-15days-UNL", name: "Eurolink Unlimited 15D", data: "Unlimited", dataAmount: -1, validity: 15, price: 27.4, currency: "USD", priceInMnt: 203800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
    { id: "el-6", packageId: "eurolink-in-30days-UNL", name: "Eurolink Unlimited 30D", data: "Unlimited", dataAmount: -1, validity: 30, price: 38.6, currency: "USD", priceInMnt: 397800, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  ],
};

// The hardcoded priceInMnt values above are stale — always recompute from the
// USD price with the current formula (or manual override) so fallback prices
// can never undercut cost.
for (const [slug, list] of Object.entries(PACKAGES)) {
  for (const p of list) {
    p.priceInMnt = overriddenPrice(slug, p.validity, p.isUnlimited, p.price) ?? priceFromUsd(p.price);
  }
}

const DEFAULT_PACKAGES = (countryId: string, slug: string): Package[] => [
  { id: `${slug}-1`, packageId: `${slug}-3days-unlimited`,  name: `Unlimited 3 Days`,  data: "Unlimited", dataAmount: -1, validity: 3,  price: 11.5, currency: "USD", priceInMnt: 48000,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  { id: `${slug}-2`, packageId: `${slug}-5days-unlimited`,  name: `Unlimited 5 Days`,  data: "Unlimited", dataAmount: -1, validity: 5,  price: 19,   currency: "USD", priceInMnt: 76000,  speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  { id: `${slug}-3`, packageId: `${slug}-7days-unlimited`,  name: `Unlimited 7 Days`,  data: "Unlimited", dataAmount: -1, validity: 7,  price: 27,   currency: "USD", priceInMnt: 106000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  { id: `${slug}-4`, packageId: `${slug}-10days-unlimited`, name: `Unlimited 10 Days`, data: "Unlimited", dataAmount: -1, validity: 10, price: 35,   currency: "USD", priceInMnt: 148000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  { id: `${slug}-5`, packageId: `${slug}-15days-unlimited`, name: `Unlimited 15 Days`, data: "Unlimited", dataAmount: -1, validity: 15, price: 49,   currency: "USD", priceInMnt: 218500, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
  { id: `${slug}-6`, packageId: `${slug}-30days-unlimited`, name: `Unlimited 30 Days`, data: "Unlimited", dataAmount: -1, validity: 30, price: 72.5, currency: "USD", priceInMnt: 420000, speed: "4G/5G", isUnlimited: true, networkType: "LTE/5G" },
].map(p => ({ ...p, priceInMnt: overriddenPrice(slug, p.validity, p.isUnlimited, p.price) ?? priceFromUsd(p.price) }));

// Server-side price authority for checkout: never trust a client-sent price.
// Looks up the package in the hardcoded catalog by Airalo package_id.
export function findLocalPackage(packageId: string): Package | null {
  for (const list of Object.values(PACKAGES)) {
    const hit = list.find(p => p.packageId === packageId);
    if (hit) return hit;
  }
  return null;
}

/*
 * Everything Airalo sells beyond the curated COUNTRIES list. Those keep their
 * own slugs, photos and price overrides; these are named from
 * world-countries.ts and priced by the formula.
 */
const WORLD_EXTRA = WORLD_COUNTRIES
  .filter(([iso]) => !ISO_TO_SLUG[iso])
  .map(([iso, name, nameMn, region, flagIso]) => ({
    id: `w-${iso}`,
    slug: slugFromName(name),
    name,
    nameMn,
    flag: flagEmoji(flagIso ?? iso),
    region,
    iso,
  }));
const EXTRA_BY_SLUG = new Map(WORLD_EXTRA.map(c => [c.slug, c]));
const NAMED_CODES = new Set(WORLD_COUNTRIES.map(([iso]) => iso));
let reportedUnnamed = "";

function findCountry(slug: string) {
  const curated = COUNTRIES.find(c => c.slug === slug);
  if (curated) return { country: curated, iso: SLUG_TO_ISO[slug] as string | undefined, curated: true };
  const extra = EXTRA_BY_SLUG.get(slug);
  if (extra) {
    const { iso, ...country } = extra;
    return { country, iso: iso as string | undefined, curated: false };
  }
  return null;
}

router.get("/countries", async (_req, res) => {
  let index: Map<string, AiraloPackage[]> | null = null;
  try {
    index = await getPackagesIndex();
  } catch (err) {
    // Without Airalo we can only vouch for the curated list and its fallback
    // catalogue, so the extra destinations stay hidden until it answers.
    console.error("[Countries] Airalo index unavailable, listing curated countries only:", err);
  }

  const curated = COUNTRIES.map(c => {
    const iso = SLUG_TO_ISO[c.slug];
    const live = iso && index ? index.get(iso)?.length : undefined;
    return { ...c, packageCount: live || (PACKAGES[c.slug] || DEFAULT_PACKAGES(c.id, c.slug)).length };
  });

  const extra = index
    ? WORLD_EXTRA
        .filter(c => (index!.get(c.iso)?.length ?? 0) > 0)
        .map(({ iso, ...c }) => ({ ...c, packageCount: index!.get(iso)!.length }))
    : [];

  if (index) {
    const unnamed = [...index.keys()].filter(code => !NAMED_CODES.has(code) && !ISO_TO_SLUG[code]).sort().join(",");
    if (unnamed && unnamed !== reportedUnnamed) {
      reportedUnnamed = unnamed;
      console.warn(`[Countries] Airalo sells destinations with no name in world-countries.ts: ${unnamed}`);
    }
  }

  const countries = [...curated, ...extra.sort((a, b) => a.name.localeCompare(b.name))];
  res.json({ countries });
});

router.get("/countries/:slug/packages", async (req, res) => {
  const { slug } = req.params;
  const found = findCountry(slug);
  if (!found) {
    res.status(404).json({ error: "not_found", message: "Country not found" });
    return;
  }
  const { country, iso: isoCode } = found;

  // Destinations outside the curated list have no fallback catalogue: made-up
  // package ids there would take the money and then fail at Airalo. When
  // Airalo can't answer they show no packages rather than invented ones.
  if (!found.curated) {
    try {
      const sorted = (await getPackagesByCountry(isoCode!)).sort((a, b) => a.day - b.day || a.amount - b.amount);
      const packages = sorted.map((p, i) => convertAiraloPackage(p, slug, i));
      res.json({ country: { ...country, packageCount: packages.length }, packages });
    } catch (err) {
      console.error(`[Airalo] Package fetch failed for ${slug}:`, err);
      res.json({ country: { ...country, packageCount: 0 }, packages: [] });
    }
    return;
  }

  // Regional packages (asialink, eurolink) or no ISO mapping → use hardcoded
  if (!isoCode) {
    const packages = PACKAGES[slug] || DEFAULT_PACKAGES(country.id, slug);
    res.json({ country: { ...country, packageCount: packages.length }, packages });
    return;
  }

  try {
    const airaloPackages = await getPackagesByCountry(isoCode);
    if (airaloPackages.length === 0) {
      const fallback = PACKAGES[slug] || DEFAULT_PACKAGES(country.id, slug);
      res.json({ country: { ...country, packageCount: fallback.length }, packages: fallback });
      return;
    }
    // Sort by validity days, then by data amount
    const sorted = airaloPackages.sort((a, b) => a.day - b.day || a.amount - b.amount);
    const packages = sorted.map((p, i) => convertAiraloPackage(p, slug, i));
    res.json({ country: { ...country, packageCount: packages.length }, packages });
  } catch (err) {
    console.error(`[Airalo] Package fetch failed for ${slug}, using fallback:`, err);
    const fallback = PACKAGES[slug] || DEFAULT_PACKAGES(country.id, slug);
    res.json({ country: { ...country, packageCount: fallback.length }, packages: fallback });
  }
});

export default router;
