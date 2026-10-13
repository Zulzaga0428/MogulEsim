import { Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { Search, Wallet, QrCode, PlaneLanding, ArrowRight, Smartphone } from 'lucide-react';
import { PageHero, Section } from '@/components/info-page';
import { BRAND } from '@/brand';

const COPY = {
  mn: {
    eyebrow: 'Хэрхэн ажилладаг',
    title: 'Дөрвөн алхамд интернэттэй',
    lead: 'SIM карт солихгүй, дэлгүүр хайхгүй. Утсандаа eSIM суулгаад очсон газраа шууд холбогдоно.',
    steps: [
      { icon: Search, title: 'Улсаа сонго', text: 'Очих улсаа хайж, хоног болон датаны хэмжээгээр багцаа сонгоно.' },
      { icon: Wallet, title: 'QPay-ээр төл', text: 'Банкны аппаараа QR уншуулаад төлнө. Бүх банк дэмжигдэнэ.' },
      { icon: QrCode, title: 'QR кодоо ав', text: 'Төлбөр орсны дараа eSIM-ийн QR код Профайл хэсэгт шууд гарна.' },
      { icon: PlaneLanding, title: 'Очоод асаа', text: 'Аялахаасаа өмнө суулгаад, очсон газраа eSIM-ээ асаахад л болно.' },
    ],
    installTitle: 'eSIM суулгах заавар',
    installLead: 'Wi-Fi-тай газар, аялахаасаа өмнө суулгахыг зөвлөж байна. QR кодыг нэг л удаа уншуулна.',
    iphone: {
      title: 'iPhone',
      steps: [
        'Тохиргоо → Үүрэн холбоо (Cellular) → eSIM нэмэх',
        '«QR код ашиглах» гэж сонгоод Профайл дахь QR-ыг уншуулна',
        `Шинэ шугамд «${BRAND.name}» гэх мэт нэр өгнө`,
        'Очсон газраа тэр шугамын Data Roaming-ийг асаана',
      ],
    },
    android: {
      title: 'Android (Samsung, Pixel)',
      steps: [
        'Тохиргоо → Холболт → SIM менежер → eSIM нэмэх',
        '«QR код уншуулах» гэж сонгоод Профайл дахь QR-ыг уншуулна',
        'Шинэ eSIM-ээ идэвхжүүлнэ',
        'Очсон газраа тэр eSIM-ийн Data Roaming-ийг асаана',
      ],
    },
    checkTitle: 'Утас маань eSIM дэмждэг үү?',
    checkText: 'Утсандаа *#06# гэж залгаарай. EID гэсэн дугаар харагдвал таны утас eSIM дэмждэг. Утас оператороор түгжигдээгүй (unlocked) байх ёстой.',
    cta: 'Улсаа сонгох',
  },
  en: {
    eyebrow: 'How it works',
    title: 'Online in four steps',
    lead: 'No SIM swaps, no hunting for a shop. Install an eSIM on your phone and connect the moment you land.',
    steps: [
      { icon: Search, title: 'Pick a destination', text: 'Search where you are going and choose a plan by days and data.' },
      { icon: Wallet, title: 'Pay with QPay', text: 'Scan the QR with your banking app. Every Mongolian bank works.' },
      { icon: QrCode, title: 'Get your QR', text: 'Once paid, your eSIM QR code appears in your Profile right away.' },
      { icon: PlaneLanding, title: 'Switch it on', text: 'Install before you fly and turn the eSIM on when you arrive.' },
    ],
    installTitle: 'Installing your eSIM',
    installLead: 'Install it before you travel, on Wi-Fi. The QR code can be scanned only once.',
    iphone: {
      title: 'iPhone',
      steps: [
        'Settings → Cellular → Add eSIM',
        'Choose "Use QR Code" and scan the QR from your Profile',
        `Give the new line a label, e.g. "${BRAND.name}"`,
        'On arrival, turn on Data Roaming for that line',
      ],
    },
    android: {
      title: 'Android (Samsung, Pixel)',
      steps: [
        'Settings → Connections → SIM manager → Add eSIM',
        'Choose "Scan QR code" and scan the QR from your Profile',
        'Turn the new eSIM on',
        'On arrival, turn on Data Roaming for that eSIM',
      ],
    },
    checkTitle: 'Does my phone support eSIM?',
    checkText: 'Dial *#06#. If you see an EID number, your phone supports eSIM. It must also be carrier-unlocked.',
    cta: 'Choose a destination',
  },
} as const;

function InstallCard({ title, steps }: { title: string; steps: readonly string[] }) {
  return (
    <div className="rounded-3xl border border-border bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft">
          <Smartphone className="h-5 w-5 text-[#111]" />
        </span>
        <h3 className="font-display text-lg font-bold text-[#111]">{title}</h3>
      </div>
      <ol className="mt-5 space-y-3">
        {steps.map((s, i) => (
          <li key={s} className="flex gap-3 text-sm leading-relaxed text-[#333]">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#111] text-xs font-bold text-white">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function HowItWorks() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  return (
    <div className="bg-background pb-20">
      <PageHero eyebrow={c.eyebrow} title={c.title} lead={c.lead} />

      <Section>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.steps.map((s, i) => (
            <li key={s.title} className="relative rounded-3xl border border-border bg-white p-6">
              <span className="absolute right-5 top-5 font-display text-4xl font-extrabold text-[#F2EEDC]">{i + 1}</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand">
                <s.icon className="h-6 w-6 text-on-brand" />
              </span>
              <h2 className="mt-5 font-display text-lg font-bold text-[#111]">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#6B6B6B]">{s.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title={c.installTitle} lead={c.installLead}>
        <div className="grid gap-4 md:grid-cols-2">
          <InstallCard {...c.iphone} />
          <InstallCard {...c.android} />
        </div>
        <div className="mt-4 rounded-3xl border border-brand-border bg-brand-soft p-6">
          <h3 className="font-display text-base font-bold text-[#111]">{c.checkTitle}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#333]">{c.checkText}</p>
        </div>
      </Section>

      <div className="mt-4 flex justify-center">
        <Link href="/countries" className="inline-flex items-center gap-3 rounded-full bg-brand px-8 py-3.5 font-semibold text-on-brand transition hover:bg-brand-hover">
          {c.cta}
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
