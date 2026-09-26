import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Phone, Mail, Users, User, MessageSquare, ArrowRight } from 'lucide-react';

export default function Contact() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const teamMembers = [
    'Drishti More',
    'Bishnupriya Mohapatra',
    'Sakshi Palankar',
    'Ayyan Muqadam',
  ];

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errs.email = 'Invalid email address';
      }
    }

    if (!formData.message.trim()) {
      errs.message = 'Message is required';
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/thank-you');
    }, 400);
  };

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
      {/* Page Header */}
      <div className="mb-10 stagger-children">
        <h1
          className="text-3xl sm:text-4xl mb-2"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.02em' }}
        >
          Contact Us
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-quelle-ink-muted)' }}>
          Have questions about Quelle? We'd love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="space-y-6 stagger-children">
          <div
            className="brutal-card p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="icon-chip icon-chip-teal flex items-center justify-center">
                <Users size={20} strokeWidth={2.5} />
              </div>
              <h2
                className="text-lg"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
              >
                Team Information
              </h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="icon-chip icon-chip-green icon-chip-sm flex items-center justify-center">
                  <Phone size={14} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="label-brutal mb-0">Phone</p>
                  <a
                    href="tel:9320153666"
                    className="font-bold"
                    style={{ textDecoration: 'none', color: 'var(--color-quelle-ink)' }}
                  >
                    9320153666
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="icon-chip icon-chip-orange icon-chip-sm flex items-center justify-center">
                  <Mail size={14} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="label-brutal mb-0">Email</p>
                  <a
                    href="mailto:chinte.log@yahoo.co.in"
                    className="font-bold"
                    style={{ textDecoration: 'none', color: 'var(--color-quelle-ink)' }}
                  >
                    chinte.log@yahoo.co.in
                  </a>
                </div>
              </div>
            </div>

            <div
              className="mt-6 pt-5"
              style={{ borderTop: '2px solid var(--color-quelle-border-light)' }}
            >
              <h3 className="label-brutal">Team Members</h3>
              <ul className="space-y-2 list-none p-0 m-0">
                {teamMembers.map((member, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 py-2 px-3"
                    style={{
                      border: '1.5px solid var(--color-quelle-border-light)',
                      borderRadius: 'var(--radius-brutal-sm)',
                    }}
                  >
                    <div
                      className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0"
                      style={{
                        background: ['var(--color-quelle-green)', 'var(--color-quelle-orange)', 'var(--color-quelle-pink)', 'var(--color-quelle-purple)'][i],
                        border: '1.5px solid var(--color-quelle-ink)',
                      }}
                    >
                      <User size={12} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-semibold">{member}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div
          className="brutal-card p-6 animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="icon-chip icon-chip-yellow flex items-center justify-center">
              <MessageSquare size={20} strokeWidth={2.5} />
            </div>
            <h2
              className="text-lg"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
            >
              Send a Message
            </h2>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="name" className="label-brutal">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                className={`input-brutal ${errors.name ? 'input-error' : ''}`}
              />
              {errors.name && (
                <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--color-quelle-red-dark)' }}>
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="label-brutal">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className={`input-brutal ${errors.email ? 'input-error' : ''}`}
              />
              {errors.email && (
                <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--color-quelle-red-dark)' }}>
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="message" className="label-brutal">Message</label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us how we can help..."
                className={`input-brutal resize-none ${errors.message ? 'input-error' : ''}`}
              />
              {errors.message && (
                <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--color-quelle-red-dark)' }}>
                  {errors.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-brutal btn-brutal-primary w-full text-base py-3 cursor-pointer"
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
              {!isSubmitting && <Send size={16} strokeWidth={2.5} />}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
