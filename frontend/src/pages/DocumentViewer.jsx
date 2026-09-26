import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Download,
  Layers,
  Eye,
  EyeOff,
  Table2,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  FileText,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Maximize2,
  RotateCw,
} from 'lucide-react';

/* ── Mock extracted page data ── */
const MOCK_DOC = {
  id: 'doc-1',
  filename: 'Q2_Financial_Report.pdf',
  type: 'scanned_pdf',
  status: 'indexed',
  pages: 4,
  language: 'en',
  metadata: { title: 'Q2 2026 Financial Report', author: 'Finance Team' },
};

const MOCK_SECTIONS = [
  {
    page: 1,
    sections: [
      { type: 'heading', text: 'Quarterly Financial Summary', confidence: 0.98 },
      {
        type: 'text',
        text: 'This report provides a comprehensive overview of the company\'s financial performance during Q2 2026. Revenue increased from $12.3M in Q1 to $14.1M in Q2, representing a 14.6% quarter-over-quarter growth. Operating expenses remained stable at $8.2M.',
        confidence: 0.92,
      },
      {
        type: 'table',
        data: [
          ['Metric', 'Q1 2026', 'Q2 2026', 'Change'],
          ['Revenue', '$12.3M', '$14.1M', '+14.6%'],
          ['COGS', '$4.1M', '$4.5M', '+9.8%'],
          ['Gross Profit', '$8.2M', '$9.6M', '+17.1%'],
          ['Operating Expenses', '$8.0M', '$8.2M', '+2.5%'],
          ['Net Income', '$0.2M', '$1.4M', '+600%'],
        ],
        confidence: 0.87,
      },
    ],
  },
  {
    page: 2,
    sections: [
      { type: 'heading', text: 'Revenue Breakdown by Segment', confidence: 0.96 },
      {
        type: 'text',
        text: 'Enterprise segment contributed 62% of total revenue ($8.74M), while SMB segment accounted for 28% ($3.95M). The remaining 10% ($1.41M) came from individual licenses and consulting services.',
        confidence: 0.89,
      },
      {
        type: 'image',
        caption: 'Bar chart showing revenue distribution across Enterprise (62%), SMB (28%), and Individual (10%) segments.',
        confidence: null,
      },
      {
        type: 'text',
        text: 'Enterprise deal sizes have increased by an average of 23% compared to the previous quarter, driven by platform adoption in Fortune 500 accounts. The sales pipeline for Q3 remains strong with $22M in qualified opportunities.',
        confidence: 0.45,
      },
    ],
  },
  {
    page: 3,
    sections: [
      { type: 'heading', text: 'Risk Factors & Outlook', confidence: 0.95 },
      {
        type: 'text',
        text: 'Supply-chain delays remain the primary risk to Q3 targets. The logistics team has identified alternative vendors to mitigate potential disruptions. Currency fluctuations in European markets may impact international revenue by 2-4%.',
        confidence: 0.91,
      },
      {
        type: 'text',
        text: 'Despite these challenges, management remains confident in achieving the full-year revenue target of $58M, supported by a strong product roadmap and expanding customer base.',
        confidence: 0.88,
      },
    ],
  },
  {
    page: 4,
    sections: [
      { type: 'heading', text: 'Appendix: Detailed Financial Statements', confidence: 0.97 },
      {
        type: 'table',
        data: [
          ['Account', 'Q1 2026', 'Q2 2026'],
          ['Cash & Equivalents', '$15.2M', '$18.6M'],
          ['Accounts Receivable', '$3.1M', '$4.2M'],
          ['Total Assets', '$45.8M', '$52.3M'],
          ['Total Liabilities', '$12.1M', '$11.8M'],
          ['Shareholder Equity', '$33.7M', '$40.5M'],
        ],
        confidence: 0.93,
      },
    ],
  },
];

function getConfidenceColor(confidence) {
  if (confidence === null) return null;
  if (confidence >= 0.8) return 'var(--color-quelle-green)';
  if (confidence >= 0.6) return 'var(--color-quelle-yellow)';
  return 'var(--color-quelle-red)';
}

function getConfidenceLabel(confidence) {
  if (confidence === null) return null;
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.6) return 'Medium';
  return 'Low';
}

