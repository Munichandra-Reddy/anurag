import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, FileText, BarChart, 
  Search, RefreshCw, Award, ArrowUpRight, CheckCircle2
} from 'lucide-react';
import { getFromCloudflare, getStudentsKey, getMentorKey, isMuniUser } from '../utils/cloudflare';
import { MUNI_STUDENTS } from '../data/students';

interface StudentData {
  name: string;
  email: string;
  roll: string;
  batch: string;
}

interface ExamSummary {
  id: string;
  title: string;
  maxMarks: number;
  evaluatedCount: number;
  totalStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passCount: number;
}

interface BatchSummary {
  batch: string;
  studentCount: number;
  avgScore: number;
  graph1Avg: number;
  graph2Avg: number;
  preAvg: number;
  skill2Avg: number;
  skill3Avg: number;
}

export const MentorDashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const loggedInEmail = (sessionStorage.getItem('loggedInEmail') || localStorage.getItem('loggedInEmail') || '').toLowerCase().trim();
  const userIsMuni = isMuniUser(loggedInEmail) || loggedInEmail === 'muni@geonixa.com' || loggedInEmail === 'munichandrar572@gmail.com' || loggedInEmail === 'arun@anurag.edu.in';
  const CACHE_KEY = `anuragLms_marksReport_cache_${userIsMuni ? 'muni' : 'default'}`;

  // State
  const [students, setStudents] = useState<StudentData[]>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.students) && parsed.students.length > 0) return parsed.students;
      }
    } catch (e) {}
    return userIsMuni ? (MUNI_STUDENTS as StudentData[]) : [];
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

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'roll' | 'name' | 'total'>('roll');

  const conductedExamsList = useMemo(() => [
    { id: 'graph_exam', title: 'Graph Exam 1', maxMarks: 20 },
    { id: 'graph_exam_2', title: 'Graph Exam 2', maxMarks: 20 },
    { id: 'pre_assessment', title: 'Pre Assessment', maxMarks: 30 },
    { id: 'skill_test_2', title: 'Skill Test 2', maxMarks: 20 },
    { id: 'skill_test_3', title: 'Skill Test 3', maxMarks: 20 }
  ], []);

  // Fetch all live marks and student data in parallel
  const loadDashboardData = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const studentsKey = getStudentsKey(loggedInEmail);
      const examsKey = getMentorKey('anuragLmsWeeklyExams', loggedInEmail);

      const [
        cloudStudents,
        cloudGraphMarks,
        cloudGraph2Marks,
        cloudPreMarks,
        cloudExams
      ] = await Promise.all([
        getFromCloudflare(studentsKey),
        getFromCloudflare('graphExamMarks_muni'),
        getFromCloudflare('graphExam2Marks_muni'),
        getFromCloudflare('preAssessmentManualMarks_muni'),
        getFromCloudflare(examsKey) || (userIsMuni ? getFromCloudflare('anuragLmsWeeklyExams_muni@geonixa.com') : Promise.resolve(null))
      ]);

      // 1. Students Mapping
      const localStudents = JSON.parse(localStorage.getItem(studentsKey) || '[]');
      const studentMap = new Map<string, StudentData>();

      if (userIsMuni) {
        MUNI_STUDENTS.forEach(s => {
          if (s && s.email) {
            const clean = s.email.toLowerCase().trim();
            studentMap.set(clean, {
              name: s.name,
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
          const existing = studentMap.get(clean);
          studentMap.set(clean, {
            name: s.name || existing?.name || clean.split('@')[0],
            email: clean,
            roll: s.roll || existing?.roll || '',
            batch: s.batch || existing?.batch || 'A1'
          });
        }
      });

      const registeredStudents = Array.from(studentMap.values());
      setStudents(registeredStudents);

      // 2. Marks Mapping
      const localGraphMarks = JSON.parse(localStorage.getItem('graphExamMarks_muni') || '{}');
      const localGraph2Marks = JSON.parse(localStorage.getItem('graphExam2Marks_muni') || '{}');
      const localPreMarks = JSON.parse(localStorage.getItem('preAssessmentManualMarks_muni') || '{}');

      const mergedGraphMarks = { ...(localGraphMarks || {}), ...(cloudGraphMarks || {}) };
      const mergedGraph2Marks = { ...(localGraph2Marks || {}), ...(cloudGraph2Marks || {}) };
      const mergedPreMarks = { ...(localPreMarks || {}), ...(cloudPreMarks || {}) };

      const allMarks: Record<string, Record<string, number | string>> = {};

      registeredStudents.forEach(student => {
        const sEmail = student.email.toLowerCase().trim();
        allMarks[sEmail] = {};

        const graphVal = mergedGraphMarks[sEmail];
        allMarks[sEmail]['graph_exam'] = (graphVal !== undefined && graphVal !== null && graphVal !== '') ? graphVal : '-';

        const graph2Val = mergedGraph2Marks[sEmail];
        allMarks[sEmail]['graph_exam_2'] = (graph2Val !== undefined && graph2Val !== null && graph2Val !== '') ? graph2Val : '-';

        const preVal = mergedPreMarks[sEmail];
        allMarks[sEmail]['pre_assessment'] = (preVal !== undefined && preVal !== null && preVal !== '') ? preVal : '-';
      });

      // Fetch weekly exam results in parallel chunks
      const chunkSize = 25;
      for (let i = 0; i < registeredStudents.length; i += chunkSize) {
        const chunk = registeredStudents.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (student) => {
          const sEmail = student.email.toLowerCase().trim();
          const subKey = `preAssessmentSubmissions_${sEmail}`;
          const localSub = JSON.parse(localStorage.getItem(subKey) || 'null');
          const studentSubs = localSub || await getFromCloudflare(subKey) || {};

          // Skill Test 2
          const st2 = studentSubs.skill_test_2 || studentSubs.week1;
          if (st2 && st2.marks !== undefined) {
            allMarks[sEmail]['skill_test_2'] = typeof st2.marks === 'object' ? (st2.marks.total ?? '-') : st2.marks;
          } else {
            allMarks[sEmail]['skill_test_2'] = '-';
          }

          // Skill Test 3
          const st3 = studentSubs.skill_test_3 || studentSubs.week2;
          if (st3 && st3.marks !== undefined) {
            allMarks[sEmail]['skill_test_3'] = typeof st3.marks === 'object' ? (st3.marks.total ?? '-') : st3.marks;
          } else {
            allMarks[sEmail]['skill_test_3'] = '-';
          }
        }));
      }

      setMarksData(allMarks);

      // Cache snapshot for instant subsequent loads
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          students: registeredStudents,
          marksData: allMarks,
          conductedExams: conductedExamsList,
          timestamp: Date.now()
        }));
      } catch (e) {}

    } catch (err) {
      console.error('Failed to load mentor dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Overall Statistics
  const overallStats = useMemo(() => {
    const totalStudentsCount = students.length;

    let totalMarksEntries = 0;
    let evaluatedEntries = 0;
    let totalScoreSum = 0;
    let totalScorePossible = 0;

    students.forEach(s => {
      const sEmail = s.email.toLowerCase().trim();
      const sMarks = marksData[sEmail] || {};
      conductedExamsList.forEach(exam => {
        totalMarksEntries++;
        const val = sMarks[exam.id];
        if (val !== undefined && val !== '-' && val !== '') {
          evaluatedEntries++;
          const num = Number(val);
          if (!isNaN(num)) {
            totalScoreSum += num;
            totalScorePossible += exam.maxMarks;
          }
        }
      });
    });

    const completionRate = totalMarksEntries > 0 ? Math.round((evaluatedEntries / totalMarksEntries) * 100) : 0;
    const academicAvgPct = totalScorePossible > 0 ? Math.round((totalScoreSum / totalScorePossible) * 100) : 0;

    return {
      totalStudentsCount,
      conductedExamsCount: conductedExamsList.length,
      completionRate,
      evaluatedEntries,
      academicAvgPct
    };
  }, [students, marksData, conductedExamsList]);

  // Batch Wise Summaries (Purely Exam Performance)
  const batchSummaries: BatchSummary[] = useMemo(() => {
    const batches = ['A1', 'A2', 'B1', 'B2'];

    return batches.map(batchName => {
      const batchStudents = students.filter(s => s.batch === batchName);
      const studentCount = batchStudents.length;

      if (studentCount === 0) {
        return {
          batch: batchName,
          studentCount: 0,
          avgScore: 0,
          graph1Avg: 0,
          graph2Avg: 0,
          preAvg: 0,
          skill2Avg: 0,
          skill3Avg: 0
        };
      }

      // Exam Averages
      const calcExamAvg = (examId: string) => {
        let sum = 0;
        let count = 0;
        batchStudents.forEach(s => {
          const val = marksData[s.email.toLowerCase().trim()]?.[examId];
          const num = Number(val);
          if (val !== undefined && val !== '-' && !isNaN(num)) {
            sum += num;
            count++;
          }
        });
        return count > 0 ? Number((sum / count).toFixed(1)) : 0;
      };

      const g1 = calcExamAvg('graph_exam');
      const g2 = calcExamAvg('graph_exam_2');
      const pre = calcExamAvg('pre_assessment');
      const s2 = calcExamAvg('skill_test_2');
      const s3 = calcExamAvg('skill_test_3');

      // Total average % across 110 points
      const totalAvgScore = Number((g1 + g2 + pre + s2 + s3).toFixed(1));
      const avgPct = Math.round((totalAvgScore / 110) * 100);

      return {
        batch: batchName,
        studentCount,
        avgScore: avgPct,
        graph1Avg: g1,
        graph2Avg: g2,
        preAvg: pre,
        skill2Avg: s2,
        skill3Avg: s3
      };
    });
  }, [students, marksData]);

  // Test Wise Summaries
  const testSummaries: ExamSummary[] = useMemo(() => {
    return conductedExamsList.map(exam => {
      let evaluatedCount = 0;
      let scoreSum = 0;
      let highest = 0;
      let lowest = exam.maxMarks;
      let passCount = 0;
      const passMark = exam.maxMarks * 0.4; // 40% pass standard

      students.forEach(s => {
        const val = marksData[s.email.toLowerCase().trim()]?.[exam.id];
        if (val !== undefined && val !== '-' && val !== '') {
          const num = Number(val);
          if (!isNaN(num)) {
            evaluatedCount++;
            scoreSum += num;
            if (num > highest) highest = num;
            if (num < lowest) lowest = num;
            if (num >= passMark) passCount++;
          }
        }
      });

      const avg = evaluatedCount > 0 ? Number((scoreSum / evaluatedCount).toFixed(1)) : 0;

      return {
        id: exam.id,
        title: exam.title,
        maxMarks: exam.maxMarks,
        evaluatedCount,
        totalStudents: students.length,
        averageScore: avg,
        highestScore: evaluatedCount > 0 ? highest : 0,
        lowestScore: evaluatedCount > 0 ? lowest : 0,
        passCount
      };
    });
  }, [conductedExamsList, students, marksData]);

  // Master Student Matrix with Filters & Sorting
  const filteredStudents = useMemo(() => {
    let list = students.filter(student => {
      const matchesBatch = selectedBatch === 'ALL' || student.batch === selectedBatch;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        student.name.toLowerCase().includes(query) ||
        student.roll.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query);

      return matchesBatch && matchesSearch;
    });

    return list.sort((a, b) => {
      const emailA = a.email.toLowerCase().trim();
      const emailB = b.email.toLowerCase().trim();

      if (sortBy === 'roll') {
        return (a.roll || '').localeCompare(b.roll || '');
      } else if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'total') {
        const getStudentTotal = (email: string) => {
          let sum = 0;
          conductedExamsList.forEach(e => {
            const val = marksData[email]?.[e.id];
            const num = Number(val);
            if (!isNaN(num)) sum += num;
          });
          return sum;
        };
        return getStudentTotal(emailB) - getStudentTotal(emailA);
      }
      return 0;
    });
  }, [students, selectedBatch, searchQuery, sortBy, marksData, conductedExamsList]);

  return (
    <div className="w-full space-y-6 pb-14">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mentor Executive Dashboard</h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300 rounded">
              Academic Year 2026
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Consolidated batch analytics and exam results in a single executive slide.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => loadDashboardData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded shadow-xs cursor-pointer transition-colors"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-primary' : 'text-gray-500'} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh Data'}</span>
          </button>

          <button
            onClick={() => navigate('/mentor-dashboard/marks-report')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-medium rounded shadow-xs cursor-pointer transition-colors"
          >
            <span>Full Marks Report</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Tiles (Clean, Corporate, Professional - No AI styling) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Total Students */}
        <div className="bg-white p-4 border border-gray-200 rounded shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Enrolled</span>
            <div className="w-7 h-7 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-gray-600">
              <Users size={15} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{overallStats.totalStudentsCount}</span>
            <span className="text-xs text-gray-500 font-medium">Students</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
            <span>A1: <strong>37</strong></span>
            <span>A2: <strong>28</strong></span>
            <span>B1: <strong>38</strong></span>
            <span>B2: <strong>23</strong></span>
          </div>
        </div>

        {/* Tile 2: Total Evaluations */}
        <div className="bg-white p-4 border border-gray-200 rounded shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Evaluations</span>
            <div className="w-7 h-7 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-gray-600">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{overallStats.evaluatedEntries}</span>
            <span className="text-xs text-gray-500 font-medium">Graded</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
            <span>Evaluation Rate</span>
            <span className="font-semibold text-emerald-700">{overallStats.completionRate}% Done</span>
          </div>
        </div>

        {/* Tile 3: Exams Conducted */}
        <div className="bg-white p-4 border border-gray-200 rounded shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conducted Exams</span>
            <div className="w-7 h-7 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-gray-600">
              <FileText size={15} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{overallStats.conductedExamsCount}</span>
            <span className="text-xs text-gray-500 font-medium">Active Exams</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
            <span>Graph 1, 2, Pre, Skill 2, 3</span>
            <button 
              onClick={() => navigate('/mentor-dashboard/graph-exam')}
              className="text-primary hover:underline font-medium"
            >
              Exams
            </button>
          </div>
        </div>

        {/* Tile 4: Academic Performance */}
        <div className="bg-white p-4 border border-gray-200 rounded shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cohort Mean Score</span>
            <div className="w-7 h-7 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-gray-600">
              <Award size={15} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{overallStats.academicAvgPct}%</span>
            <span className="text-xs text-gray-500 font-medium">Average</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
            <span>Max Score: <strong>110 Pts</strong></span>
            <span className="text-emerald-700 font-semibold">Standard Pass</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Side-by-Side Professional Analytics Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Batch-Wise Summary Table */}
        <div className="bg-white border border-gray-200 rounded shadow-xs flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-600" />
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Batch-Wise Exam Performance</h2>
            </div>
            <span className="text-[11px] text-gray-500 font-mono">4 Batches</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 text-left whitespace-nowrap">Batch</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Students</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Graph 1 (20)</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Graph 2 (20)</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Pre (30)</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Skill 2 (20)</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Batch Avg %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {batchSummaries.map(b => (
                  <tr key={b.batch} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-left whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 bg-gray-100 border border-gray-300 text-gray-900 font-bold text-xs rounded whitespace-nowrap">
                        Batch {b.batch}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-medium text-gray-700">{b.studentCount}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-gray-800 font-medium">{b.graph1Avg}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-gray-800 font-medium">{b.graph2Avg}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-gray-800 font-medium">{b.preAvg}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-gray-800 font-medium">{b.skill2Avg}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-900">
                      {b.avgScore}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 2: Test-Wise Exam Results Summary */}
        <div className="bg-white border border-gray-200 rounded shadow-xs flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-gray-600" />
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Test-Wise Results & Metrics</h2>
            </div>
            <span className="text-[11px] text-gray-500 font-mono">5 Exam Reports</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 text-left whitespace-nowrap">Exam Name</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Max</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Evaluated</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Avg Mark</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Highest</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Lowest</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Passing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {testSummaries.map(exam => {
                  const evalPct = exam.totalStudents > 0 ? Math.round((exam.evaluatedCount / exam.totalStudents) * 100) : 0;
                  return (
                    <tr key={exam.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-left font-semibold text-gray-900 whitespace-nowrap">
                        {exam.title}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-gray-500">{exam.maxMarks}</td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        <span className="font-semibold text-gray-800">{exam.evaluatedCount}</span>
                        <span className="text-[10px] text-gray-400 font-normal"> ({evalPct}%)</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-900">{exam.averageScore}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-semibold">{exam.highestScore}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-gray-600">{exam.lowestScore}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-gray-700 font-medium">
                        {exam.evaluatedCount > 0 ? `${Math.round((exam.passCount / exam.evaluatedCount) * 100)}%` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Main Feature: Master Consolidated Student Performance Matrix ("See Everything in One Slide") */}
      <div className="bg-white border border-gray-200 rounded shadow-xs space-y-4 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart size={16} className="text-gray-700" />
              <span>Consolidated Student Master Matrix</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Live multi-exam marks across all 5 exams for all {students.length} students.
            </p>
          </div>

          {/* Controls: Batch Pills & Sort Option */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Batch Filter */}
            <div className="inline-flex p-0.5 bg-gray-100 border border-gray-200 rounded text-xs">
              {['ALL', 'A1', 'A2', 'B1', 'B2'].map(batch => (
                <button
                  key={batch}
                  onClick={() => setSelectedBatch(batch)}
                  className={`px-2.5 py-1 font-semibold rounded cursor-pointer transition-colors ${
                    selectedBatch === batch 
                      ? 'bg-primary text-white shadow-2xs' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {batch === 'ALL' ? 'All Batches' : `Batch ${batch}`}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="text-gray-400 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="py-1 px-2 bg-gray-50 border border-gray-300 rounded text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
              >
                <option value="roll">Roll Number</option>
                <option value="name">Student Name</option>
                <option value="total">Overall Score</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Search by student name, roll number, or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Master Table */}
        <div className="overflow-x-auto border border-gray-200 rounded">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-2.5 px-3 text-center w-12">#</th>
                <th className="py-2.5 px-3 text-left whitespace-nowrap">Roll No</th>
                <th className="py-2.5 px-3 text-left min-w-[200px]">Student Name</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Batch</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Graph 1 (20)</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Graph 2 (20)</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Pre (30)</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Skill 2 (20)</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Skill 3 (20)</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Total / 110</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Overall %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-gray-400 italic">
                    No student records found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const sEmail = student.email.toLowerCase().trim();
                  const sMarks = marksData[sEmail] || {};

                  const g1 = sMarks['graph_exam'];
                  const g2 = sMarks['graph_exam_2'];
                  const pre = sMarks['pre_assessment'];
                  const s2 = sMarks['skill_test_2'];
                  const s3 = sMarks['skill_test_3'];

                  // Calculate total
                  let totalSum = 0;
                  let hasAnyMarks = false;
                  [g1, g2, pre, s2, s3].forEach(val => {
                    const num = Number(val);
                    if (val !== undefined && val !== '-' && !isNaN(num)) {
                      totalSum += num;
                      hasAnyMarks = true;
                    }
                  });

                  const overallPct = hasAnyMarks ? Math.round((totalSum / 110) * 100) : '-';

                  return (
                    <tr key={sEmail} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-gray-400 text-[11px]">{idx + 1}</td>
                      <td className="py-2.5 px-3 text-left font-mono font-semibold text-gray-800 whitespace-nowrap">
                        {student.roll || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-left">
                        <p className="font-semibold text-gray-900 truncate max-w-[220px]">{student.name}</p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[220px]">{student.email}</p>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-800 font-medium text-[11px] rounded">
                          {student.batch || 'A1'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-gray-800">
                        {g1 !== undefined && g1 !== '-' ? g1 : <span className="text-gray-300 font-normal">-</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-gray-800">
                        {g2 !== undefined && g2 !== '-' ? g2 : <span className="text-gray-300 font-normal">-</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-gray-800">
                        {pre !== undefined && pre !== '-' ? pre : <span className="text-gray-300 font-normal">-</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-gray-800">
                        {s2 !== undefined && s2 !== '-' ? s2 : <span className="text-gray-300 font-normal">-</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-gray-800">
                        {s3 !== undefined && s3 !== '-' ? s3 : <span className="text-gray-300 font-normal">-</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-900">
                        {hasAnyMarks ? totalSum : <span className="text-gray-300 font-normal">-</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-900">
                        {overallPct !== '-' ? (
                          <span className={Number(overallPct) >= 60 ? 'text-emerald-700' : 'text-gray-800'}>
                            {overallPct}%
                          </span>
                        ) : (
                          <span className="text-gray-300 font-normal">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Navigation Shortcuts */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-gray-100">
          <span className="text-gray-500 font-medium">
            Showing {filteredStudents.length} of {students.length} students across 5 examinations.
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/mentor-dashboard/marks-report')}
              className="text-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Download Excel Marks Report</span>
              <ArrowUpRight size={12} />
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => navigate('/mentor-dashboard/graph-exam')}
              className="text-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Graph Exams</span>
              <ArrowUpRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboardOverview;
