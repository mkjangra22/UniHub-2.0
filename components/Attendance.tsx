
import React, { useState } from 'react';
import { Subject, UserProfile } from '../types';

interface AttendanceProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const Attendance: React.FC<AttendanceProps> = ({ subjects, setSubjects, profile, setProfile }) => {
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [tempThreshold, setTempThreshold] = useState(profile?.attendanceThreshold || 75);

  const threshold = profile?.attendanceThreshold || 75;

  const updateAttendance = (id: string, type: 'increment' | 'decrement' | 'total_inc' | 'total_dec') => {
    setSubjects(prev => prev.map(s => {
      if (s.id !== id) return s;
      
      switch(type) {
        case 'increment': return { ...s, attended: s.attended + 1, total: s.total + 1 };
        case 'decrement': return { ...s, attended: Math.max(0, s.attended - 1), total: Math.max(0, s.total - 1) };
        case 'total_inc': return { ...s, total: s.total + 1 };
        case 'total_dec': return { ...s, total: Math.max(s.attended, s.total - 1) };
        default: return s;
      }
    }));
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    if (editingSubject) {
      setSubjects(prev => prev.map(s => s.id === editingSubject.id ? { ...s, name: newSubjectName.trim() } : s));
    } else {
      const newSub: Subject = {
        id: Math.random().toString(36).substr(2, 9),
        name: newSubjectName.trim(),
        attended: 0,
        total: 0
      };
      setSubjects(prev => [...prev, newSub]);
    }

    setNewSubjectName('');
    setShowAddSubject(false);
    setEditingSubject(null);
  };

  const handleDeleteSubject = (id: string) => {
    if (confirm("Delete this subject and its data? This cannot be undone.")) {
      setSubjects(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleUpdateThreshold = () => {
    if (profile) {
      setProfile({ ...profile, attendanceThreshold: tempThreshold });
    }
    setShowThresholdModal(false);
  };

  const getPercentage = (attended: number, total: number) => {
    return total === 0 ? 0 : Math.round((attended / total) * 100);
  };

  const getStatusColor = (percent: number) => {
    if (percent >= threshold + 10) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 ring-green-100 dark:ring-green-900/30';
    if (percent >= threshold) return 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 ring-indigo-100 dark:ring-indigo-900/30';
    if (percent >= threshold - 15) return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 ring-orange-100 dark:ring-orange-900/30';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 ring-red-100 dark:ring-red-900/30';
  };

  const openEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setNewSubjectName(sub.name);
    setShowAddSubject(true);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Attendance</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Keep your presence high and your alerts low.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setTempThreshold(threshold);
              setShowThresholdModal(true);
            }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-all"
          >
            <i className="fa-solid fa-gear"></i> {threshold}% Target
          </button>
          <button 
            onClick={() => {
              setEditingSubject(null);
              setNewSubjectName('');
              setShowAddSubject(true);
            }}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95"
          >
            <i className="fa-solid fa-plus"></i> New Subject
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {subjects.map((sub) => {
          const percent = getPercentage(sub.attended, sub.total);
          const needsClasses = Math.max(0, Math.ceil((threshold * sub.total - 100 * sub.attended) / (100 - threshold)));

          return (
            <div key={sub.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 flex gap-2">
                <button onClick={() => openEdit(sub)} className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><i className="fa-solid fa-pen text-[10px]"></i></button>
                <button onClick={() => handleDeleteSubject(sub.id)} className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
              </div>

              <div className="mb-6">
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 inline-flex mb-4 ${getStatusColor(percent)}`}>
                    {percent}% Present
                  </div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white truncate pr-16">{sub.name}</h3>
              </div>

              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-8 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 ease-out rounded-full ${percent >= threshold ? 'bg-indigo-600' : 'bg-red-500'}`}
                  style={{ width: `${percent}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{sub.attended}</p>
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-1">Attended</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{sub.total}</p>
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-1">Total</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => updateAttendance(sub.id, 'increment')}
                  className="py-4 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest"
                >
                  <i className="fa-solid fa-plus text-[10px]"></i> Present
                </button>
                <button 
                  onClick={() => updateAttendance(sub.id, 'total_inc')}
                  className="py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest"
                >
                  <i className="fa-solid fa-xmark text-[10px]"></i> Absent
                </button>
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 flex flex-col gap-2">
                {percent < threshold ? (
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                        <i className="fa-solid fa-circle-exclamation mr-1"></i> Needs next {needsClasses} classes to recover
                    </p>
                ) : (
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                        <i className="fa-solid fa-circle-check mr-1"></i> You're safe for now
                    </p>
                )}
                <div className="flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => updateAttendance(sub.id, 'decrement')} className="text-[9px] font-black uppercase tracking-widest hover:text-indigo-600 transition-colors">Undo Present</button>
                    <button onClick={() => updateAttendance(sub.id, 'total_dec')} className="text-[9px] font-black uppercase tracking-widest hover:text-indigo-600 transition-colors">Undo Absent</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Subject Modal */}
      {showAddSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{editingSubject ? 'Rename Subject' : 'New Subject'}</h3>
              <button onClick={() => setShowAddSubject(false)} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleSaveSubject} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject Name</label>
                <input 
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="e.g. Data Structures"
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddSubject(false)}
                  className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95"
                >
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Threshold Modal */}
      {showThresholdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl w-full max-w-sm border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8 text-center uppercase tracking-tight">Minimum Target</h3>
            <div className="space-y-10">
              <div className="flex flex-col items-center gap-6">
                <span className="text-6xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">{tempThreshold}%</span>
                <input 
                  type="range" 
                  min="50" max="95" step="5"
                  value={tempThreshold}
                  onChange={e => setTempThreshold(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center px-4 font-bold uppercase tracking-widest leading-relaxed">
                Threshold affects safety alerts and overall status across the dashboard.
              </p>
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowThresholdModal(false)}
                  className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateThreshold}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
