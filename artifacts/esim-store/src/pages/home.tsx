import { Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import {
  ArrowRight, Wifi, Zap, ShieldCheck, Smartphone, Headphones,
  ShoppingCart, QrCode, SmartphoneNfc, ChevronRight, Infinity as InfinityIcon, Database, CalendarDays,
} from 'lucide-react';

const IMG = `${import.meta.env.BASE_URL}images/brand/`;

// The eight destinations of the design, with photos cut from it.
const DESTINATIONS = [
  { slug: 'japan', flag: 'jp', mn: 'Япон', en: 'Japan' },
  { slug: 'south-korea', flag: 'kr', mn: 'БНСУ', en: 'South Korea' },
  { slug: 'china', flag: 'cn', mn: 'Хятад', en: 'China' },
  { slug: 'thailand', flag: 'th', mn: 'Тайланд', en: 'Thailand' },
  { slug: 'france', flag: 'fr', mn: 'Франц', en: 'France' },
  { slug: 'usa', flag: 'us', mn: 'АНУ', en: 'USA' },
  { slug: 'singapore', flag: 'sg', mn: 'Сингапур', en: 'Singapore' },
  { slug: 'turkey', flag: 'tr', mn: 'Турк', en: 'Turkey' },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#1E3A48] md:text-xs">
      {children}
      <span className="h-[3px] w-10 rounded-full bg-[var(--accent)]" />
    </p>
  );
}

