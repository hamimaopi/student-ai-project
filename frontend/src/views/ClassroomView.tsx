import React, { useState, useEffect, useRef } from 'react';
import { SessionData, ChatMessage, SessionParticipant } from '../types';
import { api } from '../api/client';
import { ClassroomRosterPanel } from '../components/ClassroomRosterPanel';
import { ScenarioDrawer } from '../components/ScenarioDrawer';
import { ChatMessages } from '../components/ChatMessages';
import { ChatInput } from '../components/ChatInput';
import { DebriefModal } from '../components/DebriefModal';
import { formatStopwatch, formatDuration } from '../utils/formatters';
import styles from './ClassroomView.module.css';

interface Props {
  session: SessionData;
  onSessionEnded: () => void;
  onRestart: () => void;
  endLessonSignal?: number;
  isEndingSession?: boolean;
  onEndingChange?: (isEnding: boolean) => void;
  onSessionUpdated?: (session: SessionData) => void;
}

const NAME_ALIASES: Record<string, string[]> = {
  marcus: ['marcus', 'markus', 'marcos', 'marcuss'],
  lena: ['lena', 'leena', 'leana', 'lina'],
  sue: ['sue', 'su', 'suzy', 'susie']
};

function detectAddressedStudent(text: string, participants?: SessionParticipant[]): SessionParticipant | null {
  if (!text || !participants || participants.length === 0) return null;
  const clean = text.trim();

  // Tier 3 Check: Exclusion queries ("Does anyone agree with Marcus?", "who agrees with lena")
  // Return null so the UI indicates group thinking (👥) rather than picking the excluded peer
  const peerExclusionPattern =
    /\b(?:(?:does\s+)?anyone|anybody|who|someone|anyone\s+else|everybody\s+else|rest\s+of\s+(?:the\s+)?class)\b.*?\b(?:agree|disagree|think|different|another)\b/i;
  if (peerExclusionPattern.test(clean)) {
    return null;
  }

  interface FoundMention {
    participant: SessionParticipant;
    start: number;
    end: number;
  }
  const mentions: FoundMention[] = [];

  for (const p of participants) {
    const lower = p.studentName.toLowerCase();
    const aliases = NAME_ALIASES[lower] || [lower];
    const regex = new RegExp(`\\b(?:${aliases.join('|')})\\b`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(clean)) !== null) {
      mentions.push({ participant: p, start: match.index, end: regex.lastIndex });
    }
  }

  if (mentions.length === 0) return null;
  mentions.sort((a, b) => a.start - b.start);

  const distinctParticipants = Array.from(new Set(mentions.map((m) => m.participant.studentId)));

  // Single student mentioned: 100% intentional target regardless of grammar/commas
  if (distinctParticipants.length === 1) {
    return mentions[0].participant;
  }

  // Two students mentioned (e.g. "Sue, what do you think of Marcus?", "what do you think of sue marcus")
  if (distinctParticipants.length === 2) {
    const firstMention = mentions[0];
    const lastMention = mentions[mentions.length - 1];

    const textBeforeFirst = clean.slice(0, firstMention.start).trim();
    const textBetween = clean.slice(firstMention.end, lastMention.start).trim();

    const firstIsPeerObject = /\b(?:of|about|with|from|than|on)\s*$/i.test(textBeforeFirst);
    const lastIsPeerObject = /\b(?:of|about|with|from|than|on)\s*$/i.test(textBetween);

    if (firstIsPeerObject && !lastIsPeerObject) {
      // e.g. "what do you think of sue marcus" -> target is Marcus
      return lastMention.participant;
    }
    if (lastIsPeerObject && !firstIsPeerObject) {
      // e.g. "sue what about marcus" -> target is Sue
      return firstMention.participant;
    }
    if (/[,:;?!]\s*$/.test(textBetween)) {
      return lastMention.participant;
    }
    return firstMention.participant;
  }

  return null;
}

