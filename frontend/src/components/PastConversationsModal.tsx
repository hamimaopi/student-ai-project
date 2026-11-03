import React, { useState, useEffect, useMemo } from 'react';
import { ClassroomDetail, SessionData, ChatMessage, TeacherBadge } from '../types';
import { api } from '../api/client';
import { formatMessageTime, formatDuration } from '../utils/formatters';

interface Props {
  classrooms: ClassroomDetail[];
  onClose: () => void;
}

const BADGE_EMOJIS: Record<TeacherBadge, string> = {
  fox: '🦊',
  owl: '🦉',
  otter: '🦦',
  panda: '🐼'
};

export const PastConversationsModal: React.FC<Props> = ({ classrooms, onClose }) => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(true);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('ALL');
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('ALL');
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingTab, setViewingTab] = useState<'MESSAGES' | 'DEBRIEF'>('MESSAGES');

  // Load all sessions
  useEffect(() => {
    let isMounted = true;
    api.getAllSessions()
      .then((data) => {
        if (isMounted) {
          setSessions(data);
          setIsLoadingSessions(false);
          if (data.length > 0) {
            setActiveSession(data[0]);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load past sessions:', err);
          setError('Could not retrieve past sessions.');
          setIsLoadingSessions(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  // Load messages whenever activeSession changes
  useEffect(() => {
    if (!activeSession) {
      setMessages([]);
      return;
    }
    let isMounted = true;
    setIsLoadingMessages(true);
    api.getSessionMessages(activeSession.id)
      .then((msgs) => {
        if (isMounted) {
          setMessages(msgs);
          setIsLoadingMessages(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load session messages:', err);
          setIsLoadingMessages(false);
        }
      });
    return () => { isMounted = false; };
  }, [activeSession]);

  // Distinct teachers from sessions
  const availableTeachers = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (s.teacherName) set.add(s.teacherName);
    });
    return Array.from(set).sort();
  }, [sessions]);

  // Filtered sessions based on selected classroom & teacher
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchClassroom = selectedClassroomId === 'ALL' || s.classroomId === selectedClassroomId;
      const matchTeacher = selectedTeacherName === 'ALL' || s.teacherName === selectedTeacherName;
      return matchClassroom && matchTeacher;
    });
  }, [sessions, selectedClassroomId, selectedTeacherName]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      id="past-conversations-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(10px)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        id="past-conversations-dialog"
        className="glass-panel animate-slide-up"
        style={{
          maxWidth: '1100px',
          width: '100%',
          height: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--glass-shadow)',
          color: 'var(--text-main)'
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>📜</span>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>
                Past Classroom Conversations
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Filter sessions by classroom and teacher to review complete dialogue transcripts
              </p>
            </div>
          </div>

          <button
            id="btn-close-past-conversations"
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            ✕ Close
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 24px',
              background: 'rgba(244, 63, 94, 0.2)',
              borderBottom: '1px solid rgba(244, 63, 94, 0.4)',
              color: 'var(--state-confidently-wrong)',
              fontSize: '0.84rem'
            }}
          >
            {error}
          </div>
        )}

        {/* Filter Toolbar: Step 1 (Classroom) + Step 2 (Teacher) */}
        <div
          style={{
            padding: '14px 24px',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap'
          }}
        >
          {/* Step 1: Select Classroom */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label
              htmlFor="filter-classroom"
              style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}
            >
              1. Classroom:
            </label>
            <select
              id="filter-classroom"
              value={selectedClassroomId}
              onChange={(e) => {
                setSelectedClassroomId(e.target.value);
                setActiveSession(null);
              }}
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-main)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Classrooms</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.subject})
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Teacher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label
              htmlFor="filter-teacher"
              style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase' }}
            >
              2. Teacher:
            </label>
            <select
              id="filter-teacher"
              value={selectedTeacherName}
              onChange={(e) => {
                setSelectedTeacherName(e.target.value);
                setActiveSession(null);
              }}
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-main)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Teachers ({availableTeachers.length})</option>
              {availableTeachers.map((t) => (
                <option key={t} value={t}>
                  🧑‍🏫 {t}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Found <strong>{filteredSessions.length}</strong> session{filteredSessions.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Content Split: Left (Session List) | Right (Conversation Transcript) */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '360px 1fr',
            overflow: 'hidden'
          }}
        >
          {/* Left: Session List */}
          <div
            style={{
              borderRight: '1px solid var(--glass-border)',
              overflowY: 'auto',
              padding: '12px'
            }}
          >
            {isLoadingSessions ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                Loading past sessions...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
                <p style={{ fontSize: '0.86rem' }}>No sessions found matching filters.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredSessions.map((s) => {
                  const isSelected = activeSession?.id === s.id;
                  const participant = s.participants?.[0];
                  const state = participant?.currentState || 'CONFIDENTLY_WRONG';

                  return (
                    <div
                      key={s.id}
                      onClick={() => setActiveSession(s)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-lg)',
                        background: isSelected
                          ? 'var(--gradient-brand-subtle)'
                          : 'var(--bg-surface)',
                        border: isSelected
                          ? '1px solid var(--accent-cyan)'
                          : '1px solid var(--glass-border)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.88rem' }}>
                          <span>{BADGE_EMOJIS[s.teacherBadge] || '🧑‍🏫'}</span>
                          <span>{s.teacherName}</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {formatDate(s.startedAt)}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        {s.scenarioTitle || 'The Cold Virus Spread'}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className={`state-badge state-${state}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                          {state}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          <span>⏱️ {formatDuration(s.startedAt, s.endedAt)}</span>
                          <span>•</span>
                          <span>{s.turnCount}t</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Full Conversation Stream */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: 'var(--bg-primary)'
            }}
          >
            {activeSession ? (
              <>
                {/* Active Session Info Bar */}
                <div
                  style={{
                    padding: '10px 20px',
                    borderBottom: '1px solid var(--glass-border)',
                    background: 'var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                      Session with {activeSession.participants?.[0]?.studentName || 'Sue'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
                      Teacher: {activeSession.teacherName} ({BADGE_EMOJIS[activeSession.teacherBadge] || '🧑‍🏫'})
                    </span>
                  </div>

                  {/* Tabs: Messages vs Debrief */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setViewingTab('MESSAGES')}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: viewingTab === 'MESSAGES' ? '1px solid var(--accent-cyan)' : '1px solid var(--glass-border)',
                        background: viewingTab === 'MESSAGES' ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-surface)',
                        color: viewingTab === 'MESSAGES' ? 'var(--accent-cyan)' : 'var(--text-muted)'
                      }}
                    >
                      💬 Dialogue ({messages.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewingTab('DEBRIEF')}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: viewingTab === 'DEBRIEF' ? '1px solid var(--accent-purple)' : '1px solid var(--glass-border)',
                        background: viewingTab === 'DEBRIEF' ? 'rgba(168, 85, 247, 0.15)' : 'var(--bg-surface)',
                        color: viewingTab === 'DEBRIEF' ? 'var(--accent-purple)' : 'var(--text-muted)'
                      }}
                    >
                      📊 Debrief Report
                    </button>
                  </div>
                </div>

                {viewingTab === 'DEBRIEF' ? (
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}
                  >
                    {activeSession.debrief ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Summary */}
                        <div
                          style={{
                            background: 'var(--bg-surface)',
                            padding: '16px 20px',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--glass-border)'
                          }}
                        >
                          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '6px' }}>
                            Teaching Assessment Summary
                          </div>
                          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.55 }}>
                            {activeSession.debrief.summary}
                          </p>
                        </div>

                        {/* Strategy Breakdown */}
                        <div
                          style={{
                            background: 'var(--bg-surface)',
                            padding: '16px 20px',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--glass-border)'
                          }}
                        >
                          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', marginBottom: '10px' }}>
                            Strategy Breakdown
                          </div>
                          <div
                            style={{
                              height: '12px',
                              borderRadius: 'var(--radius-full)',
                              overflow: 'hidden',
                              display: 'flex',
                              background: 'rgba(255, 255, 255, 0.1)',
                              marginBottom: '10px'
                            }}
                          >
                            <div
                              style={{
                                width: `${activeSession.debrief.strategyBreakdown?.['PROBING'] || 50}%`,
                                background: '#38bdf8'
                              }}
                            />
                            <div
                              style={{
                                width: `${activeSession.debrief.strategyBreakdown?.['GUIDED_DISCOVERY'] || 35}%`,
                                background: '#a855f7'
                              }}
                            />
                            <div
                              style={{
                                width: `${activeSession.debrief.strategyBreakdown?.['TELLING'] || 15}%`,
                                background: '#f59e0b'
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span>Probing: {activeSession.debrief.strategyBreakdown?.['PROBING'] || 50}%</span>
                            <span>Guided Discovery: {activeSession.debrief.strategyBreakdown?.['GUIDED_DISCOVERY'] || 35}%</span>
                            <span>Telling: {activeSession.debrief.strategyBreakdown?.['TELLING'] || 15}%</span>
                          </div>
                        </div>

                        {/* Breakthrough */}
                        {activeSession.debrief.breakthroughMoment && (
                          <div
                            style={{
                              background: 'rgba(56, 189, 248, 0.1)',
                              padding: '14px 18px',
                              borderRadius: 'var(--radius-lg)',
                              border: '1px solid rgba(56, 189, 248, 0.25)'
                            }}
                          >
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '4px' }}>
                              💡 Turning Point
                            </div>
                            <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.5 }}>
                              {activeSession.debrief.breakthroughMoment}
                            </p>
                          </div>
                        )}

                        {/* Strengths & Growth */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                          <div
                            style={{
                              background: 'rgba(16, 185, 129, 0.08)',
                              padding: '14px 16px',
                              borderRadius: 'var(--radius-lg)',
                              border: '1px solid rgba(16, 185, 129, 0.2)'
                            }}
                          >
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: '6px' }}>
                              Strengths
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8rem', lineHeight: 1.5 }}>
                              {activeSession.debrief.strengths?.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>

                          <div
                            style={{
                              background: 'rgba(234, 179, 8, 0.08)',
                              padding: '14px 16px',
                              borderRadius: 'var(--radius-lg)',
                              border: '1px solid rgba(234, 179, 8, 0.2)'
                            }}
                          >
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '6px' }}>
                              Coaching Advice
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8rem', lineHeight: 1.5 }}>
                              {activeSession.debrief.growthOpportunities?.map((g, i) => (
                                <li key={i}>{g}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📊</div>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>
                          This session ended without generating an AI debrief report.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}
                  >
                    {isLoadingMessages ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        Loading dialogue history...
                      </div>
                    ) : messages.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No messages recorded in this session.
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isTeacher = m.senderType === 'TEACHER';
                        return (
                          <div
                            key={m.id}
                            style={{
                              display: 'flex',
                              flexDirection: isTeacher ? 'row-reverse' : 'row',
                              alignItems: 'flex-start',
                              gap: '12px',
                              maxWidth: '82%',
                              alignSelf: isTeacher ? 'flex-end' : 'flex-start'
                            }}
                          >
                            {/* Avatar */}
                            {isTeacher ? (
                              <div
                                style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: 'var(--radius-full)',
                                  background: 'var(--gradient-brand)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '1.1rem',
                                  flexShrink: 0
                                }}
                              >
                                {BADGE_EMOJIS[activeSession.teacherBadge] || '🧑‍🏫'}
                              </div>
                            ) : (
                              <img
                                src={m.avatarUrl || '/images/avatar_sue.jpg'}
                                alt="Student"
                                style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: 'var(--radius-full)',
                                  objectFit: 'cover',
                                  flexShrink: 0,
                                  border: '1.5px solid rgba(255, 255, 255, 0.2)'
                                }}
                              />
                            )}

                            {/* Bubble */}
                            <div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  marginBottom: '4px',
                                  justifyContent: isTeacher ? 'flex-end' : 'flex-start'
                                }}
                              >
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                  {isTeacher ? activeSession.teacherName : m.senderName}
                                </span>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                                  Turn #{m.turnNumber}
                                </span>
                                <span
                                  title={new Date(m.createdAt || Date.now()).toLocaleString()}
                                  style={{
                                    fontSize: '0.65rem',
                                    color: 'var(--text-dim)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                >
                                  <span style={{ opacity: 0.65 }}>🕒</span>
                                  <span>{formatMessageTime(m.createdAt || new Date().toISOString())}</span>
                                </span>
                              </div>

                              <div
                                style={{
                                  background: isTeacher
                                    ? 'var(--gradient-brand-subtle)'
                                    : 'var(--bg-surface)',
                                  border: isTeacher
                                    ? '1px solid var(--accent-indigo)'
                                    : '1px solid var(--glass-border)',
                                  borderRadius: isTeacher
                                    ? '16px 16px 4px 16px'
                                    : '16px 16px 16px 4px',
                                  padding: '12px 16px',
                                  fontSize: '0.9rem',
                                  lineHeight: 1.55,
                                  color: 'var(--text-main)'
                                }}
                              >
                                {m.content}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* End of conversation duration summary */}
                    {messages.length > 0 && (
                      <div
                        style={{
                          margin: '16px auto 8px',
                          width: '100%',
                          maxWidth: '480px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '14px 20px',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                          🏁 Total Conversation Duration
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                          {formatDuration(activeSession.startedAt, activeSession.endedAt || messages[messages.length - 1]?.createdAt)}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {messages.length} messages across {activeSession.turnCount} turns
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                Select a session from the left to view conversation.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
