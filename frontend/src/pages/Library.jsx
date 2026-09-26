import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Table2,
  FileType,
  Search,
  Grid3X3,
  List,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Filter,
  ScanLine,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

/* ── Mock Data ── */
const MOCK_DOCUMENTS = [
  {
    id: 'doc-1', filename: 'Q2_Financial_Report.pdf', type: 'native_pdf',
    status: 'indexed', pages: 12, uploadedAt: '2026-09-20', tags: ['finance', 'quarterly'],
    size: '2.4 MB',
  },
  {
    id: 'doc-2', filename: 'Q3_Outlook_Manual.pdf', type: 'scanned_pdf',
    status: 'indexed', pages: 28, uploadedAt: '2026-09-18', tags: ['outlook', 'manual'],
    size: '8.1 MB',
  },
  {
    id: 'doc-3', filename: 'Invoice_Sept_2026.png', type: 'image',
    status: 'processing', pages: 1, uploadedAt: '2026-09-25', tags: ['invoice'],
    size: '1.2 MB',
  },
  {
    id: 'doc-4', filename: 'Employee_Directory.xlsx', type: 'table_doc',
    status: 'indexed', pages: 3, uploadedAt: '2026-09-22', tags: ['hr', 'directory'],
    size: '340 KB',
  },
  {
    id: 'doc-5', filename: 'Policy_Document_v3.docx', type: 'office_doc',
    status: 'queued', pages: 45, uploadedAt: '2026-09-26', tags: ['policy', 'compliance'],
    size: '5.6 MB',
  },
  {
    id: 'doc-6', filename: 'Architecture_Diagram.tiff', type: 'image',
    status: 'failed', pages: 1, uploadedAt: '2026-09-24', tags: ['engineering'],
    size: '12.3 MB',
  },
  {
    id: 'doc-7', filename: 'Board_Meeting_Notes.pdf', type: 'scanned_pdf',
    status: 'extracting', pages: 8, uploadedAt: '2026-09-23', tags: ['board', 'meeting'],
    size: '3.7 MB',
  },
  {
    id: 'doc-8', filename: 'Revenue_Projections.csv', type: 'table_doc',
    status: 'embedding', pages: 1, uploadedAt: '2026-09-25', tags: ['finance', 'projection'],
    size: '89 KB',
  },
];

const DOC_TYPE_CONFIG = {
  native_pdf: { icon: FileText, color: 'icon-chip-green', label: 'PDF' },
  scanned_pdf: { icon: ScanLine, color: 'icon-chip-orange', label: 'Scanned' },
  image: { icon: ImageIcon, color: 'icon-chip-pink', label: 'Image' },
  table_doc: { icon: Table2, color: 'icon-chip-teal', label: 'Table' },
  office_doc: { icon: FileType, color: 'icon-chip-purple', label: 'Office' },
};

const STATUS_CONFIG = {
  queued: { class: 'badge-queued', label: 'Queued', icon: Clock },
  classifying: { class: 'badge-classifying', label: 'Classifying', icon: Loader2 },
  extracting: { class: 'badge-extracting', label: 'Extracting', icon: Loader2 },
  embedding: { class: 'badge-embedding', label: 'Embedding', icon: Loader2 },
  processing: { class: 'badge-processing', label: 'Processing', icon: Loader2 },
  indexed: { class: 'badge-indexed', label: 'Indexed', icon: CheckCircle2 },
  failed: { class: 'badge-failed', label: 'Failed', icon: AlertTriangle },
};

const FILTER_OPTIONS = [
  { key: 'all', label: 'All Documents' },
  { key: 'native_pdf', label: 'PDF' },
  { key: 'scanned_pdf', label: 'Scanned' },
  { key: 'image', label: 'Images' },
  { key: 'table_doc', label: 'Tables' },
  { key: 'office_doc', label: 'Office' },
];

const STATUS_FILTERS = [
  { key: 'all', label: 'All Status' },
  { key: 'indexed', label: 'Indexed' },
  { key: 'processing', label: 'Processing' },
  { key: 'queued', label: 'Queued' },
  { key: 'failed', label: 'Failed' },
];

