import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          404
        </span>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Back to homepage
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
            Quick Links
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-slate-600">
            <Link to="/" className="hover:text-slate-900 transition-colors">
              [Link 1]
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/contact" className="hover:text-slate-900 transition-colors">
              [Link 2]
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
