import React, { useState, useEffect } from 'react';
import { PlayCircle, Clock, Video, Plus, Trash2, ExternalLink } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface RecordedVideo {
  id: string;
  title: string;
  topic: string;
  duration: string;
  videoUrl: string; // Generic URL instead of just youtubeId
}

const defaultVideos: RecordedVideo[] = [
  {
    id: '1',
    title: 'Autodesk Revit - Full Beginner Course',
    topic: 'Revit Architecture',
    duration: '2:45:10',
    videoUrl: 'https://www.youtube.com/watch?v=jWqK-lJvLpA'
  },
  {
    id: '2',
    title: 'Revit - Complete Tutorial for Beginners',
    topic: 'Revit Architecture',
    duration: '1:10:05',
    videoUrl: 'https://www.youtube.com/watch?v=Nd6U2KgHI6k'
  },
  {
    id: '3',
    title: 'Revit - Tutorials for Beginners in 10 MINUTES!',
    topic: 'Revit Basics',
    duration: '10:42',
    videoUrl: 'https://www.youtube.com/watch?v=0h321T9-8Wc'
  },
  {
    id: '4',
    title: 'Complete Revit in 2 Hours - Project Based',
    topic: 'Revit Project',
    duration: '1:58:30',
    videoUrl: 'https://www.youtube.com/watch?v=f9xS8R5S4fA'
  },
  {
    id: '5',
    title: 'Revit 2024: The Complete Beginner Course',
    topic: 'Revit Architecture',
    duration: '3:12:15',
    videoUrl: 'https://www.youtube.com/watch?v=yfoY53QXEnI'
  }
];

const getYoutubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const LmsAccess: React.FC = () => {
  const location = useLocation();
  const isMentor = location.pathname.includes('mentor-dashboard');

  const [videos, setVideos] = useState<RecordedVideo[]>(() => {
    const saved = localStorage.getItem('anuragLmsVideosRevitValid');
    return saved ? JSON.parse(saved) : defaultVideos;
  });

  useEffect(() => {
    localStorage.setItem('anuragLmsVideosRevitValid', JSON.stringify(videos));
  }, [videos]);

  const [activeVideo, setActiveVideo] = useState<RecordedVideo>(videos[0] || defaultVideos[0]);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newTopic || !newDuration || !newVideoUrl) return;

    const newVid: RecordedVideo = {
      id: Date.now().toString(),
      title: newTitle,
      topic: newTopic,
      duration: newDuration,
      videoUrl: newVideoUrl
    };

    setVideos([...videos, newVid]);
    setIsAdding(false);
    setNewTitle('');
    setNewTopic('');
    setNewDuration('');
    setNewVideoUrl('');
    setActiveVideo(newVid); // Auto play new video
  };

  const handleRemoveVideo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this recording?')) {
      const updated = videos.filter(v => v.id !== id);
      setVideos(updated);
      if (activeVideo.id === id && updated.length > 0) {
        setActiveVideo(updated[0]);
      }
    }
  };

  const activeYoutubeId = getYoutubeId(activeVideo?.videoUrl);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3 text-gray-900 font-bold text-2xl">
          <Video className="text-orange-500" size={28} /> 
          Session Recordings
        </div>
        {isMentor && !isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            <Plus size={16} /> Add Recording
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-primary/20 shadow-sm relative mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Add New Recording</h3>
          <form onSubmit={handleAddVideo} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Video URL (YouTube, Zoom, etc.)</label>
              <input 
                type="url" 
                value={newVideoUrl}
                onChange={e => setNewVideoUrl(e.target.value)}
                placeholder="https://zoom.us/rec/share/..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Session 14 Recording"
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
                placeholder="React Hooks"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input 
                type="text" 
                value={newDuration}
                onChange={e => setNewDuration(e.target.value)}
                placeholder="1:45:00"
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
                Save Recording
              </button>
            </div>
          </form>
        </div>
      )}
      
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video Player Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-black rounded-2xl overflow-hidden aspect-video shadow-lg relative border border-gray-200">
              {activeYoutubeId ? (
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube.com/embed/${activeYoutubeId}?autoplay=1`}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                ></iframe>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                  <Video size={64} className="text-gray-600 mb-4" />
                  <h3 className="text-xl font-bold mb-2">External Recording</h3>
                  <p className="text-gray-400 text-sm max-w-md mb-6">
                    This recording is hosted on an external platform (like Zoom or Google Drive) and cannot be embedded securely.
                  </p>
                  <a 
                    href={activeVideo.videoUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-primary hover:bg-orange-600 transition-colors px-6 py-3 rounded-xl font-bold shadow-md"
                  >
                    <ExternalLink size={18} /> Watch on External Site
                  </a>
                </div>
              )}
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">{activeVideo.title}</h2>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 font-medium">
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs tracking-wide">{activeVideo.topic}</span>
                <span className="flex items-center gap-1.5"><Clock size={16} className="text-gray-400" /> {activeVideo.duration}</span>
                <span className="text-gray-300">•</span>
                <span>Mentor: Anjali Sharma</span>
              </div>
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-gray-600 leading-relaxed text-sm">
                  Catch up on the latest session recording. This video covers essential concepts in <strong className="text-gray-800">{activeVideo.topic}</strong>, including hands-on examples and industry best practices. 
                  Review the materials carefully and remember to submit your corresponding assignments in the Projects section.
                </p>
              </div>
            </div>
          </div>

          {/* Video Playlist / Queue */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 h-fit sticky top-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4 px-1">Previous Recordings</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {videos.map((video) => {
                const vidYoutubeId = getYoutubeId(video.videoUrl);
                const thumbnailUrl = vidYoutubeId 
                  ? `https://img.youtube.com/vi/${vidYoutubeId}/mqdefault.jpg`
                  : `https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&q=80`;

                return (
                  <button 
                    key={video.id}
                    onClick={() => setActiveVideo(video)}
                    className={`w-full text-left flex gap-3 p-2 rounded-xl transition-all duration-200 group relative ${
                      activeVideo?.id === video.id 
                      ? 'bg-orange-50/80 border-orange-200 shadow-sm ring-1 ring-orange-200/50' 
                      : 'hover:bg-gray-50 border-transparent'
                    }`}
                  >
                    <div className="relative shrink-0 w-32 aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-sm">
                      <img 
                        src={thumbnailUrl} 
                        alt={video.title}
                        className={`w-full h-full object-cover transition-opacity ${activeVideo?.id === video.id ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-transparent transition-colors">
                        <PlayCircle size={24} className={activeVideo?.id === video.id ? "text-orange-500 drop-shadow-md" : "text-white/90 drop-shadow-md"} />
                      </div>
                      <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                        {video.duration}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center py-1 overflow-hidden pr-6">
                      <h4 className={`font-bold text-sm line-clamp-2 leading-tight ${activeVideo?.id === video.id ? 'text-orange-700' : 'text-gray-800 group-hover:text-primary'}`}>
                        {video.title}
                      </h4>
                      <span className="text-xs text-gray-500 mt-1.5 font-medium truncate">{video.topic}</span>
                    </div>

                    {isMentor && (
                      <div 
                        onClick={(e) => handleRemoveVideo(video.id, e)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                        title="Delete Recording"
                      >
                        <Trash2 size={16} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
          <Video size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Recordings Available</h3>
          <p className="text-gray-500">There are currently no session recordings uploaded.</p>
        </div>
      )}
    </div>
  );
};

export default LmsAccess;
