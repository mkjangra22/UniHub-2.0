
import React, { useState, useEffect, useRef } from 'react';
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
import { fetchUserDataFromFirestore, saveUserDataToFirestore } from './services/dbService';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('unihub_logged_in') === 'true');
  const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem('unihub_active_user_id') || '');

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const uid = localStorage.getItem('unihub_active_user_id') || '';
      const key = uid ? `unihub_${uid}_profile` : 'unihub_profile';
      const saved = localStorage.getItem(key);
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
      const uid = localStorage.getItem('unihub_active_user_id') || '';
      const key = uid ? `unihub_${uid}_files` : 'unihub_files';
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const uid = localStorage.getItem('unihub_active_user_id') || '';
      const key = uid ? `unihub_${uid}_reminders` : 'unihub_reminders';
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [timetable, setTimetable] = useState<TimetableEntry[]>(() => {
    try {
      const uid = localStorage.getItem('unihub_active_user_id') || '';
      const key = uid ? `unihub_${uid}_timetable` : 'unihub_timetable';
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
      const uid = localStorage.getItem('unihub_active_user_id') || '';
      const key = uid ? `unihub_${uid}_subjects` : 'unihub_subjects';
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const uid = localStorage.getItem('unihub_active_user_id') || '';
      const key = uid ? `unihub_${uid}_notes` : 'unihub_notes';
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [examResults, setExamResults] = useState<SemesterResult[]>(() => {
    try {
      const uid = localStorage.getItem('unihub_active_user_id') || '';
      const key = uid ? `unihub_${uid}_exam_results` : 'unihub_exam_results';
      const saved = localStorage.getItem(key);
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
  const isDataLoadedRef = useRef(false);

  const safeSave = async (key: string, data: any) => {
    if (isLoggedIn && currentUserId) {
      try {
        const isolatedKey = `unihub_${currentUserId}_${key.replace('unihub_', '')}`;
        localStorage.setItem(isolatedKey, JSON.stringify(data));
        
        // Only push to Firestore if the initial data load has finished!
        if (isDataLoadedRef.current) {
          await saveUserDataToFirestore(currentUserId, key, data);
        }
      } catch (e) {
        console.warn(`Failed to save ${key}:`, e);
      }
    }
  };

  useEffect(() => { safeSave('unihub_files', files); }, [files, isLoggedIn, currentUserId]);
  useEffect(() => { safeSave('unihub_reminders', reminders); }, [reminders, isLoggedIn, currentUserId]);
  useEffect(() => { safeSave('unihub_timetable', timetable); }, [timetable, isLoggedIn, currentUserId]);
  useEffect(() => { safeSave('unihub_subjects', subjects); }, [subjects, isLoggedIn, currentUserId]);
  useEffect(() => { safeSave('unihub_notes', notes); }, [notes, isLoggedIn, currentUserId]);
  useEffect(() => { safeSave('unihub_exam_results', examResults); }, [examResults, isLoggedIn, currentUserId]);
  useEffect(() => { safeSave('unihub_profile', userProfile); }, [userProfile, isLoggedIn, currentUserId]);
  useEffect(() => localStorage.setItem('unihub_logged_in', isLoggedIn.toString()), [isLoggedIn]);

  // Load latest data from Firestore on Mount/Login
  useEffect(() => {
    if (!isLoggedIn || !currentUserId) {
      isDataLoadedRef.current = false;
      return;
    }

    isDataLoadedRef.current = false; // Reset loaded flag on user switch
    const loadData = async () => {
      try {
        const firestoreData = await fetchUserDataFromFirestore(currentUserId);
        if (firestoreData) {
          if (firestoreData.profile) setUserProfile(firestoreData.profile);
          if (firestoreData.files) setFiles(firestoreData.files);
          if (firestoreData.reminders) setReminders(firestoreData.reminders);
          if (firestoreData.timetable) setTimetable(firestoreData.timetable);
          if (firestoreData.subjects) setSubjects(firestoreData.subjects);
          if (firestoreData.notes) setNotes(firestoreData.notes);
          if (firestoreData.exam_results) setExamResults(firestoreData.exam_results);
        }
      } catch (err) {
        console.error("Error loading user data from Firestore:", err);
      } finally {
        isDataLoadedRef.current = true;
      }
    };

    loadData();
  }, [isLoggedIn, currentUserId]);

  const handleAuthSuccess = (profile: UserProfile, userId: string) => {
    setCurrentUserId(userId);
    setUserProfile(profile);
    setIsLoggedIn(true);
    localStorage.setItem('unihub_logged_in', 'true');
    localStorage.setItem('unihub_active_user_id', userId);

    // Isolated reload of the user's details
    const userPrefix = `unihub_${userId}`;

    const savedFiles = localStorage.getItem(`${userPrefix}_files`);
    setFiles(savedFiles ? JSON.parse(savedFiles) : []);

    const savedReminders = localStorage.getItem(`${userPrefix}_reminders`);
    setReminders(savedReminders ? JSON.parse(savedReminders) : []);

    const savedTimetable = localStorage.getItem(`${userPrefix}_timetable`);
    setTimetable(savedTimetable ? JSON.parse(savedTimetable) : []);

    const savedSubjects = localStorage.getItem(`${userPrefix}_subjects`);
    setSubjects(savedSubjects ? JSON.parse(savedSubjects) : []);

    const savedNotes = localStorage.getItem(`${userPrefix}_notes`);
    setNotes(savedNotes ? JSON.parse(savedNotes) : []);

    const savedExamResults = localStorage.getItem(`${userPrefix}_exam_results`);
    setExamResults(savedExamResults ? JSON.parse(savedExamResults) : []);
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
    setCurrentUserId('');
    
    localStorage.removeItem('unihub_logged_in');
    localStorage.removeItem('unihub_active_user_id');
    
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
            notes={notes}
            setActiveView={setActiveView}
          />
        );
      case 'storage':
        return <Storage files={files} setFiles={setFiles} />;
      case 'chat':
        return <Chat files={files} reminders={reminders} timetable={timetable} profile={userProfile} examResults={examResults} />;
      case 'timetable':
        return <Timetable timetable={timetable} setTimetable={setTimetable} subjects={subjects} profile={userProfile} setProfile={setUserProfile} />;
      case 'notes':
        return <Notes notes={notes} setNotes={setNotes} subjects={subjects} />;
      case 'attendance':
        return <Attendance subjects={subjects} setSubjects={setSubjects} profile={userProfile} setProfile={setUserProfile} />;
      case 'results':
        return <Results results={examResults} setResults={setExamResults} subjects={subjects} setSubjects={setSubjects} />;
      case 'community':
        return <Community profile={userProfile} />;
      case 'profile':
        return (
          <Profile 
            profile={userProfile} 
            setProfile={setUserProfile} 
            subjects={subjects} 
            setSubjects={setSubjects} 
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            onLogout={handleLogout}
          />
        );
      default:
        return (
          <Dashboard 
            reminders={reminders} 
            setReminders={setReminders} 
            subjects={subjects} 
            timetable={timetable} 
            profile={userProfile}
            files={files}
            notes={notes}
            setActiveView={setActiveView}
          />
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        profile={userProfile}
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
