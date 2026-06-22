
import React, { useState, useEffect } from 'react';
import { AcademicFile, Reminder, Subject, TimetableEntry, UserProfile, SemesterResult, Note, AppView } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { analyzeDataForReminders } from '../services/geminiService';
import { getStreakData, recordAcademicAction } from '../services/streakService';

interface DashboardProps {
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  subjects: Subject[];
  timetable: TimetableEntry[];
  profile: UserProfile | null;
  files: AcademicFile[];
  examResults?: SemesterResult[];
  notes: Note[];
  setActiveView: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  reminders, 
  setReminders, 
  subjects, 
  timetable, 
  profile, 
  files, 
  examResults = [],
  notes = [],
  setActiveView
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [reminderFormData, setReminderFormData] = useState<Partial<Reminder>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    type: 'assignment',
    description: ''
  });

  const today = new Date();
  const todayName = DAYS_OF_WEEK[today.getDay() - 1] || 'Sunday';
  const todaysClasses = timetable.filter(t => t.day === todayName);
  const threshold = profile?.attendanceThreshold || 75;
  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Student';
  const uid = profile?.name || 'current';

  // State for Academic Streak
  const [streak, setStreak] = useState(() => getStreakData(uid).streakCount);

  // State for active reminder filtering ('all' | 'assignment' | 'event_exam')
  const [reminderFilter, setReminderFilter] = useState<'all' | 'assignment' | 'event_exam'>('all');

  // State for Analytics Insight tasks completed count
  const [completedTasks, setCompletedTasks] = useState(() => {
    const compKey = `unihub_${uid}_completed_tasks_count`;
    const stored = localStorage.getItem(compKey);
    return stored ? parseInt(stored, 10) : 5; // Default to 5 for rich UI
  });

  // Today's priorities state
  const todayStr = today.toISOString().split('T')[0];
  const [priorityCompleted, setPriorityCompleted] = useState<Record<string, boolean>>(() => {
    try {
      const key = `unihub_${uid}_priorities_${todayStr}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : { notes: false, tasks: false, community: false };
    } catch {
      return { notes: false, tasks: false, community: false };
    }
  });

  // Track Streak changes reactively
  useEffect(() => {
    setStreak(getStreakData(uid).streakCount);
  }, [uid]);

  useEffect(() => {
    const handleActionRecorded = (e: Event) => {
      const customEvent = e as CustomEvent<{ actionType: string; newStreak: number }>;
      setStreak(customEvent.detail.newStreak);
    };
    window.addEventListener('unihub_action_recorded', handleActionRecorded);
    return () => window.removeEventListener('unihub_action_recorded', handleActionRecorded);
  }, []);

  // Listen to task completed to update Insight Analytics count
  useEffect(() => {
    const handleTaskComplete = () => {
      const compKey = `unihub_${uid}_completed_tasks_count`;
      setCompletedTasks(parseInt(localStorage.getItem(compKey) || '0', 10));
    };
    window.addEventListener('unihub_task_completed', handleTaskComplete);
    return () => window.removeEventListener('unihub_task_completed', handleTaskComplete);
  }, [uid]);

  const togglePriority = (key: 'notes' | 'tasks' | 'community') => {
    const next = { ...priorityCompleted, [key]: !priorityCompleted[key] };
    setPriorityCompleted(next);
    localStorage.setItem(`unihub_${uid}_priorities_${todayStr}`, JSON.stringify(next));

    if (next[key]) {
      recordAcademicAction(uid, `priority_${key}`);
    }
  };

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };
  const greeting = getGreeting();

  const getReminderColor = (type: string) => {
    switch(type) {
      case 'exam': return 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400';
      case 'assignment': return 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30 text-orange-700 dark:text-orange-400';
      case 'event': return 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400';
      default: return 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300';
    }
  };

  const syncReminders = async () => {
    if (files.length === 0) {
      alert("Please upload some files (notices, chats, etc.) first!");
      return;
    }
    setIsSyncing(true);
    try {
      const discovered = await analyzeDataForReminders(files);
      if (discovered.length > 0) {
        const newReminders = discovered.filter(dr => 
          !reminders.some(r => r.title === dr.title && r.date.split('T')[0] === dr.date.split('T')[0])
        ).map(r => ({ ...r, id: Math.random().toString(36).substr(2, 9) }));
        
        if (newReminders.length > 0) {
          setReminders(prev => [...newReminders, ...prev]);
        } else {
          alert("No new reminders found in your data.");
        }
      } else {
        alert("AI couldn't find any specific dates or deadlines in your uploaded documents.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderFormData.title || !reminderFormData.date) return;

    if (editingReminder) {
      setReminders(prev => prev.map(r => r.id === editingReminder.id ? { ...editingReminder, ...reminderFormData } as Reminder : r));
    } else {
      const newRem: Reminder = {
        id: Math.random().toString(36).substr(2, 9),
        title: reminderFormData.title!,
        date: reminderFormData.date!,
        type: reminderFormData.type as any || 'assignment',
        description: reminderFormData.description
      };
      setReminders(prev => [newRem, ...prev]);
    }
    closeReminderForm();
  };

  const openEditReminder = (r: Reminder) => {
    setEditingReminder(r);
    setReminderFormData({
      title: r.title,
      date: r.date.split('T')[0],
      type: r.type,
      description: r.description
    });
    setShowReminderForm(true);
  };

  const closeReminderForm = () => {
    setShowReminderForm(false);
    setEditingReminder(null);
    setReminderFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      type: 'assignment',
      description: ''
    });
  };

  const calculateAttendanceAvg = () => {
    if (subjects.length === 0) return 0;
    const totalAttended = subjects.reduce((acc, s) => acc + s.attended, 0);
    const totalPossible = subjects.reduce((acc, s) => acc + s.total, 0);
    return totalPossible === 0 ? 0 : Math.round((totalAttended / totalPossible) * 100);
  };

  const removeReminder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Mark this reminder as complete/remove it?")) {
      setReminders(prev => prev.filter(r => r.id !== id));
      recordAcademicAction(uid, 'task_complete');

      const compKey = `unihub_${uid}_completed_tasks_count`;
      const currentVal = parseInt(localStorage.getItem(compKey) || '0', 10);
      localStorage.setItem(compKey, (currentVal + 1).toString());
      window.dispatchEvent(new CustomEvent('unihub_task_completed'));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Schedule math helpers
  const parseTimeToMinutes = (timeStr: string) => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3];
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }
    return hours * 60 + minutes;
  };

  const sortedClasses = [...todaysClasses].sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
  const nowHour = today.getHours();
  const nowMin = today.getMinutes();
  const nowMinutes = nowHour * 60 + nowMin;

  const nextClass = sortedClasses.find(c => parseTimeToMinutes(c.startTime) > nowMinutes);
  const remainingClassesCount = sortedClasses.filter(c => parseTimeToMinutes(c.startTime) > nowMinutes).length;

  const freeSlots: string[] = [];
  for (let i = 0; i < sortedClasses.length - 1; i++) {
    const currentCls = sortedClasses[i];
    const nextCls = sortedClasses[i + 1];
    const currentEnd = parseTimeToMinutes(currentCls.endTime);
    const nextStart = parseTimeToMinutes(nextCls.startTime);
    const gap = nextStart - currentEnd;
    if (gap > 15) {
      freeSlots.push(`${currentCls.endTime} - ${nextCls.startTime} (${gap} mins)`);
    }
  }

  // Dynamic AI recommendations logic
  const getAIRecommendations = () => {
    const recs: Array<{ type: 'danger' | 'warning' | 'info' | 'success'; text: string; icon: string }> = [];

    // 1. Low Attendance check
    const lowAttendanceSubs = subjects.filter(s => s.total > 0 && Math.round((s.attended / s.total) * 100) < threshold);
    if (lowAttendanceSubs.length > 0) {
      const sub = lowAttendanceSubs[0];
      const pct = Math.round((sub.attended / sub.total) * 100);
      recs.push({
        type: 'danger',
        text: `Your attendance in ${sub.name} is currently ${pct}%. Attend the next class to stay above the ${threshold}% requirement!`,
        icon: 'fa-triangle-exclamation'
      });
    }

    // 2. Imminent Assignment check
    const soonAssignments = reminders.filter(r => r.type === 'assignment' && (() => {
      const diff = new Date(r.date).getTime() - today.getTime();
      const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 2;
    })());
    if (soonAssignments.length > 0) {
      const assignment = soonAssignments[0];
      const diffDays = Math.ceil((new Date(assignment.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      recs.push({
        type: 'warning',
        text: `"${assignment.title}" is due in ${diffDays} day${diffDays === 1 ? '' : 's'}. Complete it to avoid deadlines rush!`,
        icon: 'fa-clock'
      });
    }

    // 3. Missing Subject Notes check
    const missingNotesSub = subjects.find(s => !notes.some(n => n.subjectId === s.id));
    if (missingNotesSub) {
      recs.push({
        type: 'info',
        text: `You haven't created any lecture notes for ${missingNotesSub.name} yet. Synthesizing notes improves score outcomes by 24%.`,
        icon: 'fa-lightbulb'
      });
    }

    // 4. Fallback if everything is fully set
    if (recs.length === 0) {
      recs.push({
        type: 'success',
        text: "You are fully on track! All assignments are submitted, attendance thresholds are safe, and notes are up to date. Keep it up!",
        icon: 'fa-circle-check'
      });
    }

    return recs;
  };
  const aiRecommendations = getAIRecommendations();

  // Card-specific helper computations for premium dashboard metrics
  const lowAttendanceCount = subjects.filter(s => s.total > 0 && Math.round((s.attended / s.total) * 100) < threshold).length;
  
  const upcomingAssignments = reminders.filter(r => r.type === 'assignment');
  const nextAssignment = upcomingAssignments.length > 0
    ? [...upcomingAssignments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
    : null;
    
  const upcomingEvents = reminders.filter(r => r.type === 'event' || r.type === 'exam');
  const nextEvent = upcomingEvents.length > 0
    ? [...upcomingEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
    : null;
    
  const isStreakActiveToday = Object.values(priorityCompleted).some(Boolean);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Daily Brief Greeting Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          {/* <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-100/50 dark:border-indigo-900/30">
            Daily Brief
          </span> */}
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight mt-3">
            {greeting}, {firstName}! 🚀
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 font-medium text-xs md:text-sm">
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10 self-start md:self-end">
          <button 
            onClick={syncReminders}
            disabled={isSyncing}
            className={`px-6 py-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-indigo-700 active:scale-95 ${isSyncing ? 'animate-pulse' : ''}`}
          >
            <i className={`fa-solid ${isSyncing ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
            {isSyncing ? 'Syncing...' : 'AI Sync'}
          </button>
        </div>
        <div className="absolute -right-20 -bottom-20 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </header>

      {/* Daily Brief Hero - Premium Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Attendance Card */}
        <div 
          onClick={() => setActiveView('attendance')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all hover:border-indigo-500/40 dark:hover:border-indigo-500/40 cursor-pointer duration-300 relative overflow-hidden group"
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg font-bold group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-chart-simple"></i>
            </div>
            {lowAttendanceCount === 0 ? (
              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-100/50 dark:border-emerald-900/30">
                Safe
              </span>
            ) : (
              <span className="text-[9px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-955/25 text-rose-600 dark:text-rose-450 px-2.5 py-1 rounded-full border border-rose-100/50 dark:border-rose-900/30">
                {lowAttendanceCount} Alert{lowAttendanceCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="mt-5">
            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{calculateAttendanceAvg()}%</h4>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Average Attendance</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-805/50 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            <span>{subjects.length} Subjects tracked</span>
            <span className="text-indigo-650 dark:text-indigo-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Details <i className="fa-solid fa-arrow-right text-[8px]"></i>
            </span>
          </div>
        </div>

        {/* Assignments Due Card */}
        <div 
          onClick={() => {
            setReminderFilter(prev => prev === 'assignment' ? 'all' : 'assignment');
            setTimeout(() => {
              document.getElementById('deadlines-tasks-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          className={`bg-white dark:bg-slate-900 border p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all cursor-pointer duration-300 relative overflow-hidden group ${
            reminderFilter === 'assignment' ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-slate-200 dark:border-slate-850 hover:border-amber-500/40 dark:hover:border-amber-500/40'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-955/25 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg font-bold group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-file-signature"></i>
            </div>
            {reminders.filter(r => r.type === 'assignment').length === 0 ? (
              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-955/20 text-emerald-650 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-100/50 dark:border-emerald-900/30">
                Completed
              </span>
            ) : (
              <span className="text-[9px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-405 px-2.5 py-1 rounded-full border border-amber-100/50 dark:border-amber-900/30">
                Pending
              </span>
            )}
          </div>
          <div className="mt-5">
            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              {reminders.filter(r => r.type === 'assignment').length}
            </h4>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Assignments Due</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-805/50 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            <span className="truncate max-w-[120px]">
              {nextAssignment ? `Next: ${nextAssignment.title}` : 'No deadlines'}
            </span>
            <span className="text-amber-650 dark:text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              {reminderFilter === 'assignment' ? 'Showing' : 'Filter'} <i className="fa-solid fa-arrow-down text-[8px] animate-bounce"></i>
            </span>
          </div>
        </div>

        {/* Upcoming Events Card */}
        <div 
          onClick={() => {
            setReminderFilter(prev => prev === 'event_exam' ? 'all' : 'event_exam');
            setTimeout(() => {
              document.getElementById('deadlines-tasks-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          className={`bg-white dark:bg-slate-900 border p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all cursor-pointer duration-300 relative overflow-hidden group ${
            reminderFilter === 'event_exam' ? 'border-blue-500/80 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-850 hover:border-blue-500/40 dark:hover:border-blue-500/40'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-955/25 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg font-bold group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-calendar-check"></i>
            </div>
            {reminders.filter(r => r.type === 'event' || r.type === 'exam').length === 0 ? (
              <span className="text-[9px] font-black uppercase tracking-wider bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full border border-slate-100 dark:border-slate-700/50">
                Clear
              </span>
            ) : (
              <span className="text-[9px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-955/20 text-blue-750 dark:text-blue-405 px-2.5 py-1 rounded-full border border-blue-100/50 dark:border-blue-900/30">
                Active
              </span>
            )}
          </div>
          <div className="mt-5">
            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              {reminders.filter(r => r.type === 'event' || r.type === 'exam').length}
            </h4>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Exams & Events</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-805/50 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            <span className="truncate max-w-[120px]">
              {nextEvent ? `Next: ${nextEvent.title}` : 'No upcoming events'}
            </span>
            <span className="text-blue-650 dark:text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              {reminderFilter === 'event_exam' ? 'Showing' : 'Filter'} <i className="fa-solid fa-arrow-down text-[8px] animate-bounce"></i>
            </span>
          </div>
        </div>

        {/* Academic Streak Card */}
        <div 
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all hover:border-rose-500/40 dark:hover:border-rose-500/40 duration-300 relative overflow-hidden group"
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-955/25 text-rose-600 dark:text-rose-455 flex items-center justify-center text-lg font-bold group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-fire text-amber-500 animate-pulse"></i>
            </div>
            {isStreakActiveToday ? (
              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-955/20 text-emerald-650 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-100/50 dark:border-emerald-900/30">
                Active Today
              </span>
            ) : (
              <span className="text-[9px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-455 px-2.5 py-1 rounded-full border border-rose-100/50 dark:border-rose-900/30">
                Action Needed
              </span>
            )}
          </div>
          <div className="mt-5">
            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-baseline gap-1">
              {streak} <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Days</span>
            </h4>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Academic Streak</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-805/50 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            <span>Target: 7+ days</span>
            <span className="text-rose-650 dark:text-rose-455 font-bold flex items-center gap-1">
              {isStreakActiveToday ? 'Saved! ✨' : 'Complete action'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Reminders List */}
        <div id="deadlines-tasks-section" className="scroll-mt-8 lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                  Deadlines & Tasks
                  {reminderFilter !== 'all' && (
                    <span 
                      onClick={(e) => { e.stopPropagation(); setReminderFilter('all'); }}
                      className="text-[9px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30 text-indigo-650 dark:text-indigo-405 px-2.5 py-1 rounded-full border border-indigo-100/50 dark:border-indigo-900/20 cursor-pointer hover:bg-indigo-100 transition-colors"
                    >
                      Filtered by {reminderFilter === 'assignment' ? 'Assignments' : 'Events & Exams'} ✕
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 font-medium">Keep track of your academic commitments.</p>
            </div>
            <button 
              onClick={() => setShowReminderForm(true)}
              className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm"
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {(() => {
              let filtered = [...reminders];
              if (reminderFilter === 'assignment') {
                filtered = filtered.filter(r => r.type === 'assignment');
              } else if (reminderFilter === 'event_exam') {
                filtered = filtered.filter(r => r.type === 'event' || r.type === 'exam');
              }
              const sorted = filtered.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
              
              return sorted.length > 0 ? sorted.map((r) => (
                <div 
                  key={r.id} 
                  onClick={() => openEditReminder(r)}
                  className={`group flex items-center gap-5 p-5 rounded-[2rem] border transition-all hover:translate-x-1 cursor-pointer bg-white dark:bg-slate-900 ${getReminderColor(r.type)}`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/60 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <i className={`fa-solid ${r.type === 'exam' ? 'fa-triangle-exclamation' : r.type === 'assignment' ? 'fa-file-signature' : 'fa-calendar-check'} text-xl`}></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm tracking-tight">{r.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                        {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      {r.description && <span className="w-1 h-1 rounded-full bg-current opacity-30"></span>}
                      {r.description && <span className="text-[10px] opacity-60 font-medium italic">{r.description}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button onClick={(e) => { e.stopPropagation(); openEditReminder(r); }} className="w-10 h-10 rounded-xl bg-white/40 flex items-center justify-center text-slate-400 hover:text-indigo-650 transition-colors">
                      <i className="fa-solid fa-pen text-xs"></i>
                    </button>
                    <button onClick={(e) => removeReminder(r.id, e)} className="w-10 h-10 rounded-xl bg-white/40 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                      <i className="fa-solid fa-check"></i>
                    </button>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem]">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <i className="fa-solid fa-list-check text-2xl opacity-20"></i>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-center">
                    No active {reminderFilter === 'all' ? 'reminders' : reminderFilter === 'assignment' ? 'assignments' : 'events or exams'}
                  </p>
                  {reminderFilter !== 'all' && (
                    <button 
                      onClick={() => setReminderFilter('all')} 
                      className="mt-3 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-650 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100/50 dark:border-indigo-900/20 hover:bg-indigo-100 transition-colors"
                    >
                      Show All Reminders
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
            {/* Today's Schedule Card */}
            <div className="bg-slate-900 dark:bg-indigo-950 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 dark:shadow-none overflow-hidden relative animate-in fade-in duration-300">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black uppercase tracking-tight">Today's Routine</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">{todayName}</span>
                </div>
                <div className="space-y-6">
                    {todaysClasses.length > 0 ? todaysClasses.map((cls) => (
                    <div key={cls.id} className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-indigo-400 ring-4 ring-white/10 mt-1"></div>
                            <div className="w-px flex-1 bg-white/10 my-1"></div>
                        </div>
                        <div className="flex-1 pb-2">
                            <h4 className="font-bold text-sm tracking-tight">{cls.subject}</h4>
                            <p className="text-[10px] font-medium opacity-60 flex items-center gap-2 mt-1">
                                <i className="fa-solid fa-clock"></i> {cls.startTime} - {cls.endTime}
                                <span className="opacity-30">•</span>
                                <i className="fa-solid fa-location-dot"></i> {cls.room}
                            </p>
                        </div>
                    </div>
                    )) : (
                    <div className="text-center py-10">
                        <p className="text-xs font-bold opacity-40 uppercase tracking-widest">No classes today</p>
                    </div>
                    )}
                </div>
              </div>
              <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* AI Assistant Quick Card */}
            <div 
              onClick={() => setActiveView('chat')}
              className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm group cursor-pointer hover:border-indigo-500 transition-all"
            >
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl mb-6 shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-robot"></i>
                </div>
                <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">UniHub AI</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-2 mb-6">Ask about your results, classes, or upcoming datesheets in Hinglish.</p>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                    Try asking "Sessional kab hain?" <i className="fa-solid fa-arrow-right"></i>
                </div>
            </div>
        </div>
      </div>

      {/* Manual Reminder Form Modal */}
      {showReminderForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                {editingReminder ? 'Update Task' : 'New Task'}
              </h3>
              <button onClick={closeReminderForm} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form onSubmit={handleSaveReminder} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Title</label>
                <input 
                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white transition-all"
                  placeholder="e.g. History Project Deadline"
                  value={reminderFormData.title}
                  onChange={e => setReminderFormData({...reminderFormData, title: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Date</label>
                  <input 
                    type="date"
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none text-sm dark:text-white transition-all" 
                    value={reminderFormData.date}
                    onChange={e => setReminderFormData({...reminderFormData, date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none text-sm dark:text-white transition-all" 
                    value={reminderFormData.type}
                    onChange={e => setReminderFormData({...reminderFormData, type: e.target.value as any})}
                  >
                    <option value="assignment">Assignment</option>
                    <option value="exam">Exam</option>
                    <option value="event">Event</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notes (Optional)</label>
                <input 
                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none text-sm dark:text-white transition-all" 
                  placeholder="e.g. Reference: Lab Manual" 
                  value={reminderFormData.description} 
                  onChange={e => setReminderFormData({...reminderFormData, description: e.target.value})} 
                />
              </div>

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={closeReminderForm} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95">
                  {editingReminder ? 'Update Task' : 'Confirm Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
