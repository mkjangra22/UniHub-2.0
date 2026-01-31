
import React, { useState } from 'react';
import { AcademicFile } from '../types';
import { FILE_CATEGORIES } from '../constants';

interface PasteTextModalProps {
  onSave: (file: AcademicFile) => void;
  onClose: () => void;
}

const PasteTextModal: React.FC<PasteTextModalProps> = ({ onSave, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<AcademicFile['category']>('chat');

  const handleSave = () => {
    if (!content.trim()) {
      alert('Please provide some content.');
      return;
    }

    const timestamp = new Date().toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const finalTitle = title.trim() || `Snippet - ${timestamp}`;

    const newFile: AcademicFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: finalTitle.endsWith('.txt') ? finalTitle : `${finalTitle}.txt`,
      type: 'text/plain',
      category: category,
      size: new Blob([content]).size,
      uploadDate: new Date().toISOString(),
      content: content,
      // Removed redundant base64 dataUrl to save localStorage space
    };

    onSave(newFile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Paste Text / Chat</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Title / Reference (Optional)</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Auto-generated if left empty"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Category</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {FILE_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value as any)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all ${
                    category === cat.value 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400' 
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-slate-200'
                  }`}
                >
                  <i className={`fa-solid ${cat.icon}`}></i>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Content</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your messages or notes here..."
              className="w-full h-48 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none font-mono"
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-100 dark:shadow-none flex items-center gap-2 transition-all active:scale-95"
          >
            <i className="fa-solid fa-floppy-disk"></i>
            Save Snippet
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasteTextModal;
