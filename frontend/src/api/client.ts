import {
  ClassroomDetail,
  CreateSessionPayload,
  SessionData,
  ChatMessage,
  SendMessagePayload,
  ChatSendResponse
} from '../types';

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

async function handleResponse<T>(res: Response): Promise<T> {
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
    throw new ApiError(res.status, errorMessage, errorCode, details);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async getClassrooms(): Promise<ClassroomDetail[]> {
    const res = await fetch(`${BASE_URL}/classrooms`);
    return handleResponse<ClassroomDetail[]>(res);
  },

  async getAllSessions(): Promise<SessionData[]> {
    const res = await fetch(`${BASE_URL}/sessions`);
    return handleResponse<SessionData[]>(res);
  },

  async createSession(payload: CreateSessionPayload): Promise<SessionData> {
    const res = await fetch(`${BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<SessionData>(res);
  },

  async getSession(id: string): Promise<SessionData> {
    const res = await fetch(`${BASE_URL}/sessions/${id}`);
    return handleResponse<SessionData>(res);
  },

  async endSession(id: string): Promise<SessionData> {
    const res = await fetch(`${BASE_URL}/sessions/${id}/end`, {
      method: 'POST'
    });
    return handleResponse<SessionData>(res);
  },

  async getSessionDebrief(id: string): Promise<import('../types').DebriefData> {
    const res = await fetch(`${BASE_URL}/sessions/${id}/debrief`);
    return handleResponse<import('../types').DebriefData>(res);
  },

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/messages`);
    return handleResponse<ChatMessage[]>(res);
  },

  async sendMessage(payload: SendMessagePayload): Promise<ChatSendResponse> {
    const res = await fetch(`${BASE_URL}/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<ChatSendResponse>(res);
  }
};
