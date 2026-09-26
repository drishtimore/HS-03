import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import RequireAdmin from './components/RequireAdmin';
import Home from './pages/Home';
import Contact from './pages/Contact';
import NotFound from './pages/status/NotFound';
import ThankYou from './pages/status/ThankYou';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import Terms from './pages/legal/Terms';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import Library from './pages/Library';
import DocumentViewer from './pages/DocumentViewer';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Main application routes */}
            <Route index element={<Home />} />
            <Route path="contact" element={<Contact />} />

            {/* Core platform screens */}
            <Route path="library" element={<Library />} />
            <Route path="viewer/:id" element={<DocumentViewer />} />
            <Route path="chat" element={<Chat />} />
            <Route path="admin" element={<RequireAdmin><Admin /></RequireAdmin>} />

            {/* User profile */}
            <Route path="profile" element={<Profile />} />

            {/* Status pages */}
            <Route path="thank-you" element={<ThankYou />} />

            {/* Legal and trust pages */}
            <Route path="legal/privacy" element={<PrivacyPolicy />} />
            <Route path="legal/terms" element={<Terms />} />

            {/* Auth pages */}
            <Route path="register" element={<Register />} />
            <Route path="login" element={<Login />} />
            <Route path="forgot-password" element={<ForgotPassword />} />

            {/* Catch-all 404 page */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
