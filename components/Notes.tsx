
import React, { useState, useMemo } from 'react';
import { Note, Subject } from '../types';
import { recordAcademicAction } from '../services/streakService';

interface NotesProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  subjects: Subject[];
}

const Notes: React.FC<NotesProps> = ({ notes, setNotes, subjects }) => {
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');

  // New Note Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteSubjectId, setNewNoteSubjectId] = useState('1');

  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return notes.filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
      const matchesSubject = filterSubjectId === 'all' || n.subjectId === filterSubjectId;
      return matchesSearch && matchesSubject;
    });
  }, [notes, searchQuery, filterSubjectId]);

  const openCreateModal = () => {
    setNewNoteTitle('');
    setNewNoteSubjectId(subjects[0]?.id || '1');
    setShowCreateModal(true);
  };

  const handleConfirmCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return alert("Please enter a note title.");

    const newNote: Note = {
      id: Date.now().toString(),
      subjectId: newNoteSubjectId,
      title: newNoteTitle.trim(),
      content: '',
      lastModified: new Date().toISOString()
    };

    setNotes([newNote, ...notes]);
    setActiveNote(newNote);
    setIsEditing(true);
    setShowCreateModal(false);

    const uid = localStorage.getItem('unihub_active_user_id') || 'current';
    recordAcademicAction(uid, 'note_create');
  };

  const saveNote = () => {
    if (!activeNote) return;
    const updatedNote = { ...activeNote, lastModified: new Date().toISOString() };
    setNotes(prev => prev.map(n => n.id === activeNote.id ? updatedNote : n));
    setActiveNote(updatedNote);
    setIsEditing(false);
  };

  const deleteNote = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Delete this note forever?")) {
      setNotes(prev => prev.filter(n => n.id !== id));
      if (activeNote?.id === id) setActiveNote(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Academic Notes</h2>
          <p className="text-slate-500 dark:text-slate-400">Organized study materials for every subject.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-lg dark:shadow-none flex items-center gap-2 transition-all active:scale-95"
        >
          <i className="fa-solid fa-plus"></i> New Note
        </button>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex divide-x divide-slate-100 dark:divide-slate-800">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 text-xs"></i>
              <input 
                type="text" 
                placeholder="Search notes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
              />
            </div>
            
            <div className="flex items-center gap-1.5">
              <i className="fa-solid fa-filter text-[10px] text-slate-400 dark:text-slate-500"></i>
              <select
                className="bg-transparent border-none text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 outline-none cursor-pointer p-0 pr-4 focus:ring-0"
                value={filterSubjectId}
                onChange={(e) => setFilterSubjectId(e.target.value)}
              >
                <option value="all">All Subjects</option>
                <option value="1">General</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredNotes.length > 0 ? filteredNotes.map(note => (
              <button 
                key={note.id}
                onClick={() => { setActiveNote(note); setIsEditing(false); }}
                className={`w-full text-left p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group relative ${activeNote?.id === note.id ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate pr-6">{note.title}</h4>
                  <button 
                    onClick={(e) => deleteNote(note.id, e)}
                    className="absolute right-3 top-4 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete note"
                  >
                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2 truncate line-clamp-1">{note.content}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded uppercase">
                    {subjects.find(s => s.id === note.subjectId)?.name || 'General'}
                  </span>
                  <span className="text-[9px] text-slate-350 dark:text-slate-650">
                    {new Date(note.lastModified).toLocaleDateString()}
                  </span>
                </div>
              </button>
            )) : (
              <div className="p-12 text-center flex flex-col items-center gap-2 opacity-30 dark:opacity-20">
                <i className="fa-solid fa-note-sticky text-3xl text-slate-900 dark:text-white"></i>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white">
                  {searchQuery || filterSubjectId !== 'all' ? 'No matches' : 'No notes yet'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-slate-50/20 dark:bg-slate-950/20">
          {activeNote ? (
            <div className="flex-1 flex flex-col p-6 md:p-10 overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1 mr-4 space-y-3">
                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Note Name</label>
                    <input 
                      className="text-2xl font-bold text-slate-800 dark:text-white bg-transparent border-none outline-none w-full focus:ring-0 p-0"
                      value={activeNote.title}
                      onChange={(e) => {
                        setActiveNote({...activeNote, title: e.target.value});
                        setIsEditing(true);
                      }}
                      placeholder="Enter note title..."
                    />
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest">Subject:</span>
                        <select
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-xl text-xs text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          value={activeNote.subjectId}
                          onChange={(e) => {
                            setActiveNote({...activeNote, subjectId: e.target.value});
                            setIsEditing(true);
                          }}
                        >
                          <option value="1">General</option>
                          {subjects.map(sub => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-105 dark:border-indigo-800/40 shadow-sm">
                        {subjects.find(s => s.id === activeNote.subjectId)?.name || 'General'}
                      </span>
                    )}

                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      • Last modified {new Date(activeNote.lastModified).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {isEditing ? (
                    <button 
                      onClick={saveNote}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md dark:shadow-none hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <i className="fa-solid fa-floppy-disk"></i> Save
                    </button>
                  ) : (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 px-4 py-2 rounded-lg text-sm font-bold shadow-sm dark:shadow-none hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Edit Content
                    </button>
                  )}
                  <button 
                    onClick={(e) => deleteNote(activeNote.id, e)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-red-500 w-10 h-10 rounded-lg flex items-center justify-center shadow-sm dark:shadow-none hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col">
                <textarea 
                  className="w-full h-full text-slate-700 dark:text-slate-200 bg-transparent text-base leading-relaxed resize-none outline-none custom-scrollbar"
                  value={activeNote.content}
                  onChange={(e) => {
                    setActiveNote({...activeNote, content: e.target.value});
                    setIsEditing(true);
                  }}
                  placeholder="Start writing your study notes here..."
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-4">
              <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center text-2xl">
                <i className="fa-solid fa-file-pen opacity-20"></i>
              </div>
              <p className="font-medium">Select a note to read or rename it.</p>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Create Study Note</h3>
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            
            <form onSubmit={handleConfirmCreate} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Note Title</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white"
                  placeholder="e.g. Lecture 1: OS Introduction" 
                  value={newNoteTitle} 
                  onChange={e => setNewNoteTitle(e.target.value)} 
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Subject</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white font-bold"
                  value={newNoteSubjectId} 
                  onChange={e => setNewNoteSubjectId(e.target.value)}
                >
                  <option value="1">General</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className="flex-1 py-3 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Start Writing Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
