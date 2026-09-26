import React, { useState } from 'react';
import {
  BarChart3,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Users,
  HardDrive,
  Search,
  RotateCcw,
  Trash2,
  Eye,
  Filter,
  Calendar,
  User,
  Download,
  TrendingUp,
  Loader2,
  XCircle,
  Database,
  Cpu,
  Zap,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';

/* ── Mock Pipeline Health Data ── */
const PIPELINE_STATS = [
  { label: 'Queue Depth', value: '12', icon: Clock, color: 'icon-chip-purple', trend: '+3', trendUp: true },
  { label: 'Avg Processing', value: '4.2s', icon: Zap, color: 'icon-chip-yellow', trend: '-0.8s', trendUp: false },
  { label: 'Failure Rate', value: '2.1%', icon: AlertTriangle, color: 'icon-chip-red', trend: '-0.5%', trendUp: false },
  { label: 'Indexed Today', value: '47', icon: CheckCircle2, color: 'icon-chip-green', trend: '+12', trendUp: true },
];

const USAGE_STATS = [
  { label: 'Queries Today', value: '234', icon: MessageSquare, color: 'icon-chip-teal' },
  { label: 'Active Users', value: '18', icon: Users, color: 'icon-chip-pink' },
  { label: 'Storage Used', value: '12.4 GB', icon: HardDrive, color: 'icon-chip-orange' },
  { label: 'Total Documents', value: '1,247', icon: FileText, color: 'icon-chip-green' },
];

const STAGE_METRICS = [
  { stage: 'Classification', avg: '0.3s', success: 99.2, count: 1247, color: 'var(--color-quelle-indigo)' },
  { stage: 'Text Extraction', avg: '1.8s', success: 97.5, count: 1230, color: 'var(--color-quelle-green)' },
  { stage: 'OCR Processing', avg: '3.2s', success: 94.1, count: 482, color: 'var(--color-quelle-orange)' },
  { stage: 'Table Extraction', avg: '2.1s', success: 91.3, count: 315, color: 'var(--color-quelle-teal)' },
  { stage: 'Embedding', avg: '0.8s', success: 99.8, count: 1220, color: 'var(--color-quelle-purple)' },
  { stage: 'Indexing', avg: '0.4s', success: 99.9, count: 1218, color: 'var(--color-quelle-yellow)' },
];

const MOCK_DOCUMENTS_ADMIN = [
  { id: 'doc-1', filename: 'Q2_Financial_Report.pdf', type: 'native_pdf', status: 'indexed', pages: 12, uploadedBy: 'alice@acme.com', uploadedAt: '2026-09-20 14:32' },
  { id: 'doc-2', filename: 'Q3_Outlook_Manual.pdf', type: 'scanned_pdf', status: 'indexed', pages: 28, uploadedBy: 'bob@acme.com', uploadedAt: '2026-09-18 09:15' },
  { id: 'doc-3', filename: 'Invoice_Sept_2026.png', type: 'image', status: 'processing', pages: 1, uploadedBy: 'carol@acme.com', uploadedAt: '2026-09-25 16:45' },
  { id: 'doc-5', filename: 'Policy_Document_v3.docx', type: 'office_doc', status: 'queued', pages: 45, uploadedBy: 'alice@acme.com', uploadedAt: '2026-09-26 08:20' },
  { id: 'doc-6', filename: 'Architecture_Diagram.tiff', type: 'image', status: 'failed', pages: 1, uploadedBy: 'dave@acme.com', uploadedAt: '2026-09-24 11:30' },
  { id: 'doc-7', filename: 'Board_Meeting_Notes.pdf', type: 'scanned_pdf', status: 'extracting', pages: 8, uploadedBy: 'eve@acme.com', uploadedAt: '2026-09-23 13:22' },
];

const MOCK_AUDIT_LOG = [
  { id: 'a1', user: 'alice@acme.com', action: 'upload', target: 'Q2_Financial_Report.pdf', timestamp: '2026-09-26 10:32:15', details: 'Uploaded 2.4MB PDF' },
  { id: 'a2', user: 'bob@acme.com', action: 'query', target: 'Workspace: Finance', timestamp: '2026-09-26 10:28:44', details: 'Query: "What was Q2 revenue?"' },
  { id: 'a3', user: 'carol@acme.com', action: 'upload', target: 'Invoice_Sept_2026.png', timestamp: '2026-09-26 10:15:30', details: 'Uploaded 1.2MB image' },
  { id: 'a4', user: 'alice@acme.com', action: 'query', target: 'Workspace: Finance', timestamp: '2026-09-26 09:55:12', details: 'Query: "Compare Q1 vs Q2 expenses"' },
  { id: 'a5', user: 'dave@acme.com', action: 'delete', target: 'Old_Report_Draft.pdf', timestamp: '2026-09-26 09:40:08', details: 'Document permanently deleted' },
  { id: 'a6', user: 'eve@acme.com', action: 'login', target: 'System', timestamp: '2026-09-26 09:30:00', details: 'Successful login from 192.168.1.5' },
  { id: 'a7', user: 'bob@acme.com', action: 'reprocess', target: 'Board_Meeting_Notes.pdf', timestamp: '2026-09-25 17:45:22', details: 'Triggered reprocessing with cloud OCR' },
  { id: 'a8', user: 'alice@acme.com', action: 'export', target: 'Audit Log', timestamp: '2026-09-25 16:20:10', details: 'Exported last 30 days audit log' },
];

const STATUS_CONFIG = {
  queued: { class: 'badge-queued', label: 'Queued' },
  classifying: { class: 'badge-classifying', label: 'Classifying' },
  extracting: { class: 'badge-extracting', label: 'Extracting' },
  embedding: { class: 'badge-embedding', label: 'Embedding' },
  processing: { class: 'badge-processing', label: 'Processing' },
  indexed: { class: 'badge-indexed', label: 'Indexed' },
  failed: { class: 'badge-failed', label: 'Failed' },
};

const ACTION_COLORS = {
  upload: 'var(--color-quelle-green)',
  query: 'var(--color-quelle-purple)',
  delete: 'var(--color-quelle-red)',
  login: 'var(--color-quelle-teal)',
  reprocess: 'var(--color-quelle-orange)',
  export: 'var(--color-quelle-yellow)',
};

const ADMIN_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'documents', label: 'Documents' },
  { key: 'audit', label: 'Audit Log' },
];

