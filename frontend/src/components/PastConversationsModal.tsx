import React, { useState, useEffect, useMemo } from 'react';
import { ClassroomDetail, SessionData, ChatMessage, TeacherBadge } from '../types';
import { api } from '../api/client';
import { formatMessageTime, formatDuration } from '../utils/formatters';
import styles from './PastConversationsModal.module.css';

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
    <div id="past-conversations-modal-backdrop" className={styles.backdrop}>
      <div id="past-conversations-dialog" className={`glass-panel animate-slide-up ${styles.dialog}`}>
        {/* Top Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <span className={styles.headerIcon}>📜</span>
            <div>
              <h2 className={styles.title}>Past Classroom Conversations</h2>
              <p className={styles.subtitle}>
                Filter sessions by classroom and teacher to review complete dialogue transcripts
              </p>
            </div>
          </div>

          <button
            id="btn-close-past-conversations"
            type="button"
            className={`btn-secondary ${styles.closeBtn}`}
            onClick={onClose}
          >
            ✕ Close
          </button>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* Filter Toolbar: Step 1 (Classroom) + Step 2 (Teacher) */}
        <div className={styles.filterToolbar}>
          {/* Step 1: Select Classroom */}
          <div className={styles.filterItem}>
            <label htmlFor="filter-classroom" className={styles.filterLabelCyan}>
              1. Classroom:
            </label>
            <select
              id="filter-classroom"
              value={selectedClassroomId}
              onChange={(e) => {
                setSelectedClassroomId(e.target.value);
                setActiveSession(null);
              }}
              className={styles.filterSelect}
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
          <div className={styles.filterItem}>
            <label htmlFor="filter-teacher" className={styles.filterLabelPurple}>
              2. Teacher:
            </label>
            <select
              id="filter-teacher"
              value={selectedTeacherName}
              onChange={(e) => {
                setSelectedTeacherName(e.target.value);
                setActiveSession(null);
              }}
              className={styles.filterSelect}
            >
              <option value="ALL">All Teachers ({availableTeachers.length})</option>
              {availableTeachers.map((t) => (
                <option key={t} value={t}>
                  🧑‍🏫 {t}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterCount}>
            Found <strong>{filteredSessions.length}</strong> session{filteredSessions.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Content Split: Left (Session List) | Right (Conversation Transcript) */}
        <div className={styles.mainGrid}>
          {/* Left: Session List */}
          <div className={styles.sessionListCol}>
            {isLoadingSessions ? (
              <div className={styles.emptyPlaceholder}>Loading past sessions...</div>
            ) : filteredSessions.length === 0 ? (
              <div className={styles.emptyPlaceholder}>
                <div className={styles.emptyIcon}>📭</div>
                <p className={styles.emptyText}>No sessions found matching filters.</p>
              </div>
            ) : (
              filteredSessions.map((s) => {
                const isSelected = activeSession?.id === s.id;
                const participant = s.participants?.[0];
                const state = participant?.currentState || 'CONFIDENTLY_WRONG';

                return (
                  <div
                    key={s.id}
                    onClick={() => setActiveSession(s)}
                    className={`${styles.sessionCard} ${isSelected ? styles.sessionCardSelected : ''}`}
                  >
                    <div className={styles.sessionCardHeader}>
                      <div className={styles.teacherBadgeName}>
                        <span>{BADGE_EMOJIS[s.teacherBadge] || '🧑‍🏫'}</span>
                        <span>{s.teacherName}</span>
                      </div>
                      <span className={styles.sessionDate}>{formatDate(s.startedAt)}</span>
                    </div>

                    <div className={styles.sessionTopic}>
                      {s.scenarioTitle || 'The Cold Virus Spread'}
                    </div>

                    <div className={styles.sessionCardFooter}>
                      <span className={`state-badge state-${state} ${styles.stateBadgePill}`}>
                        {state}
                      </span>
                      <div className={styles.sessionMetrics}>
                        <span>⏱️ {formatDuration(s.startedAt, s.endedAt)}</span>
                        <span>•</span>
                        <span>{s.turnCount}t</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Full Conversation Stream */}
          <div className={styles.transcriptCol}>
            {activeSession ? (
              <>
                {/* Active Session Info Bar */}
                <div className={styles.activeSessionInfoBar}>
                  <div className={styles.activeSessionMeta}>
                    <span className={styles.activeSessionTitle}>
                      Session with {activeSession.participants?.[0]?.studentName || 'Sue'}
                    </span>
                    <span className={styles.activeSessionTeacher}>
                      Teacher: {activeSession.teacherName} ({BADGE_EMOJIS[activeSession.teacherBadge] || '🧑‍🏫'})
                    </span>
                  </div>

                  {/* Tabs: Messages vs Debrief */}
                  <div className={styles.tabsGroup}>
                    <button
                      type="button"
                      onClick={() => setViewingTab('MESSAGES')}
                      className={`${styles.tabButton} ${
                        viewingTab === 'MESSAGES' ? styles.tabButtonActiveMessages : ''
                      }`}
                    >
                      💬 Dialogue ({messages.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewingTab('DEBRIEF')}
                      className={`${styles.tabButton} ${
                        viewingTab === 'DEBRIEF' ? styles.tabButtonActiveDebrief : ''
                      }`}
                    >
                      📊 Debrief Report
                    </button>
                  </div>
                </div>

                {viewingTab === 'DEBRIEF' ? (
                  <div className={styles.debriefView}>
                    {activeSession.debrief ? (
                      <>
                        {/* Summary */}
                        <div className={styles.debriefSection}>
                          <div className={styles.debriefSectionTitleCyan}>
                            Teaching Assessment Summary
                          </div>
                          <p className={styles.debriefText}>
                            {activeSession.debrief.summary}
                          </p>
                        </div>

                        {/* Strategy Breakdown */}
                        <div className={styles.debriefSection}>
                          <div className={styles.debriefSectionTitlePurple}>
                            Strategy Breakdown
                          </div>
                          <div
                            className={styles.strategyBar}
                            style={{
                              '--probing-width': `${activeSession.debrief.strategyBreakdown?.['PROBING'] || 50}%`,
                              '--discovery-width': `${activeSession.debrief.strategyBreakdown?.['GUIDED_DISCOVERY'] || 35}%`,
                              '--telling-width': `${activeSession.debrief.strategyBreakdown?.['TELLING'] || 15}%`
                            } as React.CSSProperties}
                          >
                            <div className={styles.strategyBarProbing} />
                            <div className={styles.strategyBarDiscovery} />
                            <div className={styles.strategyBarTelling} />
                          </div>
                          <div className={styles.strategyLegend}>
                            <span>Probing: {activeSession.debrief.strategyBreakdown?.['PROBING'] || 50}%</span>
                            <span>Guided Discovery: {activeSession.debrief.strategyBreakdown?.['GUIDED_DISCOVERY'] || 35}%</span>
                            <span>Telling: {activeSession.debrief.strategyBreakdown?.['TELLING'] || 15}%</span>
                          </div>
                        </div>

                        {/* Breakthrough */}
                        {activeSession.debrief.breakthroughMoment && (
                          <div className={styles.breakthroughBox}>
                            <div className={styles.breakthroughTitle}>
                              💡 Turning Point
                            </div>
                            <p className={styles.debriefText}>
                              {activeSession.debrief.breakthroughMoment}
                            </p>
                          </div>
                        )}

                        {/* Strengths & Growth */}
                        <div className={styles.strengthsGrowthGrid}>
                          <div className={styles.strengthsCard}>
                            <div className={styles.cardTitleGreen}>Strengths</div>
                            <ul className={styles.list}>
                              {activeSession.debrief.strengths?.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>

                          <div className={styles.growthCard}>
                            <div className={styles.cardTitleYellow}>Coaching Advice</div>
                            <ul className={styles.list}>
                              {activeSession.debrief.growthOpportunities?.map((g, i) => (
                                <li key={i}>{g}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className={styles.emptyPlaceholder}>
                        <div className={styles.emptyIcon}>📊</div>
                        <p className={styles.emptyText}>
                          This session ended without generating an AI debrief report.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.dialogueStream}>
                    {isLoadingMessages ? (
                      <div className={styles.emptyPlaceholder}>Loading dialogue history...</div>
                    ) : messages.length === 0 ? (
                      <div className={styles.emptyPlaceholder}>No messages recorded in this session.</div>
                    ) : (
                      messages.map((m) => {
                        const isTeacher = m.senderType === 'TEACHER';
                        return (
                          <div
                            key={m.id}
                            className={`${styles.msgRow} ${
                              isTeacher ? styles.msgRowTeacher : styles.msgRowStudent
                            }`}
                          >
                            {/* Avatar */}
                            {isTeacher ? (
                              <div className={styles.teacherAvatar}>
                                {BADGE_EMOJIS[activeSession.teacherBadge] || '🧑‍🏫'}
                              </div>
                            ) : (
                              <img
                                src={m.avatarUrl || '/images/avatar_sue.png'}
                                alt="Student"
                                className={styles.studentAvatar}
                              />
                            )}

                            {/* Bubble */}
                            <div>
                              <div
                                className={`${styles.msgHeader} ${
                                  isTeacher ? styles.msgHeaderTeacher : styles.msgHeaderStudent
                                }`}
                              >
                                <span className={styles.senderName}>
                                  {isTeacher ? activeSession.teacherName : m.senderName}
                                </span>
                                <span className={styles.turnBadge}>Turn #{m.turnNumber}</span>
                                <span
                                  title={new Date(m.createdAt || Date.now()).toLocaleString()}
                                  className={styles.timeBadge}
                                >
                                  <span className={styles.timeIcon}>🕒</span>
                                  <span>{formatMessageTime(m.createdAt || new Date().toISOString())}</span>
                                </span>
                              </div>

                              <div
                                className={`${styles.bubble} ${
                                  isTeacher ? styles.bubbleTeacher : styles.bubbleStudent
                                }`}
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
                      <div className={styles.concludedSummaryCard}>
                        <div className={styles.concludedTitle}>
                          🏁 Total Conversation Duration
                        </div>
                        <div className={styles.concludedDuration}>
                          {formatDuration(
                            activeSession.startedAt,
                            activeSession.endedAt || messages[messages.length - 1]?.createdAt
                          )}
                        </div>
                        <div className={styles.concludedSubtext}>
                          {messages.length} messages across {activeSession.turnCount} turns
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noSessionSelected}>
                Select a session from the left to view conversation.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