export default function DocumentViewer() {
  const { id } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [showOcrOverlay, setShowOcrOverlay] = useState(true);
  const [tableViewMode, setTableViewMode] = useState('structured');
  const [zoom, setZoom] = useState(100);

  const pageData = MOCK_SECTIONS.find((p) => p.page === currentPage);
  const totalPages = MOCK_DOC.pages;

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      {/* ── Header Bar ── */}
      <div
        className="flex items-center justify-between gap-4 mb-6 p-4 animate-fade-in"
        style={{
          border: '2.5px solid var(--color-quelle-ink)',
          borderRadius: 'var(--radius-brutal)',
          background: 'white',
          boxShadow: 'var(--shadow-brutal-sm)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/library"
            className="flex items-center justify-center w-9 h-9 flex-shrink-0"
            style={{
              border: '2px solid var(--color-quelle-ink)',
              borderRadius: 'var(--radius-brutal-sm)',
              background: 'white',
              color: 'var(--color-quelle-ink)',
              textDecoration: 'none',
            }}
            aria-label="Back to library"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </Link>
          <div className="icon-chip icon-chip-orange icon-chip-sm flex items-center justify-center">
            <ScanLine size={16} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h1
              className="text-base font-bold truncate"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {MOCK_DOC.filename}
            </h1>
            <p className="text-xs" style={{ color: 'var(--color-quelle-ink-muted)' }}>
              {MOCK_DOC.metadata.author} • {totalPages} pages • {MOCK_DOC.language.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-brutal badge-indexed flex items-center gap-1">
            <CheckCircle2 size={10} strokeWidth={3} />
            Indexed
          </span>
        </div>
      </div>

      {/* ── Split View ── */}
      <div
        className="flex flex-col lg:flex-row gap-0 animate-fade-in-up"
        style={{
          border: '2.5px solid var(--color-quelle-ink)',
          borderRadius: 'var(--radius-brutal-lg)',
          overflow: 'hidden',
          background: 'white',
          boxShadow: 'var(--shadow-brutal)',
          minHeight: '70vh',
        }}
      >
        {/* ── Left Panel: Page Image ── */}
        <div
          className="flex-1 flex flex-col"
          style={{ borderRight: '2.5px solid var(--color-quelle-ink)' }}
        >
          {/* Page nav bar */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              borderBottom: '2.5px solid var(--color-quelle-ink)',
              background: 'var(--color-quelle-cream)',
            }}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="flex items-center justify-center w-8 h-8 cursor-pointer disabled:opacity-30"
                style={{
                  border: '2px solid var(--color-quelle-ink)',
                  borderRadius: 'var(--radius-brutal-sm)',
                  background: 'white',
                }}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>
              <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="flex items-center justify-center w-8 h-8 cursor-pointer disabled:opacity-30"
                style={{
                  border: '2px solid var(--color-quelle-ink)',
                  borderRadius: 'var(--radius-brutal-sm)',
                  background: 'white',
                }}
                aria-label="Next page"
              >
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 25))}
                className="flex items-center justify-center w-8 h-8 cursor-pointer"
                style={{ border: '2px solid var(--color-quelle-ink)', borderRadius: 'var(--radius-brutal-sm)', background: 'white' }}
                aria-label="Zoom out"
              >
                <ZoomOut size={14} strokeWidth={2.5} />
              </button>
              <span className="text-xs font-bold w-10 text-center">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                className="flex items-center justify-center w-8 h-8 cursor-pointer"
                style={{ border: '2px solid var(--color-quelle-ink)', borderRadius: 'var(--radius-brutal-sm)', background: 'white' }}
                aria-label="Zoom in"
              >
                <ZoomIn size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Page render area (simulated) */}
          <div
            className="flex-1 flex items-center justify-center p-8"
            style={{ background: '#F5F5F0', minHeight: '400px' }}
          >
            <div
              className="w-full max-w-md relative"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease',
              }}
            >
              <div
                className="p-8 space-y-4"
                style={{
                  background: 'white',
                  border: '2px solid var(--color-quelle-border-light)',
                  borderRadius: 'var(--radius-brutal-sm)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  aspectRatio: '8.5/11',
                }}
              >
                {pageData?.sections.map((section, i) => (
                  <div key={i} className="relative">
                    {showOcrOverlay && section.confidence !== null && (
                      <div
                        className="absolute -left-3 top-0 bottom-0 w-1 rounded-full"
                        style={{ background: getConfidenceColor(section.confidence) }}
                      />
                    )}
                    {section.type === 'heading' && (
                      <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                        {section.text}
                      </h3>
                    )}
                    {section.type === 'text' && (
                      <p className="text-[10px] leading-relaxed" style={{ color: 'var(--color-quelle-ink-light)' }}>
                        {section.text}
                      </p>
                    )}
                    {section.type === 'table' && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-[9px]" style={{ borderCollapse: 'collapse' }}>
                          <tbody>
                            {section.data.map((row, ri) => (
                              <tr key={ri}>
                                {row.map((cell, ci) => (
                                  <td
                                    key={ci}
                                    className="px-1.5 py-1"
                                    style={{
                                      border: '1px solid var(--color-quelle-border-light)',
                                      fontWeight: ri === 0 ? 700 : 400,
                                      background: ri === 0 ? 'var(--color-quelle-cream)' : 'transparent',
                                      fontSize: '9px',
                                    }}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {section.type === 'image' && (
                      <div
                        className="flex items-center justify-center p-4 text-center"
                        style={{
                          border: '2px dashed var(--color-quelle-border-light)',
                          borderRadius: 'var(--radius-brutal-sm)',
                          background: 'var(--color-quelle-offwhite)',
                        }}
                      >
                        <div>
                          <ImageIcon size={20} style={{ color: 'var(--color-quelle-ink-muted)', margin: '0 auto 4px' }} />
                          <p className="text-[9px]" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                            {section.caption}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Panel: Extracted Content ── */}
        <div className="flex-1 flex flex-col max-w-full lg:max-w-[50%]">
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              borderBottom: '2.5px solid var(--color-quelle-ink)',
              background: 'var(--color-quelle-cream)',
            }}
          >
            <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Extracted Content
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOcrOverlay(!showOcrOverlay)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold cursor-pointer"
                style={{
                  border: '2px solid var(--color-quelle-ink)',
                  borderRadius: 'var(--radius-brutal-sm)',
                  background: showOcrOverlay ? 'var(--color-quelle-yellow)' : 'white',
                }}
                aria-label="Toggle OCR overlay"
              >
                {showOcrOverlay ? <Eye size={12} strokeWidth={2.5} /> : <EyeOff size={12} strokeWidth={2.5} />}
                OCR
              </button>
              <div className="segmented-toggle">
                <button
                  className={tableViewMode === 'structured' ? 'active' : ''}
                  onClick={() => setTableViewMode('structured')}
                  style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                >
                  <Table2 size={12} /> Table
                </button>
                <button
                  className={tableViewMode === 'raw' ? 'active' : ''}
                  onClick={() => setTableViewMode('raw')}
                  style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                >
                  <ImageIcon size={12} /> Raw
                </button>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {pageData?.sections.map((section, i) => (
              <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                {/* Confidence indicator */}
                {showOcrOverlay && section.confidence !== null && (
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: getConfidenceColor(section.confidence) }}
                    />
                    <span className="text-xs font-bold" style={{ color: getConfidenceColor(section.confidence) }}>
                      OCR: {getConfidenceLabel(section.confidence)} ({Math.round(section.confidence * 100)}%)
                    </span>
                    {section.confidence < 0.6 && (
                      <span className="badge-brutal badge-low text-[0.6rem] py-0.5 px-2 flex items-center gap-1">
                        <AlertTriangle size={8} />
                        Low Confidence
                      </span>
                    )}
                  </div>
                )}

                {section.type === 'heading' && (
                  <h3
                    className="text-lg font-bold"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {section.text}
                  </h3>
                )}

                {section.type === 'text' && (
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      color: 'var(--color-quelle-ink-light)',
                      borderLeft: section.confidence < 0.6
                        ? '3px solid var(--color-quelle-red)'
                        : 'none',
                      paddingLeft: section.confidence < 0.6 ? '12px' : '0',
                    }}
                  >
                    {section.text}
                  </p>
                )}

                {section.type === 'table' && (
                  <div
                    className="overflow-x-auto"
                    style={{
                      border: '2.5px solid var(--color-quelle-ink)',
                      borderRadius: 'var(--radius-brutal)',
                      overflow: 'hidden',
                    }}
                  >
                    <table className="table-brutal">
                      <thead>
                        <tr>
                          {section.data[0].map((h, hi) => (
                            <th key={hi}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.data.slice(1).map((row, ri) => (
                          <tr key={ri}>
                            {row.map((cell, ci) => (
                              <td key={ci}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {section.type === 'image' && (
                  <div
                    className="p-4"
                    style={{
                      border: '2.5px solid var(--color-quelle-ink)',
                      borderRadius: 'var(--radius-brutal)',
                      background: 'var(--color-quelle-cream)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon size={16} strokeWidth={2.5} style={{ color: 'var(--color-quelle-ink-muted)' }} />
                      <span className="text-xs font-bold uppercase" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                        Extracted Image Caption
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-quelle-ink-light)' }}>
                      {section.caption}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Utility Rail (desktop only) ── */}
      <div className="utility-rail hidden lg:flex">
        <button aria-label="Zoom in" onClick={() => setZoom(Math.min(200, zoom + 25))}>
          <ZoomIn size={16} strokeWidth={2.5} />
        </button>
        <button aria-label="Zoom out" onClick={() => setZoom(Math.max(50, zoom - 25))}>
          <ZoomOut size={16} strokeWidth={2.5} />
        </button>
        <button aria-label="Toggle OCR overlay" onClick={() => setShowOcrOverlay(!showOcrOverlay)}>
          {showOcrOverlay ? <Eye size={16} strokeWidth={2.5} /> : <EyeOff size={16} strokeWidth={2.5} />}
        </button>
        <button aria-label="Download">
          <Download size={16} strokeWidth={2.5} />
        </button>
        <button aria-label="Rotate">
          <RotateCw size={16} strokeWidth={2.5} />
        </button>
      </div>
    </main>
  );
}