export const ClassroomView: React.FC<Props> = ({
  session: initialSession,
  onSessionEnded,
  onRestart,
  endLessonSignal,
  isEndingSession: isEndingSessionProp,
  onEndingChange,
  onSessionUpdated
}) => {
  const [session, setSession] = useState<SessionData>(initialSession);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [internalIsEnding, setInternalIsEnding] = useState<boolean>(false);
  const [showDebrief, setShowDebrief] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [pendingSpeaker, setPendingSpeaker] = useState<{ name: string; avatarUrl?: string } | null>(null);

  const isEnding = isEndingSessionProp ?? internalIsEnding;
  const setIsEnding = (val: boolean) => {
    setInternalIsEnding(val);
    onEndingChange?.(val);
  };

  const activeParticipant: SessionParticipant | undefined =
    session.participants?.find((p) => p.studentId === selectedStudentId) ||
    session.participants?.[0];

  // Live timer for elapsed conversation duration
  useEffect(() => {
    if (!session.startedAt) return;
    const startMs = new Date(session.startedAt).getTime();

    if (session.endedAt) {
      const endMs = new Date(session.endedAt).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((endMs - startMs) / 1000)));
      return;
    }

    const updateTimer = () => {
      const nowMs = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((nowMs - startMs) / 1000)));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session.startedAt, session.endedAt]);

  // Listen for End Lesson button clicks from top-right Navbar
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (endLessonSignal && endLessonSignal > 0) {
      handleEndSessionClick();
    }
  }, [endLessonSignal]);

  // Fetch initial message history if any
  useEffect(() => {
    let isMounted = true;
    api.getSessionMessages(session.id)
      .then((history) => {
        if (isMounted) setMessages(history);
      })
      .catch((err) => {
        console.warn('Failed to load prior messages:', err);
      });
    return () => { isMounted = false; };
  }, [session.id]);

  const handleSendMessage = async (content: string, overrideTargetStudentId?: string | null) => {
    if (!content.trim() || isThinking) return;

    setError(null);
    const effectiveTargetId = overrideTargetStudentId !== undefined ? overrideTargetStudentId : selectedStudentId;

    let expectedStudent: SessionParticipant | undefined = undefined;
    if (effectiveTargetId) {
      expectedStudent = session.participants?.find((p) => p.studentId === effectiveTargetId || p.id === effectiveTargetId);
    } else {
      expectedStudent = detectAddressedStudent(content, session.participants) || undefined;
    }

    if (expectedStudent) {
      setPendingSpeaker({
        name: expectedStudent.studentName,
        avatarUrl: expectedStudent.avatarUrl
      });
    } else {
      setPendingSpeaker({
        name: 'The class',
        avatarUrl: undefined
      });
    }

    const tempTeacherMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: session.id,
      senderType: 'TEACHER',
      senderName: session.teacherName || 'Teacher',
      avatarUrl: '',
      content: content.trim(),
      turnNumber: (session.turnCount || 0) + 1,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempTeacherMessage]);
    setIsThinking(true);

    try {
      const response = await api.sendMessage({
        sessionId: session.id,
        content: content.trim(),
        targetStudentId: effectiveTargetId
      });

      // Update state with confirmed student message and updated participant roster
      const confirmedReply: ChatMessage = {
        ...response.reply,
        createdAt: response.reply.createdAt || new Date().toISOString()
      };
      setMessages((prev) => [...prev, confirmedReply]);

      setSession((prev) => {
        const updatedParticipants =
          response.allParticipants && response.allParticipants.length > 0
            ? response.allParticipants
            : prev.participants.map((p) =>
                p.id === response.participantState.id ? response.participantState : p
              );

        const updatedSession = {
          ...prev,
          turnCount: prev.turnCount + 2,
          participants: updatedParticipants
        };
        onSessionUpdated?.(updatedSession);
        return updatedSession;
      });
    } catch (err: unknown) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to communicate with student AI');
    } finally {
      setIsThinking(false);
      setPendingSpeaker(null);
    }
  };

  const handleEndSessionClick = async () => {
    if (isEnding) return;

    // Fast-path: If the session already concluded and debrief data is present, open immediately
    if (session.debrief) {
      setShowDebrief(true);
      return;
    }

    setIsEnding(true);
    try {
      const updated = await api.endSession(session.id);
      setSession(updated);
      onSessionUpdated?.(updated);
      setShowDebrief(true);
    } catch (err) {
      console.error('Failed to end session:', err);
      setShowDebrief(true);
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <div
      id="classroom-view"
      className={styles.container}
    >
      {error && (
        <div className={styles.errorBanner}>
          {error}
        </div>
      )}

      {/* Main 2-Column Classroom Layout */}
      <div className={`container-max ${styles.headerBar}`}>
        <div className={styles.headerMeta}>
          <div className={styles.statusIndicator}>
            <span
              className={`${styles.statusDot} ${session.endedAt ? styles.statusDotEnded : styles.statusDotLive}`}
            />
            <span>{session.endedAt ? 'Completed Session' : 'Live Teaching Session'} · Topic: <strong>{session.scenarioTitle}</strong></span>
          </div>
          <span className={styles.timerBadge}>
            <span>⏱️</span>
            <span>{session.endedAt ? `Total: ${formatDuration(session.startedAt, session.endedAt)}` : formatStopwatch(elapsedSeconds)}</span>
          </span>
        </div>
        <button
          id="btn-end-lesson-top"
          type="button"
          disabled={isEnding}
          className={`btn-secondary ${styles.endButton}`}
          onClick={handleEndSessionClick}
        >
          {isEnding ? 'Analyzing Discussion... ⏳' : 'End Lesson & View Debrief 📊'}
        </button>
      </div>

      <div className={`container-max ${styles.classroomGrid}`}>
        {/* Left Column: Multi-Student Classroom Roster & Scenario */}
        <aside className={styles.leftColumn}>
          <ClassroomRosterPanel
            participants={session.participants}
            isThinking={isThinking}
            selectedStudentId={selectedStudentId}
            onSelectStudent={setSelectedStudentId}
            thinkingStudentName={pendingSpeaker?.name}
          />

          <ScenarioDrawer
            title={session.scenarioTitle || 'The Cold Virus Spread'}
            description={session.scenarioDescription}
          />
        </aside>

        {/* Right Column: Active Chat Area */}
        <main className={`glass-panel ${styles.chatColumn}`}>
          <ChatMessages
            messages={messages}
            isThinking={isThinking}
            thinkingStudentName={pendingSpeaker?.name || 'The class'}
            thinkingAvatarUrl={pendingSpeaker?.avatarUrl}
            teacherName={session.teacherName || 'Teacher'}
            teacherBadge={session.teacherBadge}
            startedAt={session.startedAt}
            endedAt={session.endedAt}
            onOpenDebrief={() => setShowDebrief(true)}
          />

          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isThinking || session.endedAt != null}
            participants={session.participants}
            selectedStudentId={selectedStudentId}
            onSelectStudent={setSelectedStudentId}
            studentState={activeParticipant?.currentState}
            studentName={activeParticipant?.studentName}
          />
        </main>
      </div>

      {isEnding && (
        <div id="debrief-loading-overlay" className={styles.loadingOverlay}>
          <div className={styles.loadingCard}>
            <div className={styles.loadingIconWrapper}>
              📊
            </div>
            <h3 className={styles.loadingTitle}>Analyzing Classroom Discussion</h3>
            <p className={styles.loadingSubtitle}>
              Evaluating teaching strategies, tracking student misconception shifts, and calculating attention equity metrics across {messages.length || session.turnCount || 0} turns...
            </p>
            <div className={styles.loadingProgressBar}>
              <div className={styles.loadingProgressFill} />
            </div>
            <div className={styles.loadingTip}>
              <span>💡</span>
              <span>Our pedagogical coach is synthesizing turning points and personalized feedback.</span>
            </div>
          </div>
        </div>
      )}

      {showDebrief && (
        <DebriefModal
          session={session}
          onClose={() => setShowDebrief(false)}
          onRestart={() => {
            setShowDebrief(false);
            onSessionEnded();
            onRestart();
          }}
        />
      )}
    </div>
  );
};
