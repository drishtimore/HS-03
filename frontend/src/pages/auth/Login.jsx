import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, ArrowRight, Search, Zap, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: location.state?.registeredEmail || '',
    password: '',
  });

  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (location.state?.registeredEmail) {
      setFormData((prev) => ({ ...prev, email: location.state.registeredEmail }));
    }
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
    }
  }, [location.state]);

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errs.email = 'Invalid email address';
      }
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const { loginWithCredentials } = useAuth();

  const DEMO_ACCOUNTS = [
    { label: 'Admin (admin@gmail.com)', email: 'admin@gmail.com', password: 'admin@123', role: 'admin' },
    { label: 'Editor', email: 'rahul@acme.com', password: 'Demo@1234', role: 'editor' },
    { label: 'Viewer', email: 'ananya@acme.com', password: 'Demo@1234', role: 'viewer' },
  ];

  const fillDemo = (account) => {
    setFormData({ email: account.email, password: account.password });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (loginWithCredentials) {
        const res = await loginWithCredentials(formData.email, formData.password);
        if (res.success) {
          setIsLoading(false);
          // If logged in as admin, route directly to /admin dashboard
          if (res.user?.role === 'admin' || formData.email.toLowerCase() === 'admin@gmail.com') {
            navigate('/admin');
          } else {
            navigate('/library');
          }
          return;
        } else {
          setErrors({ email: res.error || 'Invalid email or password' });
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      setIsLoading(false);
      setErrors({ email: err.message || 'Login failed. Check your credentials.' });
    }
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
            className="text-2xl text-center mb-1"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
          >
            Welcome back.
          </h1>
          <p className="text-sm text-center mb-6" style={{ color: 'var(--color-quelle-ink-muted)' }}>
            Log in to access your document workspace.
          </p>

          {successMessage && (
            <div
              className="p-3 mb-5 rounded-lg flex items-center gap-2.5 text-xs font-bold animate-fade-in"
              style={{
                background: '#dcfce7',
                border: '2px solid var(--color-quelle-green)',
                color: '#14532d',
                boxShadow: 'var(--shadow-brutal-sm)',
              }}
            >
              <CheckCircle2 size={18} strokeWidth={2.5} className="shrink-0 text-green-700" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  className={`input-brutal pl-10 ${errors.email ? 'input-error' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--color-quelle-red-dark)' }}>
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="label-brutal mb-0">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold transition-colors"
                  style={{ textDecoration: 'none', color: 'var(--color-quelle-ink-muted)' }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  strokeWidth={2.5}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-quelle-ink-muted)' }}
                />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`input-brutal pl-10 ${errors.password ? 'input-error' : ''}`}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--color-quelle-red-dark)' }}>
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-brutal btn-brutal-primary w-full text-base py-3 cursor-pointer"
            >
              {isLoading ? 'Logging in...' : 'Log In'}
              {!isLoading && <ArrowRight size={18} strokeWidth={2.5} />}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: 'var(--color-quelle-ink-muted)' }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold"
              style={{ textDecoration: 'none', color: 'var(--color-quelle-ink)' }}
            >
              Create one
            </Link>
          </div>

          {/* Demo credentials panel */}
          <div
            className="mt-5 p-3 rounded"
            style={{
              background: 'var(--color-quelle-cream)',
              border: '1.5px dashed var(--color-quelle-ink)',
              borderRadius: 'var(--radius-brutal-sm)',
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Zap size={13} strokeWidth={2.5} style={{ color: 'var(--color-quelle-orange-dark)' }} />
              <span className="text-xs font-bold uppercase" style={{ color: 'var(--color-quelle-ink)' }}>
                Demo Quick Login
              </span>
              <span className="text-[0.6rem] ml-auto" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                password: Demo@1234
              </span>
            </div>
            <div className="flex gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="flex-1 text-xs py-1.5 font-bold cursor-pointer transition-all hover:opacity-80"
                  style={{
                    border: '1.5px solid var(--color-quelle-ink)',
                    borderRadius: 'var(--radius-brutal-sm)',
                    background: acc.role === 'admin' ? 'var(--color-quelle-yellow)' : acc.role === 'editor' ? '#c7f7e4' : '#dde8ff',
                    color: 'var(--color-quelle-ink)',
                  }}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
