import { Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useListCountryPackages } from '@workspace/api-client-react';
import {
  ArrowRight, Play, ChevronsDown, Globe, Infinity as InfinityIcon, ShieldCheck, Smartphone, Headphones,
  ShoppingCart, ScanLine, Wallet, QrCode, Check, Plane,
} from 'lucide-react';
import { BRAND } from '@/brand';

/**
 * How many destinations we advertise. Every "200+" on the page reads from
 * here so the claim can't drift between one line and the next.
 *
 * This is Airalo coverage, not the size of our own catalogue. The 2026-09-11
 * net-price export in attached_assets lists 204 countries and territories
 * plus 11 regional bundles; recount from it before changing this.
 */
const COUNTRY_COUNT = 200;

const IMG = `${import.meta.env.BASE_URL}images/brand`;

/**
 * Cards under "Popular destinations". The slug must exist in the API's
 * COUNTRIES list. The first four make the desktop row; a phone shows all six
 * as a two-column grid.
 */
const DESTINATIONS = [
  { slug: 'japan', name: 'Japan', nameMn: 'Япон' },
  { slug: 'france', name: 'France', nameMn: 'Франц' },
  { slug: 'south-korea', name: 'South Korea', nameMn: 'Солонгос' },
  { slug: 'thailand', name: 'Thailand', nameMn: 'Тайланд' },
  { slug: 'china', name: 'China', nameMn: 'Хятад', phoneOnly: true },
  { slug: 'usa', name: 'USA', nameMn: 'АНУ', phoneOnly: true },
] as const;

