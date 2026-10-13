import { useEffect, useRef, useState } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useAuth, currentUser } from '@/hooks/use-auth';
import { AuthModal } from '@/components/auth-modal';
import { useListCountryPackages } from '@workspace/api-client-react';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Infinity, Wifi, CheckCircle2, Clock, Database, RefreshCw, Phone, Check, QrCode, Smartphone } from 'lucide-react';

const COMING_SOON_SLUGS = new Set(['russia']);

const COUNTRY_PHOTOS: Record<string, string> = {
  'japan': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
  'china': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=80',
  'south-korea': 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800&q=80',
  'vietnam': 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=800&q=80',
  'turkey': 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&q=80',
  'thailand': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80',
  'singapore': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80',
  'india': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80',
  'france': 'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800&q=80',
  'united-states': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80',
  'usa': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80',
  'united-kingdom': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
  'germany': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&q=80',
  'australia': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80',
  'canada': 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&q=80',
  'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
  'united-arab-emirates': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
  'italy': 'https://images.unsplash.com/photo-1499678329028-101435549a4e?w=800&q=80',
  'spain': 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&q=80',
  'malaysia': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80',
  'indonesia': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
  'philippines': 'https://images.unsplash.com/photo-1559592413-7cbb5d28b9c2?w=800&q=80',
  'taiwan': 'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=800&q=80',
  'hong-kong': 'https://images.unsplash.com/photo-1507941097613-9f2157b69235?w=800&q=80',
  'macau': 'https://images.unsplash.com/photo-1507941097613-9f2157b69235?w=800&q=80',
  'cambodia': 'https://images.unsplash.com/photo-1540614046778-0b1b9a3f4b1e?w=800&q=80',
  'nepal': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',
  'sri-lanka': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  'maldives': 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80',
  'egypt': 'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=800&q=80',
  'greece': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80',
  'portugal': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80',
  'netherlands': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80',
  'switzerland': 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&q=80',
  'austria': 'https://images.unsplash.com/photo-1516550893885-985c836c5ffa?w=800&q=80',
  'russia': 'https://images.unsplash.com/photo-1547448415-e9f5b28e570d?w=800&q=80',
  'brazil': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80',
  'mexico': 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800&q=80',
  'peru': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80',
  'morocco': 'https://images.unsplash.com/photo-1539020140153-e479b8f22986?w=800&q=80',
  'kenya': 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800&q=80',
  'south-africa': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80',
  'new-zealand': 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&q=80',
  'myanmar': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80',
  'laos': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80',
  'bangladesh': 'https://images.unsplash.com/photo-1553786748-0e1d8a4e2e15?w=800&q=80',
  'pakistan': 'https://images.unsplash.com/photo-1565538420870-da08ff96a207?w=800&q=80',
};

function flagEmojiToCode(flag: string): string {
  try {
    return [...flag].map(c => String.fromCharCode(c.codePointAt(0)! - 0x1F1E6 + 65)).join('').toLowerCase();
  } catch { return ''; }
}

