import React, { useState, useEffect } from 'react';
import { Search, FileText, ArrowLeft, Send, CheckCircle2, Edit, X, Check, HelpCircle, ChevronDown, ChevronUp, Award, RotateCcw } from 'lucide-react';
import { getFromCloudflare, saveToCloudflare, getMentorKey, getStudentsKey, isMuniUser, matchesStudentEmail } from '../utils/cloudflare';
import { resetStudentSubmissionForExam } from './WeeklyAssessmentFlow';
import { 
  SOLIDWORKS_SKILL_TEST_2_MCQS,
  SOLIDWORKS_SKILL_TEST_2_SET1_MCQS,
  SOLIDWORKS_SKILL_TEST_2_SET2_MCQS,
  getSkillTest2McqsForBatch,
  getSkillTest3McqsForBatch
} from '../data/solidworksSkillTest2Mcqs';

interface Student {
  id: number;
  name: string;
  email: string;
  batch?: string;
}

interface Marks {
  project: number;
  portfolio: number;
  theory: number;
  attendance: number;
  mentor: number;
  isMentorSubmitted?: boolean;
  submittedAt?: string;
}

interface WeeklyExamReportProps {
  pattern: string;
  isMentor: boolean;
  loggedInEmail: string;
  onBack?: () => void;
}