const COPY = {
  mn: {
    eyebrow: `Хязгааргүй дата · ${COUNTRY_COUNT}+ улс`,
    title: 'Мянган бээрийн аялал нэг алхмаас эхэлдэг.',
    // Unlimited data is the one thing that sets this shop apart, so the first
    // paragraph says it.
    subtitle: `${BRAND.name} eSIM — дэлхийгээр аялахдаа дата-гаа бүү тасал. Хязгааргүй дататай, QPay-ээр төлөөд QR кодоо шууд ав.`,
    buy: 'eSIM авах',
    how: 'Яаж ажилладаг вэ?',
    cueTitle: 'Аялах уу?',
    cueText: '1 алхмаа хязгааргүй дататай эхэл',
    features: [
      { icon: Globe, title: `Дэлхий даяар ${COUNTRY_COUNT}+ улс`, text: 'Аялалаа хаана ч үргэлжлүүл.' },
      { icon: InfinityIcon, title: 'Хязгааргүй дата', text: 'Өдрийн хязгааргүй, санаа зоволтгүй.' },
      { icon: ShieldCheck, title: 'Аюулгүй, найдвартай', text: 'Олон улсын сүлжээнд холбогдоно.' },
      { icon: Smartphone, title: 'Хялбар хэрэглээ', text: 'QR кодоо уншуулаад л болоо.' },
      { icon: Headphones, title: '24/7 туслах', text: 'AI туслах хэзээ ч хариулна.' },
    ],
    destEyebrow: 'Онцлох чиглэлүүд',
    destTitle: 'Дэлхийн хамгийн гайхалтай газрууд руу',
    destText: 'Таныг хаана ч байсан холбогдсон байлгана. Алдартай чиглэлүүдээс сонголтоо хийгээрэй.',
    viewAll: 'Бүх улс орнууд',
    from: (p: string) => `${p}-с`,
    stepsEyebrow: 'Хэрхэн ажиллах вэ?',
    stepsTitle: '3 энгийн алхам',
    steps: [
      { icon: ShoppingCart, title: 'Багцаа сонго' },
      { icon: ScanLine, title: 'QR кодоо ав' },
      { icon: Smartphone, title: 'eSIM-ээ идэвхжүүл' },
    ],
    phoneConnected: 'eSIM холбогдлоо',
    phoneSub: 'Хаана ч онлайн',
    phonePlan: 'Таны багц',
    phonePlanName: 'Япон',
    phonePlanText: '7 хоног · Хязгааргүй',
    note: ['Хаана ч', 'холбоотой'],
    whyTitle: 'Аялагчдад хэрэгтэй бүхэн нэг дор',
    whyText: 'Нэмэлт төлбөргүй, нуугдмал нөхцөлгүй.',
    facts: [
      { icon: Globe, text: `${COUNTRY_COUNT}+ улс, бүс` },
      { icon: Wallet, text: 'QPay-ээр төлнө' },
      { icon: QrCode, text: 'QR шууд гарна' },
      { icon: Headphones, text: 'Монгол хэлээр туслах' },
    ],
    bigStat: 'Хязгааргүй',
    bigStatText: 'Unlimited дата 100+ улсад',
    ctaEyebrow: `${BRAND.name} eSIM`,
    ctaTitle: 'Дэлхий таныг хүлээж байна.',
    ctaText: 'Өнөөдөр eSIM-ээ аваад, маргаашийн аяллаа эхлүүлээрэй.',
  },
  en: {
    eyebrow: `Unlimited data · ${COUNTRY_COUNT}+ countries`,
    title: 'A journey of a thousand miles begins with one step.',
    subtitle: `${BRAND.name} eSIM — never lose your data while you travel. Unlimited plans, pay with QPay and get your QR code instantly.`,
    buy: 'Get eSIM',
    how: 'How does it work?',
    cueTitle: 'Ready to go?',
    cueText: 'Take the first step with unlimited data',
    features: [
      { icon: Globe, title: `${COUNTRY_COUNT}+ countries`, text: 'Keep going, wherever you are.' },
      { icon: InfinityIcon, title: 'Unlimited data', text: 'No daily cap, no worries.' },
      { icon: ShieldCheck, title: 'Safe & reliable', text: 'Connects to trusted local networks.' },
      { icon: Smartphone, title: 'Easy to use', text: 'Scan a QR code and you are done.' },
      { icon: Headphones, title: '24/7 help', text: 'Our AI assistant always answers.' },
    ],
    destEyebrow: 'Popular destinations',
    destTitle: "The world's most amazing places",
    destText: 'Stay connected wherever you are. Pick one of our popular destinations.',
    viewAll: 'All countries',
    from: (p: string) => `From ${p}`,
    stepsEyebrow: 'How it works',
    stepsTitle: '3 simple steps',
    steps: [
      { icon: ShoppingCart, title: 'Choose a plan' },
      { icon: ScanLine, title: 'Get your QR code' },
      { icon: Smartphone, title: 'Activate' },
    ],
    phoneConnected: 'eSIM connected',
    phoneSub: 'Online, everywhere',
    phonePlan: 'Your plan',
    phonePlanName: 'Japan',
    phonePlanText: '7 days · Unlimited',
    note: ['Stay connected', 'everywhere'],
    whyTitle: 'Everything a traveller needs',
    whyText: 'No hidden fees, no fine print.',
    facts: [
      { icon: Globe, text: `${COUNTRY_COUNT}+ countries & regions` },
      { icon: Wallet, text: 'Pay with QPay' },
      { icon: QrCode, text: 'Instant QR code' },
      { icon: Headphones, text: 'Help in Mongolian' },
    ],
    bigStat: 'Unlimited',
    bigStatText: 'Unlimited data in 100+ countries',
    ctaEyebrow: `${BRAND.name} eSIM`,
    ctaTitle: 'The world is waiting for you.',
    ctaText: "Get your eSIM today and start tomorrow's journey.",
  },
} as const;

const mnt = (n: number) => `₮${Math.round(n).toLocaleString('en-US')}`;

