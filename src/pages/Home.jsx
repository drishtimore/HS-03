import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
          [Project Name]
        </h1>
        <p className="text-base text-slate-600 max-w-xl mx-auto">
          [Add description here]
        </p>

        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            to="/register"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            [Call to Action 1]
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
          >
            [Call to Action 2]
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-200">
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">[Feature 1]</h2>
          <p className="text-sm text-slate-600">[Add description here]</p>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">[Feature 2]</h2>
          <p className="text-sm text-slate-600">[Add description here]</p>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">[Feature 3]</h2>
          <p className="text-sm text-slate-600">[Add description here]</p>
        </div>
      </section>
    </main>
  );
}
