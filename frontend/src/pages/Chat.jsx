import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';

/* ── Mock conversation data ── */
const MOCK_PINNED_DOCS = [
  { id: 'doc-1', name: 'Q2_Financial_Report.pdf' },
  { id: 'doc-2', name: 'Q3_Outlook_Manual.pdf' },
  { id: 'doc-4', name: 'Employee_Directory.xlsx' },
];

const MOCK_INITIAL_MESSAGES = [
  {
    id: 'msg-1',
    role: 'assistant',
    content: 'Welcome to Quelle! I can help you search and analyze your documents. Ask me anything about the documents in your workspace — I\'ll provide answers with citations so you can verify every claim.',
    confidence: null,
    citations: [],
    conflict: false,
  },
];

const MOCK_RESPONSE = {
  content: 'Revenue increased from **$12.3M in Q1** to **$14.1M in Q2**, representing a **14.6% increase** [1]. The Q3 outlook section identifies **supply-chain delays** as the primary risk factor for Q3 targets [2]. Additionally, currency fluctuations in European markets may impact international revenue by 2-4% [2].',
  confidence: 'high',
  citations: [
    {
      id: 1,
      document_id: 'doc-1',
      document_name: 'Q2_Financial_Report.pdf',
      page_number: 1,
      section_title: 'Quarterly Financial Summary',
      snippet: 'Revenue grew from $12.3M to $14.1M quarter over quarter.',
      score: 0.91,
    },
    {
      id: 2,
      document_id: 'doc-2',
      document_name: 'Q3_Outlook_Manual.pdf',
      page_number: 3,
      section_title: 'Risk Factors & Outlook',
      snippet: 'Supply-chain delays remain the primary risk to Q3 targets. Currency fluctuations in European markets may impact international revenue by 2-4%.',
      score: 0.88,
    },
  ],
  conflict: false,
};

const MOCK_CONFLICT_RESPONSE = {
  content: 'There is **conflicting information** regarding Q2 operating expenses across your documents. One source states operating expenses were **$8.2M** [1], while another reports them as **$8.7M** [2]. Please review both sources to determine the accurate figure.',
  confidence: 'medium',
  citations: [
    {
      id: 1,
      document_id: 'doc-1',
      document_name: 'Q2_Financial_Report.pdf',
      page_number: 1,
      section_title: 'Quarterly Financial Summary',
      snippet: 'Operating expenses remained stable at $8.2M.',
      score: 0.89,
    },
    {
      id: 2,
      document_id: 'doc-3',
      document_name: 'Internal_Audit_Report.pdf',
      page_number: 5,
      section_title: 'Expense Analysis',
      snippet: 'Total operating expenses for Q2 were recorded at $8.7M, including one-time restructuring costs.',
      score: 0.85,
    },
  ],
  conflict: true,
};

const CONFIDENCE_CONFIG = {
  high: { class: 'badge-high', label: 'High Confidence', icon: CheckCircle2 },
  medium: { class: 'badge-medium', label: 'Medium Confidence', icon: HelpCircle },
  low: { class: 'badge-low', label: 'Low Confidence', icon: AlertTriangle },
  insufficient: { class: 'badge-insufficient', label: 'Insufficient Evidence', icon: Info },
};