function DestinationCard({ d }: { d: (typeof DESTINATIONS)[number] }) {
  const { lang } = useLanguage();
  const c = COPY[lang];
  // The Airalo catalogue is cached server-side for two hours, so these cards
  // cost one upstream fetch, not one each.
  const { data } = useListCountryPackages(d.slug);
  const prices = (data?.packages ?? []).map(p => p.priceInMnt).filter(p => p > 0);
  const min = prices.length ? Math.min(...prices) : null;
  const name = lang === 'mn' ? d.nameMn : d.name;

  return (
    <Link
      href={`/countries/${d.slug}`}
      className={`group ${'phoneOnly' in d ? 'md:hidden' : ''} min-w-0 overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.14)]`}
    >
      <div className="aspect-[4/3] overflow-hidden md:aspect-[4/4.6]">
        <img
          src={`${IMG}/dest-${d.slug}.webp`}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex items-center gap-2 px-3 py-3 md:px-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#111]">{name}</p>
          <p className="whitespace-nowrap text-xs text-[#6b6b6b]">
            {min != null ? c.from(mnt(min)) : <span className="inline-block h-3 w-16 animate-pulse rounded bg-black/5 align-middle" />}
          </p>
        </div>
        <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand transition group-hover:bg-brand group-hover:text-on-brand sm:flex">
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

/** The "eSIM connected" phone in the how-it-works band, drawn in code so its
 *  words follow the language switch. */
function PhoneMockup() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  return (
    <div className="relative mx-auto w-[220px] md:w-[250px]">
      {/* Snapshots fanned out behind the phone. */}
      <img src={`${IMG}/dest-thailand.webp`} alt="" aria-hidden="true" loading="lazy"
        className="absolute -left-20 top-20 w-28 rotate-[-12deg] rounded-sm border-[5px] border-white object-cover shadow-xl md:-left-24 md:w-32 aspect-square" />
      <img src={`${IMG}/dest-japan.webp`} alt="" aria-hidden="true" loading="lazy"
        className="absolute -right-16 top-6 w-24 rotate-[10deg] rounded-sm border-[5px] border-white object-cover shadow-xl md:-right-20 md:w-28 aspect-square" />
      <img src={`${IMG}/dest-china.webp`} alt="" aria-hidden="true" loading="lazy"
        className="absolute -right-14 bottom-10 w-24 rotate-[6deg] rounded-sm border-[5px] border-white object-cover shadow-xl md:-right-20 md:w-28 aspect-square" />

      <div className="relative rounded-[2.4rem] bg-[#111] p-2.5 shadow-[0_30px_60px_rgba(0,0,0,0.45)]">
        <div className="relative overflow-hidden rounded-[1.9rem] bg-[#F6F6F6] px-4 pb-6 pt-8">
          <span className="absolute left-1/2 top-2 h-4 w-20 -translate-x-1/2 rounded-full bg-[#111]" />
          <div className="flex items-center justify-center gap-1.5">
            <InfinityIcon className="h-5 w-5 text-brand" strokeWidth={3} />
            <span className="font-display text-[11px] font-extrabold uppercase tracking-wide text-[#111]">{BRAND.name}</span>
          </div>
          <div className="mt-4 rounded-2xl bg-white p-4 text-center shadow-sm">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#16A34A]">
              <Check className="h-5 w-5 text-white" strokeWidth={3} />
            </span>
            <p className="mt-2 text-[13px] font-bold text-[#111]">{c.phoneConnected}</p>
            <p className="text-[11px] text-[#6b6b6b]">{c.phoneSub}</p>
          </div>
          <p className="mt-4 text-[11px] font-semibold text-[#6b6b6b]">{c.phonePlan}</p>
          <div className="mt-1.5 flex items-center gap-2.5 rounded-xl bg-white p-3 shadow-sm">
            <img src="https://flagcdn.com/jp.svg" alt="" className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-black/10" />
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-[#111]">{c.phonePlanName}</p>
              <p className="truncate text-[10px] text-[#6b6b6b]">{c.phonePlanText}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { lang } = useLanguage();
  const c = COPY[lang];

  return (
    <div className="w-full overflow-hidden bg-white text-[#111]">
      {/* ── Hero ─────────────────────────────────────────────── */}
      {/* The site header floats over this section on the home page (see
          Layout), so the top padding leaves room for it. */}
      {/* The section's own red matches the photo's left edge, so on wide
          screens the photo can stay pinned right at full height (objects
          clear of the headline) and fade into it instead of being cropped. */}
      <section className="relative bg-gradient-to-b from-[#8E070E] to-[#610106]">
        <img
          src={`${IMG}/hero-mobile.webp`}
          alt=""
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-auto w-full select-none md:hidden"
        />
        <img
          src={`${IMG}/hero-desktop.webp`}
          alt=""
          aria-hidden="true"
          className="absolute bottom-0 right-0 hidden h-[62%] w-auto max-w-none select-none [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,#000_18%),linear-gradient(to_bottom,transparent,#000_14%)] md:block lg:h-[80%]"
        />
        {/* Darken the copy side so white type reads whatever the photo. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent md:bg-gradient-to-r md:from-black/25 md:via-black/5 md:to-transparent" />

        {/* On a phone the photo keeps its own shape, pinned to the bottom, so
            its empty red top runs behind the copy; the padding scales with
            the width so the plane always starts just under the buttons. */}
        <div className="relative mx-auto max-w-7xl px-5 pb-[92vw] pt-28 md:px-10 md:pb-28 md:pt-36 lg:pb-32">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/85 md:text-xs">{c.eyebrow}</p>
          <h1 className="mt-4 max-w-[30rem] font-display text-[2.15rem] font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-[3.1rem]">
            {c.title}
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/90 md:text-[17px]">{c.subtitle}</p>

          {/* One row on a phone too: wrapped, the second link sat alone on the photo. */}
          <div className="mt-8 flex items-center gap-3 sm:gap-5">
            <Link
              href="/countries"
              className="inline-flex shrink-0 items-center gap-2.5 rounded-full bg-white px-6 py-3.5 font-semibold sm:gap-3 sm:px-7 text-brand shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition hover:bg-[#FFF5F5] active:scale-[0.97]"
            >
              {c.buy}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/how-it-works" className="group inline-flex min-w-0 items-center gap-2 text-[13px] font-semibold leading-tight text-white sm:gap-3 sm:text-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 border-2 border-white/80 transition group-hover:bg-white/10">
                <Play className="ml-0.5 h-4 w-4 fill-white" />
              </span>
              {c.how}
            </Link>
          </div>
        </div>

        {/* Phone only: the hero is a tall photo there, and nothing hinted
            that the page carries on below it. */}
        <button
          type="button"
          onClick={() => document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute inset-x-0 bottom-5 z-10 mx-auto flex w-fit flex-col items-center text-center md:hidden"
        >
          <span className="rounded-full bg-[#FFD60A] px-4 py-2 text-[13px] font-extrabold text-[#111] shadow-[0_8px_24px_rgba(0,0,0,0.35)] motion-safe:animate-pulse">
            {c.cueTitle} <span className="font-semibold">{c.cueText}</span>
          </span>
          <ChevronsDown className="mt-1 h-8 w-8 text-[#FFD60A] drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)] motion-safe:animate-bounce" strokeWidth={2.6} />
        </button>

        <p className="gt-hand pointer-events-none absolute bottom-[14%] left-[50%] hidden rotate-[-14deg] text-[2rem] leading-[1.05] text-white/90 lg:block">
          More<br />&nbsp;&nbsp;Destinations<br />&nbsp;&nbsp;&nbsp;&nbsp;More Stories
          <Plane className="ml-2 inline h-7 w-7 -rotate-12 fill-white text-white" />
        </p>
      </section>

      {/* ── Five reasons ─────────────────────────────────────── */}
      {/* Desktop only: on a phone it was a long scroll of five small cards. */}
      <section className="hidden border-b border-black/5 bg-white md:block">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-7 px-5 py-10 sm:grid-cols-3 md:px-10 lg:grid-cols-5 lg:gap-0 lg:py-12">
          {c.features.map((f, i) => (
            <li key={f.title} className={`${i === 4 ? 'col-span-2 sm:col-span-1' : ''} lg:border-l lg:border-black/10 lg:px-6 lg:first:border-l-0 lg:first:pl-0`}>
              <f.icon className="h-8 w-8 text-brand" strokeWidth={1.8} />
              <p className="mt-3 text-[15px] font-bold leading-snug text-[#111]">{f.title}</p>
              <p className="mt-1 text-[13px] leading-snug text-[#6b6b6b]">{f.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Popular destinations ─────────────────────────────── */}
      <section id="destinations" className="bg-[#F6F6F6]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 md:px-10 lg:grid-cols-[0.8fr_2fr] lg:items-center lg:py-20">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">{c.destEyebrow}</p>
            <h2 className="mt-3 font-display text-[1.75rem] font-extrabold leading-tight text-[#111] md:text-[2.1rem]">{c.destTitle}</h2>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[#555]">{c.destText}</p>
            <Link href="/countries" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline">
              {c.viewAll}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {DESTINATIONS.map(d => <DestinationCard key={d.slug} d={d} />)}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#C8131A] via-[#A80F14] to-[#7E0A0E] text-white">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-16 md:px-10 lg:grid-cols-[1fr_1.6fr] lg:items-center lg:py-20">
          <div className="relative order-2 lg:order-1">
            <PhoneMockup />
            <p className="gt-hand pointer-events-none absolute -bottom-6 right-[8%] rotate-[-10deg] text-2xl leading-tight text-white/85 lg:right-0">
              {c.note[0]}<br />&nbsp;&nbsp;{c.note[1]}
            </p>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/75">{c.stepsEyebrow}</p>
            <h2 className="mt-3 font-display text-[1.75rem] font-extrabold text-white md:text-[2.1rem]">{c.stepsTitle}</h2>
            {/* Three across even on a phone: stacked, the band was a long scroll. */}
            <ol className="mt-8 grid grid-cols-3 gap-3 sm:mt-10 sm:gap-6">
              {c.steps.map((s, i) => (
                <li key={s.title} className="relative text-center sm:text-left">
                  <div className="flex items-center justify-center gap-3 sm:justify-start">
                    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-lg sm:h-14 sm:w-14">
                      <s.icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
                      <span className="absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#111] text-[10px] font-bold text-white">{i + 1}</span>
                    </span>
                    {i < c.steps.length - 1 && <span className="hidden h-px flex-1 bg-white/30 sm:block" />}
                  </div>
                  <p className="mt-3 text-[13px] font-bold leading-tight sm:mt-4 sm:text-[15px]">{s.title}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Facts, not testimonials ──────────────────────────── */}
      {/* Only claims we can stand behind: no borrowed logos or made-up
          customer counts. Add real reviews here once there are some. */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:px-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="font-display text-xl font-extrabold text-[#111] md:text-2xl">{c.whyTitle}</h2>
            <p className="mt-1 text-sm text-[#6b6b6b]">{c.whyText}</p>
            <ul className="mt-6 grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-x-10">
              {c.facts.map(f => (
                <li key={f.text} className="flex items-center gap-2.5 text-[15px] font-semibold text-[#444]">
                  <f.icon className="h-5 w-5 shrink-0 text-brand" />
                  {f.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-black/10 pt-6 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
            <p className="flex items-center gap-2 font-display text-3xl font-extrabold text-brand md:text-4xl">
              <InfinityIcon className="h-10 w-10" strokeWidth={2.6} />
              {c.bigStat}
            </p>
            <p className="mt-1 text-sm text-[#6b6b6b]">{c.bigStatText}</p>
          </div>
        </div>
      </section>

      {/* ── Call to action ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#3A0B0B]">
        <picture>
          <source media="(min-width: 768px)" srcSet={`${IMG}/cta-desktop.webp`} />
          <img
            src={`${IMG}/cta-mobile.webp`}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-bottom md:object-right"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-transparent md:bg-gradient-to-r md:from-black/60 md:via-black/20 md:to-transparent" />
        <div className="relative mx-auto max-w-7xl px-5 pb-56 pt-12 sm:pb-72 md:px-10 md:py-24">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">{c.ctaEyebrow}</p>
          <h2 className="mt-3 max-w-md font-display text-[2rem] font-extrabold leading-tight text-white md:text-[2.6rem]">{c.ctaTitle}</h2>
          <p className="mt-3 max-w-sm text-[15px] text-white/90">{c.ctaText}</p>
          <Link
            href="/countries"
            className="mt-7 inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 font-semibold text-brand transition hover:bg-[#FFF5F5] active:scale-[0.97]"
          >
            {c.buy}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
