import React, { useState, useEffect } from 'react';
import { Plus, X, Upload, Link as LinkIcon, FileText, CheckCircle2, Award, PlayCircle } from 'lucide-react';
import { WeeklyExamReport } from './WeeklyExamReport';
import { getFromCloudflare, saveToCloudflare } from '../utils/cloudflare';

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
  const [theoryPdfName, setTheoryPdfName] = useState('theory_assignment.pdf');
  const [theoryPdfDataUrl, setTheoryPdfDataUrl] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [theoryQuestions, setTheoryQuestions] = useState<TheoryQuestion[]>(
    Array.from({ length: 10 }, () => ({ question: '', options: ['', '', '', ''], answerIndex: 0 }))
  );

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
      // Load created exams
      const cloudExams = await getFromCloudflare('anuragLmsWeeklyExams');
      if (cloudExams && Array.isArray(cloudExams)) {
        setExams(cloudExams);
      } else {
        const savedExams = localStorage.getItem('anuragLmsWeeklyExams');
        if (savedExams) setExams(JSON.parse(savedExams));
      }

      // Load Project Batches
      const cloudBatches = await getFromCloudflare('anuragLmsProjectBatchData');
      if (cloudBatches) {
        setProjectBatches(cloudBatches as any);
      } else {
        const savedBatches = localStorage.getItem('anuragLmsProjectBatchData');
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
        
        const cloudStudents = await getFromCloudflare('registeredStudents');
        const students = cloudStudents ? cloudStudents as any[] : JSON.parse(localStorage.getItem('registeredStudents') || '[]');
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
      theoryPdfName,
      theoryPdfDataUrl,
      theoryQuestions,
      targetBatch
    };

    const updatedExams = [...exams.filter(ex => ex.id !== examId), newExam];
    setExams(updatedExams);
    localStorage.setItem('anuragLmsWeeklyExams', JSON.stringify(updatedExams));
    await saveToCloudflare('anuragLmsWeeklyExams', updatedExams);
    
    setIsAdding(false);
    // Reset
    setProjectTitle('');
    setPortfolioTopic('');
    setTheoryPdfName('theory_assignment.pdf');
    setTheoryPdfDataUrl('');
    setTheoryQuestions(Array.from({ length: 10 }, () => ({ question: '', options: ['', '', '', ''], answerIndex: 0 })));
    setQuestionCount(10);
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

        {/* Theory Section */}
        {exam.theoryPdfName && (
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
        )}

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

                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <h4 className="font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">{isAdding === 'weekly' ? '3' : '2'}. Theory Assignment</h4>
                  
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
          if (!studentDetails) return false;
          
          if (exam.targetBatch === 'Morning' || exam.targetBatch === 'Evening') {
            return studentDetails.batch === exam.targetBatch;
          }
          
          // Check if targetBatch is a project batch number
          const targetProjectBatch = projectBatches.find(b => b.batchNumber === exam.targetBatch);
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
