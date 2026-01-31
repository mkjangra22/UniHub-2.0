
export interface UserProfile {
  name: string;
  college: string;
  year: string;
  semester: string;
  classSection: string;
  isSetupComplete: boolean;
  attendanceThreshold: number;
}

export interface AcademicFile {
  id: string;
  name: string;
  type: string;
  category: 'chat' | 'notice' | 'datesheet' | 'assignment' | 'notes' | 'other';
  content?: string;
  dataUrl?: string;
  uploadDate: string;
  size: number;
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  type: 'exam' | 'assignment' | 'event';
  description?: string;
}

export interface TimetableEntry {
  id: string;
  day: string;
  subject: string;
  startTime: string;
  endTime: string;
  room: string;
}

export interface Subject {
  id: string;
  name: string;
  attended: number;
  total: number;
}

export interface Note {
  id: string;
  subjectId: string;
  title: string;
  content: string;
  lastModified: string;
}

export interface SubjectResult {
  id: string;
  subjectName: string;
  sessional1: number | null;
  sessional2: number | null;
  sessional3: number | null;
  finalExam: number | null;
  maxMarks: number;
}

export interface SemesterResult {
  id: string;
  semesterName: string;
  year: string;
  results: SubjectResult[];
}

export type AppView = 'auth' | 'onboarding' | 'dashboard' | 'storage' | 'chat' | 'timetable' | 'notes' | 'attendance' | 'results' | 'profile' | 'community';
