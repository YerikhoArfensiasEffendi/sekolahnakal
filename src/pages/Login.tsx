import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { isValidEmail, isRequired } from '@/utils/validation';
import { DISCORD_BOT_INVITE_URL, TELEGRAM_INVITE_URL } from '@/utils/tier';
import { IconDiscord, IconTelegram } from '@/components/icons';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    const emailErr = isRequired(email, 'Email') ?? (!isValidEmail(email) ? 'Email tidak valid' : null);
    const passErr = isRequired(password, 'Password');
    if (emailErr) errors.email = emailErr;
    if (passErr) errors.password = passErr;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setIsLoading(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? 'Terjadi kesalahan';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Sign In</h1>

      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-error/10 p-3 text-sm text-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          autoComplete="email"
          placeholder="demo@sekolahnakal.com"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          autoComplete="current-password"
          placeholder="••••••••"
        />

        <div className="flex items-center justify-between">
          <Link to="/forgot-password" className="text-sm text-brand hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full">
          Sign In
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-text-muted">
        Belum punya akun?{' '}
        <Link to="/register" className="text-brand font-bold hover:underline">
          Daftar Sekarang
        </Link>
      </p>

      {/* Informasi Sinkronisasi Discord */}
      <div className="mt-6 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center space-y-1">
        <p className="text-[11px] font-semibold text-zinc-300">
          👑 Punya Role VIP / VVIP di Discord?
        </p>
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          Silakan masuk ke akun terlebih dahulu, lalu hubungkan Discord Anda melalui menu <strong>Pengaturan</strong>.
        </p>
      </div>

      {/* Kontak Tamu (Discord, Tele, Sosmed) */}
      <div className="mt-5 pt-4 border-t border-border/40 space-y-2">
        <p className="text-center text-[10px] font-bold uppercase tracking-wider text-text-muted">
          Bantuan & Komunitas (Tamu)
        </p>
        <div className="grid grid-cols-3 gap-2">
          <a
            href={DISCORD_BOT_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-2 rounded-lg bg-white/5 hover:bg-[#5865F2]/20 border border-white/10 text-zinc-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <IconDiscord className="w-3.5 h-3.5 text-[#5865F2]" />
            <span>Discord</span>
          </a>

          <a
            href={TELEGRAM_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-2 rounded-lg bg-white/5 hover:bg-[#229ED9]/20 border border-white/10 text-zinc-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <IconTelegram className="w-3.5 h-3.5 text-[#229ED9]" />
            <span>Telegram</span>
          </a>

          <a
            href="https://t.me/sekolahnakal"
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-2 rounded-lg bg-white/5 hover:bg-pink-500/20 border border-white/10 text-zinc-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span className="text-xs">🌐</span>
            <span>Sosmed</span>
          </a>
        </div>
      </div>
    </div>
  );
}
