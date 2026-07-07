import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronDown, ChevronUp, PlayCircle, FileText, CheckCircle, Plus, Trash2, X, Upload } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const defaultSessions = [
  { id: 1, title: 'Introduction to Autodesk Revit & BIM', content: 'Understand the concept of Building Information Modeling (BIM) and how Revit fits into the architectural workflow. Learn about project templates and basic setup.' },
  { id: 2, title: 'Revit User Interface & Navigation', content: 'Explore the ribbon, properties palette, project browser, and drawing area. Master 2D and 3D navigation, view controls, and basic selection methods.' },
  { id: 3, title: 'Basic Modeling: Walls, Doors & Windows', content: 'Learn to create and modify walls, set constraints, and understand wall properties. Add and adjust doors and windows within the model.' },
  { id: 4, title: 'Floors, Roofs & Ceilings', content: 'Create architectural floors, sketch roof boundaries (by footprint and extrusion), and generate automatic or sketched ceilings.' },
  { id: 5, title: 'Dimensions, Annotations & Detailing', content: 'Add temporary and permanent dimensions, text notes, and tags. Create 2D drafting views and understand detail components.' },
  { id: 6, title: 'Schedules and Quantities', content: 'Extract data from your model to create door, window, and room schedules. Learn how to format and sort schedule data.' },
  { id: 7, title: 'Creating Sheets & Printing', content: 'Set up title blocks, place views on sheets, and adjust viewport scales. Configure print settings and export your model to PDF or CAD formats.' },
  { id: 8, title: 'Introduction to Families & Components', content: 'Understand the difference between system families and loadable families. Load furniture, fixtures, and other components into your project.' }
];

const CourseContent: React.FC = () => {
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const location = useLocation();
  const isMentor = location.pathname.includes('/mentor-dashboard');

  const [sessionsData, setSessionsData] = useState(() => {
    const saved = localStorage.getItem('anuragLmsCoursesRevit');
    return saved ? JSON.parse(saved) : defaultSessions;
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPdfName, setNewPdfName] = useState('');
  const [newPdfDataUrl, setNewPdfDataUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [viewingFile, setViewingFile] = useState<{name: string, url: string} | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPdfName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewPdfDataUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    localStorage.setItem('anuragLmsCoursesRevit', JSON.stringify(sessionsData));
  }, [sessionsData]);

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newSession = {
      id: Date.now(),
      title: newTitle,
      content: newContent,
      pdfName: newPdfName,
      pdfDataUrl: newPdfDataUrl,
      videoUrl: newVideoUrl
    };

    setSessionsData([...sessionsData, newSession]);
    setNewTitle('');
    setNewContent('');
    setNewPdfName('');
    setNewPdfDataUrl('');
    setNewVideoUrl('');
    setIsAdding(false);
  };

  const handleRemoveCourse = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setSessionsData(sessionsData.filter((s: any) => s.id !== id));
  };

  return (
    <div className="w-full max-w-5xl space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div className="flex items-center gap-3 text-gray-900 font-bold text-xl sm:text-2xl">
          <BookOpen className="text-orange-500" size={24} className="sm:w-7 sm:h-7" /> 
          Course Content
        </div>
        <div className="flex items-center gap-3">
          {isMentor && !isAdding && (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm"
            >
              <Plus size={16} /> Add Course
            </button>
          )}
          {isMentor && (
            <div className="px-4 py-2 bg-orange-50 text-orange-600 font-bold rounded-lg border border-orange-200 text-sm">
            Mastering Revit
          </div>
        )}
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mt-2 max-w-4xl leading-relaxed">
        This comprehensive Revit module is divided into structured sessions. Follow the sequence to build a strong foundation in architectural BIM modeling.
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
          
          <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Course</h3>
          
          <form onSubmit={handleAddCourse} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Description</label>
              <textarea 
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={3}
                placeholder="Provide a detailed description of what this session will cover..."
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm resize-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Resources (Optional)</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                  <Upload size={16} /> Choose File
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
                {newPdfName && <span className="text-sm text-primary font-medium">{newPdfName}</span>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Video URL (Optional)</label>
              <input 
                type="url" 
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
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
                Save Course
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
                <div className="flex items-start md:items-center gap-3 md:gap-4 w-full md:w-auto">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex shrink-0 items-center justify-center font-bold text-sm transition-colors ${isExpanded ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-base md:text-lg transition-colors leading-tight ${isExpanded ? 'text-primary' : 'text-gray-900'}`}>
                      {session.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Session {index + 1} • Revit Architecture</p>
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
                  
                  <div className="flex flex-col md:flex-row flex-wrap gap-3 mt-4">
                    {(session.pdfName || defaultSessions.some(s => s.id === session.id)) && (
                      <button 
                        onClick={() => {
                          if (session.pdfDataUrl) {
                            setViewingFile({ name: session.pdfName, url: session.pdfDataUrl });
                          } else {
                            alert(`Opening document: ${session.pdfName || 'Lesson Notes'}`);
                          }
                        }}
                        className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors w-full md:w-auto"
                      >
                        <FileText size={16} className="text-blue-500" /> {session.pdfName || 'Lesson Notes'}
                      </button>
                    )}
                    {(session.videoUrl || defaultSessions.some(s => s.id === session.id)) && (
                      <a href={session.videoUrl || '#'} target="_blank" rel="noreferrer" className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors w-full md:w-auto">
                        <PlayCircle size={16} className="text-red-500" /> Watch Recording
                      </a>
                    )}
                    {!isMentor && (
                      <button className="md:ml-auto flex items-center justify-center md:justify-start gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-bold hover:bg-green-100 transition-colors w-full md:w-auto mt-2 md:mt-0">
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

      {viewingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="text-primary" size={24} />
                <h3 className="font-bold text-gray-900 text-lg truncate pr-4">{viewingFile.name}</h3>
              </div>
              <button 
                onClick={() => setViewingFile(null)} 
                className="p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100/50 p-6 flex items-center justify-center">
              {viewingFile.url.startsWith('data:image') ? (
                <img src={viewingFile.url} alt={viewingFile.name} className="max-w-full max-h-full object-contain rounded-xl shadow-sm border border-gray-200 bg-white" />
              ) : viewingFile.url.startsWith('data:application/pdf') ? (
                <iframe src={viewingFile.url} className="w-full h-full rounded-xl shadow-sm border border-gray-200 bg-white" title={viewingFile.name} />
              ) : (
                <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-gray-200 max-w-md">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText size={40} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">File Preview Unavailable</h3>
                  <p className="text-gray-500 mb-8">This file type cannot be previewed directly in the browser.</p>
                  <a 
                    href={viewingFile.url} 
                    download={viewingFile.name} 
                    className="inline-flex items-center justify-center w-full px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-sm"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseContent;
