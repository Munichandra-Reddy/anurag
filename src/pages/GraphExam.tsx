import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  FileText, CheckCircle2, Clock, Upload, Trash2, Search, 
  Eye, X, AlertCircle, FileCheck, FileCode, Sparkles, RefreshCw
} from 'lucide-react';
import { getFromCloudflare, saveToCloudflare, replaceInCloudflare } from '../utils/cloudflare';
import { MUNI_STUDENTS } from '../data/students';

interface StudentSubmission {
  studentEmail: string;
  studentName: string;
  rollNumber: string;
  batch: string;
  submittedAt: string;
  questionNumber: string; // e.g., "Question 1", "Question 2", etc.
  fileName: string;
  fileType: 'image' | 'pdf';
  fileData: string; // Base64 data URL
}

const STORAGE_KEY = 'graphExamSubmissions_muni';

const GraphExam: React.FC = () => {
  const location = useLocation();
  const isMentorView = location.pathname.includes('/mentor-dashboard');
  const loggedInEmail = (sessionStorage.getItem('loggedInEmail') || '').toLowerCase().trim();

  // Data states
  const [submissions, setSubmissions] = useState<Record<string, StudentSubmission>>({});
  const [muniStudentsList, setMuniStudentsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Student Form states
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [questionNumber, setQuestionNumber] = useState('Question 1');
  const [selectedFile, setSelectedFile] = useState<{
    fileName: string;
    fileType: 'image' | 'pdf';
    fileData: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Mentor Table & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);

  // Preview Modal state
  const [previewFile, setPreviewFile] = useState<{
    studentName: string;
    rollNumber: string;
    questionNumber: string;
    fileName: string;
    fileType: 'image' | 'pdf';
    fileData: string;
  } | null>(null);

  // Load Muni students and submissions (Using Firestore replace to respect deletions)
  const loadData = async () => {
    setIsLoading(true);
    try {
      const cloudMuniStudents = await getFromCloudflare('registeredStudents_muni@geonixa.com') || [];
      const localMuniStudents = JSON.parse(localStorage.getItem('registeredStudents_muni@geonixa.com') || '[]');

      const studentMap = new Map();
      [...MUNI_STUDENTS, ...localMuniStudents, ...cloudMuniStudents].forEach((s: any) => {
        if (s && s.email) {
          const cleanEmail = s.email.toLowerCase().trim();
          if (!studentMap.has(cleanEmail)) {
            studentMap.set(cleanEmail, {
              name: s.name || cleanEmail.split('@')[0],
              email: cleanEmail,
              roll: s.roll || s.password || '',
              batch: s.batch || 'A1'
            });
          }
        }
      });

      if (!studentMap.has('raju@anurag.com')) {
        studentMap.set('raju@anurag.com', {
          name: 'Raju',
          email: 'raju@anurag.com',
          roll: 'RAJU526',
          batch: 'A1'
        });
      }

      const allList = Array.from(studentMap.values());
      setMuniStudentsList(allList);

      // Check deletion tombstone for loggedInEmail
      let isDeletedTombstone = false;
      if (loggedInEmail && !isMentorView) {
        const delCheck = await getFromCloudflare(`deletedSubmission_${loggedInEmail}`);
        if (delCheck && delCheck.deletedAt) {
          isDeletedTombstone = true;
        }
      }

      // Fetch Cloudflare submissions
      const cloudSubmissions = await getFromCloudflare(STORAGE_KEY);
      
      let finalSubmissions: Record<string, StudentSubmission> = {};

      if (cloudSubmissions && typeof cloudSubmissions === 'object') {
        finalSubmissions = { ...cloudSubmissions };
      } else {
        const localSubmissions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        finalSubmissions = { ...localSubmissions };
      }

      if (isDeletedTombstone && loggedInEmail) {
        delete finalSubmissions[loggedInEmail];
      }

      // Update local storage with clean synchronized state
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalSubmissions));
      setSubmissions(finalSubmissions);
    } catch (err) {
      console.error("Failed to load Graph Exam data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-refresh when tab gains focus or every 5 seconds for fast real-time deletion sync
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener('focus', handleFocus);

    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  // Handle File Upload
  const handleFileChange = (file: File) => {
    setSubmitError('');
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('File exceeds 5MB limit. Please upload a smaller screenshot or PDF file.');
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(png|jpg|jpeg|webp|gif)$/i.test(file.name);

    if (!isPdf && !isImage) {
      setSubmitError('Invalid file format. Please upload a Screenshot (Image) or PDF file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      setSelectedFile({
        fileName: file.name,
        fileType: isPdf ? 'pdf' : 'image',
        fileData: base64Data
      });
    };
    reader.readAsDataURL(file);
  };

  // Submit Answer
  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!questionNumber.trim()) {
      setSubmitError('Please select or type a Question Number.');
      return;
    }

    if (!selectedFile) {
      setSubmitError('Please upload a Screenshot or PDF file for your answer.');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentStudent = muniStudentsList.find(s => s.email === loggedInEmail) || {
        name: loggedInEmail.split('@')[0],
        email: loggedInEmail,
        roll: 'N/A',
        batch: 'A1'
      };

      const newSubmission: StudentSubmission = {
        studentEmail: loggedInEmail,
        studentName: currentStudent.name,
        rollNumber: currentStudent.roll,
        batch: currentStudent.batch || 'A1',
        submittedAt: new Date().toLocaleString(),
        questionNumber: questionNumber.trim(),
        fileName: selectedFile.fileName,
        fileType: selectedFile.fileType,
        fileData: selectedFile.fileData
      };

      const updatedSubmissions = {
        ...submissions,
        [loggedInEmail]: newSubmission
      };

      // Clear any tombstone flag if previously deleted
      await replaceInCloudflare(`deletedSubmission_${loggedInEmail}`, {});

      // Use replaceInCloudflare (WITHOUT merge) to overwrite Firestore with exact object
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSubmissions));
      await replaceInCloudflare(STORAGE_KEY, updatedSubmissions);

      setSubmissions(updatedSubmissions);
      setSubmitSuccess('Answer submitted successfully!');
      setIsSubmitModalOpen(false);
      setSelectedFile(null);
    } catch (err) {
      console.error("Submission failed:", err);
      setSubmitError('Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Submission (Mentor) - Uses replaceInCloudflare to physically erase key in Firestore
  const handleDeleteSubmission = async (studentEmail: string) => {
    const studentObj = muniStudentsList.find(s => s.email === studentEmail);
    const displayName = studentObj ? `${studentObj.name} (${studentObj.roll || studentEmail})` : studentEmail;
    
    if (!window.confirm(`Are you sure you want to delete the submission for ${displayName}? This student will then be able to submit again.`)) {
      return;
    }

    setDeletingEmail(studentEmail);
    try {
      const updatedSubmissions = { ...submissions };
      delete updatedSubmissions[studentEmail];

      // 1. Update local storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSubmissions));

      // 2. Overwrite in Firestore without merging (so key is physically deleted)
      await replaceInCloudflare(STORAGE_KEY, updatedSubmissions);

      // 3. Save explicit tombstone flag in Firestore so student tab instantly knows it was deleted
      await saveToCloudflare(`deletedSubmission_${studentEmail}`, { deletedAt: Date.now() });

      setSubmissions(updatedSubmissions);
    } catch (err) {
      console.error("Failed to delete submission:", err);
      alert("Failed to delete submission. Please try again.");
    } finally {
      setDeletingEmail(null);
    }
  };

  const mySubmission = submissions[loggedInEmail];
  const isMyExamCompleted = !!mySubmission;

  // Filtered mentor table list
  const mentorTableData = muniStudentsList.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.roll.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBatch = batchFilter === 'ALL' || student.batch === batchFilter;

    const isSubmitted = !!submissions[student.email];
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'COMPLETED' && isSubmitted) || 
      (statusFilter === 'PENDING' && !isSubmitted);

    return matchesSearch && matchesBatch && matchesStatus;
  });

  const totalMuniCount = muniStudentsList.length;
  const completedMuniCount = Object.keys(submissions).filter(email => muniStudentsList.some(s => s.email === email)).length;
  const pendingMuniCount = Math.max(0, totalMuniCount - completedMuniCount);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-primary to-red-900 p-6 md:p-8 rounded-3xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold uppercase tracking-wide text-red-200 border border-white/20 mb-1">
            <Sparkles size={14} className="text-yellow-300" /> Lab Exam Portal
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
            <FileText size={32} />
            Graph Exam 1
          </h1>
          <p className="text-red-100 text-sm max-w-xl">
            {isMentorView 
              ? "View and manage Graph Exam 1 lab answer screenshots/PDFs submitted by Muni Mentor students." 
              : "Upload your question answer (Screenshot or PDF) for Graph Exam 1."}
          </p>
        </div>

        <button 
          onClick={loadData}
          disabled={isLoading}
          className="self-start md:self-auto flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/20 backdrop-blur-md transition-all shrink-0 cursor-pointer"
        >
          <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {submitSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-semibold flex items-center gap-3 shadow-sm">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          {submitSuccess}
        </div>
      )}

      {/* ======================================================== */}
      {/* STUDENT VIEW */}
      {/* ======================================================== */}
      {!isMentorView && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">Graph Exam 1</h2>
                  {isMyExamCompleted ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 size={14} /> Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                      <Clock size={14} /> Pending
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">Format: Select Question Number & Upload Screenshot or PDF Answer</p>
              </div>

              {!isMyExamCompleted ? (
                <button
                  onClick={() => {
                    setSubmitError('');
                    setQuestionNumber('Question 1');
                    setSelectedFile(null);
                    setIsSubmitModalOpen(true);
                  }}
                  className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                  <Upload size={18} />
                  Submit Answers
                </button>
              ) : (
                <div className="text-xs text-right text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <p className="font-semibold text-gray-800">Submitted On:</p>
                  <p>{mySubmission.submittedAt}</p>
                </div>
              )}
            </div>

            {/* Submission Status Summary Box */}
            {isMyExamCompleted ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-bold text-emerald-900">Your Graph Exam 1 answer has been submitted!</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Muni Mentor can view your submitted answer. If your mentor deletes your submission, your status will revert to Pending so you can re-submit.
                    </p>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-gray-900 pt-2">Submitted Question Details</h3>
                <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {mySubmission.fileType === 'image' ? (
                      <img src={mySubmission.fileData} alt={mySubmission.questionNumber} className="w-14 h-14 object-cover rounded-xl border border-gray-200 shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm shrink-0">
                        PDF
                      </div>
                    )}
                    <div>
                      <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg inline-block mb-1">
                        {mySubmission.questionNumber}
                      </span>
                      <p className="text-xs font-bold text-gray-800 truncate max-w-xs">{mySubmission.fileName}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">{mySubmission.fileType}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setPreviewFile({
                      studentName: mySubmission.studentName,
                      rollNumber: mySubmission.rollNumber,
                      questionNumber: mySubmission.questionNumber,
                      fileName: mySubmission.fileName,
                      fileType: mySubmission.fileType,
                      fileData: mySubmission.fileData
                    })}
                    className="px-4 py-2.5 bg-white border border-gray-200 text-gray-800 hover:text-primary hover:border-primary text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Eye size={15} /> View File
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-amber-50/50 border border-amber-200 rounded-2xl text-center space-y-3">
                <AlertCircle size={36} className="text-amber-500 mx-auto" />
                <h3 className="text-base font-bold text-amber-900">Lab Exam Submission Pending</h3>
                <p className="text-xs text-amber-700 max-w-md mx-auto">
                  You have not submitted Graph Exam 1 yet. Click the <strong>Submit Answers</strong> button above to select your question number and upload your answer screenshot or PDF file.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MENTOR VIEW */}
      {/* ======================================================== */}
      {isMentorView && (
        <div className="space-y-6">
          {/* KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileCode size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Muni Students</p>
                <h3 className="text-2xl font-black text-gray-900">{totalMuniCount}</h3>
                <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Enrolled Students</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Completed Submissions</p>
                <h3 className="text-2xl font-black text-gray-900">{completedMuniCount}</h3>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Lab Exams Submitted</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Pending Submissions</p>
                <h3 className="text-2xl font-black text-gray-900">{pendingMuniCount}</h3>
                <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Awaiting Student Upload</p>
              </div>
            </div>
          </div>

          {/* Table Controls & Filters */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="text-primary" size={20} />
                Graph Exam 1 Student Submissions Table
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                {/* Batch Filter */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                  <span className="text-gray-400 px-2">Batch:</span>
                  {['ALL', 'A1', 'A2', 'B1', 'B2'].map(b => (
                    <button
                      key={b}
                      onClick={() => setBatchFilter(b)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        batchFilter === b ? 'bg-white text-primary shadow-xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                  <span className="text-gray-400 px-2">Status:</span>
                  {[
                    { id: 'ALL', label: 'All' },
                    { id: 'COMPLETED', label: 'Completed' },
                    { id: 'PENDING', label: 'Pending' }
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setStatusFilter(s.id)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        statusFilter === s.id ? 'bg-white text-primary shadow-xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by student name, roll number, or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Submissions Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Roll Number</th>
                    <th className="py-3.5 px-4">Question Number</th>
                    <th className="py-3.5 px-4">Answers (PDF / Screenshot)</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {mentorTableData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400 italic">
                        No student records found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    mentorTableData.map(student => {
                      const sub = submissions[student.email];
                      const isCompleted = !!sub;

                      return (
                        <tr key={student.email} className="hover:bg-gray-50/80 transition-colors">
                          {/* Name & Email */}
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-gray-900">{student.name}</p>
                            <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{student.email}</p>
                          </td>

                          {/* Roll Number */}
                          <td className="py-3.5 px-4 font-mono font-bold text-gray-700">
                            {student.roll || 'N/A'}
                          </td>

                          {/* Question Number */}
                          <td className="py-3.5 px-4">
                            {isCompleted && sub.questionNumber ? (
                              <span className="px-2.5 py-1 bg-primary/10 text-primary font-bold rounded-lg text-xs">
                                {sub.questionNumber}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">-</span>
                            )}
                          </td>

                          {/* Answers (PDF or Screenshot View) */}
                          <td className="py-3.5 px-4">
                            {isCompleted ? (
                              <button
                                onClick={() => setPreviewFile({
                                  studentName: sub.studentName,
                                  rollNumber: sub.rollNumber,
                                  questionNumber: sub.questionNumber,
                                  fileName: sub.fileName,
                                  fileType: sub.fileType,
                                  fileData: sub.fileData
                                })}
                                className="px-3 py-1.5 bg-white border border-gray-200 hover:border-primary hover:text-primary text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                              >
                                <Eye size={14} />
                                <span>{sub.fileName} ({sub.fileType.toUpperCase()})</span>
                              </button>
                            ) : (
                              <span className="text-gray-400 italic">No answer file</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-extrabold rounded-full">
                                <CheckCircle2 size={12} /> Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-extrabold rounded-full">
                                <Clock size={12} /> Pending
                              </span>
                            )}
                          </td>

                          {/* Delete Action */}
                          <td className="py-3.5 px-4 text-center">
                            {isCompleted ? (
                              <button
                                onClick={() => handleDeleteSubmission(student.email)}
                                disabled={deletingEmail === student.email}
                                title="Delete submission to let student submit again"
                                className="p-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl transition-all cursor-pointer inline-flex items-center justify-center"
                              >
                                {deletingEmail === student.email ? (
                                  <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                  <Trash2 size={15} />
                                )}
                              </button>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBMISSION FORM MODAL (TYPE QUESTION NO & UPLOAD FILE) */}
      {/* ======================================================== */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSubmitAnswer}
            className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl relative"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Submit Answers</h3>
                <p className="text-xs text-gray-500">Select question number and upload answer screenshot or PDF.</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-500" />
                {submitError}
              </div>
            )}

            {/* Question Number Input / Select */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wide">
                Question Number
              </label>
              <select
                value={questionNumber}
                onChange={e => setQuestionNumber(e.target.value)}
                className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="Question 1">Question 1</option>
                <option value="Question 2">Question 2</option>
                <option value="Question 3">Question 3</option>
                <option value="Question 4">Question 4</option>
                <option value="Question 5">Question 5</option>
                <option value="Question 6">Question 6</option>
              </select>
            </div>

            {/* File Upload Box */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wide">
                Answer Screenshot or PDF File
              </label>

              {selectedFile ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {selectedFile.fileType === 'image' ? (
                      <img src={selectedFile.fileData} alt="Preview" className="w-12 h-12 object-cover rounded-xl border border-gray-200 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                        PDF
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate" title={selectedFile.fileName}>{selectedFile.fileName}</p>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">{selectedFile.fileType}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Change file"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-300 hover:border-primary/50 bg-gray-50 hover:bg-gray-100/50 p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors space-y-2">
                  <Upload size={28} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-700">Click to upload answer file</span>
                  <span className="text-[10px] text-gray-400">Supports Screenshot (Image) or PDF (Max 5MB)</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting && <RefreshCw size={14} className="animate-spin" />}
                Submit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* FILE PREVIEW MODAL (IMAGE / PDF PREVIEW) */}
      {/* ======================================================== */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl relative max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-primary text-white rounded-md text-xs">
                    {previewFile.questionNumber}
                  </span>
                  Answer File: {previewFile.fileName}
                </h3>
                <p className="text-xs text-gray-500">
                  Student: <strong className="text-gray-800">{previewFile.studentName}</strong> ({previewFile.rollNumber})
                </p>
              </div>
              <button 
                onClick={() => setPreviewFile(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            {/* Viewer Area */}
            <div className="flex-1 overflow-auto bg-gray-900 rounded-2xl p-4 flex items-center justify-center min-h-[400px]">
              {previewFile.fileType === 'image' ? (
                <img 
                  src={previewFile.fileData} 
                  alt={previewFile.questionNumber} 
                  className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg mx-auto"
                />
              ) : (
                <iframe
                  src={previewFile.fileData}
                  title={`${previewFile.questionNumber} PDF`}
                  className="w-full h-[70vh] border-0 rounded-lg bg-white"
                />
              )}
            </div>

            <div className="flex items-center justify-between shrink-0 pt-2 text-xs">
              <a
                href={previewFile.fileData}
                download={previewFile.fileName}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                Download Answer File
              </a>

              <button
                onClick={() => setPreviewFile(null)}
                className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphExam;
