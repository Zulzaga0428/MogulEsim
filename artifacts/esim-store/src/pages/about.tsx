import { Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { Globe, Wallet, Headphones, Handshake, ArrowRight } from 'lucide-react';
import { PageHero, Section } from '@/components/info-page';
import { BRAND } from '@/brand';

// Only claims that are true today. The travel-partner line is phrased as an
// invitation, not as partnerships that already exist.
const COPY = {
  mn: {
    eyebrow: 'Бидний тухай',
    title: 'Монгол аялагчдад зориулсан eSIM',
    lead: `${BRAND.name} бол гадаад руу аялж буй монголчуудад очсон газраа шууд, хямд интернэттэй байх боломж олгох аяллын платформ.`,
    points: [
      { icon: Globe, title: '200+ улс', text: 'Дэлхийн тэргүүлэгч eSIM сүлжээ Airalo-гоор дамжуулан 200 гаруй улс, бүс нутагт холбогдоно.' },
      { icon: Wallet, title: 'Төгрөгөөр, QPay-ээр', text: 'Гадаад карт хэрэггүй. Үнэ төгрөгөөр, төлбөр QPay-ээр, QR код шууд.' },
      { icon: Headphones, title: 'Монголоор тусална', text: 'Туслах маань 24/7 монголоор хариулж, утас бүрт суулгах заавар өгнө.' },
    ],
    partnerTitle: 'Аяллын компаниудтай хамтарна',
    partnerText: 'Аяллын агентлаг, тур операторуудад тусгай үнэ болон бөөний захиалгын нөхцөл санал болгоно.',
    cta: 'Улсаа сонгох',
  },
  en: {
    eyebrow: 'About us',
    title: 'eSIM made for Mongolian travellers',
    lead: `${BRAND.name} is a travel platform that gets Mongolians online the moment they land abroad, at a fair price.`,
    points: [
      { icon: Globe, title: '200+ countries', text: 'Connect in over 200 countries and regions through Airalo, a leading global eSIM network.' },
      { icon: Wallet, title: 'Tugrik and QPay', text: 'No foreign card needed. Prices in tugrik, payment by QPay, QR code instantly.' },
      { icon: Headphones, title: 'Help in Mongolian', text: 'Our assistant answers around the clock in Mongolian, with install steps for your phone.' },
    ],
    partnerTitle: 'Working with travel companies',
    partnerText: 'We offer special pricing and bulk terms to travel agencies and tour operators.',
    cta: 'Choose a destination',
  },
} as const;

export default function About() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  return (
    <div className="bg-background pb-20">
      <PageHero eyebrow={c.eyebrow} title={c.title} lead={c.lead} />
      <Section>
        <div className="grid gap-4 md:grid-cols-3">
          {c.points.map(p => (
            <div key={p.title} className="rounded-3xl border border-border bg-white p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand">
                <p.icon className="h-6 w-6 text-on-brand" />
              </span>
              <h2 className="mt-5 font-display text-lg font-bold text-[#111]">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#6B6B6B]">{p.text}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section>
        <div className="flex gap-4 rounded-3xl border border-border bg-white p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft">
            <Handshake className="h-5 w-5 text-[#111]" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-[#111]">{c.partnerTitle}</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#333]">{c.partnerText}</p>
          </div>
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
