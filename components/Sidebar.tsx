
import React from 'react';
import { AppView, UserProfile } from '../types';

interface SidebarProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  profile: UserProfile | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, profile }) => {
  const menuItems: { id: AppView, label: string, icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-house' },
    { id: 'chat', label: 'AI Assistant', icon: 'fa-robot' },
    { id: 'attendance', label: 'Attendance', icon: 'fa-user-check' },
    { id: 'timetable', label: 'Timetable', icon: 'fa-table-cells' },
    { id: 'storage', label: 'File Storage', icon: 'fa-cloud-arrow-up' },
    { id: 'notes', label: 'Academic Notes', icon: 'fa-note-sticky' },
    { id: 'results', label: 'Exam Results', icon: 'fa-medal' },
    { id: 'community', label: 'Community', icon: 'fa-users' },
  ];

  return (
    <aside className="w-16 md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300">
      <div className="p-4 md:p-6 flex items-center justify-center md:justify-start">
        {/* Collapsed Sidebar: Show only the cropped head graphic */}
        <div className="block md:hidden w-10 h-10 overflow-hidden flex items-center justify-start">
          <img 
            src="unihub-logo-4-1.png" 
            className="h-8 max-w-none object-left" 
            style={{ width: 'auto', minWidth: '40px' }} 
            alt="Logo Icon"
          />
        </div>
        
        {/* Expanded Sidebar: Show the full horizontal logo */}
        <div className="hidden md:block">
          <img 
            src="unihub-logo-4-1.png" 
            className="h-20 w-auto object-contain" 
            alt="UniHub Logo" 
          />
        </div>
      </div>

      <nav className="flex-1 mt-4 px-2 space-y-1 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center justify-center md:justify-start gap-4 p-3 rounded-lg transition-all ${
              activeView === item.id
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <i className={`fa-solid ${item.icon} w-5 text-center`}></i>
            <span className="hidden md:block text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
        <button 
          onClick={() => setActiveView('profile')}
          className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${
            activeView === 'profile' 
              ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-200 dark:ring-indigo-800' 
              : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              profile?.name?.charAt(0) || 'U'
            )}
          </div>
          <div className="overflow-hidden hidden md:block text-left">
            <p className={`text-xs font-semibold truncate ${activeView === 'profile' ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>{profile?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">Settings</p>
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
