import React, { useState, useEffect } from 'react';
import { Plus, X, Upload, Link as LinkIcon, FileText, CheckCircle2, Award, PlayCircle } from 'lucide-react';
import { WeeklyExamReport } from './WeeklyExamReport';

interface WeeklyExamData {
  id: string; // e.g., 'week1'
  title: string; // e.g., 'Week 1 Exam'
  projectTitle: string;
  portfolioTopic: string;
  theoryPdfName: string;
  theoryQuestion: string;
  theoryOptions: string[];
  theoryAnswerIndex: number;
}

interface WeeklyExamSubmission {
  projectUrl: string;
  projectPdfName: string;
  portfolioPdfName: string;
  theoryAnswerIndex: number;
  submittedAt: string;
}

interface Props {
  isMentor: boolean;
  loggedInEmail: string;
}

export const WeeklyAssessmentFlow: React.FC<Props> = ({ isMentor, loggedInEmail }) => {
  const [exams, setExams] = useState<WeeklyExamData[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Mentor form state
  const [selectedWeek, setSelectedWeek] = useState('week1');
  const [projectTitle, setProjectTitle] = useState('');
  const [portfolioTopic, setPortfolioTopic] = useState('');
  const [theoryPdfName, setTheoryPdfName] = useState('theory_assignment.pdf');
  const [theoryQuestion, setTheoryQuestion] = useState('');
  const [theoryOptions, setTheoryOptions] = useState(['', '', '', '']);
  const [theoryAnswerIndex, setTheoryAnswerIndex] = useState(0);

  // Student form state
  const [takingExamId, setTakingExamId] = useState<string | null>(null);
  const [studentProjectUrl, setStudentProjectUrl] = useState('');
  const [studentProjectPdf, setStudentProjectPdf] = useState('');
  const [studentPortfolioPdf, setStudentPortfolioPdf] = useState('');
  const [studentTheoryAnswer, setStudentTheoryAnswer] = useState<number>(-1);
  const [submissions, setSubmissions] = useState<Record<string, WeeklyExamSubmission>>({});
  const [evaluatingExamId, setEvaluatingExamId] = useState<string | null>(null);

  useEffect(() => {
    // Load created exams
    const savedExams = localStorage.getItem('anuragLmsWeeklyExams');
    if (savedExams) {
      setExams(JSON.parse(savedExams));
    }
    
    // Load student submissions
    if (!isMentor) {
      const savedSubmissions = localStorage.getItem(`weeklyExamSubmissions_${loggedInEmail}`);
      if (savedSubmissions) {
        setSubmissions(JSON.parse(savedSubmissions));
      }
    }
  }, [isMentor, loggedInEmail]);

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle || !portfolioTopic || !theoryQuestion || theoryOptions.some(o => !o)) {
      alert("Please fill all fields");
      return;
    }

    const newExam: WeeklyExamData = {
      id: selectedWeek,
      title: `${selectedWeek.toUpperCase()} Exam`,
      projectTitle,
      portfolioTopic,
      theoryPdfName,
      theoryQuestion,
      theoryOptions,
      theoryAnswerIndex
    };

    const updatedExams = [...exams.filter(ex => ex.id !== selectedWeek), newExam];
    setExams(updatedExams);
    localStorage.setItem('anuragLmsWeeklyExams', JSON.stringify(updatedExams));
    
    setIsAdding(false);
    // Reset
    setProjectTitle('');
    setPortfolioTopic('');
    setTheoryQuestion('');
    setTheoryOptions(['', '', '', '']);
    setTheoryAnswerIndex(0);
  };

  const handleStudentSubmit = () => {
    if (!takingExamId) return;
    if (!studentProjectUrl && !studentProjectPdf) {
      alert("Please provide a project URL or PDF");
      return;
    }
    if (studentTheoryAnswer === -1) {
      alert("Please answer the theory question");
      return;
    }

    const submission: WeeklyExamSubmission = {
      projectUrl: studentProjectUrl,
      projectPdfName: studentProjectPdf || 'project_file.pdf',
      portfolioPdfName: studentPortfolioPdf || 'portfolio_file.pdf',
      theoryAnswerIndex: studentTheoryAnswer,
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
    setStudentTheoryAnswer(-1);
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

        {/* Portfolio Section */}
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

        {/* Theory Section */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-4">
          <h3 className="font-bold text-lg text-gray-900 border-b border-gray-200 pb-2">3. Theory Assignment</h3>
          
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 w-max">
            <FileText size={20} className="text-red-500" />
            <span className="text-sm font-medium text-gray-700">{exam.theoryPdfName}</span>
            <button className="text-sm text-primary font-bold ml-2">Download</button>
          </div>

          <div className="pt-4">
            <p className="font-bold text-gray-900 mb-4">{exam.theoryQuestion}</p>
            <div className="space-y-2">
              {exam.theoryOptions.map((opt, idx) => (
                <label key={idx} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${studentTheoryAnswer === idx ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 hover:bg-white text-gray-700'}`}>
                  <input 
                    type="radio" 
                    name="theory_answer" 
                    checked={studentTheoryAnswer === idx}
                    onChange={() => setStudentTheoryAnswer(idx)}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

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
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-primary text-primary font-bold rounded-xl shadow-sm hover:bg-primary/5 transition-colors"
            >
              <Plus size={20} /> Add Weekly Exam Paper
            </button>
          ) : (
            <div className="bg-white border-2 border-primary/20 p-6 rounded-2xl shadow-sm relative">
              <button 
                onClick={() => setIsAdding(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-full"
              >
                <X size={18} />
              </button>
              
              <h3 className="text-xl font-bold text-gray-900 mb-6">Configure Weekly Exam</h3>
              
              <form onSubmit={handleAddExam} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Select Week</label>
                  <select 
                    value={selectedWeek} 
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    className="w-full md:w-64 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-sm font-medium"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={`week${i + 1}`}>Week {i + 1}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <h4 className="font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">1. Project</h4>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Title / Description</label>
                  <input 
                    type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g. Build a Responsive E-commerce Layout"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">Students will be prompted to submit a URL and PDFs.</p>
                </div>

                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <h4 className="font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">2. Portfolio & Document</h4>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio Topic</label>
                  <input 
                    type="text" value={portfolioTopic} onChange={(e) => setPortfolioTopic(e.target.value)}
                    placeholder="e.g. Wireframing & UX Design Doc"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">Students will be prompted to upload PDFs.</p>
                </div>

                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <h4 className="font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">3. Theory Assignment</h4>
                  
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

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Objective Question</label>
                    <input 
                      type="text" value={theoryQuestion} onChange={(e) => setTheoryQuestion(e.target.value)}
                      placeholder="Enter the question here..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                      required
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {theoryOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input 
                            type="radio" name="correct_answer" 
                            checked={theoryAnswerIndex === idx}
                            onChange={() => setTheoryAnswerIndex(idx)}
                            className="text-primary focus:ring-primary w-4 h-4"
                            title="Mark as correct answer"
                          />
                          <input 
                            type="text" value={opt} 
                            onChange={(e) => {
                              const newOpts = [...theoryOptions];
                              newOpts[idx] = e.target.value;
                              setTheoryOptions(newOpts);
                            }}
                            placeholder={`Option ${idx + 1}`}
                            className={`w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none ${theoryAnswerIndex === idx ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                            required
                          />
                        </div>
                      ))}
                    </div>
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
        {exams.map((exam) => (
          <div key={exam.id} className="bg-white border-l-4 border-l-orange-500 border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-bold text-xl text-gray-900">{exam.title}</h3>
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded">Weekly Core</span>
              </div>
              <p className="text-gray-500 text-sm">Project: {exam.projectTitle}</p>
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