export const WeeklyExamReport: React.FC<WeeklyExamReportProps> = ({ pattern, isMentor, loggedInEmail, onBack }) => {
  const currentEmail = loggedInEmail || sessionStorage.getItem('loggedInEmail') || localStorage.getItem('loggedInEmail') || '';
  const isCie = pattern.startsWith('CIE');

  const isSkillTest3 = pattern === 'skill_test_3' || 
    pattern.startsWith('skill_test_3') || 
    pattern.toLowerCase().includes('skill test 3') || 
    ((pattern === 'week2' || pattern.startsWith('week2')) && isMuniUser(currentEmail));

  const isSkillTest2 = !isSkillTest3 && (
    pattern === 'skill_test_2' || 
    pattern.startsWith('skill_test_2') || 
    pattern.toLowerCase().includes('skill') || 
    ((pattern === 'week1' || pattern.startsWith('week1')) && isMuniUser(currentEmail))
  );

  const isSkillTest = isSkillTest2 || isSkillTest3;

  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [showQuestionsReview, setShowQuestionsReview] = useState(false);
  
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
  const [submissionStatuses, setSubmissionStatuses] = useState<Record<string, { isCompleted: boolean, hasSubmitted: boolean }>>({});

  const [projectEvalInput, setProjectEvalInput] = useState<string>('');
  const [portfolioEvalInput, setPortfolioEvalInput] = useState<string>('');
  const [theoryEvalInput, setTheoryEvalInput] = useState<string>('');
  const [attendanceEvalInput, setAttendanceEvalInput] = useState<string>('');
  const [mentorEvalInput, setMentorEvalInput] = useState<string>('');

  // Load the target exam to evaluate objective questions
  useEffect(() => {
    const loadExam = async () => {
      const examKey = getMentorKey('anuragLmsWeeklyExams', currentEmail);
      let localExams: any[] = [];
      try {
        const localStr = localStorage.getItem(examKey) || localStorage.getItem('anuragLmsWeeklyExams_muni@geonixa.com');
        if (localStr) localExams = JSON.parse(localStr);
      } catch (e) {}

      const cloudExams = await getFromCloudflare(examKey) || await getFromCloudflare('anuragLmsWeeklyExams_muni@geonixa.com') || await getFromCloudflare('anuragLmsWeeklyExams');
      let exams = cloudExams && Array.isArray(cloudExams) && cloudExams.length > 0 ? cloudExams : localExams;

      let exam = exams.find((e: any) => e.id === pattern);
      if (!exam) {
        if (pattern === 'skill_test_3') {
          exam = exams.find((e: any) => e.id === 'week2' || e.id.startsWith('skill_test_3') || e.id.startsWith('week2'));
        } else if (pattern === 'week2') {
          exam = exams.find((e: any) => e.id === 'skill_test_3' || e.id.startsWith('week2') || e.id.startsWith('skill_test_3'));
        } else if (pattern === 'skill_test_2') {
          exam = exams.find((e: any) => e.id === 'week1' || e.id.startsWith('skill_test_2') || e.id.startsWith('week1'));
        } else if (pattern === 'week1') {
          exam = exams.find((e: any) => e.id === 'skill_test_2' || e.id.startsWith('week1') || e.id.startsWith('skill_test_2'));
        }
      }
      
      if (!exam && !isMentor) {
        const studentsKey = getStudentsKey(currentEmail);
        const cloudStudents = await getFromCloudflare(studentsKey);
        const safeArray = (a: any) => Array.isArray(a) ? a : [];
        let localStudents: any[] = [];
        try {
          const parsed = JSON.parse(localStorage.getItem(studentsKey) || '[]');
          if (Array.isArray(parsed)) localStudents = parsed;
        } catch (e) {}
        const student = [...localStudents, ...safeArray(cloudStudents)].find(s => matchesStudentEmail(s?.email, currentEmail));
        
        if (student && student.batch) {
          if (isSkillTest3) {
            exam = exams.find((e: any) => (e.id.startsWith('skill_test_3_') || e.id.startsWith('week2_') || e.id === 'skill_test_3' || e.id === 'week2') && e.targetBatch === student.batch);
          } else if (isSkillTest2) {
            exam = exams.find((e: any) => (e.id.startsWith('skill_test_2_') || e.id.startsWith('week1_') || e.id === 'skill_test_2' || e.id === 'week1') && e.targetBatch === student.batch);
          } else {
            exam = exams.find((e: any) => e.id.startsWith(`${pattern}_`) && e.targetBatch === student.batch);
          }
        }
        if (!exam) {
          if (isSkillTest3) {
            exam = exams.find((e: any) => e.id.startsWith('skill_test_3_') || e.id.startsWith('week2_') || e.id === 'skill_test_3' || e.id === 'week2');
          } else if (isSkillTest2) {
            exam = exams.find((e: any) => e.id.startsWith('skill_test_2_') || e.id.startsWith('week1_') || e.id === 'skill_test_2' || e.id === 'week1');
          } else {
            exam = exams.find((e: any) => e.id.startsWith(`${pattern}_`));
          }
        }
      }

      if (!exam && isSkillTest3) {
        exam = {
          id: 'skill_test_3',
          title: 'Skill Test 3',
          theoryQuestions: SOLIDWORKS_SKILL_TEST_2_SET2_MCQS,
          targetBatch: 'B1'
        };
      } else if (!exam && isSkillTest2) {
        exam = {
          id: 'skill_test_2',
          title: 'Skill Test 2',
          theoryQuestions: SOLIDWORKS_SKILL_TEST_2_SET1_MCQS,
          targetBatch: 'B1'
        };
      }
      
      setTargetExam(exam);
    };
    loadExam();
  }, [pattern, isMentor, currentEmail, isSkillTest3, isSkillTest2]);

  // Helper to get the correct questions for a student based on batch and submission
  const getQuestionsForStudent = (student: Student | null, submission: any) => {
    if (submission && submission.theoryQuestions && Array.isArray(submission.theoryQuestions) && submission.theoryQuestions.length > 0) {
      return submission.theoryQuestions;
    }
    if (isSkillTest3) {
      const studentBatch = (student?.batch || '').replace(/batch/gi, '').trim().toUpperCase();
      // Skill Test 3 Question Paper Exchange:
      // A1 and B1 (Morning) get SET 2 (exchanged with A2/B2)
      // A2 and B2 (Evening) get SET 1 (exchanged with A1/B1)
      if (studentBatch.includes('A2') || studentBatch.includes('B2') || studentBatch.includes('EVENING')) {
        return SOLIDWORKS_SKILL_TEST_2_SET1_MCQS;
      }
      return SOLIDWORKS_SKILL_TEST_2_SET2_MCQS;
    }
    if (!isSkillTest2) {
      return (targetExam?.theoryQuestions && targetExam.theoryQuestions.length > 0) ? targetExam.theoryQuestions : [];
    }

    const studentBatch = (student?.batch || '').replace(/batch/gi, '').trim().toUpperCase();
    const isBatch1 = studentBatch.includes('B1') || studentBatch.includes('A1');
    const isBatch2 = studentBatch.includes('B2') || studentBatch.includes('A2');

    if (submission && submission.theoryAnswers && Array.isArray(submission.theoryAnswers) && submission.theoryAnswers.length > 0) {
      const score1 = SOLIDWORKS_SKILL_TEST_2_SET1_MCQS.reduce((acc: number, q: any, idx: number) => {
        return acc + (submission.theoryAnswers[idx] === q.answerIndex ? 1 : 0);
      }, 0);
      const score2 = SOLIDWORKS_SKILL_TEST_2_SET2_MCQS.reduce((acc: number, q: any, idx: number) => {
        return acc + (submission.theoryAnswers[idx] === q.answerIndex ? 1 : 0);
      }, 0);

      // If student is Batch 1 (A1 or B1):
      if (isBatch1) {
        return (score2 > score1 && score1 <= 6) ? SOLIDWORKS_SKILL_TEST_2_SET2_MCQS : SOLIDWORKS_SKILL_TEST_2_SET1_MCQS;
      }

      // If student is Batch 2 (A2 or B2):
      if (isBatch2) {
        if (studentBatch.includes('A2') && score1 > score2) {
          return SOLIDWORKS_SKILL_TEST_2_SET1_MCQS;
        }
        return SOLIDWORKS_SKILL_TEST_2_SET2_MCQS;
      }

      return score1 >= score2 ? SOLIDWORKS_SKILL_TEST_2_SET1_MCQS : SOLIDWORKS_SKILL_TEST_2_SET2_MCQS;
    }

    if (isBatch2) return SOLIDWORKS_SKILL_TEST_2_SET2_MCQS;
    return SOLIDWORKS_SKILL_TEST_2_SET1_MCQS;
  };

  // Load students for mentor
  useEffect(() => {
    if (isMentor) {
      const loadStudents = async () => {
        const studentsKey = getStudentsKey();
        const cloudStudents = await getFromCloudflare(studentsKey) || [];
        const localStudents = JSON.parse(localStorage.getItem(studentsKey) || '[]');
        
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
        const studentEmail = currentEmail || loggedInEmail;
        let reportKey = `weeklyReport_${studentEmail}_${pattern}`;
        let cloudReport = await getFromCloudflare(reportKey);
        let localReport = JSON.parse(localStorage.getItem(reportKey) || 'null');
        
        // If not found by exact pattern, check aliases (skill_test_3 <-> week2, skill_test_2 <-> week1)
        if (!cloudReport && !localReport) {
          const altPattern = isSkillTest3
            ? (pattern === 'skill_test_3' ? 'week2' : (pattern === 'week2' ? 'skill_test_3' : null))
            : (pattern === 'skill_test_2' ? 'week1' : (pattern === 'week1' ? 'skill_test_2' : null));
          if (altPattern) {
            const altKey = `weeklyReport_${studentEmail}_${altPattern}`;
            localReport = JSON.parse(localStorage.getItem(altKey) || 'null');
            cloudReport = await getFromCloudflare(altKey);
          }
        }

        // If not found by exact pattern (e.g. week2 or week1), try looking for a batch-specific report
        if (!cloudReport && !localReport) {
          const allKeys = Object.keys(localStorage);
          const matchedKey = allKeys.find(k => 
            k.startsWith(`weeklyReport_${studentEmail}_${pattern}_`) || 
            (isSkillTest3 && (k.startsWith(`weeklyReport_${studentEmail}_skill_test_3_`) || k.startsWith(`weeklyReport_${studentEmail}_week2_`))) ||
            (isSkillTest2 && (k.startsWith(`weeklyReport_${studentEmail}_skill_test_2_`) || k.startsWith(`weeklyReport_${studentEmail}_week1_`)))
          );
          if (matchedKey) {
            localReport = JSON.parse(localStorage.getItem(matchedKey) || 'null');
            cloudReport = await getFromCloudflare(matchedKey);
          }
        }

        const finalReport = cloudReport || localReport;
        if (finalReport) {
          // For Skill Tests, only show report to student if mentor has submitted it
          if (isSkillTest) {
            if (finalReport.isMentorSubmitted === true) {
              setStudentReport(finalReport as any);
            } else {
              setStudentReport(null);
            }
          } else {
            setStudentReport(finalReport as any);
          }
        } else {
          setStudentReport(null);
        }
      };
      loadReport();
    }
  }, [isMentor, loggedInEmail, pattern, isSkillTest, isSkillTest3, isSkillTest2]);

  // When mentor selects a student, try to load existing marks or drafts
  useEffect(() => {
    if (isMentor && selectedStudent) {
      setIsSent(false);
      setIsLoaded(false);
      const loadReport = async () => {
        const key = `weeklyReport_${selectedStudent.email}_${pattern}`;
        const draftKey = `weeklyReportDraft_${selectedStudent.email}_${pattern}`;
        const altPattern = isSkillTest3
          ? (pattern === 'skill_test_3' ? 'week2' : (pattern === 'week2' ? 'skill_test_3' : null))
          : (pattern === 'skill_test_2' ? 'week1' : (pattern === 'week1' ? 'skill_test_2' : null));
        
        let localReport = JSON.parse(localStorage.getItem(key) || 'null');
        let draftReport = JSON.parse(localStorage.getItem(draftKey) || 'null');
        
        if (!draftReport && altPattern) {
          draftReport = JSON.parse(localStorage.getItem(`weeklyReportDraft_${selectedStudent.email}_${altPattern}`) || 'null');
        }

        let loadedMarks = { project: 0, portfolio: 0, theory: 0, attendance: 0, mentor: 0 };
        
        if (draftReport) {
          loadedMarks = draftReport;
        } else {
          let cloudReport = await getFromCloudflare(key);
          if (!cloudReport && !localReport && altPattern) {
            const altKey = `weeklyReport_${selectedStudent.email}_${altPattern}`;
            localReport = JSON.parse(localStorage.getItem(altKey) || 'null');
            cloudReport = await getFromCloudflare(altKey);
          }
          if (cloudReport) {
            loadedMarks = cloudReport as any;
          } else if (localReport) {
            loadedMarks = localReport;
          }
        }
        
        if (pattern.startsWith('CIE')) {
          const targetWeeks = pattern.startsWith('CIE1') 
            ? ['week1', 'week2', 'week3', 'week4', 'week5', 'week6'] 
            : ['week6', 'week7', 'week8', 'week9', 'week10'];
            
          let sum = 0;
          let count = targetWeeks.length;
          
          const fetchPromises = targetWeeks.map(async (week) => {
            const weekKey = `weeklyReport_${selectedStudent.email}_${week}`;
            let weekLocal = JSON.parse(localStorage.getItem(weekKey) || 'null');
            if (!weekLocal && week === 'week1') {
              weekLocal = JSON.parse(localStorage.getItem(`weeklyReport_${selectedStudent.email}_skill_test_2`) || 'null');
            }
            if (weekLocal) return weekLocal;
            
            let cloudReport = await getFromCloudflare(weekKey);
            if (!cloudReport && week === 'week1') {
              cloudReport = await getFromCloudflare(`weeklyReport_${selectedStudent.email}_skill_test_2`);
            }
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

        // Find student submission across all possible keys
        const sEmail = (selectedStudent.email || '').toLowerCase().trim();
        let submissionKey = `weeklyReportSubmission_${sEmail}_${pattern}`;
        let localSubmissionData = JSON.parse(localStorage.getItem(submissionKey) || 'null');
        let cloudSubmissionData = await getFromCloudflare(submissionKey);

        if (!localSubmissionData && !cloudSubmissionData) {
          const possibleKeys = isSkillTest3 ? [
            `weeklyReportSubmission_${sEmail}_skill_test_3`,
            `weeklyReportSubmission_${sEmail}_week2`,
            `weeklyReportSubmission_${sEmail}_${pattern}_${selectedStudent.batch || ''}`,
            `weeklyReportSubmission_${sEmail}_skill_test_3_${selectedStudent.batch || ''}`,
            `weeklyReportSubmission_${sEmail}_skill_test_3_A1`,
            `weeklyReportSubmission_${sEmail}_skill_test_3_A2`,
            `weeklyReportSubmission_${sEmail}_skill_test_3_B1`,
            `weeklyReportSubmission_${sEmail}_skill_test_3_B2`
          ] : [
            `weeklyReportSubmission_${sEmail}_skill_test_2`,
            `weeklyReportSubmission_${sEmail}_week1`,
            `weeklyReportSubmission_${sEmail}_${pattern}_${selectedStudent.batch || ''}`,
            `weeklyReportSubmission_${sEmail}_skill_test_2_${selectedStudent.batch || ''}`,
            `weeklyReportSubmission_${sEmail}_skill_test_2_A1`,
            `weeklyReportSubmission_${sEmail}_skill_test_2_A2`,
            `weeklyReportSubmission_${sEmail}_skill_test_2_B1`,
            `weeklyReportSubmission_${sEmail}_skill_test_2_B2`
          ];
          for (const pKey of possibleKeys) {
            const loc = JSON.parse(localStorage.getItem(pKey) || 'null');
            const cld = await getFromCloudflare(pKey);
            if (loc || cld) {
              localSubmissionData = loc;
              cloudSubmissionData = cld;
              break;
            }
          }
        }

        if (!localSubmissionData && !cloudSubmissionData) {
          const mapKey = `weeklyExamSubmissions_${sEmail}`;
          const localMap = JSON.parse(localStorage.getItem(mapKey) || '{}');
          const cloudMap = await getFromCloudflare(mapKey) || {};
          const fullMap = { ...(localMap || {}), ...(cloudMap || {}) };
          if (isSkillTest3) {
            if (fullMap[pattern] || fullMap['skill_test_3'] || fullMap['week2']) {
              cloudSubmissionData = fullMap[pattern] || fullMap['skill_test_3'] || fullMap['week2'];
            } else {
              const matchedEntry = Object.entries(fullMap).find(([k]) => k.startsWith('skill_test_3') || k.startsWith('week2'));
              if (matchedEntry) {
                cloudSubmissionData = matchedEntry[1];
              }
            }
          } else {
            if (fullMap[pattern] || fullMap['skill_test_2'] || fullMap['week1']) {
              cloudSubmissionData = fullMap[pattern] || fullMap['skill_test_2'] || fullMap['week1'];
            } else {
              const matchedEntry = Object.entries(fullMap).find(([k]) => k.startsWith('skill_test_2') || k.startsWith('week1') || k.includes('skill'));
              if (matchedEntry) {
                cloudSubmissionData = matchedEntry[1];
              }
            }
          }
        }

        const finalSubmission = cloudSubmissionData || localSubmissionData;
        setStudentSubmission(finalSubmission);

        // Auto-evaluate MCQ marks if submission has theoryAnswers using the correct batch questions
        const questions = getQuestionsForStudent(selectedStudent, finalSubmission);

        if (finalSubmission && finalSubmission.theoryAnswers && Array.isArray(finalSubmission.theoryAnswers) && questions.length > 0) {
          const correctCount = questions.reduce((acc: number, q: any, idx: number) => {
            return acc + (finalSubmission.theoryAnswers[idx] === q.answerIndex ? 1 : 0);
          }, 0);
          const total = questions.length;
          const maxMark = isSkillTest ? 20 : (isCie ? 10 : 5);
          const autoScore = isSkillTest ? correctCount : Math.round((correctCount / total) * maxMark);

          if (isSkillTest) {
            if (!loadedMarks.isMentorSubmitted || !loadedMarks.theory || (isSkillTest2 && loadedMarks.theory === 6 && autoScore !== 6)) {
              loadedMarks.theory = autoScore;
            }
            loadedMarks.project = 0;
            loadedMarks.portfolio = 0;
            loadedMarks.attendance = 0;
            loadedMarks.mentor = 0;
          } else if (!loadedMarks.theory || loadedMarks.theory === 0) {
            loadedMarks.theory = autoScore;
          }
        }

        setMarks(loadedMarks);
        setTheoryEvalInput(loadedMarks.theory ? String(loadedMarks.theory) : '');
        setProjectEvalInput(loadedMarks.project ? String(loadedMarks.project) : '');
        setPortfolioEvalInput(loadedMarks.portfolio ? String(loadedMarks.portfolio) : '');
        setAttendanceEvalInput(pattern.startsWith('CIE') ? String(loadedMarks.attendance) : '');
        setMentorEvalInput(loadedMarks.mentor ? String(loadedMarks.mentor) : '');

        setIsLoaded(true);
      };
      loadReport();
    } else {
      setIsLoaded(false);
    }
  }, [isMentor, selectedStudent, pattern, isSkillTest, isSkillTest3, isSkillTest2]);

  // Load all student submission statuses asynchronously
  useEffect(() => {
    if (isMentor && students.length > 0) {
      const loadStatuses = async () => {
        const newStatuses: Record<string, { isCompleted: boolean, hasSubmitted: boolean }> = {};
        
        const altPattern = isSkillTest3
          ? (pattern === 'skill_test_3' ? 'week2' : (pattern === 'week2' ? 'skill_test_3' : null))
          : (pattern === 'skill_test_2' ? 'week1' : (pattern === 'week1' ? 'skill_test_2' : null));
        const promises = students.map(async (student) => {
          let report: any = null;
          try {
            report = JSON.parse(localStorage.getItem(`weeklyReport_${student.email}_${pattern}`) || 'null');
            if (!report && altPattern) {
              report = JSON.parse(localStorage.getItem(`weeklyReport_${student.email}_${altPattern}`) || 'null');
            }
            if (!report && isSkillTest3 && student.batch) {
              report = JSON.parse(localStorage.getItem(`weeklyReport_${student.email}_skill_test_3_${student.batch}`) || 'null');
            } else if (!report && isSkillTest2 && student.batch) {
              report = JSON.parse(localStorage.getItem(`weeklyReport_${student.email}_skill_test_2_${student.batch}`) || 'null');
            }
          } catch (e) {}

          if (!report) {
            report = await getFromCloudflare(`weeklyReport_${student.email}_${pattern}`);
            if (!report && altPattern) {
              report = await getFromCloudflare(`weeklyReport_${student.email}_${altPattern}`);
            }
            if (!report && isSkillTest3 && student.batch) {
              report = await getFromCloudflare(`weeklyReport_${student.email}_skill_test_3_${student.batch}`);
            } else if (!report && isSkillTest2 && student.batch) {
              report = await getFromCloudflare(`weeklyReport_${student.email}_skill_test_2_${student.batch}`);
            }
          }

          const sEmail = (student.email || '').toLowerCase().trim();
          let hasSubmitted = localStorage.getItem(`weeklyReportSubmission_${sEmail}_${pattern}`) !== null;
          if (!hasSubmitted && altPattern) {
            hasSubmitted = localStorage.getItem(`weeklyReportSubmission_${sEmail}_${altPattern}`) !== null;
          }
          if (!hasSubmitted && isSkillTest3) {
            const possibleSubKeys = [
              `weeklyReportSubmission_${sEmail}_skill_test_3`,
              `weeklyReportSubmission_${sEmail}_week2`,
              `weeklyReportSubmission_${sEmail}_skill_test_3_B1`,
              `weeklyReportSubmission_${sEmail}_skill_test_3_B2`,
              `weeklyReportSubmission_${sEmail}_skill_test_3_A1`,
              `weeklyReportSubmission_${sEmail}_skill_test_3_A2`
            ];
            for (const pKey of possibleSubKeys) {
              if (localStorage.getItem(pKey) !== null) {
                hasSubmitted = true;
                break;
              }
            }
          } else if (!hasSubmitted && isSkillTest2) {
            const possibleSubKeys = [
              `weeklyReportSubmission_${sEmail}_skill_test_2`,
              `weeklyReportSubmission_${sEmail}_week1`,
              `weeklyReportSubmission_${sEmail}_skill_test_2_B1`,
              `weeklyReportSubmission_${sEmail}_skill_test_2_B2`,
              `weeklyReportSubmission_${sEmail}_skill_test_2_A1`,
              `weeklyReportSubmission_${sEmail}_skill_test_2_A2`
            ];
            for (const pKey of possibleSubKeys) {
              if (localStorage.getItem(pKey) !== null) {
                hasSubmitted = true;
                break;
              }
            }
          }

          if (!hasSubmitted) {
            const cloudSub = await getFromCloudflare(`weeklyReportSubmission_${sEmail}_${pattern}`);
            if (cloudSub) hasSubmitted = true;
            else if (altPattern) {
              const altCloud = await getFromCloudflare(`weeklyReportSubmission_${sEmail}_${altPattern}`);
              if (altCloud) hasSubmitted = true;
            }
            if (!hasSubmitted && isSkillTest3) {
              const cloudSubSkill = await getFromCloudflare(`weeklyReportSubmission_${sEmail}_skill_test_3`)
                || await getFromCloudflare(`weeklyReportSubmission_${sEmail}_week2`)
                || await getFromCloudflare(`weeklyReportSubmission_${sEmail}_skill_test_3_B1`)
                || await getFromCloudflare(`weeklyReportSubmission_${sEmail}_skill_test_3_B2`)
                || await getFromCloudflare(`weeklyReportSubmission_${sEmail}_skill_test_3_A1`)
                || await getFromCloudflare(`weeklyReportSubmission_${sEmail}_skill_test_3_A2`)
                || (student.batch ? await getFromCloudflare(`weeklyReportSubmission_${sEmail}_skill_test_3_${student.batch}`) : null);
              if (cloudSubSkill) hasSubmitted = true;
            } else if (!hasSubmitted && isSkillTest2) {
              const cloudSubSkill = await getFromCloudflare(`weeklyReportSubmission_${sEmail}_skill_test_2`)
                || await getFromCloudflare(`weeklyReportSubmission_${sEmail}_week1`)
                || await getFromCloudflare(`weeklyReportSubmission_${sEmail}_skill_test_2_B1`)
                || await getFromCloudflare(`weeklyReportSubmission_${sEmail}_skill_test_2_B2`)
                || await getFromCloudflare(`weeklyReportSubmission_${sEmail}_skill_test_2_A1`)
                || await getFromCloudflare(`weeklyReportSubmission_${sEmail}_skill_test_2_A2`)
                || (student.batch ? await getFromCloudflare(`weeklyReportSubmission_${sEmail}_skill_test_2_${student.batch}`) : null);
              if (cloudSubSkill) hasSubmitted = true;
            }
            if (!hasSubmitted) {
              const cloudSubMap = await getFromCloudflare(`weeklyExamSubmissions_${sEmail}`);
              if (cloudSubMap && isSkillTest3) {
                if (cloudSubMap[pattern] || (altPattern && cloudSubMap[altPattern]) || 
                    cloudSubMap['skill_test_3'] || cloudSubMap['week2'] ||
                    cloudSubMap['skill_test_3_B1'] || cloudSubMap['skill_test_3_B2'] ||
                    cloudSubMap['skill_test_3_A1'] || cloudSubMap['skill_test_3_A2'] ||
                    (student.batch && cloudSubMap[`skill_test_3_${student.batch}`])) {
                  hasSubmitted = true;
                }
              } else if (cloudSubMap && isSkillTest2) {
                if (cloudSubMap[pattern] || (altPattern && cloudSubMap[altPattern]) || 
                    cloudSubMap['skill_test_2'] || cloudSubMap['week1'] ||
                    cloudSubMap['skill_test_2_B1'] || cloudSubMap['skill_test_2_B2'] ||
                    cloudSubMap['skill_test_2_A1'] || cloudSubMap['skill_test_2_A2'] ||
                    (student.batch && cloudSubMap[`skill_test_2_${student.batch}`])) {
                  hasSubmitted = true;
                }
              }
            }
            if (!hasSubmitted) {
              const subMap = JSON.parse(localStorage.getItem(`weeklyExamSubmissions_${sEmail}`) || '{}');
              if (isSkillTest3) {
                if (subMap[pattern] || (altPattern && subMap[altPattern]) || subMap['skill_test_3'] || subMap['week2'] ||
                    subMap['skill_test_3_B1'] || subMap['skill_test_3_B2'] || subMap['skill_test_3_A1'] || subMap['skill_test_3_A2']) {
                  hasSubmitted = true;
                }
              } else if (isSkillTest2) {
                if (subMap[pattern] || (altPattern && subMap[altPattern]) || subMap['skill_test_2'] || subMap['week1'] ||
                    subMap['skill_test_2_B1'] || subMap['skill_test_2_B2'] || subMap['skill_test_2_A1'] || subMap['skill_test_2_A2']) {
                  hasSubmitted = true;
                }
              }
            }
          }

          // For Skill Tests, isCompleted is ONLY true if the mentor explicitly clicked "Send Report to Student"!
          let isCompleted = false;
          if (report) {
            if (isSkillTest) {
              isCompleted = report.isMentorSubmitted === true;
            } else {
              isCompleted = true;
            }
          }

          newStatuses[student.email] = { isCompleted, hasSubmitted };
        });

        await Promise.all(promises);
        setSubmissionStatuses(newStatuses);
      };
      loadStatuses();
    }
  }, [isMentor, students, pattern]);

  // Auto-save draft when marks change
  useEffect(() => {
    if (isMentor && selectedStudent && !isSent && isLoaded) {
      const draftKey = `weeklyReportDraft_${selectedStudent.email}_${pattern}`;
      localStorage.setItem(draftKey, JSON.stringify(marks));
    }
  }, [marks, isMentor, selectedStudent, pattern, isSent, isLoaded]);

  const handleOpenPdf = (dataUrl?: string, name?: string) => {
    if (!dataUrl) {
      alert(`The file data for "${name || 'this document'}" is missing.\n\nFor older exams/submissions created before this feature was fully enabled, the actual file content was not saved to the server (only the file name was saved).`);
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

  const handleSendReport = async () => {
    if (!selectedStudent) return;
    
    const sEmail = (selectedStudent.email || '').toLowerCase().trim();
    const key = `weeklyReport_${sEmail}_${pattern}`;
    const reportData: Marks = {
      ...marks,
      isMentorSubmitted: true,
      submittedAt: new Date().toISOString()
    };
    
    // Save locally
    localStorage.setItem(key, JSON.stringify(reportData));
    await saveToCloudflare(key, reportData);

    if (pattern === 'skill_test_3' || isSkillTest3) {
      const altKey = `weeklyReport_${sEmail}_week2`;
      localStorage.setItem(altKey, JSON.stringify(reportData));
      await saveToCloudflare(altKey, reportData);
      const skillKey = `weeklyReport_${sEmail}_skill_test_3`;
      localStorage.setItem(skillKey, JSON.stringify(reportData));
      await saveToCloudflare(skillKey, reportData);
      if (selectedStudent.batch) {
        const batchKey = `weeklyReport_${sEmail}_skill_test_3_${selectedStudent.batch}`;
        localStorage.setItem(batchKey, JSON.stringify(reportData));
        await saveToCloudflare(batchKey, reportData);
      }
    } else if (pattern === 'skill_test_2' || isSkillTest2) {
      const altKey = `weeklyReport_${sEmail}_week1`;
      localStorage.setItem(altKey, JSON.stringify(reportData));
      await saveToCloudflare(altKey, reportData);
      const skillKey = `weeklyReport_${sEmail}_skill_test_2`;
      localStorage.setItem(skillKey, JSON.stringify(reportData));
      await saveToCloudflare(skillKey, reportData);
      if (selectedStudent.batch) {
        const batchKey = `weeklyReport_${sEmail}_skill_test_2_${selectedStudent.batch}`;
        localStorage.setItem(batchKey, JSON.stringify(reportData));
        await saveToCloudflare(batchKey, reportData);
      }
    } else if (pattern === 'week1') {
      const altKey = `weeklyReport_${sEmail}_skill_test_2`;
      localStorage.setItem(altKey, JSON.stringify(reportData));
      await saveToCloudflare(altKey, reportData);
    }
    
    // Update local statuses so dashboard updates immediately to Completed
    setSubmissionStatuses(prev => ({
      ...prev,
      [selectedStudent.email]: { isCompleted: true, hasSubmitted: true },
      [sEmail]: { isCompleted: true, hasSubmitted: true }
    }));

    setIsSent(true);
    setTimeout(() => {
      setSelectedStudent(null);
    }, 2000);
  };

  const handleGrantStudentReExam = async () => {
    if (!selectedStudent) return;
    const confirmMsg = `Grant Re-Exam for ${selectedStudent.name} (${selectedStudent.email}) on "${isSkillTest3 ? 'Skill Test 3' : (isSkillTest2 ? 'Skill Test 2' : pattern)}"?\n\nThis will reset their existing submission and allow them to take the exam again immediately.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const sEmail = (selectedStudent.email || '').toLowerCase().trim();
      const sBatch = selectedStudent.batch || '';
      
      await resetStudentSubmissionForExam(sEmail, pattern, sBatch);

      setSubmissionStatuses(prev => ({
        ...prev,
        [selectedStudent.email]: { isCompleted: false, hasSubmitted: false },
        [sEmail]: { isCompleted: false, hasSubmitted: false }
      }));

      alert(`Re-Exam granted successfully for ${selectedStudent.name}! They can now retake this exam.`);
      setSelectedStudent(null);
    } catch (e) {
      console.error("Failed to grant re-exam in report:", e);
      alert("Failed to grant re-exam. Please try again.");
    }
  };

  if (!isMentor) {
    // Student View
    const displayPatternName = isSkillTest3 ? 'Skill Test 3' : (isSkillTest2 ? 'Skill Test 2' : pattern);
    return (
      <div className="w-full max-w-3xl mx-auto space-y-6 pb-12">
        <div className="flex items-center gap-3 text-gray-900 font-bold text-2xl mb-8">
          <FileText className="text-orange-500" size={28} /> 
          {displayPatternName} Report
        </div>
        
        {studentReport ? (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
            <div className="space-y-4 text-lg">
              {isSkillTest ? (
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="font-medium text-gray-700">Multiple Choice Questions (20 MCQs)</span>
                  <span className="font-bold text-primary">{studentReport.theory} / 20</span>
                </div>
              ) : (
                <>
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
                </>
              )}
              <div className="flex justify-between items-center pt-4">
                <span className="font-black text-gray-900 text-xl">Total Score</span>
                <span className="font-black text-primary text-2xl">
                  {isSkillTest 
                    ? `${Number(studentReport.theory)} / 20`
                    : `${Number(studentReport.project) + (isCie ? 0 : Number(studentReport.portfolio)) + Number(studentReport.theory) + Number(studentReport.attendance) + Number(studentReport.mentor)} / ${isCie ? 50 : 20}`}
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
      const status = submissionStatuses[student.email] || { isCompleted: false, hasSubmitted: false };
      
      if (status.isCompleted) {
        stats.completed++;
      } else if (status.hasSubmitted) {
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
        {isSkillTest3 ? 'Skill Test 3' : (isSkillTest2 ? 'Skill Test 2' : pattern)} Evaluation
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
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-base text-gray-900">Select Student to Grade</h3>
            <div className="relative w-full sm:w-72 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input 
                type="text" 
                placeholder="Search students..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-xs transition-all"
              />
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredStudents.length > 0 ? (
              filteredStudents.map(student => {
                const status = submissionStatuses[student.email] || { isCompleted: false, hasSubmitted: false };
                const isCompleted = status.isCompleted;
                const hasSubmitted = status.hasSubmitted;
                
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
                      ) : (
                        <>
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
                              className="flex items-center gap-1.5 text-sm font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-6 py-1.5 rounded-lg transition-all cursor-pointer border border-orange-200"
                            >
                              Pending
                            </button>
                          )}
                          <button 
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm(`Grant Re-Exam for ${student.name} on "${isSkillTest3 ? 'Skill Test 3' : (isSkillTest2 ? 'Skill Test 2' : pattern)}"?`)) {
                                await resetStudentSubmissionForExam((student.email || '').toLowerCase().trim(), pattern, student.batch || '');
                                setSubmissionStatuses(prev => ({
                                  ...prev,
                                  [student.email]: { isCompleted: false, hasSubmitted: false }
                                }));
                                alert(`Re-Exam granted for ${student.name}!`);
                              }
                            }}
                            className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                            title="Grant Re-Exam for this student"
                          >
                            <RotateCcw size={13} /> Re-Exam
                          </button>
                        </>
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
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs relative">
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
              {!isSkillTest && (
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
                      <>
                        <span className="text-sm text-blue-600">{studentSubmission.projectPdfName}</span>
                        {(studentSubmission as any).projectPdfDataUrl && (
                          <button type="button" onClick={() => handleOpenPdf((studentSubmission as any).projectPdfDataUrl, studentSubmission.projectPdfName)} className="text-sm text-primary hover:underline font-bold ml-2">
                            View PDF
                          </button>
                        )}
                      </>
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
              )}

              {/* Portfolio line */}
              {!isSkillTest && !isCie && (
                <div className="flex items-center flex-wrap gap-4 justify-between border-b border-blue-100/50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-blue-800">Portfolio PDF: </span>
                    {studentSubmission.portfolioPdfName ? (
                      <>
                        <span className="text-sm text-blue-600">{studentSubmission.portfolioPdfName}</span>
                        {(studentSubmission as any).portfolioPdfDataUrl && (
                          <button type="button" onClick={() => handleOpenPdf((studentSubmission as any).portfolioPdfDataUrl, studentSubmission.portfolioPdfName)} className="text-sm text-primary hover:underline font-bold ml-2">
                            View PDF
                          </button>
                        )}
                      </>
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

              {!isSkillTest && (
                <div className="flex items-center flex-wrap gap-4 justify-between border-b border-blue-100/50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-700">Question PDF: </span>
                    {targetExam?.theoryPdfName && targetExam?.theoryPdfName !== 'theory_assignment.pdf' ? (
                      <>
                        <span className="text-sm text-gray-600">{targetExam.theoryPdfName}</span>
                        {targetExam.theoryPdfDataUrl && (
                          <button type="button" onClick={() => handleOpenPdf(targetExam.theoryPdfDataUrl, targetExam.theoryPdfName)} className="text-sm text-primary hover:underline font-bold ml-2">
                            View Question PDF
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">None</span>
                    )}
                  </div>
                </div>
              )}

              {/* Theory / MCQ line */}
              <div className="flex flex-col gap-3 border-b border-blue-100/50 pb-4">
                <div className="flex items-center flex-wrap gap-4 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-blue-800">{isSkillTest3 ? 'Skill Test 3 (20 MCQs): ' : (isSkillTest2 ? 'Skill Test 2 (20 MCQs): ' : 'Theory Answers PDF: ')}</span>
                    {!isSkillTest && (studentSubmission.theoryAnswerPdfName ? (
                      <>
                        <span className="text-sm text-blue-600">{studentSubmission.theoryAnswerPdfName}</span>
                        {studentSubmission.theoryAnswerPdfDataUrl && (
                          <button type="button" onClick={() => handleOpenPdf(studentSubmission.theoryAnswerPdfDataUrl, studentSubmission.theoryAnswerPdfName)} className="text-sm text-primary hover:underline font-bold ml-2">
                            View PDF
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">Not uploaded</span>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" min="0" max={isSkillTest ? "20" : (isCie ? "10" : "5")} placeholder="Marks" 
                      value={theoryEvalInput} 
                      onChange={e => setTheoryEvalInput(e.target.value)} 
                      className="w-16 px-2 py-1 text-sm border border-blue-200 rounded focus:outline-none focus:border-blue-400" 
                    />
                    <button 
                      onClick={() => {
                        const val = Number(theoryEvalInput);
                        if (isSkillTest) {
                          setMarks({ project: 0, portfolio: 0, attendance: 0, mentor: 0, theory: val });
                        } else {
                          setMarks({...marks, theory: val});
                        }
                      }} 
                      className="px-3 py-1 text-xs font-bold text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700 transition-colors"
                    >
                      Evaluate
                    </button>
                  </div>
                </div>
                
                {!isSkillTest && (studentSubmission as any).theoryTextAnswer && (
                  <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Typed Answer:</h4>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{(studentSubmission as any).theoryTextAnswer}</p>
                  </div>
                )}

                {/* MCQ Evaluation Display */}
                {studentSubmission.theoryAnswers && Array.isArray(studentSubmission.theoryAnswers) && (() => {
                  const questions = getQuestionsForStudent(selectedStudent, studentSubmission);
                  if (!questions || questions.length === 0) return null;

                  const correctCount = questions.reduce((acc: number, q: any, idx: number) => {
                    return acc + (studentSubmission.theoryAnswers[idx] === q.answerIndex ? 1 : 0);
                  }, 0);
                  const total = questions.length;
                  const maxMark = isSkillTest ? 20 : (isCie ? 10 : 5);
                  const calculatedMark = isSkillTest ? correctCount : Math.round((correctCount / total) * maxMark);

                  return (
                    <div className="space-y-3 mt-2">
                      <div className="bg-white p-4 rounded-xl border-2 border-green-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-sm font-bold text-gray-900">MCQ Objective Score:</span>
                          <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-black rounded-lg border border-green-200">
                            {correctCount} / {total} Correct ({Math.round((correctCount / total) * 100)}%)
                          </span>
                          <span className="text-xs font-bold text-green-800 bg-green-100/60 px-2.5 py-1 rounded-md">
                            Score: {calculatedMark} / {maxMark} Marks
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowQuestionsReview(!showQuestionsReview)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                          >
                            {showQuestionsReview ? 'Hide Answers' : 'Show Answers'}
                            {showQuestionsReview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTheoryEvalInput(String(calculatedMark));
                              if (isSkillTest) {
                                setMarks({ project: 0, portfolio: 0, attendance: 0, mentor: 0, theory: calculatedMark });
                              } else {
                                setMarks(prev => ({ ...prev, theory: calculatedMark }));
                              }
                            }}
                            className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:bg-orange-600 transition-colors"
                          >
                            Set {calculatedMark}M
                          </button>
                        </div>
                      </div>

                      {showQuestionsReview && (
                        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4 max-h-[450px] overflow-y-auto divide-y divide-gray-100">
                          <h5 className="font-bold text-xs uppercase tracking-wider text-gray-500 pb-2">Student Answers Breakdown ({total} Questions)</h5>
                          {questions.map((q: any, idx: number) => {
                            const studentAnsIdx = studentSubmission.theoryAnswers[idx];
                            const isCorrect = studentAnsIdx === q.answerIndex;
                            return (
                              <div key={idx} className="pt-3 first:pt-0 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-bold text-gray-900">
                                    {idx + 1}. {(q.question || `Question ${idx + 1}`).replace(/^\d+[\.\)]\s*/, '')}
                                  </p>
                                  {studentAnsIdx !== undefined ? (
                                    isCorrect ? (
                                      <span className="shrink-0 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-bold rounded border border-green-200 flex items-center gap-1">
                                        <Check size={12} /> Correct
                                      </span>
                                    ) : (
                                      <span className="shrink-0 px-2 py-0.5 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-200 flex items-center gap-1">
                                        <X size={12} /> Wrong
                                      </span>
                                    )
                                  ) : (
                                    <span className="shrink-0 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-bold rounded">
                                      Skipped
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  {q.options.map((opt: string, optIdx: number) => {
                                    const isChosen = studentAnsIdx === optIdx;
                                    const isRight = optIdx === q.answerIndex;
                                    let bg = 'bg-gray-50 border-gray-200 text-gray-700';
                                    if (isRight) bg = 'bg-green-50 border-green-300 text-green-900 font-bold';
                                    if (isChosen && !isRight) bg = 'bg-red-50 border-red-300 text-red-900 font-bold line-through';

                                    return (
                                      <div key={optIdx} className={`p-2 rounded-lg border flex items-center justify-between ${bg}`}>
                                        <span><strong>{String.fromCharCode(65 + optIdx)}.</strong> {opt}</span>
                                        {isChosen && <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-white/80 rounded border">Student</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Attendance line */}
              {!isSkillTest && (
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
              )}

              {/* Mentor line */}
              {!isSkillTest && (
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
              )}
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
            {isSkillTest ? (
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-primary/20">
                <div>
                  <label className="font-bold text-gray-800 block text-base">Multiple Choice Questions</label>
                  <span className="text-xs text-gray-500">20 MCQs (1 Mark each, Max 20 Marks)</span>
                </div>
                <input 
                  type="number" min="0" max={20} 
                  value={marks.theory} onChange={(e) => setMarks({ project: 0, portfolio: 0, attendance: 0, mentor: 0, theory: Number(e.target.value) })}
                  className="w-24 px-3 py-2 border-2 border-primary rounded-xl text-center font-bold text-primary text-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ) : (
              <>
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
            </>
          )}
          
          <div className="flex items-center justify-between p-4 border-t-2 border-gray-100">
            <span className="font-bold text-gray-900 text-lg">Total Score</span>
            <span className="font-black text-primary text-2xl">
              {isSkillTest 
                ? `${Number(marks.theory)} / 20` 
                : `${Number(marks.project) + (isCie ? 0 : Number(marks.portfolio)) + Number(marks.theory) + Number(marks.attendance) + Number(marks.mentor)} / ${isCie ? 50 : 20}`}
            </span>
          </div>

            <div className="flex justify-end gap-2.5 pt-4">
              <button 
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 rounded-lg font-medium text-xs text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 shadow-xs transition-colors cursor-pointer"
              >
                Hide / Save Draft
              </button>
              <button 
                type="button"
                onClick={handleGrantStudentReExam}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 shadow-xs transition-colors cursor-pointer"
                title="Reset this student's submission and allow them to retake the exam"
              >
                <RotateCcw size={15} />
                Grant Re-Exam
              </button>
              <button 
                onClick={handleSendReport}
                disabled={isSent}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-xs text-white shadow-xs transition-colors cursor-pointer ${isSent ? 'bg-emerald-600' : 'bg-primary hover:bg-primary-dark'}`}
              >
                {isSent ? (
                  <><CheckCircle2 size={15} /> Sent Successfully!</>
                ) : (
                  <><Send size={15} /> Send Report to Student</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
