import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronDown, ChevronUp, PlayCircle, FileText, CheckCircle, Plus, Trash2, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const defaultSessions = [
  { id: 1, title: 'Introduction to Java & Environment Setup', content: 'Understand the history of Java, JVM, JRE, and JDK architecture. Set up the development environment, install IDE, and write the first Hello World program.' },
  { id: 2, title: 'Variables, Data Types & Operators', content: 'Deep dive into primitive and non-primitive data types. Learn about variable scope, type casting, and various operators (arithmetic, relational, logical, bitwise).' },
  { id: 3, title: 'Control Flow Statements', content: 'Master decision-making with if-else and switch statements. Learn iterative execution using for, while, and do-while loops along with break and continue keywords.' },
  { id: 4, title: 'Introduction to OOP (Classes & Objects)', content: 'Understand the core concepts of Object-Oriented Programming. Learn how to define classes, create objects, and understand the lifecycle of an object in memory.' },
  { id: 5, title: 'Methods, Constructors & Encapsulation', content: 'Learn how to write reusable methods and define constructors. Understand access modifiers (private, public, protected) and the concept of data hiding through Encapsulation.' },
  { id: 6, title: 'Inheritance & Polymorphism', content: 'Explore code reusability through Inheritance (is-a relationship). Understand method overloading (compile-time) and method overriding (run-time) polymorphism.' },
  { id: 7, title: 'Abstract Classes & Interfaces', content: 'Learn to achieve abstraction in Java. Compare Abstract classes vs Interfaces, and understand default and static methods introduced in modern Java interfaces.' },
  { id: 8, title: 'Arrays & Strings in Java', content: 'Work with single and multi-dimensional arrays. Understand the String pool, immutability of Strings, and use StringBuilder/StringBuffer for dynamic string manipulation.' },
  { id: 9, title: 'Exception Handling', content: 'Learn the hierarchy of Java exceptions. Master the try-catch-finally blocks, throw and throws keywords, and create custom user-defined exceptions.' },
  { id: 10, title: 'Java Collections Framework', content: 'Deep dive into the Collections hierarchy. Work with List (ArrayList, LinkedList), Set (HashSet, TreeSet), and Map (HashMap, TreeMap) to manage groups of objects.' },
  { id: 11, title: 'File I/O & Serialization', content: 'Read from and write to files using byte streams and character streams (FileInputStream, BufferedReader). Understand object state persistence using Serialization.' },
  { id: 12, title: 'Multithreading & Concurrency', content: 'Understand the thread lifecycle. Learn how to create threads using Thread class and Runnable interface. Master synchronization and inter-thread communication.' },
  { id: 13, title: 'Java 8 Features & Stream API', content: 'Explore modern Java capabilities including Lambda expressions, Functional Interfaces, Optional class, and the powerful Stream API for bulk data operations.' }
];

const CourseContent: React.FC = () => {
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const location = useLocation();
  const isMentor = location.pathname.includes('/mentor-dashboard');

  const [sessionsData, setSessionsData] = useState(() => {
    const saved = localStorage.getItem('anuragLmsCourses');
    return saved ? JSON.parse(saved) : defaultSessions;
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    localStorage.setItem('anuragLmsCourses', JSON.stringify(sessionsData));
  }, [sessionsData]);

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newSession = {
      id: Date.now(),
      title: newTitle,
      content: newContent
    };

    setSessionsData([...sessionsData, newSession]);
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  const handleRemoveCourse = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setSessionsData(sessionsData.filter((s: any) => s.id !== id));
  };

  return (
    <div className="w-full max-w-5xl space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-gray-900 font-bold text-2xl">
          <BookOpen className="text-orange-500" size={28} /> 
          Course Content
        </div>
        <div className="flex items-center gap-3">
          {isMentor && !isAdding && (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm"
            >
              <Plus size={16} /> Add Session
            </button>
          )}
          {isMentor && (
            <div className="px-4 py-1.5 bg-orange-50 border border-orange-200 text-orange-600 rounded-full text-sm font-bold">
              Mastering Core Java
            </div>
          )}
        </div>
      </div>
      
      <p className="text-gray-600 text-sm">
        This comprehensive Java module is divided into structured sessions. Follow the sequence to build a strong foundation in backend development.
      </p>

      {/* Add Course Form (Mentor Only) */}
      {isMentor && isAdding && (
        <div className="bg-white border-2 border-primary/20 p-6 rounded-2xl shadow-sm mb-6 relative">
          <button 
            onClick={() => setIsAdding(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-full"
          >
            <X size={18} />
          </button>
          
          <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Course Session</h3>
          
          <form onSubmit={handleAddCourse} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Title</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Advanced Java Concepts"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Description / Content</label>
              <textarea 
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={3}
                placeholder="Provide a detailed description of what this session will cover..."
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm resize-none"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-orange-600 text-sm transition-colors shadow-sm"
              >
                Save Session
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4 mt-6">
        {sessionsData.length === 0 && (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-500">
            No course sessions available. {isMentor && 'Add one above!'}
          </div>
        )}
        
        {sessionsData.map((session: any, index: number) => {
          const isExpanded = expandedId === session.id;
          return (
            <div key={session.id} className={`border rounded-2xl overflow-hidden transition-all duration-200 ${isExpanded ? 'border-primary shadow-md bg-white' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
              <div 
                className="p-5 flex items-center justify-between cursor-pointer select-none"
                onClick={() => setExpandedId(isExpanded ? null : session.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isExpanded ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {index + 1}
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg transition-colors ${isExpanded ? 'text-primary' : 'text-gray-900'}`}>
                      {session.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Session {index + 1} • Core Java Module</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {isMentor && (
                    <button 
                      onClick={(e) => handleRemoveCourse(e, session.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove Session"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  {isExpanded ? <ChevronUp className="text-primary" /> : <ChevronDown className="text-gray-400" />}
                </div>
              </div>
              
              {isExpanded && (
                <div className="px-5 pb-6 pt-2 border-t border-gray-100 bg-gray-50/30">
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    {session.content}
                  </p>
                  
                  <div className="flex flex-wrap gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
                      <FileText size={16} className="text-blue-500" /> Lesson Notes
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
                      <PlayCircle size={16} className="text-red-500" /> Watch Recording
                    </button>
                    {!isMentor && (
                      <button className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-bold hover:bg-green-100 transition-colors">
                        <CheckCircle size={16} /> Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseContent;
