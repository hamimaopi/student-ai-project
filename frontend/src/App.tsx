import { useState, useEffect } from 'react';
import { ClassroomDetail, SessionData, TeacherBadge } from './types';
import { api } from './api/client';
import { Navbar } from './components/Navbar';
import { TeacherSetupView } from './views/TeacherSetupView';
import { ClassroomView } from './views/ClassroomView';
import { PastConversationsModal } from './components/PastConversationsModal';
import './styles/index.css';

export default function App() {
  const [classrooms, setClassrooms] = useState<ClassroomDetail[]>([]);
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showPastConversations, setShowPastConversations] = useState<boolean>(false);
  const [endLessonSignal, setEndLessonSignal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('student_ai_theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('student_ai_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    let isMounted = true;
    api.getClassrooms()
      .then((data) => {
        if (isMounted) {
          setClassrooms(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load classrooms:', err);
          setError('Could not connect to the backend server. Please verify backend is running on port 8080.');
          setIsLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, []);

  const handleStartSession = async (teacherName: string, teacherBadge: TeacherBadge) => {
    if (classrooms.length === 0) {
      throw new Error('No classrooms available to start a session.');
    }

    const defaultClassroom = classrooms[0];
    const defaultScenario = defaultClassroom.scenarios?.[0];

    if (!defaultScenario) {
      throw new Error('No scenario configured in this classroom.');
    }

    const session = await api.createSession({
      teacherName,
      teacherBadge,
      classroomId: defaultClassroom.id,
      scenarioId: defaultScenario.id,
      studentIds: defaultClassroom.students?.map((s) => s.id)
    });

    setActiveSession(session);
  };

  const handleRestart = () => {
    setActiveSession(null);
  };

  const handleGoHome = () => {
    if (activeSession) {
      if (window.confirm('Do you want to leave the active classroom session and return to the Home page?')) {
        setActiveSession(null);
      }
    } else {
      setActiveSession(null);
    }
  };

  const activeClassroom = classrooms[0];

  return (
    <div className="app-viewport">
      <Navbar
        classroomName={activeSession?.classroomName}
        teacherName={activeSession?.teacherName}
        teacherBadge={activeSession?.teacherBadge}
        turnCount={activeSession?.turnCount}
        onEndSession={activeSession ? () => setEndLessonSignal((s) => s + 1) : undefined}
        onOpenPastConversations={() => setShowPastConversations(true)}
        onGoHome={handleGoHome}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {error ? (
        <div style={{ margin: 'auto', textAlign: 'center', padding: '40px 20px', maxWidth: '520px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Connection Error</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>
            {error}
          </p>
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: '20px' }}
            onClick={() => window.location.reload()}
          >
            Retry Connection
          </button>
        </div>
      ) : isLoading ? (
        <div style={{ margin: 'auto', textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔬</div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Loading Science Classroom...</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Initializing curriculum and student models
          </p>
        </div>
      ) : !activeSession && activeClassroom ? (
        <TeacherSetupView
          classroom={activeClassroom}
          onStartSession={handleStartSession}
          isLoading={isLoading}
        />
      ) : activeSession ? (
        <ClassroomView
          session={activeSession}
          onSessionEnded={() => setActiveSession(null)}
          onRestart={handleRestart}
          endLessonSignal={endLessonSignal}
          onSessionUpdated={(updated) => setActiveSession(updated)}
        />
      ) : null}

      {showPastConversations && (
        <PastConversationsModal
          classrooms={classrooms}
          onClose={() => setShowPastConversations(false)}
        />
      )}
    </div>
  );
}
