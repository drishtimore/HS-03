import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      return !localStorage.getItem('cookie_consent');
    } catch {
      return true;
    }
  });

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
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-fade-in-up"
      style={{
        border: '2.5px solid var(--color-quelle-ink)',
        borderRadius: 'var(--radius-brutal)',
        boxShadow: 'var(--shadow-brutal)',
        background: 'white',
        padding: '20px',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="icon-chip icon-chip-yellow icon-chip-sm flex items-center justify-center flex-shrink-0 mt-0.5">
          <Cookie size={16} strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--color-quelle-ink)' }}>
            Cookie Notice
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-quelle-ink-muted)' }}>
            We use cookies to enhance your experience. By continuing to use Quelle, you agree to our cookie policy.
          </p>
        </div>
        <button
          onClick={() => handleConsent('rejected')}
          className="flex-shrink-0 cursor-pointer p-1"
          style={{ background: 'none', border: 'none', color: 'var(--color-quelle-ink-muted)' }}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex items-center gap-2 mt-4 justify-end">
        <button
          onClick={() => handleConsent('rejected')}
          className="btn-brutal btn-brutal-secondary text-xs py-2 px-4 cursor-pointer"
        >
          Reject
        </button>
        <button
          onClick={() => handleConsent('accepted')}
          className="btn-brutal btn-brutal-primary text-xs py-2 px-4 cursor-pointer"
        >
          Accept
        </button>
      </div>
    </aside>
  );
}
