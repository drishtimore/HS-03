import React from 'react';
import { Shield, Database, Eye, Mail } from 'lucide-react';

const sections = [
  {
    icon: Shield,
    color: 'icon-chip-green',
    title: 'Introduction',
    content: 'Quelle ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our document intelligence platform.',
  },
  {
    icon: Database,
    color: 'icon-chip-orange',
    title: 'Data We Collect',
    content: 'We collect information you provide directly, including account details (name, email, password), uploaded documents and their content, search queries and conversation history, and usage analytics. Documents are processed through our extraction pipelines but are never shared with third parties.',
  },
  {
    icon: Eye,
    color: 'icon-chip-purple',
    title: 'How We Use It',
    content: 'Your data is used to provide document processing, semantic search, and AI-powered question answering services. We process documents through OCR, table extraction, and embedding pipelines solely to enable search and retrieval functionality. All processing is performed in tenant-isolated environments.',
  },
  {
    icon: Mail,
    color: 'icon-chip-teal',
    title: 'Contact',
    content: null,
  },
];

export default function PrivacyPolicy() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-10">
        <h1
          className="text-3xl sm:text-4xl mb-2"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.02em' }}
        >
          Privacy Policy
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
                  For privacy inquiries, please contact:{' '}
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
