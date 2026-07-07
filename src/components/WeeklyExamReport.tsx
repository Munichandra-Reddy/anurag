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

  // When mentor selects a student, try to load existing marks
  useEffect(() => {
    if (isMentor && selectedStudent) {
      setIsSent(false);
      const loadReport = async () => {
        const key = `weeklyReport_${selectedStudent.email}_${pattern}`;
        const cloudReport = await getFromCloudflare(key);
        const localReport = JSON.parse(localStorage.getItem(key) || 'null');
        
        if (cloudReport) {
          setMarks(cloudReport);
        } else if (localReport) {
          setMarks(localReport);
        } else {
          setMarks({ project: 0, portfolio: 0, theory: 0, attendance: 0, mentor: 0 });
        }

        const submissionKey = `weeklyReportSubmission_${selectedStudent.email}_${pattern}`;
        const submissionData = JSON.parse(localStorage.getItem(submissionKey) || 'null');
        setStudentSubmission(submissionData);
      };
      loadReport();
    }
  }, [isMentor, selectedStudent, pattern]);

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
                <span className="font-bold text-primary">{studentReport.project} / 5</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="font-medium text-gray-700">Portfolio & Document</span>
                <span className="font-bold text-primary">{studentReport.portfolio} / 5</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="font-medium text-gray-700">Theory Assignment</span>
                <span className="font-bold text-primary">{studentReport.theory} / 5</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="font-medium text-gray-700">Attendance</span>
                <span className="font-bold text-primary">{studentReport.attendance} / 2</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="font-medium text-gray-700">Mentor</span>
                <span className="font-bold text-primary">{studentReport.mentor} / 3</span>
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="font-black text-gray-900 text-xl">Total Score</span>
                <span className="font-black text-primary text-2xl">
                  {Number(studentReport.project) + Number(studentReport.portfolio) + Number(studentReport.theory) + Number(studentReport.attendance) + Number(studentReport.mentor)} / 20
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
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="flex items-center gap-3 text-gray-900 font-bold text-2xl mb-8">
        <FileText className="text-orange-500" size={28} /> 
        {pattern} Evaluation
      </div>

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
                      {isCompleted ? (
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
                          className="text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 px-6 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer border border-primary/20"
                        >
                          Evaluate
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
              <div>
                <span className="text-sm font-bold text-blue-800">Project URL: </span>
                <a href={studentSubmission.projectUrl || '#'} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                  {studentSubmission.projectUrl || 'Not provided'}
                </a>
              </div>
              <div>
                <span className="text-sm font-bold text-blue-800">Project PDF: </span>
                <span className="text-sm text-gray-700">{studentSubmission.projectPdfName || 'Not uploaded'}</span>
              </div>
              <div>
                <span className="text-sm font-bold text-blue-800">Portfolio PDF: </span>
                <span className="text-sm text-gray-700">{studentSubmission.portfolioPdfName || 'Not uploaded'}</span>
              </div>
              <div>
                <span className="text-sm font-bold text-blue-800">Theory Answer Index Selected: </span>
                <span className="text-sm text-gray-700">{studentSubmission.theoryAnswerIndex !== undefined ? studentSubmission.theoryAnswerIndex + 1 : 'Not answered'}</span>
              </div>
              <div className="text-xs text-gray-500 pt-2">
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
              <label className="font-medium text-gray-700">Project (Max 5)</label>
              <input 
                type="number" min="0" max="5" 
                value={marks.project} onChange={(e) => setMarks({...marks, project: Number(e.target.value)})}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
              <label className="font-medium text-gray-700">Portfolio & Document (Max 5)</label>
              <input 
                type="number" min="0" max="5" 
                value={marks.portfolio} onChange={(e) => setMarks({...marks, portfolio: Number(e.target.value)})}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
              <label className="font-medium text-gray-700">Theory Assignment (Max 5)</label>
              <input 
                type="number" min="0" max="5" 
                value={marks.theory} onChange={(e) => setMarks({...marks, theory: Number(e.target.value)})}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
              <label className="font-medium text-gray-700">Attendance (Max 2)</label>
              <input 
                type="number" min="0" max="2" 
                value={marks.attendance} onChange={(e) => setMarks({...marks, attendance: Number(e.target.value)})}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
              <label className="font-medium text-gray-700">Mentor (Max 3)</label>
              <input 
                type="number" min="0" max="3" 
                value={marks.mentor} onChange={(e) => setMarks({...marks, mentor: Number(e.target.value)})}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:border-primary"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 border-t-2 border-gray-100">
              <span className="font-bold text-gray-900 text-lg">Total Score</span>
              <span className="font-black text-primary text-2xl">
                {Number(marks.project) + Number(marks.portfolio) + Number(marks.theory) + Number(marks.attendance) + Number(marks.mentor)} / 20
              </span>
            </div>

            <div className="flex justify-end pt-4">
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
