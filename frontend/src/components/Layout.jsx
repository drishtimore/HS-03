import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import CookieBanner from './CookieBanner';

export default function Layout() {
  return (
    <div
      className="min-h-screen flex flex-col antialiased"
      style={{
        fontFamily: 'var(--font-body)',
        background: 'var(--color-quelle-offwhite)',
        color: 'var(--color-quelle-ink)',
      }}
    >
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      {/* Root mounted cookie banner */}
      <CookieBanner />
    </div>
  );
}
