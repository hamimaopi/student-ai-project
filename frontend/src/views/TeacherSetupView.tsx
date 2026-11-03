import React, { useState } from 'react';
import { ClassroomDetail, TeacherBadge } from '../types';
import { TeacherBadgeSelector } from '../components/TeacherBadgeSelector';
import styles from './TeacherSetupView.module.css';

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
    <div id="home-page-container" className={styles.pageContainer}>
      {/* 1. Big Background Image Hero Banner */}
      <section id="hero-banner" className="hero-banner">
        <div className={`container-max ${styles.heroContent}`}>
          <div className={styles.badgePill}>
            <span>🔬</span>
            <span>Interactive AI Pedagogy Lab</span>
          </div>

          <h1 className="hero-title">
            Learn by <span className="gradient-text">Teaching</span>
          </h1>

          <p className="hero-subtitle">
            Step into the teacher's role. Guide an AI middle school student holding a common scientific misconception and guide them toward authentic causal understanding.
          </p>

          <div className={styles.heroPillsRow}>
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
      <section id="choose-classroom-section" className={styles.section}>
        <div className={`container-max ${styles.sectionWrapper}`}>
          {/* Section Heading */}
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Choose a classroom
            </h2>
            <p className={styles.sectionSubtitle}>
              Select a subject to configure your teacher profile and enter the learning session
            </p>
          </div>

          {/* Classroom Tabs */}
          <div id="classroom-tabs-bar" className={styles.tabsBar}>
            {/* Science Tab */}
            <button
              id="tab-classroom-science"
              type="button"
              onClick={() => setSelectedTab('SCIENCE')}
              className={`${styles.tabButton} ${styles.tabButtonScience} ${selectedTab === 'SCIENCE' ? styles.tabButtonScienceActive : ''}`}
            >
              <span className={styles.tabIcon}>🔬</span>
              <span>Science</span>
              <span className={styles.tabBadgeActive}>
                Active
              </span>
            </button>

            {/* Math Tab (Coming Soon) */}
            <button
              id="tab-classroom-math"
              type="button"
              onClick={() => setSelectedTab('MATH')}
              className={`${styles.tabButton} ${styles.tabButtonMath} ${selectedTab === 'MATH' ? styles.tabButtonMathActive : ''}`}
            >
              <span className={styles.tabIcon}>📐</span>
              <span>Math</span>
              <span className={styles.tabBadgeComingSoon}>
                Coming Soon
              </span>
            </button>
          </div>

          {error && (
            <div className={styles.errorBanner}>
              {error}
            </div>
          )}

          {/* Tab 1: Science Classroom Content */}
          {selectedTab === 'SCIENCE' ? (
            <div className={`glass-panel animate-slide-up ${styles.setupCard}`}>
              <form onSubmit={handleEnterClassroom} className={styles.form}>
                <div className={styles.formGrid}>
                  {/* Left Column: Teacher Setup */}
                  <div className={styles.leftCol}>
                    <div>
                      <label
                        htmlFor="teacher-name-input"
                        className={styles.inputLabel}
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
                        className={styles.textInput}
                      />
                    </div>

                    <div>
                      <label className={styles.inputLabel}>
                        Choose Teacher Avatar Badge
                      </label>
                      <TeacherBadgeSelector
                        selectedBadge={teacherBadge}
                        onSelect={(b) => setTeacherBadge(b)}
                      />
                    </div>
                  </div>

                  {/* Right Column: Classroom & Student Preview */}
                  <div className={`glass-panel-subtle ${styles.rightCol}`}>
                    <div>
                      <div className={styles.assignmentBadge}>
                        Classroom Assignment
                      </div>
                      <h3 className={styles.classroomHeading}>
                        {classroom.name}
                      </h3>
                      <p className={styles.classroomDesc}>
                        {classroom.description}
                      </p>

                      {/* Student on roster preview */}
                      <div className={styles.studentCard}>
                        <img
                          src={student?.avatarUrl || '/images/avatar_sue.jpg'}
                          alt={student?.name || 'Sue'}
                          className={styles.studentAvatar}
                        />
                        <div>
                          <div className={styles.studentNameRow}>
                            <span className={styles.studentName}>
                              {student?.name || 'Sue'}
                            </span>
                            <span className={styles.studentGradeBadge}>
                              {student?.gradeLevel || '8th Grade'}
                            </span>
                          </div>
                          <div className={styles.studentPersonality}>
                            {student?.personality || 'Thoughtful & hesitant student exploring disease transmission.'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {scenario && (
                      <div className={styles.scenarioFooter}>
                        <strong className={styles.scenarioTopicStrong}>Topic:</strong> {scenario.title} · Sam & Anthony's illness sequence
                      </div>
                    )}
                  </div>
                </div>

                {/* Enter Classroom Action Button */}
                <div className={styles.submitRow}>
                  <button
                    id="btn-enter-science-classroom"
                    type="submit"
                    disabled={isLoading || !teacherName.trim()}
                    className={`btn-primary animate-glow ${styles.enterButton}`}
                  >
                    {isLoading ? 'Opening Classroom...' : 'Enter Science Classroom & Start Teaching →'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Tab 2: Math Classroom Preview (Coming Soon) */
            <div className={`glass-panel animate-slide-up ${styles.mathPlaceholderCard}`}>
              <div className={styles.mathIcon}>📐</div>
              <h3 className={styles.mathTitle}>Math Classroom</h3>
              <p className={styles.mathDescription}>
                The Math Classroom is currently under development. AI-generated dynamic math scenarios (ratios, algebraic logic, word problems) will be available in the next release!
              </p>
              <button
                type="button"
                className={`btn-secondary ${styles.switchBackBtn}`}
                onClick={() => setSelectedTab('SCIENCE')}
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
