import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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
    <main className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
          Reset Password
        </h1>

        {submitted ? (
          <div className="text-center py-4 space-y-4">
            <p className="text-sm text-slate-700 font-medium">
              [Check your email placeholder]
            </p>
            <p className="text-xs text-slate-500">
              If an account matches {email}, reset instructions have been sent.
            </p>
            <div className="pt-4">
              <Link to="/login" className="text-sm text-slate-900 font-medium hover:underline">
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-4">
            <p className="text-sm text-slate-600">
              Enter your email address to receive password reset instructions.
            </p>
            <div>
              <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wider text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  error ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Send Reset Link
            </button>

            <div className="text-center text-sm text-slate-600 pt-2">
              <Link to="/login" className="text-slate-900 hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
