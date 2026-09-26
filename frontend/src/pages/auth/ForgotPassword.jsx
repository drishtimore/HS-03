import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Search, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  return (
    <main
      className="min-h-[80vh] flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--color-quelle-offwhite)' }}
    >
      <div className="max-w-md w-full animate-fade-in-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="icon-chip icon-chip-yellow flex items-center justify-center">
            <Search size={22} strokeWidth={3} />
          </div>
          <span
            className="text-2xl"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
          >
            Quelle
          </span>
        </div>

        <div
          className="p-8"
          style={{
            border: '2.5px solid var(--color-quelle-ink)',
            borderRadius: 'var(--radius-brutal-lg)',
            boxShadow: 'var(--shadow-brutal)',
            background: 'white',
          }}
        >
          <h1
            className="text-2xl text-center mb-2"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
          >
            Reset Password
          </h1>

          {submitted ? (
            <div className="text-center py-6 space-y-4 animate-fade-in">
              <div
                className="icon-chip icon-chip-green mx-auto flex items-center justify-center"
                style={{ width: '56px', height: '56px' }}
              >
                <CheckCircle2 size={28} strokeWidth={2.5} />
              </div>
              <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                Check your email
              </p>
              <p className="text-xs" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                If an account matches <strong>{email}</strong>, reset instructions have been sent.
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="btn-brutal btn-brutal-primary text-sm cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  <ArrowLeft size={16} strokeWidth={2.5} />
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-4">
              <p className="text-sm text-center" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                Enter your email address to receive password reset instructions.
              </p>
              <div>
                <label htmlFor="email" className="label-brutal">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    strokeWidth={2.5}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-quelle-ink-muted)' }}
                  />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="you@company.com"
                    className={`input-brutal pl-10 ${error ? 'input-error' : ''}`}
                  />
                </div>
                {error && (
                  <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--color-quelle-red-dark)' }}>
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn-brutal btn-brutal-primary w-full text-sm py-3 cursor-pointer"
              >
                Send Reset Link
              </button>

              <div className="text-center text-sm pt-2">
                <Link
                  to="/login"
                  className="font-bold flex items-center justify-center gap-1"
                  style={{ textDecoration: 'none', color: 'var(--color-quelle-ink)' }}
                >
                  <ArrowLeft size={14} strokeWidth={2.5} />
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
