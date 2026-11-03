import React, { useState, useEffect, useRef } from 'react';
import { SessionData, ChatMessage, SessionParticipant } from '../types';
import { api } from '../api/client';
import { StudentProfileCard } from '../components/StudentProfileCard';
import { ScenarioDrawer } from '../components/ScenarioDrawer';
import { ChatMessages } from '../components/ChatMessages';
import { ChatInput } from '../components/ChatInput';
import { DebriefModal } from '../components/DebriefModal';
import { formatStopwatch, formatDuration } from '../utils/formatters';

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
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 68px)',
        overflow: 'hidden'
      }}
    >
      {error && (
        <div
          style={{
            background: 'rgba(244, 63, 94, 0.2)',
            borderBottom: '1px solid rgba(244, 63, 94, 0.4)',
            color: 'var(--state-confidently-wrong)',
            padding: '8px 24px',
            fontSize: '0.84rem',
            textAlign: 'center'
          }}
        >
          {error}
        </div>
      )}

      {/* Main 2-Column Classroom Layout */}
      <div
        className="container-max"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px 4px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: session.endedAt ? '#64748b' : '#10b981', display: 'inline-block' }}></span>
            <span>{session.endedAt ? 'Completed Session' : 'Live Teaching Session'} · Topic: <strong>{session.scenarioTitle}</strong></span>
          </div>
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '2px 9px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: 'var(--accent-cyan)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>⏱️</span>
            <span>{session.endedAt ? `Total: ${formatDuration(session.startedAt, session.endedAt)}` : formatStopwatch(elapsedSeconds)}</span>
          </span>
        </div>
        <button
          id="btn-end-lesson-top"
          type="button"
          className="btn-secondary"
          onClick={handleEndSessionClick}
          style={{ fontSize: '0.78rem', padding: '5px 12px' }}
        >
          End Lesson & View Debrief 📊
        </button>
      </div>

      <div
        className="container-max"
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 380px) 1fr',
          gap: '20px',
          padding: '8px 20px 16px',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        {/* Left Column: Student Profile & Scenario */}
        <aside
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            paddingRight: '4px',
            gap: '16px'
          }}
        >
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
        <main
          className="glass-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
          }}
        >
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
