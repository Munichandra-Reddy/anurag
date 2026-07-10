import React, { useState } from 'react';
import { 
  Edit, RefreshCcw, GraduationCap, Github, 
  Linkedin, Globe, MessageSquare, X, Upload,
  Video, LogOut, Clock, CreditCard, Laptop, FileText
} from 'lucide-react';
// Removed static sessions import

interface ProfileData {
  name: string;
  avatarUrl: string;
  bannerUrl: string;
  professionalTag: string;
  collegeName: string;
  bio: string;
  portfolioLink: string;
  linkedinLink: string;
  githubLink: string;
}

const defaultProfile: ProfileData = {
  name: 'Jithendra Varma',
  avatarUrl: '', // empty means show initials 'JV'
  bannerUrl: '', // empty means show gray background
  professionalTag: 'Web Developer Intern',
  collegeName: 'Geonixa Institute of Technology',
  bio: 'Passionate full stack developer learning modern web frameworks and building scalable client portals.',
  portfolioLink: 'https://jithendra.dev',
  linkedinLink: 'https://linkedin.com/in/jithendra',
  githubLink: 'https://github.com/jithendra'
};

const Overview: React.FC = () => {
  const loggedInEmail = sessionStorage.getItem('loggedInEmail') || 'student@anurag.edu.in';
  const profileKey = `anuragLmsProfile_${loggedInEmail}`;

  const [profile, setProfile] = useState<ProfileData>(() => {
    const saved = localStorage.getItem(profileKey);
    if (saved) return JSON.parse(saved);
    
    // Check if we have registered student info to populate the default name
    const students = JSON.parse(localStorage.getItem('registeredStudents') || '[]');
    const student = students.find((s: any) => s.email === loggedInEmail);
    
    return {
      ...defaultProfile,
      name: student ? student.name : loggedInEmail.split('@')[0],
      avatarUrl: '',
      bannerUrl: ''
    };
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<ProfileData>(profile);

  const savedProjects = localStorage.getItem('anuragLmsProjects');
  const projectsData = savedProjects ? JSON.parse(savedProjects) : Array(5).fill({ submittedUrl: undefined });
  const completedAssignments = projectsData.filter((p: any) => p.submittedUrl).length;
  const totalAssignments = projectsData.length || 5;

  const [attendance, setAttendance] = useState(() => {
    const records = JSON.parse(localStorage.getItem('attendanceRecords') || '{}');
    const allDates = Object.keys(records);
    
    let attended = 0;
    allDates.forEach(date => {
      if (records[date][loggedInEmail] === 'present') {
        attended++;
      }
    });

    return { attended, total: allDates.length };
  });

  const attendancePercentage = attendance.total > 0 
    ? Math.round((attendance.attended / attendance.total) * 100) 
    : 0;

  const handleJoinLive = () => {
    // No-op: Attendance is now handled purely by mentors
  };

  const handleCheckOut = () => {
    // No-op: Attendance is now handled purely by mentors
  };

  const getSessionStatus = (dateString: string) => {
    const sessionDate = new Date(dateString).toDateString();
    const today = new Date().toDateString();
    if (sessionDate === today) return 'TODAY';
    if (new Date(dateString) < new Date(today)) return 'COMPLETED';
    return 'UPCOMING';
  };

  const savedClasses = localStorage.getItem('anuragLmsClasses');
  const sessionsList = savedClasses ? JSON.parse(savedClasses) : [];
  
  const currentSession = sessionsList.find((s: any) => {
    const status = getSessionStatus(s.dateString);
    return status === 'TODAY' || status === 'UPCOMING';
  }) || sessionsList[0] || { topic: 'No sessions scheduled' };
  
  const allStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]');
  const currentStudent = allStudents.find((s: any) => s.email === loggedInEmail);
  const userBatch = currentStudent?.batch || 'Unassigned';
  
  const [avatarFileName, setAvatarFileName] = useState('No file chosen');
  const [bannerFileName, setBannerFileName] = useState('No file chosen');

  const handleOpenEdit = () => {
    setEditForm(profile);
    setAvatarFileName('No file chosen');
    setBannerFileName('No file chosen');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(editForm);
    localStorage.setItem(profileKey, JSON.stringify(editForm));
    setIsEditModalOpen(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, bannerUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };
  return (
    <div className="w-full relative">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Cover Area */}
        <div 
          className="h-48 bg-[#F9F9F9] relative border-b border-gray-100 bg-cover bg-center"
          style={profile.bannerUrl ? { backgroundImage: `url(${profile.bannerUrl})` } : {}}
        >
          <div className="absolute top-4 right-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button 
              onClick={handleOpenEdit}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Edit size={16} /> <span className="hidden sm:inline">Edit Profile</span><span className="sm:hidden">Edit</span>
            </button>
          </div>
        </div>

        {/* Profile Details Area */}
        <div className="px-8 pb-8 relative">
          
          {/* Avatar */}
          <div className="absolute -top-16 left-8">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-[#0f0f0f] flex items-center justify-center text-4xl font-bold text-white shadow-sm outline outline-1 outline-amber-100/50 overflow-hidden relative">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                'JV'
              )}
            </div>
          </div>

          <div className="pt-20">
            {/* Name and Badge */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 w-full sm:w-auto">{profile.name}</h1>
              {userBatch && userBatch !== 'Unassigned' && userBatch !== 'Pending' ? (
                <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-600 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1">
                  {userBatch.includes('Morning') ? '🌅 Morning Batch' : '🌃 Evening Batch'}
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 text-gray-500 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1">
                  ⏳ Batch Pending
                </span>
              )}
            </div>

            {/* Institution */}
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
              <GraduationCap size={16} />
              <span>{profile.collegeName}</span>
            </div>

            {/* Attendance */}
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm mb-4">
              <span className="text-gray-500">🕒 Attendance:</span>
              <span className="font-bold text-green-600">{attendancePercentage}%</span>
              <span className="text-gray-500">({attendance.attended} of {attendance.total} sessions)</span>
            </div>

            {/* Bio */}
            <p className="text-gray-500 italic text-sm max-w-3xl mb-6">
              "{profile.bio}"
            </p>

            {/* Actions & Socials */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Socials */}
              <div className="flex items-center gap-3">
                <a href={profile.githubLink || '#'} target="_blank" rel="noreferrer" className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                  <Github size={18} />
                </a>
                <a href={profile.linkedinLink || '#'} target="_blank" rel="noreferrer" className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                  <Linkedin size={18} />
                </a>
                <a href={profile.portfolioLink || '#'} target="_blank" rel="noreferrer" className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                  <Globe size={18} />
                </a>
              </div>

            </div>
          </div>
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <h3 className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Attendance Rate</h3>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-black text-gray-900">{attendancePercentage}%</p>
            <p className="text-xs text-gray-500 mt-1">{attendance.attended} of {attendance.total} classes logged</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <h3 className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Assignments Approved</h3>
            <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
              <FileText size={16} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-black text-gray-900">{completedAssignments} / {totalAssignments}</p>
            <p className="text-xs text-gray-500 mt-1">Team status: In progress</p>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal Overlay */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto pt-20 pb-10 px-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl flex flex-col relative my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto max-h-[70vh] space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
              
              {/* Profile Picture Section */}
              <div className="flex gap-6 items-start p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center font-bold text-xl shrink-0 overflow-hidden">
                  {editForm.avatarUrl ? <img src={editForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : 'JV'}
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Profile Picture</label>
                    <div className="flex items-center">
                      <input type="file" id="avatarUpload" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                      <label htmlFor="avatarUpload" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-l-lg border border-gray-200 cursor-pointer">
                        Choose File
                      </label>
                      <div className="flex-1 px-4 py-2 border border-l-0 border-gray-200 bg-white rounded-r-lg text-gray-500 text-sm truncate">
                        {avatarFileName}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Or Image URL</label>
                    <input 
                      type="url" 
                      value={editForm.avatarUrl}
                      onChange={e => setEditForm({...editForm, avatarUrl: e.target.value})}
                      placeholder="https://images.unsplash.com/photo-..." 
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Upload image or paste direct image URL (converts to base64 locally if file uploaded).</p>
                  </div>
                </div>
              </div>

              {/* Profile Banner Section */}
              <div className="flex gap-6 items-start p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                <div className="w-24 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                  {editForm.bannerUrl ? <img src={editForm.bannerUrl} alt="Banner" className="w-full h-full object-cover" /> : <span className="text-[10px] text-gray-400 font-medium">SaaS Grid</span>}
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Profile Banner Image</label>
                    <div className="flex items-center">
                      <input type="file" id="bannerUpload" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                      <label htmlFor="bannerUpload" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-l-lg border border-gray-200 cursor-pointer">
                        Choose File
                      </label>
                      <div className="flex-1 px-4 py-2 border border-l-0 border-gray-200 bg-white rounded-r-lg text-gray-500 text-sm truncate">
                        {bannerFileName}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Or Banner Image URL</label>
                    <input 
                      type="url" 
                      value={editForm.bannerUrl}
                      onChange={e => setEditForm({...editForm, bannerUrl: e.target.value})}
                      placeholder="https://images.unsplash.com/photo-..." 
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Upload image or paste direct banner URL (approx 3:1 aspect ratio).</p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>

              {/* College */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
                  <input 
                    type="text" 
                    value={editForm.collegeName}
                    onChange={e => setEditForm({...editForm, collegeName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Bio</label>
                <textarea 
                  value={editForm.bio}
                  onChange={e => setEditForm({...editForm, bio: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  {editForm.bio.length}/150 characters
                </div>
              </div>

              {/* Links */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">Profile & Project Links</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Globe size={16} className="text-gray-400 w-24 shrink-0" />
                    <input 
                      type="url" 
                      value={editForm.portfolioLink}
                      onChange={e => setEditForm({...editForm, portfolioLink: e.target.value})}
                      placeholder="https://jithendra.dev"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Linkedin size={16} className="text-gray-400 w-24 shrink-0" />
                    <input 
                      type="url" 
                      value={editForm.linkedinLink}
                      onChange={e => setEditForm({...editForm, linkedinLink: e.target.value})}
                      placeholder="https://linkedin.com/in/..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Github size={16} className="text-gray-400 w-24 shrink-0" />
                    <input 
                      type="url" 
                      value={editForm.githubLink}
                      onChange={e => setEditForm({...editForm, githubLink: e.target.value})}
                      placeholder="https://github.com/..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

            </form>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
