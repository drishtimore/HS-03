import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white text-slate-500 text-xs py-8">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p>© {new Date().getFullYear()} [Project Name]. All rights reserved.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/legal/privacy" className="hover:text-slate-800 transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link to="/legal/terms" className="hover:text-slate-800 transition-colors">
            Terms of Use
          </Link>
          <span>•</span>
          <Link to="/contact" className="hover:text-slate-800 transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
