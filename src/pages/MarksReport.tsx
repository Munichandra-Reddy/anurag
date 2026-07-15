import React, { useState, useEffect } from 'react';
import { Loader2, ClipboardList, Search } from 'lucide-react';
import { getFromCloudflare, saveToCloudflare } from '../utils/cloudflare';

interface MarksReportProps {
  isFacultyView?: boolean;
}

const examPatterns = [
  'week1', 'week2', 'week3', 'week4', 'week5', 'week6', 
  'week7', 'week8', 'week9', 'week10', 'week11', 'week12', 
  'CIE1', 'CIE2', 'SEM'
];

const MarksReport: React.FC<MarksReportProps> = ({ isFacultyView = false }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [marksData, setMarksData] = useState<Record<string, Record<string, number | string>>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (isFacultyView) {
          const snapshot = await getFromCloudflare('facultySnapshotMarks');
          if (snapshot) {
            setStudents(snapshot.students || []);
            setMarksData(snapshot.marksData || {});
            setIsSubmitted(true);
          } else {
            setIsSubmitted(false);
          }
          setIsLoading(false);
          return;
        }

        const [cloudStudents, cloudHash] = await Promise.all([
          getFromCloudflare('registeredStudents'),
          getFromCloudflare('facultySnapshotHash_Marks')
        ]);
        
        // Merge lingering local students to prevent data loss
        const localStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]');
        const allStudentsMap = new Map();
        [...localStudents, ...(cloudStudents || [])].forEach(s => {
          if (s && s.email) allStudentsMap.set(s.email, s);
        });
        const registeredStudents = Array.from(allStudentsMap.values());
        setStudents(registeredStudents);

        // Fetch all marks for all patterns and all students
        const allMarks: Record<string, Record<string, number | string>> = {};
        
        for (const student of registeredStudents) {
          allMarks[student.email] = {};
          
          for (const pattern of examPatterns) {
            const key = `weeklyReport_${student.email}_${pattern}`;
            
            // Try to load from localStorage first (for speed)
            const localDataStr = localStorage.getItem(key);
            let marksObj = null;
            
            if (localDataStr) {
              marksObj = JSON.parse(localDataStr);
            } else {
              // Optionally fetch from cloudflare if not local
              const cloudData = await getFromCloudflare(key);
              if (cloudData) marksObj = cloudData;
            }

            if (marksObj) {
              const isCie = pattern.startsWith('CIE') || pattern.startsWith('SEM');
              const total = Number(marksObj.project || 0) + 
                            (isCie ? 0 : Number(marksObj.portfolio || 0)) + 
                            Number(marksObj.theory || 0) + 
                            Number(marksObj.attendance || 0) + 
                            Number(marksObj.mentor || 0);
              
              allMarks[student.email][pattern] = total;
            } else {
              allMarks[student.email][pattern] = '-';
            }
          }
        }
        
        setMarksData(allMarks);
        
        // Check if current live data matches the last submitted snapshot
        const currentDataString = JSON.stringify({ marksData: allMarks, students: registeredStudents });
        const lastSubmittedHash = cloudHash || localStorage.getItem('facultySnapshotHash_Marks');
        
        if (lastSubmittedHash === currentDataString) {
          setIsSubmitted(true);
        } else {
          setIsSubmitted(false);
        }

      } catch (error) {
        console.error("Failed to load marks data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isFacultyView && !isSubmitted) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center space-y-4 bg-white rounded-2xl border border-gray-200 shadow-sm mt-8">
        <ClipboardList size={48} className="text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">Report Pending</h2>
        <p className="text-gray-500">The mentor has not yet submitted the Marks Report.</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const snapshotData = { marksData, students };
    const currentDataString = JSON.stringify(snapshotData);
    
    // Save snapshot for faculty
    await saveToCloudflare('facultySnapshotMarks', snapshotData);
    
    // Save hash locally to know when data changes again
    localStorage.setItem('facultySnapshotHash_Marks', currentDataString);
    await saveToCloudflare('facultySnapshotHash_Marks', currentDataString);
    
    setIsSubmitted(true);
    setIsSubmitting(false);
    alert('Marks updates successfully sent to Faculty!');
  };

  return (
    <div className="space-y-6 max-w-[95%] mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marks Report</h1>
          <p className="text-gray-500 mt-1">Detailed view of student scores across all weekly and CIE exams.</p>
        </div>
        <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg border border-orange-100 flex items-center gap-2 text-sm font-medium">
          <ClipboardList size={18} />
          Total Students: {students.length}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-4 text-sm font-bold text-gray-700 whitespace-nowrap sticky left-0 bg-gray-50 z-10 border-r border-gray-200 shadow-[1px_0_0_0_#e5e7eb]">
                  Student Name
                </th>
                <th className="px-4 py-4 text-sm font-bold text-gray-700 whitespace-nowrap border-r border-gray-200">
                  Email
                </th>
                {examPatterns.map((pattern, i) => (
                  <th key={i} className="px-4 py-4 text-xs font-bold text-gray-600 text-center whitespace-nowrap min-w-[80px]">
                    {pattern.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students
                .filter(s => 
                  s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  s.email?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((student, idx) => (
                <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-100 shadow-[1px_0_0_0_#f3f4f6]">
                    {student.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap border-r border-gray-100">
                    {student.email}
                  </td>
                  
                  {examPatterns.map((pattern, i) => {
                    const mark = marksData[student.email]?.[pattern];
                    
                    return (
                      <td key={i} className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-50 last:border-r-0">
                        {mark !== '-' ? (
                          <span>{mark}</span>
                        ) : (
                          <span className="text-gray-300 font-normal">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              
              {students.length === 0 && (
                <tr>
                  <td colSpan={examPatterns.length + 2} className="px-6 py-12 text-center text-gray-500">
                    No students registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {!isFacultyView && (
        <div className="flex justify-end mt-6">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitted || isSubmitting}
            className={`px-6 py-3 rounded-xl font-bold text-white transition-all shadow-sm ${isSubmitted ? 'bg-green-500 cursor-not-allowed' : 'bg-primary hover:bg-orange-600 hover:shadow'}`}
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin mx-auto" /> : isSubmitted ? 'Submitted to Faculty' : 'Submit to Faculty'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MarksReport;
