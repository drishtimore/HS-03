import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, ArrowRight, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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

  const { login, loginWithCredentials } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // 1. Attempt real backend login
      if (loginWithCredentials) {
        const res = await loginWithCredentials(formData.email, formData.password);
        if (res.success) {
          setIsLoading(false);
          navigate('/library');
          return;
        }
      }

      // 2. Fallback to mock / demo credentials
      const existingUsersStr = localStorage.getItem('mock_users');
      const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : [];
      let userToLog = existingUsers.find(
        (u) => u.email === formData.email && u.password === formData.password
      );

      if (!userToLog && formData.email === 'admin@gmail.com' && formData.password === 'admin@123') {
        userToLog = {
          id: 'usr-admin',
          name: 'Admin User',
          email: formData.email,
          role: 'admin',
          workspaces: [{ id: 'a388c08d-67f1-45ee-a10d-e2e9583c0dee', name: 'General Intelligence Workspace' }],
        };
      } else if (!userToLog && formData.email === 'priya@acme.com') {
        userToLog = {
          id: '5a3087f1-f51f-4277-be51-206b4c631b3d',
          name: 'Priya Sharma',
          email: 'priya@acme.com',
          role: 'admin',
        };
      }

      if (!userToLog) {
        setErrors({ email: 'Invalid email or password' });
        setIsLoading(false);
        return;
      }

      const role = userToLog.role || 'editor';
      const name = userToLog.name || formData.email.split('@')[0];
      login('mock-token-session', {
        id: userToLog.id || 'usr-' + Date.now(),
        name: name,
        email: formData.email,
        role: role,
        workspaces: userToLog.workspaces || [],
      });
      setIsLoading(false);
      navigate('/library');
    } catch (err) {
      setIsLoading(false);
      setErrors({ email: err.message || 'Login failed' });
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
        </div>
      </div>
    </main>
  );
}
