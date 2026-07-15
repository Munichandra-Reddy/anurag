import React, { useState, useEffect } from 'react';
import { Plus, X, FileText, CheckCircle2, Award, PlayCircle } from 'lucide-react';
import { getFromCloudflare, saveToCloudflare } from '../utils/cloudflare';

interface TheoryQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}

interface PreAssessmentData {
  id: string;
  title: string;
  sectionA: TheoryQuestion[];
  sectionB: TheoryQuestion[];
  sectionC: TheoryQuestion[];
  sectionD: string[];
  targetBatch?: string;
}

interface PreAssessmentSubmission {
  sectionAAnswers: number[];
  sectionBAnswers: number[];
  sectionCAnswers: number[];
  sectionDAnswers: string[];
  submittedAt: string;
  marks?: {
    sectionA: number;
    sectionB: number;
    sectionC: number;
    sectionD: number;
    total: number;
  };
}

interface Props {
  isMentor: boolean;
  loggedInEmail: string;
}

export const PreAssessmentFlow: React.FC<Props> = ({ isMentor, loggedInEmail }) => {
  const [exams, setExams] = useState<PreAssessmentData[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Mentor form state
  const [title, setTitle] = useState('');
  const [targetBatch, setTargetBatch] = useState('All Batches');
  const [projectBatches, setProjectBatches] = useState<{id: string, batchNumber: string, memberEmails: string[]}[]>([]);

  const [sectionA, setSectionA] = useState<TheoryQuestion[]>(Array.from({ length: 10 }, () => ({ question: '', options: ['', '', '', ''], answerIndex: 0 })));
  const [sectionB, setSectionB] = useState<TheoryQuestion[]>(Array.from({ length: 5 }, () => ({ question: '', options: ['True', 'False'], answerIndex: 0 })));
  const [sectionC, setSectionC] = useState<TheoryQuestion[]>(Array.from({ length: 5 }, () => ({ question: '', options: ['', '', '', ''], answerIndex: 0 })));
  const [sectionD, setSectionD] = useState<string[]>(Array.from({ length: 5 }, () => ''));

  // Student form state
  const [takingExamId, setTakingExamId] = useState<string | null>(null);
  const [ansA, setAnsA] = useState<number[]>([]);
  const [ansB, setAnsB] = useState<number[]>([]);
  const [ansC, setAnsC] = useState<number[]>([]);
  const [ansD, setAnsD] = useState<string[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, PreAssessmentSubmission>>({});
  
  // Mentor evaluation state
  const [evaluatingExamId, setEvaluatingExamId] = useState<string | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<Record<string, PreAssessmentSubmission>>({});
  const [evaluatingStudentEmail, setEvaluatingStudentEmail] = useState<string | null>(null);
  const [sectionDMarks, setSectionDMarks] = useState<number>(0);

  // Student report state
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);

  const [studentDetails, setStudentDetails] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Load exams
      const cloudExams = await getFromCloudflare('anuragLmsPreAssessmentsData');
      if (cloudExams && Array.isArray(cloudExams)) setExams(cloudExams);

      // Load Batches
      const cloudBatches = await getFromCloudflare('anuragLmsProjectBatchData');
      if (cloudBatches) setProjectBatches(cloudBatches as any);

      // Load Submissions
      if (!isMentor) {
        const subKey = `preAssessmentSubmissions_${loggedInEmail}`;
        const cloudSubmissions = await getFromCloudflare(subKey);
        if (cloudSubmissions) setSubmissions(cloudSubmissions);

        const cloudStudents = await getFromCloudflare('registeredStudents');
        const students = cloudStudents ? cloudStudents as any[] : [];
        const me = students.find((s: any) => s.email === loggedInEmail);
        setStudentDetails(me);
      }
    };
    fetchData();
  }, [isMentor, loggedInEmail]);

  const handleLoadSubmissionsForExam = async (examId: string) => {
    setEvaluatingExamId(examId);
    setEvaluatingStudentEmail(null);
    // In a real database, we would query by examId. For our KV store, we can fetch registered students and check their submissions.
    const cloudStudents = await getFromCloudflare('registeredStudents') || [];
    const collected: Record<string, PreAssessmentSubmission> = {};
    for (const st of cloudStudents as any[]) {
      const stuSub = await getFromCloudflare(`preAssessmentSubmissions_${st.email}`);
      if (stuSub && stuSub[examId]) {
        collected[st.email] = stuSub[examId];
      }
    }
    setAllSubmissions(collected);
  };

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newExam: PreAssessmentData = {
      id: `pre_${Date.now()}`,
      title,
      sectionA,
      sectionB,
      sectionC,
      sectionD,
      targetBatch
    };

    const updatedExams = [newExam, ...exams];
    setExams(updatedExams);
    await saveToCloudflare('anuragLmsPreAssessmentsData', updatedExams);
    
    setIsAdding(false);
    setTitle('');
  };

  const handleStudentSubmit = async () => {
    if (!takingExamId) return;
    
    const submission: PreAssessmentSubmission = {
      sectionAAnswers: ansA,
      sectionBAnswers: ansB,
      sectionCAnswers: ansC,
      sectionDAnswers: ansD,
      submittedAt: new Date().toISOString()
    };

    const newSubmissions = { ...submissions, [takingExamId]: submission };
    setSubmissions(newSubmissions);
    await saveToCloudflare(`preAssessmentSubmissions_${loggedInEmail}`, newSubmissions);

    setTakingExamId(null);
  };

  const handleEvaluateSubmit = async () => {
    if (!evaluatingExamId || !evaluatingStudentEmail) return;

    const exam = exams.find(e => e.id === evaluatingExamId);
    const sub = allSubmissions[evaluatingStudentEmail];
    if (!exam || !sub) return;

    // Calculate marks
    let markA = 0, markB = 0, markC = 0;
    
    exam.sectionA.forEach((q, idx) => { if (sub.sectionAAnswers[idx] === q.answerIndex) markA++; });
    exam.sectionB.forEach((q, idx) => { if (sub.sectionBAnswers[idx] === q.answerIndex) markB++; });
    exam.sectionC.forEach((q, idx) => { if (sub.sectionCAnswers[idx] === q.answerIndex) markC++; });

    const evaluatedSubmission = {
      ...sub,
      marks: {
        sectionA: markA,
        sectionB: markB,
        sectionC: markC,
        sectionD: sectionDMarks,
        total: markA + markB + markC + sectionDMarks
      }
    };

    // Save back to student's record
    const stuSubs = await getFromCloudflare(`preAssessmentSubmissions_${evaluatingStudentEmail}`) || {};
    stuSubs[evaluatingExamId] = evaluatedSubmission;
    await saveToCloudflare(`preAssessmentSubmissions_${evaluatingStudentEmail}`, stuSubs);

    const updatedAllSubs = { ...allSubmissions, [evaluatingStudentEmail]: evaluatedSubmission };
    setAllSubmissions(updatedAllSubs);
    setEvaluatingStudentEmail(null);
  };

  if (evaluatingStudentEmail && evaluatingExamId) {
    const exam = exams.find(e => e.id === evaluatingExamId);
    const sub = allSubmissions[evaluatingStudentEmail];
    if (exam && sub) {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8 relative">
          <button onClick={() => setEvaluatingStudentEmail(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Evaluate: {evaluatingStudentEmail}</h2>
          
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-4">
            <h3 className="font-bold text-lg text-gray-900 border-b border-gray-200 pb-2">Section D Answers (Max 10 Marks)</h3>
            <div className="space-y-4">
              {exam.sectionD.map((q, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-800 mb-2">Q{idx + 1}: {q}</p>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded border border-gray-100">{sub.sectionDAnswers[idx] || 'No answer provided'}</p>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Marks for Section D</label>
                <input 
                  type="number" min="0" max="10" 
                  value={sectionDMarks} onChange={(e) => setSectionDMarks(Number(e.target.value))}
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-gray-500 mt-1">Provide marks out of 10.</p>
              </div>
              <button 
                onClick={handleEvaluateSubmit}
                className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
              >
                Save Evaluation
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  if (evaluatingExamId) {
    const exam = exams.find(e => e.id === evaluatingExamId);
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6 relative">
        <button onClick={() => setEvaluatingExamId(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-1">
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Submissions for {exam?.title}</h2>
        
        {Object.keys(allSubmissions).length === 0 ? (
          <p className="text-gray-500">No submissions yet.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(allSubmissions).map(([email, sub]) => (
              <div key={email} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <div>
                  <p className="font-bold text-gray-900">{email}</p>
                  <p className="text-sm text-gray-500">Submitted: {new Date(sub.submittedAt).toLocaleString()}</p>
                </div>
                {sub.marks ? (
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg border border-green-100">
                      Score: {sub.marks.total}/30
                    </span>
                    <button 
                      onClick={() => {
                        setSectionDMarks(sub.marks!.sectionD);
                        setEvaluatingStudentEmail(email);
                      }}
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100"
                    >
                      Re-evaluate
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setSectionDMarks(0);
                      setEvaluatingStudentEmail(email);
                    }}
                    className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-orange-600"
                  >
                    Evaluate
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (viewingReportId && !isMentor) {
    const exam = exams.find(e => e.id === viewingReportId);
    const sub = submissions[viewingReportId];
    if (exam && sub && sub.marks) {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6 relative">
          <button onClick={() => setViewingReportId(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-6">
            <FileText className="text-orange-500" size={28} />
            <h2 className="text-2xl font-bold text-gray-900">{exam.title} - Score Report</h2>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-4 text-lg">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <span className="font-medium text-gray-700">Section A - Multiple choice questions</span>
              <span className="font-bold text-primary">{sub.marks.sectionA} / 10M</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <span className="font-medium text-gray-700">Section B - True/False</span>
              <span className="font-bold text-primary">{sub.marks.sectionB} / 5M</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <span className="font-medium text-gray-700">Section C - Fill in the blanks</span>
              <span className="font-bold text-primary">{sub.marks.sectionC} / 5M</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <span className="font-medium text-gray-700">Section D - Short Answer Question</span>
              <span className="font-bold text-primary">{sub.marks.sectionD} / 10M</span>
            </div>
            <div className="flex justify-between items-center pt-4">
              <span className="font-black text-gray-900 text-xl">Total Marks Obtained</span>
              <span className="font-black text-green-600 text-2xl">{sub.marks.total} / 30M</span>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button 
              onClick={() => setViewingReportId(null)}
              className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-sm hover:bg-orange-600 transition-colors"
            >
              Back to Assessments
            </button>
          </div>
        </div>
      );
    }
  }

  if (takingExamId) {
    const exam = exams.find(e => e.id === takingExamId);
    if (!exam) return null;

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8 relative">
        <button onClick={() => setTakingExamId(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-1">
          <X size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{exam.title}</h2>
          <p className="text-gray-500">Total Marks: 30</p>
        </div>

        {/* Section A */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-6">
          <h3 className="font-bold text-lg text-gray-900 border-b border-gray-200 pb-2">Section A: Multiple Choice (10 Marks)</h3>
          {exam.sectionA.map((q, qIndex) => (
            <div key={qIndex} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
              <p className="font-bold text-gray-900 mb-3">{qIndex + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, idx) => (
                  <label key={idx} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 border border-transparent">
                    <input type="radio" checked={ansA[qIndex] === idx} onChange={() => {
                      const newAns = [...ansA]; newAns[qIndex] = idx; setAnsA(newAns);
                    }} className="w-4 h-4 text-primary focus:ring-primary" />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Section B */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-6">
          <h3 className="font-bold text-lg text-gray-900 border-b border-gray-200 pb-2">Section B: True/False (5 Marks)</h3>
          {exam.sectionB.map((q, qIndex) => (
            <div key={qIndex} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
              <p className="font-bold text-gray-900 mb-3">{qIndex + 1}. {q.question}</p>
              <div className="flex gap-6">
                {q.options.map((opt, idx) => (
                  <label key={idx} className="flex items-center gap-2 cursor-pointer hover:text-primary">
                    <input type="radio" checked={ansB[qIndex] === idx} onChange={() => {
                      const newAns = [...ansB]; newAns[qIndex] = idx; setAnsB(newAns);
                    }} className="w-4 h-4 text-primary focus:ring-primary" />
                    <span className="text-sm font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Section C */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-6">
          <h3 className="font-bold text-lg text-gray-900 border-b border-gray-200 pb-2">Section C: Fill in the blanks (5 Marks)</h3>
          {exam.sectionC.map((q, qIndex) => (
            <div key={qIndex} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
              <p className="font-bold text-gray-900 mb-3">{qIndex + 1}. {q.question}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.options.map((opt, idx) => (
                  <label key={idx} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 border border-transparent">
                    <input type="radio" checked={ansC[qIndex] === idx} onChange={() => {
                      const newAns = [...ansC]; newAns[qIndex] = idx; setAnsC(newAns);
                    }} className="w-4 h-4 text-primary focus:ring-primary" />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Section D */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-6">
          <h3 className="font-bold text-lg text-gray-900 border-b border-gray-200 pb-2">Section D: Short Answers (10 Marks)</h3>
          {exam.sectionD.map((q, qIndex) => (
            <div key={qIndex} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
              <p className="font-bold text-gray-900 mb-3">{qIndex + 1}. {q}</p>
              <textarea 
                value={ansD[qIndex] || ''}
                onChange={(e) => {
                  const newAns = [...ansD]; newAns[qIndex] = e.target.value; setAnsD(newAns);
                }}
                rows={3}
                placeholder="Write your answer here..."
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleStudentSubmit}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-sm hover:bg-orange-600 transition-colors"
          >
            <CheckCircle2 size={20} /> Submit Pre Assessment
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
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-indigo-500 text-indigo-600 font-bold rounded-xl shadow-sm hover:bg-indigo-50 transition-colors"
            >
              <Plus size={20} /> Add Pre Assessment Paper
            </button>
          ) : (
            <div className="bg-white border-2 border-indigo-500/20 p-6 rounded-2xl shadow-sm relative">
              <button onClick={() => setIsAdding(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-full">
                <X size={18} />
              </button>
              
              <h3 className="text-xl font-bold text-gray-900 mb-6">Configure Pre Assessment Paper</h3>
              
              <form onSubmit={handleAddExam} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Assessment Title</label>
                    <input 
                      type="text" required value={title} onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Pre Assessment 1"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Target Batch</label>
                    <select 
                      value={targetBatch} onChange={(e) => setTargetBatch(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm font-medium"
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

                {/* Build Sections */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 max-h-[600px] overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-gray-300">
                  
                  {/* Section A */}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2 sticky top-0 bg-gray-50 py-2">Section A: 10 MCQs (1M each)</h4>
                    <div className="space-y-6">
                      {sectionA.map((q, qIndex) => (
                        <div key={qIndex} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                          <label className="block text-xs font-bold text-gray-500 mb-2">Q{qIndex + 1}</label>
                          <input type="text" required value={q.question} onChange={e => { const n = [...sectionA]; n[qIndex].question = e.target.value; setSectionA(n); }} className="w-full px-3 py-2 border rounded-lg text-sm mb-3" placeholder="Question text"/>
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((opt, oIndex) => (
                              <div key={oIndex} className="flex items-center gap-2">
                                <input type="radio" checked={q.answerIndex === oIndex} onChange={() => { const n = [...sectionA]; n[qIndex].answerIndex = oIndex; setSectionA(n); }} />
                                <input type="text" required value={opt} onChange={e => { const n = [...sectionA]; n[qIndex].options[oIndex] = e.target.value; setSectionA(n); }} className="w-full px-2 py-1 text-sm border rounded" placeholder={`Option ${oIndex + 1}`}/>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section B */}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2 sticky top-0 bg-gray-50 py-2">Section B: 5 True/False (1M each)</h4>
                    <div className="space-y-6">
                      {sectionB.map((q, qIndex) => (
                        <div key={qIndex} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                          <label className="block text-xs font-bold text-gray-500 mb-2">Q{qIndex + 1}</label>
                          <input type="text" required value={q.question} onChange={e => { const n = [...sectionB]; n[qIndex].question = e.target.value; setSectionB(n); }} className="w-full px-3 py-2 border rounded-lg text-sm mb-3" placeholder="Statement text"/>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2"><input type="radio" checked={q.answerIndex === 0} onChange={() => { const n = [...sectionB]; n[qIndex].answerIndex = 0; setSectionB(n); }} /> True</label>
                            <label className="flex items-center gap-2"><input type="radio" checked={q.answerIndex === 1} onChange={() => { const n = [...sectionB]; n[qIndex].answerIndex = 1; setSectionB(n); }} /> False</label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section C */}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2 sticky top-0 bg-gray-50 py-2">Section C: 5 Fill in the blanks (1M each)</h4>
                    <div className="space-y-6">
                      {sectionC.map((q, qIndex) => (
                        <div key={qIndex} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                          <label className="block text-xs font-bold text-gray-500 mb-2">Q{qIndex + 1}</label>
                          <input type="text" required value={q.question} onChange={e => { const n = [...sectionC]; n[qIndex].question = e.target.value; setSectionC(n); }} className="w-full px-3 py-2 border rounded-lg text-sm mb-3" placeholder="Question with ___ for blank"/>
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((opt, oIndex) => (
                              <div key={oIndex} className="flex items-center gap-2">
                                <input type="radio" checked={q.answerIndex === oIndex} onChange={() => { const n = [...sectionC]; n[qIndex].answerIndex = oIndex; setSectionC(n); }} />
                                <input type="text" required value={opt} onChange={e => { const n = [...sectionC]; n[qIndex].options[oIndex] = e.target.value; setSectionC(n); }} className="w-full px-2 py-1 text-sm border rounded" placeholder={`Option ${oIndex + 1}`}/>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section D */}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2 sticky top-0 bg-gray-50 py-2">Section D: 5 Short Answers (2M each)</h4>
                    <div className="space-y-6">
                      {sectionD.map((q, qIndex) => (
                        <div key={qIndex} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                          <label className="block text-xs font-bold text-gray-500 mb-2">Q{qIndex + 1}</label>
                          <input type="text" required value={q} onChange={e => { const n = [...sectionD]; n[qIndex] = e.target.value; setSectionD(n); }} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Question text"/>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                    Publish Pre Assessment
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
          if (exam.targetBatch === 'Morning' || exam.targetBatch === 'Evening') return studentDetails.batch === exam.targetBatch;
          const targetProjectBatch = projectBatches.find(b => b.batchNumber === exam.targetBatch);
          if (targetProjectBatch) return targetProjectBatch.memberEmails.includes(loggedInEmail);
          return false;
        }).map((exam) => (
          <div key={exam.id} className="bg-white border-l-4 border-l-indigo-500 border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                  <button onClick={() => handleLoadSubmissionsForExam(exam.id)} className="px-6 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl font-bold text-sm transition-colors text-center">
                    Evaluate Submissions
                  </button>
                  <button onClick={async () => {
                    const newExams = exams.filter(e => e.id !== exam.id);
                    setExams(newExams);
                    await saveToCloudflare('anuragLmsPreAssessmentsData', newExams);
                  }} className="px-4 py-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl font-medium text-sm transition-colors text-center">
                    Remove
                  </button>
                </>
              ) : (
                submissions[exam.id] ? (
                  <div className="flex items-center justify-center gap-3">
                    {submissions[exam.id].marks ? (
                      <button 
                        onClick={() => setViewingReportId(exam.id)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-green-50 text-green-700 font-bold rounded-xl border border-green-100 shadow-sm hover:bg-green-100 transition-colors"
                      >
                        <Award size={18}/> View Report (Score: {submissions[exam.id].marks!.total}/30)
                      </button>
                    ) : (
                      <span className="flex items-center gap-2 px-6 py-2.5 bg-gray-50 text-gray-600 font-bold rounded-xl border border-gray-200 shadow-sm">
                        <CheckCircle2 size={18}/> Pending Evaluation
                      </span>
                    )}
                  </div>
                ) : (
                  <button onClick={() => setTakingExamId(exam.id)} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
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
