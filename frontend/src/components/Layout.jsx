import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import CookieBanner from './CookieBanner';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans antialiased">
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
