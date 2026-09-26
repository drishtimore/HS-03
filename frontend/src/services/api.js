/**
 * Centralized API Service for Quelle Frontend
 * Interacts with FastAPI Backend at /api/v1 (proxied to http://localhost:8000)
 */

const API_BASE = import.meta.env.VITE_API_URL || '';
const API_PREFIX = `${API_BASE}/api/v1`;

function getHeaders(isMultipart = false) {
  const headers = {};
  const token = localStorage.getItem('auth_token');
  if (token && token !== 'mock-token') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_PREFIX}${endpoint}`;
  const isMultipart = options.body instanceof FormData;
  const config = {
    ...options,
    headers: {
      ...getHeaders(isMultipart),
      ...options.headers,
    },
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}`;
      try {
        const errorData = await res.json();
        errorMsg = errorData.detail || errorData.message || errorMsg;
      } catch {
        // use default error message
      }
      throw new Error(errorMsg);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${url}]:`, err);
    throw err;
  }
}

export const api = {
  // ── Authentication ──
  auth: {
    async login(email, password) {
      return await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },

    async register(data) {
      return await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async getMe() {
      return await request('/auth/me');
    },
  },

  // ── Workspaces ──
  workspaces: {
    async list() {
      return await request('/workspaces');
    },

    async get(id) {
      return await request(`/workspaces/${id}`);
    },

    async create(name, strictMode = false) {
      return await request('/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name, strict_mode: strictMode }),
      });
    },

    async toggleStrictMode(id, strictMode) {
      return await request(`/workspaces/${id}/strict-mode?strict_mode=${strictMode}`, {
        method: 'PATCH',
      });
    },
  },

  // ── Documents ──
  documents: {
    async list(workspaceId, { docType, status, search } = {}) {
      const params = new URLSearchParams();
      if (docType && docType !== 'all') params.append('doc_type', docType);
      if (status && status !== 'all') params.append('status_filter', status);
      if (search && search.trim()) params.append('search', search.trim());
      
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      return await request(`/workspaces/${workspaceId}/documents${queryStr}`);
    },

    async upload(workspaceId, files) {
      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }
      return await request(`/workspaces/${workspaceId}/documents`, {
        method: 'POST',
        body: formData,
      });
    },

    async get(documentId) {
      return await request(`/documents/${documentId}`);
    },

    async getStatus(documentId) {
      return await request(`/documents/${documentId}/status`);
    },

    async getPage(documentId, pageNumber) {
      return await request(`/documents/${documentId}/page/${pageNumber}`);
    },

    async delete(documentId) {
      return await request(`/documents/${documentId}`, {
        method: 'DELETE',
      });
    },
  },

  // ── Conversations & Chat ──
  chat: {
    async listConversations(workspaceId) {
      return await request(`/workspaces/${workspaceId}/conversations`);
    },

    async createConversation(workspaceId, title = 'Research Session', activeDocIds = []) {
      return await request(`/workspaces/${workspaceId}/conversations`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          active_document_ids: activeDocIds,
        }),
      });
    },

    async getConversation(conversationId) {
      return await request(`/conversations/${conversationId}`);
    },

    async sendMessage(conversationId, query, activeDocIds = []) {
      return await request(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          query,
          active_document_ids: activeDocIds,
        }),
      });
    },

    async updateScope(conversationId, activeDocIds) {
      return await request(`/conversations/${conversationId}/scope`, {
        method: 'PATCH',
        body: JSON.stringify(activeDocIds),
      });
    },
  },

  // ── Admin & Compliance ──
  admin: {
    async getPipelineHealth() {
      return await request('/admin/pipeline-health');
    },

    async getAuditLog(action = null, limit = 50) {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (action) params.append('action', action);
      return await request(`/admin/audit-log?${params.toString()}`);
    },

    async getDbExplorer() {
      return await request('/admin/db-explorer');
    },
  },

  // ── OCR & Vision ──
  ocr: {
    async imageToText(file, workspaceId = null) {
      const formData = new FormData();
      formData.append('file', file);
      if (workspaceId) {
        formData.append('save_to_workspace_id', workspaceId);
      }
      return await request('/ocr/image-to-text', {
        method: 'POST',
        body: formData,
      });
    },
  },

  // ── WebSocket Helper ──
  createProgressSocket(documentId, onMessage, onError, onClose) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/documents/${documentId}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch {
          onMessage(event.data);
        }
      };
      if (onError) ws.onerror = onError;
      if (onClose) ws.onclose = onClose;
      return ws;
    } catch (e) {
      console.warn('WebSocket connection error:', e);
      return null;
    }
  },
};

export default api;
