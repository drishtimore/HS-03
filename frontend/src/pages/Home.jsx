import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Loader2,
  UploadCloud,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const featureCards = [
  {
    icon: FileText,
    color: 'icon-chip-green',
    title: 'Multi-Format Ingestion',
    desc: 'Upload PDFs, images, DOCX, spreadsheets, and scans through one unified flow.',
    formats: 'PDF, DOCX, CSV, TXT, PNG',
    accept: '.pdf,.docx,.doc,.csv,.xlsx,.txt,.png,.jpg,.jpeg',
    link: '/library',
    actionLabel: 'Ingest Document',
  },
  {
    icon: ScanLine,
    color: 'icon-chip-orange',
    title: 'Image-to-Text OCR',
    desc: 'Deep learning RapidOCR workbench: upload photos, scans, and images for live bounding box text extraction.',
    formats: 'PNG, JPG, JPEG, WEBP, TIFF, BMP',
    accept: '.png,.jpg,.jpeg,.webp,.tiff,.bmp',
    link: '/image-to-text',
    actionLabel: 'Launch Image OCR',
  },
  {
    icon: Table2,
    color: 'icon-chip-teal',
    title: 'Table Extraction',
    desc: 'Structured table data extracted as queryable JSON — even from scanned docs.',
    formats: 'CSV, XLSX, Spreadsheets, Tabular PDFs',
    accept: '.csv,.xlsx,.xls,.pdf',
    link: '/library',
    actionLabel: 'Extract Table Data',
  },
  {
    icon: Brain,
    color: 'icon-chip-purple',
    title: 'Semantic Search',
    desc: 'Hybrid vector + keyword retrieval with cross-encoder re-ranking for precision.',
    formats: 'Any Document for Vector Indexing',
    accept: '.pdf,.docx,.csv,.txt,.png,.jpg',
    link: '/chat',
    actionLabel: 'Index & Search',
  },
  {
    icon: MessageSquare,
    color: 'icon-chip-pink',
    title: 'Conversational Q&A',
    desc: 'Ask natural-language questions across your documents with full citation trails.',
    formats: 'Multi-turn Citations & Source Auditing',
    accept: '.pdf,.docx,.txt,.csv',
    link: '/chat',
    actionLabel: 'Upload & Ask Questions',
  },
  {
    icon: Shield,
    color: 'icon-chip-yellow',
    title: 'Zero Hallucination',
    desc: 'Every answer grounded in cited evidence. No fabricated claims — ever.',
    formats: 'Confidence Gated Source Evidence',
    accept: '.pdf,.docx,.txt,.csv',
    link: '/chat',
    actionLabel: 'Verify Grounded Evidence',
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
  const navigate = useNavigate();
  const { activeWorkspace } = useAuth();
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRefs = useRef({});

  const handleTriggerUpload = (index) => {
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index].click();
    }
  };

  const handleFileChange = async (e, feature, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Feature 1: Image-to-Text OCR Workbench
    if (index === 1) {
      setUploadingIndex(index);
      setUploadMessage(`Opening Image-to-Text OCR for "${file.name}"...`);
      setTimeout(() => {
        setUploadingIndex(null);
        setUploadMessage('');
        navigate('/image-to-text', { state: { preloadedFile: file } });
      }, 600);
      return;
    }

    setUploadingIndex(index);
    setUploadMessage(`Uploading & processing "${file.name}"...`);

    try {
      const wsId = activeWorkspace?.id || 'a388c08d-67f1-45ee-a10d-e2e9583c0dee';
      const res = await api.documents.upload(wsId, [file]);
      const result = res?.results?.[0];

      if (result?.is_duplicate) {
        setUploadMessage(`⚠️ Duplicate Blocked: "${file.name}" already exists in this workspace!`);
        setTimeout(() => {
          setUploadingIndex(null);
          setUploadMessage('');
        }, 4000);
        return;
      }

      const newDocId = result?.document_id;
      setUploadMessage(`✓ Ingested "${file.name}" to Library!`);

      setTimeout(() => {
        setUploadingIndex(null);
        setUploadMessage('');
        if (index === 2 && newDocId) {
          navigate(`/viewer/${newDocId}`);
        } else if (index >= 3) {
          navigate('/chat');
        } else {
          navigate('/library');
        }
      }, 1000);
    } catch (err) {
      console.error('Feature upload error:', err);
      const isDup = err.message?.toLowerCase().includes('duplicate');
      setUploadMessage(isDup ? `⚠️ Duplicate Blocked: ${err.message}` : `Upload failed: ${err.message}`);
      setTimeout(() => {
        setUploadingIndex(null);
        setUploadMessage('');
      }, 4500);
    }
  };

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
              From multi-format ingestion to cited answers — every feature includes direct document ingestion into your active library.
            </p>

            {uploadMessage && (
              <div
                className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold animate-fade-in"
                style={{
                  background: 'var(--color-quelle-yellow)',
                  border: '2px solid var(--color-quelle-ink)',
                  boxShadow: 'var(--shadow-brutal-sm)',
                }}
              >
                <CheckCircle2 size={18} strokeWidth={2.5} className="text-green-700" />
                <span>{uploadMessage}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {featureCards.map((feature, i) => (
              <div
                key={i}
                className="brutal-card p-6 flex flex-col justify-between gap-5 bg-white transition-all hover:translate-y-[-4px] hover:shadow-[6px_6px_0px_0px_var(--color-quelle-ink)]"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`icon-chip ${feature.color} flex items-center justify-center`}>
                      <feature.icon size={22} strokeWidth={2.5} />
                    </div>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded border border-black bg-gray-50"
                      style={{ color: 'var(--color-quelle-ink-muted)' }}
                    >
                      0{i + 1}
                    </span>
                  </div>

                  <h3
                    className="text-lg font-bold mb-2"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {feature.title}
                  </h3>

                  <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                    {feature.desc}
                  </p>

                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-2 bg-gray-100 p-1.5 rounded">
                    Supported: {feature.formats}
                  </div>
                </div>

                {/* Interactive Action Area: Upload Option on all 6 features */}
                <div className="pt-3 border-t border-gray-200 flex flex-col gap-2">
                  <input
                    type="file"
                    ref={(el) => (fileInputRefs.current[i] = el)}
                    accept={feature.accept}
                    onChange={(e) => handleFileChange(e, feature, i)}
                    className="hidden"
                  />

                  <button
                    onClick={() => handleTriggerUpload(i)}
                    disabled={uploadingIndex === i}
                    className="btn-brutal btn-brutal-sm flex items-center justify-center gap-1.5 w-full cursor-pointer disabled:opacity-50"
                    style={{
                      background: 'var(--color-quelle-yellow)',
                      border: '2px solid var(--color-quelle-ink)',
                      padding: '8px 12px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    {uploadingIndex === i ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Uploading to Library...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} strokeWidth={2.5} />
                        <span>Upload File</span>
                      </>
                    )}
                  </button>

                  <Link
                    to={feature.link}
                    className="text-xs font-bold text-center text-gray-700 hover:text-black py-1 flex items-center justify-center gap-1 no-underline"
                  >
                    <span>Open in Platform</span>
                    <ExternalLink size={11} strokeWidth={2.5} />
                  </Link>
                </div>
              </div>
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
