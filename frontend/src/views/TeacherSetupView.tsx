import React, { useState } from 'react';
import { ClassroomDetail, TeacherBadge } from '../types';
import { TeacherBadgeSelector } from '../components/TeacherBadgeSelector';

interface Props {
  classroom: ClassroomDetail;
  onStartSession: (teacherName: string, teacherBadge: TeacherBadge) => Promise<void>;
  isLoading: boolean;
}

type ClassroomTab = 'SCIENCE' | 'MATH';

export const TeacherSetupView: React.FC<Props> = ({
  classroom,
  onStartSession,
  isLoading
}) => {
  const [selectedTab, setSelectedTab] = useState<ClassroomTab>('SCIENCE');
  const [teacherName, setTeacherName] = useState<string>('Teacher Alex');
  const [teacherBadge, setTeacherBadge] = useState<TeacherBadge>('fox');
  const [error, setError] = useState<string | null>(null);

  const scenario = classroom.scenarios?.[0];
  const student = classroom.students?.[0];

  const handleEnterClassroom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!teacherName.trim()) {
      setError('Please enter your teacher name before entering the classroom.');
      return;
    }
    setError(null);
    try {
      await onStartSession(teacherName.trim(), teacherBadge);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
    }
  };

  return (
    <div id="home-page-container" style={{ minHeight: 'calc(100vh - 68px)', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Big Background Image Hero Banner */}
      <section
        id="hero-banner"
        className="hero-banner"
      >
        <div
          className="container-max"
          style={{
            maxWidth: '860px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(56, 189, 248, 0.16)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: 'var(--accent-cyan)',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}
          >
            <span>🔬</span>
            <span>Interactive AI Pedagogy Lab</span>
          </div>

          <h1 className="hero-title">
            Learn by <span className="gradient-text">Teaching</span>
          </h1>

          <p className="hero-subtitle">
            Step into the teacher's role. Guide an AI middle school student holding a common scientific misconception and guide them toward authentic causal understanding.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '8px',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}
          >
            <div className="hero-pill">
              <span>🧠</span> Dynamic Mental Model States
            </div>
            <div className="hero-pill">
              <span>⚡</span> Probing vs. Telling Mechanics
            </div>
            <div className="hero-pill">
              <span>📊</span> Pedagogical Debrief
            </div>
          </div>
        </div>
      </section>

      {/* 2. "Choose a classroom" Section with Tabs */}
      <section
        id="choose-classroom-section"
        style={{
          flex: 1,
          padding: '40px 20px 60px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <div className="container-max" style={{ maxWidth: '860px', width: '100%' }}>
          {/* Section Heading */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1.9rem', marginBottom: '6px', fontWeight: 800 }}>
              Choose a classroom
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', margin: 0 }}>
              Select a subject to configure your teacher profile and enter the learning session
            </p>
          </div>

          {/* Classroom Tabs */}
          <div
            id="classroom-tabs-bar"
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              marginBottom: '28px',
              borderBottom: '1px solid var(--glass-border)',
              paddingBottom: '12px'
            }}
          >
            {/* Science Tab */}
            <button
              id="tab-classroom-science"
              type="button"
              onClick={() => setSelectedTab('SCIENCE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 28px',
                borderRadius: 'var(--radius-lg)',
                background: selectedTab === 'SCIENCE'
                  ? 'var(--gradient-brand-subtle)'
                  : 'var(--bg-surface)',
                border: selectedTab === 'SCIENCE'
                  ? '1.5px solid var(--accent-cyan)'
                  : '1px solid var(--glass-border)',
                color: selectedTab === 'SCIENCE' ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: selectedTab === 'SCIENCE' ? '0 0 20px rgba(56, 189, 248, 0.25)' : 'none',
                transition: 'all var(--transition-fast)'
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>🔬</span>
              <span>Science</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                Active
              </span>
            </button>

            {/* Math Tab (Coming Soon) */}
            <button
              id="tab-classroom-math"
              type="button"
              onClick={() => setSelectedTab('MATH')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 28px',
                borderRadius: 'var(--radius-lg)',
                background: selectedTab === 'MATH'
                  ? 'var(--bg-surface-active)'
                  : 'var(--bg-surface)',
                border: selectedTab === 'MATH'
                  ? '1.5px solid var(--accent-indigo)'
                  : '1px solid var(--glass-border)',
                color: 'var(--text-dim)',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>📐</span>
              <span>Math</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(234, 179, 8, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(234, 179, 8, 0.3)'
                }}
              >
                Coming Soon
              </span>
            </button>
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                color: 'var(--state-confidently-wrong)',
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                marginBottom: '20px'
              }}
            >
              {error}
            </div>
          )}

          {/* Tab 1: Science Classroom Content */}
          {selectedTab === 'SCIENCE' ? (
            <div
              className="glass-panel animate-slide-up"
              style={{
                padding: '32px 36px',
                display: 'flex',
                flexDirection: 'column',
                gap: '28px'
              }}
            >
              <form onSubmit={handleEnterClassroom} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '28px'
                  }}
                >
                  {/* Left Column: Teacher Setup */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label
                        htmlFor="teacher-name-input"
                        style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}
                      >
                        Teacher Name
                      </label>
                      <input
                        id="teacher-name-input"
                        type="text"
                        value={teacherName}
                        onChange={(e) => setTeacherName(e.target.value)}
                        placeholder="e.g. Ms. Rivera, Teacher Alex..."
                        required
                        style={{
                          width: '100%',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '12px 16px',
                          color: 'var(--text-main)',
                          fontSize: '0.95rem',
                          outline: 'none',
                          transition: 'all var(--transition-fast)'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--accent-cyan)';
                          e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--glass-border)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}
                      >
                        Choose Teacher Avatar Badge
                      </label>
                      <TeacherBadgeSelector
                        selectedBadge={teacherBadge}
                        onSelect={(b) => setTeacherBadge(b)}
                      />
                    </div>
                  </div>

                  {/* Right Column: Classroom & Student Preview */}
                  <div
                    className="glass-panel-subtle"
                    style={{
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '16px'
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--accent-cyan)',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          marginBottom: '4px'
                        }}
                      >
                        Classroom Assignment
                      </div>
                      <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
                        {classroom.name}
                      </h3>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                        {classroom.description}
                      </p>

                      {/* Student on roster preview */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          background: 'var(--bg-surface)',
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-lg)',
                          border: '1px solid var(--glass-border)'
                        }}
                      >
                        <img
                          src={student?.avatarUrl || '/images/avatar_sue.jpg'}
                          alt={student?.name || 'Sue'}
                          style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: 'var(--radius-full)',
                            objectFit: 'cover',
                            border: '2px solid rgba(255, 255, 255, 0.2)'
                          }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>
                              {student?.name || 'Sue'}
                            </span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '1px 8px',
                                borderRadius: 'var(--radius-full)',
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: 'var(--text-muted)'
                              }}
                            >
                              {student?.gradeLevel || '8th Grade'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                            {student?.personality || 'Thoughtful & hesitant student exploring disease transmission.'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {scenario && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                        <strong style={{ color: 'var(--text-main)' }}>Topic:</strong> {scenario.title} · Sam & Anthony's illness sequence
                      </div>
                    )}
                  </div>
                </div>

                {/* Enter Classroom Action Button */}
                <div style={{ textAlign: 'center', marginTop: '4px' }}>
                  <button
                    id="btn-enter-science-classroom"
                    type="submit"
                    disabled={isLoading || !teacherName.trim()}
                    className="btn-primary animate-glow"
                    style={{
                      width: '100%',
                      maxWidth: '420px',
                      padding: '16px 36px',
                      fontSize: '1.08rem',
                      borderRadius: 'var(--radius-xl)'
                    }}
                  >
                    {isLoading ? 'Opening Classroom...' : 'Enter Science Classroom & Start Teaching →'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Tab 2: Math Classroom Preview (Coming Soon) */
            <div
              className="glass-panel animate-slide-up"
              style={{
                padding: '48px 32px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div style={{ fontSize: '3rem' }}>📐</div>
              <h3 style={{ fontSize: '1.4rem', margin: 0 }}>Math Classroom</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: 0, fontSize: '0.92rem', lineHeight: 1.6 }}>
                The Math Classroom is currently under development. AI-generated dynamic math scenarios (ratios, algebraic logic, word problems) will be available in the next release!
              </p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedTab('SCIENCE')}
                style={{ marginTop: '8px', padding: '10px 20px' }}
              >
                ← Switch back to Science Classroom
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
