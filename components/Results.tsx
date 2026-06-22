
import React, { useState } from 'react';
import { SemesterResult, SubjectResult, Subject } from '../types';

interface ResultsProps {
  results: SemesterResult[];
  setResults: React.Dispatch<React.SetStateAction<SemesterResult[]>>;
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
}

const YEAR_SEMESTER_MAP: Record<string, string[]> = {
  '1st Year': ['1st Semester', '2nd Semester'],
  '2nd Year': ['3rd Semester', '4th Semester'],
  '3rd Year': ['5th Semester', '6th Semester'],
  '4th Year': ['7th Semester', '8th Semester'],
};

const Results: React.FC<ResultsProps> = ({ results, setResults, subjects, setSubjects }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSemesterId, setEditingSemesterId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    semesterName: string;
    year: string;
    results: SubjectResult[];
  }>({
    semesterName: '1st Semester',
    year: '1st Year',
    results: []
  });

  const availableSemesters = YEAR_SEMESTER_MAP[formData.year] || [];

  const getGradePoint = (percentage: number) => {
    if (percentage >= 90) return 10;
    if (percentage >= 80) return 9;
    if (percentage >= 70) return 8;
    if (percentage >= 60) return 7;
    if (percentage >= 50) return 6;
    if (percentage >= 40) return 5;
    return 0;
  };

  const calculateSGPA = (sem: SemesterResult) => {
    if (sem.results.length === 0) return "0.00";
    let totalPoints = 0;
    sem.results.forEach(res => {
      const totalPossible = res.maxMarks * 4;
      const earned = (res.sessional1 || 0) + (res.sessional2 || 0) + (res.sessional3 || 0) + (res.finalExam || 0);
      const percentage = (earned / totalPossible) * 100;
      totalPoints += getGradePoint(percentage);
    });
    return (totalPoints / sem.results.length).toFixed(2);
  };

  const calculateCGPA = () => {
    if (results.length === 0) return "0.00";
    const totalSGPA = results.reduce((acc, sem) => acc + parseFloat(calculateSGPA(sem)), 0);
    return (totalSGPA / results.length).toFixed(2);
  };

  const openAddModal = () => {
    setEditingSemesterId(null);
    setFormData({
      semesterName: availableSemesters[0] || '1st Semester',
      year: '1st Year',
      results: subjects.length > 0 ? subjects.map(s => ({
        id: Math.random().toString(36).substr(2, 9),
        subjectName: s.name,
        sessional1: null,
        sessional2: null,
        sessional3: null,
        finalExam: null,
        maxMarks: 100
      })) : [{
        id: Math.random().toString(36).substr(2, 9),
        subjectName: '',
        sessional1: null,
        sessional2: null,
        sessional3: null,
        finalExam: null,
        maxMarks: 100
      }]
    });
    setShowModal(true);
  };

  const openEditModal = (sem: SemesterResult) => {
    setEditingSemesterId(sem.id);
    setFormData({
      semesterName: sem.semesterName,
      year: sem.year,
      results: [...sem.results]
    });
    setShowModal(true);
  };

  const handleYearChange = (year: string) => {
    const sems = YEAR_SEMESTER_MAP[year] || [];
    setFormData({
      ...formData,
      year,
      semesterName: sems[0] || ''
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.semesterName) return alert("Please select a semester.");

    const newGlobalSubjects: Subject[] = [];
    formData.results.forEach(res => {
      if (res.subjectName.trim() && !subjects.some(s => s.name.toLowerCase() === res.subjectName.toLowerCase())) {
        newGlobalSubjects.push({
          id: Math.random().toString(36).substr(2, 9),
          name: res.subjectName.trim(),
          attended: 0,
          total: 0
        });
      }
    });

    if (newGlobalSubjects.length > 0) {
      setSubjects(prev => [...prev, ...newGlobalSubjects]);
    }

    if (editingSemesterId) {
      setResults(prev => prev.map(s => s.id === editingSemesterId ? { ...s, ...formData } : s));
    } else {
      const newSem: SemesterResult = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData
      };
      setResults(prev => [...prev, newSem]);
    }
    setShowModal(false);
  };

  const deleteSemester = (id: string) => {
    if (confirm("Are you sure you want to delete these results?")) {
      setResults(prev => prev.filter(s => s.id !== id));
    }
  };

  const getSemesterAverage = (sem: SemesterResult) => {
    if (sem.results.length === 0) return 0;
    const totals = sem.results.map(r => {
      const earned = (r.sessional1 || 0) + (r.sessional2 || 0) + (r.sessional3 || 0) + (r.finalExam || 0);
      return (earned / (r.maxMarks * 4)) * 100;
    });
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    return Math.round(avg);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Academics</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Tracking your progress across semesters.</p>
        </div>
        <div className="flex items-center gap-6">
            <div className="text-right">
                <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">{calculateCGPA()}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total CGPA</p>
            </div>
            <button 
                onClick={openAddModal}
                className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95"
            >
                <i className="fa-solid fa-plus mr-2"></i> Add Result
            </button>
        </div>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 gap-12">
          {[...results].sort((a,b) => a.semesterName.localeCompare(b.semesterName)).map((sem) => (
            <div key={sem.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group">
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                    <i className="fa-solid fa-award"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{sem.semesterName}</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{sem.year}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-10">
                  <div className="text-center">
                    <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">{calculateSGPA(sem)}</p>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-1">SGPA</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{getSemesterAverage(sem)}%</p>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-1">Aggregate</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(sem)} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center"><i className="fa-solid fa-pen-to-square"></i></button>
                    <button onClick={() => deleteSemester(sem.id)} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center"><i className="fa-solid fa-trash-can"></i></button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-8 py-4">Course Details</th>
                      <th className="px-6 py-4 text-center">Sessional 1</th>
                      <th className="px-6 py-4 text-center">Sessional 2</th>
                      <th className="px-6 py-4 text-center">Sessional 3</th>
                      <th className="px-6 py-4 text-center">Final Exam</th>
                      <th className="px-8 py-4 text-right">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {sem.results.map((res) => {
                      const totalPossible = res.maxMarks * 4;
                      const earned = (res.sessional1 || 0) + (res.sessional2 || 0) + (res.sessional3 || 0) + (res.finalExam || 0);
                      const percent = Math.round((earned / totalPossible) * 100);
                      return (
                        <tr key={res.id} className="group/row hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">{res.subjectName}</span>
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">Point: {getGradePoint(percent)}</span>
                          </td>
                          <td className="px-6 py-5 text-center font-black text-slate-600 dark:text-slate-400">{res.sessional1 ?? '--'}</td>
                          <td className="px-6 py-5 text-center font-black text-slate-600 dark:text-slate-400">{res.sessional2 ?? '--'}</td>
                          <td className="px-6 py-5 text-center font-black text-slate-600 dark:text-slate-400">{res.sessional3 ?? '--'}</td>
                          <td className="px-6 py-5 text-center font-black text-slate-800 dark:text-white">{res.finalExam ?? '--'}</td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-3">
                                <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${percent >= 40 ? 'bg-indigo-600' : 'bg-rose-500'}`} style={{ width: `${percent}%` }}></div>
                                </div>
                                <span className="text-xs font-black text-slate-700 dark:text-slate-300 w-10">{percent}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] py-32 text-center">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-slate-300 dark:text-slate-600 text-4xl">
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3 uppercase tracking-tight">Academic Milestone</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-10 leading-relaxed font-medium">Securely document your performance to get AI-powered academic insights and CGPA tracking.</p>
          <button onClick={openAddModal} className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all">Start Documenting</button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 custom-scrollbar">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                {editingSemesterId ? 'Update Record' : 'New Academic Record'}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Academic Year</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                    value={formData.year}
                    onChange={e => handleYearChange(e.target.value)}
                  >
                    {Object.keys(YEAR_SEMESTER_MAP).map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Semester</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                    value={formData.semesterName}
                    onChange={e => setFormData({ ...formData, semesterName: e.target.value })}
                    required
                  >
                    {availableSemesters.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-4">
                  <h4 className="font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest text-xs">Subject Wise Breakdown</h4>
                  <button 
                    type="button" 
                    onClick={() => setFormData({ 
                      ...formData, 
                      results: [...formData.results, { 
                        id: Math.random().toString(36).substr(2, 9), 
                        subjectName: '', 
                        sessional1: null, 
                        sessional2: null, 
                        sessional3: null, 
                        finalExam: null, 
                        maxMarks: 100
                      }] 
                    })} 
                    className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2"
                  >
                    <i className="fa-solid fa-plus-circle"></i> Add Course
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.results.map((res, idx) => (
                    <div key={res.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-6 gap-5 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Course Name</label>
                        <input className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" value={res.subjectName} onChange={e => { const updated = [...formData.results]; updated[idx].subjectName = e.target.value; setFormData({ ...formData, results: updated }); }} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">S1</label>
                        <input type="number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-center font-black" value={res.sessional1 ?? ''} onChange={e => { const updated = [...formData.results]; updated[idx].sessional1 = e.target.value ? parseInt(e.target.value) : null; setFormData({ ...formData, results: updated }); }} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">S2</label>
                        <input type="number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-center font-black" value={res.sessional2 ?? ''} onChange={e => { const updated = [...formData.results]; updated[idx].sessional2 = e.target.value ? parseInt(e.target.value) : null; setFormData({ ...formData, results: updated }); }} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">S3</label>
                        <input type="number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-center font-black" value={res.sessional3 ?? ''} onChange={e => { const updated = [...formData.results]; updated[idx].sessional3 = e.target.value ? parseInt(e.target.value) : null; setFormData({ ...formData, results: updated }); }} />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Final</label>
                          <input type="number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-center font-black" value={res.finalExam ?? ''} onChange={e => { const updated = [...formData.results]; updated[idx].finalExam = e.target.value ? parseInt(e.target.value) : null; setFormData({ ...formData, results: updated }); }} />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => { const updated = formData.results.filter((_, i) => i !== idx); setFormData({ ...formData, results: updated }); }} 
                          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 text-slate-300 hover:text-red-500 transition-colors flex items-center justify-center mt-6"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-10">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
                >
                  {editingSemesterId ? 'Update Record' : 'Commit Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
