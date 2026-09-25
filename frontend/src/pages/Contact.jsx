import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    '[Name 1]',
    '[Name 2]',
    '[Name 3]',
    '[Name 4]',
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
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Contact Us
      </h1>
      <p className="text-sm text-slate-600 mb-8">
        [Add description here]
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Team Information
            </h2>
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <strong>Phone:</strong>{' '}
                <a href="tel:9320153666" className="text-slate-900 hover:underline">
                  9320153666
                </a>
              </p>
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:chinte.log@yahoo.co.in" className="text-slate-900 hover:underline">
                  chinte.log@yahoo.co.in
                </a>
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Team Members
              </h3>
              <ul className="space-y-1.5 text-sm text-slate-600">
                {teamMembers.map((member, i) => (
                  <li key={i} className="py-1 border-b border-slate-50 last:border-0">
                    {member}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Send a Message
          </h2>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-medium uppercase tracking-wider text-slate-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wider text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="message" className="block text-xs font-medium uppercase tracking-wider text-slate-700 mb-1">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  errors.message ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.message && (
                <p className="mt-1 text-xs text-rose-600">{errors.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Sending...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
