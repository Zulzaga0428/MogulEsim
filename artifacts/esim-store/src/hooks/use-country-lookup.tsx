import { useListCountries } from '@workspace/api-client-react';

/** "🇯🇵" -> "jp"; anything that is not a pair of regional indicators -> null. */
export function flagCodeFromEmoji(flag: string): string | null {
  const chars = [...flag];
  if (chars.length !== 2) return null;
  const code = chars.map(c => String.fromCharCode(c.codePointAt(0)! - 0x1f1e6 + 65)).join('');
  return /^[A-Z]{2}$/.test(code) ? code.toLowerCase() : null;
}

export interface CountryInfo {
  name: string;
  nameMn: string;
  /** ISO code for a flag image, or null for regional bundles. */
  flagCode: string | null;
  /** The API's own emoji, used when there is no flag image (🌏, 🌍). */
  emoji: string;
}

/**
 * Names and flags for an order's countrySlug, read from the same /countries
 * list the storefront sells from. Pages used to keep their own dozen-entry
 * tables, so every destination outside them showed as a bare slug.
 */
export function useCountryLookup(): (slug: string) => CountryInfo {
  const { data } = useListCountries({});
  const bySlug = new Map((data?.countries ?? []).map(c => [c.slug, c]));
  return (slug: string) => {
    const c = bySlug.get(slug);
    if (!c) return { name: slug, nameMn: slug, flagCode: null, emoji: '🌐' };
    return { name: c.name, nameMn: c.nameMn, flagCode: flagCodeFromEmoji(c.flag), emoji: c.flag };
  };
}

/** Flag as an image: emoji flags render as two letters on Windows. */
export function FlagImage({ info, className = 'w-6 h-4' }: { info: CountryInfo; className?: string }) {
  return info.flagCode ? (
    <img src={`https://flagcdn.com/${info.flagCode}.svg`} alt="" className={`${className} object-cover rounded-[3px] ring-1 ring-black/5`} />
  ) : (
    <span aria-hidden="true">{info.emoji}</span>
  );
}
