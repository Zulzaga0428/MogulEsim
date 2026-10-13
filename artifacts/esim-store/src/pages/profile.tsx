import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { useEffect, useRef, useState } from 'react';
import {
  LogOut, Package, Wifi, ChevronDown, ChevronUp,
  Loader2, Clock, Globe, ArrowRight, Handshake, Gauge, RefreshCw
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCountryLookup, FlagImage } from '@/hooks/use-country-lookup';
import { API_BASE } from '@/lib/api';
import { BRAND } from '@/brand';

interface Order {
  id: string;
  packageId: string;
  countrySlug: string;
  customerName: string;
  status: string;
  totalPrice: number;
  currency: string;
  esimIccid: string | null;
  esimQrCode: string | null;
  createdAt: string;
}

function getPhone(email: string | null | undefined): string {
  if (!email) return '';
  if (email.includes('@phone.avaesim.store')) return email.split('@')[0];
  return email;
}

function getDisplayName(user: any): string {
  if (user?.displayName) return user.displayName;
  return getPhone(user?.email);
}

function getInitials(user: any): string {
  const name = getDisplayName(user);
  return name.charAt(0).toUpperCase();
}

function timeAgo(iso: string, lang: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return lang === 'mn' ? 'Өнөөдөр' : 'Today';
  if (d === 1) return lang === 'mn' ? 'Өчигдөр' : 'Yesterday';
  if (d < 30) return lang === 'mn' ? `${d} өдрийн өмнө` : `${d} days ago`;
  const m = Math.floor(d / 30);
  return lang === 'mn' ? `${m} сарын өмнө` : `${m}mo ago`;
}

interface SimUsage {
  status: string;
  remaining: number;
  total: number;
  expired_at: string | null;
  is_unlimited: boolean;
}

function formatData(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}

function usageStatusLabel(status: string, lang: string): string {
  const s = status.toUpperCase();
  if (s === 'ACTIVE') return lang === 'mn' ? 'Идэвхтэй' : 'Active';
  if (s === 'NOT_ACTIVE') return lang === 'mn' ? 'Идэвхжээгүй' : 'Not activated';
  if (s === 'EXPIRED' || s === 'FINISHED') return lang === 'mn' ? 'Дууссан' : 'Expired';
  return status;
}