export default function LibraryView() {
  const [documents] = useState(MOCK_DOCUMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const fileInputRef = useRef(null);

  /* ── Drag-and-drop ── */
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const simulateUpload = (files) => {
    const newItems = files.map((f, i) => ({
      id: `upload-${Date.now()}-${i}`,
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(1) + ' MB',
      progress: 0,
    }));
    setUploadQueue((prev) => [...prev, ...newItems]);

    // Simulate progress
    newItems.forEach((item) => {
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 20;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          setTimeout(() => {
            setUploadQueue((prev) => prev.filter((u) => u.id !== item.id));
          }, 1000);
        }
        setUploadQueue((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, progress: Math.min(p, 100) } : u))
        );
      }, 300);
    });
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) {
      simulateUpload(files);
    }
  }, []);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) {
      simulateUpload(files);
    }
  };

  const removeUpload = (id) => {
    setUploadQueue((prev) => prev.filter((u) => u.id !== id));
  };

  /* ── Filter documents ── */
  const filtered = documents.filter((doc) => {
    const matchSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchType = typeFilter === 'all' || doc.type === typeFilter;
    const matchStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* ── Page Header ── */}
      <div className="mb-8 stagger-children">
        <h1
          className="text-3xl sm:text-4xl mb-2"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.02em' }}
        >
          Document Library
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-quelle-ink-muted)' }}>
          Upload, manage, and search your document collection. {documents.length} documents in workspace.
        </p>
      </div>

      {/* ── Upload Dropzone ── */}
      <div
        className={`dropzone-brutal mb-8 animate-fade-in-up ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload documents"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.docx,.xlsx,.csv,.zip"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="icon-chip icon-chip-yellow icon-chip-lg flex items-center justify-center animate-bounce-subtle">
            <Upload size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Drop files here or click to upload
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-quelle-ink-muted)' }}>
              PDF, PNG, JPG, TIFF, DOCX, XLSX, CSV, ZIP — up to 200MB per file
            </p>
          </div>
          <button
            className="btn-brutal btn-brutal-primary mt-2"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            <Plus size={16} strokeWidth={3} />
            Choose Files
          </button>
        </div>
      </div>

      {/* ── Upload Progress Queue ── */}
      {uploadQueue.length > 0 && (
        <div className="mb-6 space-y-2 animate-fade-in-up">
          {uploadQueue.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3"
              style={{
                border: '2px solid var(--color-quelle-ink)',
                borderRadius: 'var(--radius-brutal-sm)',
                background: 'white',
              }}
            >
              <div className="icon-chip icon-chip-yellow icon-chip-sm flex items-center justify-center">
                <FileText size={16} strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold truncate">{item.name}</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                    {Math.round(item.progress)}%
                  </span>
                </div>
                <div className="progress-brutal">
                  <div
                    className="progress-brutal-fill"
                    style={{
                      width: `${item.progress}%`,
                      background: item.progress >= 100 ? 'var(--color-quelle-green)' : 'var(--color-quelle-yellow)',
                    }}
                  />
                </div>
              </div>
              <button
                onClick={() => removeUpload(item.id)}
                className="flex-shrink-0 p-1 cursor-pointer"
                style={{ background: 'none', border: 'none' }}
                aria-label="Cancel upload"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Search & Filter Bar ── */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              strokeWidth={2.5}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-quelle-ink-muted)' }}
            />
            <input
              type="text"
              placeholder="Search documents by name or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-brutal pl-10"
            />
          </div>
          <div className="segmented-toggle hidden sm:inline-flex">
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <Grid3X3 size={16} strokeWidth={2.5} />
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <List size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 mr-2">
            <Filter size={14} strokeWidth={2.5} style={{ color: 'var(--color-quelle-ink-muted)' }} />
            <span className="text-xs font-bold uppercase" style={{ color: 'var(--color-quelle-ink-muted)' }}>
              Type:
            </span>
          </div>
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              className={`filter-pill ${typeFilter === opt.key ? 'active' : ''}`}
              onClick={() => setTypeFilter(opt.key)}
            >
              {opt.label}
            </button>
          ))}

          <div
            className="w-px h-6 mx-2 hidden sm:block"
            style={{ background: 'var(--color-quelle-border-light)' }}
          />

          <div className="flex items-center gap-1 mr-2">
            <span className="text-xs font-bold uppercase" style={{ color: 'var(--color-quelle-ink-muted)' }}>
              Status:
            </span>
          </div>
          {STATUS_FILTERS.map((opt) => (
            <button
              key={opt.key}
              className={`filter-pill ${statusFilter === opt.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Documents Grid/List ── */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-16 brutal-card"
          style={{ background: 'var(--color-quelle-cream)' }}
        >
          <Search size={32} strokeWidth={2} style={{ color: 'var(--color-quelle-ink-muted)', margin: '0 auto 12px' }} />
          <p className="text-base font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            No documents found
          </p>
          <p className="text-sm" style={{ color: 'var(--color-quelle-ink-muted)' }}>
            Try adjusting your filters or upload new documents.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
          {filtered.map((doc) => {
            const typeConfig = DOC_TYPE_CONFIG[doc.type] || DOC_TYPE_CONFIG.native_pdf;
            const statusConfig = STATUS_CONFIG[doc.status] || STATUS_CONFIG.queued;
            const TypeIcon = typeConfig.icon;
            const StatusIcon = statusConfig.icon;
            return (
              <Link
                key={doc.id}
                to={`/viewer/${doc.id}`}
                className="brutal-card p-5 flex flex-col gap-3 no-underline"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="flex items-start justify-between">
                  <div className={`icon-chip ${typeConfig.color} flex items-center justify-center`}>
                    <TypeIcon size={20} strokeWidth={2.5} />
                  </div>
                  <span className={`badge-brutal ${statusConfig.class} flex items-center gap-1`}>
                    <StatusIcon size={10} strokeWidth={3} />
                    {statusConfig.label}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3
                    className="text-sm font-bold truncate mb-1"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {doc.filename}
                  </h3>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                    <span>{doc.pages} {doc.pages === 1 ? 'page' : 'pages'}</span>
                    <span>•</span>
                    <span>{doc.size}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {doc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: 'var(--color-quelle-cream)',
                        border: '1.5px solid var(--color-quelle-border-light)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2 stagger-children">
          {filtered.map((doc) => {
            const typeConfig = DOC_TYPE_CONFIG[doc.type] || DOC_TYPE_CONFIG.native_pdf;
            const statusConfig = STATUS_CONFIG[doc.status] || STATUS_CONFIG.queued;
            const TypeIcon = typeConfig.icon;
            const StatusIcon = statusConfig.icon;
            return (
              <Link
                key={doc.id}
                to={`/viewer/${doc.id}`}
                className="brutal-card p-4 flex items-center gap-4 no-underline"
                style={{ textDecoration: 'none', color: 'inherit', boxShadow: 'var(--shadow-brutal-sm)' }}
              >
                <div className={`icon-chip ${typeConfig.color} icon-chip-sm flex items-center justify-center`}>
                  <TypeIcon size={16} strokeWidth={2.5} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold truncate" style={{ fontFamily: 'var(--font-display)' }}>
                    {doc.filename}
                  </h3>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                    <span>{typeConfig.label}</span>
                    <span>•</span>
                    <span>{doc.pages} pages</span>
                    <span>•</span>
                    <span>{doc.size}</span>
                    <span>•</span>
                    <span>{doc.uploadedAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex gap-1 hidden sm:flex">
                    {doc.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: 'var(--color-quelle-cream)',
                          border: '1.5px solid var(--color-quelle-border-light)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className={`badge-brutal ${statusConfig.class} flex items-center gap-1`}>
                    <StatusIcon size={10} strokeWidth={3} />
                    {statusConfig.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
