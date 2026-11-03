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
  name: string;
  avatarBadge: TeacherBadge;
}

export interface ScenarioItem {
  id: string;
  title: string;
  description: string;
  isAiGenerated: boolean;
}

export interface StudentSummary {
  id: string;
  name: string;
  personality: string;
  gradeLevel: string;
  avatarUrl: string;
}

export interface ClassroomDetail {
  id: string;
  subject: string;
  name: string;
  description: string;
  scenarios: ScenarioItem[];
  students: StudentSummary[];
}

export interface SessionParticipant {
  id: string;
  studentId: string;
  studentName: string;
  avatarUrl: string;
  personality: string;
  currentState: StudentState;
  turnsInState: number;
  stateSummary?: string | null;
}

export interface DebriefData {
  masteryAchieved: boolean;
  finalStudentState: StudentState;
  totalTurns: number;
  summary: string;
  breakthroughMoment: string;
  strategyBreakdown: Record<string, number>;
  strengths: string[];
  growthOpportunities: string[];
}

export interface SessionData {
  id: string;
  teacherName: string;
  teacherBadge: TeacherBadge;
  classroomId: string;
  classroomName: string;
  subject: string;
  scenarioId: string;
  scenarioTitle: string;
  scenarioDescription: string;
  startedAt: string;
  endedAt?: string | null;
  participants: SessionParticipant[];
  turnCount: number;
  debrief?: DebriefData | null;
}

export interface CreateSessionPayload {
  teacherName: string;
  teacherBadge: string;
  classroomId: string;
  scenarioId: string;
  studentIds?: string[];
}

export interface ChatMessage {
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

export interface SendMessagePayload {
  sessionId: string;
  content: string;
  targetStudentId?: string | null;
}

export interface ChatSendResponse {
  reply: ChatMessage;
  participantState: SessionParticipant;
}
