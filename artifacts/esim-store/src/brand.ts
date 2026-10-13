// The storefront's view of the repo-root brand.json, the single file a new
// brand edits. Colours reach CSS as --brand-* variables injected into
// index.html by vite.config.ts, so components use bg-brand, text-brand-ink…
// rather than hex values.
import brand from '../../../brand.json';

export const BRAND = {
  name: brand.name,
  tagline: brand.tagline,
} as const;
