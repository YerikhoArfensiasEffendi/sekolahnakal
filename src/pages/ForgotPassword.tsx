import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { isValidEmail, isRequired } from '@/utils/validation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err = isRequired(email, 'Email') ?? (!isValidEmail(email) ? 'Email tidak valid' : null);
    if (err) {
      setFieldError(err);
      return;
    }
    setFieldError(undefined);
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
    } catch {
      // Always show success to prevent email enumeration
    } finally {
      setIsLoading(false);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="text-center">
        <div className="mb-4 text-4xl">📧</div>
        <h1 className="mb-2 text-xl font-bold text-text-primary">Check your email</h1>
        <p className="text-sm text-text-secondary">
          Jika email terdaftar, link reset password telah dikirim.
        </p>
        <Link to="/login" className="mt-4 inline-block text-sm text-brand hover:underline">
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-text-primary">Forgot Password</h1>
      <p className="mb-6 text-sm text-text-secondary">
        Masukkan email Anda untuk menerima link reset password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError}
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Button type="submit" isLoading={isLoading} className="w-full">
          Send Reset Link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        <Link to="/login" className="text-brand hover:underline">
          Back to Sign In
        </Link>
      </p>
    </div>
  );
}
