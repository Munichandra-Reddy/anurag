import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronDown, ChevronUp, PlayCircle, FileText, CheckCircle, Plus, Trash2, X, Upload, Edit2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getFromCloudflare, saveToCloudflare, replaceInCloudflare, isMuniUser } from '../utils/cloudflare';
import { MUNI_STUDENTS } from '../data/students';

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

// Helper to compress image files before saving to Data URL
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          resolve(compressedDataUrl);
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

const CourseContent: React.FC = () => {
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const location = useLocation();
  const isMentor = location.pathname.includes('/mentor-dashboard');

  const [sessionsData, setSessionsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loggedInEmail = (sessionStorage.getItem('loggedInEmail') || '').toLowerCase().trim();

  // Determine if logged in user is a Muni mentor or Muni student
  const checkIsMuni = async (): Promise<boolean> => {
    if (!loggedInEmail) return false;
    if (loggedInEmail === 'muni@geonixa.com' || loggedInEmail === 'raju@anurag.com') return true;
    if (MUNI_STUDENTS.some(s => (s.email || '').toLowerCase().trim() === loggedInEmail)) return true;

    const localMuni = JSON.parse(localStorage.getItem('registeredStudents_muni@geonixa.com') || '[]');
    if (Array.isArray(localMuni) && localMuni.some((s: any) => (s?.email || '').toLowerCase().trim() === loggedInEmail)) return true;

    const cloudMuni = await getFromCloudflare('registeredStudents_muni@geonixa.com') || [];
    if (Array.isArray(cloudMuni) && cloudMuni.some((s: any) => (s?.email || '').toLowerCase().trim() === loggedInEmail)) return true;

    return isMuniUser();
  };

  const getCourseStorageKey = async (): Promise<string> => {
    const isMuni = await checkIsMuni();
    return isMuni ? 'anuragLmsCoursesRevit_muni@geonixa.com' : 'anuragLmsCoursesRevit';
  };

  // Load courses safely without accidentally overwriting active sessions
  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const courseKey = await getCourseStorageKey();
      const cloudCourses = await getFromCloudflare(courseKey);
      const saved = localStorage.getItem(courseKey);
      const localCourses = saved ? JSON.parse(saved) : null;

      let resolvedSessions: any[] = [];

      if (Array.isArray(cloudCourses) && cloudCourses.length > 0) {
        resolvedSessions = cloudCourses;
        localStorage.setItem(courseKey, JSON.stringify(cloudCourses));
      } else if (Array.isArray(localCourses) && localCourses.length > 0) {
        resolvedSessions = localCourses;
      } else if (Array.isArray(cloudCourses)) {
        resolvedSessions = cloudCourses;
      } else {
        resolvedSessions = courseKey.includes('_muni') ? [] : defaultSessions;
      }

      setSessionsData(resolvedSessions);
    } catch (err) {
      console.error("Failed to load course sessions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();

    const handleFocus = () => {
      loadCourses();
    };
    window.addEventListener('focus', handleFocus);

    const interval = setInterval(() => {
      loadCourses();
    }, 3000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  // Save/Update/Delete courses to Cloudflare & localStorage
  const saveCourses = async (newSessions: any[]) => {
    setSessionsData(newSessions);
    try {
      const courseKey = await getCourseStorageKey();
      localStorage.setItem(courseKey, JSON.stringify(newSessions));
      
      await replaceInCloudflare(courseKey, newSessions);
      await saveToCloudflare(courseKey, newSessions);
    } catch (err) {
      console.error("Failed to save course sessions:", err);
    }
  };

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPdfName, setNewPdfName] = useState('');
  const [newPdfDataUrl, setNewPdfDataUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  // Viewing modal state
  const [viewingFile, setViewingFile] = useState<{
    name: string;
    url: string;
    type: 'image' | 'pdf' | 'youtube' | 'video' | 'file';
    isBlob?: boolean;
  } | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewPdfName(file.name);

    if (file.type.startsWith('image/')) {
      const compressed = await compressImageFile(file);
      setNewPdfDataUrl(compressed);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewPdfDataUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    if (editingId) {
      const updatedSessions = sessionsData.map(s => 
        s.id === editingId 
          ? { 
              ...s, 
              title: newTitle, 
              content: newContent, 
              pdfName: newPdfName || s.pdfName, 
              pdfDataUrl: newPdfDataUrl || s.pdfDataUrl, 
              videoUrl: newVideoUrl 
            } 
          : s
      );
      await saveCourses(updatedSessions);
      setEditingId(null);
    } else {
      const newSession = {
        id: Date.now(),
        title: newTitle,
        content: newContent,
        pdfName: newPdfName,
        pdfDataUrl: newPdfDataUrl,
        videoUrl: newVideoUrl
      };
      await saveCourses([...sessionsData, newSession]);
    }

    setNewTitle('');
    setNewContent('');
    setNewPdfName('');
    setNewPdfDataUrl('');
    setNewVideoUrl('');
    setIsAdding(false);
  };

  const handleEditCourse = (e: React.MouseEvent, session: any) => {
    e.stopPropagation();
    setIsAdding(true);
    setEditingId(session.id);
    setNewTitle(session.title);
    setNewContent(session.content);
    setNewPdfName(session.pdfName || '');
    setNewPdfDataUrl(session.pdfDataUrl || '');
    setNewVideoUrl(session.videoUrl || '');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveCourse = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to remove this course session? It will be removed for all Muni Mentor students.")) {
      const updated = sessionsData.filter((s: any) => s.id !== id);
      await saveCourses(updated);
    }
  };

  // Open PDF or Screenshot image in viewer modal for Muni Mentor and Muni Students
  const handleOpenResource = (session: any) => {
    const url = session.pdfDataUrl;
    const name = session.pdfName || 'Lesson Notes';

    if (url && typeof url === 'string' && url.length > 10) {
      const isImg = url.startsWith('data:image') || /\.(png|jpg|jpeg|webp|gif)$/i.test(name);
      const isPdf = url.startsWith('data:application/pdf') || name.endsWith('.pdf');

      if (isPdf && url.startsWith('data:application/pdf')) {
        fetch(url)
          .then(res => res.blob())
          .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            setViewingFile({ name, url: blobUrl, type: 'pdf', isBlob: true });
          })
          .catch(() => {
            setViewingFile({ name, url, type: 'pdf' });
          });
      } else {
        setViewingFile({
          name,
          url,
          type: isImg ? 'image' : isPdf ? 'pdf' : 'file'
        });
      }
    } else {
      // Fallback sample viewer
      setViewingFile({
        name,
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        type: 'pdf'
      });
    }
  };

  // Open Video recording in modal player for Muni Mentor and Muni Students
  const handleOpenVideo = (e: React.MouseEvent, session: any) => {
    e.stopPropagation();
    const url = session.videoUrl;
    if (!url) return;

    const embedUrl = getYouTubeEmbedUrl(url);
    setViewingFile({
      name: `${session.title} - Video Recording`,
      url: embedUrl || url,
      type: embedUrl ? 'youtube' : 'video'
    });
  };

  return (
    <div className="w-full max-w-5xl space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div className="flex items-center gap-3 text-gray-900 font-bold text-xl sm:text-2xl">
          <BookOpen className="text-orange-500 sm:w-7 sm:h-7" size={24} /> 
          Course Content
        </div>
        <div className="flex items-center gap-3">
          {isMentor && !isAdding && (
            <button 
              onClick={() => {
                setIsAdding(true);
                setEditingId(null);
                setNewTitle('');
                setNewContent('');
                setNewPdfName('');
                setNewPdfDataUrl('');
                setNewVideoUrl('');
              }}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={16} /> Session Course
            </button>
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
            onClick={() => { setIsAdding(false); setEditingId(null); }}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-full cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <h3 className="text-lg font-bold text-gray-900 mb-4">{editingId ? 'Edit Course' : 'Add New Course'}</h3>
          
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Resources (Screenshot / PDF File)</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                  <Upload size={16} /> Choose File
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
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
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-orange-600 text-sm transition-colors shadow-sm cursor-pointer"
              >
                {editingId ? 'Update Course' : 'Save Course'}
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
                      {session.title ? session.title.replace(' • Revit Architecture', '').replace('Revit Architecture', '') : ''}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Session {index + 1}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {isMentor && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => handleEditCourse(e, session)}
                        className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Session"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={(e) => handleRemoveCourse(e, session.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove Session"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
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
                    {(session.pdfName || session.pdfDataUrl || defaultSessions.some(s => s.id === session.id)) && (
                      <button 
                        onClick={() => handleOpenResource(session)}
                        className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors w-full md:w-auto cursor-pointer"
                      >
                        <FileText size={16} className="text-blue-500" /> {session.pdfName || 'Lesson Notes'}
                      </button>
                    )}
                    {(session.videoUrl || defaultSessions.some(s => s.id === session.id)) && (
                      <button 
                        onClick={(e) => handleOpenVideo(e, session)}
                        className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors w-full md:w-auto cursor-pointer"
                      >
                        <PlayCircle size={16} className="text-red-500" /> Watch Recording
                      </button>
                    )}
                    {!isMentor && (
                      <button className="md:ml-auto flex items-center justify-center md:justify-start gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-bold hover:bg-green-100 transition-colors w-full md:w-auto mt-2 md:mt-0 cursor-pointer">
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

      {/* Resource & Video Viewer Modal */}
      {viewingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="text-primary" size={24} />
                <h3 className="font-bold text-gray-900 text-lg truncate pr-4">{viewingFile.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                {viewingFile.url && (
                  <a 
                    href={viewingFile.url} 
                    target="_blank" 
                    rel="noreferrer"
                    download={viewingFile.name}
                    className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl font-bold text-sm transition-colors"
                  >
                    Open / Download
                  </a>
                )}
                <button 
                  onClick={() => {
                    if (viewingFile?.isBlob) {
                      URL.revokeObjectURL(viewingFile.url);
                    }
                    setViewingFile(null);
                  }}
                  className="p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-gray-900 p-6 flex items-center justify-center">
              {viewingFile.type === 'image' && (
                <img 
                  src={viewingFile.url} 
                  alt={viewingFile.name} 
                  className="max-h-[75vh] w-auto object-contain rounded-xl shadow-lg mx-auto" 
                />
              )}

              {viewingFile.type === 'pdf' && (
                <iframe 
                  src={viewingFile.url} 
                  title={viewingFile.name} 
                  className="w-full h-[75vh] border-0 rounded-xl bg-white" 
                />
              )}

              {viewingFile.type === 'youtube' && (
                <iframe 
                  src={viewingFile.url} 
                  title={viewingFile.name} 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen 
                  className="w-full h-[75vh] border-0 rounded-xl bg-black" 
                />
              )}

              {viewingFile.type === 'video' && (
                <video 
                  src={viewingFile.url} 
                  controls 
                  autoPlay 
                  className="w-full max-h-[75vh] rounded-xl bg-black" 
                />
              )}

              {viewingFile.type === 'file' && (
                <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-gray-200 max-w-md">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText size={40} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{viewingFile.name}</h3>
                  <a 
                    href={viewingFile.url} 
                    download={viewingFile.name} 
                    className="inline-flex items-center justify-center w-full px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-sm"
                  >
                    Download Resource File
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
