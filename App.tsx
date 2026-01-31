
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Storage from './components/Storage';
import Chat from './components/Chat';
import Timetable from './components/Timetable';
import Notes from './components/Notes';
import Attendance from './components/Attendance';
import Results from './components/Results';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Profile from './components/Profile';
import Community from './components/Community';
import { AcademicFile, Reminder, TimetableEntry, Subject, Note, AppView, UserProfile, SemesterResult } from './types';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('unihub_logged_in') === 'true');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('unihub_profile');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [activeView, setActiveView] = useState<AppView>('dashboard');

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('unihub_dark_mode');
    return saved === 'true';
  });
  
  const [files, setFiles] = useState<AcademicFile[]>(() => {
    try {
      const saved = localStorage.getItem('unihub_files');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const saved = localStorage.getItem('unihub_reminders');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [timetable, setTimetable] = useState<TimetableEntry[]>(() => {
    try {
      const saved = localStorage.getItem('unihub_timetable');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
      const saved = localStorage.getItem('unihub_subjects');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('unihub_notes');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [examResults, setExamResults] = useState<SemesterResult[]>(() => {
    try {
      const saved = localStorage.getItem('unihub_exam_results');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Dark Mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('unihub_dark_mode', isDarkMode.toString());
  }, [isDarkMode]);

  // Persistence Effects
  const safeSave = (key: string, data: any) => {
    if (isLoggedIn) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.warn(`Failed to save ${key} to localStorage:`, e);
      }
    }
  };

  useEffect(() => safeSave('unihub_files', files), [files, isLoggedIn]);
  useEffect(() => safeSave('unihub_reminders', reminders), [reminders, isLoggedIn]);
  useEffect(() => safeSave('unihub_timetable', timetable), [timetable, isLoggedIn]);
  useEffect(() => safeSave('unihub_subjects', subjects), [subjects, isLoggedIn]);
  useEffect(() => safeSave('unihub_notes', notes), [notes, isLoggedIn]);
  useEffect(() => safeSave('unihub_exam_results', examResults), [examResults, isLoggedIn]);
  useEffect(() => safeSave('unihub_profile', userProfile), [userProfile, isLoggedIn]);
  useEffect(() => localStorage.setItem('unihub_logged_in', isLoggedIn.toString()), [isLoggedIn]);

  const handleAuthSuccess = (profile: UserProfile) => {
    setUserProfile(profile);
    setIsLoggedIn(true);
    localStorage.setItem('unihub_logged_in', 'true');
  };

  const handleOnboardingComplete = (profile: UserProfile, subs: Subject[], table: TimetableEntry[]) => {
    setUserProfile(profile);
    setSubjects(subs);
    setTimetable(table);
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserProfile(null);
    setFiles([]);
    setReminders([]);
    setTimetable([]);
    setSubjects([]);
    setNotes([]);
    setExamResults([]);
    
    localStorage.removeItem('unihub_logged_in');
    localStorage.removeItem('unihub_profile');
    localStorage.removeItem('unihub_files');
    localStorage.removeItem('unihub_reminders');
    localStorage.removeItem('unihub_timetable');
    localStorage.removeItem('unihub_subjects');
    localStorage.removeItem('unihub_notes');
    localStorage.removeItem('unihub_exam_results');
    
    setActiveView('dashboard');
  };

  if (!isLoggedIn) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  if (userProfile && !userProfile.isSetupComplete) {
    return <Onboarding onComplete={handleOnboardingComplete} initialProfile={userProfile} />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard 
            reminders={reminders} 
            setReminders={setReminders} 
            subjects={subjects} 
            timetable={timetable} 
            profile={userProfile}
            files={files}
          />
        );
      case 'storage':
        return <Storage files={files} setFiles={setFiles} />;
      case 'chat':
        return <Chat files={files} reminders={reminders} timetable={timetable} profile={userProfile} examResults={examResults} />;
      case 'timetable':
        return <Timetable timetable={timetable} setTimetable={setTimetable} subjects={subjects} />;
      case 'notes':
        return <Notes notes={notes} setNotes={setNotes} subjects={subjects} />;
      case 'attendance':
        return <Attendance subjects={subjects} setSubjects={setSubjects} profile={userProfile} setProfile={setUserProfile} />;
      case 'results':
        return <Results results={examResults} setResults={setExamResults} subjects={subjects} setSubjects={setSubjects} />;
      case 'community':
        return <Community profile={userProfile} />;
      case 'profile':
        return <Profile profile={userProfile} setProfile={setUserProfile} subjects={subjects} setSubjects={setSubjects} />;
      default:
        return (
          <Dashboard 
            reminders={reminders} 
            setReminders={setReminders} 
            subjects={subjects} 
            timetable={timetable} 
            profile={userProfile}
            files={files}
          />
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onLogout={handleLogout} 
        profile={userProfile}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
      <main className="flex-1 overflow-y-auto relative p-4 md:p-8 transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
