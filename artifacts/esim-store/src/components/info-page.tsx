import type { ReactNode } from 'react';

/**
 * Shared frame for the text pages (How it works, Help, About) so the three
 * read as one family with the landing: warm page, black type, a short yellow
 * rule as the only accent in the header.
 */
export function PageHero({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: string }) {
  return (
    <header className="mx-auto max-w-5xl px-5 pb-6 pt-12 md:px-8 md:pt-16">
      <span className="block h-1.5 w-8 rounded-full bg-brand" />
      <p className="mt-4 text-sm font-semibold text-[#6B6B6B]">{eyebrow}</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-[#111] md:text-5xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#333] md:text-lg">{lead}</p>
    </header>
  );
}

export function Section({ title, lead, children }: { title?: string; lead?: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-5xl px-5 py-6 md:px-8">
      {title && <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#111]">{title}</h2>}
      {lead && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6B6B6B]">{lead}</p>}
      <div className={title || lead ? 'mt-6' : ''}>{children}</div>
    </section>
  );
}