const AUDIT_FILTERS = [
  { key: 'all', label: 'All Actions' },
  { key: 'upload', label: 'Uploads' },
  { key: 'query', label: 'Queries' },
  { key: 'delete', label: 'Deletes' },
  { key: 'login', label: 'Logins' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [auditFilter, setAuditFilter] = useState('all');
  const [docSearch, setDocSearch] = useState('');

  const filteredAudit = MOCK_AUDIT_LOG.filter(
    (entry) => auditFilter === 'all' || entry.action === auditFilter
  );

  const filteredDocs = MOCK_DOCUMENTS_ADMIN.filter(
    (doc) => doc.filename.toLowerCase().includes(docSearch.toLowerCase())
  );

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* ── Page Header ── */}
      <div className="mb-8 stagger-children">
        <h1
          className="text-3xl sm:text-4xl mb-2"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.02em' }}
        >
          Admin Dashboard
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-quelle-ink-muted)' }}>
          Monitor pipeline health, manage documents, and review audit logs.
        </p>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex flex-wrap gap-2 mb-8">
        {ADMIN_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`filter-pill ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════ OVERVIEW TAB ═══════ */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in-up">
          {/* Usage Stats Row */}
          <div>
            <h2
              className="text-lg font-bold mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Usage Analytics
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
              {USAGE_STATS.map((stat, i) => (
                <div key={i} className="stat-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`icon-chip ${stat.color} icon-chip-sm flex items-center justify-center`}>
                      <stat.icon size={16} strokeWidth={2.5} />
                    </div>
                  </div>
                  <div
                    className="text-2xl sm:text-3xl mb-1"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs font-medium" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline Health Stats */}
          <div>
            <h2
              className="text-lg font-bold mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Pipeline Health
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
              {PIPELINE_STATS.map((stat, i) => (
                <div key={i} className="stat-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`icon-chip ${stat.color} icon-chip-sm flex items-center justify-center`}>
                      <stat.icon size={16} strokeWidth={2.5} />
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp
                        size={12}
                        strokeWidth={2.5}
                        style={{
                          color: stat.label === 'Failure Rate'
                            ? (stat.trendUp ? 'var(--color-quelle-red)' : 'var(--color-quelle-green)')
                            : (stat.trendUp ? 'var(--color-quelle-green)' : 'var(--color-quelle-red)'),
                          transform: !stat.trendUp ? 'rotate(180deg)' : 'none',
                        }}
                      />
                      <span className="text-xs font-bold" style={{
                        color: stat.label === 'Failure Rate'
                          ? (stat.trendUp ? 'var(--color-quelle-red)' : 'var(--color-quelle-green)')
                          : (stat.trendUp ? 'var(--color-quelle-green)' : 'var(--color-quelle-red)'),
                      }}>
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                  <div
                    className="text-2xl sm:text-3xl mb-1"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs font-medium" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Per-Stage Metrics */}
          <div>
            <h2
              className="text-lg font-bold mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Processing Stages
            </h2>
            <div
              className="overflow-x-auto"
              style={{
                border: '2.5px solid var(--color-quelle-ink)',
                borderRadius: 'var(--radius-brutal-lg)',
                boxShadow: 'var(--shadow-brutal)',
                overflow: 'hidden',
              }}
            >
              <table className="table-brutal">
                <thead>
                  <tr>
                    <th>Stage</th>
                    <th>Avg Latency</th>
                    <th>Success Rate</th>
                    <th>Documents Processed</th>
                    <th>Health</th>
                  </tr>
                </thead>
                <tbody>
                  {STAGE_METRICS.map((stage, i) => (
                    <tr key={i}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{
                              background: stage.color,
                              border: '1.5px solid var(--color-quelle-ink)',
                            }}
                          />
                          <span className="font-bold text-sm">{stage.stage}</span>
                        </div>
                      </td>
                      <td className="font-semibold">{stage.avg}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="progress-brutal flex-1" style={{ maxWidth: '80px' }}>
                            <div
                              className="progress-brutal-fill"
                              style={{
                                width: `${stage.success}%`,
                                background: stage.success >= 95
                                  ? 'var(--color-quelle-green)'
                                  : stage.success >= 90
                                  ? 'var(--color-quelle-yellow)'
                                  : 'var(--color-quelle-red)',
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold">{stage.success}%</span>
                        </div>
                      </td>
                      <td className="font-semibold">{stage.count.toLocaleString()}</td>
                      <td>
                        {stage.success >= 95 ? (
                          <span className="badge-brutal badge-indexed flex items-center gap-1 w-fit">
                            <CheckCircle2 size={10} strokeWidth={3} />
                            Healthy
                          </span>
                        ) : stage.success >= 90 ? (
                          <span className="badge-brutal badge-processing flex items-center gap-1 w-fit">
                            <AlertTriangle size={10} strokeWidth={3} />
                            Warning
                          </span>
                        ) : (
                          <span className="badge-brutal badge-failed flex items-center gap-1 w-fit">
                            <XCircle size={10} strokeWidth={3} />
                            Critical
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ DOCUMENTS TAB ═══════ */}
      {activeTab === 'documents' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              strokeWidth={2.5}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-quelle-ink-muted)' }}
            />
            <input
              type="text"
              placeholder="Search documents..."
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              className="input-brutal pl-10"
            />
          </div>

          {/* Documents table */}
          <div
            className="overflow-x-auto"
            style={{
              border: '2.5px solid var(--color-quelle-ink)',
              borderRadius: 'var(--radius-brutal-lg)',
              boxShadow: 'var(--shadow-brutal)',
              overflow: 'hidden',
            }}
          >
            <table className="table-brutal">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Pages</th>
                  <th>Uploaded By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => {
                  const statusConf = STATUS_CONFIG[doc.status] || STATUS_CONFIG.queued;
                  return (
                    <tr key={doc.id}>
                      <td>
                        <Link
                          to={`/viewer/${doc.id}`}
                          className="text-sm font-bold no-underline"
                          style={{ textDecoration: 'none', color: 'var(--color-quelle-ink)' }}
                        >
                          {doc.filename}
                        </Link>
                      </td>
                      <td>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: 'var(--color-quelle-cream)',
                            border: '1.5px solid var(--color-quelle-border-light)',
                          }}
                        >
                          {doc.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-brutal ${statusConf.class}`}>
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="font-semibold">{doc.pages}</td>
                      <td className="text-xs">{doc.uploadedBy}</td>
                      <td className="text-xs">{doc.uploadedAt}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/viewer/${doc.id}`}
                            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
                            style={{
                              border: '2px solid var(--color-quelle-ink)',
                              background: 'white',
                              color: 'var(--color-quelle-ink)',
                              textDecoration: 'none',
                            }}
                            aria-label={`View ${doc.filename}`}
                          >
                            <Eye size={14} strokeWidth={2.5} />
                          </Link>
                          <button
                            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all cursor-pointer"
                            style={{
                              border: '2px solid var(--color-quelle-ink)',
                              background: 'var(--color-quelle-orange)',
                            }}
                            aria-label={`Reprocess ${doc.filename}`}
                          >
                            <RotateCcw size={14} strokeWidth={2.5} />
                          </button>
                          <button
                            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all cursor-pointer"
                            style={{
                              border: '2px solid var(--color-quelle-ink)',
                              background: 'var(--color-quelle-red)',
                              color: 'white',
                            }}
                            aria-label={`Delete ${doc.filename}`}
                          >
                            <Trash2 size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════ AUDIT LOG TAB ═══════ */}
      {activeTab === 'audit' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Audit filter pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 mr-2">
              <Filter size={14} strokeWidth={2.5} style={{ color: 'var(--color-quelle-ink-muted)' }} />
              <span className="text-xs font-bold uppercase" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                Action:
              </span>
            </div>
            {AUDIT_FILTERS.map((f) => (
              <button
                key={f.key}
                className={`filter-pill ${auditFilter === f.key ? 'active' : ''}`}
                onClick={() => setAuditFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
            <div className="ml-auto">
              <button className="btn-brutal btn-brutal-secondary text-xs py-2 px-3">
                <Download size={12} strokeWidth={2.5} />
                Export
              </button>
            </div>
          </div>

          {/* Audit log table */}
          <div
            className="overflow-x-auto"
            style={{
              border: '2.5px solid var(--color-quelle-ink)',
              borderRadius: 'var(--radius-brutal-lg)',
              boxShadow: 'var(--shadow-brutal)',
              overflow: 'hidden',
            }}
          >
            <table className="table-brutal">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudit.map((entry) => (
                  <tr key={entry.id}>
                    <td className="text-xs font-mono whitespace-nowrap">{entry.timestamp}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div
                          className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0"
                          style={{
                            background: 'var(--color-quelle-cream)',
                            border: '1.5px solid var(--color-quelle-ink)',
                          }}
                        >
                          <User size={12} strokeWidth={2.5} />
                        </div>
                        <span className="text-xs font-semibold">{entry.user}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge-brutal text-[0.65rem]"
                        style={{
                          background: ACTION_COLORS[entry.action] || 'var(--color-quelle-border-light)',
                          color: entry.action === 'delete' ? 'white' : 'var(--color-quelle-ink)',
                        }}
                      >
                        {entry.action.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-xs font-semibold">{entry.target}</td>
                    <td className="text-xs" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                      {entry.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
