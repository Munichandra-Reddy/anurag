import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Video, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const courseName = "Full Stack Web Development";

// Helper to get 13 upcoming/past Thursdays starting from a specific date
const getThursdays = (startDate: Date, count: number) => {
  const result = [];
  let current = new Date(startDate);
  while (current.getDay() !== 4) {
    current.setDate(current.getDate() + 1);
  }
  for (let i = 0; i < count; i++) {
    result.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }
  return result;
};

const currentYear = new Date().getFullYear();
const defaultSessions = getThursdays(new Date(currentYear, 6, 1), 13).map((date, i) => ({
  id: Date.now() + i, // Unique IDs
  title: `Session ${i + 1}`,
  topic: `Introduction to Web Technologies & Modern Frameworks Part ${i + 1}`,
  dateString: date.toISOString().split('T')[0], // Store as ISO string date part
  time: "10:00 AM - 12:00 PM"
}));

const Classes: React.FC = () => {
  const location = useLocation();
  const isMentor = location.pathname.includes('mentor-dashboard');

  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('anuragLmsClasses');
    return saved ? JSON.parse(saved) : defaultSessions;
  });

  useEffect(() => {
    localStorage.setItem('anuragLmsClasses', JSON.stringify(sessions));
  }, [sessions]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expandedSession, setExpandedSession] = useState<number | null>(null);

  // Add Session State
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('10:00 AM - 12:00 PM');

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newTopic || !newDate || !newTime) return;

    const newSession = {
      id: Date.now(),
      title: newTitle,
      topic: newTopic,
      dateString: newDate,
      time: newTime
    };

    const updatedSessions = [...sessions, newSession].sort((a, b) => new Date(a.dateString).getTime() - new Date(b.dateString).getTime());
    setSessions(updatedSessions);
    setIsAdding(false);
    setNewTitle('');
    setNewTopic('');
    setNewDate('');
    setNewTime('10:00 AM - 12:00 PM');
  };

  const handleRemoveSession = (id: number) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      setSessions(sessions.filter((s: any) => s.id !== id));
    }
  };

  // Helper to dynamically get status
  const getSessionStatus = (dateString: string) => {
    const sessionDate = new Date(dateString).toDateString();
    const today = new Date().toDateString();
    if (sessionDate === today) return 'TODAY';
    if (new Date(dateString) < new Date(today)) return 'COMPLETED';
    return 'UPCOMING';
  };

  const toggleDetails = (id: number) => {
    setExpandedSession(expandedSession === id ? null : id);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Header
    const header = weekDays.map(day => (
      <div key={day} className="text-center font-semibold text-sm text-gray-500 py-2">
        {day}
      </div>
    ));

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-4 bg-gray-50/30 border border-gray-100"></div>);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const currentDateString = new Date(year, month, d).toISOString().split('T')[0];
      
      // Check if we have sessions on this day
      const daySessions = sessions.filter((s: any) => s.dateString === currentDateString);

      days.push(
        <div key={d} className={`min-h-[100px] p-2 border border-gray-100 transition-colors ${daySessions.length > 0 ? 'bg-orange-50/30' : 'bg-white hover:bg-gray-50'}`}>
          <div className="flex justify-between items-start mb-2">
            <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${daySessions.length > 0 ? 'bg-primary text-white' : 'text-gray-700'}`}>
              {d}
            </span>
          </div>
          {daySessions.map((session: any) => (
            <div key={session.id} className="mt-1">
              <div className="bg-primary/10 border border-primary/20 text-primary text-xs p-1.5 rounded-md font-medium mb-1">
                <div className="flex items-center gap-1 mb-1">
                  <Video size={12} />
                  <span className="truncate">{session.title}</span>
                </div>
                <div className="text-[10px] text-gray-600 flex items-center gap-1 truncate">
                  <Clock size={10} /> {session.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"><ChevronLeft size={16} /></button>
            <button onClick={nextMonth} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-gray-100">
          {header}
        </div>
        <div className="grid grid-cols-7">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Class Schedule</h1>
          <p className="text-gray-500 flex items-center gap-2">
            <CalendarIcon size={16} />
            {courseName}
          </p>
        </div>
        <div className="flex gap-3">
          {isMentor && !isAdding && (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              <Plus size={16} /> Add Session
            </button>
          )}
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium text-sm">
            Total Sessions: {sessions.length}
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-primary/20 shadow-sm relative">
          <h3 className="font-bold text-gray-900 mb-4">Add New Class Session</h3>
          <form onSubmit={handleAddSession} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Title</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Session 14"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
              <input 
                type="text" 
                value={newTopic}
                onChange={e => setNewTopic(e.target.value)}
                placeholder="Topic description"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input 
                type="date" 
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
              <input 
                type="text" 
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                placeholder="10:00 AM - 12:00 PM"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                required
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-orange-600"
              >
                Save Session
              </button>
            </div>
          </form>
        </div>
      )}

      {renderCalendar()}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">All Sessions</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {sessions.map((session: any) => {
            const status = getSessionStatus(session.dateString);
            return (
              <div key={session.id} className="border border-gray-100 rounded-xl hover:shadow-sm transition-shadow bg-white overflow-hidden group">
                <div className="flex items-center justify-between p-4 flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 text-primary rounded-xl flex items-center justify-center font-bold text-lg shrink-0">
                      <Video size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{session.title}</h4>
                      <p className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                        <CalendarIcon size={14} /> {new Date(session.dateString).toDateString()}
                        <span className="mx-1 text-gray-300">•</span>
                        <Clock size={14} /> {session.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-auto">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      status === 'COMPLETED' 
                        ? 'bg-green-100 text-green-700'
                        : status === 'TODAY'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {status}
                    </span>
                    <button 
                      onClick={() => toggleDetails(session.id)}
                      className="px-4 py-2 text-sm font-medium text-primary border border-primary/40 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      {expandedSession === session.id ? 'Hide Details' : 'View Details'}
                    </button>
                    {isMentor && (
                      <button
                        onClick={() => handleRemoveSession(session.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Delete Session"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Expanded Area */}
                {expandedSession === session.id && (
                  <div className="px-4 pb-4 pt-3 border-t border-gray-50 bg-orange-50/10 transition-all">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">Topic Covered</span>
                      <p className="text-gray-700 text-sm">{session.topic}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {sessions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No sessions scheduled yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Classes;
