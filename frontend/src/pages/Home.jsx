import React from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  FileText,
  ScanLine,
  Table2,
  MessageSquare,
  Shield,
  Zap,
  ArrowRight,
  Upload,
  Brain,
  CheckCircle2,
  BookOpen,
  BarChart3,
  Lock,
} from 'lucide-react';

const featureCards = [
  {
    icon: FileText,
    color: 'icon-chip-green',
    title: 'Multi-Format Ingestion',
    desc: 'Upload PDFs, images, DOCX, spreadsheets, and scans through one unified flow.',
    link: '/library',
  },
  {
    icon: ScanLine,
    color: 'icon-chip-orange',
    title: 'Intelligent OCR',
    desc: 'Automatic deskew, denoise, and high-accuracy OCR with confidence scoring.',
    link: '/library',
  },
  {
    icon: Table2,
    color: 'icon-chip-teal',
    title: 'Table Extraction',
    desc: 'Structured table data extracted as queryable JSON — even from scanned docs.',
    link: '/viewer/1',
  },
  {
    icon: Brain,
    color: 'icon-chip-purple',
    title: 'Semantic Search',
    desc: 'Hybrid vector + keyword retrieval with cross-encoder re-ranking for precision.',
    link: '/chat',
  },
  {
    icon: MessageSquare,
    color: 'icon-chip-pink',
    title: 'Conversational Q&A',
    desc: 'Ask natural-language questions across your documents with full citation trails.',
    link: '/chat',
  },
  {
    icon: Shield,
    color: 'icon-chip-yellow',
    title: 'Zero Hallucination',
    desc: 'Every answer grounded in cited evidence. No fabricated claims — ever.',
    link: '/chat',
  },
];

const workflowSteps = [
  {
    step: '01',
    icon: Upload,
    color: 'icon-chip-green',
    title: 'Upload Documents',
    desc: 'Drag-and-drop your PDFs, scans, images, and spreadsheets.',
  },
  {
    step: '02',
    icon: Zap,
    color: 'icon-chip-orange',
    title: 'Auto-Process',
    desc: 'Intelligent routing through OCR, table, and vision pipelines.',
  },
  {
    step: '03',
    icon: Search,
    color: 'icon-chip-purple',
    title: 'Search & Query',
    desc: 'Ask questions in natural language and get cited answers instantly.',
  },
  {
    step: '04',
    icon: CheckCircle2,
    color: 'icon-chip-teal',
    title: 'Verify & Act',
    desc: 'Click citations to jump to exact evidence locations in documents.',
  },
];

const stats = [
  { value: '100K+', label: 'Documents per workspace', icon: BookOpen, color: 'icon-chip-green' },
  { value: '<6s', label: 'P95 query response time', icon: Zap, color: 'icon-chip-orange' },
  { value: '5+', label: 'Sources per answer', icon: BarChart3, color: 'icon-chip-purple' },
  { value: '0%', label: 'Hallucination rate', icon: Lock, color: 'icon-chip-yellow' },
];

