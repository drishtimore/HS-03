import React from 'react';

export default function PrivacyPolicy() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-8 pb-4 border-b border-slate-200">
        Privacy Policy
      </h1>

      <div className="space-y-8 text-slate-700 text-sm sm:text-base">
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Introduction
          </h2>
          <p className="text-slate-600">[Add details here]</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Data We Collect
          </h2>
          <p className="text-slate-600">[Add details here]</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            How We Use It
          </h2>
          <p className="text-slate-600">[Add details here]</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Contact
          </h2>
          <p className="text-slate-600">
            For privacy inquiries, please contact:{' '}
            <a href="mailto:chinte.log@yahoo.co.in" className="text-slate-900 underline font-medium">
              chinte.log@yahoo.co.in
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
