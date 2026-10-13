import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Phone, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth, AuthError } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';

interface AuthModalProps {
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

// The phone number is only a username: there is deliberately no SMS step,
// because abroad a Mongolian SIM often can't receive one.

/**
 * "+976 9911-2233", "976 99112233" and "99112233" are one person. Without
 * this each spelling became its own account, and orders made under one were
 * invisible from the others. Returns null for anything that isn't a
 * Mongolian 8-digit number.
 */
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('976')) digits = digits.slice(3);
  return /^\d{8}$/.test(digits) ? digits : null;
}

const loginSchema = z.object({
  phone: z.string().min(8, 'Утасны дугаар оруулна уу'),
  password: z.string().min(1, 'Нууц үг оруулна уу'),
});

const registerSchema = z.object({
  phone: z.string().refine(v => normalizePhone(v) !== null, '8 оронтой утасны дугаар оруулна уу'),
  password: z.string().min(6, 'Хамгийн багадаа 6 тэмдэгт'),
  confirmPassword: z.string().min(1, 'Нууц үг давтана уу'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Нууц үг таарахгүй байна',
  path: ['confirmPassword'],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export function AuthModal({ onClose, defaultTab = 'login' }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { lang } = useLanguage();

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  // The API answers in Mongolian; AuthError.message is shown as is.
  const fail = (err: unknown) => {
    setError(err instanceof AuthError ? err.message : (lang === 'mn' ? 'Алдаа гарлаа. Дахин оролдоно уу.' : 'Something went wrong. Please try again.'));
  };

  const onLogin = async (data: LoginForm) => {
    setError('');
    setLoading(true);
    try {
      await signIn(normalizePhone(data.phone) ?? data.phone.trim(), data.password);
      onClose();
    } catch (err) {
      fail(err);
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setError('');
    setLoading(true);
    try {
      await signUp(normalizePhone(data.phone)!, data.password);
      onClose();
    } catch (err) {
      fail(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-sm bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-border/50">

        {/* Header */}
        <div className="bg-white border-b border-border px-5 pt-5 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-foreground font-bold text-lg leading-tight">
              {tab === 'login'
                ? (lang === 'mn' ? 'Нэвтрэх' : 'Sign In')
                : (lang === 'mn' ? 'Бүртгүүлэх' : 'Create Account')}
            </h2>
            <p className="text-muted-foreground text-xs mt-0.5">
              {lang === 'mn' ? 'Утасны дугаараараа нэвтэрнэ' : 'Sign in with your phone number'}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">

          {/* Phone field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {lang === 'mn' ? 'Утасны дугаар' : 'Phone Number'}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                {...(tab === 'login' ? loginForm.register('phone') : registerForm.register('phone'))}
                type="tel"
                inputMode="numeric"
                placeholder="99001234"
                className="w-full pl-10 pr-4 py-3 bg-card border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            {tab === 'login' && loginForm.formState.errors.phone && (
              <p className="text-xs text-destructive">{loginForm.formState.errors.phone.message}</p>
            )}
            {tab === 'register' && registerForm.formState.errors.phone && (
              <p className="text-xs text-destructive">{registerForm.formState.errors.phone.message}</p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {lang === 'mn' ? 'Нууц үг' : 'Password'}
            </label>
            <div className="relative">
              <input
                {...(tab === 'login' ? loginForm.register('password') : registerForm.register('password'))}
                type={showPass ? 'text' : 'password'}
                placeholder="••••••"
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                className="w-full pl-4 pr-10 py-3 bg-card border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {tab === 'login' && loginForm.formState.errors.password && (
              <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
            )}
            {tab === 'register' && registerForm.formState.errors.password && (
              <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>
            )}
            {tab === 'register' && (
              <p className="text-xs text-muted-foreground">{lang === 'mn' ? 'Хамгийн багадаа 6 тэмдэгт' : 'At least 6 characters'}</p>
            )}
          </div>

          {/* Confirm password (register only) */}
          {tab === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {lang === 'mn' ? 'Нууц үг давтах' : 'Confirm Password'}
              </label>
              <div className="relative">
                <input
                  {...registerForm.register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••"
                  autoComplete="new-password"
                  className="w-full pl-4 pr-10 py-3 bg-card border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {registerForm.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2.5">
              <p className="text-xs text-destructive text-center">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="button"
            onClick={() => {
              if (tab === 'login') loginForm.handleSubmit(onLogin)();
              else registerForm.handleSubmit(onRegister)();
            }}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-hover active:scale-95 transition-all disabled:opacity-60"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {lang === 'mn' ? 'Түр хүлээнэ үү...' : 'Please wait...'}</>
              : tab === 'login'
                ? <><Phone className="w-4 h-4" /> {lang === 'mn' ? 'Нэвтрэх' : 'Sign In'}</>
                : <><Phone className="w-4 h-4" /> {lang === 'mn' ? 'Бүртгүүлэх' : 'Register'}</>
            }
          </button>

          {/* Tab switch */}
          <p className="text-center text-sm text-muted-foreground pb-1">
            {tab === 'login' ? (
              <>
                {lang === 'mn' ? 'Бүртгэлгүй юу? ' : "Don't have an account? "}
                <button
                  onClick={() => { setTab('register'); setError(''); loginForm.reset(); }}
                  className="text-foreground font-semibold hover:underline"
                >
                  {lang === 'mn' ? 'Бүртгүүлэх' : 'Register'}
                </button>
              </>
            ) : (
              <>
                {lang === 'mn' ? 'Бүртгэлтэй юу? ' : 'Already registered? '}
                <button
                  onClick={() => { setTab('login'); setError(''); registerForm.reset(); }}
                  className="text-foreground font-semibold hover:underline"
                >
                  {lang === 'mn' ? 'Нэвтрэх' : 'Sign In'}
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
