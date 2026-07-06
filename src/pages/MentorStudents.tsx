import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Mail, Calendar, User, Loader2 } from 'lucide-react';
import { getFromCloudflare, saveToCloudflare } from '../utils/cloudflare';

interface Student {
  id: number;
  name: string;
  email: string;
  registeredAt: string;
  batch?: string;
}

const MentorStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const cloudStudents = await getFromCloudflare('registeredStudents') || [];
        // Optional fallback to merge if there are lingering local students
        const localStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]');
        
        const allStudentsMap = new Map();
        [...localStudents, ...cloudStudents].forEach(s => {
          if (s && s.email) allStudentsMap.set(s.email, s);
        });
        
        setStudents(Array.from(allStudentsMap.values()));
      } catch (error) {
        console.error("Failed to load students:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStudents();
  }, []);

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBatchChange = async (studentId: number, newBatch: string) => {
    const updated = students.map(s => s.id === studentId ? { ...s, batch: newBatch } : s);
    setStudents(updated);
    
    // Save both to local and cloud to keep everything in sync
    localStorage.setItem('registeredStudents', JSON.stringify(updated));
    await saveToCloudflare('registeredStudents', updated);
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Registered Students</h1>
          <p className="text-gray-500 mt-1">View details of all students who have signed up.</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 px-6">
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Students</span>
            <span className="text-2xl font-bold text-primary">{students.length}</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
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

      {/* Students Grid */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student: any, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={student.id}
              className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative"
            >
              <div className="absolute top-4 right-4">
                <select 
                  value={student.batch || 'Unassigned'}
                  onChange={(e) => handleBatchChange(student.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-gray-50 text-gray-700 font-medium focus:outline-none focus:border-primary"
                >
                  <option value="Unassigned" disabled>Select Batch</option>
                  <option value="Morning">Morning Batch</option>
                  <option value="Evening">Evening Batch</option>
                </select>
              </div>
              <div className="flex items-start gap-4 pr-24">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-semibold text-gray-900 truncate text-lg">{student.name}</h3>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} className="text-gray-400 shrink-0" />
                      <span className="truncate">{student.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={14} className="text-gray-400 shrink-0" />
                      <span>{new Date(student.registeredAt).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
          <p className="text-gray-500">
            {students.length === 0 
              ? "No students have registered yet." 
              : "No students match your search query."}
          </p>
        </div>
      )}
    </div>
  );
};

export default MentorStudents;
