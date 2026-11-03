import {
  ClassroomDetail,
  CreateSessionPayload,
  SessionData,
  ChatMessage,
  SendMessagePayload,
  ChatSendResponse
} from '../types';

const BASE_URL = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.message) errorMessage = parsed.message;
      else if (parsed.error) errorMessage = parsed.error;
    } catch {
      if (errorText) errorMessage = errorText;
    }
    throw new Error(errorMessage);
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
