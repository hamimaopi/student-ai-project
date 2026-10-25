// ============================================================================
// Core Domain Types for Student AI Project
// ============================================================================

export type StudentState =
  | 'CONFIDENTLY_WRONG'
  | 'DEFENSIVE'
  | 'CONFUSED'
  | 'TENTATIVELY_CORRECT'
  | 'UNDERSTANDING';

export type TeacherBadge = 'fox' | 'otter' | 'owl' | 'panda';

export interface TeacherProfile {
  id?: string;
  name: string;
  avatarBadge: TeacherBadge;
}

export interface Classroom {
  id: string;
  subject: 'SCIENCE' | 'MATH' | 'LITERACY';
  name: string;
  description?: string;
  createdAt?: string;
}

export interface Student {
  id: string;
  name: string;
  personality: string;
  gradeLevel: string;
  avatarUrl: string;
}

export interface Scenario {
  id: string;
  classroomId: string;
  title: string;
  description: string;
  isAiGenerated: boolean;
}

export interface StudentMentalModel {
  id: string;
  scenarioId: string;
  studentId: string;
  wrongBelief: string;
  whyItFeelsRight: string;
  defenses: string[];
}

export interface SessionParticipant {
  id: string;
  sessionId: string;
  studentId: string;
  studentName?: string;
  avatarUrl?: string;
  currentState: StudentState;
  turnsInState: number;
  stateSummary?: string;
}

export interface Session {
  id: string;
  teacherId?: string | null;
  teacherName?: string;
  teacherBadge?: TeacherBadge;
  classroomId: string;
  scenarioId: string;
  scenarioTitle?: string;
  participants: SessionParticipant[];
  startedAt: string;
  endedAt?: string | null;
}

export interface Message {
  id: string;
  sessionId: string;
  senderType: 'TEACHER' | 'STUDENT';
  studentId?: string | null;
  senderName: string;
  avatarUrl: string;
  content: string;
  turnNumber: number;
  createdAt: string;
}

export interface ChatSendRequest {
  sessionId: string;
  message: string;
}

export interface ChatSendResponse {
  reply: Message;
  participantState: SessionParticipant;
}
