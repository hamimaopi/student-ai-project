import React, { useState, useEffect, useRef } from 'react';
import { SessionData, ChatMessage, SessionParticipant } from '../types';
import { api } from '../api/client';
import { StudentProfileCard } from '../components/StudentProfileCard';
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
  onSessionUpdated?: (session: SessionData) => void;
}

export const ClassroomView: React.FC<Props> = ({
  session: initialSession,
  onSessionEnded,
  onRestart,
  endLessonSignal,
  onSessionUpdated
}) => {
  const [session, setSession] = useState<SessionData>(initialSession);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [showDebrief, setShowDebrief] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const participant: SessionParticipant | undefined = session.participants?.[0];

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

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isThinking) return;

    setError(null);
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
        targetStudentId: participant?.studentId
      });

      // Update state with confirmed student message and updated participant
      const confirmedReply: ChatMessage = {
        ...response.reply,
        createdAt: response.reply.createdAt || new Date().toISOString()
      };
      setMessages((prev) => [...prev, confirmedReply]);

      setSession((prev) => {
        const updatedParticipants = prev.participants.map((p) =>
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

      // If Sue reached understanding, celebrate with debrief!
      if (response.participantState.currentState === 'UNDERSTANDING') {
        setTimeout(async () => {
          try {
            const ended = await api.endSession(session.id);
            setSession(ended);
            onSessionUpdated?.(ended);
          } catch (e) {
            console.warn('Failed to auto-end session on mastery:', e);
          }
          setShowDebrief(true);
        }, 1200);
      }
    } catch (err: unknown) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to communicate with student AI');
    } finally {
      setIsThinking(false);
    }
  };

  const handleEndSessionClick = async () => {
    try {
      const updated = await api.endSession(session.id);
      setSession(updated);
      onSessionUpdated?.(updated);
      setShowDebrief(true);
    } catch (err) {
      console.error('Failed to end session:', err);
      setShowDebrief(true);
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
          className={`btn-secondary ${styles.endButton}`}
          onClick={handleEndSessionClick}
        >
          End Lesson & View Debrief 📊
        </button>
      </div>

      <div className={`container-max ${styles.classroomGrid}`}>
        {/* Left Column: Student Profile & Scenario */}
        <aside className={styles.leftColumn}>
          <StudentProfileCard
            participant={participant}
            isThinking={isThinking}
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
            studentName={participant?.studentName || 'Sue'}
            studentAvatarUrl={participant?.avatarUrl || '/images/avatar_sue.jpg'}
            teacherName={session.teacherName || 'Teacher'}
            teacherBadge={session.teacherBadge}
            startedAt={session.startedAt}
            endedAt={session.endedAt}
            onOpenDebrief={() => setShowDebrief(true)}
          />

          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isThinking || session.endedAt != null}
            studentState={participant?.currentState}
            studentName={participant?.studentName}
          />
        </main>
      </div>

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
