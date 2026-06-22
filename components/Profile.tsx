import React, { useState, useEffect } from 'react';
import { UserProfile, Subject } from '../types';

interface ProfileProps {
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onLogout: () => void;
}

const YEAR_SEMESTER_MAP: Record<string, string[]> = {
  '1st Year': ['1st Semester', '2nd Semester'],
  '2nd Year': ['3rd Semester', '4th Semester'],
  '3rd Year': ['5th Semester', '6th Semester'],
  '4th Year': ['7th Semester', '8th Semester'],
};

const Profile: React.FC<ProfileProps> = ({ 
  profile, 
  setProfile, 
  subjects, 
  setSubjects,
  isDarkMode,
  setIsDarkMode,
  onLogout
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubName, setNewSubName] = useState('');

  const [formData, setFormData] = useState<UserProfile>(profile || {
    name: '',
    college: '',
    year: '1st Year',
    semester: '1st Semester',
    classSection: '',
    isSetupComplete: true,
    attendanceThreshold: 75
  });

  // Keep form data in sync with profile updates
  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(formData);
    setIsEditing(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData(prev => ({ ...prev, avatarUrl: result }));
      setProfile(prev => prev ? { ...prev, avatarUrl: result } : null);
    };
    reader.readAsDataURL(file);
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    const newSub: Subject = {
      id: Math.random().toString(36).substr(2, 9),
      name: newSubName.trim(),
      attended: 0,
      total: 0
    };
    setSubjects(prev => [...prev, newSub]);
    setNewSubName('');
    setShowAddSubject(false);
  };

  const removeSubject = (id: string) => {
    if (confirm("Remove this subject and all its attendance data?")) {
      setSubjects(prev => prev.filter(s => s.id !== id));
    }
  };

  const availableSemesters = YEAR_SEMESTER_MAP[formData.year] || [];

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Student Hub Settings</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage your identity and academic structure.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Identity Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
            {/* Avatar Circle with Hover Edit overlay */}
            <div className="relative group w-24 h-24 mb-1">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500 shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-indigo-100 dark:shadow-none">
                  {profile?.name?.charAt(0) || 'U'}
                </div>
              )}
              <label className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-indigo-500">
                <i className="fa-solid fa-camera text-base mb-1"></i>
                <span>Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            </div>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-4">Click photo to upload</p>
            
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{profile?.name}</h3>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{profile?.college}</p>
            
            <div className="w-full mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Academic Year</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{profile?.year}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Semester</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{profile?.semester}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Class / Section</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{profile?.classSection || '--'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Target Threshold</span>
                <span className="font-bold text-indigo-600">{profile?.attendanceThreshold}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Saturday Classes</span>
                <span className={`font-bold ${profile?.isSaturdayWorking ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {profile?.isSaturdayWorking ? 'Enabled (Working)' : 'Disabled (Holiday)'}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setIsEditing(true)}
              className="mt-6 w-full py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              Edit Profile Details
            </button>
          </div>

          {/* System Preferences Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h4 className="text-base font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              <i className="fa-solid fa-sliders mr-2 text-indigo-500"></i>System Preferences
            </h4>
            
            {/* Dark Mode Control */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500">
                  <i className={`fa-solid ${isDarkMode ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-500'}`}></i>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Theme Mode</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {isDarkMode ? 'Light Mode available' : 'Dark Mode available'}
                  </p>
                </div>
              </div>
              
              {/* Switch Toggle */}
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                  isDarkMode ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                }`}
                aria-label="Toggle Theme Mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Logout Control */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                <span>Logout Session</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Form */}
          {isEditing && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-indigo-200 dark:border-indigo-900 shadow-lg animate-in zoom-in-95">
              <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Update Profile</h4>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                    <input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">College/University</label>
                    <input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white" value={formData.college} onChange={e => setFormData({...formData, college: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Academic Year</label>
                    <select 
                      className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none outline-none text-sm dark:text-white" 
                      value={formData.year} 
                      onChange={e => {
                        const newYear = e.target.value;
                        const sems = YEAR_SEMESTER_MAP[newYear] || [];
                        setFormData({...formData, year: newYear, semester: sems[0] || ''});
                      }}
                    >
                      {Object.keys(YEAR_SEMESTER_MAP).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Semester</label>
                    <select 
                      className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none outline-none text-sm dark:text-white" 
                      value={formData.semester} 
                      onChange={e => setFormData({...formData, semester: e.target.value})}
                    >
                      {availableSemesters.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Class / Section</label>
                    <input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white" value={formData.classSection} placeholder="e.g. Section B" onChange={e => setFormData({...formData, classSection: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Attendance Threshold (%)</label>
                    <input type="number" min="50" max="99" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white" value={formData.attendanceThreshold} onChange={e => setFormData({...formData, attendanceThreshold: Math.min(99, Math.max(50, parseInt(e.target.value) || 75))})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Saturday Classes</label>
                    <select 
                      className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none outline-none text-sm dark:text-white" 
                      value={formData.isSaturdayWorking ? 'true' : 'false'}
                      onChange={e => setFormData({...formData, isSaturdayWorking: e.target.value === 'true'})}
                    >
                      <option value="false">Disabled (Monday - Friday)</option>
                      <option value="true">Enabled (Monday - Saturday)</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 text-xs font-bold text-slate-400">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100">Save Profile</button>
                </div>
              </form>
            </div>
          )}

          {/* Subject Management Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white">Subject Management</h4>
                <p className="text-xs text-slate-400">Define the courses you're taking this semester.</p>
              </div>
              <button 
                onClick={() => setShowAddSubject(true)}
                className="p-2 w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
              >
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map(sub => (
                <div key={sub.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-indigo-500 shadow-sm">
                      <i className="fa-solid fa-book text-xs"></i>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{sub.name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeSubject(sub.id)}
                    className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <i className="fa-solid fa-trash-can text-xs"></i>
                  </button>
                </div>
              ))}
              
              {subjects.length === 0 && (
                <div className="md:col-span-2 py-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 italic text-sm">
                  No subjects added. Add your curriculum to track attendance.
                </div>
              )}
            </div>

            {showAddSubject && (
              <div className="mt-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 animate-in slide-in-from-top-4">
                <form onSubmit={handleAddSubject} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subject Name</label>
                      <input 
                        autoFocus
                        className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                        value={newSubName} 
                        onChange={e => setNewSubName(e.target.value)} 
                        placeholder="e.g. Operating Systems"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowAddSubject(false)} className="px-4 py-2 text-xs font-bold text-slate-400">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Add Subject</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
