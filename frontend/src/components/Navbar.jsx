import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Search,
  FileText,
  MessageSquare,
  LayoutDashboard,
  Library,
  ChevronDown,
  User,
  Home as HomeIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoggedIn } = useAuth();

  const isAdmin = user?.role === 'admin' || user?.email === 'admin@gmail.com';

  const navLinks = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/library', label: 'Library', icon: Library },
    { path: '/chat', label: 'Chat', icon: MessageSquare },
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: LayoutDashboard }] : []),
    { path: '/contact', label: 'Contact', icon: FileText },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <header
      className="sticky top-0 z-50 bg-white"
      style={{ borderBottom: '2.5px solid var(--color-quelle-ink)' }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 no-underline"
          style={{ textDecoration: 'none' }}
        >
          <div
            className="icon-chip icon-chip-yellow icon-chip-sm flex items-center justify-center"
          >
            <Search size={18} strokeWidth={3} />
          </div>
          <span
            className="text-xl tracking-tight"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
          >
            Quelle
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all no-underline"
                style={{
                  textDecoration: 'none',
                  background: isActive(link.path) ? 'var(--color-quelle-yellow)' : 'transparent',
                  color: isActive(link.path) ? 'var(--color-quelle-ink)' : 'var(--color-quelle-ink-light)',
                  border: isActive(link.path) ? '2px solid var(--color-quelle-ink)' : '2px solid transparent',
                }}
              >
                <Icon size={16} strokeWidth={2.5} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {isLoggedIn && user ? (
            <Link
              to="/profile"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg transition-all no-underline"
              style={{
                textDecoration: 'none',
                border: '2.5px solid var(--color-quelle-ink)',
                background: isActive('/profile') ? 'var(--color-quelle-yellow)' : 'white',
                color: 'var(--color-quelle-ink)',
                boxShadow: 'var(--shadow-brutal-sm)',
              }}
            >
              <User size={16} strokeWidth={2.5} />
              {user.name.split(' ')[0]}
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-all no-underline"
                style={{
                  textDecoration: 'none',
                  border: '2.5px solid var(--color-quelle-ink)',
                  background: 'white',
                  color: 'var(--color-quelle-ink)',
                  boxShadow: 'var(--shadow-brutal-sm)',
                }}
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="hidden sm:inline-flex btn-brutal btn-brutal-primary text-sm"
                style={{ textDecoration: 'none' }}
              >
                Get Started
              </Link>
            </>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer"
            style={{
              border: '2.5px solid var(--color-quelle-ink)',
              background: mobileMenuOpen ? 'var(--color-quelle-yellow)' : 'white',
            }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} strokeWidth={3} /> : <Menu size={20} strokeWidth={3} />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden animate-fade-in"
          style={{ borderTop: '2.5px solid var(--color-quelle-ink)', background: 'white' }}
        >
          <nav className="max-w-[1400px] mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg transition-all no-underline"
                  style={{
                    textDecoration: 'none',
                    background: isActive(link.path) ? 'var(--color-quelle-yellow)' : 'transparent',
                    color: isActive(link.path) ? 'var(--color-quelle-ink)' : 'var(--color-quelle-ink-light)',
                    border: isActive(link.path) ? '2px solid var(--color-quelle-ink)' : '2px solid transparent',
                  }}
                >
                  <Icon size={18} strokeWidth={2.5} />
                  {link.label}
                </Link>
              );
            })}
            <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '2px solid var(--color-quelle-border-light)' }}>
              {isLoggedIn && user ? (
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2.5 text-sm font-bold rounded-lg no-underline flex items-center justify-center gap-2"
                  style={{
                    textDecoration: 'none',
                    border: '2.5px solid var(--color-quelle-ink)',
                    background: 'white',
                    color: 'var(--color-quelle-ink)',
                  }}
                >
                  <User size={16} strokeWidth={2.5} />
                  Profile
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2.5 text-sm font-bold rounded-lg no-underline"
                    style={{
                      textDecoration: 'none',
                      border: '2.5px solid var(--color-quelle-ink)',
                      background: 'white',
                      color: 'var(--color-quelle-ink)',
                    }}
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center btn-brutal btn-brutal-primary text-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
