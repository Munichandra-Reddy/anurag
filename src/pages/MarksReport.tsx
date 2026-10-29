import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, ClipboardList, Search, Download, RefreshCw, Award, CheckCircle2, Upload } from 'lucide-react';
import { getFromCloudflare, saveToCloudflare, getStudentsKey, isMuniUser, getMentorKey } from '../utils/cloudflare';
import { MUNI_STUDENTS } from '../data/students';
import { getJumbledSkillTest4Questions } from '../data/solidworksSkillTest4Questions';

interface MarksReportProps {
  isFacultyView?: boolean;
}

export interface ConductedExam {
  id: string;
  title: string;
  maxMarks?: number | string;
  category: 'graph' | 'pre' | 'weekly' | 'custom';
}

const DEFAULT_CONDUCTED_EXAMS: ConductedExam[] = [
  { id: 'graph_exam', title: 'Graph Exam 1', category: 'graph', maxMarks: 20 },
  { id: 'graph_exam_2', title: 'Graph Exam 2', category: 'graph', maxMarks: 20 },
  { id: 'pre_assessment', title: 'Pre Assessment', category: 'pre', maxMarks: 30 },
  { id: 'skill_test_2', title: 'Skill Test 2', category: 'weekly', maxMarks: 20 },
  { id: 'skill_test_3', title: 'Skill Test 3', category: 'weekly', maxMarks: 20 },
  { id: 'skill_test_4', title: 'Skill Test 4', category: 'weekly', maxMarks: 10 },
  { id: 'skill_test_5', title: 'Skill Test 5', category: 'weekly', maxMarks: 20 }
];

