import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Globe, Wifi, ShoppingBag, Compass, ShieldCheck, LogOut, Infinity as InfinityIcon } from 'lucide-react';
import { AuthModal } from '@/components/auth-modal';
import { AiChat } from '@/components/ai-chat';
import { BRAND } from '@/brand';

// The admin key (checked by the server on every admin call) is the real
// gate; the menu entry just appears on a device where it has been entered.
function hasAdminKey() {
  try { return !!localStorage.getItem('ava_admin_key'); } catch { return false; }
}

function getPhone(email?: string | null) {
  if (!email) return '';
  return email.includes('@phone.avaesim.store') ? email.split('@')[0] : email;
}

function UserAvatar({ user }: { user: any }) {
  if (user.photoURL) {
    return (
      <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/30" />
    );
  }
  const initials = (user.displayName || getPhone(user.email) || '?').charAt(0).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/30">
      <span className="text-xs font-bold text-primary">{initials}</span>
    </div>
  );
}

/** Infinity mark + name, as in the design. `light` is for dark backgrounds. */
function Wordmark({ small = false, light = false }: { small?: boolean; light?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <InfinityIcon className={`${small ? 'h-7 w-7' : 'h-9 w-9'} ${light ? 'text-white' : 'text-brand'}`} strokeWidth={2.8} />
      <span className="flex flex-col leading-none">
        <span className={`font-display font-extrabold uppercase tracking-wide ${light ? 'text-white' : 'text-[#111]'} ${small ? 'text-sm' : 'text-base'}`}>
          {BRAND.name}
        </span>
        <span className={`mt-0.5 text-[10px] font-medium ${light ? 'text-white/75' : 'text-[#555]'}`}>{BRAND.tagline}</span>
      </span>
    </span>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang } = useLanguage();
  const [location, setLocation] = useLocation();
  // On the home page the header floats, transparent, over the red hero.
  const overHero = location === '/';
  const { user, loading, signOut } = useAuth();
  const [authModal, setAuthModal] = useState<null | 'login' | 'register'>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleLang = () => setLang(lang === 'mn' ? 'en' : 'mn');

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSignOut() {
    setDropdownOpen(false);
    await signOut();
    setLocation('/');
  }

  function nav(path: string) {
    setDropdownOpen(false);
    setLocation(path);
  }

  // Header on desktop; on the phone the header has no room, so the footer
  // carries the same links.
  const navLinks = [
    { href: '/countries', label: lang === 'mn' ? 'Улсууд' : 'Destinations' },
    { href: '/how-it-works', label: lang === 'mn' ? 'Хэрхэн ажилладаг' : 'How it works' },
    { href: '/about', label: lang === 'mn' ? 'Бидний тухай' : 'About us' },
    { href: '/help', label: lang === 'mn' ? 'Тусламж' : 'Help' },
  ];

  const admin = hasAdminKey();
  const displayName = user?.displayName || getPhone(user?.email) || '';

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10">
      <header className={overHero
        ? 'absolute inset-x-0 top-0 z-50 w-full'
        : 'sticky top-0 z-50 w-full border-b border-black/5 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70'}>
        <div className={`container max-w-7xl mx-auto px-4 flex items-center justify-between ${overHero ? 'h-20 md:px-10' : 'h-16'}`}>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center" aria-label={BRAND.name}>
              <Wordmark light={overHero} />
            </Link>

            <nav className="ml-6 hidden md:flex items-center gap-1">
              {navLinks.map(l => (
                <Link key={l.href} href={l.href} className={`px-3 py-2 text-sm font-medium transition-colors ${overHero ? 'text-white/85 hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className={`flex items-center gap-1 text-xs font-semibold transition-colors px-2 py-1 rounded-md border ${overHero ? 'text-white border-white/40 hover:bg-white/10' : 'text-muted-foreground hover:text-foreground border-border'}`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="uppercase">{lang === 'mn' ? 'MN' : 'EN'}</span>
            </button>

            <Link href="/countries" className={`hidden sm:inline-flex items-center rounded-full px-4 h-9 text-sm font-semibold ${overHero ? 'bg-white text-brand hover:bg-[#FFF5F5]' : 'bg-brand text-on-brand hover:brightness-95'}`}>
              {lang === 'mn' ? 'eSIM авах' : 'Get eSIM'}
            </Link>

            {/* Auth */}
            {!loading && (
              user ? (
                <div ref={dropdownRef} className="relative">
                  {/* Avatar button */}
                  <button
                    onClick={() => setDropdownOpen(v => !v)}
                    className="flex items-center gap-1.5 rounded-full focus:outline-none"
                  >
                    <UserAvatar user={user} />
                  </button>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* Header */}
                      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/40">
                        <UserAvatar user={user} />
                        <div className="flex-1 min-w-0">
                          {displayName && <p className="font-bold text-sm text-foreground truncate">{displayName}</p>}
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="py-1.5">
                        <button onClick={() => nav('/profile')}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors text-left">
                          <Wifi className="w-4 h-4 text-muted-foreground" />
                          Миний eSIM
                        </button>
                        <button onClick={() => nav('/profile')}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors text-left">
                          <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                          Миний захиалгууд
                        </button>
                        <button onClick={() => nav('/countries')}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors text-left text-primary font-medium">
                          <Compass className="w-4 h-4 text-primary" />
                          Аяллын хэрэгслүүд
                        </button>

                        {admin && (
                          <>
                            <div className="mx-3 my-1 border-t border-border/40" />
                            <button onClick={() => nav('/admin')}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors text-left">
                              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                              Админ
                            </button>
                          </>
                        )}

                        <div className="mx-3 my-1 border-t border-border/40" />
                        <button onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/60 transition-colors text-left">
                          <LogOut className="w-4 h-4" />
                          Гарах
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Button size="sm" variant="outline" className={`text-xs px-3 h-8 rounded-full ${overHero ? 'bg-transparent border-white text-white hover:bg-white hover:text-brand' : 'bg-white border-[#111] text-[#111] hover:bg-[#111] hover:text-white'}`} onClick={() => setAuthModal('login')}>
                  {t('login')}
                </Button>
              )
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <AiChat />

      <footer className="bg-[#151515]">
        <div className="container max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-5">
          <Wordmark small light />
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="text-sm text-white/70 hover:text-white">
                {l.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} {BRAND.name}
            <span className="mx-1.5">•</span>
            Built by{' '}
            <a href="https://veio.digital/" target="_blank" rel="noopener" className="font-semibold text-white/80 hover:text-white">
              VEIO
            </a>
          </p>
        </div>
      </footer>

      {authModal && (
        <AuthModal
          defaultTab={authModal}
          onClose={() => setAuthModal(null)}
        />
      )}
    </div>
  );
}
