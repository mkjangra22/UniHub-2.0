
import React from 'react';

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const FILE_CATEGORIES = [
  { value: 'text', label: 'Texts', icon: 'fa-file-lines', color: 'bg-green-100 text-green-700' },
  { value: 'syllabus', label: 'Syllabus', icon: 'fa-graduation-cap', color: 'bg-teal-100 text-teal-700' },
  { value: 'notice', label: 'Notices', icon: 'fa-bullhorn', color: 'bg-blue-100 text-blue-700' },
  { value: 'datesheet', label: 'Date Sheets', icon: 'fa-calendar-days', color: 'bg-purple-100 text-purple-700' },
  { value: 'assignment', label: 'Assignments', icon: 'fa-file-signature', color: 'bg-orange-100 text-orange-700' },
  { value: 'notes', label: 'Subject Notes', icon: 'fa-book', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'other', label: 'Others', icon: 'fa-folder-open', color: 'bg-slate-100 text-slate-700' },
];

export const CATEGORY_COLORS: Record<string, string> = {
  text: 'text-green-500',
  syllabus: 'text-teal-500',
  notice: 'text-blue-500',
  datesheet: 'text-purple-500',
  assignment: 'text-orange-500',
  notes: 'text-indigo-500',
  other: 'text-slate-500'
};