export default function CountryPackages() {
  const [, params] = useRoute('/countries/:slug');
  const slug = params?.slug || '';
  const { t, lang } = useLanguage();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  // Remembers that the customer pressed "buy" while signed out, so the sign-in
  // that follows continues to checkout instead of dropping them back here.
  const wantsCheckoutRef = useRef(false);

  const { data, isLoading } = useListCountryPackages(slug, {
    query: { queryKey: ['listCountryPackages', slug], enabled: !!slug }
  });

  const country = data?.country;
  const packages = data?.packages || [];
  const selectedPkg = packages.find(p => p.id === selected);

  function goToCheckout() {
    if (!selectedPkg || !country) return;
    sessionStorage.setItem('checkout_pkg', JSON.stringify({
      id: selectedPkg.id,
      packageId: selectedPkg.packageId,
      name: selectedPkg.name,
      validity: selectedPkg.validity,
      // "Unlimited" or "1 GB": most destinations sell capped plans.
      dataLabel: selectedPkg.isUnlimited ? 'Unlimited' : selectedPkg.data,
      priceInMnt: selectedPkg.priceInMnt,
      countrySlug: slug,
      countryName: lang === 'mn' ? country.nameMn : country.name,
    }));
    setLocation(`/checkout/${selectedPkg.id}`);
  }

  // Key off the user transition rather than the modal's onClose: Firebase can
  // notify onAuthStateChanged either side of the promise that closes the modal,
  // so the close alone does not tell us whether sign-in actually succeeded.
  useEffect(() => {
    if (!user || !wantsCheckoutRef.current) return;
    wantsCheckoutRef.current = false;
    setAuthOpen(false);
    goToCheckout();
  }, [user, selectedPkg, country]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto pb-32">
        <div className="h-48 bg-secondary animate-pulse" />
        <div className="px-4 pt-5">
          <div className="h-8 w-40 bg-secondary animate-pulse rounded mb-2" />
          <div className="h-4 w-24 bg-secondary animate-pulse rounded mb-6" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-secondary animate-pulse rounded-2xl mb-3" />
          ))}
        </div>
      </div>
    );
  }

  if (!country) return null;

  return (
    <div className="max-w-2xl mx-auto pb-36">

      {/* Hero banner */}
      <div className="relative w-full h-48 md:h-56 flex items-end justify-center overflow-hidden bg-[#1a1a1b]">
        {/* Country scenic photo */}
        {/* Curated destinations have their own photo; the rest share the
            landing's sky so the banner is never an empty dark box. */}
        {(
          <img
            src={COUNTRY_PHOTOS[slug] ?? `${import.meta.env.BASE_URL}images/brand/hero-desktop.webp`}
            alt={country.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#3A0306]/85 via-black/20 to-black/10" />

        {/* Flag badge bottom center */}
        {(() => {
          const code = flagEmojiToCode(country.flag);
          return code ? (
            <div className="relative mb-4 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
              <img
                src={`https://flagcdn.com/w40/${code}.png`}
                alt={country.name}
                className="w-6 h-4 object-cover rounded-sm"
              />
              <span className="text-white text-sm font-semibold">
                {lang === 'mn' ? country.nameMn : country.name}
              </span>
            </div>
          ) : null;
        })()}

        {/* Back button */}
        <Link href="/" className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('home')}
        </Link>
      </div>

      {/* Country info */}
      <div className="px-4 pt-5 pb-4 border-b border-border/40">
        <h1 className="text-2xl font-extrabold text-foreground">
          {lang === 'mn' ? country.nameMn : country.name}
        </h1>
        <div className="flex items-center gap-1.5 mt-1">
          <Wifi className="w-3.5 h-3.5 text-foreground stroke-[2]" />
          <span className="text-foreground text-xs font-bold">Airalo eSIM</span>
          <span className="text-muted-foreground text-xs">· {packages.length} {lang === 'mn' ? 'багц' : 'plans'}</span>
        </div>
        <p className="text-muted-foreground/60 text-xs mt-1.5">
          200+ {lang === 'mn' ? 'Улс орон · Дэлхийн бүх цэгт' : 'Countries · Worldwide Coverage'}
        </p>
      </div>

      {/* Plan list */}
      <div className="px-4 pt-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
          {lang === 'mn' ? 'Багц сонгох' : 'Select a plan'}
        </p>

        {COMING_SOON_SLUGS.has(slug) ? (
          <div className="flex flex-col items-center justify-center py-16 bg-secondary/20 rounded-2xl border border-border/50 gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-soft border border-brand-border flex items-center justify-center">
              <Clock className="w-8 h-8 text-foreground" />
            </div>
            <div className="text-center px-4">
              <p className="text-lg font-extrabold text-foreground mb-1">
                {lang === 'mn' ? 'Тун удахгүй...' : 'Coming Soon'}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {lang === 'mn'
                  ? 'Оросын eSIM багцууд бэлтгэгдэж байна. Удахгүй нэмэгдэнэ!'
                  : 'Russia eSIM packages are being prepared. Stay tuned!'}
              </p>
            </div>
            <Link href="/">
              <button className="mt-2 px-6 py-2.5 rounded-full border border-brand text-foreground font-semibold text-sm hover:bg-brand-soft transition-all">
                {lang === 'mn' ? 'Буцах' : 'Go Back'}
              </button>
            </Link>
          </div>
        ) : packages.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {packages.map((pkg) => {
              const isSelected = selected === pkg.id;
              return (
                <button
                  key={pkg.id}
                  onClick={() => setSelected(pkg.id)}
                  className={`relative w-full overflow-hidden rounded-2xl bg-white text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'ring-2 ring-brand shadow-[0_10px_24px_color-mix(in_srgb,var(--brand)_22%,transparent)]'
                      : 'ring-1 ring-black/[0.07] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]'
                  }`}
                >
                  {/* Data band: red for Unlimited, the shop's one big promise;
                      ink for capped plans. */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide ${
                    pkg.isUnlimited ? 'bg-brand text-on-brand' : 'bg-[#1F1F1F] text-white'
                  }`}>
                    {pkg.isUnlimited
                      ? <><Infinity className="h-3.5 w-3.5 stroke-[3]" /> {lang === 'mn' ? 'Хязгааргүй' : 'Unlimited'}</>
                      : <><Database className="h-3 w-3" /> {pkg.data}</>}
                  </div>

                  {isSelected && (
                    <span className="absolute right-2 top-9 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-on-brand">
                      <Check className="h-3 w-3 stroke-[3.5]" />
                    </span>
                  )}

                  <div className="flex flex-col gap-1.5 p-3">
                    <div>
                      <span className="font-display text-2xl font-extrabold leading-none text-foreground">
                        {pkg.validity}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        {lang === 'mn' ? 'хоног' : 'days'}
                      </span>
                    </div>

                    {/* Network and perks as quiet grey chips. */}
                    {(() => {
                      const perks = pkg as { rechargeable?: boolean; voice?: number; sms?: number };
                      const chip = 'inline-flex items-center gap-1 rounded-md bg-[#F2F2F2] px-1.5 py-0.5 text-[10px] font-medium text-[#555]';
                      return (
                        <div className="flex flex-wrap gap-1">
                          {pkg.networkType && <span className={chip}><Wifi className="h-2.5 w-2.5" /> {pkg.networkType}</span>}
                          {perks.rechargeable && <span className={chip}><RefreshCw className="h-2.5 w-2.5" /> {lang === 'mn' ? 'Цэнэглэдэг' : 'Top-up'}</span>}
                          {perks.voice != null && perks.voice > 0 && <span className={chip}><Phone className="h-2.5 w-2.5" /> {lang === 'mn' ? 'Дугаартай' : 'Voice+SMS'}</span>}
                        </div>
                      );
                    })()}

                    <p className="mt-1 text-base font-extrabold leading-tight text-brand">
                      {formatCurrency(pkg.priceInMnt)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-secondary/20 rounded-2xl border border-border/50">
            <p className="text-muted-foreground text-sm">{t('no_packages')}</p>
          </div>
        )}
      </div>

      {/* QR in profile info banner */}
      <div className="mx-4 mt-5 flex items-start gap-3 bg-brand-soft border border-brand-border rounded-2xl px-4 py-3.5">
        <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
        <div>
          <p className="text-xs font-bold text-foreground mb-0.5">
            {lang === 'mn' ? 'eSIM-ийн QR код Profile дээр бэлэн болно' : 'eSIM QR code ready in your Profile'}
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {lang === 'mn'
              ? 'Төлбөр хийсний дараа таны eSIM-ийн QR код Profile хэсэгт шууд бэлэн болно'
              : 'After payment, your eSIM QR code will be instantly available in your Profile'}
          </p>
        </div>
      </div>

      {/* eSIM compatibility hint */}
      <div className="mx-4 mt-3 mb-2 flex items-start gap-3 bg-white border border-border rounded-2xl px-4 py-3.5">
        <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
        <div>
          <p className="text-xs font-semibold text-foreground mb-0.5">
            {lang === 'mn' ? 'Таны утас eSIM дэмждэг эсэхийг шалгаарай' : 'Check if your phone supports eSIM'}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {lang === 'mn'
              ? <>Утсандаа <span className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">*#06#</span> гэж залгаад EID дугаар харагдвал таны утас eSIM дэмждэг.</>
              : <>Dial <span className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">*#06#</span> — if you see an EID number, your phone supports eSIM.</>
            }
          </p>
        </div>
      </div>

      {/* Sticky bottom buy bar */}
      {!COMING_SOON_SLUGS.has(slug) && <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-md px-4 py-3 max-w-2xl mx-auto">
        {selectedPkg ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">
                {selectedPkg.validity} {lang === 'mn' ? 'хоног' : 'days'} · {selectedPkg.isUnlimited ? 'Unlimited' : selectedPkg.data}
              </p>
              <p className="font-extrabold text-foreground text-lg leading-tight">
                {formatCurrency(selectedPkg.priceInMnt)}
              </p>
            </div>
            <button
              onClick={() => {
                // The order needs a phone or email to reach the customer, and
                // both come from the signed-in account — ask now rather than
                // letting checkout fail at the payment step.
                if (!user) {
                  wantsCheckoutRef.current = true;
                  setAuthOpen(true);
                  return;
                }
                goToCheckout();
              }}
              className="bg-primary text-primary-foreground font-bold text-sm px-8 py-3.5 rounded-2xl hover:bg-brand-hover active:scale-95 transition-all"
            >
              {lang === 'mn' ? 'Худалдан авах' : 'Buy Now'}
            </button>
          </div>
        ) : (
          <button
            disabled
            className="w-full py-3.5 rounded-2xl bg-secondary text-muted-foreground font-bold text-sm cursor-not-allowed"
          >
            {lang === 'mn' ? 'Багц сонгоно уу' : 'Select a plan'}
          </button>
        )}
      </div>}

      {authOpen && (
        <AuthModal
          defaultTab="login"
          onClose={() => {
            setAuthOpen(false);
            // currentUser() is already up to date when the modal closes on a
            // successful sign-in, so this only drops the intent when the
            // customer actually dismissed the dialog.
            if (!currentUser()) wantsCheckoutRef.current = false;
          }}
        />
      )}
    </div>
  );
}
