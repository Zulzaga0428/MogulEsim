import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/hooks/use-auth';
import { AuthModal } from '@/components/auth-modal';
import { ArrowLeft, CheckCircle2, Loader2, RefreshCw, Wifi, ShieldAlert, Smartphone, Globe, AlertTriangle, LogIn, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { API_BASE } from '@/lib/api';

interface PkgInfo {
  id: string;
  packageId: string;
  name: string;
  validity: number;
  /** Absent in sessions saved before capped plans were sold; those were all Unlimited. */
  dataLabel?: string;
  priceInMnt: number;
  countrySlug: string;
  countryName: string;
}

interface DeepLink {
  name: string;
  description: string;
  logo: string;
  link: string;
}

type Step = 'confirm' | 'payment' | 'success';

function isPhoneBasedEmail(email: string | null | undefined): boolean {
  return !!email && email.includes('@phone.avaesim.store');
}

function getUserPhone(email: string | null | undefined): string {
  if (!email) return '';
  if (isPhoneBasedEmail(email)) return email.split('@')[0];
  return '';
}

function getUserRealEmail(email: string | null | undefined): string {
  if (!email) return '';
  if (isPhoneBasedEmail(email)) return '';
  return email;
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { lang } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  const [authOpen, setAuthOpen] = useState(false);
  const [pkg, setPkg] = useState<PkgInfo | null>(null);
  const [step, setStep] = useState<Step>('confirm');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [invoiceId, setInvoiceId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [deepLinks, setDeepLinks] = useState<DeepLink[]>([]);
  const [checking, setChecking] = useState(false);
  const [esimQrCode, setEsimQrCode] = useState('');
  const [esimIccid, setEsimIccid] = useState('');
  const [esimSlow, setEsimSlow] = useState(false);
  const esimPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phone = getUserPhone(user?.email);
  const realEmail = getUserRealEmail(user?.email);
  const customerName = user?.displayName || phone || realEmail || 'Customer';

  useEffect(() => {
    const raw = sessionStorage.getItem('checkout_pkg');
    if (raw) {
      try { setPkg(JSON.parse(raw)); } catch {}
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (esimPollRef.current) clearInterval(esimPollRef.current);
    };
  }, []);

  async function handleCreateInvoice() {
    if (!pkg) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/qpay/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.packageId,
          customerName,
          ...(phone ? { customerPhone: phone } : {}),
          ...(realEmail ? { customerEmail: realEmail } : {}),
          priceInMnt: pkg.priceInMnt,
          packageName: `${pkg.countryName} ${pkg.validity}D ${pkg.dataLabel ?? 'Unlimited'}`,
          countrySlug: pkg.countrySlug,
        }),
      });
      if (!res.ok) {
        let errMsg = `Server error (${res.status})`;
        try {
          const errBody = await res.json();
          errMsg = errBody.message || errBody.error || errMsg;
        } catch {
          errMsg = await res.text().catch(() => errMsg);
        }
        console.error('[Checkout] QPay create failed:', errMsg);
        throw new Error(errMsg);
      }
      const data = await res.json();
      setInvoiceId(data.invoiceId);
      setOrderId(data.orderId);
      setQrImage(data.qrImage);
      setDeepLinks(data.deepLinks || []);
      if (data.amount && data.amount !== pkg.priceInMnt) {
        setPkg({ ...pkg, priceInMnt: data.amount });
      }
      setStep('payment');
      startPolling(data.invoiceId, data.orderId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Checkout] Error:', msg);
      setError(msg || (lang === 'mn' ? 'Алдаа гарлаа. Дахин оролдоно уу.' : 'Error occurred. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  function startPolling(invId: string, ordId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => checkPaid(invId, ordId), 3000);
  }

  async function checkPaid(invId: string, ordId: string, manual = false) {
    if (manual) setChecking(true);
    try {
      const res = await fetch(`${API_BASE}/qpay/check/${invId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: ordId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.paid) {
        if (pollRef.current) clearInterval(pollRef.current);
        setStep('success');
        startEsimPolling(ordId, invId);
      }
    } catch {}
    finally { if (manual) setChecking(false); }
  }

  function startEsimPolling(ordId: string, invId: string) {
    let attempts = 0;
    esimPollRef.current = setInterval(async () => {
      attempts++;
      // A minute without a QR means Airalo did not answer in time. The server
      // keeps retrying in the background, so say that rather than spinning on.
      if (attempts > 20) {
        clearInterval(esimPollRef.current!);
        setEsimSlow(true);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/orders/${ordId}?invoice=${encodeURIComponent(invId)}`);
        if (!res.ok) return;
        const order = await res.json();
        if (order.esimQrCode) {
          setEsimQrCode(order.esimQrCode);
          setEsimIccid(order.esimIccid || '');
          clearInterval(esimPollRef.current!);
        }
      } catch {}
    }, 3000);
  }

  // Firebase restores the session asynchronously; without this a returning
  // customer would see the sign-in prompt flash on every page refresh.
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 text-foreground animate-spin" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground text-sm">
          {lang === 'mn' ? 'Багц олдсонгүй' : 'Package not found'}
        </p>
        <button onClick={() => setLocation('/')} className="text-foreground text-sm font-semibold">
          {lang === 'mn' ? 'Нүүр хуудас руу буцах' : 'Back to home'}
        </button>
      </div>
    );
  }

  // /checkout/:id is reachable by URL, so stop here rather than at the QPay
  // step: the server derives the customer's phone or email from the account
  // and rejects an order without one.
  //
  // Only gate the confirm step. Once an invoice exists the order is already on
  // the server and both the payment poll and the eSIM poll authenticate with
  // the invoice id, so a session lapsing mid-payment must not tear down a QR
  // the customer may be part-way through paying.
  if (!user && step === 'confirm') {
    return (
      <div className="min-h-screen bg-background px-4 pt-16">
        <div className="max-w-md mx-auto flex flex-col items-center gap-5 text-center">
          <div className="w-16 h-16 rounded-full bg-brand-soft flex items-center justify-center">
            <LogIn className="w-7 h-7 text-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-foreground">
              {lang === 'mn' ? 'Худалдан авахын тулд нэвтэрнэ үү' : 'Sign in to continue'}
            </h2>
            <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">
              {lang === 'mn'
                ? 'eSIM-ийн QR код таны бүртгэлд хадгалагдана. Ингэснээр дараа нь Profile хэсгээс дахин харах боломжтой.'
                : 'Your eSIM QR code is saved to your account, so you can always find it again in your Profile.'}
            </p>
          </div>

          <div className="w-full bg-card border border-border/40 rounded-2xl p-4 flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center shrink-0">
              <Wifi className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm truncate">{pkg.countryName}</p>
              <p className="text-muted-foreground text-xs">
                {pkg.validity} {lang === 'mn' ? 'хоног' : 'days'} · {pkg.dataLabel ?? 'Unlimited'}
              </p>
            </div>
            <p className="font-extrabold text-foreground text-base shrink-0">{formatCurrency(pkg.priceInMnt)}</p>
          </div>

          <button
            onClick={() => setAuthOpen(true)}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-brand-hover active:scale-95 transition-all"
          >
            {lang === 'mn' ? 'Нэвтрэх / Бүртгүүлэх' : 'Sign in / Register'}
          </button>
          <button onClick={() => window.history.back()} className="text-sm text-muted-foreground">
            {lang === 'mn' ? 'Буцах' : 'Go back'}
          </button>
        </div>

        {authOpen && <AuthModal defaultTab="login" onClose={() => setAuthOpen(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => {
            if (step === 'confirm') window.history.back();
            else if (step === 'payment') setStep('confirm');
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="font-bold text-sm">
          {step === 'success'
            ? (lang === 'mn' ? 'Амжилттай!' : 'Success!')
            : step === 'payment'
            ? (lang === 'mn' ? 'QPay Төлбөр' : 'QPay Payment')
            : (lang === 'mn' ? 'Захиалга баталгаажуулах' : 'Confirm Order')}
        </span>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5">

        {/* Package summary card — always visible on confirm + payment */}
        {step !== 'success' && (
          <div className="bg-card border border-brand-border rounded-2xl p-4 mb-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center shrink-0">
              <Wifi className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm truncate">{pkg.countryName}</p>
              <p className="text-muted-foreground text-xs">{pkg.validity} {lang === 'mn' ? 'хоног' : 'days'} · {pkg.dataLabel ?? 'Unlimited'}</p>
            </div>
            <p className="font-extrabold text-foreground text-base shrink-0">{formatCurrency(pkg.priceInMnt)}</p>
          </div>
        )}

        {/* ===== STEP 1: CONFIRM ===== */}
        {step === 'confirm' && (
          <div className="space-y-4">

            {/* eSIM compatibility check — with image */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
                  <p className="font-bold text-sm text-amber-700">
                    {lang === 'mn'
                      ? 'Утас eSIM дэмждэг эсэхийг шалгаарай!'
                      : 'Check if your phone supports eSIM!'}
                  </p>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed mb-3">
                  {lang === 'mn'
                    ? 'eSIM ашиглах боломжтой эсэхийг мэдэхийн тулд утасныхаа нийцтэй эсэхийг шалгана уу.'
                    : 'To check if your phone supports eSIM, verify device compatibility before purchasing.'}
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                  <span className="text-xl">📞</span>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {lang === 'mn' ? 'Хурдан шалгах арга:' : 'Quick check:'}
                    </p>
                    <p className="text-xs text-amber-700 font-mono font-bold mt-0.5">
                      *#06# {lang === 'mn' ? 'дугаарыг залгана уу' : 'dial this number'}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {lang === 'mn'
                        ? 'Дэлгэцэн дээр EID дугаар харагдвал eSIM дэмждэг'
                        : 'If EID number appears on screen, your phone supports eSIM'}
                    </p>
                  </div>
                </div>
              </div>
              {/* EID screenshot */}
              <div className="relative border-t border-amber-200">
                <img
                  src="/eid-check.png"
                  alt="EID check example"
                  className="w-full object-cover rounded-b-2xl"
                  style={{ maxHeight: '140px', objectPosition: 'top' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl flex items-end px-4 pb-3">
                  <p className="text-[11px] text-white/80">
                    {lang === 'mn'
                      ? '↑ ийм байдлаар EID дугаар харагдана'
                      : '↑ EID number will appear like this'}
                  </p>
                </div>
              </div>
            </div>

            {/* Other warnings */}
            <div className="bg-card border border-border/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-brand-soft flex items-center justify-center shrink-0 mt-0.5">
                  <Globe className="w-3 h-3 text-foreground" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {lang === 'mn' ? 'Unlocked утас байх ёстой' : 'Device must be unlocked'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {lang === 'mn'
                      ? 'Operator-lock хийгдсэн утас eSIM ажиллуулахгүй'
                      : 'Carrier-locked devices cannot use eSIM'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-3 h-3 text-destructive" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {lang === 'mn' ? 'Буцаалт хийгдэхгүй' : 'Non-refundable'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {lang === 'mn'
                      ? 'eSIM идэвхжсэний дараа буцаалт хийх боломжгүй'
                      : 'Once activated, eSIM cannot be refunded'}
                  </p>
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-card border border-border/40 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {lang === 'mn' ? 'Захиалгын мэдээлэл' : 'Order Summary'}
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{lang === 'mn' ? 'Багц' : 'Package'}</span>
                <span className="font-semibold text-foreground">{pkg.countryName} · {pkg.validity}D</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{lang === 'mn' ? 'Өгөгдөл' : 'Data'}</span>
                <span className="font-semibold text-foreground">{pkg.dataLabel ?? 'Unlimited'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{lang === 'mn' ? 'Хугацаа' : 'Validity'}</span>
                <span className="font-semibold text-foreground">{pkg.validity} {lang === 'mn' ? 'хоног' : 'days'}</span>
              </div>
              <div className="border-t border-border/40 pt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">{lang === 'mn' ? 'Нийт дүн' : 'Total'}</span>
                <span className="font-extrabold text-foreground text-base">{formatCurrency(pkg.priceInMnt)}</span>
              </div>
            </div>

            {/* Customer info */}
            <div className="bg-card border border-border/40 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center">
                <span className="text-sm">👤</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{lang === 'mn' ? 'Захиалагч' : 'Customer'}</p>
                <p className="text-sm font-semibold text-foreground">{customerName}</p>
              </div>
            </div>

            {/* QR in profile info banner */}
            <div className="bg-brand-soft border border-brand-border rounded-2xl px-4 py-3 flex items-start gap-3">
              <span className="text-xl mt-0.5">✅</span>
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

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
                <p className="text-destructive text-xs">{error}</p>
              </div>
            )}

            <button
              onClick={handleCreateInvoice}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 hover:bg-brand-hover active:scale-95 transition-all disabled:opacity-60 mt-2"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> {lang === 'mn' ? 'Уншиж байна...' : 'Loading...'}</>
                : <><span className="text-xl">📱</span> {lang === 'mn' ? 'QPay-р төлөх' : 'Pay with QPay'}</>
              }
            </button>

            <p className="text-center text-xs text-muted-foreground">
              {lang === 'mn' ? 'Монголын бүх банкны апп-аар төлбөр хийнэ' : 'Pay with any Mongolian bank app'}
            </p>
          </div>
        )}

        {/* ===== STEP 2: PAYMENT ===== */}
        {step === 'payment' && (
          <div className="flex flex-col items-center gap-5">
            <div className="text-center">
              <p className="font-bold text-foreground text-base">
                {lang === 'mn' ? 'QR уншуулж төлнө үү' : 'Scan QR to pay'}
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                {lang === 'mn' ? 'Банкны апп нээгээд QR уншуулна уу' : 'Open your bank app and scan the QR'}
              </p>
            </div>

            {qrImage && (
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <img
                  src={`data:image/png;base64,${qrImage}`}
                  alt="QPay QR"
                  className="w-56 h-56 object-contain"
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground">— {lang === 'mn' ? 'эсвэл банкны апп сонгоно уу' : 'or choose your bank app'} —</p>

            {deepLinks.length > 0 && (
              <div className="grid grid-cols-3 gap-3 w-full">
                {deepLinks.map((dl, i) => (
                  <a
                    key={i}
                    href={dl.link}
                    className="flex flex-col items-center gap-1.5 bg-card border border-border/60 rounded-2xl p-3 active:scale-95 transition-transform"
                  >
                    {dl.logo ? (
                      <img src={dl.logo} alt={dl.name} className="w-10 h-10 rounded-xl object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg">🏦</div>
                    )}
                    <span className="text-[10px] text-center text-muted-foreground leading-tight line-clamp-2">{dl.name}</span>
                  </a>
                ))}
              </div>
            )}

            <div className="w-full border-t border-border/40 pt-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 bg-muted/40 rounded-xl px-4 py-3">
                <Loader2 className="w-4 h-4 text-foreground animate-spin shrink-0" />
                <span className="text-xs text-muted-foreground">
                  {lang === 'mn' ? 'Төлбөрийг хүлээж байна...' : 'Waiting for payment...'}
                </span>
              </div>
              <button
                onClick={() => checkPaid(invoiceId, orderId, true)}
                disabled={checking}
                className="w-full py-3 rounded-xl border border-brand text-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
              >
                {checking
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {lang === 'mn' ? 'Шалгаж байна...' : 'Checking...'}</>
                  : <><RefreshCw className="w-4 h-4" /> {lang === 'mn' ? 'Төлбөр шалгах' : 'Check payment'}</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 3: SUCCESS ===== */}
        {step === 'success' && (
          <div className="flex flex-col items-center gap-5 py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#ECFDF3] flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-[#16A34A]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-foreground">
                {lang === 'mn' ? 'Төлбөр амжилттай!' : 'Payment Successful!'}
              </h2>
              <p className="text-muted-foreground text-xs mt-1">
                {lang === 'mn' ? `Захиалга #${orderId}` : `Order #${orderId}`}
              </p>
            </div>

            {/* eSIM QR Code */}
            <div className="w-full bg-card border border-border/40 rounded-2xl p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                {lang === 'mn' ? 'eSIM суулгах QR код' : 'eSIM Installation QR'}
              </p>
              {esimQrCode ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-white rounded-xl p-3">
                    <img src={esimQrCode} alt="eSIM QR" className="w-48 h-48 object-contain" />
                  </div>
                  {esimIccid && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">ICCID</p>
                      <p className="font-mono text-xs text-foreground mt-0.5 bg-muted px-3 py-1.5 rounded-lg">{esimIccid}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground text-center">
                    {lang === 'mn'
                      ? 'Тохиргоо → eSIM нэмэх → QR уншуулах'
                      : 'Settings → Add eSIM → Scan QR code'}
                  </p>
                </div>
              ) : esimSlow ? (
                <div className="flex flex-col items-center gap-2.5 py-5 px-1">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-700" />
                  </div>
                  <p className="text-xs font-bold text-foreground">
                    {lang === 'mn' ? 'eSIM бэлдэхэд удаж байна' : 'Your eSIM is taking longer than usual'}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {lang === 'mn'
                      ? 'Таны төлбөр амжилттай хийгдсэн. Систем eSIM-ийг тань үргэлжлүүлэн бэлдэж байгаа тул Profile хэсгээс хэдхэн минутын дараа шалгаарай.'
                      : 'Your payment went through. We are still preparing your eSIM — check your Profile again in a few minutes.'}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">
                    {lang === 'mn' ? `Захиалгын дугаар: #${orderId}` : `Order number: #${orderId}`}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6">
                  <Loader2 className="w-6 h-6 text-foreground animate-spin" />
                  <p className="text-xs text-muted-foreground">
                    {lang === 'mn' ? 'eSIM бэлдэж байна...' : 'Preparing your eSIM...'}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    {lang === 'mn' ? 'Хэдэн секунд хүлээнэ үү' : 'This takes a few seconds'}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-card border border-border/40 rounded-2xl p-4 w-full text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{lang === 'mn' ? 'Багц' : 'Package'}</span>
                <span className="font-bold text-foreground">{pkg.countryName} · {pkg.validity}D</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{lang === 'mn' ? 'Үнэ' : 'Amount'}</span>
                <span className="font-extrabold text-foreground">{formatCurrency(pkg.priceInMnt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{lang === 'mn' ? 'Захиалагч' : 'Customer'}</span>
                <span className="font-bold text-foreground">{customerName}</span>
              </div>
            </div>

            <button
              onClick={() => { sessionStorage.removeItem('checkout_pkg'); setLocation('/profile'); }}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-brand-hover active:scale-95 transition-all"
            >
              {lang === 'mn' ? 'Миний захиалгууд харах' : 'View My Orders'}
            </button>
            <button
              onClick={() => { sessionStorage.removeItem('checkout_pkg'); setLocation('/'); }}
              className="text-sm text-muted-foreground"
            >
              {lang === 'mn' ? 'Нүүр хуудас руу буцах' : 'Back to Home'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
