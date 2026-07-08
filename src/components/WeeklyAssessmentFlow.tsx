import React, { useState, useEffect } from 'react';
import { Plus, X, Upload, Link as LinkIcon, FileText, CheckCircle2, Award, PlayCircle } from 'lucide-react';
import { WeeklyExamReport } from './WeeklyExamReport';

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
  theoryQuestions: TheoryQuestion[];
  targetBatch?: string;
}

interface WeeklyExamSubmission {
  projectUrl: string;
  projectPdfName: string;
  portfolioPdfName: string;
  theoryAnswers: number[];
  submittedAt: string;
}

interface Props {
  isMentor: boolean;
  loggedInEmail: string;
}

export const WeeklyAssessmentFlow: React.FC<Props> = ({ isMentor, loggedInEmail }) => {
  const [exams, setExams] = useState<WeeklyExamData[]>([]);
  const [isAdding, setIsAdding] = useState<false | 'weekly' | 'cie'>(false);
  
  // Mentor form state
  const [selectedWeek, setSelectedWeek] = useState('week1');
  const [projectTitle, setProjectTitle] = useState('');
  const [portfolioTopic, setPortfolioTopic] = useState('');
  const [theoryPdfName, setTheoryPdfName] = useState('theory_assignment.pdf');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [theoryQuestions, setTheoryQuestions] = useState<TheoryQuestion[]>(
    Array.from({ length: 10 }, () => ({ question: '', options: ['', '', '', ''], answerIndex: 0 }))
  );

  // Student form state
  const [takingExamId, setTakingExamId] = useState<string | null>(null);
  const [studentProjectUrl, setStudentProjectUrl] = useState('');
  const [studentProjectPdf, setStudentProjectPdf] = useState('');
  const [studentPortfolioPdf, setStudentPortfolioPdf] = useState('');
  const [studentTheoryAnswers, setStudentTheoryAnswers] = useState<number[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, WeeklyExamSubmission>>({});
  const [evaluatingExamId, setEvaluatingExamId] = useState<string | null>(null);

  const [targetBatch, setTargetBatch] = useState('All Batches');
  const [projectBatches, setProjectBatches] = useState<{id: string, batchNumber: string, memberEmails: string[]}[]>([]);
  const [studentDetails, setStudentDetails] = useState<any>(null);

  useEffect(() => {
    // Load created exams
    const savedExams = localStorage.getItem('anuragLmsWeeklyExams');
    if (savedExams) {
      setExams(JSON.parse(savedExams));
    }

    // Load Project Batches
    const savedBatches = localStorage.getItem('anuragLmsProjectBatchData');
    if (savedBatches) {
      setProjectBatches(JSON.parse(savedBatches));
    }
    
    // Load student submissions & details
    if (!isMentor) {
      const savedSubmissions = localStorage.getItem(`weeklyExamSubmissions_${loggedInEmail}`);
      if (savedSubmissions) {
        setSubmissions(JSON.parse(savedSubmissions));
      }
      
      const students = JSON.parse(localStorage.getItem('registeredStudents') || '[]');
      const me = students.find((s: any) => s.email === loggedInEmail);
      setStudentDetails(me);
    }
  }, [isMentor, loggedInEmail]);

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();

    const newExam: WeeklyExamData = {
      id: selectedWeek,
      title: `${selectedWeek.toUpperCase()} Exam`,
      projectTitle,
      portfolioTopic,
      theoryPdfName,
      theoryQuestions,
      targetBatch
    };

    const updatedExams = [...exams.filter(ex => ex.id !== selectedWeek), newExam];
    setExams(updatedExams);
    localStorage.setItem('anuragLmsWeeklyExams', JSON.stringify(updatedExams));
    
    setIsAdding(false);
    // Reset
    setProjectTitle('');
    setPortfolioTopic('');
    setTheoryQuestions(Array.from({ length: 10 }, () => ({ question: '', options: ['', '', '', ''], answerIndex: 0 })));
    setQuestionCount(10);
    setTargetBatch('All Batches');
  };

  const handleStudentSubmit = () => {
    if (!takingExamId) return;
    const exam = exams.find(e => e.id === takingExamId);
    if (!exam) return;

    if (exam.projectTitle && !studentProjectUrl && !studentProjectPdf) {
      alert("Please provide a project URL or PDF");
      return;
    }

    const validQuestionIndices = exam.theoryQuestions
      .map((q, idx) => q.question ? idx : -1)
      .filter(idx => idx !== -1);
      
    if (validQuestionIndices.some(idx => studentTheoryAnswers[idx] === undefined || studentTheoryAnswers[idx] === -1)) {
      alert("Please answer all objective questions");
      return;
    }

    const submission: WeeklyExamSubmission = {
      projectUrl: studentProjectUrl,
      projectPdfName: studentProjectPdf || 'project_file.pdf',
      portfolioPdfName: studentPortfolioPdf || 'portfolio_file.pdf',
      theoryAnswers: studentTheoryAnswers,
      submittedAt: new Date().toISOString()
    };

    const newSubmissions = { ...submissions, [takingExamId]: submission };
    setSubmissions(newSubmissions);
    localStorage.setItem(`weeklyExamSubmissions_${loggedInEmail}`, JSON.stringify(newSubmissions));
    
    // Also save a raw version for the mentor to read in Exam Reports
    localStorage.setItem(`weeklyReportSubmission_${loggedInEmail}_${takingExamId}`, JSON.stringify(submission));

    setTakingExamId(null);
    setStudentProjectUrl('');
    setStudentProjectPdf('');
    setStudentPortfolioPdf('');
    setStudentTheoryAnswers([]);
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
                    <input type="file" className="hidden" onChange={(e) => setStudentProjectPdf(e.target.files?.[0]?.name || '')} />
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
                  <input type="file" className="hidden" onChange={(e) => setStudentPortfolioPdf(e.target.files?.[0]?.name || '')} />
                </label>
                {studentPortfolioPdf && <span className="text-sm text-primary font-medium">{studentPortfolioPdf}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Theory Section */}
        {exam.theoryQuestions.some(q => q.question) && (
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-4">
            <h3 className="font-bold text-lg text-gray-900 border-b border-gray-200 pb-2">{exam.portfolioTopic ? '3' : '2'}. Theory Assignment</h3>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 w-max">
              <FileText size={20} className="text-red-500" />
              <span className="text-sm font-medium text-gray-700">{exam.theoryPdfName}</span>
              <button className="text-sm text-primary font-bold ml-2">Download</button>
            </div>

          <div className="pt-4 space-y-6">
            {exam.theoryQuestions.map((q, originalIndex) => {
              if (!q.question) return null;
              return (
                <div key={originalIndex} className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm">
                  <p className="font-bold text-gray-900 mb-4">{originalIndex + 1}. {q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, idx) => (
                      <label key={idx} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${studentTheoryAnswers[originalIndex] === idx ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                        <input 
                          type="radio" 
                          name={`theory_answer_${originalIndex}`} 
                          checked={studentTheoryAnswers[originalIndex] === idx}
                          onChange={() => {
                            const newAns = [...studentTheoryAnswers];
                            newAns[originalIndex] = idx;
                            setStudentTheoryAnswers(newAns);
                          }}
                          className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
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
                        <input type="file" className="hidden" onChange={(e) => setTheoryPdfName(e.target.files?.[0]?.name || 'theory_assignment.pdf')} />
                      </label>
                      <span className="text-sm text-primary font-medium">{theoryPdfName}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Objective Questions</label>
                    <select 
                      value={questionCount}
                      onChange={(e) => {
                        const count = parseInt(e.target.value);
                        setQuestionCount(count);
                        setTheoryQuestions(Array.from({ length: count }, () => ({ question: '', options: ['', '', '', ''], answerIndex: 0 })));
                      }}
                      className="w-full md:w-48 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-primary"
                    >
                      <option value={2}>2 Questions</option>
                      <option value={10}>10 Questions</option>
                      <option value={15}>15 Questions</option>
                      <option value={20}>20 Questions</option>
                    </select>
                  </div>

                  <div className="space-y-6">
                    {theoryQuestions.map((q, qIndex) => (
                      <div key={qIndex} className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm relative">
                        <span className="absolute -top-3 -left-3 w-8 h-8 bg-gray-900 text-white flex items-center justify-center rounded-full font-bold text-sm shadow-sm">{qIndex + 1}</span>
                        <label className="block text-sm font-medium text-gray-700 mb-2 mt-2">Objective Question</label>
                        <input 
                          type="text" 
                          value={q.question} 
                          onChange={(e) => {
                            const newQs = [...theoryQuestions];
                            newQs[qIndex].question = e.target.value;
                            setTheoryQuestions(newQs);
                          }}
                          placeholder="Enter the question here..."
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary mb-4"
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input 
                                type="radio" 
                                name={`correct_answer_${qIndex}`} 
                                checked={q.answerIndex === idx}
                                onChange={() => {
                                  const newQs = [...theoryQuestions];
                                  newQs[qIndex].answerIndex = idx;
                                  setTheoryQuestions(newQs);
                                }}
                                className="text-primary focus:ring-primary w-4 h-4 shrink-0 cursor-pointer"
                                title="Mark as correct answer"
                              />
                              <input 
                                type="text" 
                                value={opt} 
                                onChange={(e) => {
                                  const newQs = [...theoryQuestions];
                                  newQs[qIndex].options[idx] = e.target.value;
                                  setTheoryQuestions(newQs);
                                }}
                                placeholder={`Option ${idx + 1}`}
                                className={`w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none ${q.answerIndex === idx ? 'border-primary bg-primary/5 font-medium' : 'border-gray-200'}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
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

      {/* List Exams */}
      <div className="grid grid-cols-1 gap-4">
        {exams.filter(exam => {
          if (isMentor) return true;
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
                    onClick={() => {
                      const newExams = exams.filter(e => e.id !== exam.id);
                      setExams(newExams);
                      localStorage.setItem('anuragLmsWeeklyExams', JSON.stringify(newExams));
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
