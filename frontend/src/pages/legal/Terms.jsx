import React from 'react';
import { FileText, Shield, AlertTriangle, Mail } from 'lucide-react';

const sections = [
  {
    icon: FileText,
    color: 'icon-chip-green',
    title: 'Acceptance of Terms',
    content: 'By accessing or using Quelle, you agree to be bound by these Terms of Use. If you do not agree to these terms, you may not access or use the platform. These terms apply to all users, including administrators, editors, and viewers.',
  },
  {
    icon: Shield,
    color: 'icon-chip-purple',
    title: 'Use of Service',
    content: 'You may use Quelle to upload, process, and query documents within your authorized workspace. You are responsible for the content you upload and must ensure you have the legal right to process such documents. Automated scraping, bulk extraction for competing services, or any activity that degrades service performance is prohibited.',
  },
  {
    icon: AlertTriangle,
    color: 'icon-chip-orange',
    title: 'Limitation of Liability',
    content: 'Quelle provides AI-powered document analysis as-is. While we strive for accuracy through citation-grounded responses and confidence scoring, we do not guarantee the accuracy of OCR extraction, table parsing, or AI-generated answers. Users should verify critical information against source documents using the provided citation links.',
  },
  {
    icon: Mail,
    color: 'icon-chip-teal',
    title: 'Contact',
    content: null,
  },
];

export default function Terms() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-10">
        <h1
          className="text-3xl sm:text-4xl mb-2"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.02em' }}
        >
          Terms of Use
        </h1>
        <div
          className="mt-4"
          style={{ borderBottom: '2.5px solid var(--color-quelle-ink)' }}
        />
      </div>

      <div className="space-y-6 stagger-children">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <div
              key={i}
              className="brutal-card p-6"
              style={{ boxShadow: 'var(--shadow-brutal-sm)' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`icon-chip ${section.color} icon-chip-sm flex items-center justify-center`}>
                  <Icon size={16} strokeWidth={2.5} />
                </div>
                <h2
                  className="text-lg"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
                >
                  {section.title}
                </h2>
              </div>
              {section.content ? (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-quelle-ink-light)' }}>
                  {section.content}
                </p>
              ) : (
                <p className="text-sm" style={{ color: 'var(--color-quelle-ink-light)' }}>
                  For questions about these terms, contact:{' '}
                  <a
                    href="mailto:chinte.log@yahoo.co.in"
                    className="font-bold"
                    style={{ textDecoration: 'underline', color: 'var(--color-quelle-ink)' }}
                  >
                    chinte.log@yahoo.co.in
                  </a>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
