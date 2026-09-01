import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  BarChart, TrendingUp, Award, CheckCircle2, 
  Search, Users, RefreshCw, Loader2, Sparkles, Filter
} from 'lucide-react';
import { getFromCloudflare } from '../utils/cloudflare';
import { MUNI_STUDENTS } from '../data/students';

interface ExamScore {
  pattern: string;
  total: number;
  max: number;
  project: number;
  portfolio: number;
  theory: number;
  attendance: number;
  mentor: number;
  isCompleted: boolean;
}

const ALL_PATTERNS = [
  'week1', 'week2', 'week3', 'week4', 'week5', 'week6', 
  'CIE1', 'week7', 'week8', 'week9', 'week10', 'week11', 'week12', 
  'CIE2', 'SEM'
];

const GraphExam: React.FC = () => {
  const location = useLocation();
  const isMentorView = location.pathname.includes('/mentor-dashboard');
  const loggedInEmail = (sessionStorage.getItem('loggedInEmail') || '').toLowerCase().trim();

  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentEmail, setSelectedStudentEmail] = useState<string>(loggedInEmail);
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Scores for currently selected student
  const [studentScores, setStudentScores] = useState<ExamScore[]>([]);
  // Class/Batch averages for mentor view
  const [batchAverages, setBatchAverages] = useState<Record<string, number>>({});
  const [patternAverages, setPatternAverages] = useState<Record<string, number>>({});

  // Load all Muni students
  useEffect(() => {
    const loadMuniStudents = async () => {
      try {
        const cloudMuni = await getFromCloudflare('registeredStudents_muni@geonixa.com') || [];
        const localMuni = JSON.parse(localStorage.getItem('registeredStudents_muni@geonixa.com') || '[]');
        
        const map = new Map();
        [...MUNI_STUDENTS, ...localMuni, ...cloudMuni].forEach((s: any) => {
          if (s && s.email) {
            const cleanEmail = s.email.toLowerCase().trim();
            if (!map.has(cleanEmail)) {
              map.set(cleanEmail, {
                id: s.id || s.roll || cleanEmail,
                name: s.name || cleanEmail.split('@')[0],
                email: cleanEmail,
                roll: s.roll || '',
                batch: s.batch || 'A1'
              });
            }
          }
        });
        
        const allList = Array.from(map.values());
        setStudents(allList);

        if (isMentorView && allList.length > 0) {
          setSelectedStudentEmail(allList[0].email);
        } else if (!isMentorView) {
          setSelectedStudentEmail(loggedInEmail);
        }
      } catch (err) {
        console.error("Failed to load Muni students:", err);
      }
    };
    loadMuniStudents();
  }, [isMentorView, loggedInEmail]);

  // Load exam scores whenever selected student or student list changes
  useEffect(() => {
    if (!students.length) {
      setIsLoading(false);
      return;
    }

    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        // Fetch scores for all students to compute batch averages
        const patternSumMap: Record<string, { sum: number; count: number }> = {};
        const batchSumMap: Record<string, { sum: number; count: number }> = {
          A1: { sum: 0, count: 0 },
          A2: { sum: 0, count: 0 },
          B1: { sum: 0, count: 0 },
          B2: { sum: 0, count: 0 }
        };

        ALL_PATTERNS.forEach(p => {
          patternSumMap[p] = { sum: 0, count: 0 };
        });

        // We load scores for target student
        const targetEmail = selectedStudentEmail || loggedInEmail;
        const targetScores: ExamScore[] = [];

        for (const pattern of ALL_PATTERNS) {
          const key = `weeklyReport_${targetEmail}_${pattern}`;
          const localVal = localStorage.getItem(key);
          let reportObj: any = localVal ? JSON.parse(localVal) : null;
          
          if (!reportObj) {
            reportObj = await getFromCloudflare(key);
          }

          if (reportObj) {
            const isCie = pattern.startsWith('CIE') || pattern.startsWith('SEM');
            const total = Number(reportObj.project || 0) + 
                          (isCie ? 0 : Number(reportObj.portfolio || 0)) + 
                          Number(reportObj.theory || 0) + 
                          Number(reportObj.attendance || 0) + 
                          Number(reportObj.mentor || 0);

            targetScores.push({
              pattern,
              total,
              max: 100,
              project: Number(reportObj.project || 0),
              portfolio: isCie ? 0 : Number(reportObj.portfolio || 0),
              theory: Number(reportObj.theory || 0),
              attendance: Number(reportObj.attendance || 0),
              mentor: Number(reportObj.mentor || 0),
              isCompleted: true
            });
          } else {
            targetScores.push({
              pattern,
              total: 0,
              max: 100,
              project: 0,
              portfolio: 0,
              theory: 0,
              attendance: 0,
              mentor: 0,
              isCompleted: false
            });
          }
        }

        setStudentScores(targetScores);

        // Compute averages across all students if mentor view
        if (isMentorView) {
          for (const s of students.slice(0, 30)) { // slice for fast responsiveness
            for (const pattern of ALL_PATTERNS) {
              const k = `weeklyReport_${s.email}_${pattern}`;
              const lVal = localStorage.getItem(k);
              if (lVal) {
                const r = JSON.parse(lVal);
                const isCie = pattern.startsWith('CIE') || pattern.startsWith('SEM');
                const tot = Number(r.project || 0) + (isCie ? 0 : Number(r.portfolio || 0)) + Number(r.theory || 0) + Number(r.attendance || 0) + Number(r.mentor || 0);
                
                if (tot > 0) {
                  patternSumMap[pattern].sum += tot;
                  patternSumMap[pattern].count += 1;
                  
                  const b = s.batch || 'A1';
                  if (batchSumMap[b]) {
                    batchSumMap[b].sum += tot;
                    batchSumMap[b].count += 1;
                  }
                }
              }
            }
          }

          const patAvg: Record<string, number> = {};
          ALL_PATTERNS.forEach(p => {
            patAvg[p] = patternSumMap[p].count > 0 ? Math.round(patternSumMap[p].sum / patternSumMap[p].count) : 0;
          });
          setPatternAverages(patAvg);

          const batAvg: Record<string, number> = {};
          Object.keys(batchSumMap).forEach(b => {
            batAvg[b] = batchSumMap[b].count > 0 ? Math.round(batchSumMap[b].sum / batchSumMap[b].count) : 0;
          });
          setBatchAverages(batAvg);
        }

      } catch (err) {
        console.error("Error loading exam graph data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [selectedStudentEmail, students, isMentorView, loggedInEmail]);

  // Derived Stats
  const completedExams = studentScores.filter(s => s.isCompleted);
  const avgScore = completedExams.length > 0 
    ? Math.round(completedExams.reduce((acc, curr) => acc + curr.total, 0) / completedExams.length)
    : 0;
  const highestScore = completedExams.length > 0 
    ? Math.max(...completedExams.map(s => s.total))
    : 0;

  // Component breakdown averages
  const avgProject = completedExams.length > 0 
    ? Math.round(completedExams.reduce((a, b) => a + b.project, 0) / completedExams.length) 
    : 0;
  const avgTheory = completedExams.length > 0 
    ? Math.round(completedExams.reduce((a, b) => a + b.theory, 0) / completedExams.length) 
    : 0;
  const avgPortfolio = completedExams.length > 0 
    ? Math.round(completedExams.reduce((a, b) => a + b.portfolio, 0) / completedExams.length) 
    : 0;
  const avgAttendance = completedExams.length > 0 
    ? Math.round(completedExams.reduce((a, b) => a + b.attendance, 0) / completedExams.length) 
    : 0;
  const avgMentor = completedExams.length > 0 
    ? Math.round(completedExams.reduce((a, b) => a + b.mentor, 0) / completedExams.length) 
    : 0;

  // Filter student list for mentor selection
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.roll.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch = selectedBatchFilter === 'ALL' || s.batch === selectedBatchFilter;
    return matchesSearch && matchesBatch;
  });

  const selectedStudentObj = students.find(s => s.email === selectedStudentEmail);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-red-950 via-primary to-red-900 p-6 md:p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-wide uppercase text-red-200 border border-white/20 mb-2">
            <Sparkles size={14} className="text-yellow-300" /> Muni Mentor Analytics
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
            <BarChart size={32} className="text-white" />
            Graph Exam Performance
          </h1>
          <p className="text-red-100 text-sm max-w-xl">
            {isMentorView 
              ? "Comprehensive visual exam graph analytics across all Muni Mentor student batches." 
              : "Track your exam graph progression, component marks, and performance trends over time."}
          </p>
        </div>

        {isMentorView && (
          <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl min-w-[240px]">
            <p className="text-xs text-red-200 font-medium mb-1">Current Active Batch View</p>
            <p className="text-lg font-bold text-white uppercase">{selectedBatchFilter === 'ALL' ? 'All Batches (A1, A2, B1, B2)' : `Batch ${selectedBatchFilter}`}</p>
            <p className="text-xs text-red-200 mt-1">{students.length} Registered Students</p>
          </div>
        )}
      </div>

      {/* Mentor Student Selector */}
      {isMentorView && (
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Users className="text-primary" size={20} />
              <h2 className="text-lg font-bold text-gray-900">Select Student for Exam Graph</h2>
            </div>
            
            {/* Batch Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <Filter size={16} className="text-gray-400 mr-1 shrink-0" />
              {['ALL', 'A1', 'A2', 'B1', 'B2'].map(b => (
                <button
                  key={b}
                  onClick={() => setSelectedBatchFilter(b)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    selectedBatchFilter === b 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {b === 'ALL' ? 'All Batches' : `Batch ${b}`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search student name, roll or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Dropdown Select */}
            <div className="md:col-span-2">
              <select
                value={selectedStudentEmail}
                onChange={e => setSelectedStudentEmail(e.target.value)}
                className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                {filteredStudents.map(s => (
                  <option key={s.email} value={s.email}>
                    {s.name} ({s.roll || 'No Roll'}) - Batch {s.batch || 'A1'} [{s.email}]
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-primary flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Average Score</p>
            <h3 className="text-2xl font-black text-gray-900">{avgScore} <span className="text-xs font-normal text-gray-500">/ 100</span></h3>
            <p className="text-[11px] text-green-600 font-semibold mt-0.5">Overall Exam Average</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Highest Exam Mark</p>
            <h3 className="text-2xl font-black text-gray-900">{highestScore} <span className="text-xs font-normal text-gray-500">/ 100</span></h3>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Peak Score Achieved</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Exams Evaluated</p>
            <h3 className="text-2xl font-black text-gray-900">{completedExams.length} <span className="text-xs font-normal text-gray-500">/ {ALL_PATTERNS.length}</span></h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Reports Available</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BarChart size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Performance Grade</p>
            <h3 className="text-2xl font-black text-gray-900">
              {avgScore >= 80 ? 'A+' : avgScore >= 70 ? 'A' : avgScore >= 60 ? 'B' : avgScore >= 50 ? 'C' : 'N/A'}
            </h3>
            <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
              {selectedStudentObj ? selectedStudentObj.name : 'Student'}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="w-full h-64 bg-white rounded-2xl border border-gray-200 flex items-center justify-center gap-3 text-gray-500">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <span className="font-medium text-sm">Building Exam Graph Data...</span>
        </div>
      ) : (
        <>
          {/* Main Visual Bar Chart */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BarChart className="text-primary" size={20} />
                  Exam Score Graph Progression
                </h2>
                <p className="text-xs text-gray-500">
                  Total score breakdown per exam pattern for {selectedStudentObj ? `${selectedStudentObj.name} (${selectedStudentObj.email})` : 'Selected Student'}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500"></span> Excellent (&ge;75)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-primary"></span> Average (50-74)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-500"></span> Needs Focus (&lt;50)
                </div>
              </div>
            </div>

            {/* SVG Visual Bar Graph */}
            <div className="w-full overflow-x-auto pt-6 pb-2">
              <div className="min-w-[700px] h-[280px] flex items-end justify-between gap-3 px-4 relative border-b border-gray-200">
                {/* Horizontal Guide Lines */}
                <div className="absolute inset-x-0 top-0 border-b border-dashed border-gray-200 flex justify-between text-[10px] text-gray-400 pl-2 pointer-events-none">
                  <span>100</span>
                </div>
                <div className="absolute inset-x-0 top-[25%] border-b border-dashed border-gray-200 flex justify-between text-[10px] text-gray-400 pl-2 pointer-events-none">
                  <span>75</span>
                </div>
                <div className="absolute inset-x-0 top-[50%] border-b border-dashed border-gray-200 flex justify-between text-[10px] text-gray-400 pl-2 pointer-events-none">
                  <span>50</span>
                </div>
                <div className="absolute inset-x-0 top-[75%] border-b border-dashed border-gray-200 flex justify-between text-[10px] text-gray-400 pl-2 pointer-events-none">
                  <span>25</span>
                </div>

                {studentScores.map((scoreItem, idx) => {
                  const heightPercent = scoreItem.isCompleted ? Math.max(scoreItem.total, 8) : 5;
                  const isHigh = scoreItem.total >= 75;
                  const isMid = scoreItem.total >= 50 && scoreItem.total < 75;
                  
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative z-10">
                      {/* Tooltip on Hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-30 pointer-events-none w-36 text-center space-y-1">
                        <p className="font-bold border-b border-gray-700 pb-1 text-yellow-400 uppercase">{scoreItem.pattern}</p>
                        <p className="text-sm font-black">{scoreItem.total} / 100</p>
                        <div className="text-[10px] text-gray-300 text-left space-y-0.5">
                          <p>Project: {scoreItem.project}</p>
                          <p>Theory: {scoreItem.theory}</p>
                          <p>Attendance: {scoreItem.attendance}</p>
                        </div>
                      </div>

                      {/* Score Badge top of bar */}
                      <span className={`text-[11px] font-extrabold mb-1.5 ${
                        !scoreItem.isCompleted ? 'text-gray-300' : isHigh ? 'text-emerald-600' : isMid ? 'text-primary' : 'text-amber-600'
                      }`}>
                        {scoreItem.isCompleted ? scoreItem.total : '-'}
                      </span>

                      {/* Bar fill */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[36px] rounded-t-lg transition-all duration-500 ease-out group-hover:brightness-110 shadow-sm ${
                          !scoreItem.isCompleted 
                            ? 'bg-gray-100 border border-dashed border-gray-300' 
                            : isHigh 
                            ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' 
                            : isMid 
                            ? 'bg-gradient-to-t from-red-700 to-primary' 
                            : 'bg-gradient-to-t from-amber-600 to-amber-400'
                        }`}
                      />

                      {/* Exam Label */}
                      <span className="text-[11px] font-bold text-gray-600 uppercase mt-3 tracking-tighter truncate max-w-full">
                        {scoreItem.pattern}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Component Score Breakdown & Batch Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Component Averages */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <BarChart size={18} className="text-primary" />
                Category Performance Breakdown
              </h3>
              <p className="text-xs text-gray-500">Average marks attained per component across completed exams.</p>

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-700">Project Marks</span>
                    <span className="text-primary font-bold">{avgProject} / 25</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${(avgProject / 25) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-700">Theory Exam</span>
                    <span className="text-emerald-600 font-bold">{avgTheory} / 25</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${(avgTheory / 25) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-700">Portfolio / MCQ</span>
                    <span className="text-indigo-600 font-bold">{avgPortfolio} / 25</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${(avgPortfolio / 25) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-700">Attendance</span>
                    <span className="text-amber-600 font-bold">{avgAttendance} / 15</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${(avgAttendance / 15) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-700">Mentor Evaluation</span>
                    <span className="text-purple-600 font-bold">{avgMentor} / 10</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${(avgMentor / 10) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Batch Overview for Mentor / Summary Table for Student */}
            {isMentorView ? (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Users size={18} className="text-primary" />
                  Muni Mentor Batch Graph Comparison
                </h3>
                <p className="text-xs text-gray-500">Average exam score by student batch group.</p>

                <div className="space-y-4 pt-2">
                  {['A1', 'A2', 'B1', 'B2'].map(batch => {
                    const avg = batchAverages[batch] || 0;
                    return (
                      <div key={batch} className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <p className="text-sm font-bold text-gray-900">Batch {batch}</p>
                          <p className="text-xs text-gray-500">Muni Mentor Section</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-primary">{avg} <span className="text-xs text-gray-400 font-normal">/ 100</span></p>
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {avg >= 70 ? 'High Performance' : 'Active'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Award size={18} className="text-primary" />
                  Exam Status Summary
                </h3>
                <p className="text-xs text-gray-500">Detailed list of evaluated exam reports.</p>

                <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {studentScores.map((score, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="text-xs font-bold text-gray-800 uppercase">{score.pattern}</span>
                      {score.isCompleted ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-gray-900">{score.total} pts</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            score.total >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary'
                          }`}>
                            {score.total >= 75 ? 'Excellent' : 'Passed'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Pending Evaluation</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GraphExam;
