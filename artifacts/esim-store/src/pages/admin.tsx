import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  ShieldCheck, LogOut, RefreshCw, Loader2,
  ChevronLeft, BarChart2, List, Image as ImageIcon, Upload, Trash2, Wifi, KeyRound
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCountryLookup, FlagImage } from '@/hooks/use-country-lookup';
import { API_BASE } from '@/lib/api';

const ADMIN_KEY_STORAGE = 'ava_admin_key';

function getAdminKey(): string {
  return localStorage.getItem(ADMIN_KEY_STORAGE) ?? '';
}

interface Order {
  id: string;
  packageId: string;
  countrySlug: string;
  customerName: string;
  customerEmail: string;
  status: string;
  totalPrice: number;
  currency: string;
  esimIccid: string | null;
  esimQrCode: string | null;
  qpayInvoiceId: string | null;
  createdAt: string;
}

interface HeroSlide {
  id: number;
  url: string;
  altText: string;
  sortOrder: number;
  active: boolean;
}

function getPhone(email: string) {
  return email?.includes('@phone.avaesim.store') ? email.split('@')[0] : email;
}

/** Flag and Mongolian name for an order's destination, from the live country list. */
function CountryLabel({ slug }: { slug: string }) {
  const info = useCountryLookup()(slug);
  return (
    <span className="inline-flex items-center gap-1.5">
      <FlagImage info={info} className="w-5 h-3.5" />
      {info.nameMn}
    </span>
  );
}

