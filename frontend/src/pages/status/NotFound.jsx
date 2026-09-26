import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Home, MessageSquare, ArrowLeft, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center animate-fade-in-up">
        <div
          className="icon-chip icon-chip-red mx-auto mb-6 flex items-center justify-center"
          style={{ width: '64px', height: '64px' }}
        >
          <FileQuestion size={32} strokeWidth={2.5} />
        </div>

        <span
          className="text-sm font-bold uppercase tracking-wider"
          style={{ color: 'var(--color-quelle-ink-muted)' }}
        >
          404
        </span>
        <h1
          className="mt-2 text-3xl sm:text-4xl"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
        >
          Page not found
        </h1>
        <p className="mt-3 text-sm" style={{ color: 'var(--color-quelle-ink-muted)' }}>
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="mt-6">
          <Link
            to="/"
            className="btn-brutal btn-brutal-primary text-sm"
            style={{ textDecoration: 'none' }}
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            Back to homepage
          </Link>
        </div>

        <div
          className="mt-10 pt-6"
          style={{ borderTop: '2.5px solid var(--color-quelle-ink)' }}
        >
          <p className="label-brutal text-center">Quick Links</p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <Link
              to="/"
              className="btn-brutal btn-brutal-secondary text-xs py-2 px-3"
              style={{ textDecoration: 'none' }}
            >
              <Home size={14} strokeWidth={2.5} />
              Home
            </Link>
            <Link
              to="/library"
              className="btn-brutal btn-brutal-secondary text-xs py-2 px-3"
              style={{ textDecoration: 'none' }}
            >
              <Search size={14} strokeWidth={2.5} />
              Library
            </Link>
            <Link
              to="/contact"
              className="btn-brutal btn-brutal-secondary text-xs py-2 px-3"
              style={{ textDecoration: 'none' }}
            >
              <MessageSquare size={14} strokeWidth={2.5} />
              Contact
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
