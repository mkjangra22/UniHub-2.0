
import React, { useState } from 'react';
import { AcademicFile, Reminder, Subject, TimetableEntry, UserProfile, SemesterResult } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { analyzeDataForReminders } from '../services/geminiService';

interface DashboardProps {
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  subjects: Subject[];
  timetable: TimetableEntry[];
  profile: UserProfile | null;
  files: AcademicFile[];
  examResults?: SemesterResult[];
}

const Dashboard: React.FC<DashboardProps> = ({ reminders, setReminders, subjects, timetable, profile, files, examResults = [] }) => {
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

  const getGradePoint = (percentage: number) => {
    if (percentage >= 90) return 10;
    if (percentage >= 80) return 9;
    if (percentage >= 70) return 8;
    if (percentage >= 60) return 7;
    if (percentage >= 50) return 6;
    if (percentage >= 40) return 5;
    return 0;
  };

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

  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Student';

  const removeReminder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Mark this reminder as complete/remove it?")) {
      setReminders(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">How's it going, {firstName}? 👋</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Your academic command center is ready.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={syncReminders}
            disabled={isSyncing}
            className={`px-6 py-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 ${isSyncing ? 'animate-pulse' : ''}`}
          >
            <i className={`fa-solid ${isSyncing ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
            {isSyncing ? 'Syncing...' : 'AI Sync'}
          </button>
          <div className="px-5 py-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <i className="fa-solid fa-calendar text-indigo-500"></i>
            <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
              {today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </header>

      {/* Top Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
            <p className="text-3xl font-black text-slate-800 dark:text-white">{calculateAttendanceAvg()}%</p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Attendance</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
            <p className="text-3xl font-black text-slate-800 dark:text-white">{reminders.length}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Reminders</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
            <p className="text-3xl font-black text-slate-800 dark:text-white">{files.length}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Files Stored</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Reminders List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Deadlines & Tasks</h3>
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
            {reminders.length > 0 ? [...reminders].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((r) => (
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
                  <button onClick={(e) => { e.stopPropagation(); openEditReminder(r); }} className="w-10 h-10 rounded-xl bg-white/40 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
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
                <p className="text-xs font-bold uppercase tracking-widest">No active reminders</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
            {/* Today's Schedule Card */}
            <div className="bg-slate-900 dark:bg-indigo-950 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 dark:shadow-none overflow-hidden relative">
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
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm group cursor-pointer hover:border-indigo-500 transition-all">
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
