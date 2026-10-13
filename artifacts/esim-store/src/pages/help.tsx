import { Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { PageHero, Section } from '@/components/info-page';

// Every answer here has to hold for the whole catalogue, not just the
// curated countries: most destinations sell capped data, a few sell plans
// with a phone number, and refunds stop once the eSIM is installed.
const COPY = {
  mn: {
    eyebrow: 'Тусламж',
    title: 'Түгээмэл асуултууд',
    lead: 'Хариултаа эндээс олохгүй бол баруун доод булан дахь туслахаас асуугаарай.',
    faqs: [
      { q: 'eSIM гэж юу вэ?', a: 'Утсанд суурилуулсан дижитал SIM. Хуванцар карт хэрэггүй, QR код уншуулаад л суулгана. Үндсэн SIM чинь утсандаа хэвээр үлдэнэ.' },
      { q: 'Миний утас eSIM дэмждэг үү?', a: 'Утсандаа *#06# гэж залга. EID дугаар харагдвал дэмждэг. Ихэнх iPhone XS-ээс хойшхи, Samsung Galaxy S20-оос хойшхи, Google Pixel 3-аас хойшхи загварууд дэмждэг. Утас оператороор түгжигдээгүй байх ёстой.' },
      { q: 'Хэзээ суулгах вэ?', a: 'Аялахаасаа өмнө, Wi-Fi-тай газар суулга. Багцын хугацаа ихэвчлэн очсон улсдаа сүлжээнд холбогдсон үеэс эхэлдэг тул эрт суулгасан ч хугацаа чинь дуусахгүй.' },
      { q: 'QR код хаана гарах вэ?', a: 'Төлбөр орсны дараа Профайл → Миний eSIM хэсэгт гарна. Ихэвчлэн хэдхэн секунд, заримдаа хэдэн минут болдог.' },
      { q: 'Unlimited ба GB багц ямар ялгаатай вэ?', a: 'Unlimited багцад дата хязгааргүй. GB багцад заасан хэмжээний дата байна, дуусвал Профайлаас цэнэглэж болно. Улс бүрт ямар багц байгаа нь өөр өөр.' },
      { q: 'Утасны дугаартай юу?', a: 'Ихэнх багц зөвхөн интернэт. «Дугаартай» тэмдэгтэй багц л дуудлага, мессежтэй. Messenger, WhatsApp, Viber-ээр залгаж болно.' },
      { q: 'Хэрхэн төлөх вэ?', a: 'QPay-ээр. Монголын бүх банкны аппаар QR уншуулж төлнө. Үнэ төгрөгөөр.' },
      { q: 'Буцаалт хийх боломжтой юу?', a: 'eSIM суулгасан эсвэл идэвхжүүлсний дараа буцаалт хийх боломжгүй. Худалдаж авахаасаа өмнө утас чинь eSIM дэмждэг эсэхийг шалгаарай.' },
      { q: 'Нэг eSIM-ийг хэд хэдэн утсанд суулгаж болох уу?', a: 'Үгүй. QR код нэг л удаа уншигдана. eSIM-ийг устгавал дахин суулгах боломжгүй тул бүү устгаарай.' },
    ],
    stillTitle: 'Асуулт үлдсэн үү?',
    stillText: 'Туслах маань 24/7 хариулна. Утасны загвараа хэлбэл суулгах зааврыг алхам алхмаар өгнө.',
    guide: 'Суулгах заавар үзэх',
  },
  en: {
    eyebrow: 'Help',
    title: 'Frequently asked questions',
    lead: "Can't find your answer? Ask the assistant in the bottom-right corner.",
    faqs: [
      { q: 'What is an eSIM?', a: 'A digital SIM built into your phone. No plastic card: scan a QR code and it installs. Your main SIM stays in your phone.' },
      { q: 'Does my phone support eSIM?', a: 'Dial *#06#. If an EID number shows, it does. Most iPhones from the XS, Samsung Galaxy from the S20 and Google Pixel from the 3 onwards support it. The phone must be carrier-unlocked.' },
      { q: 'When should I install it?', a: 'Before you travel, on Wi-Fi. Plans usually start counting when you first connect in your destination, so installing early does not use up your days.' },
      { q: 'Where do I find my QR code?', a: 'Once paid, it appears under Profile → My eSIMs. Usually within seconds, sometimes a few minutes.' },
      { q: 'Unlimited vs GB plans?', a: 'Unlimited plans have no data cap. GB plans include the stated amount; you can top up from your Profile. Which plans exist differs by country.' },
      { q: 'Do I get a phone number?', a: 'Most plans are data only. Plans marked "Voice+SMS" include calls and texts. You can still call over Messenger, WhatsApp or Viber.' },
      { q: 'How do I pay?', a: 'With QPay: scan the QR in any Mongolian banking app. Prices are in tugrik.' },
      { q: 'Can I get a refund?', a: 'Not once the eSIM has been installed or activated. Check that your phone supports eSIM before you buy.' },
      { q: 'Can I install one eSIM on several phones?', a: 'No. The QR code scans once, and a deleted eSIM cannot be reinstalled, so do not delete it.' },
    ],
    stillTitle: 'Still have a question?',
    stillText: 'The assistant answers around the clock. Tell it your phone model and it will walk you through installation.',
    guide: 'See the install guide',
  },
} as const;

export default function Help() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  return (
    <div className="bg-background pb-20">
      <PageHero eyebrow={c.eyebrow} title={c.title} lead={c.lead} />
      <Section>
        <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-white">
          {c.faqs.map(f => (
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-[#111] hover:bg-[#FFFDF5] md:px-6 [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-[#6B6B6B] transition group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-[#333] md:px-6">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>
      <Section>
        <div className="flex flex-col gap-4 rounded-3xl border border-brand-border bg-brand-soft p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand">
              <MessageCircle className="h-5 w-5 text-on-brand" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-[#111]">{c.stillTitle}</h2>
              <p className="mt-1 text-sm text-[#333]">{c.stillText}</p>
            </div>
          </div>
          <Link href="/how-it-works" className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#111] bg-white px-5 py-2.5 text-sm font-semibold text-[#111] hover:bg-[#111] hover:text-white">
            {c.guide}
          </Link>
        </div>
      </Section>
    </div>
  );
}
