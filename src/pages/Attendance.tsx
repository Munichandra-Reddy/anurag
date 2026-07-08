import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Search, Calendar as CalendarIcon, Filter, Loader2 } from 'lucide-react';
import { getFromCloudflare, saveToCloudflare } from '../utils/cloudflare';

const Attendance: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions, setSessions] = useState<any[]>(() => {
    const savedClasses = localStorage.getItem('anuragLmsClasses');
    return savedClasses ? JSON.parse(savedClasses) : [];
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const savedClasses = localStorage.getItem('anuragLmsClasses');
    if (savedClasses) {
      const parsed = JSON.parse(savedClasses);
      if (parsed.length > 0) {
        const hasToday = parsed.some((s: any) => s.dateString === today);
        return hasToday ? today : parsed[0].dateString;
      }
    }
    return '';
  });
  const [batchFilter, setBatchFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  
  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cloudStudents, cloudAttendance] = await Promise.all([
          getFromCloudflare('registeredStudents'),
          getFromCloudflare('attendanceRecords')
        ]);
        
        // Merge lingering local students to prevent data loss
        const localStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]');
        const allStudentsMap = new Map();
        [...localStudents, ...(cloudStudents || [])].forEach(s => {
          if (s && s.email) allStudentsMap.set(s.email, s);
        });
        setRegisteredStudents(Array.from(allStudentsMap.values()));

        // Merge lingering local attendance records
        const localAttendance = JSON.parse(localStorage.getItem('attendanceRecords') || '{}');
        const mergedAttendance = { ...localAttendance, ...(cloudAttendance || {}) };
        setAttendanceRecords(mergedAttendance);
        
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const students = useMemo(() => {
    const currentDayRecords = attendanceRecords[selectedDate] || {};
    return registeredStudents.map((s: any) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      batch: s.batch || 'Unassigned',
      status: currentDayRecords[s.email] || 'pending'
    }));
  }, [registeredStudents, attendanceRecords, selectedDate]);

  const saveAttendance = async (newRecords: Record<string, Record<string, string>>) => {
    setAttendanceRecords(newRecords);
    localStorage.setItem('attendanceRecords', JSON.stringify(newRecords));
    await saveToCloudflare('attendanceRecords', newRecords);
  };

  const markAttendance = (email: string, status: string) => {
    if (!selectedDate) return;
    const newRecords = { ...attendanceRecords };
    if (!newRecords[selectedDate]) {
      newRecords[selectedDate] = {};
    }
    newRecords[selectedDate] = {
      ...newRecords[selectedDate],
      [email]: status
    };
    saveAttendance(newRecords);
  };

  const markAllPresent = () => {
    if (!selectedDate) return;
    const newRecords = { ...attendanceRecords };
    if (!newRecords[selectedDate]) {
      newRecords[selectedDate] = {};
    }
    
    const dayRecord = { ...newRecords[selectedDate] };
    registeredStudents.forEach((s: any) => {
      dayRecord[s.email] = 'present';
    });
    
    newRecords[selectedDate] = dayRecord;
    saveAttendance(newRecords);
  };

  const handleBatchChange = async (studentId: number, newBatch: string) => {
    const updated = registeredStudents.map((s: any) => s.id === studentId ? { ...s, batch: newBatch } : s);
    setRegisteredStudents(updated);
    localStorage.setItem('registeredStudents', JSON.stringify(updated));
    await saveToCloudflare('registeredStudents', updated);
  };

  const filteredStudents = students.filter((student: any) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch = batchFilter === 'All' || student.batch === batchFilter;
    return matchesSearch && matchesBatch;
  });

  const presentCount = filteredStudents.filter((s: any) => s.status === 'present').length;
  const totalCount = filteredStudents.length;

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-500 mt-1">Track and manage student attendance for your batches.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 border-r border-gray-200 pr-4">
            <CalendarIcon size={18} className="text-primary" />
            {sessions.length > 0 ? (
              <select 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="outline-none bg-transparent font-medium text-gray-900 cursor-pointer"
              >
                {sessions.map((session, idx) => (
                  <option key={idx} value={session.dateString}>
                    {session.dateString} ({session.title})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-medium text-gray-500">No sessions scheduled</span>
            )}
          </div>
          <div className="flex flex-col px-2">
            <span className="text-xs text-gray-500 font-medium">Present Today</span>
            <span className="text-lg font-bold text-gray-900">{presentCount} <span className="text-sm text-gray-500 font-normal">/ {totalCount}</span></span>
          </div>
        </div>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="flex items-center justify-between gap-2 px-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium w-full sm:w-auto">
            <Filter size={16} className="shrink-0" />
            <select 
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="bg-transparent outline-none cursor-pointer w-full text-right sm:text-left"
            >
              <option value="All">All Batches</option>
              <option value="Morning">Morning Batch</option>
              <option value="Evening">Evening Batch</option>
            </select>
          </div>
          <button 
            onClick={markAllPresent}
            className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-primary rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium w-full sm:w-auto shrink-0 shadow-sm"
          >
            <Check size={16} />
            Mark All Present
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200">
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Details</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student: any, idx: number) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={student.id || student.email} 
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <select 
                      value={student.batch}
                      onChange={(e) => handleBatchChange(student.id, e.target.value)}
                      className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-800 border border-transparent focus:border-gray-300 focus:outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      <option value="Unassigned" disabled>Select Batch</option>
                      <option value="Morning">Morning Batch</option>
                      <option value="Evening">Evening Batch</option>
                    </select>
                  </td>
                  <td className="py-4 px-6">
                    {student.status === 'present' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Present
                      </span>
                    )}
                    {student.status === 'absent' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        Absent
                      </span>
                    )}
                    {student.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                        Not Marked
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => markAttendance(student.email, 'present')}
                        className={`p-2 rounded-lg transition-colors ${
                          student.status === 'present' 
                            ? 'bg-green-100 text-green-700' 
                            : 'text-gray-400 hover:bg-green-50 hover:text-green-600 bg-gray-50 sm:bg-transparent'
                        }`}
                        title="Mark Present"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => markAttendance(student.email, 'absent')}
                        className={`p-2 rounded-lg transition-colors ${
                          student.status === 'absent' 
                            ? 'bg-red-100 text-red-700' 
                            : 'text-gray-400 hover:bg-red-50 hover:text-red-600 bg-gray-50 sm:bg-transparent'
                        }`}
                        title="Mark Absent"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    No students have signed up yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
