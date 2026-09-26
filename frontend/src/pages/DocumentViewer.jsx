import React, { useState, useEffect } from 'react';
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
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';

/* ── Fallback Mock data for static testing ── */
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
        text: "This report provides a comprehensive overview of the company's financial performance during Q2 2026. Revenue increased from $12.3M in Q1 to $14.1M in Q2, representing a 14.6% quarter-over-quarter growth. Operating expenses remained stable at $8.2M.",
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
];

function getConfidenceColor(confidence) {
  if (confidence === null || confidence === undefined) return null;
  if (confidence >= 0.8) return 'var(--color-quelle-green)';
  if (confidence >= 0.6) return 'var(--color-quelle-yellow)';
  return 'var(--color-quelle-red)';
}

function getConfidenceLabel(confidence) {
  if (confidence === null || confidence === undefined) return null;
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.6) return 'Medium';
  return 'Low';
}

export default function DocumentViewer() {
  const { id } = useParams();
  const [doc, setDoc] = useState(MOCK_DOC);
  const [pagesData, setPagesData] = useState(MOCK_SECTIONS);
  const [currentPage, setCurrentPage] = useState(1);
  const [showOcrOverlay, setShowOcrOverlay] = useState(true);
  const [tableViewMode, setTableViewMode] = useState('structured');
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDocument() {
      if (!id) return;
      setLoading(true);
      try {
        const data = await api.documents.get(id);
        if (data && data.document_id) {
          setDoc({
            id: data.document_id,
            filename: data.filename,
            type: data.doc_type,
            status: data.status,
            pages: Math.max(data.page_count || 1, data.pages?.length || 1),
            language: data.metadata?.language || 'en',
            metadata: data.metadata || {},
          });

          if (Array.isArray(data.pages) && data.pages.length > 0) {
            const mappedPages = data.pages.map((p) => ({
              page: p.page_number,
              sections: (p.sections || []).map((s) => ({
                id: s.id,
                type: s.type || 'text',
                text: s.text || s.section_title || '',
                confidence: s.ocr_confidence,
                data: s.data || [],
                caption: s.caption || '',
                bbox: s.bbox,
              })),
            }));
            setPagesData(mappedPages);
          }
        }
      } catch (err) {
        console.warn('Document details fetch failed, falling back to mock view:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDocument();
  }, [id]);

  const pageData = pagesData.find((p) => p.page === currentPage) || pagesData[0];
  const totalPages = doc.pages || 1;

  if (loading) {
    return (
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-16 text-center">
        <Loader2 size={36} className="animate-spin mx-auto mb-3" />
        <h2 className="text-lg font-bold">Loading Document Inspector...</h2>
      </main>
    );
  }

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
              {doc.filename}
            </h1>
            <p className="text-xs" style={{ color: 'var(--color-quelle-ink-muted)' }}>
              {doc.type?.toUpperCase()} • {totalPages} pages • {doc.language.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-brutal badge-indexed flex items-center gap-1">
            <CheckCircle2 size={10} strokeWidth={3} />
            {doc.status?.toUpperCase() || 'INDEXED'}
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
        {/* ── Left Panel: Page Overview / Render ── */}
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
                style={{
                  border: '2px solid var(--color-quelle-ink)',
                  borderRadius: 'var(--radius-brutal-sm)',
                  background: 'white',
                }}
                aria-label="Zoom out"
              >
                <ZoomOut size={14} strokeWidth={2.5} />
              </button>
              <span className="text-xs font-bold w-12 text-center">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                className="flex items-center justify-center w-8 h-8 cursor-pointer"
                style={{
                  border: '2px solid var(--color-quelle-ink)',
                  borderRadius: 'var(--radius-brutal-sm)',
                  background: 'white',
                }}
                aria-label="Zoom in"
              >
                <ZoomIn size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Page content view with OCR overlay */}
          <div
            className="flex-1 overflow-auto p-6 flex items-center justify-center"
            style={{ background: 'var(--color-quelle-offwhite)' }}
          >
            <div
              className="relative shadow-lg transition-transform origin-top"
              style={{
                width: `${(600 * zoom) / 100}px`,
                minHeight: `${(800 * zoom) / 100}px`,
                background: 'white',
                border: '1px solid var(--color-quelle-border-light)',
                padding: '32px',
              }}
            >
              {/* Document Layout Blocks */}
              <div className="space-y-4">
                {pageData?.sections.map((section, idx) => (
                  <div
                    key={idx}
                    className={`relative p-2 rounded transition-colors ${
                      showOcrOverlay ? 'hover:bg-yellow-50' : ''
                    }`}
                    style={{
                      border:
                        showOcrOverlay && section.confidence !== null && section.confidence !== undefined
                          ? `1.5px dashed ${getConfidenceColor(section.confidence)}`
                          : 'none',
                    }}
                  >
                    {showOcrOverlay && section.confidence !== null && section.confidence !== undefined && (
                      <span
                        className="absolute -top-2 right-2 text-[9px] font-bold px-1.5 py-0.2 rounded"
                        style={{
                          background: getConfidenceColor(section.confidence),
                          color: 'black',
                        }}
                      >
                        {Math.round(section.confidence * 100)}%
                      </span>
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
                    {section.type === 'table' && section.data && section.data.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-[9px]" style={{ borderCollapse: 'collapse' }}>
                          <tbody>
                            {section.data.map((row, ri) => (
                              <tr key={ri}>
                                {Array.isArray(row) &&
                                  row.map((cell, ci) => (
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
                          <ImageIcon
                            size={20}
                            style={{ color: 'var(--color-quelle-ink-muted)', margin: '0 auto 4px' }}
                          />
                          <p className="text-[9px]" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                            {section.caption || 'Extracted Image / Diagram'}
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

        {/* ── Right Panel: Extracted Content DOM ── */}
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
              Extracted Content DOM
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
                OCR Confidence
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
                  <FileText size={12} /> Raw
                </button>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {pageData?.sections?.map((section, i) => (
              <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                {/* Confidence indicator */}
                {showOcrOverlay && section.confidence !== null && section.confidence !== undefined && (
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: getConfidenceColor(section.confidence) }}
                    />
                    <span className="text-xs font-bold" style={{ color: getConfidenceColor(section.confidence) }}>
                      OCR Confidence: {getConfidenceLabel(section.confidence)} ({Math.round(section.confidence * 100)}%)
                    </span>
                    {section.confidence < 0.6 && (
                      <span className="badge-brutal badge-low text-[0.6rem] py-0.5 px-2 flex items-center gap-1">
                        <AlertTriangle size={8} />
                        Low Confidence Gate
                      </span>
                    )}
                  </div>
                )}

                {section.type === 'heading' && (
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                    {section.text}
                  </h3>
                )}

                {section.type === 'text' && (
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      color: 'var(--color-quelle-ink-light)',
                      borderLeft:
                        section.confidence !== null && section.confidence < 0.6
                          ? '3px solid var(--color-quelle-red)'
                          : 'none',
                      paddingLeft: section.confidence !== null && section.confidence < 0.6 ? '12px' : '0',
                    }}
                  >
                    {section.text}
                  </p>
                )}

                {section.type === 'table' && section.data && section.data.length > 0 && (
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
                          {Array.isArray(section.data[0]) &&
                            section.data[0].map((h, hi) => <th key={hi}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {section.data.slice(1).map((row, ri) => (
                          <tr key={ri}>
                            {Array.isArray(row) && row.map((cell, ci) => <td key={ci}>{cell}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
