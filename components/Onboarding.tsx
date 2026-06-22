
import React, { useState } from 'react';
import { UserProfile, Subject, TimetableEntry } from '../types';
import { DAYS_OF_WEEK } from '../constants';

interface OnboardingProps {
  onComplete: (profile: UserProfile, subjects: Subject[], timetable: TimetableEntry[]) => void;
  initialProfile: UserProfile | null;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, initialProfile }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>(initialProfile || {
    name: '', 
    college: '', 
    year: '1st Year', 
    semester: '1st Semester', 
    classSection: '', 
    isSetupComplete: true,
    attendanceThreshold: 75
  });
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: '1', name: '', attended: 0, total: 0 }
  ]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);

  const addSubject = () => {
    setSubjects([...subjects, { id: Date.now().toString(), name: '', attended: 0, total: 0 }]);
  };

  const updateSubject = (id: string, field: keyof Subject, value: any) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const addTimetableEntry = () => {
    setTimetable([...timetable, { 
      id: Date.now().toString(), day: 'Monday', subject: subjects[0]?.name || '', 
      startTime: '09:00', endTime: '10:00', room: '' 
    }]);
  };

  const removeTimetableEntry = (id: string) => {
    setTimetable(timetable.filter(t => t.id !== id));
  };

  const handleSubmit = () => {
    const validSubjects = subjects.filter(s => s.name.trim() !== '');
    onComplete({ ...profile, isSetupComplete: true }, validSubjects, timetable);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center transition-colors duration-300">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Progress Bar Header */}
        <div className="p-8 md:p-10 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <i className="fa-solid fa-sparkles text-sm"></i>
              </div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Personalizing UniHub</h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Setting up your academic workspace</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'w-8 bg-indigo-600' : 'w-4 bg-slate-200 dark:bg-slate-800'}`}></div>
              ))}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Step {step}/3</span>
          </div>
        </div>

        <div className="p-8 md:p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Academic Threshold</label>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
                      <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{profile.attendanceThreshold}%</span>
                      <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-widest">Attendance Target</p>
                      <input 
                        type="range" min="50" max="95" step="5"
                        value={profile.attendanceThreshold}
                        onChange={e => setProfile({...profile, attendanceThreshold: parseInt(e.target.value)})}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-4"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Class / Section</label>
                    <input 
                      value={profile.classSection} 
                      onChange={e => setProfile({...profile, classSection: e.target.value})} 
                      placeholder="e.g. Section B" 
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white transition-all" 
                    />
                  </div>
                  <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
                    <h4 className="text-indigo-900 dark:text-indigo-200 font-bold text-sm mb-2 flex items-center gap-2">
                      <i className="fa-solid fa-circle-info"></i> Contextual AI
                    </h4>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                      This information helps the AI understand your schedule and send relevant reminders about your classes and deadlines.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-800 dark:text-white text-lg tracking-tight uppercase">Subjects</h3>
                <button onClick={addSubject} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors">
                  <i className="fa-solid fa-plus mr-2"></i> Add Subject
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {subjects.map((s) => (
                  <div key={s.id} className="group p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex gap-4 items-center">
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Subject Name</label>
                      <input 
                        value={s.name} 
                        onChange={e => updateSubject(s.id, 'name', e.target.value)} 
                        placeholder={`e.g. Data Structures`} 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white transition-all" 
                      />
                    </div>
                    <button 
                      onClick={() => removeSubject(s.id)} 
                      disabled={subjects.length === 1}
                      className="p-3 text-slate-300 hover:text-red-500 transition-colors mt-6"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center text-2xl mb-4">
                  <i className="fa-solid fa-calendar-days"></i>
                </div>
                <h3 className="font-black text-slate-800 dark:text-white text-xl tracking-tight uppercase">Build Your Timetable</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-2 font-medium">
                  Mapping your classes helps UniHub understand your routine. You can also skip this and set it up later in the Timetable tab.
                </p>
              </div>
              
              <div className="space-y-4">
                {timetable.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {timetable.map((entry) => (
                      <div key={entry.id} className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-3xl grid grid-cols-2 md:grid-cols-5 gap-4 items-end shadow-sm">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Day</label>
                          <select value={entry.day} onChange={e => setTimetable(timetable.map(t => t.id === entry.id ? {...t, day: e.target.value} : t))} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-xs outline-none">
                            {DAYS_OF_WEEK.map(d => <option key={d}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Subject</label>
                          <select value={entry.subject} onChange={e => setTimetable(timetable.map(t => t.id === entry.id ? {...t, subject: e.target.value} : t))} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-xs outline-none">
                            <option value="">Select</option>
                            {subjects.filter(s => s.name).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Start</label>
                          <input type="time" value={entry.startTime} onChange={e => setTimetable(timetable.map(t => t.id === entry.id ? {...t, startTime: e.target.value} : t))} className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-xs" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">End</label>
                          <input type="time" value={entry.endTime} onChange={e => setTimetable(timetable.map(t => t.id === entry.id ? {...t, endTime: e.target.value} : t))} className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-xs" />
                        </div>
                        <button onClick={() => removeTimetableEntry(entry.id)} className="p-2.5 text-slate-300 hover:text-red-500 transition-colors flex items-center justify-center">
                          <i className="fa-solid fa-trash-can text-sm"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                    <p className="text-xs font-bold uppercase tracking-widest mb-4">No schedule created yet</p>
                    <button onClick={addTimetableEntry} className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline">Add Your First Class Slot</button>
                  </div>
                )}
                {timetable.length > 0 && (
                  <button onClick={addTimetableEntry} className="w-full py-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] text-xs font-black text-slate-400 uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-500 transition-all">
                    <i className="fa-solid fa-plus-circle mr-2"></i> Add Another Slot
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-8 md:p-10 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
          <button 
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="px-8 py-3 rounded-2xl font-black text-slate-400 uppercase tracking-widest text-xs hover:text-slate-600 disabled:opacity-0 transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-arrow-left"></i> Back
          </button>
          
          <div className="flex gap-4">
            <button 
              onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()}
              className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${step === 3 ? 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Skip {step === 3 ? '& Launch' : 'Step'}
            </button>
            <button 
              onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()}
              className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
            >
              {step < 3 ? 'Continue' : 'Launch UniHub'}
              <i className="fa-solid fa-rocket"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
