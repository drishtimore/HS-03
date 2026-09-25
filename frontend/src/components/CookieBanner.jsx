import React, { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('cookie_consent');
      if (!consent) {
        setIsVisible(true);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const handleConsent = (choice) => {
    try {
      localStorage.setItem('cookie_consent', choice);
    } catch (e) {
      console.warn('Unable to save cookie preference:', e);
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-slate-800"
    >
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
        This site uses cookies. [Details placeholder]
      </p>
      <div className="flex items-center gap-2 mt-3 justify-end">
        <button
          onClick={() => handleConsent('rejected')}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition-colors cursor-pointer"
        >
          Reject
        </button>
        <button
          onClick={() => handleConsent('accepted')}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
        >
          Accept
        </button>
      </div>
    </aside>
  );
}
