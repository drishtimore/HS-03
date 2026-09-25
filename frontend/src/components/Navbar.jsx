import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/contact', label: 'Contact' },
    { path: '/legal/privacy', label: 'Privacy' },
    { path: '/legal/terms', label: 'Terms' },
  ];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-bold text-slate-900 text-lg">
          [Project Name]
        </Link>

        <nav className="flex items-center gap-4 text-sm text-slate-600">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`hover:text-slate-900 transition-colors ${
                location.pathname === link.path ? 'font-semibold text-slate-900' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="text-xs sm:text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}
