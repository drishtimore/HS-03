import React from 'react';
import { Link } from 'react-router-dom';

export default function ThankYou() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Thanks — [confirmation placeholder]
        </h1>

        <p className="mt-4 text-sm text-slate-600">
          [What happens next placeholder]
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            [Next step]
          </Link>
          <Link
            to="/"
            className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
