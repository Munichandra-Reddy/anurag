import React, { useState, useEffect } from 'react';
import { Plus, X, Upload, Link as LinkIcon, FileText, CheckCircle2, Award, PlayCircle } from 'lucide-react';
import { WeeklyExamReport } from './WeeklyExamReport';
import { getFromCloudflare, saveToCloudflare, getMentorKey, getStudentsKey } from '../utils/cloudflare';
import { SOLIDWORKS_60_MCQS } from '../data/solidworks60Mcqs';

interface TheoryQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}

interface WeeklyExamData {
  id: string; // e.g., 'week1'
  title: string; // e.g., 'Week 1 Exam'
  projectTitle: string;
  portfolioTopic: string;
  assessmentMode?: 'pdf' | 'mcq';
  theoryPdfName: string;
  theoryPdfDataUrl?: string;
  theoryQuestions: TheoryQuestion[];
  targetBatch?: string;
}

interface WeeklyExamSubmission {
  projectUrl: string;
  projectPdfName: string;
  projectPdfDataUrl?: string;
  portfolioPdfName: string;
  portfolioPdfDataUrl?: string;
  theoryAnswers: number[];
  theoryTextAnswer?: string;
  theoryAnswerPdfName?: string;
  theoryAnswerPdfDataUrl?: string;
  submittedAt: string;
}

interface Props {
  isMentor: boolean;
  loggedInEmail: string;
}