function UsageSection({ orderId, lang }: { orderId: string; lang: string }) {
  const { user } = useAuth();
  const [usage, setUsage] = useState<SimUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function fetchUsage() {
    if (!user) return;
    setLoading(true);
    setError(false);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/orders/${orderId}/usage`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setUsage(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (!usage) {
    return (
      <div>
        <button
          onClick={fetchUsage}
          disabled={loading}
          className="w-full py-2.5 rounded-xl border border-brand text-foreground font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
        >
          {loading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {lang === 'mn' ? 'Шалгаж байна...' : 'Checking...'}</>
            : <><Gauge className="w-3.5 h-3.5" /> {lang === 'mn' ? 'Үлдэгдэл дата шалгах' : 'Check remaining data'}</>}
        </button>
        {error && (
          <p className="text-[10px] text-destructive text-center mt-1.5">
            {lang === 'mn' ? 'Мэдээлэл авч чадсангүй, дахин оролдоно уу' : 'Could not fetch usage, try again'}
          </p>
        )}
      </div>
    );
  }

  const unlimited = usage.is_unlimited || usage.total <= 0;
  const pct = unlimited ? 100 : Math.max(0, Math.min(100, (usage.remaining / usage.total) * 100));
  const expiry = usage.expired_at ? new Date(usage.expired_at) : null;
  const daysLeft = expiry ? Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / 86400000)) : null;

  return (
    <div className="bg-muted/40 rounded-xl px-3.5 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {lang === 'mn' ? 'Үлдэгдэл' : 'Remaining'}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-muted-foreground">{usageStatusLabel(usage.status, lang)}</span>
          <button onClick={fetchUsage} disabled={loading} className="text-foreground disabled:opacity-50">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {unlimited ? (
        <p className="text-sm font-extrabold text-foreground">∞ {lang === 'mn' ? 'Хязгааргүй дата' : 'Unlimited data'}</p>
      ) : (
        <>
          <div className="flex justify-between text-xs">
            <span className="font-extrabold text-foreground">{formatData(usage.remaining)}</span>
            <span className="text-muted-foreground">/ {formatData(usage.total)}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${pct > 30 ? 'bg-primary' : pct > 10 ? 'bg-amber-400' : 'bg-red-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      )}

      {expiry && (
        <p className="text-[10px] text-muted-foreground">
          {lang === 'mn'
            ? `Дуусах: ${expiry.toLocaleDateString('mn-MN')}${daysLeft != null ? ` (${daysLeft} хоног үлдсэн)` : ''}`
            : `Expires: ${expiry.toLocaleDateString()}${daysLeft != null ? ` (${daysLeft} days left)` : ''}`}
        </p>
      )}
    </div>
  );
}

interface TopupOption {
  packageId: string;
  title: string;
  data: string;
  validity: number;
  isUnlimited: boolean;
  priceInMnt: number;
}

interface TopupInvoice {
  orderId: string;
  invoiceId: string;
  qrImage: string;
  deepLinks: Array<{ name: string; logo: string; link: string }>;
}

function TopupSection({ orderId, lang }: { orderId: string; lang: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<TopupOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('');
  const [paying, setPaying] = useState(false);
  const [invoice, setInvoice] = useState<TopupInvoice | null>(null);
  const [paid, setPaid] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function openTopups() {
    setOpen(true);
    if (options || !user) return;
    setLoading(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/qpay/topups/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOptions(data.topups || []);
    } catch {
      setError(lang === 'mn' ? 'Цэнэглэлт татаж чадсангүй, дахин оролдоно уу' : 'Could not load topups, try again');
    } finally {
      setLoading(false);
    }
  }

  async function payTopup() {
    if (!user || !selected) return;
    setPaying(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/qpay/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, packageId: selected }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Server error (${res.status})`);
      }
      const data: TopupInvoice = await res.json();
      setInvoice(data);
      pollRef.current = setInterval(async () => {
        try {
          const check = await fetch(`${API_BASE}/qpay/check/${data.invoiceId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderId }),
          });
          if (!check.ok) return;
          const c = await check.json();
          if (c.paid) {
            if (pollRef.current) clearInterval(pollRef.current);
            setPaid(true);
          }
        } catch {}
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : (lang === 'mn' ? 'Алдаа гарлаа' : 'Error occurred'));
    } finally {
      setPaying(false);
    }
  }

  if (paid) {
    return (
      <div className="bg-[#ECFDF3] border border-[#BBF7D0] rounded-xl px-4 py-3 text-center space-y-1">
        <p className="text-sm font-bold text-[#16A34A]">
          ✅ {lang === 'mn' ? 'Цэнэглэлт амжилттай!' : 'Topup successful!'}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {lang === 'mn'
            ? 'Дата хэдэн минутын дотор eSIM дээр чинь нэмэгдэнэ. Шинэ QR уншуулах шаардлагагүй.'
            : 'Data will be added to your eSIM within minutes. No new QR needed.'}
        </p>
      </div>
    );
  }

  if (invoice) {
    return (
      <div className="bg-muted/40 rounded-xl px-4 py-4 space-y-3">
        <p className="text-xs font-bold text-foreground text-center">
          {lang === 'mn' ? 'QR уншуулж төлнө үү' : 'Scan QR to pay'}
        </p>
        <div className="bg-white rounded-xl p-3 w-fit mx-auto">
          <img src={`data:image/png;base64,${invoice.qrImage}`} alt="QPay QR" className="w-44 h-44 object-contain" />
        </div>
        {invoice.deepLinks.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {invoice.deepLinks.map((dl, i) => (
              <a key={i} href={dl.link}
                className="flex flex-col items-center gap-1 bg-card border border-border/60 rounded-xl p-2 active:scale-95 transition-transform">
                {dl.logo
                  ? <img src={dl.logo} alt={dl.name} className="w-8 h-8 rounded-lg object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  : <span className="text-base">🏦</span>}
                <span className="text-[8px] text-center text-muted-foreground leading-tight line-clamp-2">{dl.name}</span>
              </a>
            ))}
          </div>
        )}
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 text-foreground animate-spin" />
          <span className="text-[11px]">{lang === 'mn' ? 'Төлбөрийг хүлээж байна...' : 'Waiting for payment...'}</span>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={openTopups}
        className="w-full py-2.5 rounded-xl bg-brand-soft border border-brand-border text-foreground font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
      >
        <RefreshCw className="w-3.5 h-3.5" /> {lang === 'mn' ? 'Дахин цэнэглэх' : 'Top up'}
      </button>
    );
  }

  return (
    <div className="bg-muted/40 rounded-xl px-3.5 py-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {lang === 'mn' ? 'Цэнэглэлт сонгох' : 'Choose a topup'}
        </p>
        <button onClick={() => setOpen(false)} className="text-[10px] text-muted-foreground font-semibold">
          {lang === 'mn' ? 'Хаах' : 'Close'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 text-foreground animate-spin" />
        </div>
      ) : options && options.length > 0 ? (
        <div className="space-y-1.5">
          {options.map(t => (
            <button
              key={t.packageId}
              onClick={() => setSelected(t.packageId)}
              className={`w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-all ${selected === t.packageId ? 'border-primary bg-brand-soft' : 'border-border/50 bg-card'}`}
            >
              <div>
                <p className="text-xs font-bold text-foreground">
                  {t.validity} {lang === 'mn' ? 'хоног' : 'days'} · {t.isUnlimited ? 'Unlimited' : t.data}
                </p>
              </div>
              <p className="text-xs font-extrabold text-foreground shrink-0">{formatCurrency(t.priceInMnt)}</p>
            </button>
          ))}
        </div>
      ) : options ? (
        <p className="text-[11px] text-muted-foreground text-center py-2">
          {lang === 'mn' ? 'Энэ eSIM-д цэнэглэлт байхгүй байна' : 'No topups available for this eSIM'}
        </p>
      ) : null}

      {error && <p className="text-[10px] text-destructive text-center">{error}</p>}

      {options && options.length > 0 && (
        <button
          onClick={payTopup}
          disabled={!selected || paying}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
        >
          {paying
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {lang === 'mn' ? 'Уншиж байна...' : 'Loading...'}</>
            : <>📱 {lang === 'mn' ? 'QPay-р төлөх' : 'Pay with QPay'}</>}
        </button>
      )}
    </div>
  );
}

function OrderCard({ order, lang }: { order: Order; lang: string }) {
  const [expanded, setExpanded] = useState(false);
  const info = useCountryLookup()(order.countrySlug);
  const country = { label: lang === 'mn' ? info.nameMn : info.name };
  const isActive = order.status === 'completed';
  const isProcessing = order.status === 'paid';
  const isTopup = order.packageId.endsWith('-topup');

  return (
    <div className={`rounded-2xl overflow-hidden border transition-all ${expanded ? 'border-brand-border shadow-lg shadow-primary/5' : 'border-border/50'} bg-card`}>
      <button onClick={() => setExpanded(v => !v)} className="w-full flex items-center gap-3 p-4 text-left">
        {/* Flag */}
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-2xl shrink-0">
          <FlagImage info={info} className="w-7 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm text-foreground">{country.label}</p>
            {isTopup && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#159BD7] bg-[#EAF8FF] rounded-full px-1.5 py-0.5">
                <RefreshCw className="w-2.5 h-2.5" />
                {lang === 'mn' ? 'Цэнэглэлт' : 'Topup'}
              </span>
            )}
            {isActive && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#16A34A] bg-[#ECFDF3] rounded-full px-1.5 py-0.5">
                <span className="w-1 h-1 rounded-full bg-[#16A34A] animate-pulse inline-block mr-0.5" />
                {lang === 'mn' ? 'Идэвхтэй' : 'Active'}
              </span>
            )}
            {isProcessing && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#159BD7] bg-[#EAF8FF] rounded-full px-1.5 py-0.5">
                <Clock className="w-2.5 h-2.5" />
                {lang === 'mn' ? 'Бэлдэж байна' : 'Processing'}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(order.createdAt, lang)}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <p className="font-bold text-foreground text-sm">{formatCurrency(order.totalPrice)}</p>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/30 px-4 pb-5 pt-4 space-y-4 bg-muted/10">
          {order.esimQrCode ? (
            <>
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider self-start">
                  {lang === 'mn' ? 'eSIM QR код' : 'eSIM QR Code'}
                </p>
                <div className="bg-white rounded-2xl p-4 shadow-lg">
                  <img src={order.esimQrCode} alt="eSIM QR" className="w-48 h-48 object-contain" />
                </div>
                <p className="text-xs text-muted-foreground text-center bg-muted/50 rounded-xl px-4 py-2.5">
                  {lang === 'mn'
                    ? '📱 Тохиргоо → Утасны тохиргоо → eSIM нэмэх → QR уншуулах'
                    : '📱 Settings → Cellular → Add eSIM → Scan QR code'}
                </p>
              </div>
              {order.esimIccid && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5 font-semibold uppercase tracking-wider">ICCID</p>
                  <p className="font-mono text-xs bg-muted rounded-xl px-3 py-2.5 text-foreground break-all select-all">{order.esimIccid}</p>
                </div>
              )}
              {isActive && order.esimIccid && <UsageSection orderId={order.id} lang={lang} />}
              {isActive && order.esimIccid && !isTopup && <TopupSection orderId={order.id} lang={lang} />}
            </>
          ) : isProcessing ? (
            <div className="flex items-center gap-3 bg-[#EAF8FF] border border-[#BAE6FD] rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 text-[#159BD7] animate-spin shrink-0" />
              <p className="text-xs text-[#159BD7] font-medium">
                {lang === 'mn' ? 'eSIM бэлдэж байна, удахгүй бэлэн болно...' : 'Your eSIM is being prepared...'}
              </p>
            </div>
          ) : null}

          <p className="text-[10px] text-muted-foreground">
            {lang === 'mn' ? 'Захиалга' : 'Order'} #{order.id}
          </p>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { user, loading, signOut } = useAuth();
  const { lang } = useLanguage();
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(false);

  useEffect(() => {
    if (!loading && !user) setLocation('/login');
  }, [user, loading, setLocation]);

  const fetchOrders = () => {
    if (!user?.email) return;
    setOrdersLoading(true);
    setOrdersError(false);
    user.getIdToken()
      .then(token => fetch(`${API_BASE}/orders`, { headers: { Authorization: `Bearer ${token}` } }))
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setOrders(data); })
      .catch(() => setOrdersError(true))
      .finally(() => setOrdersLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [user?.email]);

  if (loading || !user) return null;

  const handleSignOut = async () => { await signOut(); setLocation('/'); };

  const activeOrders = orders.filter(o => o.status === 'completed');
  const displayName = getDisplayName(user);

  return (
    <div className="min-h-screen bg-background pb-16">

      {/* Hero header */}
      <div className="relative bg-white border-b border-border overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-brand-soft rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-md mx-auto px-5 pt-8 pb-10">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            {user.photoURL ? (
              <img src={user.photoURL} alt={displayName}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-border shadow-lg shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-brand-tint flex items-center justify-center ring-2 ring-brand-border shadow-lg shrink-0">
                <span className="text-2xl font-extrabold text-foreground">{getInitials(user)}</span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="font-extrabold text-lg text-foreground leading-tight truncate">{displayName}</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                <p className="text-xs text-[#16A34A] font-semibold">
                  {lang === 'mn' ? `${BRAND.name} гишүүн` : `${BRAND.name} Member`}
                </p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mt-6">
            {[
              { value: orders.length, label: lang === 'mn' ? 'Нийт' : 'Total', icon: Package },
              { value: activeOrders.length, label: lang === 'mn' ? 'Идэвхтэй' : 'Active', icon: Wifi },
              { value: orders.filter(o => o.status === 'paid').length, label: lang === 'mn' ? 'Бэлдэж байна' : 'Processing', icon: Clock },
            ].map((s) => (
              <div key={s.label} className="bg-background border border-border rounded-xl px-2 py-3 text-center">
                <p className="text-xl font-extrabold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-2 space-y-5 pt-5">

        {/* Orders section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-foreground" />
              {lang === 'mn' ? 'Миний eSIM-ууд' : 'My eSIMs'}
            </h2>
            {orders.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {orders.length}
              </span>
            )}
          </div>

          {ordersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-foreground animate-spin" />
            </div>
          ) : ordersError ? (
            <div className="bg-card border border-border/40 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="font-semibold text-sm text-foreground mb-1">
                {lang === 'mn' ? 'Холбогдох боломжгүй байна' : 'Could not connect'}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {lang === 'mn' ? 'Сервертэй холбогдоход алдаа гарлаа. Дахин оролдоно уу.' : 'Failed to load orders. Please try again.'}
              </p>
              <button onClick={fetchOrders}
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-brand-hover active:scale-95 transition-all">
                {lang === 'mn' ? 'Дахин оролдох' : 'Retry'}
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-card border border-border/40 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">🌏</div>
              <p className="font-semibold text-sm text-foreground mb-1">
                {lang === 'mn' ? 'eSIM байхгүй байна' : 'No eSIMs yet'}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {lang === 'mn' ? 'Аялалдаа зориулсан eSIM-ээ сонгоорой' : 'Choose an eSIM for your next trip'}
              </p>
              <button onClick={() => setLocation('/countries')}
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-brand-hover active:scale-95 transition-all">
                {lang === 'mn' ? 'Багц сонгох' : 'Browse plans'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <OrderCard key={order.id} order={order} lang={lang} />
              ))}
            </div>
          )}
        </div>

        {/* Contact & Partnership */}
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
            <Handshake className="w-4 h-4 text-foreground" />
            <h3 className="font-bold text-sm text-foreground">
              {lang === 'mn' ? 'Холбоо барих · Хамтран ажиллах' : 'Contact · Partnership'}
            </h3>
          </div>

          {/* Social links go here once GoTravel has its own pages. */}

          {/* Partnership CTA */}
          <div className="mx-4 mb-4 bg-brand-soft border border-brand-border rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-foreground mb-0.5">
              {lang === 'mn' ? '🤝 Аяллын агентлагуудад' : '🤝 For Travel Agencies'}
            </p>
            <p className="text-xs text-muted-foreground">
              {lang === 'mn'
                ? 'Тусгай үнэ болон бөөний захиалгын нөхцлийн талаар холбоо барина уу'
                : 'Contact us for special pricing and bulk order arrangements'}
            </p>
          </div>
        </div>

        {/* Sign out */}
        <button onClick={handleSignOut}
          className="w-full py-3.5 rounded-2xl border border-border/50 text-muted-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:border-destructive/40 hover:text-destructive hover:bg-destructive/5 active:scale-95 transition-all">
          <LogOut className="w-4 h-4" />
          {lang === 'mn' ? 'Гарах' : 'Sign Out'}
        </button>
      </div>
    </div>
  );
}
