import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Home, Search } from 'lucide-react';

export default function ThankYou() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div
        className="max-w-md w-full text-center p-8 animate-fade-in-up"
        style={{
          border: '2.5px solid var(--color-quelle-ink)',
          borderRadius: 'var(--radius-brutal-lg)',
          boxShadow: 'var(--shadow-brutal)',
          background: 'white',
        }}
      >
        <div
          className="icon-chip icon-chip-green mx-auto mb-6 flex items-center justify-center"
          style={{ width: '64px', height: '64px' }}
        >
          <CheckCircle2 size={32} strokeWidth={2.5} />
        </div>

        <h1
          className="text-2xl sm:text-3xl mb-2"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
        >
          Thank you!
        </h1>

        <p className="text-sm mb-8" style={{ color: 'var(--color-quelle-ink-muted)' }}>
          Your message has been received. We'll get back to you soon.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to="/library"
            className="btn-brutal btn-brutal-primary w-full text-sm py-3"
            style={{ textDecoration: 'none' }}
          >
            Explore Library
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
          <Link
            to="/"
            className="btn-brutal btn-brutal-secondary w-full text-sm py-3"
            style={{ textDecoration: 'none' }}
          >
            <Home size={16} strokeWidth={2.5} />
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
