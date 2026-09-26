import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Shield,
  Briefcase,
  LogOut,
  Lock,
} from 'lucide-react';

const ROLE_BADGE = {
  admin: { label: 'Admin', class: 'badge-indexed' },
  editor: { label: 'Editor', class: 'badge-processing' },
  viewer: { label: 'Viewer', class: 'badge-queued' },
};

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="brutal-card p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--color-quelle-ink-muted)' }}>
            You are not logged in.
          </p>
        </div>
      </main>
    );
  }

  const roleCfg = ROLE_BADGE[user.role] || ROLE_BADGE.viewer;
  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
      {/* Page Header */}
      <div className="mb-10">
        <h1
          className="text-3xl sm:text-4xl mb-2"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.02em' }}
        >
          My Profile
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-quelle-ink-muted)' }}>
          View your account details and manage your settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Avatar + Identity Card */}
        <div className="md:col-span-1">
          <div className="brutal-card p-6 flex flex-col items-center text-center gap-4">
            <div
              className="flex items-center justify-center w-20 h-20 rounded-full text-2xl"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                background: 'var(--color-quelle-yellow)',
                border: '2.5px solid var(--color-quelle-ink)',
                boxShadow: 'var(--shadow-brutal-sm)',
              }}
            >
              {initials}
            </div>

            <div>
              <h2
                className="text-lg"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
              >
                {user.name}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                {user.email}
              </p>
            </div>

            <span className={`status-badge ${roleCfg.class}`}>
              <Shield size={12} strokeWidth={2.5} />
              {roleCfg.label}
            </span>
          </div>
        </div>

        {/* Details + Actions */}
        <div className="md:col-span-2 space-y-6">
          {/* Account Details */}
          <div className="brutal-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="icon-chip icon-chip-teal flex items-center justify-center">
                <User size={20} strokeWidth={2.5} />
              </div>
              <h2
                className="text-lg"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
              >
                Account Details
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="icon-chip icon-chip-green icon-chip-sm flex items-center justify-center">
                  <User size={14} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="label-brutal mb-0">Full Name</p>
                  <p className="text-sm font-bold">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="icon-chip icon-chip-orange icon-chip-sm flex items-center justify-center">
                  <Mail size={14} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="label-brutal mb-0">Email</p>
                  <p className="text-sm font-bold">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="icon-chip icon-chip-purple icon-chip-sm flex items-center justify-center">
                  <Shield size={14} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="label-brutal mb-0">Role</p>
                  <p className="text-sm font-bold" style={{ textTransform: 'capitalize' }}>{user.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Workspaces */}
          {user.workspaces && user.workspaces.length > 0 && (
            <div className="brutal-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="icon-chip icon-chip-yellow flex items-center justify-center">
                  <Briefcase size={20} strokeWidth={2.5} />
                </div>
                <h2
                  className="text-lg"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
                >
                  Workspaces
                </h2>
              </div>

              <ul className="space-y-2 list-none p-0 m-0">
                {user.workspaces.map((ws) => (
                  <li
                    key={ws.id}
                    className="flex items-center gap-2 py-2 px-3"
                    style={{
                      border: '1.5px solid var(--color-quelle-border-light)',
                      borderRadius: 'var(--radius-brutal-sm)',
                    }}
                  >
                    <Briefcase size={14} strokeWidth={2.5} style={{ color: 'var(--color-quelle-ink-muted)' }} />
                    <span className="text-sm font-semibold">{ws.name}</span>
                    <span className="text-xs ml-auto" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                      {ws.id}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Account Actions */}
          <div className="brutal-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="icon-chip icon-chip-pink flex items-center justify-center">
                <Lock size={20} strokeWidth={2.5} />
              </div>
              <h2
                className="text-lg"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
              >
                Account Actions
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/forgot-password')}
                className="btn-brutal btn-brutal-secondary text-sm py-2 px-4 cursor-pointer"
              >
                <Lock size={14} strokeWidth={2.5} />
                Change Password
              </button>
              <button
                onClick={handleLogout}
                className="btn-brutal text-sm py-2 px-4 cursor-pointer"
                style={{
                  background: 'var(--color-quelle-red)',
                  color: 'white',
                  border: '2.5px solid var(--color-quelle-ink)',
                  boxShadow: 'var(--shadow-brutal-sm)',
                }}
              >
                <LogOut size={14} strokeWidth={2.5} />
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
