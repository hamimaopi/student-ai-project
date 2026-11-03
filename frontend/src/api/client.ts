import {
  ClassroomDetail,
  CreateSessionPayload,
  SessionData,
  ChatMessage,
  SendMessagePayload,
  ChatSendResponse
} from '../types';
import { notificationHub } from '../utils/notifications';

export class ApiError extends Error {
  status: number;
  errorCode?: string;
  details?: string[];

  constructor(status: number, message: string, errorCode?: string, details?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

const BASE_URL = '/api';

async function executeRequest<T>(fetchFn: () => Promise<Response>): Promise<T> {
  let res: Response;
  try {
    res = await fetchFn();
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Network error';
    notificationHub.error(
      'Backend Unreachable',
      'Could not connect to the Spring Boot application.',
      'Check if the server is running at http://localhost:8080 (run ./scripts/dev-start.sh).'
    );
    throw new ApiError(0, errorMsg, 'NETWORK_ERROR');
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    let errorCode: string | undefined;
    let details: string[] | undefined;

    try {
      const parsed = JSON.parse(errorText);
      if (parsed.message) errorMessage = parsed.message;
      else if (parsed.error) errorMessage = parsed.error;
      if (parsed.errorCode) errorCode = parsed.errorCode;
      if (parsed.details) details = parsed.details;
    } catch {
      if (errorText) errorMessage = errorText;
    }

    // Intercept error payloads and surface friendly UI notifications
    if (res.status === 503 || errorCode === 'AI_SERVICE_UNAVAILABLE') {
      notificationHub.error(
        'Local AI (Ollama) Unavailable',
        errorMessage,
        "Make sure Ollama is active with 'ollama serve' and model 'llama3.1:8b' is pulled."
      );
    } else if (res.status === 409 || errorCode === 'SESSION_STATE_CONFLICT') {
      notificationHub.warning(
        'Session Conflict',
        errorMessage,
        'This session may have concluded or is no longer accepting messages.'
      );
    } else if (res.status === 404 || errorCode === 'RESOURCE_NOT_FOUND') {
      notificationHub.warning('Resource Not Found', errorMessage);
    } else if (res.status >= 500) {
      notificationHub.error('Internal Server Error', errorMessage);
    }

    throw new ApiError(res.status, errorMessage, errorCode, details);
  }

  return res.json() as Promise<T>;
}

export const api = {
  async getClassrooms(): Promise<ClassroomDetail[]> {
    return executeRequest<ClassroomDetail[]>(() => fetch(`${BASE_URL}/classrooms`));
  },

  async getAllSessions(): Promise<SessionData[]> {
    return executeRequest<SessionData[]>(() => fetch(`${BASE_URL}/sessions`));
  },

  async createSession(payload: CreateSessionPayload): Promise<SessionData> {
    return executeRequest<SessionData>(() =>
      fetch(`${BASE_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    );
  },

  async getSession(id: string): Promise<SessionData> {
    return executeRequest<SessionData>(() => fetch(`${BASE_URL}/sessions/${id}`));
  },

  async endSession(id: string): Promise<SessionData> {
    return executeRequest<SessionData>(() =>
      fetch(`${BASE_URL}/sessions/${id}/end`, {
        method: 'POST'
      })
    );
  },

  async getSessionDebrief(id: string): Promise<import('../types').DebriefData> {
    return executeRequest<import('../types').DebriefData>(() => fetch(`${BASE_URL}/sessions/${id}/debrief`));
  },

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    return executeRequest<ChatMessage[]>(() => fetch(`${BASE_URL}/sessions/${sessionId}/messages`));
  },

  async sendMessage(payload: SendMessagePayload): Promise<ChatSendResponse> {
    return executeRequest<ChatSendResponse>(() =>
      fetch(`${BASE_URL}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    );
  }
};
