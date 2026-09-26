import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, Globe, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      className="mt-auto bg-white"
      style={{ borderTop: '2.5px solid var(--color-quelle-ink)' }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 no-underline mb-4" style={{ textDecoration: 'none' }}>
              <div className="icon-chip icon-chip-yellow icon-chip-sm flex items-center justify-center">
                <Search size={16} strokeWidth={3} />
              </div>
              <span
                className="text-lg tracking-tight"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-quelle-ink)' }}
              >
                Quelle
              </span>
            </Link>
            <p className="text-sm" style={{ color: 'var(--color-quelle-ink-muted)' }}>
              Intelligent document intelligence and multi-source search platform. Upload, extract, query.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-wider mb-4"
              style={{ color: 'var(--color-quelle-ink-muted)' }}
            >
              Product
            </h4>
            <ul className="space-y-2 list-none p-0 m-0">
              {[
                { to: '/library', label: 'Document Library' },
                { to: '/chat', label: 'AI Search' },
                { to: '/admin', label: 'Admin Dashboard' },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm font-medium no-underline transition-colors"
                    style={{ textDecoration: 'none', color: 'var(--color-quelle-ink-light)' }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-wider mb-4"
              style={{ color: 'var(--color-quelle-ink-muted)' }}
            >
              Legal
            </h4>
            <ul className="space-y-2 list-none p-0 m-0">
              {[
                { to: '/legal/privacy', label: 'Privacy Policy' },
                { to: '/legal/terms', label: 'Terms of Use' },
                { to: '/contact', label: 'Contact Us' },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm font-medium no-underline transition-colors"
                    style={{ textDecoration: 'none', color: 'var(--color-quelle-ink-light)' }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-wider mb-4"
              style={{ color: 'var(--color-quelle-ink-muted)' }}
            >
              Connect
            </h4>
            <div className="flex gap-2">
              {[
                { icon: Mail, href: 'mailto:contact@quelle.dev' },
                { icon: ExternalLink, href: '#' },
                { icon: Globe, href: '#' },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className="flex items-center justify-center w-10 h-10 rounded-lg transition-all"
                  style={{
                    border: '2.5px solid var(--color-quelle-ink)',
                    background: 'white',
                    color: 'var(--color-quelle-ink)',
                    boxShadow: 'var(--shadow-brutal-sm)',
                    textDecoration: 'none',
                  }}
                  aria-label={social.icon.name}
                >
                  <social.icon size={18} strokeWidth={2.5} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div
          className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '2px solid var(--color-quelle-border-light)' }}
        >
          <p className="text-xs" style={{ color: 'var(--color-quelle-ink-muted)' }}>
            © {new Date().getFullYear()} Quelle. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: 'var(--color-quelle-ink-muted)' }}>
            Document Intelligence Platform v1.0
          </p>
        </div>
      </div>
    </footer>
  );
}
