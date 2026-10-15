import React, { useState, useEffect } from 'react';
import { Plus, X, Upload, Link as LinkIcon, FileText, CheckCircle2, Award, PlayCircle } from 'lucide-react';
import { WeeklyExamReport } from './WeeklyExamReport';
import { getFromCloudflare, saveToCloudflare, replaceInCloudflare, getMentorKey, getStudentsKey, getMentorBatches, isMuniUser, matchesStudentEmail } from '../utils/cloudflare';
import { SOLIDWORKS_60_MCQS } from '../data/solidworks60Mcqs';
import { SOLIDWORKS_SKILL_TEST_2_MCQS } from '../data/solidworksSkillTest2Mcqs';
import { MUNI_STUDENTS } from '../data/students';

interface TheoryQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}

interface WeeklyExamData {
  id: string; // e.g., 'week1' or 'skill_test_2'
  title: string; // e.g., 'Week 1 Exam' or 'Skill Test 2'
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

const PERMANENT_SKILL_TEST_2: WeeklyExamData = {
  id: 'skill_test_2',
  title: 'Skill Test 2',
  projectTitle: '',
  portfolioTopic: '',
  assessmentMode: 'mcq',
  theoryPdfName: '',
  theoryQuestions: SOLIDWORKS_SKILL_TEST_2_MCQS,
  targetBatch: 'A2'
};

const ensureSkillTest2 = (examList: WeeklyExamData[], emailToCheck: string): WeeklyExamData[] => {
  const muni = isMuniUser(emailToCheck);
  if (!muni) return examList;

  const examsKey = getMentorKey('anuragLmsWeeklyExams', emailToCheck);
  const isRemoved = 
    localStorage.getItem('muni_skill_test_2_explicitly_removed') === 'true' ||
    localStorage.getItem(`${examsKey}_removed_skill_test_2`) === 'true' ||
    localStorage.getItem('anuragLmsWeeklyExams_muni@geonixa.com_removed_skill_test_2') === 'true';

  if (isRemoved) return examList;

  const hasSkillTest2 = examList.some(e => 
    e && (e.id === 'skill_test_2' || (e.title && e.title.toLowerCase().includes('skill test 2')))
  );

  if (!hasSkillTest2) {
    return [PERMANENT_SKILL_TEST_2, ...examList];
  }

  return examList.map(e => {
    if (e.id === 'skill_test_2' || (e.title && e.title.toLowerCase().includes('skill test 2'))) {
      return {
        ...e,
        targetBatch: e.targetBatch || 'A2',
        theoryQuestions: (e.theoryQuestions && e.theoryQuestions.length > 0) ? e.theoryQuestions : SOLIDWORKS_SKILL_TEST_2_MCQS
      };
    }
    return e;
  });
};

export const WeeklyAssessmentFlow: React.FC<Props> = ({ isMentor, loggedInEmail }) => {
  const currentEmail = loggedInEmail || sessionStorage.getItem('loggedInEmail') || localStorage.getItem('loggedInEmail') || (isMentor ? 'muni@geonixa.com' : '');
  const availableBatches = getMentorBatches(currentEmail);
  const isMuni = isMuniUser(currentEmail);

  // Lazy-initialize exams from localStorage to ensure instant display on refresh with NO empty flicker or data loss
  const [exams, setExams] = useState<WeeklyExamData[]>(() => {
    const examsKey = getMentorKey('anuragLmsWeeklyExams', currentEmail);
    const saved = localStorage.getItem(examsKey) || (isMuni ? localStorage.getItem('anuragLmsWeeklyExams_muni@geonixa.com') : null);
    let initialList: WeeklyExamData[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) initialList = parsed;
      } catch (e) {}
    }
    const withDefault = ensureSkillTest2(initialList, currentEmail);
    if (withDefault.length > 0) {
      try {
        localStorage.setItem(examsKey, JSON.stringify(withDefault));
        if (isMuni) {
          localStorage.setItem('anuragLmsWeeklyExams_muni@geonixa.com', JSON.stringify(withDefault));
        }
      } catch (e) {}
    }
    return withDefault;
  });

  const [isAdding, setIsAdding] = useState<false | 'weekly' | 'cie'>(false);
  
  // Filter state
  const [filterExam, setFilterExam] = useState('');
  const [filterBatch, setFilterBatch] = useState('All');
  
  // Mentor form state
  const [selectedWeek, setSelectedWeek] = useState(isMuni ? 'skill_test_2' : 'week1');
  const [projectTitle, setProjectTitle] = useState('');
  const [portfolioTopic, setPortfolioTopic] = useState('');
  const [assessmentMode, setAssessmentMode] = useState<'pdf' | 'mcq'>('mcq');
  const [theoryPdfName, setTheoryPdfName] = useState('theory_assignment.pdf');
  const [theoryPdfDataUrl, setTheoryPdfDataUrl] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(isMuni ? 20 : 60);
  const [theoryQuestions, setTheoryQuestions] = useState<TheoryQuestion[]>(isMuni ? SOLIDWORKS_SKILL_TEST_2_MCQS : SOLIDWORKS_60_MCQS);
  const [targetBatch, setTargetBatch] = useState('A2');
  const [projectBatches, setProjectBatches] = useState<any[]>([]);

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
  
  // Submissions state
  const [submissions, setSubmissions] = useState<Record<string, WeeklyExamSubmission>>({});
  const [evaluatingExamId, setEvaluatingExamId] = useState<string | null>(null);

  const [studentDetails, setStudentDetails] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const email = currentEmail;
      const examsKey = getMentorKey('anuragLmsWeeklyExams', email);
      const batchesKey = getMentorKey('anuragLmsProjectBatchData', email);

      // 1. Read existing local storage
      const savedExamsStr = localStorage.getItem(examsKey) || (isMuni ? localStorage.getItem('anuragLmsWeeklyExams_muni@geonixa.com') : null);
      let localExams: WeeklyExamData[] = [];
      if (savedExamsStr) {
        try {
          const parsed = JSON.parse(savedExamsStr);
          if (Array.isArray(parsed)) localExams = parsed;
        } catch (e) { localExams = []; }
      }
      localExams = ensureSkillTest2(localExams, email);
      if (localExams.length > 0) {
        setExams(localExams);
      }

      // 2. Fetch from cloud
      let cloudExams = await getFromCloudflare(examsKey);
      if ((!cloudExams || (Array.isArray(cloudExams) && cloudExams.length === 0)) && isMuni) {
        cloudExams = await getFromCloudflare('anuragLmsWeeklyExams_muni@geonixa.com');
      }

      let candidateExams: WeeklyExamData[] = [];
      if (cloudExams && Array.isArray(cloudExams) && cloudExams.length > 0) {
        candidateExams = cloudExams;
      } else if (localExams.length > 0) {
        candidateExams = localExams;
      }

      const finalExams = ensureSkillTest2(candidateExams, email);

      // Permanently store in localStorage
      localStorage.setItem(examsKey, JSON.stringify(finalExams));
      if (isMuni) {
        localStorage.setItem('anuragLmsWeeklyExams_muni@geonixa.com', JSON.stringify(finalExams));
      }

      // Sync to cloud
      saveToCloudflare(examsKey, finalExams);
      replaceInCloudflare(examsKey, finalExams);
      if (isMuni && examsKey !== 'anuragLmsWeeklyExams_muni@geonixa.com') {
        saveToCloudflare('anuragLmsWeeklyExams_muni@geonixa.com', finalExams);
        replaceInCloudflare('anuragLmsWeeklyExams_muni@geonixa.com', finalExams);
      }

      setExams(finalExams);

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
        const subKey = `weeklyExamSubmissions_${email}`;
        const cloudSubmissions = await getFromCloudflare(subKey);
        if (cloudSubmissions) {
          setSubmissions(cloudSubmissions);
        } else {
          const savedSubmissions = localStorage.getItem(subKey);
          if (savedSubmissions) setSubmissions(JSON.parse(savedSubmissions));
        }
        
        const studentsKey = getStudentsKey(email);
        const cloudStudents = await getFromCloudflare(studentsKey);
        const localStudents = JSON.parse(localStorage.getItem(studentsKey) || '[]');
        const cloudMuniStudents = await getFromCloudflare('registeredStudents_muni@geonixa.com');
        const localMuniStudents = JSON.parse(localStorage.getItem('registeredStudents_muni@geonixa.com') || '[]');
        const allKnownStudents = [
          ...MUNI_STUDENTS, 
          ...localStudents, 
          ...localMuniStudents,
          ...(Array.isArray(cloudStudents) ? cloudStudents : []),
          ...(Array.isArray(cloudMuniStudents) ? cloudMuniStudents : [])
        ];
        const me = allKnownStudents.find((s: any) => matchesStudentEmail(s?.email, email));
        setStudentDetails(me);
      }
    };
    fetchData();
  }, [isMentor, currentEmail, isMuni]);

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // Auto-load draft progress when student opens an exam
  useEffect(() => {
    if (!takingExamId || isMentor) return;

    setIsDraftLoaded(false);
    const draftKey = `examDraft_${loggedInEmail}_${takingExamId}`;
    const loadDraft = async () => {
      try {
        const localDraft = localStorage.getItem(draftKey);
        const cloudDraft = await getFromCloudflare(draftKey);
        const draft = (localDraft ? JSON.parse(localDraft) : null) || cloudDraft;

        if (draft) {
          if (draft.studentProjectUrl) setStudentProjectUrl(draft.studentProjectUrl);
          if (draft.studentProjectPdf) setStudentProjectPdf(draft.studentProjectPdf);
          if (draft.studentProjectPdfDataUrl) setStudentProjectPdfDataUrl(draft.studentProjectPdfDataUrl);
          if (draft.studentPortfolioPdf) setStudentPortfolioPdf(draft.studentPortfolioPdf);
          if (draft.studentPortfolioPdfDataUrl) setStudentPortfolioPdfDataUrl(draft.studentPortfolioPdfDataUrl);
          if (draft.studentTheoryAnswers && Array.isArray(draft.studentTheoryAnswers)) {
            setStudentTheoryAnswers(draft.studentTheoryAnswers);
          }
          if (draft.studentTheoryTextAnswer) setStudentTheoryTextAnswer(draft.studentTheoryTextAnswer);
          if (draft.studentTheoryPdf) setStudentTheoryPdf(draft.studentTheoryPdf);
          if (draft.studentTheoryPdfDataUrl) setStudentTheoryPdfDataUrl(draft.studentTheoryPdfDataUrl);
        }
      } catch (err) {
        console.error("Failed to load exam draft:", err);
      } finally {
        setIsDraftLoaded(true);
      }
    };

    loadDraft();
  }, [takingExamId, isMentor, loggedInEmail]);

  // Auto-save draft progress in real-time as student answers (only after draft is loaded)
  useEffect(() => {
    if (!takingExamId || isMentor || !isDraftLoaded) return;

    const draftKey = `examDraft_${loggedInEmail}_${takingExamId}`;
    const draft = {
      studentProjectUrl,
      studentProjectPdf,
      studentProjectPdfDataUrl,
      studentPortfolioPdf,
      studentPortfolioPdfDataUrl,
      studentTheoryAnswers,
      studentTheoryTextAnswer,
      studentTheoryPdf,
      studentTheoryPdfDataUrl,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem(draftKey, JSON.stringify(draft));
    saveToCloudflare(draftKey, draft);
  }, [
    takingExamId, isMentor, isDraftLoaded, loggedInEmail,
    studentProjectUrl, studentProjectPdf, studentProjectPdfDataUrl,
    studentPortfolioPdf, studentPortfolioPdfDataUrl,
    studentTheoryAnswers, studentTheoryTextAnswer,
    studentTheoryPdf, studentTheoryPdfDataUrl
  ]);

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();

    const isSkillTest2 = selectedWeek === 'skill_test_2' || (selectedWeek === 'week1' && isMuni);
    // For Skill Test 2, ALWAYS use 'skill_test_2' as the ID regardless of target batch.
    // Batch filtering is done via the targetBatch field, not the ID.
    // This ensures student submissions (saved under 'skill_test_2') always match.
    const examId = isSkillTest2 
      ? 'skill_test_2'
      : (targetBatch === 'All Batches' ? selectedWeek : `${selectedWeek}_${targetBatch.replace(/\s+/g, '')}`);

    const newExam: WeeklyExamData = {
      id: examId,
      title: isSkillTest2 ? 'Skill Test 2' : `${selectedWeek.toUpperCase()} Exam`,
      projectTitle: isSkillTest2 ? '' : projectTitle,
      portfolioTopic: isSkillTest2 ? '' : portfolioTopic,
      assessmentMode: isSkillTest2 ? 'mcq' : assessmentMode,
      theoryPdfName: (assessmentMode === 'pdf' && !isSkillTest2) ? theoryPdfName : '',
      theoryPdfDataUrl: (assessmentMode === 'pdf' && !isSkillTest2) ? theoryPdfDataUrl : '',
      theoryQuestions: isSkillTest2 
        ? SOLIDWORKS_SKILL_TEST_2_MCQS 
        : (assessmentMode === 'mcq' 
            ? (theoryQuestions.length > 0 ? theoryQuestions.slice(0, questionCount) : SOLIDWORKS_60_MCQS.slice(0, questionCount)) 
            : []),
      targetBatch
    };

    const updatedExams = [
      ...exams.filter(ex => ex.id !== examId && !(isSkillTest2 && (ex.id === 'week1' || ex.id === 'skill_test_2'))), 
      newExam
    ];
    setExams(updatedExams);
    
    const examsKey = getMentorKey('anuragLmsWeeklyExams', currentEmail);
    localStorage.removeItem('muni_skill_test_2_explicitly_removed');
    localStorage.removeItem(`${examsKey}_removed_${examId}`);
    localStorage.removeItem(`anuragLmsWeeklyExams_muni@geonixa.com_removed_${examId}`);
    localStorage.removeItem(`${examsKey}_removed_skill_test_2`);
    localStorage.removeItem('anuragLmsWeeklyExams_muni@geonixa.com_removed_skill_test_2');
    saveToCloudflare('muni_skill_test_2_explicitly_removed', { removed: false });
    saveToCloudflare(`${examsKey}_removed_${examId}`, { removed: false });
    if (isMuni) saveToCloudflare(`anuragLmsWeeklyExams_muni@geonixa.com_removed_${examId}`, { removed: false });

    localStorage.setItem(examsKey, JSON.stringify(updatedExams));
    if (isMuni) {
      localStorage.setItem('anuragLmsWeeklyExams_muni@geonixa.com', JSON.stringify(updatedExams));
    }
    await saveToCloudflare(examsKey, updatedExams);
    await replaceInCloudflare(examsKey, updatedExams);
    if (isMuni && examsKey !== 'anuragLmsWeeklyExams_muni@geonixa.com') {
      await saveToCloudflare('anuragLmsWeeklyExams_muni@geonixa.com', updatedExams);
      await replaceInCloudflare('anuragLmsWeeklyExams_muni@geonixa.com', updatedExams);
    }
    
    setIsAdding(false);
    // Reset
    setProjectTitle('');
    setPortfolioTopic('');
    setTheoryPdfName('theory_assignment.pdf');
    setTheoryPdfDataUrl('');
    setQuestionCount(isMuni ? 20 : 60);
    setTheoryQuestions(isMuni ? SOLIDWORKS_SKILL_TEST_2_MCQS : SOLIDWORKS_60_MCQS);
    setTargetBatch('A2');
  };

  const handleStudentSubmit = async () => {
    if (!takingExamId) return;
    const exam = exams.find(e => e.id === takingExamId);
    if (!exam) return;

    const isSkillTest2Taking = isMuni && (
      takingExamId === 'skill_test_2' || takingExamId === 'week1' ||
      takingExamId.startsWith('skill_test_2') || takingExamId.startsWith('week1') ||
      exam.title.toLowerCase().includes('skill test 2')
    );

    if (!isSkillTest2Taking && exam.projectTitle && !studentProjectUrl && !studentProjectPdf) {
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
    if (isSkillTest2Taking) {
      newSubmissions['week1'] = submission;
      newSubmissions['skill_test_2'] = submission;
    }
    setSubmissions(newSubmissions);
    localStorage.setItem(`weeklyExamSubmissions_${loggedInEmail}`, JSON.stringify(newSubmissions));
    await saveToCloudflare(`weeklyExamSubmissions_${loggedInEmail}`, newSubmissions);
    
    // Also save a raw version for the mentor to read in Exam Reports
    localStorage.setItem(`weeklyReportSubmission_${loggedInEmail}_${takingExamId}`, JSON.stringify(submission));
    await saveToCloudflare(`weeklyReportSubmission_${loggedInEmail}_${takingExamId}`, submission);
    if (isSkillTest2Taking) {
      localStorage.setItem(`weeklyReportSubmission_${loggedInEmail}_skill_test_2`, JSON.stringify(submission));
      await saveToCloudflare(`weeklyReportSubmission_${loggedInEmail}_skill_test_2`, submission);
      localStorage.setItem(`weeklyReportSubmission_${loggedInEmail}_week1`, JSON.stringify(submission));
      await saveToCloudflare(`weeklyReportSubmission_${loggedInEmail}_week1`, submission);

      // Auto-evaluate 20 MCQs score and pre-save report marks
      const correctCount = SOLIDWORKS_SKILL_TEST_2_MCQS.reduce((acc, q, idx) => {
        return acc + (studentTheoryAnswers[idx] === q.answerIndex ? 1 : 0);
      }, 0);
      const evaluatedReport = {
        project: 0,
        portfolio: 0,
        theory: correctCount,
        attendance: 0,
        mentor: 0
      };
      localStorage.setItem(`weeklyReport_${loggedInEmail}_skill_test_2`, JSON.stringify(evaluatedReport));
      await saveToCloudflare(`weeklyReport_${loggedInEmail}_skill_test_2`, evaluatedReport);
      localStorage.setItem(`weeklyReport_${loggedInEmail}_week1`, JSON.stringify(evaluatedReport));
      await saveToCloudflare(`weeklyReport_${loggedInEmail}_week1`, evaluatedReport);
    }

    // Clear draft on successful submission
    const draftKey = `examDraft_${loggedInEmail}_${takingExamId}`;
    localStorage.removeItem(draftKey);
    await saveToCloudflare(draftKey, null);

    alert(isSkillTest2Taking ? "Skill Test 2 submitted successfully! Your answers have been evaluated." : "Exam submitted successfully!");

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

    const isExamSkillTest2 = isMuni && (
      exam.id === 'week1' || exam.id === 'skill_test_2' || 
      exam.id.startsWith('week1_') || exam.id.startsWith('skill_test_2_') || 
      exam.title.toLowerCase().includes('week1') || exam.title.toLowerCase().includes('week 1') ||
      exam.title.toLowerCase().includes('skill test 2')
    );

    const effectiveQuestions = (exam.theoryQuestions && exam.theoryQuestions.length > 0)
      ? exam.theoryQuestions
      : (isExamSkillTest2 ? SOLIDWORKS_SKILL_TEST_2_MCQS : []);

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8 relative">
        <button 
          onClick={() => setTakingExamId(null)}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-1"
        >
          <X size={20} />
        </button>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isExamSkillTest2 ? 'Skill Test 2' : exam.title}
          </h2>
          <p className="text-gray-500">Complete all sections below and submit your work.</p>
        </div>

        {/* Project Section - Hidden for Skill Test 2 */}
        {!isExamSkillTest2 && exam.projectTitle && (
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

        {/* Portfolio Section - Hidden for Skill Test 2 */}
        {!isExamSkillTest2 && exam.portfolioTopic && (
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
        {effectiveQuestions && effectiveQuestions.length > 0 ? (
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-6">
            <h3 className="font-bold text-lg text-gray-900 border-b border-gray-200 pb-2">
              {isExamSkillTest2 ? `Multiple Choice Questions (${effectiveQuestions.length} Questions)` : `${exam.portfolioTopic ? '3' : '2'}. Multiple Choice Questions (${effectiveQuestions.length} Questions)`}
            </h3>
            
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
              {effectiveQuestions.map((q, qIdx) => (
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
            <CheckCircle2 size={20} /> Submit {isMuni && (takingExamId === 'skill_test_2' || takingExamId === 'week1') ? 'Skill Test 2' : 'Weekly Exam'}
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
                onClick={() => { 
                  setSelectedWeek(isMuni ? 'skill_test_2' : 'week1'); 
                  setQuestionCount(isMuni ? 20 : 60);
                  setTheoryQuestions(isMuni ? SOLIDWORKS_SKILL_TEST_2_MCQS : SOLIDWORKS_60_MCQS);
                  setIsAdding('weekly'); 
                }}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-primary text-primary font-bold rounded-xl shadow-sm hover:bg-primary/5 transition-colors"
              >
                <Plus size={20} /> {isMuni ? 'Add Skill Test 2 Exam Paper' : 'Add Weekly Exam Paper'}
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
              
              <h3 className="text-xl font-bold text-gray-900 mb-6">Configure {isAdding === 'cie' ? 'CIE' : (isMuni ? 'Skill Test 2' : 'Weekly')} Exam</h3>
              
              <form onSubmit={handleAddExam} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Select Exam</label>
                    <select 
                      value={selectedWeek} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedWeek(val);
                        if (val === 'skill_test_2' || (val === 'week1' && isMuni)) {
                          setQuestionCount(20);
                          setTheoryQuestions(SOLIDWORKS_SKILL_TEST_2_MCQS);
                        }
                      }}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-sm font-medium"
                    >
                      {isAdding === 'cie' ? (
                        <>
                          <option value="CIE1">CIE1</option>
                          <option value="CIE2">CIE2</option>
                        </>
                      ) : (
                        <>
                          {isMuni ? (
                            <>
                              <option value="skill_test_2">Skill Test 2</option>
                              {[...Array(11)].map((_, i) => (
                                <option key={i + 2} value={`week${i + 2}`}>WEEK{i + 2}</option>
                              ))}
                              <option value="SEM">SEM</option>
                            </>
                          ) : (
                            <>
                              {[...Array(12)].map((_, i) => (
                                <option key={i} value={`week${i + 1}`}>WEEK{i + 1}</option>
                              ))}
                              <option value="SEM">SEM</option>
                            </>
                          )}
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
                      {availableBatches.map(b => (
                        <option key={b} value={b}>{b} Batch</option>
                      ))}
                      {projectBatches.map(b => (
                        <option key={b.id} value={b.batchNumber}>{b.batchNumber}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 1. Project - Hidden for Skill Test 2 */}
                {!(selectedWeek === 'skill_test_2' || (selectedWeek === 'week1' && isMuni)) && (
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">1. Project</h4>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Title / Description</label>
                    <input 
                      type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    />
                    <p className="text-xs text-gray-500 mt-2">Students will be prompted to submit a URL and PDFs.</p>
                  </div>
                )}

                {/* 2. Portfolio & Document - Hidden for Skill Test 2 */}
                {isAdding === 'weekly' && !(selectedWeek === 'skill_test_2' || (selectedWeek === 'week1' && isMuni)) && (
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
                  <h4 className="font-bold text-gray-900 border-b border-gray-200 pb-2">
                    {(selectedWeek === 'skill_test_2' || (selectedWeek === 'week1' && isMuni))
                      ? 'Multiple Choice Questions (20 MCQs)'
                      : `${isAdding === 'weekly' ? '3' : '2'}. Theory / Multiple Choice Assessment`}
                  </h4>
                  
                  {/* Select Type: MCQs vs Theory PDF (hidden for Skill Test 2 since it is strictly MCQs) */}
                  {!(selectedWeek === 'skill_test_2' || (selectedWeek === 'week1' && isMuni)) && (
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
                        Multiple Choice Questions ({questionCount} MCQs)
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
                  )}

                  {assessmentMode === 'pdf' && !(selectedWeek === 'skill_test_2' || (selectedWeek === 'week1' && isMuni)) ? (
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
                              const baseSource = (isMuni || selectedWeek === 'skill_test_2') ? SOLIDWORKS_SKILL_TEST_2_MCQS : SOLIDWORKS_60_MCQS;
                              if (theoryQuestions.length < count) {
                                setTheoryQuestions(prev => [
                                  ...prev, 
                                  ...Array.from({ length: count - prev.length }, (_, i) => 
                                    baseSource[prev.length + i] || { question: `Question ${prev.length + i + 1}`, options: ['', '', '', ''], answerIndex: 0 }
                                  )
                                ]);
                              }
                            }}
                            className="ml-2 border border-gray-300 rounded px-2 py-1 bg-gray-50 font-semibold"
                          >
                            {isMuni ? (
                              <>
                                <option value={20}>20 MCQs (Standard for Skill Test 2)</option>
                                <option value={60}>60 MCQs</option>
                                <option value={40}>40 MCQs</option>
                                <option value={10}>10 MCQs</option>
                              </>
                            ) : (
                              <>
                                <option value={60}>60 MCQs (Standard)</option>
                                <option value={40}>40 MCQs</option>
                                <option value={20}>20 MCQs</option>
                                <option value={10}>10 MCQs</option>
                              </>
                            )}
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
            {availableBatches.map(b => (
              <option key={b} value={b}>{b} Batch</option>
            ))}
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
          // Student filter logic
          const cleanEmail = (currentEmail || loggedInEmail || '').toLowerCase().trim();
          const isSkillTest2Exam = exam.id === 'skill_test_2' || 
                                   exam.id.startsWith('skill_test_2') || 
                                   exam.title.toLowerCase().includes('skill test 2');

          // Check if student belongs to A2 batch
          const muniMatch = MUNI_STUDENTS.find(s => matchesStudentEmail(s?.email, cleanEmail));
          const isA2Student = 
            (muniMatch?.batch && muniMatch.batch.toLowerCase().trim() === 'a2') ||
            MUNI_A2_STUDENTS.some(s => matchesStudentEmail(s?.email, cleanEmail)) ||
            (studentDetails?.batch && studentDetails.batch.toLowerCase().trim() === 'a2');

          if (isSkillTest2Exam) {
            // A2 students MUST ALWAYS see Skill Test 2!
            return isA2Student || !exam.targetBatch || exam.targetBatch === 'All Batches';
          }

          if (!exam.targetBatch || exam.targetBatch === 'All Batches') return true;
          
          // Determine the student's batch — check all sources
          const rawStudentBatch = (() => {
            if (muniMatch?.batch) return muniMatch.batch;
            if (studentDetails?.batch) return studentDetails.batch;
            const localStudents = JSON.parse(localStorage.getItem(getStudentsKey(cleanEmail)) || '[]');
            const localMatch = localStudents.find((s: any) => matchesStudentEmail(s?.email, cleanEmail));
            if (localMatch?.batch) return localMatch.batch;
            return '';
          })();

          const cleanBatch = (b?: string) => (b || '').toLowerCase().replace(/batch/gi, '').trim();
          const targetBatchClean = cleanBatch(exam.targetBatch);
          const studentBatchClean = cleanBatch(rawStudentBatch);

          if (studentBatchClean) {
            return studentBatchClean === targetBatchClean || 
                   (studentBatchClean === 'morning' && targetBatchClean === 'a1') || 
                   (studentBatchClean === 'a1' && targetBatchClean === 'morning');
          }
          
          // Check if targetBatch is a project batch number
          const targetProjectBatch = projectBatches.find(b => cleanBatch(b.batchNumber) === targetBatchClean);
          if (targetProjectBatch) {
            return (targetProjectBatch.memberEmails || []).some((e: string) => matchesStudentEmail(e, cleanEmail));
          }
          
          return false;
        }).map((exam) => {
          const isExamSkillTest2 = isMuni && (
            exam.id === 'week1' || exam.id === 'skill_test_2' || 
            exam.id.startsWith('week1_') || exam.id.startsWith('skill_test_2_') || 
            exam.title.toLowerCase().includes('week1') || exam.title.toLowerCase().includes('week 1') ||
            exam.title.toLowerCase().includes('skill test 2')
          );
          const displayTitle = isExamSkillTest2 ? 'Skill Test 2' : exam.title;

          return (
            <div key={exam.id} className="bg-white border-l-4 border-l-orange-500 border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-xl text-gray-900">{displayTitle}</h3>
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
                      if (window.confirm("Are you sure you want to remove this exam? This will permanently delete this exam paper for this mentor dashboard and its assigned students.")) {
                        const newExams = exams.filter(e => e.id !== exam.id);
                        setExams(newExams);

                        const examsKey = getMentorKey('anuragLmsWeeklyExams', currentEmail);
                        if (exam.id === 'skill_test_2' || exam.title.toLowerCase().includes('skill test 2')) {
                          localStorage.setItem('muni_skill_test_2_explicitly_removed', 'true');
                          localStorage.setItem(`${examsKey}_removed_skill_test_2`, 'true');
                          localStorage.setItem('anuragLmsWeeklyExams_muni@geonixa.com_removed_skill_test_2', 'true');
                          saveToCloudflare('muni_skill_test_2_explicitly_removed', { removed: true, removedAt: new Date().toISOString() });
                        }
                        localStorage.setItem(`${examsKey}_removed_${exam.id}`, 'true');
                        localStorage.setItem(`anuragLmsWeeklyExams_muni@geonixa.com_removed_${exam.id}`, 'true');
                        saveToCloudflare(`${examsKey}_removed_${exam.id}`, { removed: true });
                        if (isMuni) saveToCloudflare(`anuragLmsWeeklyExams_muni@geonixa.com_removed_${exam.id}`, { removed: true });

                        localStorage.setItem(examsKey, JSON.stringify(newExams));
                        if (isMuni) {
                          localStorage.setItem('anuragLmsWeeklyExams_muni@geonixa.com', JSON.stringify(newExams));
                        }
                        const promises: Promise<any>[] = [
                          saveToCloudflare(examsKey, newExams),
                          replaceInCloudflare(examsKey, newExams)
                        ];
                        if (isMuni && examsKey !== 'anuragLmsWeeklyExams_muni@geonixa.com') {
                          promises.push(saveToCloudflare('anuragLmsWeeklyExams_muni@geonixa.com', newExams));
                          promises.push(replaceInCloudflare('anuragLmsWeeklyExams_muni@geonixa.com', newExams));
                        }

                        // Fetch only target students for this specific mentor
                        const targetStudentsKey = getStudentsKey(currentEmail);
                        const cloudStudents = await getFromCloudflare(targetStudentsKey);
                        const localStudents = JSON.parse(localStorage.getItem(targetStudentsKey) || '[]');

                        const allStudentsMap = new Map();
                        [...localStudents, ...(cloudStudents || [])].forEach(s => {
                          if (s && s.email) allStudentsMap.set(s.email.toLowerCase(), s);
                        });

                        const studentsList = Array.from(allStudentsMap.values());

                        for (const student of studentsList) {
                          if (!student || !student.email) continue;
                          const email = student.email.toLowerCase();

                          // 1. Delete active exam drafts
                          const draftKey1 = `examDraft_${email}_${exam.id}`;
                          const draftKey2 = `weeklyReportDraft_${email}_${exam.id}`;
                          localStorage.removeItem(draftKey1);
                          localStorage.removeItem(draftKey2);
                          promises.push(saveToCloudflare(draftKey1, null));
                          promises.push(saveToCloudflare(draftKey2, null));

                          // 2. Delete marks report
                          const reportKey = `weeklyReport_${email}_${exam.id}`;
                          localStorage.removeItem(reportKey);
                          promises.push(saveToCloudflare(reportKey, null));

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
                // Check submissions using all possible IDs for Skill Test 2
                (submissions[exam.id] || submissions['skill_test_2'] || submissions['week1']) && 
                (exam.id === 'skill_test_2' || exam.id.startsWith('skill_test_2') || exam.id === 'week1' 
                  ? (submissions['skill_test_2'] || submissions['week1'])
                  : submissions[exam.id]) ? (
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
        );
      })}
      </div>
    </div>
  );
};
