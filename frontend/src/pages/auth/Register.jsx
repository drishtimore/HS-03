import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, ArrowRight, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) {
      errs.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errs.email = 'Invalid email address';
      }
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    // Simulating register / can connect to backend API
    setTimeout(() => {
      setIsLoading(false);

      const existingUsersStr = localStorage.getItem('mock_users');
      const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : [];
      
      const userExists = existingUsers.some(u => u.email === formData.email);
      if (userExists) {
        setErrors({ email: 'An account with this email already exists' });
        return;
      }

      const role = formData.email === 'admin@gmail.com' ? 'admin' : 'viewer';
      const newUser = {
        id: 'usr-' + Date.now(),
        name: formData.fullName,
        email: formData.email,
        password: formData.password, // In a real app, never store plain text passwords!
        role: role,
        workspaces: [{ id: 'ws-default', name: 'My Workspace' }],
      };

      existingUsers.push(newUser);
      localStorage.setItem('mock_users', JSON.stringify(existingUsers));

      navigate('/login');
    }, 600);
  };

  const fields = [
    { name: 'fullName', label: 'Full Name', type: 'text', icon: User, placeholder: 'John Doe' },
    { name: 'email', label: 'Email', type: 'email', icon: Mail, placeholder: 'you@company.com' },
    { name: 'password', label: 'Password', type: 'password', icon: Lock, placeholder: 'Min 6 characters' },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', icon: ShieldCheck, placeholder: 'Re-enter password' },
  ];

  return (
    <main
      className="min-h-[80vh] flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--color-quelle-offwhite)' }}
    >
      <div className="max-w-md w-full animate-fade-in-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="icon-chip icon-chip-yellow flex items-center justify-center">
            <Search size={22} strokeWidth={3} />
          </div>
          <span
            className="text-2xl"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
          >
            Quelle
          </span>
        </div>

        <div
          className="p-8"
          style={{
            border: '2.5px solid var(--color-quelle-ink)',
            borderRadius: 'var(--radius-brutal-lg)',
            boxShadow: 'var(--shadow-brutal)',
            background: 'white',
          }}
        >
          <h1
            className="text-2xl text-center mb-1"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
          >
            Get started.
          </h1>
          <p className="text-sm text-center mb-6" style={{ color: 'var(--color-quelle-ink-muted)' }}>
            Create your account to start querying documents.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {fields.map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.name}>
                  <label htmlFor={field.name} className="label-brutal">
                    {field.label}
                  </label>
                  <div className="relative">
                    <Icon
                      size={16}
                      strokeWidth={2.5}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--color-quelle-ink-muted)' }}
                    />
                    <input
                      type={field.type}
                      id={field.name}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      className={`input-brutal pl-10 ${errors[field.name] ? 'input-error' : ''}`}
                    />
                  </div>
                  {errors[field.name] && (
                    <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--color-quelle-red-dark)' }}>
                      {errors[field.name]}
                    </p>
                  )}
                </div>
              );
            })}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-brutal btn-brutal-primary w-full text-base py-3 cursor-pointer"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
              {!isLoading && <ArrowRight size={18} strokeWidth={2.5} />}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: 'var(--color-quelle-ink-muted)' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold"
              style={{ textDecoration: 'none', color: 'var(--color-quelle-ink)' }}
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
