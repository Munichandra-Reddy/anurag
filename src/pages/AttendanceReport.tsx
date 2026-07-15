import React, { useState, useEffect } from 'react';
import { Loader2, ClipboardList, CheckCircle2, XCircle, Search } from 'lucide-react';
import { getFromCloudflare, saveToCloudflare } from '../utils/cloudflare';

interface AttendanceReportProps {
  isFacultyView?: boolean;
}

const AttendanceReport: React.FC<AttendanceReportProps> = ({ isFacultyView = false }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, Record<string, string>>>({});
  const [sessions, setSessions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (isFacultyView) {
          const snapshot = await getFromCloudflare('facultySnapshotAttendance');
          if (snapshot) {
            setStudents(snapshot.students || []);
            setAttendanceRecords(snapshot.attendanceRecords || {});
            setSessions(snapshot.sessions || []);
            setIsSubmitted(true);
          } else {
            setIsSubmitted(false);
          }
          setIsLoading(false);
          return;
        }

        // --- Mentor View: Load live data ---
        const [cloudStudents, cloudAttendance, cloudClasses, cloudHash] = await Promise.all([
          getFromCloudflare('registeredStudents'),
          getFromCloudflare('attendanceRecords'),
          getFromCloudflare('anuragLmsClasses'),
          getFromCloudflare('facultySnapshotHash_Attendance')
        ]);
        
        const localStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]');
        const allStudentsMap = new Map();
        [...localStudents, ...(cloudStudents || [])].forEach(s => {
          if (s && s.email) allStudentsMap.set(s.email, s);
        });
        const currentStudents = Array.from(allStudentsMap.values());
        setStudents(currentStudents);

        const localAttendance = JSON.parse(localStorage.getItem('attendanceRecords') || '{}');
        const currentAttendance = { ...localAttendance, ...(cloudAttendance || {}) };
        setAttendanceRecords(currentAttendance);

        const localClasses = JSON.parse(localStorage.getItem('anuragLmsClasses') || '[]');
        const currentSessions = cloudClasses && cloudClasses.length > 0 ? cloudClasses : localClasses;
        setSessions(currentSessions);
        
        // Check if current live data matches the last submitted snapshot
        const currentDataString = JSON.stringify({ attendanceRecords: currentAttendance, students: currentStudents, sessions: currentSessions });
        const lastSubmittedHash = cloudHash || localStorage.getItem('facultySnapshotHash_Attendance');
        
        if (lastSubmittedHash === currentDataString) {
          setIsSubmitted(true);
        } else {
          setIsSubmitted(false);
        }

      } catch (error) {
        console.error("Failed to load data:", error);
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
        <p className="text-gray-500">The mentor has not yet submitted the Attendance Report.</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const snapshotData = { attendanceRecords, students, sessions };
    const currentDataString = JSON.stringify(snapshotData);
    
    // Save snapshot for faculty
    await saveToCloudflare('facultySnapshotAttendance', snapshotData);
    
    // Save hash locally to know when data changes again
    localStorage.setItem('facultySnapshotHash_Attendance', currentDataString);
    await saveToCloudflare('facultySnapshotHash_Attendance', currentDataString);
    
    setIsSubmitted(true);
    setIsSubmitting(false);
    alert('Attendance updates successfully sent to Faculty!');
  };

  return (
    <div className="space-y-6 max-w-[95%] mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Report</h1>
          <p className="text-gray-500 mt-1">Detailed view of student attendance across all scheduled sessions.</p>
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
                <th className="px-4 py-4 text-sm font-bold text-gray-700 whitespace-nowrap sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                  Student Name
                </th>
                <th className="px-4 py-4 text-sm font-bold text-gray-700 whitespace-nowrap border-r border-gray-200">
                  Email
                </th>
                {sessions.map((session, i) => (
                  <th key={i} className="px-4 py-4 text-xs font-bold text-gray-600 text-center whitespace-nowrap min-w-[100px]">
                    {session.title}
                    <div className="text-[10px] text-gray-400 font-normal mt-1">{session.dateString}</div>
                  </th>
                ))}
                <th className="px-4 py-4 text-sm font-bold text-primary text-center whitespace-nowrap border-l border-gray-200">
                  Total / {sessions.length || 0}
                </th>
                <th className="px-4 py-4 text-sm font-bold text-green-600 text-center whitespace-nowrap">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students
                .filter(s => 
                  s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  s.email?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((student, idx) => {
                let presentCount = 0;
                
                return (
                  <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-100">
                      {student.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap border-r border-gray-100">
                      {student.email}
                    </td>
                    
                    {sessions.map((session, i) => {
                      let status = 'pending';
                      
                      const dateString = session.dateString;
                      const dayRecords = attendanceRecords[dateString] || {};
                      status = dayRecords[student.email] || 'pending';
                      
                      if (status === 'present') {
                        presentCount++;
                      }
                      
                      return (
                        <td key={i} className="px-4 py-3 text-center">
                          {status === 'present' ? (
                            <CheckCircle2 size={18} className="text-green-500 mx-auto" />
                          ) : status === 'absent' ? (
                            <XCircle size={18} className="text-red-400 mx-auto" />
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}
                        </td>
                      );
                    })}
                    
                    <td className="px-4 py-3 text-sm font-bold text-primary text-center whitespace-nowrap border-l border-gray-100">
                      {presentCount} / {sessions.length || 0}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600 text-center whitespace-nowrap">
                      {sessions.length > 0 ? Math.round((presentCount / sessions.length) * 100) : 0}%
                    </td>
                  </tr>
                );
              })}
              
              {students.length === 0 && (
                <tr>
                  <td colSpan={sessions.length + 4} className="px-6 py-12 text-center text-gray-500">
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

export default AttendanceReport;