export const WeeklyAssessmentFlow: React.FC<Props> = ({ isMentor, loggedInEmail }) => {
  const [exams, setExams] = useState<WeeklyExamData[]>([]);
  const [isAdding, setIsAdding] = useState<false | 'weekly' | 'cie'>(false);
  
  // Filter state
  const [filterExam, setFilterExam] = useState('');
  const [filterBatch, setFilterBatch] = useState('All');
  
  // Mentor form state
  const [selectedWeek, setSelectedWeek] = useState('week1');
  const [projectTitle, setProjectTitle] = useState('');
  const [portfolioTopic, setPortfolioTopic] = useState('');
  const [assessmentMode, setAssessmentMode] = useState<'pdf' | 'mcq'>('mcq');
  const [theoryPdfName, setTheoryPdfName] = useState('theory_assignment.pdf');
  const [theoryPdfDataUrl, setTheoryPdfDataUrl] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(60);
  const [theoryQuestions, setTheoryQuestions] = useState<TheoryQuestion[]>(SOLIDWORKS_60_MCQS);

  // Student form state
  const [takingExamId, setTakingExamId] = useState<string | null>(null);
  const [studentProjectUrl, setStudentProjectUrl] = useState('');
  const [studentProjectPdf, setStudentProjectPdf] = useState('');
  const [studentProjectPdfDataUrl, setStudentProjectPdfDataUrl] = useState('');
  const [studentPortfolioPdf, setStudentPortfolioPdf] = useState('');
  const [studentPortfolioPdfDataUrl, setStudentPortfolioPdfDataUrl] = useState('');
  const [studentTheoryAnswers, setStudentTheoryAnswers] = useState<number[]>([]);
  const [studentTheoryTextAnswer, setStudentTheoryTextAnswer] = useState('');
  const [studentTheoryPdf, setStudentTheoryPdf] = useState('');
  const [studentTheoryPdfDataUrl, setStudentTheoryPdfDataUrl] = useState('');
  const [submissions, setSubmissions] = useState<Record<string, WeeklyExamSubmission>>({});
  const [evaluatingExamId, setEvaluatingExamId] = useState<string | null>(null);

  const [targetBatch, setTargetBatch] = useState('All Batches');
  const [projectBatches, setProjectBatches] = useState<{id: string, batchNumber: string, memberEmails: string[]}[]>([]);
  const [studentDetails, setStudentDetails] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      let examsKey = 'anuragLmsWeeklyExams';
      let batchesKey = 'anuragLmsProjectBatchData';

      if (isMentor) {
        examsKey = getMentorKey('anuragLmsWeeklyExams');
        batchesKey = getMentorKey('anuragLmsProjectBatchData');
      } else {
        const muniStudents = await getFromCloudflare('registeredStudents_muni@geonixa.com') || [];
        const isMuniStudent = (muniStudents as any[]).some((s: any) => s.email === loggedInEmail);
        if (isMuniStudent) {
          examsKey = 'anuragLmsWeeklyExams_muni@geonixa.com';
          batchesKey = 'anuragLmsProjectBatchData_muni@geonixa.com';
        }
      }

      // Load created exams
      const cloudExams = await getFromCloudflare(examsKey);
      if (cloudExams && Array.isArray(cloudExams)) {
        setExams(cloudExams);
      } else {
        const savedExams = localStorage.getItem(examsKey);
        if (savedExams) setExams(JSON.parse(savedExams));
      }

      // Load Project Batches
      const cloudBatches = await getFromCloudflare(batchesKey);
      if (cloudBatches) {
        setProjectBatches(cloudBatches as any);
      } else {
        const savedBatches = localStorage.getItem(batchesKey);
        if (savedBatches) setProjectBatches(JSON.parse(savedBatches));
      }
      
      // Load student submissions & details
      if (!isMentor) {
        const subKey = `weeklyExamSubmissions_${loggedInEmail}`;
        const cloudSubmissions = await getFromCloudflare(subKey);
        if (cloudSubmissions) {
          setSubmissions(cloudSubmissions);
        } else {
          const savedSubmissions = localStorage.getItem(subKey);
          if (savedSubmissions) setSubmissions(JSON.parse(savedSubmissions));
        }
        
        const studentsKey = getStudentsKey();
        const cloudStudents = await getFromCloudflare(studentsKey);
        const students = cloudStudents ? cloudStudents as any[] : JSON.parse(localStorage.getItem(studentsKey) || '[]');
        const me = students.find((s: any) => s.email === loggedInEmail);
        setStudentDetails(me);
      }
    };
    fetchData();
  }, [isMentor, loggedInEmail]);

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();

    const examId = targetBatch === 'All Batches' ? selectedWeek : `${selectedWeek}_${targetBatch.replace(/\s+/g, '')}`;

    const newExam: WeeklyExamData = {
      id: examId,
      title: `${selectedWeek.toUpperCase()} Exam`,
      projectTitle,
      portfolioTopic,
      assessmentMode,
      theoryPdfName: assessmentMode === 'pdf' ? theoryPdfName : '',
      theoryPdfDataUrl: assessmentMode === 'pdf' ? theoryPdfDataUrl : '',
      theoryQuestions: assessmentMode === 'mcq' ? theoryQuestions.slice(0, questionCount) : [],
      targetBatch
    };

    const updatedExams = [...exams.filter(ex => ex.id !== examId), newExam];
    setExams(updatedExams);
    
    const examsKey = getMentorKey('anuragLmsWeeklyExams');
    localStorage.setItem(examsKey, JSON.stringify(updatedExams));
    await saveToCloudflare(examsKey, updatedExams);
    
    setIsAdding(false);
    // Reset
    setProjectTitle('');
    setPortfolioTopic('');
    setTheoryPdfName('theory_assignment.pdf');
    setTheoryPdfDataUrl('');
    setQuestionCount(60);
    setTheoryQuestions(SOLIDWORKS_60_MCQS);
    setTargetBatch('All Batches');
  };

  const handleStudentSubmit = async () => {
    if (!takingExamId) return;
    const exam = exams.find(e => e.id === takingExamId);
    if (!exam) return;

    if (exam.projectTitle && !studentProjectUrl && !studentProjectPdf) {
      alert("Please provide a project URL or PDF");
      return;
    }



    const submission: WeeklyExamSubmission = {
      projectUrl: studentProjectUrl,
      projectPdfName: studentProjectPdf || 'project_file.pdf',
      projectPdfDataUrl: studentProjectPdfDataUrl,
      portfolioPdfName: studentPortfolioPdf || 'portfolio_file.pdf',
      portfolioPdfDataUrl: studentPortfolioPdfDataUrl,
      theoryAnswers: studentTheoryAnswers,
      theoryTextAnswer: studentTheoryTextAnswer,
      theoryAnswerPdfName: studentTheoryPdf || 'theory_answers.pdf',
      theoryAnswerPdfDataUrl: studentTheoryPdfDataUrl,
      submittedAt: new Date().toISOString()
    };

    const newSubmissions = { ...submissions, [takingExamId]: submission };
    setSubmissions(newSubmissions);
    localStorage.setItem(`weeklyExamSubmissions_${loggedInEmail}`, JSON.stringify(newSubmissions));
    await saveToCloudflare(`weeklyExamSubmissions_${loggedInEmail}`, newSubmissions);
    
    // Also save a raw version for the mentor to read in Exam Reports
    localStorage.setItem(`weeklyReportSubmission_${loggedInEmail}_${takingExamId}`, JSON.stringify(submission));
    await saveToCloudflare(`weeklyReportSubmission_${loggedInEmail}_${takingExamId}`, submission);

    setTakingExamId(null);
    setStudentProjectUrl('');
    setStudentProjectPdf('');
    setStudentProjectPdfDataUrl('');
    setStudentPortfolioPdf('');
    setStudentPortfolioPdfDataUrl('');
    setStudentTheoryAnswers([]);
    setStudentTheoryTextAnswer('');
    setStudentTheoryPdf('');
    setStudentTheoryPdfDataUrl('');
  };

  const handleOpenPdf = (dataUrl?: string, name?: string) => {
    if (!dataUrl) {
      alert(`The file data for "${name || 'this document'}" is missing.\n\nFor older exams created before this feature was fully enabled, the actual file content was not saved to the server (only the file name was saved).\n\nPlease remove and re-add the exam (or re-upload the file) to properly save the file content.`);
      return;
    }
    try {
      // Manually convert data URI to Blob to avoid fetch size limits
      const byteString = atob(dataUrl.split(',')[1]);
      const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = name || 'document.pdf'; // Force download with correct name so .docx opens in Word
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error("Error opening file:", error);
      alert("Failed to open the file. It may be corrupted or too large.");
    }
  };

  if (evaluatingExamId) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <WeeklyExamReport 
          pattern={evaluatingExamId} 
          isMentor={isMentor} 
          loggedInEmail={loggedInEmail} 
          onBack={() => setEvaluatingExamId(null)}
        />
      </div>
    );
  }

  if (takingExamId) {
    const exam = exams.find(e => e.id === takingExamId);
    if (!exam) return null;

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8 relative">
        <button 
          onClick={() => setTakingExamId(null)}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-1"
        >
          <X size={20} />
        </button>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{exam.title}</h2>
          <p className="text-gray-500">Complete all sections below and submit your work.</p>
        </div>

        {/* Project Section */}
        {exam.projectTitle && (
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-4">
            <h3 className="font-bold text-lg text-gray-900 border-b border-gray-200 pb-2">1. Project Submission</h3>
            <p className="text-gray-700 font-medium">{exam.projectTitle}</p>
            
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project URL</label>
                <div className="relative">
                  <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="url" 
                    value={studentProjectUrl}
                    onChange={(e) => setStudentProjectUrl(e.target.value)}
                    placeholder="https://github.com/your-project"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Project PDFs (Optional)</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                    <Upload size={16} /> Choose File
                    <input type="file" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setStudentProjectPdf(file.name);
                        const reader = new FileReader();
                        reader.onload = (event) => setStudentProjectPdfDataUrl(event.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                  {studentProjectPdf && <span className="text-sm text-primary font-medium">{studentProjectPdf}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Section */}
        {exam.portfolioTopic && (
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-4">
            <h3 className="font-bold text-lg text-gray-900 border-b border-gray-200 pb-2">2. Portfolio & Document</h3>
            <p className="text-gray-700 font-medium">{exam.portfolioTopic}</p>
            
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Portfolio PDFs</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                  <Upload size={16} /> Choose File
                  <input type="file" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setStudentPortfolioPdf(file.name);
                      const reader = new FileReader();
                      reader.onload = (event) => setStudentPortfolioPdfDataUrl(event.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
                {studentPortfolioPdf && <span className="text-sm text-primary font-medium">{studentPortfolioPdf}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Theory / MCQ Section */}
        {exam.theoryQuestions && exam.theoryQuestions.length > 0 ? (
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-6">
            <h3 className="font-bold text-lg text-gray-900 border-b border-gray-200 pb-2">
              {exam.portfolioTopic ? '3' : '2'}. Multiple Choice Questions ({exam.theoryQuestions.length} Questions)
            </h3>
            
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
              {exam.theoryQuestions.map((q, qIdx) => (
                <div key={qIdx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  <p className="font-bold text-gray-900 text-sm">
                    {qIdx + 1}. {(q.question || `Question ${qIdx + 1}`).replace(/^\d+[\.\)]\s*/, '')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => (
                      <label 
                        key={optIdx} 
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer text-sm transition-colors ${
                          studentTheoryAnswers[qIdx] === optIdx 
                            ? 'bg-primary/10 border-primary text-primary font-bold' 
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name={`question_${qIdx}`}
                          checked={studentTheoryAnswers[qIdx] === optIdx}
                          onChange={() => {
                            const newAns = [...studentTheoryAnswers];
                            newAns[qIdx] = optIdx;
                            setStudentTheoryAnswers(newAns);
                          }}
                          className="accent-primary"
                        />
                        <span><strong className="mr-1">{String.fromCharCode(65 + optIdx)}.</strong> {opt || `Option ${optIdx + 1}`}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : exam.theoryPdfName ? (
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-4">
            <h3 className="font-bold text-lg text-gray-900 border-b border-gray-200 pb-2">{exam.portfolioTopic ? '3' : '2'}. Theory Assignment</h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 w-max">
                <FileText size={20} className="text-red-500" />
                <span className="text-sm font-medium text-gray-700">{exam.theoryPdfName}</span>
                <button onClick={() => handleOpenPdf(exam.theoryPdfDataUrl, exam.theoryPdfName)} className="text-sm text-primary font-bold ml-2 hover:underline">View File</button>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Write Your Answers Here</label>
                  <textarea 
                    value={studentTheoryTextAnswer}
                    onChange={(e) => setStudentTheoryTextAnswer(e.target.value)}
                    placeholder="Type your answers to the theory questions here..."
                    className="w-full h-40 p-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Or Upload Your Answers (PDF)</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                      <Upload size={16} /> Choose File
                      <input type="file" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setStudentTheoryPdf(file.name);
                          const reader = new FileReader();
                          reader.onload = (event) => setStudentTheoryPdfDataUrl(event.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                    {studentTheoryPdf && <span className="text-sm text-primary font-medium">{studentTheoryPdf}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleStudentSubmit}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-sm hover:bg-orange-600 transition-colors"
          >
            <CheckCircle2 size={20} /> Submit Weekly Exam
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mentor Add Form */}
      {isMentor && (
        <div className="mb-8">
          {!isAdding ? (
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => { setSelectedWeek('week1'); setIsAdding('weekly'); }}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-primary text-primary font-bold rounded-xl shadow-sm hover:bg-primary/5 transition-colors"
              >
                <Plus size={20} /> Add Weekly Exam Paper
              </button>
              <button 
                onClick={() => { setSelectedWeek('CIE1'); setIsAdding('cie'); }}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-orange-500 text-orange-500 font-bold rounded-xl shadow-sm hover:bg-orange-50 transition-colors"
              >
                <Plus size={20} /> Add CIE Exam Paper
              </button>
            </div>
          ) : (
            <div className="bg-white border-2 border-primary/20 p-6 rounded-2xl shadow-sm relative">
              <button 
                onClick={() => setIsAdding(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-full"
              >
                <X size={18} />
              </button>
              
              <h3 className="text-xl font-bold text-gray-900 mb-6">Configure {isAdding === 'cie' ? 'CIE' : 'Weekly'} Exam</h3>
              
              <form onSubmit={handleAddExam} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Select Exam</label>
                    <select 
                      value={selectedWeek} 
                      onChange={(e) => setSelectedWeek(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-sm font-medium"
                    >
                      {isAdding === 'cie' ? (
                        <>
                          <option value="CIE1">CIE1</option>
                          <option value="CIE2">CIE2</option>
                        </>
                      ) : (
                        <>
                          {[...Array(12)].map((_, i) => (
                            <option key={i} value={`week${i + 1}`}>WEEK{i + 1}</option>
                          ))}
                          <option value="SEM">SEM</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Target Batch</label>
                    <select 
                      value={targetBatch} 
                      onChange={(e) => setTargetBatch(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-sm font-medium"
                    >
                      <option value="All Batches">All Batches</option>
                      <option value="Morning">Morning Batch</option>
                      <option value="Evening">Evening Batch</option>
                      {projectBatches.map(b => (
                        <option key={b.id} value={b.batchNumber}>{b.batchNumber}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <h4 className="font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">1. Project</h4>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Title / Description</label>
                  <input 
                    type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                  <p className="text-xs text-gray-500 mt-2">Students will be prompted to submit a URL and PDFs.</p>
                </div>

                {isAdding === 'weekly' && (
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">2. Portfolio & Document</h4>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio Topic</label>
                    <input 
                      type="text" value={portfolioTopic} onChange={(e) => setPortfolioTopic(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    />
                    <p className="text-xs text-gray-500 mt-2">Students will be prompted to upload PDFs.</p>
                  </div>
                )}

                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-4">
                  <h4 className="font-bold text-gray-900 border-b border-gray-200 pb-2">{isAdding === 'weekly' ? '3' : '2'}. Theory / Multiple Choice Assessment</h4>
                  
                  {/* Select Type: 60 MCQs vs Theory PDF */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setAssessmentMode('mcq')}
                      className={`px-4 py-2 rounded-xl font-bold text-sm border transition-all ${
                        assessmentMode === 'mcq'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Multiple Choice Questions (60 MCQs)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssessmentMode('pdf')}
                      className={`px-4 py-2 rounded-xl font-bold text-sm border transition-all ${
                        assessmentMode === 'pdf'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Theory Assignment (Upload Reference PDF)
                    </button>
                  </div>

                  {assessmentMode === 'pdf' ? (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Upload Reference PDF</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 text-sm font-medium text-gray-700">
                          <Upload size={16} /> Choose File
                          <input type="file" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setTheoryPdfName(file.name);
                              const reader = new FileReader();
                              reader.onload = (event) => setTheoryPdfDataUrl(event.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }} />
                        </label>
                        <span className="text-sm text-primary font-medium">{theoryPdfName}</span>
                        {theoryPdfDataUrl && (
                          <button type="button" onClick={() => handleOpenPdf(theoryPdfDataUrl, theoryPdfName)} className="text-sm text-blue-600 hover:underline font-bold ml-2">
                            View PDF
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Students will download this PDF, complete the assignment, and upload their answers as a PDF.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                          Total Questions: 
                          <select 
                            value={questionCount} 
                            onChange={(e) => {
                              const count = Number(e.target.value);
                              setQuestionCount(count);
                              if (theoryQuestions.length < count) {
                                setTheoryQuestions(prev => [
                                  ...prev, 
                                  ...Array.from({ length: count - prev.length }, (_, i) => ({ question: `Question ${prev.length + i + 1}`, options: ['', '', '', ''], answerIndex: 0 }))
                                ]);
                              }
                            }}
                            className="ml-2 border border-gray-300 rounded px-2 py-1 bg-gray-50 font-semibold"
                          >
                            <option value={60}>60 MCQs (Standard)</option>
                            <option value={40}>40 MCQs</option>
                            <option value={20}>20 MCQs</option>
                            <option value={10}>10 MCQs</option>
                          </select>
                        </div>
                        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded font-bold">
                          🔒 Answers saved in mentor portal only (Hidden from students)
                        </span>
                      </div>

                      <div className="max-h-[450px] overflow-y-auto space-y-4 pr-2">
                        {theoryQuestions.slice(0, questionCount).map((q, qIdx) => (
                          <div key={qIdx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-primary uppercase">Question {qIdx + 1}</label>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium">Correct Answer:</span>
                                <select 
                                  value={q.answerIndex} 
                                  onChange={(e) => {
                                    const updated = [...theoryQuestions];
                                    updated[qIdx].answerIndex = Number(e.target.value);
                                    setTheoryQuestions(updated);
                                  }}
                                  className="text-xs border border-primary/40 bg-orange-50 text-orange-900 rounded font-bold px-2 py-1 focus:outline-none"
                                >
                                  <option value={0}>Option A</option>
                                  <option value={1}>Option B</option>
                                  <option value={2}>Option C</option>
                                  <option value={3}>Option D</option>
                                </select>
                              </div>
                            </div>
                            <input 
                              type="text" 
                              value={q.question} 
                              onChange={(e) => {
                                const updated = [...theoryQuestions];
                                updated[qIdx].question = e.target.value;
                                setTheoryQuestions(updated);
                              }}
                              placeholder={`Enter question ${qIdx + 1} text...`}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-primary"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {['A', 'B', 'C', 'D'].map((label, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                  <span className="text-xs font-bold text-gray-500 w-5 text-center">{label}</span>
                                  <input 
                                    type="text" 
                                    value={q.options[optIdx] || ''} 
                                    onChange={(e) => {
                                      const updated = [...theoryQuestions];
                                      const newOpts = [...updated[qIdx].options];
                                      newOpts[optIdx] = e.target.value;
                                      updated[qIdx].options = newOpts;
                                      setTheoryQuestions(updated);
                                    }}
                                    placeholder={`Option ${label}`}
                                    className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:border-primary"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit"
                    className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-sm"
                  >
                    Publish Weekly Exam
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Mentor Filters */}
      {isMentor && exams.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input 
            type="text" 
            placeholder="Search by Exam Title (e.g. CIE1)..." 
            value={filterExam}
            onChange={(e) => setFilterExam(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-sm flex-1"
          />
          <select 
            value={filterBatch} 
            onChange={(e) => setFilterBatch(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-sm flex-1 md:flex-none md:w-64"
          >
            <option value="All">All Batches</option>
            <option value="Morning">Morning Batch</option>
            <option value="Evening">Evening Batch</option>
            {projectBatches.map(b => (
              <option key={b.id} value={b.batchNumber}>{b.batchNumber}</option>
            ))}
          </select>
        </div>
      )}

      {/* List Exams */}
      <div className="grid grid-cols-1 gap-4">
        {exams.filter(exam => {
          if (isMentor) {
            // Mentor filter logic
            if (filterExam.trim() && !exam.title.toLowerCase().includes(filterExam.toLowerCase()) && !exam.id.toLowerCase().includes(filterExam.toLowerCase())) {
              return false;
            }
            if (filterBatch !== 'All') {
              if (!exam.targetBatch) return false;
              if (exam.targetBatch !== filterBatch && exam.targetBatch !== 'All Batches') {
                 if (!exam.targetBatch.includes(filterBatch) && !filterBatch.includes(exam.targetBatch)) return false;
              }
            }
            return true;
          }
          if (!exam.targetBatch || exam.targetBatch === 'All Batches') return true;
          
          const studentBatch = (studentDetails?.batch || 'Morning').toLowerCase();
          const targetBatchClean = exam.targetBatch.toLowerCase().replace(' batch', '').trim();
          const studentBatchClean = studentBatch.replace(' batch', '').trim();

          if (targetBatchClean === 'morning' || targetBatchClean === 'evening') {
            return studentBatchClean === targetBatchClean;
          }
          
          // Check if targetBatch is a project batch number
          const targetProjectBatch = projectBatches.find(b => b.batchNumber.toLowerCase() === exam.targetBatch.toLowerCase());
          if (targetProjectBatch) {
            return targetProjectBatch.memberEmails.includes(loggedInEmail);
          }
          
          return false;
        }).map((exam) => (
          <div key={exam.id} className="bg-white border-l-4 border-l-orange-500 border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-bold text-xl text-gray-900">{exam.title}</h3>
                {isMentor && exam.targetBatch && exam.targetBatch !== 'All Batches' && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">{exam.targetBatch}</span>
                )}
              </div>
              {exam.theoryPdfName && exam.theoryPdfName !== 'theory_assignment.pdf' && (
                <div className="flex items-center gap-2 mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100 w-max">
                  <FileText size={16} className="text-primary" />
                  <span className="text-sm font-medium text-gray-700">{exam.theoryPdfName}</span>
                  <button onClick={() => handleOpenPdf(exam.theoryPdfDataUrl, exam.theoryPdfName)} className="text-sm text-blue-600 hover:underline font-bold ml-2">View File</button>
                </div>
              )}
            </div>
            
            <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {isMentor ? (
                <>
                  <button 
                    onClick={() => setEvaluatingExamId(exam.id)}
                    className="px-6 py-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-xl font-bold text-sm transition-colors text-center"
                  >
                    Evaluate Submissions
                  </button>
                  <button 
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to remove this exam? This will also permanently delete all student submissions and marks for this exam.")) {
                        const newExams = exams.filter(e => e.id !== exam.id);
                        setExams(newExams);
                        await saveToCloudflare('anuragLmsWeeklyExams', newExams);
                        
                        // Delete related data for all students to prevent old marks from reappearing
                        const cloudStudents = await getFromCloudflare('registeredStudents');
                        const studentsList = cloudStudents ? cloudStudents as any[] : JSON.parse(localStorage.getItem('registeredStudents') || '[]');
                        
                        const promises: Promise<any>[] = [];
                        
                        for (const student of studentsList) {
                          if (!student || !student.email) continue;
                          const email = student.email;
                          
                          // 1. Delete marks report
                          const reportKey = `weeklyReport_${email}_${exam.id}`;
                          localStorage.removeItem(reportKey);
                          promises.push(saveToCloudflare(reportKey, null));
                          
                          // 2. Delete draft
                          const draftKey = `weeklyReportDraft_${email}_${exam.id}`;
                          localStorage.removeItem(draftKey);
                          
                          // 3. Delete raw submission
                          const rawSubKey = `weeklyReportSubmission_${email}_${exam.id}`;
                          localStorage.removeItem(rawSubKey);
                          promises.push(saveToCloudflare(rawSubKey, null));
                          
                          // 4. Delete from student's submission record list
                          const subRecordKey = `weeklyExamSubmissions_${email}`;
                          const localSub = JSON.parse(localStorage.getItem(subRecordKey) || '{}');
                          if (localSub[exam.id]) {
                            delete localSub[exam.id];
                            localStorage.setItem(subRecordKey, JSON.stringify(localSub));
                          }
                          promises.push(
                            getFromCloudflare(subRecordKey).then((cloudSub: any) => {
                              const sub = cloudSub || localSub;
                              if (sub && sub[exam.id]) {
                                delete sub[exam.id];
                                return saveToCloudflare(subRecordKey, sub);
                              }
                            })
                          );
                        }
                        
                        await Promise.all(promises);
                      }
                    }}
                    className="px-4 py-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl font-medium text-sm transition-colors text-center"
                  >
                    Remove
                  </button>
                </>
              ) : (
                submissions[exam.id] ? (
                  <div className="flex items-center justify-center gap-2 px-6 py-2.5 bg-green-50 text-green-700 font-bold rounded-xl border border-green-100 shadow-sm">
                    <CheckCircle2 size={18} /> Submitted
                  </div>
                ) : (
                  <button 
                    onClick={() => setTakingExamId(exam.id)}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
                  >
                    <PlayCircle size={18} /> Start Exam
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