const MarksReport: React.FC<MarksReportProps> = ({ isFacultyView = false }) => {
  const loggedInEmail = (sessionStorage.getItem('loggedInEmail') || localStorage.getItem('loggedInEmail') || '').toLowerCase().trim();
  const userIsMuni = isMuniUser(loggedInEmail) || loggedInEmail === 'muni@geonixa.com';
  const CACHE_KEY = `anuragLms_marksReport_cache_${userIsMuni ? 'muni' : 'default'}`;

  // Instant synchronous initialization from local cache to open IMMEDIATELY with 0ms delay!
  const [students, setStudents] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.students) && parsed.students.length > 0) return parsed.students;
      }
    } catch (e) {}
    return userIsMuni ? MUNI_STUDENTS : [];
  });

  const [marksData, setMarksData] = useState<Record<string, Record<string, number | string>>>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.marksData) return parsed.marksData;
      }
    } catch (e) {}
    return {};
  });

  const [conductedExams, setConductedExams] = useState<ConductedExam[]>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.conductedExams) && parsed.conductedExams.length > 0) {
          return parsed.conductedExams.map((e: ConductedExam) => {
            if (e.id === 'graph_exam' || e.id === 'graph_exam_2') return { ...e, maxMarks: 20 };
            if (e.id === 'pre_assessment') return { ...e, maxMarks: 30 };
            return e;
          });
        }
      }
    } catch (e) {}
    return DEFAULT_CONDUCTED_EXAMS;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // If local cache already exists or Muni default students are available, NEVER block with a full-screen spinner!
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) return false;
    } catch (e) {}
    return !userIsMuni;
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load and sync live data fast via parallel bulk queries
  const loadData = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);

    try {
      // 1. Faculty View: Read saved snapshot
      if (isFacultyView) {
        const snapshot = await getFromCloudflare('facultySnapshotMarks')
          || await getFromCloudflare('facultySnapshotMarks_muni')
          || JSON.parse(localStorage.getItem('facultySnapshotMarks') || 'null')
          || JSON.parse(localStorage.getItem('facultySnapshotMarks_muni') || 'null');

        if (snapshot) {
          setStudents(snapshot.students || []);
          setMarksData(snapshot.marksData || {});
          const snapExams = (snapshot.conductedExams || DEFAULT_CONDUCTED_EXAMS).map((e: ConductedExam) => {
            if (e.id === 'graph_exam' || e.id === 'graph_exam_2') return { ...e, maxMarks: 20 };
            if (e.id === 'pre_assessment') return { ...e, maxMarks: 30 };
            return e;
          });
          setConductedExams(snapExams);
          setIsSubmitted(true);
        } else {
          setIsSubmitted(false);
        }
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const studentsKey = getStudentsKey(loggedInEmail);
      const examsKey = getMentorKey('anuragLmsWeeklyExams', loggedInEmail);

      // 2. High-speed parallel bulk fetches for all dictionary data
      const [
        cloudStudents,
        cloudGraphMarks,
        cloudGraph2Marks,
        cloudPreMarks,
        cloudExams,
        cloudSnap1,
        cloudSnap2
      ] = await Promise.all([
        getFromCloudflare(studentsKey),
        getFromCloudflare('graphExamMarks_muni'),
        getFromCloudflare('graphExam2Marks_muni'),
        getFromCloudflare('preAssessmentManualMarks_muni'),
        getFromCloudflare(examsKey) || (userIsMuni ? getFromCloudflare('anuragLmsWeeklyExams_muni@geonixa.com') : Promise.resolve(null)),
        getFromCloudflare('facultySnapshotMarks'),
        getFromCloudflare('facultySnapshotMarks_muni')
      ]);
      const cloudSnapshot = cloudSnap1 || cloudSnap2;

      const localStudents = JSON.parse(localStorage.getItem(studentsKey) || '[]');
      const localGraphMarks = JSON.parse(localStorage.getItem('graphExamMarks_muni') || '{}');
      const localGraph2Marks = JSON.parse(localStorage.getItem('graphExam2Marks_muni') || '{}');
      const localPreMarks = JSON.parse(localStorage.getItem('preAssessmentManualMarks_muni') || '{}');
      const localExams = JSON.parse(localStorage.getItem(examsKey) || (userIsMuni ? localStorage.getItem('anuragLmsWeeklyExams_muni@geonixa.com') : null) || '[]');

      const mergedGraphMarks = { ...(localGraphMarks || {}), ...(cloudGraphMarks || {}) };
      const mergedGraph2Marks = { ...(localGraph2Marks || {}), ...(cloudGraph2Marks || {}) };
      const mergedPreMarks = { ...(localPreMarks || {}), ...(cloudPreMarks || {}) };

      // 3. Assemble complete student list with Roll Numbers & Batches
      const studentMap = new Map();
      if (userIsMuni) {
        MUNI_STUDENTS.forEach(s => {
          if (s && s.email) {
            const clean = s.email.toLowerCase().trim();
            studentMap.set(clean, { 
              ...s, 
              email: clean, 
              roll: s.roll || '', 
              batch: s.batch || 'A1' 
            });
          }
        });
      }

      [...(localStudents || []), ...(cloudStudents || [])].forEach((s: any) => {
        if (s && s.email) {
          const clean = s.email.toLowerCase().trim();
          const existing = studentMap.get(clean) || {};
          studentMap.set(clean, {
            ...existing,
            ...s,
            email: clean,
            roll: s.roll || existing.roll || '',
            batch: s.batch || existing.batch || 'A1',
            name: s.name || existing.name || clean.split('@')[0]
          });
        }
      });

      const registeredStudents = Array.from(studentMap.values());
      setStudents(registeredStudents);

      // 4. Assemble dynamic list of conducted exams
      const examList: ConductedExam[] = [
        { id: 'graph_exam', title: 'Graph Exam 1', category: 'graph', maxMarks: 20 },
        { id: 'graph_exam_2', title: 'Graph Exam 2', category: 'graph', maxMarks: 20 },
        { id: 'pre_assessment', title: 'Pre Assessment', category: 'pre', maxMarks: 30 },
        { id: 'skill_test_2', title: 'Skill Test 2', category: 'weekly', maxMarks: 20 },
        { id: 'skill_test_3', title: 'Skill Test 3', category: 'weekly', maxMarks: 20 },
        { id: 'skill_test_4', title: 'Skill Test 4', category: 'weekly', maxMarks: 10 },
        { id: 'skill_test_5', title: 'Skill Test 5', category: 'weekly', maxMarks: 20 }
      ];

      // Add any additional exams conducted by the mentor (e.g. CIE1, CIE2, SEM, or future exams)
      const weeklyExams = Array.isArray(cloudExams) && cloudExams.length > 0 ? cloudExams : (Array.isArray(localExams) ? localExams : []);
      weeklyExams.forEach((exam: any) => {
        if (!exam || !exam.id) return;
        const examId = exam.id.trim();
        // Ignore internal Skill Test 2, 3, 4, 5 variants since we already have the dedicated Skill Test columns
        if (
          examId === 'skill_test_2' || 
          examId.startsWith('skill_test_2_') || 
          examId === 'week1' || 
          examId.startsWith('week1_') || 
          examId === 'skill_test_3' || 
          examId.startsWith('skill_test_3_') || 
          examId === 'week2' || 
          examId.startsWith('week2_') || 
          examId === 'skill_test_4' || 
          examId.startsWith('skill_test_4_') || 
          examId === 'week3' || 
          examId.startsWith('week3_') || 
          examId === 'skill_test_5' || 
          examId.startsWith('skill_test_5_') || 
          examId === 'week4' || 
          examId.startsWith('week4_') || 
          (exam.title && (
            exam.title.toLowerCase().includes('skill test 2') || 
            exam.title.toLowerCase().includes('skill test 3') || 
            exam.title.toLowerCase().includes('skill test 4') || 
            exam.title.toLowerCase().includes('skill test 5')
          ))
        ) {
          return;
        }

        if (!examList.some(e => e.id === examId)) {
          examList.push({
            id: examId,
            title: exam.title || examId.toUpperCase(),
            category: 'weekly',
            maxMarks: examId.startsWith('CIE') ? 50 : 20
          });
        }
      });

      setConductedExams(examList);

      // 5. Build consolidated marks dictionary for all students
      const allMarks: Record<string, Record<string, number | string>> = {};

      registeredStudents.forEach(student => {
        const sEmail = (student.email || '').toLowerCase().trim();
        allMarks[sEmail] = {};

        // (a) Graph Exam 1 (Instant from memory dictionary!)
        const graphVal = mergedGraphMarks[sEmail];
        allMarks[sEmail]['graph_exam'] = (graphVal !== undefined && graphVal !== null && graphVal !== '') ? graphVal : '-';

        // (b) Graph Exam 2 (Instant from memory dictionary!)
        const graph2Val = mergedGraph2Marks[sEmail];
        allMarks[sEmail]['graph_exam_2'] = (graph2Val !== undefined && graph2Val !== null && graph2Val !== '') ? graph2Val : '-';

        // (c) Pre Assessment (Instant from memory dictionary!)
        const preVal = mergedPreMarks[sEmail];
        allMarks[sEmail]['pre_assessment'] = (preVal !== undefined && preVal !== null && preVal !== '') ? preVal : '-';
      });

      // (c) Weekly exams (Skill Test 2, Skill Test 3, and any additional weekly exams)
      // Fetched in fast parallel chunks of 25 so it completes in ~1 second without freezing the UI
      const otherWeeklyExams = examList.filter(e => e.category === 'weekly');
      const chunkSize = 25;

      for (let i = 0; i < registeredStudents.length; i += chunkSize) {
        const chunk = registeredStudents.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (student) => {
          const sEmail = (student.email || '').toLowerCase().trim();

          // 1. Skill Test 2
          const st2Keys = [
            `weeklyReport_${sEmail}_skill_test_2`,
            `weeklyReport_${sEmail}_week1`,
            student.batch ? `weeklyReport_${sEmail}_skill_test_2_${student.batch}` : null,
            `weeklyReport_${sEmail}_skill_test_2_B1`,
            `weeklyReport_${sEmail}_skill_test_2_B2`,
            `weeklyReport_${sEmail}_skill_test_2_A1`,
            `weeklyReport_${sEmail}_skill_test_2_A2`
          ].filter(Boolean) as string[];

          let st2Report: any = null;
          for (const k of st2Keys) {
            try {
              const loc = JSON.parse(localStorage.getItem(k) || 'null');
              if (loc && (loc.isMentorSubmitted === true || loc.theory !== undefined)) {
                st2Report = loc;
                break;
              }
            } catch (e) {}
          }

          if (!st2Report) {
            for (const k of st2Keys) {
              const cld = await getFromCloudflare(k);
              if (cld && (cld.isMentorSubmitted === true || cld.theory !== undefined)) {
                st2Report = cld;
                break;
              }
            }
          }

          if (st2Report && (st2Report.isMentorSubmitted === true || !userIsMuni)) {
            allMarks[sEmail]['skill_test_2'] = st2Report.theory !== undefined ? st2Report.theory : (st2Report.total ?? '-');
          } else {
            allMarks[sEmail]['skill_test_2'] = '-';
          }

          // 2. Skill Test 3
          const st3Keys = [
            `weeklyReport_${sEmail}_skill_test_3`,
            `weeklyReport_${sEmail}_week2`,
            student.batch ? `weeklyReport_${sEmail}_skill_test_3_${student.batch}` : null,
            `weeklyReport_${sEmail}_skill_test_3_B1`,
            `weeklyReport_${sEmail}_skill_test_3_B2`,
            `weeklyReport_${sEmail}_skill_test_3_A1`,
            `weeklyReport_${sEmail}_skill_test_3_A2`
          ].filter(Boolean) as string[];

          let st3Report: any = null;
          for (const k of st3Keys) {
            try {
              const loc = JSON.parse(localStorage.getItem(k) || 'null');
              if (loc && (loc.isMentorSubmitted === true || loc.theory !== undefined)) {
                st3Report = loc;
                break;
              }
            } catch (e) {}
          }

          if (!st3Report) {
            for (const k of st3Keys) {
              const cld = await getFromCloudflare(k);
              if (cld && (cld.isMentorSubmitted === true || cld.theory !== undefined)) {
                st3Report = cld;
                break;
              }
            }
          }

          if (st3Report && (st3Report.isMentorSubmitted === true || !userIsMuni)) {
            allMarks[sEmail]['skill_test_3'] = st3Report.theory !== undefined ? st3Report.theory : (st3Report.total ?? '-');
          } else {
            allMarks[sEmail]['skill_test_3'] = '-';
          }

          // 3. Skill Test 4
          const st4Keys = [
            `weeklyReport_${sEmail}_skill_test_4`,
            `weeklyReport_${sEmail}_week3`,
            student.batch ? `weeklyReport_${sEmail}_skill_test_4_${student.batch}` : null,
            `weeklyReport_${sEmail}_skill_test_4_B1`,
            `weeklyReport_${sEmail}_skill_test_4_B2`,
            `weeklyReport_${sEmail}_skill_test_4_A1`,
            `weeklyReport_${sEmail}_skill_test_4_A2`
          ].filter(Boolean) as string[];

          let st4Report: any = null;
          for (const k of st4Keys) {
            try {
              const loc = JSON.parse(localStorage.getItem(k) || 'null');
              if (loc && (loc.isMentorSubmitted === true || loc.theory !== undefined)) {
                st4Report = loc;
                break;
              }
            } catch (e) {}
          }

          if (!st4Report) {
            for (const k of st4Keys) {
              const cld = await getFromCloudflare(k);
              if (cld && (cld.isMentorSubmitted === true || cld.theory !== undefined)) {
                st4Report = cld;
                break;
              }
            }
          }

          if (st4Report && (st4Report.isMentorSubmitted === true || !userIsMuni)) {
            let quizM = Number(st4Report.theory || 0);
            const subKey = `weeklyReportSubmission_${sEmail}_skill_test_4`;
            try {
              const sub = JSON.parse(localStorage.getItem(subKey) || 'null');
              if (sub && Array.isArray(sub.theoryAnswers) && sub.theoryAnswers.length > 0) {
                const jumbled = getJumbledSkillTest4Questions(sEmail);
                quizM = jumbled.reduce((acc: number, q: any, idx: number) => acc + (sub.theoryAnswers[idx] === q.answerIndex ? 1 : 0), 0);
              }
            } catch (e) {}
            // Graph exam marks are not considered, so only quiz marks out of 10
            allMarks[sEmail]['skill_test_4'] = (st4Report.theory !== undefined)
              ? quizM
              : (st4Report.total ?? '-');
          } else {
            allMarks[sEmail]['skill_test_4'] = '-';
          }

          // 4. Skill Test 5
          const st5Keys = [
            `weeklyReport_${sEmail}_skill_test_5`,
            `weeklyReport_${sEmail}_week4`,
            student.batch ? `weeklyReport_${sEmail}_skill_test_5_${student.batch}` : null,
            `weeklyReport_${sEmail}_skill_test_5_B1`,
            `weeklyReport_${sEmail}_skill_test_5_B2`,
            `weeklyReport_${sEmail}_skill_test_5_A1`,
            `weeklyReport_${sEmail}_skill_test_5_A2`
          ].filter(Boolean) as string[];

          let st5Report: any = null;
          for (const k of st5Keys) {
            try {
              const loc = JSON.parse(localStorage.getItem(k) || 'null');
              if (loc && (loc.isMentorSubmitted === true || loc.theory !== undefined)) {
                st5Report = loc;
                break;
              }
            } catch (e) {}
          }

          if (!st5Report) {
            for (const k of st5Keys) {
              const cld = await getFromCloudflare(k);
              if (cld && (cld.isMentorSubmitted === true || cld.theory !== undefined)) {
                st5Report = cld;
                break;
              }
            }
          }

          if (st5Report && (st5Report.isMentorSubmitted === true || !userIsMuni)) {
            allMarks[sEmail]['skill_test_5'] = st5Report.theory !== undefined ? st5Report.theory : (st5Report.total ?? '-');
          } else {
            allMarks[sEmail]['skill_test_5'] = '-';
          }

          // 5. Pre Assessment fallback (if not in manual marks dict)
          if (allMarks[sEmail]['pre_assessment'] === '-') {
            try {
              const preSub = JSON.parse(localStorage.getItem(`preAssessmentSubmissions_${sEmail}`) || 'null');
              if (preSub && typeof preSub === 'object') {
                const subValues = Object.values(preSub) as any[];
                const firstWithMarks = subValues.find(v => v?.marks?.total !== undefined);
                if (firstWithMarks) {
                  allMarks[sEmail]['pre_assessment'] = firstWithMarks.marks.total;
                }
              }
            } catch (e) {}
          }

          // 6. Any other custom weekly exams
          for (const extraExam of otherWeeklyExams) {
            if (
              extraExam.id === 'skill_test_2' || 
              extraExam.id === 'skill_test_3' || 
              extraExam.id === 'skill_test_4' || 
              extraExam.id === 'skill_test_5'
            ) continue;

            let exReport: any = null;
            try {
              exReport = JSON.parse(localStorage.getItem(`weeklyReport_${sEmail}_${extraExam.id}`) || 'null');
            } catch (e) {}

            if (!exReport) {
              exReport = await getFromCloudflare(`weeklyReport_${sEmail}_${extraExam.id}`);
            }

            if (exReport) {
              const isCie = extraExam.id.startsWith('CIE') || extraExam.id.startsWith('SEM');
              const total = Number(exReport.project || 0) + 
                            (isCie ? 0 : Number(exReport.portfolio || 0)) + 
                            Number(exReport.theory || 0) + 
                            Number(exReport.attendance || 0) + 
                            Number(exReport.mentor || 0);
              allMarks[sEmail][extraExam.id] = total;
            } else {
              allMarks[sEmail][extraExam.id] = '-';
            }
          }
        }));
      }

      setMarksData(allMarks);

      // Save to local cache so future visits open in 0 ms
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          students: registeredStudents,
          marksData: allMarks,
          conductedExams: examList
        }));
      } catch (e) {}

      // Check if current live data has new or updated marks compared to faculty snapshot
      const localSnap = JSON.parse(localStorage.getItem('facultySnapshotMarks') || localStorage.getItem('facultySnapshotMarks_muni') || 'null');
      const facultySnapshot = cloudSnapshot || localSnap;

      let hasNewOrUpdatedMarks = false;
      if (!facultySnapshot || !facultySnapshot.marksData) {
        hasNewOrUpdatedMarks = true;
      } else {
        const snapMarks = facultySnapshot.marksData || {};
        for (const student of registeredStudents) {
          const sEmail = (student.email || '').toLowerCase().trim();
          const liveStudentMarks = allMarks[sEmail] || {};
          const snapStudentMarks = snapMarks[sEmail] || {};

          for (const exam of examList) {
            const liveVal = String(liveStudentMarks[exam.id] ?? liveStudentMarks[exam.title] ?? '-').trim();
            const snapVal = String(snapStudentMarks[exam.id] ?? snapStudentMarks[exam.title] ?? '-').trim();
            if (liveVal !== snapVal) {
              hasNewOrUpdatedMarks = true;
              break;
            }
          }
          if (hasNewOrUpdatedMarks) break;
        }

        // Also check if any exams are newly added compared to the snapshot
        if (!hasNewOrUpdatedMarks) {
          const snapExamIds = new Set((facultySnapshot.conductedExams || []).map((e: any) => e.id));
          for (const exam of examList) {
            if (!snapExamIds.has(exam.id)) {
              hasNewOrUpdatedMarks = true;
              break;
            }
          }
        }
      }

      setIsSubmitted(!hasNewOrUpdatedMarks);

    } catch (error) {
      console.error("Failed to load marks report data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isFacultyView]);

  // Extract available unique batches for filtering
  const availableBatches = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.batch) set.add(s.batch.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  // Filter students based on search and batch dropdown
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (student.name && student.name.toLowerCase().includes(q)) ||
        (student.email && student.email.toLowerCase().includes(q)) ||
        (student.roll && student.roll.toLowerCase().includes(q));

      const matchesBatch = selectedBatch === 'ALL' || (student.batch && student.batch.trim() === selectedBatch);

      return matchesSearch && matchesBatch;
    });
  }, [students, searchQuery, selectedBatch]);

  // Download structured Excel Sheet (.csv with UTF-8 BOM for Microsoft Excel)
  const handleExportToExcel = () => {
    if (filteredStudents.length === 0) {
      alert("No students to export.");
      return;
    }

    // 1. Build Headers
    const headers = [
      'S.No',
      'Roll Number',
      'Student Name',
      'Email',
      'Batch',
      ...conductedExams.map(e => `"${e.title.replace(/"/g, '""')}"`)
    ];

    // 2. Build Data Rows
    const rows = filteredStudents.map((student, idx) => {
      const sEmail = (student.email || '').toLowerCase().trim();
      const examMarks = conductedExams.map(exam => {
        const val = marksData[sEmail]?.[exam.id] ?? marksData[sEmail]?.[exam.title] ?? '-';
        return `"${String(val).replace(/"/g, '""')}"`;
      });

      return [
        idx + 1,
        `"${(student.roll || '').replace(/"/g, '""')}"`,
        `"${(student.name || '').replace(/"/g, '""')}"`,
        `"${(student.email || '').replace(/"/g, '""')}"`,
        `"${(student.batch || '').replace(/"/g, '""')}"`,
        ...examMarks
      ].join(',');
    });

    // 3. Prepend UTF-8 Byte Order Mark (\uFEFF) so Excel opens with proper character encoding
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

    // 4. Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    const batchSuffix = selectedBatch !== 'ALL' ? `_${selectedBatch}` : '';
    link.download = `Anurag_LMS_Marks_Report${batchSuffix}_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Submit to Faculty
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const snapshotData = { marksData, students, conductedExams };
      const currentDataString = JSON.stringify(snapshotData);

      localStorage.setItem('facultySnapshotMarks', JSON.stringify(snapshotData));
      localStorage.setItem('facultySnapshotMarks_muni', JSON.stringify(snapshotData));
      localStorage.setItem('facultySnapshotHash_Marks', currentDataString);

      await Promise.all([
        saveToCloudflare('facultySnapshotMarks', snapshotData),
        saveToCloudflare('facultySnapshotMarks_muni', snapshotData),
        saveToCloudflare('facultySnapshotHash_Marks', currentDataString)
      ]);

      setIsSubmitted(true);
      alert('Marks successfully submitted to Faculty!');
    } catch (e) {
      console.error("Failed to submit to faculty:", e);
      alert("Submission encountered an issue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-9 h-9 animate-spin text-primary" />
        <span className="text-sm font-semibold text-gray-500">Loading Marks Report...</span>
      </div>
    );
  }

  if (isFacultyView && !isSubmitted) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center space-y-4 bg-white rounded-xl border border-gray-200 shadow-sm mt-8">
        <ClipboardList size={48} className="text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">Report Pending</h2>
        <p className="text-gray-500">The mentor has not yet submitted the Marks Report.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[98%] mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marks Report</h1>
          <p className="text-gray-500 mt-1">
            Consolidated marks across all exams conducted by mentor ({conductedExams.map(e => e.title).join(', ')}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-white text-gray-700 px-3.5 py-2 rounded-lg border border-gray-200 flex items-center gap-2 text-sm font-medium shadow-xs">
            <ClipboardList size={16} className="text-gray-500" />
            <span>Students: <strong className="text-gray-900 font-semibold">{students.length}</strong></span>
          </div>

          <div className="bg-white text-gray-700 px-3.5 py-2 rounded-lg border border-gray-200 flex items-center gap-2 text-sm font-medium shadow-xs">
            <Award size={16} className="text-gray-500" />
            <span>Exams: <strong className="text-gray-900 font-semibold">{conductedExams.length}</strong></span>
          </div>

          {/* Download Excel Button */}
          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium text-sm shadow-xs transition-colors cursor-pointer"
            title="Download formatted Excel sheet"
          >
            <Download size={16} className="text-green-700" />
            <span>Download Excel Sheet</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-2 text-gray-600 hover:text-primary bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-xs cursor-pointer"
            title="Refresh marks data"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-primary' : ''} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, roll no, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm font-medium"
          />
        </div>

        {/* Batch Filter Tabs */}
        {availableBatches.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedBatch('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedBatch === 'ALL'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Batches ({students.length})
            </button>
            {availableBatches.map(b => {
              const count = students.filter(s => s.batch && s.batch.trim() === b).length;
              return (
                <button
                  key={b}
                  onClick={() => setSelectedBatch(b)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedBatch === b
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {b} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Structured Marks Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12 text-center border-r border-gray-200">
                  #
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border-r border-gray-200">
                  Roll No
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border-r border-gray-200 sticky left-0 bg-gray-50 z-10 shadow-[1px_0_0_0_#e5e7eb]">
                  Student Name
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border-r border-gray-200">
                  Email
                </th>
                <th className="px-3 py-3.5 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center whitespace-nowrap border-r border-gray-200">
                  Batch
                </th>
                {conductedExams.map((exam, i) => (
                  <th
                    key={exam.id || i}
                    className="px-6 py-3.5 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center whitespace-nowrap border-r border-gray-200 bg-gray-50"
                  >
                    <div className="flex flex-col items-center">
                      <span>{exam.title.toUpperCase()}</span>
                      {exam.maxMarks && (
                        <span className="text-[10px] text-gray-500 font-normal normal-case">
                          Max: {exam.maxMarks}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student, idx) => {
                const sEmail = (student.email || '').toLowerCase().trim();
                const studentMarks = marksData[sEmail] || {};

                return (
                  <tr key={student.id || sEmail || idx} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 text-center text-xs text-gray-400 font-mono border-r border-gray-100">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono font-medium text-gray-700 whitespace-nowrap border-r border-gray-100">
                      {student.roll || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-100 shadow-[1px_0_0_0_#f3f4f6]">
                      {student.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap border-r border-gray-100">
                      {student.email}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap border-r border-gray-100">
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700 border border-gray-200">
                        {student.batch || 'A1'}
                      </span>
                    </td>

                    {conductedExams.map((exam) => {
                      const val = studentMarks[exam.id] ?? studentMarks[exam.title] ?? '-';
                      const hasMark = val !== '-' && val !== undefined && val !== null && val !== '';

                      return (
                        <td
                          key={exam.id}
                          className="px-6 py-3 text-center whitespace-nowrap border-r border-gray-100 last:border-r-0"
                        >
                          {hasMark ? (
                            <span className="text-sm font-semibold text-gray-900">
                              {val}
                            </span>
                          ) : (
                            <span className="text-gray-300 font-medium">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={conductedExams.length + 5}
                    className="px-6 py-12 text-center text-gray-500 font-medium"
                  >
                    No students match the selected filters or search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Footer Submit */}
      {!isFacultyView && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
          <p className="text-xs text-gray-500 font-medium">
            * All exams conducted by mentor appear dynamically in this table and can be exported as Excel sheets anytime.
          </p>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm text-white transition-colors shadow-xs flex items-center gap-2 cursor-pointer ${
              isSubmitted
                ? 'bg-green-700 hover:bg-green-800'
                : 'bg-primary hover:bg-orange-600'
            }`}
            title={
              isSubmitted
                ? 'All marks are up to date with Faculty. Click anytime to re-sync or force update.'
                : 'New marks detected! Click to submit updated marks to Faculty.'
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Submitting to Faculty...</span>
              </>
            ) : isSubmitted ? (
              <>
                <CheckCircle2 size={16} />
                <span>Submitted to Faculty</span>
              </>
            ) : (
              <>
                <Upload size={16} />
                <span>Submit to Faculty</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default MarksReport;