export default function Home() {
  return (
    <main>
      {/* ═══════ HERO SECTION ═══════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'var(--color-quelle-yellow)' }}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-20 sm:py-28 relative z-10">
          <div className="max-w-3xl mx-auto text-center stagger-children">
            <div
              className="inline-flex items-center gap-2 mb-6 px-4 py-2"
              style={{
                border: '2.5px solid var(--color-quelle-ink)',
                borderRadius: 'var(--radius-brutal-pill)',
                background: 'white',
                boxShadow: 'var(--shadow-brutal-sm)',
              }}
            >
              <Search size={14} strokeWidth={3} />
              <span className="text-xs font-bold uppercase tracking-wider">Document Intelligence Platform</span>
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl leading-[1.1] mb-6"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: 'var(--color-quelle-ink)',
              }}
            >
              Search your documents.
              <br />
              <span className="relative inline-block">
                Get cited answers.
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 8 C50 2, 100 2, 150 6 S250 10, 298 4" stroke="var(--color-quelle-ink)" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p
              className="text-base sm:text-lg mb-8 max-w-xl mx-auto"
              style={{ color: 'var(--color-quelle-ink-light)' }}
            >
              Upload PDFs, scanned documents, images, and spreadsheets. Ask questions in natural language and get answers grounded in your sources — with zero fabrication.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="btn-brutal btn-brutal-secondary text-base px-8 py-3"
                style={{
                  textDecoration: 'none',
                  background: 'var(--color-quelle-ink)',
                  color: 'white',
                  boxShadow: '4px 4px 0px var(--color-quelle-ink-light)',
                }}
              >
                Get Started Free
                <ArrowRight size={18} strokeWidth={2.5} />
              </Link>
              <Link
                to="/library"
                className="btn-brutal btn-brutal-secondary text-base px-8 py-3"
                style={{ textDecoration: 'none' }}
              >
                <BookOpen size={18} strokeWidth={2.5} />
                Explore Library
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div
          className="absolute top-8 right-8 w-16 h-16 hidden lg:block"
          style={{
            border: '3px solid var(--color-quelle-ink)',
            borderRadius: 'var(--radius-brutal)',
            background: 'var(--color-quelle-green)',
            transform: 'rotate(15deg)',
            opacity: 0.6,
          }}
        />
        <div
          className="absolute bottom-12 left-12 w-12 h-12 hidden lg:block"
          style={{
            border: '3px solid var(--color-quelle-ink)',
            borderRadius: '50%',
            background: 'var(--color-quelle-pink)',
            opacity: 0.5,
          }}
        />
        <div
          className="absolute top-1/2 right-20 w-8 h-8 hidden lg:block"
          style={{
            border: '3px solid var(--color-quelle-ink)',
            background: 'var(--color-quelle-purple)',
            transform: 'rotate(45deg)',
            opacity: 0.5,
          }}
        />
      </section>

      {/* ═══════ STATS BAR ═══════ */}
      <section
        style={{
          background: 'var(--color-quelle-ink)',
          borderBottom: '2.5px solid var(--color-quelle-ink)',
        }}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`icon-chip ${stat.color} icon-chip-sm flex items-center justify-center`}>
                  <stat.icon size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <div
                    className="text-2xl sm:text-3xl"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'white' }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES GRID ═══════ */}
      <section className="py-20 sm:py-24" style={{ background: 'var(--color-quelle-offwhite)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 stagger-children">
            <h2
              className="text-3xl sm:text-4xl mb-3"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.02em' }}
            >
              Everything you need.
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--color-quelle-ink-muted)' }}>
              From ingestion to cited answers — one platform handles it all.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {featureCards.map((feature, i) => (
              <Link
                key={i}
                to={feature.link}
                className="brutal-card p-6 flex flex-col gap-4 no-underline hover:translate-y-[-4px] hover:shadow-[6px_6px_0px_0px_var(--color-quelle-ink)] transition-all cursor-pointer"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="flex items-start justify-between">
                  <div className={`icon-chip ${feature.color} flex items-center justify-center`}>
                    <feature.icon size={22} strokeWidth={2.5} />
                  </div>
                  <span
                    className="text-xs font-bold"
                    style={{ color: 'var(--color-quelle-ink-muted)' }}
                  >
                    0{i + 1}
                  </span>
                </div>
                <div>
                  <h3
                    className="text-lg mb-1"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                    {feature.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section
        className="py-20 sm:py-24"
        style={{
          background: 'var(--color-quelle-purple)',
          borderTop: '2.5px solid var(--color-quelle-ink)',
          borderBottom: '2.5px solid var(--color-quelle-ink)',
        }}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2
              className="text-3xl sm:text-4xl mb-3"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                color: 'white',
                letterSpacing: '-0.02em',
              }}
            >
              How it works.
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Four steps from raw documents to grounded answers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
            {workflowSteps.map((step, i) => (
              <div key={i} className="brutal-card p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className={`icon-chip ${step.color} flex items-center justify-center`}>
                    <step.icon size={22} strokeWidth={2.5} />
                  </div>
                  <span
                    className="text-2xl"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      color: 'var(--color-quelle-ink-muted)',
                      opacity: 0.3,
                    }}
                  >
                    {step.step}
                  </span>
                </div>
                <div>
                  <h3
                    className="text-lg mb-1"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA SECTION ═══════ */}
      <section className="py-20 sm:py-24" style={{ background: 'var(--color-quelle-offwhite)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div
            className="brutal-card p-10 sm:p-14 text-center"
            style={{ background: 'var(--color-quelle-yellow)' }}
          >
            <h2
              className="text-3xl sm:text-4xl mb-4"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.02em' }}
            >
              Ready to query your documents?
            </h2>
            <p className="text-base mb-8 max-w-lg mx-auto" style={{ color: 'var(--color-quelle-ink-light)' }}>
              Start uploading documents and get AI-powered, citation-backed answers in seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="btn-brutal text-base px-8 py-3"
                style={{
                  textDecoration: 'none',
                  background: 'var(--color-quelle-ink)',
                  color: 'white',
                  boxShadow: '4px 4px 0px var(--color-quelle-ink-light)',
                }}
              >
                Create Free Account
                <ArrowRight size={18} strokeWidth={2.5} />
              </Link>
              <Link
                to="/chat"
                className="btn-brutal btn-brutal-secondary text-base px-8 py-3"
                style={{ textDecoration: 'none' }}
              >
                Try a Query
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
