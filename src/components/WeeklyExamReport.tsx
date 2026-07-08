import React, { useState, useEffect } from 'react';
import { Search, FileText, ArrowLeft, Send, CheckCircle2, Edit } from 'lucide-react';
import { getFromCloudflare, saveToCloudflare } from '../utils/cloudflare';

interface Student {
  id: number;
  name: string;
  email: string;
}

interface Marks {
  project: number;
  portfolio: number;
  theory: number;
  attendance: number;
  mentor: number;
}

interface WeeklyExamReportProps {
  pattern: string;
  isMentor: boolean;
  loggedInEmail: string;
  onBack?: () => void;
}

export const WeeklyExamReport: React.FC<WeeklyExamReportProps> = ({ pattern, isMentor, loggedInEmail, onBack }) => {
  const isCie = pattern.startsWith('CIE');
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSent, setIsSent] = useState(false);
  
  const [marks, setMarks] = useState<Marks>({
    project: 0,
    portfolio: 0,
    theory: 0,
    attendance: 0,
    mentor: 0
  });

  const [studentReport, setStudentReport] = useState<Marks | null>(null);
  const [studentSubmission, setStudentSubmission] = useState<any>(null);
  const [targetExam, setTargetExam] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [projectEvalInput, setProjectEvalInput] = useState<string>('');
  const [portfolioEvalInput, setPortfolioEvalInput] = useState<string>('');
  const [attendanceEvalInput, setAttendanceEvalInput] = useState<string>('');
  const [mentorEvalInput, setMentorEvalInput] = useState<string>('');

  // Load the target exam to evaluate objective questions
  useEffect(() => {
    const savedExams = JSON.parse(localStorage.getItem('anuragLmsWeeklyExams') || '[]');
    const exam = savedExams.find((e: any) => e.id === pattern);
    setTargetExam(exam);
  }, [pattern]);

  // Load students for mentor
  useEffect(() => {
    if (isMentor) {
      const loadStudents = async () => {
        const cloudStudents = await getFromCloudflare('registeredStudents') || [];
        const localStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]');
        
        const allStudentsMap = new Map();
        [...localStudents, ...cloudStudents].forEach(s => {
          if (s && s.email) allStudentsMap.set(s.email, s);
        });
        
        setStudents(Array.from(allStudentsMap.values()));
      };
      loadStudents();
    }
  }, [isMentor]);

  // Load specific report for student
  useEffect(() => {
    if (!isMentor) {
      const loadReport = async () => {
        const key = `weeklyReport_${loggedInEmail}_${pattern}`;
        const cloudReport = await getFromCloudflare(key);
        const localReport = JSON.parse(localStorage.getItem(key) || 'null');
        
        if (cloudReport) {
          setStudentReport(cloudReport);
        } else if (localReport) {
          setStudentReport(localReport);
        } else {
          setStudentReport(null);
        }
      };
      loadReport();
    }
  }, [isMentor, loggedInEmail, pattern]);

  // When mentor selects a student, try to load existing marks or drafts
  useEffect(() => {
    if (isMentor && selectedStudent) {
      setIsSent(false);
      setIsLoaded(false);
      const loadReport = async () => {
        const key = `weeklyReport_${selectedStudent.email}_${pattern}`;
        const draftKey = `weeklyReportDraft_${selectedStudent.email}_${pattern}`;
        
        const localReport = JSON.parse(localStorage.getItem(key) || 'null');
        const draftReport = JSON.parse(localStorage.getItem(draftKey) || 'null');
        
        let loadedMarks = { project: 0, portfolio: 0, theory: 0, attendance: 0, mentor: 0 };
        
        if (draftReport) {
          loadedMarks = draftReport;
        } else {
           const cloudReport = await getFromCloudflare(key);
           if (cloudReport) {
             loadedMarks = cloudReport;
           } else if (localReport) {
             loadedMarks = localReport;
           }
        }
        
        if (pattern.startsWith('CIE')) {
          const targetWeeks = pattern === 'CIE1' 
            ? ['week1', 'week2', 'week3', 'week4', 'week5', 'week6'] 
            : ['week6', 'week7', 'week8', 'week9', 'week10'];
            
          let sum = 0;
          let count = targetWeeks.length;
          
          const fetchPromises = targetWeeks.map(async (week) => {
            const weekKey = `weeklyReport_${selectedStudent.email}_${week}`;
            const weekLocal = JSON.parse(localStorage.getItem(weekKey) || 'null');
            if (weekLocal) return weekLocal;
            
            const cloudReport = await getFromCloudflare(weekKey);
            return cloudReport;
          });
          
          const weekReports = await Promise.all(fetchPromises);
          
          for (const weekReport of weekReports) {
            if (weekReport) {
              const weekTotal = Number(weekReport.project || 0) + Number(weekReport.portfolio || 0) + Number(weekReport.theory || 0) + Number(weekReport.attendance || 0) + Number(weekReport.mentor || 0);
              sum += weekTotal;
            }
          }
          
          const average = Math.round(sum / count);
          loadedMarks.attendance = average;
        }
        
        setMarks(loadedMarks);

        const submissionKey = `weeklyReportSubmission_${selectedStudent.email}_${pattern}`;
        const submissionData = JSON.parse(localStorage.getItem(submissionKey) || 'null');
        setStudentSubmission(submissionData);
        
        // reset inline inputs based on marks loaded
        setProjectEvalInput('');
        setPortfolioEvalInput('');
        setAttendanceEvalInput(pattern.startsWith('CIE') ? String(loadedMarks.attendance) : '');
        setMentorEvalInput('');
        
        setIsLoaded(true);
      };
      loadReport();
    } else {
      setIsLoaded(false);
    }
  }, [isMentor, selectedStudent, pattern]);

  // Auto-save draft when marks change
  useEffect(() => {
    if (isMentor && selectedStudent && !isSent && isLoaded) {
      const draftKey = `weeklyReportDraft_${selectedStudent.email}_${pattern}`;
      localStorage.setItem(draftKey, JSON.stringify(marks));
    }
  }, [marks, isMentor, selectedStudent, pattern, isSent, isLoaded]);

  const handleSendReport = async () => {
    if (!selectedStudent) return;
    
    const key = `weeklyReport_${selectedStudent.email}_${pattern}`;
    
    // Save locally
    localStorage.setItem(key, JSON.stringify(marks));
    
    // Save to Cloudflare
    await saveToCloudflare(key, marks);
    
    setIsSent(true);
    setTimeout(() => {
      setSelectedStudent(null);
    }, 2000);
  };

  if (!isMentor) {
    // Student View
    return (
      <div className="w-full max-w-3xl mx-auto space-y-6 pb-12">
        <div className="flex items-center gap-3 text-gray-900 font-bold text-2xl mb-8">
          <FileText className="text-orange-500" size={28} /> 
          {pattern} Report
        </div>
        
        {studentReport ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="space-y-4 text-lg">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="font-medium text-gray-700">Project</span>
                <span className="font-bold text-primary">{studentReport.project} / {isCie ? 15 : 5}</span>
              </div>
              {!isCie && (
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="font-medium text-gray-700">Portfolio & Document</span>
                  <span className="font-bold text-primary">{studentReport.portfolio} / 5</span>
                </div>
              )}
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="font-medium text-gray-700">Theory Assignment</span>
                <span className="font-bold text-primary">{studentReport.theory} / {isCie ? 10 : 5}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="font-medium text-gray-700">{isCie ? 'Viva' : 'Mentor'}</span>
                <span className="font-bold text-primary">{studentReport.mentor} / {isCie ? 5 : 3}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="font-medium text-gray-700">{isCie ? '6 weeks Average' : 'Attendance'}</span>
                <span className="font-bold text-primary">{studentReport.attendance} / {isCie ? 20 : 2}</span>
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="font-black text-gray-900 text-xl">Total Score</span>
                <span className="font-black text-primary text-2xl">
                  {Number(studentReport.project) + (isCie ? 0 : Number(studentReport.portfolio)) + Number(studentReport.theory) + Number(studentReport.attendance) + Number(studentReport.mentor)} / {isCie ? 50 : 20}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-sm text-center">
            <FileText className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Report Available</h3>
            <p className="text-gray-500">Your mentor has not submitted the grading for this week yet.</p>
          </div>
        )}
      </div>
    );
  }

  // Mentor View
  const filteredStudents = students.filter(student => {
    // 1. Search filter
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Batch filter
    let matchesBatch = true;
    if (targetExam && targetExam.targetBatch && targetExam.targetBatch !== 'All Batches') {
      // Extract the core batch name to handle 'Morning', 'Evening', or custom names
      const examBatch = targetExam.targetBatch.trim();
      const studentBatch = student.batch?.trim() || '';
      
      // We do a direct string match since the mentor assigned the batch name 
      matchesBatch = studentBatch.includes(examBatch) || examBatch.includes(studentBatch);
      
      // Fallback: If student has no batch, they don't match specific batch targeting
      if (!student.batch || student.batch === 'Unassigned') {
        matchesBatch = false;
      }
    }

    return matchesSearch && matchesBatch;
  });

  // Calculate stats for the dashboard
  const stats = { completed: 0, pending: 0, notSubmitted: 0, total: filteredStudents.length };
  
  if (isMentor && !selectedStudent) {
    filteredStudents.forEach(student => {
      const isCompleted = localStorage.getItem(`weeklyReport_${student.email}_${pattern}`) !== null;
      const hasSubmitted = localStorage.getItem(`weeklyReportSubmission_${student.email}_${pattern}`) !== null;
      
      if (isCompleted) {
        stats.completed++;
      } else if (hasSubmitted) {
        stats.pending++;
      } else {
        stats.notSubmitted++;
      }
    });
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
      {onBack && !selectedStudent && (
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium mb-2"
        >
          <ArrowLeft size={20} /> Back to Exams List
        </button>
      )}
      <div className="flex items-center gap-3 text-gray-900 font-bold text-2xl mb-6">
        <FileText className="text-orange-500" size={28} /> 
        {pattern} Evaluation
      </div>

      {!selectedStudent && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Target</span>
            <span className="text-2xl font-black text-gray-900">{stats.total}</span>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm flex flex-col items-center justify-center">
            <span className="text-xs text-green-700 font-bold uppercase tracking-wider mb-1">Completed</span>
            <span className="text-2xl font-black text-green-700">{stats.completed}</span>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 shadow-sm flex flex-col items-center justify-center">
            <span className="text-xs text-orange-700 font-bold uppercase tracking-wider mb-1">Pending Grade</span>
            <span className="text-2xl font-black text-orange-700">{stats.pending}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Not Submitted</span>
            <span className="text-2xl font-black text-gray-500">{stats.notSubmitted}</span>
          </div>
        </div>
      )}

      {!selectedStudent ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-lg text-gray-900">Select Student to Grade</h3>
            <div className="relative w-full sm:w-72 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search students..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredStudents.length > 0 ? (
              filteredStudents.map(student => {
                const isCompleted = localStorage.getItem(`weeklyReport_${student.email}_${pattern}`) !== null;
                const hasSubmitted = localStorage.getItem(`weeklyReportSubmission_${student.email}_${pattern}`) !== null;
                
                return (
                  <div 
                    key={student.id} 
                    className="p-4 hover:bg-gray-50 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{student.name}</h4>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!hasSubmitted ? (
                        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                          Not Submitted
                        </div>
                      ) : isCompleted ? (
                        <>
                          <div className="flex items-center gap-1.5 text-sm font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                            <CheckCircle2 size={16} /> Completed
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudent(student);
                            }}
                            className="flex items-center gap-1.5 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit size={16} /> Edit
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(student);
                          }}
                          className="flex items-center gap-1.5 text-sm font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-6 py-1.5 rounded-lg transition-all cursor-pointer border border-orange-200"
                        >
                          Pending
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-gray-500">
                No students found matching your search.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm relative">
          <button 
            onClick={() => setSelectedStudent(null)}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft size={16} /> Back to List
          </button>
          
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900">Grading: {selectedStudent.name}</h3>
            <p className="text-gray-500">{selectedStudent.email}</p>
          </div>

          {studentSubmission ? (
            <div className="mb-8 p-6 bg-blue-50 border border-blue-100 rounded-xl space-y-4">
              <h4 className="font-bold text-blue-900 border-b border-blue-200 pb-2">Student Submission Details</h4>
              
              {/* Project line */}
              <div className="flex items-center flex-wrap gap-4 justify-between border-b border-blue-100/50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-blue-800">Project: </span>
                  {studentSubmission.projectUrl ? (
                    <a href={studentSubmission.projectUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">URL</a>
                  ) : (
                    <span className="text-sm text-gray-500">No URL</span>
                  )}
                  <span className="text-sm text-gray-400">|</span>
                  {studentSubmission.projectPdfName ? (
                    <span className="text-sm text-blue-600">{studentSubmission.projectPdfName}</span>
                  ) : (
                    <span className="text-sm text-gray-500">No PDF</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" min="0" max={isCie ? "15" : "5"} placeholder="Marks" 
                    value={projectEvalInput} 
                    onChange={e => setProjectEvalInput(e.target.value)} 
                    className="w-16 px-2 py-1 text-sm border border-blue-200 rounded focus:outline-none focus:border-blue-400" 
                  />
                  <button 
                    onClick={() => setMarks({...marks, project: Number(projectEvalInput)})} 
                    className="px-3 py-1 text-xs font-bold text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    Evaluate
                  </button>
                </div>
              </div>

              {/* Portfolio line */}
              {!isCie && (
                <div className="flex items-center flex-wrap gap-4 justify-between border-b border-blue-100/50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-blue-800">Portfolio PDF: </span>
                    {studentSubmission.portfolioPdfName ? (
                      <span className="text-sm text-blue-600">{studentSubmission.portfolioPdfName}</span>
                    ) : (
                      <span className="text-sm text-gray-500">Not uploaded</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" min="0" max="5" placeholder="Marks" 
                      value={portfolioEvalInput} 
                      onChange={e => setPortfolioEvalInput(e.target.value)} 
                      className="w-16 px-2 py-1 text-sm border border-blue-200 rounded focus:outline-none focus:border-blue-400" 
                    />
                    <button 
                      onClick={() => setMarks({...marks, portfolio: Number(portfolioEvalInput)})} 
                      className="px-3 py-1 text-xs font-bold text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700 transition-colors"
                    >
                      Evaluate
                    </button>
                  </div>
                </div>
              )}

              {/* Objective line */}
              <div className="flex items-center flex-wrap gap-4 justify-between border-b border-blue-100/50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-blue-800">Objective Questions: </span>
                  <span className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-md border border-green-200 shadow-sm">
                    {(() => {
                      if (!targetExam || !targetExam.theoryQuestions || !studentSubmission.theoryAnswers) return 'Pending...';
                      const validQuestionsCount = targetExam.theoryQuestions.filter((q: any) => q.question).length;
                      if (validQuestionsCount === 0) return 'No objective questions assigned';
                      const correctCount = studentSubmission.theoryAnswers.filter((ans: number, idx: number) => ans === targetExam.theoryQuestions[idx]?.answerIndex).length;
                      return `${correctCount} / ${validQuestionsCount} Correct`;
                    })()}
                  </span>
                </div>
                
                {targetExam && targetExam.theoryQuestions && studentSubmission?.theoryAnswers && targetExam.theoryQuestions.filter((q: any) => q.question).length > 0 && (
                  <button
                    onClick={() => {
                      const validQuestionsCount = targetExam.theoryQuestions.filter((q: any) => q.question).length;
                      const correctCount = studentSubmission.theoryAnswers.filter((ans: number, idx: number) => ans === targetExam.theoryQuestions[idx]?.answerIndex).length;
                      const maxTheory = isCie ? 10 : 5;
                      const calculatedMark = Math.floor((correctCount / (validQuestionsCount || 1)) * maxTheory);
                      setMarks({...marks, theory: calculatedMark});
                    }}
                    className="px-4 py-1 text-xs font-bold text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    Evaluate to Marks
                  </button>
                )}
              </div>

              {/* Attendance line */}
              <div className="flex items-center flex-wrap gap-4 justify-between border-b border-blue-100/50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-blue-800">{isCie ? '6 weeks Average' : 'Attendance'}: </span>
                  <span className="text-sm text-gray-500">Max {isCie ? 20 : 2} marks</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" min="0" max={isCie ? "20" : "2"} placeholder="Marks" 
                    value={attendanceEvalInput} 
                    onChange={e => setAttendanceEvalInput(e.target.value)} 
                    className="w-16 px-2 py-1 text-sm border border-blue-200 rounded focus:outline-none focus:border-blue-400" 
                  />
                  <button 
                    onClick={() => setMarks({...marks, attendance: Number(attendanceEvalInput)})} 
                    className="px-3 py-1 text-xs font-bold text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    Evaluate
                  </button>
                </div>
              </div>

              {/* Mentor line */}
              <div className="flex items-center flex-wrap gap-4 justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-blue-800">{isCie ? 'Viva' : 'Mentor Evaluation'}: </span>
                  <span className="text-sm text-gray-500">Max {isCie ? 5 : 3} marks</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" min="0" max={isCie ? "5" : "3"} placeholder="Marks" 
                    value={mentorEvalInput} 
                    onChange={e => setMentorEvalInput(e.target.value)} 
                    className="w-16 px-2 py-1 text-sm border border-blue-200 rounded focus:outline-none focus:border-blue-400" 
                  />
                  <button 
                    onClick={() => setMarks({...marks, mentor: Number(mentorEvalInput)})} 
                    className="px-3 py-1 text-xs font-bold text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    Evaluate
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500 pt-2 border-t border-blue-100/50 mt-2">
                Submitted at: {new Date(studentSubmission.submittedAt).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="mb-8 p-4 bg-orange-50 border border-orange-100 rounded-xl text-orange-700 text-sm">
              Note: This student has not yet submitted their test via the Assessments portal for this week.
            </div>
          )}

          <div className="space-y-6 max-w-2xl">
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
              <label className="font-medium text-gray-700">Project (Max {isCie ? 15 : 5})</label>
              <input 
                type="number" min="0" max={isCie ? 15 : 5} 
                value={marks.project} onChange={(e) => setMarks({...marks, project: Number(e.target.value)})}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:border-primary"
              />
            </div>
            {!isCie && (
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                <label className="font-medium text-gray-700">Portfolio & Document (Max 5)</label>
                <input 
                  type="number" min="0" max="5" 
                  value={marks.portfolio} onChange={(e) => setMarks({...marks, portfolio: Number(e.target.value)})}
                  className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:border-primary"
                />
              </div>
            )}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
              <label className="font-medium text-gray-700">Theory Assignment (Max {isCie ? 10 : 5})</label>
              <input 
                type="number" min="0" max={isCie ? 10 : 5} 
                value={marks.theory} onChange={(e) => setMarks({...marks, theory: Number(e.target.value)})}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
              <label className="font-medium text-gray-700">{isCie ? 'Viva' : 'Mentor'} (Max {isCie ? 5 : 3})</label>
              <input 
                type="number" min="0" max={isCie ? 5 : 3} 
                value={marks.mentor} onChange={(e) => setMarks({...marks, mentor: Number(e.target.value)})}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
              <label className="font-medium text-gray-700">{isCie ? '6 weeks Average' : 'Attendance'} (Max {isCie ? 20 : 2})</label>
              <input 
                type="number" min="0" max={isCie ? 20 : 2} 
                value={marks.attendance} onChange={(e) => setMarks({...marks, attendance: Number(e.target.value)})}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:border-primary"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 border-t-2 border-gray-100">
              <span className="font-bold text-gray-900 text-lg">Total Score</span>
              <span className="font-black text-primary text-2xl">
                {Number(marks.project) + (isCie ? 0 : Number(marks.portfolio)) + Number(marks.theory) + Number(marks.attendance) + Number(marks.mentor)} / {isCie ? 50 : 20}
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button 
                onClick={() => setSelectedStudent(null)}
                className="px-6 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Hide / Save Draft
              </button>
              <button 
                onClick={handleSendReport}
                disabled={isSent}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-sm transition-colors ${isSent ? 'bg-green-500' : 'bg-primary hover:bg-orange-600'}`}
              >
                {isSent ? (
                  <><CheckCircle2 size={20} /> Sent Successfully!</>
                ) : (
                  <><Send size={20} /> Send Report to Student</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