function statusInfo(status: string) {
  if (status === 'completed') return { label: 'Амжилттай', dot: 'bg-[#16A34A]', text: 'text-[#16A34A]' };
  if (status === 'fulfilling') return { label: 'eSIM гаргаж байна', dot: 'bg-indigo-400', text: 'text-indigo-400' };
  if (status === 'paid') return { label: 'Боловсруулж байна', dot: 'bg-blue-400', text: 'text-[#159BD7]' };
  if (status === 'pending') return { label: 'Хүлээгдэж байна', dot: 'bg-yellow-400', text: 'text-yellow-400' };
  return { label: status, dot: 'bg-muted-foreground', text: 'text-muted-foreground' };
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}өдрийн өмнө`;
  if (h > 0) return `${h}цагийн өмнө`;
  if (m > 0) return `${m}мин өмнө`;
  return 'дөнгөж сая';
}

/* ──────────── eSIM Provision Retry Button ──────────── */
function ProvisionButton({ orderId, packageId }: { orderId: string; packageId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  // A top-up recharges the SIM the customer already installed, so it comes back
  // with the existing ICCID and no new QR code.
  const [esimData, setEsimData] = useState<{ iccid: string | null; qrCodeUrl: string | null; topup: boolean } | null>(null);

  async function handleProvision() {
    setState('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/provision`, {
        method: 'POST',
        headers: { 'x-admin-key': getAdminKey() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Provision failed');
      setEsimData({ iccid: data.iccid, qrCodeUrl: data.qrCodeUrl, topup: Boolean(data.topup) });
      setState('success');
    } catch (e: any) {
      setErrorMsg(e.message || 'Алдаа гарлаа');
      setState('error');
    }
  }

  if (state === 'success' && esimData) {
    return (
      <div className="bg-[#ECFDF3] border border-green-500/30 rounded-2xl p-4 space-y-3">
        <p className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wider">
          {esimData.topup ? '✓ Цэнэглэлт амжилттай хийгдлээ!' : '✓ eSIM амжилттай provision хийгдлээ!'}
        </p>
        {esimData.iccid && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">ICCID</p>
            <p className="font-mono text-xs bg-muted rounded-lg px-3 py-2 break-all">{esimData.iccid}</p>
          </div>
        )}
        {esimData.topup && (
          <p className="text-[10px] text-muted-foreground">
            Хуучин SIM дээр нэмэгдсэн тул шинэ QR код гарахгүй — хэрэглэгч суулгасан eSIM-ээ үргэлжлүүлэн ашиглана.
          </p>
        )}
        {esimData.qrCodeUrl && (
          <div className="flex flex-col items-center gap-2">
            <div className="bg-white rounded-xl p-3">
              <img src={esimData.qrCodeUrl} alt="eSIM QR" className="w-40 h-40 object-contain" />
            </div>
            <a href={esimData.qrCodeUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-foreground font-semibold underline">QR код нээх</a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pt-2 pb-2 space-y-2">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
        <p className="text-xs text-amber-700 font-semibold">⚠ Төлбөр хүлээн авсан боловч eSIM provision хийгдээгүй байна</p>
        <p className="text-[10px] text-muted-foreground mt-1">Багц: <span className="font-mono">{packageId}</span></p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Систем минут тутам өөрөө дахин оролддог. Яаралтай биш бол хүлээж болно.
        </p>
      </div>
      <button
        onClick={handleProvision}
        disabled={state === 'loading'}
        className="w-full py-3 rounded-2xl bg-primary hover:bg-brand-hover text-primary-foreground text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {state === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
        {state === 'loading' ? 'eSIM захиалж байна...' : 'eSIM Provision хийх'}
      </button>
      {state === 'error' && (
        <p className="text-xs text-red-400 text-center px-2">{errorMsg}</p>
      )}
    </div>
  );
}

/* ──────────── Order Detail Drawer ──────────── */
function OrderDetail({ order, onBack, onDelete }: { order: Order; onBack: () => void; onDelete: (id: string) => void }) {
  const s = statusInfo(order.status);
  const date = new Date(order.createdAt).toLocaleString('mn-MN');
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${order.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': getAdminKey() },
      });
      if (res.ok) { onDelete(order.id); onBack(); }
    } catch {}
    finally { setDeleting(false); }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-background">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">Захиалга #{order.id}</p>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>
        <span className={`text-xs font-bold ${s.text}`}>{s.label}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Customer */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Захиалагч</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-soft flex items-center justify-center text-lg font-bold text-foreground">
              {getPhone(order.customerEmail).charAt(0)}
            </div>
            <div>
              <p className="font-bold text-sm">{order.customerName}</p>
              <p className="text-xs text-muted-foreground">📞 {getPhone(order.customerEmail)}</p>
            </div>
          </div>
        </div>

        {/* Package */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Захиалгын мэдээлэл</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center">
              <Wifi className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm"><CountryLabel slug={order.countrySlug} /></p>
              <p className="text-xs text-muted-foreground font-mono">{order.packageId}</p>
            </div>
            <p className="font-extrabold text-foreground">{formatCurrency(order.totalPrice)}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-muted/40 rounded-xl px-3 py-2">
              <p className="text-muted-foreground mb-0.5">Статус</p>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                <p className="font-semibold">{s.label}</p>
              </div>
            </div>
            <div className="bg-muted/40 rounded-xl px-3 py-2">
              <p className="text-muted-foreground mb-0.5">QPay Invoice</p>
              <p className="font-mono text-[10px] truncate">{order.qpayInvoiceId || '—'}</p>
            </div>
          </div>
        </div>

        {/* eSIM */}
        {(order.esimIccid || order.esimQrCode) && (
          <div className="bg-card border border-[#BBF7D0] rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wider">eSIM мэдээлэл</p>
            {order.esimIccid && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">ICCID</p>
                <p className="font-mono text-xs bg-muted rounded-lg px-3 py-2 break-all">{order.esimIccid}</p>
              </div>
            )}
            {order.esimQrCode && (
              <div className="flex flex-col items-center gap-2">
                <div className="bg-white rounded-xl p-3">
                  <img src={order.esimQrCode} alt="eSIM QR" className="w-40 h-40 object-contain" />
                </div>
                <a href={order.esimQrCode} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-foreground font-semibold underline">QR код нээх</a>
              </div>
            )}
          </div>
        )}

        {/* eSIM Provision retry — for paid orders without eSIM */}
        {order.status === 'paid' && !order.esimQrCode && (
          <ProvisionButton orderId={order.id} packageId={order.packageId} />
        )}

        {/* Delete — only for pending orders */}
        {order.status === 'pending' && (
          <div className="pt-2 pb-4">
            {confirmDelete ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-bold text-red-400 text-center">Устгахдаа итгэлтэй байна уу?</p>
                <p className="text-xs text-muted-foreground text-center">Захиалга #{order.id} бүрмөсөн устгагдана.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                    Болих
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Устгах
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                className="w-full py-3 rounded-2xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" />
                Захиалга устгах
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────── Order List Row (Gmail style) ──────────── */
function OrderRow({ order, onClick }: { order: Order; onClick: () => void }) {
  const s = statusInfo(order.status);
  const isNew = order.status === 'pending';
  return (
    <button onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-border/30 hover:bg-muted/30 active:bg-muted/50 transition-colors text-left ${isNew ? 'bg-primary/3' : ''}`}>
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-brand-soft flex items-center justify-center shrink-0 mt-0.5">
        <span className="font-bold text-sm text-foreground">{getPhone(order.customerEmail).charAt(0)}</span>
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${isNew ? 'font-bold text-foreground' : 'font-medium text-foreground/90'}`}>
            {getPhone(order.customerEmail)}
          </p>
          <p className="text-[10px] text-muted-foreground shrink-0">{timeAgo(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
          <p className="text-xs text-muted-foreground truncate"><CountryLabel slug={order.countrySlug} /></p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground/70 truncate">{s.label}</p>
          <p className="text-xs font-bold text-foreground shrink-0">{formatCurrency(order.totalPrice)}</p>
        </div>
      </div>
    </button>
  );
}

/* ──────────── Password reset ──────────── */
// Customers have no email or SMS to recover with, so a forgotten password
// comes to us: the customer calls, we set a new one here and tell them.
function PasswordReset() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/admin/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminKey() },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg({ ok: true, text: `${phone} дугаарын нууц үг солигдлоо. Хэрэглэгчид шинэ нууц үгийг хэлээрэй.` });
        setPassword('');
      } else {
        setMsg({ ok: false, text: data.message || data.error || `Алдаа (${res.status})` });
      }
    } catch {
      setMsg({ ok: false, text: 'Сүлжээний алдаа' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-4 py-5 space-y-4">
      <div>
        <p className="font-bold text-sm text-foreground">Нууц үг сэргээх</p>
        <p className="text-xs text-muted-foreground mt-1">Нууц үгээ мартсан хэрэглэгчид шинэ нууц үг тохируулна. Утасны дугаарыг нь заавал баталгаажуулаарай.</p>
      </div>
      <input value={phone} onChange={e => setPhone(e.target.value)} inputMode="numeric" placeholder="Утасны дугаар (99001234)"
        className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-brand" />
      <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Шинэ нууц үг (6+ тэмдэгт)"
        className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-brand" />
      <button onClick={submit} disabled={busy || !phone || password.length < 6}
        className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
        {busy ? 'Түр хүлээнэ үү...' : 'Нууц үг солих'}
      </button>
      {msg && <p className={`text-xs ${msg.ok ? 'text-[#16A34A]' : 'text-destructive'}`}>{msg.text}</p>}
    </div>
  );
}

/* ──────────── Main Admin ──────────── */
export default function Admin() {
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'inbox' | 'stats' | 'hero' | 'users'>('inbox');
  const [filter, setFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cfSlides, setCfSlides] = useState<HeroSlide[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [adminKey, setAdminKey] = useState(getAdminKey());
  const [keyInput, setKeyInput] = useState('');

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/orders`, { headers: { 'x-admin-key': getAdminKey() } });
      if (res.ok) setOrders(await res.json());
      else if (res.status === 401) {
        localStorage.removeItem(ADMIN_KEY_STORAGE);
        setAdminKey('');
      }
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => {
    // The admin key is the gate: the server checks it on every admin call.
    // Customers sign in by phone now, so there is no admin email to match.
    if (adminKey) fetchOrders();
  }, [adminKey]);

  async function fetchCfSlides() {
    try {
      const res = await fetch(`${API_BASE}/admin/hero-images`, { headers: { 'x-admin-key': getAdminKey() } });
      if (res.ok) { const d = await res.json(); setCfSlides(d.slides || []); }
    } catch {}
  }

  async function uploadHeroImage(file: File) {
    setUploading(true); setUploadError('');
    try {
      const form = new FormData();
      form.append('image', file);
      form.append('altText', file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
      const res = await fetch(`${API_BASE}/admin/hero-images/upload`, {
        method: 'POST', headers: { 'x-admin-key': getAdminKey() }, body: form,
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Upload failed'); }
      await fetchCfSlides();
    } catch (e: any) { setUploadError(e.message || 'Upload failed'); }
    finally { setUploading(false); }
  }

  async function deleteHeroSlide(id: number) {
    try {
      await fetch(`${API_BASE}/admin/hero-images/${id}`, {
        method: 'DELETE', headers: { 'x-admin-key': getAdminKey() },
      });
      setCfSlides(s => s.filter(x => x.id !== id));
    } catch {}
  }

  useEffect(() => { if (tab === 'hero' && adminKey) fetchCfSlides(); }, [tab]);

  const stats = {
    total: orders.length,
    completed: orders.filter(o => o.status === 'completed').length,
    revenue: orders.filter(o => ['completed','paid'].includes(o.status)).reduce((s, o) => s + o.totalPrice, 0),
    today: orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length,
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);


  /* ── Admin key entry ── */
  if (!adminKey) return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <form
        className="w-full max-w-xs space-y-3"
        onSubmit={e => {
          e.preventDefault();
          const key = keyInput.trim();
          if (!key) return;
          localStorage.setItem(ADMIN_KEY_STORAGE, key);
          setAdminKey(key);
          setKeyInput('');
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-foreground" />
          <span className="font-bold text-sm">Admin түлхүүр</span>
        </div>
        <input
          type="password"
          value={keyInput}
          onChange={e => setKeyInput(e.target.value)}
          placeholder="ADMIN_SECRET оруулна уу"
          className="w-full px-4 py-3 rounded-2xl bg-card border border-border/60 text-sm text-foreground outline-none focus:border-primary/60"
          autoFocus
        />
        <button
          type="submit"
          className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold hover:bg-brand-hover transition-colors"
        >
          Нэвтрэх
        </button>
      </form>
    </div>
  );

  function handleOrderDeleted(id: string) {
    setOrders(prev => prev.filter(o => o.id !== id));
  }

  /* ── Order detail ── */
  if (selectedOrder) return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col bg-background">
      <OrderDetail
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
        onDelete={handleOrderDeleted}
      />
    </div>
  );

  /* ── Main panel ── */
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col bg-background max-w-lg mx-auto">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background sticky top-16 z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-foreground" />
          <span className="font-bold text-sm">
            {tab === 'inbox' ? `Захиалгууд (${orders.length})` : tab === 'stats' ? 'Статистик' : tab === 'users' ? 'Хэрэглэгч' : 'Hero зураг'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {tab === 'inbox' && (
            <button onClick={fetchOrders} disabled={loading}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          )}
          <button onClick={() => { localStorage.removeItem(ADMIN_KEY_STORAGE); setLocation('/'); }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── INBOX TAB ── */}
      {tab === 'inbox' && (
        <div className="flex flex-col flex-1">
          {/* Filter chips */}
          <div className="flex gap-2 px-4 py-2.5 overflow-x-auto scrollbar-none border-b border-border/30">
            {[
              { key: 'all', label: `Бүгд ${orders.length}` },
              { key: 'completed', label: `✓ Амжилттай ${orders.filter(o=>o.status==='completed').length}` },
              { key: 'paid', label: `⏳ Боловсруулж ${orders.filter(o=>o.status==='paid').length}` },
              { key: 'pending', label: `🕐 Хүлээж ${orders.filter(o=>o.status==='pending').length}` },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all ${filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Order list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-foreground animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <List className="w-6 h-6" />
                </div>
                <p className="text-sm">Захиалга байхгүй байна</p>
              </div>
            ) : (
              filtered.map(order => (
                <OrderRow key={order.id} order={order} onClick={() => setSelectedOrder(order)} />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── STATS TAB ── */}
      {tab === 'stats' && (
        <div className="px-4 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Нийт захиалга', value: stats.total, sub: 'Бүх цаг', color: 'border-border/50', icon: '📦' },
              { label: 'Өнөөдөр', value: stats.today, sub: 'Шинэ захиалга', color: 'border-brand-border', icon: '📅' },
              { label: 'Амжилттай', value: stats.completed, sub: 'eSIM хүргэгдсэн', color: 'border-[#BBF7D0]', icon: '✅' },
              { label: 'Орлого', value: `${(stats.revenue/1000).toFixed(0)}K`, sub: 'MNT нийт', color: 'border-brand-border', icon: '💰' },
            ].map(s => (
              <div key={s.label} className={`bg-card border ${s.color} rounded-2xl p-4`}>
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
                <p className="text-xs font-semibold text-foreground/80 mt-0.5">{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Status breakdown */}
          <div className="bg-card border border-border/50 rounded-2xl p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Статусын хуваарилалт</p>
            {[
              { label: 'Амжилттай', count: orders.filter(o=>o.status==='completed').length, color: 'bg-[#16A34A]' },
              { label: 'Боловсруулж байна', count: orders.filter(o=>o.status==='paid').length, color: 'bg-blue-400' },
              { label: 'Хүлээгдэж байна', count: orders.filter(o=>o.status==='pending').length, color: 'bg-yellow-400' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 mb-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${s.color}`} />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-bold">{s.count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.color}`}
                      style={{ width: stats.total ? `${(s.count / stats.total) * 100}%` : '0%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HERO TAB ── */}
      {tab === 'hero' && (
        <div className="px-4 py-5 space-y-4">
          <p className="text-xs text-muted-foreground">Hero зургуудыг Cloudflare-д хадгалж CDN-ээр хурдан дуудна</p>

          {/* Upload button */}
          <label className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${uploading ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-brand-hover'}`}>
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Зураг upload хийх</>}
            <input type="file" accept="image/*" className="hidden" disabled={uploading}
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadHeroImage(f); e.target.value = ''; }} />
          </label>
          {uploadError && <p className="text-xs text-destructive text-center">{uploadError}</p>}

          {/* Current CF slides */}
          {cfSlides.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Cloudflare-д зураг байхгүй байна</p>
              <p className="mt-1 opacity-60">Дээрх товчоор зураг нэмнэ үү</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cfSlides.map(slide => (
                <div key={slide.id} className="flex items-center gap-3 bg-card border border-border/50 rounded-2xl px-3 py-2.5">
                  <div className="w-14 h-10 rounded-xl overflow-hidden shrink-0 bg-muted">
                    <img src={slide.url} alt={slide.altText} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{slide.altText}</p>
                    <p className="text-[10px] text-muted-foreground truncate">Cloudflare CDN</p>
                  </div>
                  <button onClick={() => deleteHeroSlide(slide.id)}
                    className="text-destructive shrink-0 p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── USERS TAB ── */}
      {tab === 'users' && <PasswordReset />}

      {/* ── Bottom Nav ── */}
      <div className="sticky bottom-0 border-t border-border/50 bg-background/95 backdrop-blur flex">
        {[
          { key: 'inbox', icon: List, label: 'Захиалга', badge: orders.filter(o=>o.status==='pending').length },
          { key: 'stats', icon: BarChart2, label: 'Статистик', badge: 0 },
          { key: 'hero', icon: ImageIcon, label: 'Hero зураг', badge: 0 },
          { key: 'users', icon: KeyRound, label: 'Хэрэглэгч', badge: 0 },
        ].map(({ key, icon: Icon, label, badge }) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 relative transition-colors ${tab === key ? 'text-foreground' : 'text-muted-foreground'}`}>
            <div className="relative">
              <Icon className="w-5 h-5" />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">{badge}</span>
              )}
            </div>
            <span className="text-[10px] font-semibold">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
