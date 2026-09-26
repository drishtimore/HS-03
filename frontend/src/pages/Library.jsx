import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  Trash2,
  FolderOpen,
  RefreshCw,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

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

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function LibraryView() {
  const { activeWorkspace, workspaces, setActiveWorkspace } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const fileInputRef = useRef(null);

  const fetchDocuments = useCallback(async () => {
    if (!activeWorkspace?.id) return;
    try {
      const data = await api.documents.list(activeWorkspace.id);
      const mapped = data.map((doc) => ({
        id: doc.id,
        filename: doc.filename,
        type: doc.doc_type || 'native_pdf',
        status: doc.status || 'queued',
        pages: doc.page_count || 1,
        uploadedAt: doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Just now',
        tags: [doc.doc_type || 'document'].filter(Boolean),
        size: formatBytes(doc.file_size_bytes),
      }));
      setDocuments(mapped);
    } catch (err) {
      console.warn('Failed to load documents from backend, retaining current state:', err);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace?.id]);

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 8000);
    return () => clearInterval(interval);
  }, [fetchDocuments]);

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

  const handleRealUpload = async (files) => {
    if (!activeWorkspace?.id || files.length === 0) return;

    const newItems = files.map((f, i) => ({
      id: `upload-${Date.now()}-${i}`,
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(1) + ' MB',
      progress: 25,
      status: 'Uploading...',
    }));
    setUploadQueue((prev) => [...prev, ...newItems]);

    try {
      // Send real upload to backend
      const res = await api.documents.upload(activeWorkspace.id, files);
      
      // Update progress to 60%
      setUploadQueue((prev) =>
        prev.map((u) => ({ ...u, progress: 60, status: 'Processing Pipeline...' }))
      );

      // Track uploaded document statuses
      const results = res.results || [];
      const docIds = results.map((r) => r.document_id).filter(Boolean);

      // Poll until processed
      let pollCount = 0;
      const pollInterval = setInterval(async () => {
        pollCount += 1;
        let allDone = true;

        for (const docId of docIds) {
          try {
            const st = await api.documents.getStatus(docId);
            if (st.status !== 'indexed' && st.status !== 'failed') {
              allDone = false;
            }
          } catch {
            // ignore
          }
        }

        if (allDone || pollCount >= 10) {
          clearInterval(pollInterval);
          setUploadQueue((prev) =>
            prev.map((u) => ({ ...u, progress: 100, status: 'Complete' }))
          );
          setTimeout(() => {
            setUploadQueue([]);
            fetchDocuments();
          }, 1200);
        } else {
          setUploadQueue((prev) =>
            prev.map((u) => ({ ...u, progress: Math.min(60 + pollCount * 8, 95) }))
          );
        }
      }, 1500);

      fetchDocuments();
    } catch (err) {
      console.error('Upload error:', err);
      setUploadQueue((prev) =>
        prev.map((u) => ({ ...u, progress: 100, status: `Failed: ${err.message}` }))
      );
      setTimeout(() => setUploadQueue([]), 3000);
    }
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) {
        handleRealUpload(files);
      }
    },
    [activeWorkspace?.id]
  );

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) {
      handleRealUpload(files);
    }
  };

  const removeUpload = (id) => {
    setUploadQueue((prev) => prev.filter((u) => u.id !== id));
  };

  const handleDelete = async (e, docId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this document and its indexed vector embeddings?')) {
      return;
    }
    try {
      await api.documents.delete(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  /* ── Filter documents ── */
  const filtered = documents.filter((doc) => {
    const matchSearch =
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchType = typeFilter === 'all' || doc.type === typeFilter;
    const matchStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* ── Page Header & Workspace Selector ── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-3xl sm:text-4xl mb-2"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            Document Library
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-quelle-ink-muted)' }}>
            Upload, manage, and search your document collection. {documents.length} live indexed documents.
          </p>
        </div>

        {/* Workspace Switcher */}
        {workspaces && workspaces.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase" style={{ color: 'var(--color-quelle-ink-muted)' }}>
              Workspace:
            </span>
            <select
              value={activeWorkspace?.id || ''}
              onChange={(e) => {
                const found = workspaces.find((w) => w.id === e.target.value);
                if (found) setActiveWorkspace(found);
              }}
              className="input-brutal text-sm py-1.5 px-3 font-semibold cursor-pointer"
              style={{ minWidth: '220px' }}
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name} ({ws.document_count || 0} docs)
                </option>
              ))}
            </select>
            <button
              onClick={fetchDocuments}
              className="btn-brutal btn-brutal-secondary p-2"
              title="Refresh documents"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        )}
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
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.docx,.xlsx,.csv,.txt,.zip"
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
              PDF, PNG, JPG, TIFF, DOCX, XLSX, CSV, TXT — auto-classified & OCR parsed
            </p>
          </div>
          <button
            className="btn-brutal btn-brutal-primary mt-2"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
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
                    {item.status} ({Math.round(item.progress)}%)
                  </span>
                </div>
                <div className="progress-brutal">
                  <div
                    className="progress-brutal-fill"
                    style={{
                      width: `${item.progress}%`,
                      background:
                        item.progress >= 100 ? 'var(--color-quelle-green)' : 'var(--color-quelle-yellow)',
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
      {loading ? (
        <div className="text-center py-16 brutal-card" style={{ background: 'var(--color-quelle-cream)' }}>
          <Loader2 size={32} className="animate-spin mx-auto mb-2 text-gray-500" />
          <p className="text-base font-bold">Loading workspace documents...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 brutal-card" style={{ background: 'var(--color-quelle-cream)' }}>
          <Search size={32} strokeWidth={2} style={{ color: 'var(--color-quelle-ink-muted)', margin: '0 auto 12px' }} />
          <p className="text-base font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            No documents found
          </p>
          <p className="text-sm" style={{ color: 'var(--color-quelle-ink-muted)' }}>
            Upload files above to begin ingestion and indexing.
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
                className="brutal-card p-5 flex flex-col gap-3 no-underline group relative"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="flex items-start justify-between">
                  <div className={`icon-chip ${typeConfig.color} flex items-center justify-center`}>
                    <TypeIcon size={20} strokeWidth={2.5} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`badge-brutal ${statusConfig.class} flex items-center gap-1`}>
                      <StatusIcon size={10} strokeWidth={3} className={doc.status === 'processing' || doc.status === 'extracting' ? 'animate-spin' : ''} />
                      {statusConfig.label}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, doc.id)}
                      className="p-1 hover:text-red-600 rounded opacity-70 hover:opacity-100 transition-opacity"
                      title="Delete document"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold truncate mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                    {doc.filename}
                  </h3>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                    <span>
                      {doc.pages} {doc.pages === 1 ? 'page' : 'pages'}
                    </span>
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
                  <button
                    onClick={(e) => handleDelete(e, doc.id)}
                    className="p-1 hover:text-red-600 rounded ml-1"
                    title="Delete document"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
