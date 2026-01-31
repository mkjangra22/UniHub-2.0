
import React, { useState, useEffect } from 'react';
import { TimetableEntry, Subject } from '../types';
import { DAYS_OF_WEEK } from '../constants';

interface TimetableProps {
  timetable: TimetableEntry[];
  setTimetable: React.Dispatch<React.SetStateAction<TimetableEntry[]>>;
  subjects: Subject[];
}

const Timetable: React.FC<TimetableProps> = ({ timetable, setTimetable, subjects }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [newEntry, setNewEntry] = useState<Partial<TimetableEntry>>({
    day: 'Monday', 
    subject: subjects[0]?.name || '', 
    startTime: '09:00', 
    endTime: '10:00', 
    room: ''
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const hours = Array.from({ length: 14 }, (_, i) => `${8 + i}:00`);
  const todayName = DAYS_OF_WEEK[currentTime.getDay() - 1] || 'Sunday';

  const getSubjectAccent = (name: string) => {
    const colors = [
      'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-indigo-100/50',
      'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-emerald-100/50',
      'border-amber-500 bg-amber-50/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-amber-100/50',
      'border-rose-500 bg-rose-50/50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 shadow-rose-100/50',
      'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 shadow-cyan-100/50',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.subject) return alert("Please select a subject.");

    if (editingId) {
      setTimetable(prev => prev.map(t => t.id === editingId ? { ...t, ...newEntry as TimetableEntry } : t));
    } else {
      const entry: TimetableEntry = {
        id: Math.random().toString(36).substr(2, 9),
        day: newEntry.day as string,
        subject: newEntry.subject as string,
        startTime: newEntry.startTime as string,
        endTime: newEntry.endTime as string,
        room: newEntry.room || 'TBD'
      };
      setTimetable(prev => [...prev, entry]);
    }
    closeForm();
  };

  const openEdit = (cls: TimetableEntry) => {
    setNewEntry(cls);
    setEditingId(cls.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setNewEntry({ day: 'Monday', subject: subjects[0]?.name || '', startTime: '09:00', endTime: '10:00', room: '' });
  };

  const removeEntry = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!id) return;
    
    if (confirm("Remove this class from your schedule?")) {
      // Functional state update ensures we use current snapshot
      setTimetable(prev => {
        const filtered = prev.filter(t => t.id !== id);
        return filtered;
      });
      // Close the form if we're deleting the one being edited
      if (showForm && editingId === id) {
        closeForm();
      }
    }
  };

  const isNowInHour = (hourStr: string) => {
    const h = parseInt(hourStr.split(':')[0]);
    return currentTime.getHours() === h;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            Weekly Schedule
            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full uppercase tracking-tighter">Live Updates</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Campus locations and class timings at a glance.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <i className="fa-solid fa-plus-circle"></i> Add Class
        </button>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto relative custom-scrollbar">
          <table className="w-full border-separate border-spacing-0 table-fixed min-w-[900px]">
            <thead className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
              <tr>
                <th className="w-20 p-4 border-b border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"></th>
                {DAYS_OF_WEEK.map(day => (
                  <th key={day} className={`p-4 border-b border-r border-slate-100 dark:border-slate-800 last:border-r-0 transition-colors ${day === todayName ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${day === todayName ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>{day}</span>
                      {day === todayName && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1"></span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {hours.map((hour) => (
                <tr key={hour} className="group h-24">
                  <td className={`sticky left-0 z-20 p-2 border-b border-r border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-sm text-center transition-colors ${isNowInHour(hour) ? 'ring-2 ring-inset ring-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-900/20' : ''}`}>
                    <span className={`text-[11px] font-black tabular-nums transition-colors ${isNowInHour(hour) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600'}`}>{hour}</span>
                    {isNowInHour(hour) && <div className="text-[8px] font-bold text-indigo-400 dark:text-indigo-500 uppercase mt-1 animate-pulse tracking-tight">Active</div>}
                  </td>
                  
                  {DAYS_OF_WEEK.map(day => {
                    const entries = timetable.filter(t => {
                      const h = parseInt(t.startTime.split(':')[0]);
                      const rowH = parseInt(hour.split(':')[0]);
                      return t.day === day && h === rowH;
                    });

                    return (
                      <td 
                        key={`${day}-${hour}`} 
                        className={`p-1 border-b border-r border-slate-100 dark:border-slate-800 last:border-r-0 relative transition-colors ${day === todayName ? 'bg-indigo-50/10 dark:bg-indigo-900/5' : ''} hover:bg-slate-50/50 dark:hover:bg-slate-800/20 group/slot`}
                      >
                        {entries.length > 0 ? (
                          entries.map(cls => (
                            <div 
                              key={cls.id} 
                              onClick={() => openEdit(cls)}
                              className={`h-full w-full p-2.5 rounded-2xl border-l-4 shadow-sm flex flex-col justify-between transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group/card ${getSubjectAccent(cls.subject)}`}
                            >
                              <div>
                                <h4 className="text-[11px] font-black leading-tight truncate">{cls.subject}</h4>
                                <p className="text-[9px] mt-1 font-bold opacity-80 flex items-center gap-1">
                                  <i className="fa-solid fa-location-dot text-[8px]"></i> {cls.room}
                                </p>
                              </div>
                              <div className="flex items-center justify-between mt-1 text-[9px] font-black opacity-60">
                                <span>{cls.startTime}</span>
                                <button 
                                  onClick={(e) => removeEntry(cls.id, e)}
                                  className="w-5 h-5 rounded-lg flex items-center justify-center bg-black/5 dark:bg-white/10 opacity-0 group-hover/card:opacity-100 hover:bg-red-500 hover:text-white transition-all"
                                >
                                  <i className="fa-solid fa-xmark text-[8px]"></i>
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <button 
                            onClick={() => {
                              setNewEntry({ ...newEntry, day, startTime: hour.padStart(5, '0'), subject: subjects[0]?.name || '' });
                              setShowForm(true);
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 group-hover/slot:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                              <i className="fa-solid fa-plus text-xs"></i>
                            </div>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingId ? 'Edit Class Schedule' : 'Add New Class'}
              </h3>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600 transition-colors">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Subject</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white"
                  value={newEntry.subject}
                  onChange={e => setNewEntry({...newEntry, subject: e.target.value})}
                  required
                >
                  <option value="">Select a Course</option>
                  {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                {subjects.length === 0 && (
                  <p className="text-[10px] text-orange-500 mt-1 font-bold">No subjects found. Add them in Attendance first!</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Day</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl outline-none text-sm dark:text-white" 
                    value={newEntry.day} 
                    onChange={e => setNewEntry({...newEntry, day: e.target.value})}
                  >
                    {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Room / Lab</label>
                  <input 
                    className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl outline-none text-sm dark:text-white" 
                    placeholder="e.g. Lab 2" 
                    value={newEntry.room} 
                    onChange={e => setNewEntry({...newEntry, room: e.target.value})} 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Start Time</label>
                  <input type="time" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl outline-none text-sm dark:text-white" value={newEntry.startTime} onChange={e => setNewEntry({...newEntry, startTime: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">End Time</label>
                  <input type="time" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl outline-none text-sm dark:text-white" value={newEntry.endTime} onChange={e => setNewEntry({...newEntry, endTime: e.target.value})} />
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-8">
                <div className="flex gap-3">
                  <button type="button" onClick={closeForm} className="flex-1 py-3 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                  <button type="submit" className="flex-[2] py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all">
                    {editingId ? 'Update Schedule' : 'Confirm Class'}
                  </button>
                </div>
                
                {editingId && (
                  <button 
                    type="button" 
                    onClick={() => removeEntry(editingId)}
                    className="w-full py-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30 transition-all flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    Delete This Class
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