export default function Home() {
  const { lang } = useLanguage();
  const mn = lang === 'mn';

  const features = [
    { icon: Wifi, t: mn ? 'Хязгааргүй дата' : 'Unlimited data', d: mn ? 'Тасралтгүй, найдвартай' : 'Steady and reliable' },
    { icon: Zap, t: mn ? 'Шуурхай идэвхжүүлэлт' : 'Instant activation', d: mn ? 'Хэдхэн минутын дотор' : 'In a few minutes' },
    { icon: ShieldCheck, t: mn ? 'Аюулгүй, найдвартай' : 'Safe and secure', d: mn ? 'Олон улсын сүлжээнд' : 'On global networks' },
    { icon: Smartphone, t: mn ? 'Хялбар ашиглалт' : 'Easy to use', d: mn ? 'QR кодоор суулгах' : 'Install with a QR code' },
    { icon: Headphones, t: mn ? '24/7 тусламж' : '24/7 support', d: mn ? 'Бид үргэлж таны дэргэд' : 'Always here for you' },
  ];

  const kinds = [
    {
      tab: 'unlimited', icon: InfinityIcon,
      t: mn ? 'Хязгааргүй' : 'Unlimited',
      d: mn ? 'Дата хэмжээгүй, 1-30 хоногийн сонголт. Санаа зоволтгүй аялагчдад.' : 'No data cap, 1 to 30 days. For worry-free travel.',
      tag: mn ? 'Хамгийн их сонгогддог' : 'Most popular',
    },
    {
      tab: 'fixed', icon: Database,
      t: mn ? 'GB багц' : 'GB plans',
      d: mn ? '1GB-аас 50GB хүртэл. Хэр хэрэглэхээ мэддэг бол хамгийн хямд.' : '1 GB to 50 GB. The cheapest if you know your usage.',
      tag: mn ? '₮5,000-аас' : 'From ₮5,000',
    },
    {
      tab: 'daily', icon: CalendarDays,
      t: mn ? 'Өдрийн багц' : 'Daily plans',
      d: mn ? 'Өдөр бүр шинэ дата. Урт аялалд хямд, тогтвортой.' : 'Fresh data every day. Steady and cheap on long trips.',
      tag: mn ? 'Урт аялалд' : 'For long trips',
    },
  ];

  const steps = [
    { icon: ShoppingCart, t: mn ? 'Багцаа сонго' : 'Pick a plan', d: mn ? 'Аялах улс, хоногоо сонгоно.' : 'Choose a country and days.' },
    { icon: QrCode, t: mn ? 'QR кодоо ав' : 'Get your QR', d: mn ? 'Төлбөрөө төлөөд eSIM-ийн QR кодоо авна.' : 'Pay and receive your eSIM QR code.' },
    { icon: SmartphoneNfc, t: mn ? 'eSIM-ээ идэвхжүүл' : 'Activate', d: mn ? 'Утсандаа суулгаад нэн даруй ашиглана.' : 'Install it and go online right away.' },
  ];

  return (
    <div className="overflow-x-hidden bg-[linear-gradient(180deg,#E6F6FB_0%,#F5FBFD_38%,#FFFFFF_70%)]">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative">
        <div className="container mx-auto grid max-w-7xl items-center gap-6 px-4 pt-8 md:grid-cols-[1fr_1.1fr] md:gap-2 md:pt-6">
          <div className="relative z-10">
            <Eyebrow>{mn ? 'Аяллын хязгааргүй дата' : 'Unlimited travel data'}</Eyebrow>
            <h1 className="mt-4 font-display text-[36px] font-extrabold leading-[1.05] tracking-tight text-[#0F2A3A] sm:text-5xl md:text-[40px] lg:text-[50px] xl:text-[58px]">
              <span className="block whitespace-nowrap">{mn ? 'Дэлхийн хаана ч' : 'Anywhere, stay'}</span>
              <span className="block whitespace-nowrap text-brand">{mn ? 'дататай бай.' : 'with data.'}</span>
            </h1>
            <p className="mt-4 hidden max-w-md text-base leading-relaxed text-[#33505E] md:block md:text-lg">
              {mn
                ? 'Аяллын eSIM – SIM карт солихгүй, шууд онлайнаар идэвхжүүлээд датагаар аялаарай.'
                : 'Travel eSIM – no SIM swap. Activate online and travel with data.'}
            </p>
          </div>

          <div className="relative -mx-4 md:mx-0 md:-mr-10">
            <img
              src={`${IMG}dt-hero.webp`}
              alt={mn ? 'DataTai eSIM — дэлхийн аялал' : 'DataTai eSIM — world travel'}
              // The art has its own sky; fade every edge into the page's sky
              // so it reads as one scene instead of a pasted rectangle.
              className="w-full [-webkit-mask-composite:source-in] [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent_0%,#000_12%,#000_92%,transparent_100%),linear-gradient(to_bottom,transparent_0%,#000_14%,#000_84%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,#000_12%,#000_92%,transparent_100%),linear-gradient(to_bottom,transparent_0%,#000_14%,#000_84%,transparent_100%)]"
              width={856}
              height={370}
            />
          </div>
        </div>

        {/* Feature bar */}
        <div className="container mx-auto max-w-7xl px-4">
          <div className="relative z-10 mt-4 hidden grid-cols-2 gap-x-3 gap-y-4 rounded-3xl bg-white/95 p-4 shadow-[0_18px_40px_rgba(15,42,58,0.10)] ring-1 ring-black/[0.04] sm:grid-cols-3 md:mt-0 md:grid md:grid-cols-5 md:gap-0 md:p-5">
            {features.map(({ icon: Icon, t, d }, i) => (
              <div
                key={t}
                className={`flex items-center gap-3 md:px-4 ${i > 0 ? 'md:border-l md:border-black/[0.07]' : ''} ${i === 4 ? 'col-span-2 sm:col-span-1' : ''}`}
              >
                <Icon className="h-8 w-8 shrink-0 text-brand" strokeWidth={2.2} />
                <div className="min-w-0">
                  <p className="text-[13px] font-extrabold leading-tight text-[#0F2A3A] md:text-sm">{t}</p>
                  <p className="mt-0.5 text-[11px] leading-tight text-[#5B7480] md:text-xs">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Destinations ─────────────────────────────────── */}
      <section id="destinations" className="relative">
        <div className="container mx-auto grid max-w-7xl gap-6 px-4 py-12 md:grid-cols-[290px_1fr] md:gap-8 md:py-14">
          <div className="relative">
            <p className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#1E3A48] md:text-xs">
              <span className="h-[3px] w-7 rounded-full bg-[var(--accent)]" />
              {mn ? 'Онцлох чиглэлүүд' : 'Top destinations'}
            </p>
            <h2 className="mt-3 whitespace-nowrap font-display text-2xl font-extrabold leading-tight text-[#0F2A3A] md:whitespace-normal md:text-[34px]">
              {mn ? <>Аяллын <br className="hidden md:inline" />eSIM багцууд</> : <>Travel <br className="hidden md:inline" />eSIM plans</>}
            </h2>
            <p className="mt-3 hidden text-[15px] leading-relaxed text-[#33505E] md:block">
              {mn ? 'Хамгийн эрэлттэй 8 улс руу хязгааргүй датагаар аялаарай.' : 'Travel the 8 most popular countries with unlimited data.'}
            </p>
            <Link
              href="/countries"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-full border-2 border-brand px-5 text-sm font-bold text-brand hover:bg-brand hover:text-on-brand"
            >
              {mn ? 'Бүх улс орнууд' : 'All countries'} <ArrowRight className="h-4 w-4" />
            </Link>
            <img
              src={`${IMG}dt-sakura.webp`}
              alt=""
              aria-hidden
              className="pointer-events-none absolute -bottom-14 -left-4 hidden w-[300px] opacity-90 [-webkit-mask-image:radial-gradient(ellipse_at_left_bottom,#000_45%,transparent_75%)] [mask-image:radial-gradient(ellipse_at_left_bottom,#000_45%,transparent_75%)] md:block"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {DESTINATIONS.map(d => (
              <Link
                key={d.slug}
                href={`/countries/${d.slug}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-[0_6px_18px_rgba(15,42,58,0.08)] ring-1 ring-black/[0.05] transition-all hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(15,42,58,0.14)]"
              >
                <div className="aspect-[250/100] overflow-hidden">
                  <img
                    src={`${IMG}dt-${d.slug}.webp`}
                    alt={mn ? d.mn : d.en}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center gap-2.5 px-3 py-3">
                  <img src={`https://flagcdn.com/w40/${d.flag}.png`} alt="" className="h-5 w-5 rounded-full object-cover ring-1 ring-black/10" />
                  <span className="flex-1 truncate text-sm font-bold text-[#0F2A3A] md:text-[15px]">{mn ? d.mn : d.en}</span>
                  <ArrowRight className="h-4 w-4 text-[var(--accent)] transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Three kinds of plans ─────────────────────────── */}
      <section className="container mx-auto max-w-7xl px-4 pb-8 md:pb-14">
        <div className="text-center">
          <h2 className="font-display text-xl font-extrabold text-[#0F2A3A] md:text-3xl">
            {mn ? 'Таны аялалд тохирох багц' : 'A plan for every trip'}
          </h2>
          <p className="mt-2 hidden text-[15px] text-[#33505E] md:block">
            {mn ? 'Нэг сайтад гурван төрөл — өөрт хэрэгтэйгээ л сонго.' : 'Three kinds in one place — take only what you need.'}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 md:mt-6 md:gap-4">
          {kinds.map(({ tab, icon: Icon, t, d, tag }, i) => (
            <Link
              key={tab}
              href={`/countries/china?tab=${tab}`}
              className={`group relative flex flex-col items-center rounded-2xl p-3 text-center transition-all hover:-translate-y-1 md:items-start md:rounded-3xl md:p-5 md:text-left ${
                i === 0
                  ? 'bg-brand text-on-brand shadow-[0_16px_36px_color-mix(in_srgb,var(--brand)_30%,transparent)]'
                  : 'bg-white ring-1 ring-black/[0.06] shadow-[0_6px_18px_rgba(15,42,58,0.06)]'
              }`}
            >
              <span className={`hidden w-fit rounded-full px-2.5 py-1 text-[11px] font-bold md:inline-block ${i === 0 ? 'bg-white/20 text-on-brand' : 'bg-brand-soft text-brand-ink'}`}>
                {tag}
              </span>
              <Icon className={`h-7 w-7 md:mt-4 md:h-9 md:w-9 ${i === 0 ? 'text-on-brand' : 'text-brand'}`} strokeWidth={2.4} />
              <p className={`mt-2 font-display text-[13px] font-extrabold leading-tight md:mt-3 md:text-xl ${i === 0 ? '' : 'text-[#0F2A3A]'}`}>{t}</p>
              <p className={`mt-1.5 hidden text-sm leading-relaxed md:block ${i === 0 ? 'text-on-brand/85' : 'text-[#33505E]'}`}>{d}</p>
              <span className={`mt-4 hidden items-center gap-1 text-sm font-bold md:inline-flex ${i === 0 ? 'text-on-brand' : 'text-[var(--accent)]'}`}>
                {mn ? 'Багцууд үзэх' : 'See plans'} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Three steps ──────────────────────────────────── */}
      <section className="container mx-auto max-w-7xl px-4 pb-10 md:pb-14">
        <div className="grid items-center gap-4 rounded-3xl bg-brand-soft p-4 md:grid-cols-[230px_1fr] md:gap-8 md:p-8">
          <div className="md:border-r md:border-brand-border md:pr-6">
            <h2 className="text-center font-display text-lg font-extrabold leading-tight text-[#0F2A3A] md:text-left md:text-[28px]">
              {mn ? 'eSIM ашиглах' : 'Use eSIM in'}{' '}
              <span className="text-[var(--accent)] md:block">{mn ? '3 энгийн алхам' : '3 easy steps'}</span>
            </h2>
            <span className="mt-2 hidden h-1 w-20 rounded-full bg-[var(--accent)] md:block" />
          </div>

          <div className="grid grid-cols-3 gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center md:gap-3">
            {steps.map(({ icon: Icon, t, d }, i) => (
              <div key={t} className="contents">
                <div className="flex flex-col items-center gap-2 text-center md:flex-row md:gap-4 md:text-left">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-tint md:h-[72px] md:w-[72px]">
                    <Icon className="h-7 w-7 text-brand-ink md:h-8 md:w-8" strokeWidth={2} />
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-extrabold text-white ring-2 ring-white">
                      {i + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-[12px] font-extrabold leading-tight text-[#0F2A3A] md:text-base">{t}</p>
                    <p className="mt-0.5 hidden text-[13px] leading-snug text-[#33505E] md:block">{d}</p>
                  </div>
                </div>
                {i < steps.length - 1 && <ChevronRight className="hidden h-6 w-6 text-[var(--accent)] md:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
