import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  FileText,
  Pin,
  Globe,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageSquare,
  X,
  BookOpen,
  Search,
  Loader2,
  Info,
  User,
  Bot,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const INITIAL_MESSAGE = {
  id: 'msg-1',
  role: 'assistant',
  content:
    "Welcome to Quelle! I am your AI Document Intelligence Assistant. Ask me anything about the documents in your workspace — all answers are citation-backed and verifiable down to the exact section and page number.",
  confidence: null,
  citations: [],
  conflict: false,
};

const CONFIDENCE_CONFIG = {
  high: { class: 'badge-high', label: 'High Confidence', icon: CheckCircle2 },
  medium: { class: 'badge-medium', label: 'Medium Confidence', icon: HelpCircle },
  low: { class: 'badge-low', label: 'Low Confidence', icon: AlertTriangle },
  insufficient: { class: 'badge-insufficient', label: 'Insufficient Evidence (Gated)', icon: Info },
};

export default function ChatView() {
  const { activeWorkspace, workspaces, setActiveWorkspace } = useAuth();
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scopeMode, setScopeMode] = useState('selected'); // 'selected' | 'all'
  const [availableDocs, setAvailableDocs] = useState([]);
  const [pinnedDocs, setPinnedDocs] = useState([]);
  const [showDocScope, setShowDocScope] = useState(false);
  const [expandedCitation, setExpandedCitation] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load documents for active workspace
  const loadWorkspaceDocuments = useCallback(async () => {
    if (!activeWorkspace?.id) return;
    try {
      const docs = await api.documents.list(activeWorkspace.id);
      const mapped = docs.map((d) => ({
        id: d.id,
        name: d.filename,
        type: d.doc_type,
        status: d.status,
      }));
      setAvailableDocs(mapped);
      // Auto-pin indexed documents
      const indexed = mapped.filter((d) => d.status === 'indexed');
      setPinnedDocs(indexed.length > 0 ? indexed : mapped);
    } catch (e) {
      console.warn('Failed to load documents for chat scope:', e);
    }
  }, [activeWorkspace?.id]);

  useEffect(() => {
    loadWorkspaceDocuments();
    setConversationId(null);
    setMessages([INITIAL_MESSAGE]);
  }, [loadWorkspaceDocuments]);

  const togglePinDoc = (doc) => {
    setPinnedDocs((prev) => {
      const exists = prev.some((d) => d.id === doc.id);
      if (exists) {
        return prev.filter((d) => d.id !== doc.id);
      } else {
        return [...prev, doc];
      }
    });
  };

  const removePinnedDoc = (docId) => {
    setPinnedDocs((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: userText,
      confidence: null,
      citations: [],
      conflict: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let currentConvId = conversationId;
      const activeDocIds =
        scopeMode === 'all' ? availableDocs.map((d) => d.id) : pinnedDocs.map((d) => d.id);

      // 1. Create conversation if not exists
      if (!currentConvId && activeWorkspace?.id) {
        const conv = await api.chat.createConversation(
          activeWorkspace.id,
          userText.slice(0, 30) + '...',
          activeDocIds
        );
        currentConvId = conv.id;
        setConversationId(currentConvId);
      }

      // 2. Send message to backend
      const res = await api.chat.sendMessage(currentConvId, userText, activeDocIds);

      const assistantMessage = {
        id: `msg-asst-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        confidence: res.confidence_level || 'high',
        citations: (res.citations || []).map((c) => ({
          id: c.citation_index,
          document_id: c.document_id,
          document_name: c.document_name,
          page_number: c.page_number,
          section_title: c.section_title,
          snippet: c.snippet,
          score: c.score,
        })),
        conflict: res.conflicts_detected || false,
        conflict_details: res.conflict_details || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `Error retrieving grounded answer: ${err.message}. Please verify the backend pipeline is active and documents are indexed.`,
        confidence: 'insufficient',
        citations: [],
        conflict: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderContent = (content) => {
    return content.split(/(\*\*[^*]+\*\*|\[\d+\])/g).map((part, i) => {
      if (/^\*\*[^*]+\*\*$/.test(part)) {
        return <strong key={i}>{part.replace(/\*\*/g, '')}</strong>;
      }
      if (/^\[\d+\]$/.test(part)) {
        const num = part.replace(/[[\]]/g, '');
        return (
          <button
            key={i}
            className="citation-chip mx-0.5 align-middle"
            onClick={() =>
              setExpandedCitation(expandedCitation === parseInt(num) ? null : parseInt(num))
            }
            aria-label={`Citation ${num}`}
          >
            {num}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col lg:flex-row gap-4" style={{ height: 'calc(100vh - 140px)' }}>
        {/* ── Main Chat Panel ── */}
        <div
          className="flex-1 flex flex-col animate-fade-in"
          style={{
            border: '2.5px solid var(--color-quelle-ink)',
            borderRadius: 'var(--radius-brutal-lg)',
            overflow: 'hidden',
            background: 'white',
            boxShadow: 'var(--shadow-brutal)',
          }}
        >
          {/* Chat Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              borderBottom: '2.5px solid var(--color-quelle-ink)',
              background: 'var(--color-quelle-cream)',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="icon-chip icon-chip-purple icon-chip-sm flex items-center justify-center">
                <Bot size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h1
                  className="text-sm font-bold leading-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Hybrid RAG Copilot
                </h1>
                <p className="text-[0.65rem]" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                  Workspace: {activeWorkspace?.name || 'General Intelligence'} • Real-Time Grounding
                </p>
              </div>
            </div>

            {/* Scope Selector */}
            <div className="flex items-center gap-2">
              <div className="segmented-toggle">
                <button
                  className={scopeMode === 'all' ? 'active' : ''}
                  onClick={() => setScopeMode('all')}
                  style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                >
                  <Globe size={12} /> All Docs
                </button>
                <button
                  className={scopeMode === 'selected' ? 'active' : ''}
                  onClick={() => setScopeMode('selected')}
                  style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                >
                  <Pin size={12} /> Pinned ({pinnedDocs.length})
                </button>
              </div>

              <button
                className="btn-brutal btn-brutal-secondary py-1 px-2 text-xs flex items-center gap-1"
                onClick={() => setShowDocScope(!showDocScope)}
                title="Manage Document Scope"
              >
                <Layers size={13} />
                <span className="hidden sm:inline">Scope</span>
              </button>
            </div>
          </div>

          {/* Pinned scope chip bar */}
          {scopeMode === 'selected' && (
            <div
              className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto"
              style={{
                borderBottom: '1.5px solid var(--color-quelle-border-light)',
                background: 'var(--color-quelle-offwhite)',
              }}
            >
              <span
                className="text-[0.65rem] font-bold uppercase flex-shrink-0"
                style={{ color: 'var(--color-quelle-ink-muted)' }}
              >
                Scope:
              </span>
              {pinnedDocs.length === 0 ? (
                <span className="text-xs text-red-500 font-semibold">
                  No documents pinned! Click Scope to select sources.
                </span>
              ) : (
                pinnedDocs.map((doc) => (
                  <span
                    key={doc.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0"
                    style={{
                      background: 'white',
                      border: '1.5px solid var(--color-quelle-ink)',
                      color: 'var(--color-quelle-ink)',
                    }}
                  >
                    <FileText size={10} strokeWidth={2.5} />
                    <span className="truncate max-w-[140px]">{doc.name}</span>
                    <button
                      onClick={() => removePinnedDoc(doc.id)}
                      className="hover:opacity-70 cursor-pointer ml-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))
              )}
            </div>
          )}

          {/* Scope Selector Drawer */}
          {showDocScope && (
            <div
              className="p-3 bg-yellow-50 animate-fade-in"
              style={{ borderBottom: '2px solid var(--color-quelle-ink)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase">Pin Documents For Grounding</span>
                <button
                  onClick={() => setShowDocScope(false)}
                  className="p-1 hover:bg-yellow-200 rounded"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                {availableDocs.map((doc) => {
                  const isPinned = pinnedDocs.some((d) => d.id === doc.id);
                  return (
                    <button
                      key={doc.id}
                      onClick={() => togglePinDoc(doc)}
                      className={`text-xs px-2.5 py-1 rounded font-semibold transition-all ${
                        isPinned
                          ? 'bg-black text-white shadow-sm'
                          : 'bg-white text-gray-700 border border-gray-300'
                      }`}
                    >
                      {isPinned ? '✓ ' : '+ '} {doc.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message history */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 animate-fade-in ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="icon-chip icon-chip-purple icon-chip-sm flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles size={14} strokeWidth={2.5} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] space-y-2 ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Bubble */}
                  <div
                    className={
                      msg.role === 'user'
                        ? 'chat-bubble chat-bubble-user text-sm'
                        : 'chat-bubble chat-bubble-assistant text-sm'
                    }
                  >
                    {renderContent(msg.content)}
                  </div>

                  {/* Confidence badge */}
                  {msg.confidence && (
                    <div className="flex items-center gap-2">
                      {(() => {
                        const conf = CONFIDENCE_CONFIG[msg.confidence] || CONFIDENCE_CONFIG.high;
                        const ConfIcon = conf.icon;
                        return (
                          <span className={`badge-brutal ${conf.class} flex items-center gap-1`}>
                            <ConfIcon size={10} strokeWidth={3} />
                            {conf.label}
                          </span>
                        );
                      })()}
                    </div>
                  )}

                  {/* Conflict detection alert */}
                  {msg.conflict && (
                    <div className="conflict-banner animate-fade-in">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle
                          size={16}
                          strokeWidth={2.5}
                          style={{ color: 'var(--color-quelle-orange-dark)' }}
                        />
                        <span
                          className="text-sm font-bold"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          Cross-Source Conflict Detected
                        </span>
                      </div>
                      <p className="text-xs mb-3" style={{ color: 'var(--color-quelle-ink-light)' }}>
                        Retrieved sources present conflicting claims. Compare citations below:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.citations.map((cit) => (
                          <div
                            key={cit.id}
                            className="p-3"
                            style={{
                              border: '2px solid var(--color-quelle-ink)',
                              borderRadius: 'var(--radius-brutal-sm)',
                              background: 'white',
                            }}
                          >
                            <div className="flex items-center gap-1 mb-1">
                              <span
                                className="citation-chip"
                                style={{ fontSize: '0.65rem', minWidth: '20px', height: '20px' }}
                              >
                                {cit.id}
                              </span>
                              <span className="text-xs font-bold truncate">{cit.document_name}</span>
                            </div>
                            <p className="text-xs italic" style={{ color: 'var(--color-quelle-ink-light)' }}>
                              "{cit.snippet}"
                            </p>
                            <p className="text-[0.65rem] mt-1" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                              Page {cit.page_number} • {cit.section_title}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Citations list */}
                  {msg.citations && msg.citations.length > 0 && !msg.conflict && (
                    <div className="space-y-1">
                      {msg.citations.map((cit) => (
                        <div key={cit.id}>
                          <button
                            className="flex items-center gap-2 w-full text-left py-1 px-2 cursor-pointer"
                            style={{
                              background:
                                expandedCitation === cit.id ? 'var(--color-quelle-cream)' : 'transparent',
                              border:
                                expandedCitation === cit.id
                                  ? '1.5px solid var(--color-quelle-border-light)'
                                  : '1.5px solid transparent',
                              borderRadius: 'var(--radius-brutal-sm)',
                            }}
                            onClick={() =>
                              setExpandedCitation(expandedCitation === cit.id ? null : cit.id)
                            }
                          >
                            <span
                              className="citation-chip"
                              style={{
                                fontSize: '0.6rem',
                                minWidth: '18px',
                                height: '18px',
                                padding: '0 4px',
                              }}
                            >
                              {cit.id}
                            </span>
                            <span
                              className="text-xs font-semibold truncate"
                              style={{ color: 'var(--color-quelle-ink-light)' }}
                            >
                              {cit.document_name}
                            </span>
                            <span
                              className="text-[0.65rem] ml-auto flex-shrink-0"
                              style={{ color: 'var(--color-quelle-ink-muted)' }}
                            >
                              p.{cit.page_number}
                            </span>
                            {expandedCitation === cit.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                          {expandedCitation === cit.id && (
                            <div
                              className="ml-7 mt-1 p-3 animate-fade-in"
                              style={{
                                border: '2px solid var(--color-quelle-ink)',
                                borderRadius: 'var(--radius-brutal-sm)',
                                background: 'var(--color-quelle-cream)',
                              }}
                            >
                              <p className="text-xs font-bold mb-1">{cit.section_title}</p>
                              <p className="text-xs italic" style={{ color: 'var(--color-quelle-ink-light)' }}>
                                "{cit.snippet}"
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span
                                  className="text-[0.65rem]"
                                  style={{ color: 'var(--color-quelle-ink-muted)' }}
                                >
                                  Cosine Relevance: {cit.score}
                                </span>
                                <Link
                                  to={`/viewer/${cit.document_id}`}
                                  className="text-[0.65rem] font-bold flex items-center gap-1"
                                  style={{
                                    color: 'var(--color-quelle-ink)',
                                    textDecoration: 'none',
                                  }}
                                >
                                  <BookOpen size={10} strokeWidth={2.5} />
                                  Inspect Source
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="chat-bubble chat-bubble-assistant flex items-center gap-2">
                  <Loader2
                    size={16}
                    strokeWidth={2.5}
                    className="animate-spin"
                    style={{ color: 'var(--color-quelle-purple)' }}
                  />
                  <span className="text-sm" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                    Generating Hybrid RRF Grounded Answer...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div
            className="p-4"
            style={{
              borderTop: '2.5px solid var(--color-quelle-ink)',
              background: 'var(--color-quelle-cream)',
            }}
          >
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about your indexed documents..."
                  rows={1}
                  className="input-brutal pr-12 resize-none"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="btn-brutal btn-brutal-primary flex-shrink-0"
                style={{
                  padding: '10px 14px',
                  height: '44px',
                }}
                aria-label="Send query"
              >
                <Send size={18} strokeWidth={2.5} />
              </button>
            </div>
            <p
              className="text-[0.65rem] mt-2 text-center"
              style={{ color: 'var(--color-quelle-ink-muted)' }}
            >
              Zero Hallucination Guarantee: Quelle refuses ungrounded questions and enforces confidence thresholds.
            </p>
          </div>
        </div>

        {/* ── Right Sidebar: Session Info & Quick Actions ── */}
        <div
          className="hidden lg:flex flex-col w-80 flex-shrink-0 animate-slide-in-right"
          style={{
            border: '2.5px solid var(--color-quelle-ink)',
            borderRadius: 'var(--radius-brutal-lg)',
            overflow: 'hidden',
            background: 'white',
            boxShadow: 'var(--shadow-brutal)',
          }}
        >
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{
              borderBottom: '2.5px solid var(--color-quelle-ink)',
              background: 'var(--color-quelle-cream)',
            }}
          >
            <Sparkles size={16} strokeWidth={2.5} style={{ color: 'var(--color-quelle-purple)' }} />
            <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              RAG Session Inspector
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Scope info */}
            <div>
              <p className="label-brutal">Active Search Scope</p>
              <p className="text-sm font-semibold">
                {scopeMode === 'all'
                  ? 'All workspace documents'
                  : `${pinnedDocs.length} pinned document(s)`}
              </p>
            </div>

            {/* Pinned docs list */}
            {scopeMode === 'selected' && (
              <div>
                <p className="label-brutal">Pinned Sources</p>
                <div className="space-y-1.5">
                  {pinnedDocs.map((doc) => (
                    <Link
                      key={doc.id}
                      to={`/viewer/${doc.id}`}
                      className="flex items-center gap-2 p-2 no-underline hover:bg-gray-50"
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        border: '1.5px solid var(--color-quelle-border-light)',
                        borderRadius: 'var(--radius-brutal-sm)',
                        background: 'white',
                      }}
                    >
                      <FileText
                        size={12}
                        strokeWidth={2.5}
                        style={{ color: 'var(--color-quelle-ink-muted)', flexShrink: 0 }}
                      />
                      <span className="text-xs font-semibold truncate">{doc.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation stats */}
            <div>
              <p className="label-brutal">Session Metrics</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--color-quelle-ink-muted)' }}>Messages</span>
                  <span className="font-bold">{messages.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--color-quelle-ink-muted)' }}>Citations verified</span>
                  <span className="font-bold">
                    {messages.reduce((acc, m) => acc + (m.citations?.length || 0), 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <p className="label-brutal">Actions</p>
              <div className="space-y-1.5">
                <button
                  className="btn-brutal btn-brutal-secondary w-full text-xs py-2"
                  onClick={() => {
                    setMessages([INITIAL_MESSAGE]);
                    setConversationId(null);
                  }}
                >
                  New Research Session
                </button>
                <Link
                  to="/library"
                  className="btn-brutal btn-brutal-secondary w-full text-xs py-2"
                  style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}
                >
                  <BookOpen size={12} strokeWidth={2.5} />
                  Manage Workspace Library
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