export default function ChatView() {
  const [messages, setMessages] = useState(MOCK_INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scopeMode, setScopeMode] = useState('selected');
  const [pinnedDocs, setPinnedDocs] = useState(MOCK_PINNED_DOCS);
  const [showDocScope, setShowDocScope] = useState(false);
  const [expandedCitation, setExpandedCitation] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const queryCountRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      confidence: null,
      citations: [],
      conflict: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    queryCountRef.current += 1;

    // Simulate response
    setTimeout(() => {
      const responseData = queryCountRef.current % 3 === 0 ? MOCK_CONFLICT_RESPONSE : MOCK_RESPONSE;
      const assistantMessage = {
        id: `msg-asst-${Date.now()}`,
        role: 'assistant',
        content: responseData.content,
        confidence: responseData.confidence,
        citations: responseData.citations,
        conflict: responseData.conflict,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removePinnedDoc = (docId) => {
    setPinnedDocs((prev) => prev.filter((d) => d.id !== docId));
  };

  const renderContent = (content) => {
    // Simple markdown bold + citation rendering
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
            onClick={() => setExpandedCitation(expandedCitation === parseInt(num) ? null : parseInt(num))}
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
          {/* Chat header */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{
              borderBottom: '2.5px solid var(--color-quelle-ink)',
              background: 'var(--color-quelle-cream)',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="icon-chip icon-chip-purple icon-chip-sm flex items-center justify-center">
                <MessageSquare size={16} strokeWidth={2.5} />
              </div>
              <h1
                className="text-base font-bold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Document Query
              </h1>
            </div>

            {/* Document scope selector */}
            <div className="relative">
              <button
                onClick={() => setShowDocScope(!showDocScope)}
                className="filter-pill flex items-center gap-1"
                style={{
                  background: scopeMode === 'all' ? 'var(--color-quelle-yellow)' : 'white',
                }}
              >
                {scopeMode === 'all' ? (
                  <>
                    <Globe size={12} strokeWidth={2.5} />
                    All Documents
                  </>
                ) : (
                  <>
                    <Pin size={12} strokeWidth={2.5} />
                    {pinnedDocs.length} pinned
                  </>
                )}
                <ChevronDown size={12} strokeWidth={2.5} />
              </button>

              {showDocScope && (
                <div
                  className="absolute right-0 top-full mt-2 w-72 z-20 animate-fade-in"
                  style={{
                    border: '2.5px solid var(--color-quelle-ink)',
                    borderRadius: 'var(--radius-brutal)',
                    background: 'white',
                    boxShadow: 'var(--shadow-brutal)',
                  }}
                >
                  <div className="p-3" style={{ borderBottom: '2px solid var(--color-quelle-border-light)' }}>
                    <div className="segmented-toggle w-full">
                      <button
                        className={`flex-1 ${scopeMode === 'all' ? 'active' : ''}`}
                        onClick={() => setScopeMode('all')}
                      >
                        <Globe size={12} /> All
                      </button>
                      <button
                        className={`flex-1 ${scopeMode === 'selected' ? 'active' : ''}`}
                        onClick={() => setScopeMode('selected')}
                      >
                        <Pin size={12} /> Selected
                      </button>
                    </div>
                  </div>
                  {scopeMode === 'selected' && (
                    <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                      {pinnedDocs.length === 0 ? (
                        <p className="text-xs text-center py-2" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                          No documents pinned. Pin documents from the Library.
                        </p>
                      ) : (
                        pinnedDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-2 p-2"
                            style={{
                              border: '1.5px solid var(--color-quelle-border-light)',
                              borderRadius: 'var(--radius-brutal-sm)',
                            }}
                          >
                            <FileText size={14} strokeWidth={2.5} style={{ color: 'var(--color-quelle-ink-muted)', flexShrink: 0 }} />
                            <span className="text-xs font-semibold truncate flex-1">{doc.name}</span>
                            <button
                              onClick={() => removePinnedDoc(doc.id)}
                              className="p-0.5 cursor-pointer flex-shrink-0"
                              style={{ background: 'none', border: 'none', color: 'var(--color-quelle-ink-muted)' }}
                              aria-label={`Unpin ${doc.name}`}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  <div className="p-2" style={{ borderTop: '2px solid var(--color-quelle-border-light)' }}>
                    <button
                      onClick={() => setShowDocScope(false)}
                      className="btn-brutal btn-brutal-primary w-full text-xs py-1.5"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Messages area */}
          <div
            className="flex-1 overflow-y-auto p-5 space-y-5"
            onClick={() => showDocScope && setShowDocScope(false)}
          >
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] space-y-2">
                  {/* Role indicator */}
                  <div className={`flex items-center gap-1.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    <div
                      className="flex items-center justify-center w-5 h-5"
                      style={{
                        border: '1.5px solid var(--color-quelle-ink)',
                        borderRadius: '50%',
                        background: msg.role === 'user' ? 'var(--color-quelle-yellow)' : 'var(--color-quelle-purple)',
                      }}
                    >
                      {msg.role === 'user' ?
                        <User size={10} strokeWidth={3} /> :
                        <Bot size={10} strokeWidth={3} color="white" />
                      }
                    </div>
                    <span className="text-xs font-bold" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                      {msg.role === 'user' ? 'You' : 'Quelle'}
                    </span>
                  </div>

                  {/* Bubble */}
                  <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
                    <div className="text-sm leading-relaxed">
                      {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                    </div>
                  </div>

                  {/* Confidence badge */}
                  {msg.confidence && (
                    <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      {(() => {
                        const conf = CONFIDENCE_CONFIG[msg.confidence];
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

                  {/* Conflict banner */}
                  {msg.conflict && (
                    <div className="conflict-banner animate-fade-in">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={16} strokeWidth={2.5} style={{ color: 'var(--color-quelle-orange-dark)' }} />
                        <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                          Conflicting Information Detected
                        </span>
                      </div>
                      <p className="text-xs mb-3" style={{ color: 'var(--color-quelle-ink-light)' }}>
                        Sources disagree on certain values. Review both citations below:
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
                              <span className="citation-chip" style={{ fontSize: '0.65rem', minWidth: '20px', height: '20px' }}>
                                {cit.id}
                              </span>
                              <span className="text-xs font-bold truncate">{cit.document_name}</span>
                            </div>
                            <p className="text-xs" style={{ color: 'var(--color-quelle-ink-light)' }}>
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
                  {msg.citations.length > 0 && !msg.conflict && (
                    <div className="space-y-1">
                      {msg.citations.map((cit) => (
                        <div key={cit.id}>
                          <button
                            className="flex items-center gap-2 w-full text-left py-1 px-2 cursor-pointer"
                            style={{
                              background: expandedCitation === cit.id ? 'var(--color-quelle-cream)' : 'transparent',
                              border: expandedCitation === cit.id ? '1.5px solid var(--color-quelle-border-light)' : '1.5px solid transparent',
                              borderRadius: 'var(--radius-brutal-sm)',
                            }}
                            onClick={() => setExpandedCitation(expandedCitation === cit.id ? null : cit.id)}
                          >
                            <span className="citation-chip" style={{ fontSize: '0.6rem', minWidth: '18px', height: '18px', padding: '0 4px' }}>
                              {cit.id}
                            </span>
                            <span className="text-xs font-semibold truncate" style={{ color: 'var(--color-quelle-ink-light)' }}>
                              {cit.document_name}
                            </span>
                            <span className="text-[0.65rem] ml-auto flex-shrink-0" style={{ color: 'var(--color-quelle-ink-muted)' }}>
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
                                <span className="text-[0.65rem]" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                                  Score: {cit.score}
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
                                  View Source
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
                  <Loader2 size={16} strokeWidth={2.5} className="animate-spin" style={{ color: 'var(--color-quelle-purple)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-quelle-ink-muted)' }}>
                    Searching documents...
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
                  placeholder="Ask a question about your documents..."
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
            <p className="text-[0.65rem] mt-2 text-center" style={{ color: 'var(--color-quelle-ink-muted)' }}>
              Quelle only answers from your uploaded documents. All claims are citation-backed.
            </p>
          </div>
        </div>

        {/* ── Right Sidebar: Active Citations (desktop) ── */}
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
              Session Info
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Scope info */}
            <div>
              <p className="label-brutal">Active Scope</p>
              <p className="text-sm font-semibold">
                {scopeMode === 'all' ? 'All workspace documents' : `${pinnedDocs.length} pinned documents`}
              </p>
            </div>

            {/* Pinned docs list */}
            {scopeMode === 'selected' && (
              <div>
                <p className="label-brutal">Pinned Documents</p>
                <div className="space-y-1.5">
                  {pinnedDocs.map((doc) => (
                    <Link
                      key={doc.id}
                      to={`/viewer/${doc.id}`}
                      className="flex items-center gap-2 p-2 no-underline"
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        border: '1.5px solid var(--color-quelle-border-light)',
                        borderRadius: 'var(--radius-brutal-sm)',
                        background: 'white',
                      }}
                    >
                      <FileText size={12} strokeWidth={2.5} style={{ color: 'var(--color-quelle-ink-muted)', flexShrink: 0 }} />
                      <span className="text-xs font-semibold truncate">{doc.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation stats */}
            <div>
              <p className="label-brutal">Conversation</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--color-quelle-ink-muted)' }}>Messages</span>
                  <span className="font-bold">{messages.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--color-quelle-ink-muted)' }}>Citations used</span>
                  <span className="font-bold">
                    {messages.reduce((acc, m) => acc + (m.citations?.length || 0), 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <p className="label-brutal">Quick Actions</p>
              <div className="space-y-1.5">
                <button
                  className="btn-brutal btn-brutal-secondary w-full text-xs py-2"
                  onClick={() => {
                    setMessages(MOCK_INITIAL_MESSAGES);
                    queryCountRef.current = 0;
                  }}
                >
                  New Conversation
                </button>
                <Link
                  to="/library"
                  className="btn-brutal btn-brutal-secondary w-full text-xs py-2"
                  style={{ textDecoration: 'none', display: 'flex' }}
                >
                  <BookOpen size={12} strokeWidth={2.5} />
                  Browse Library
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
