import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, BookOpen, Video, 
  Key, FileText, LogOut, Users, Award, MessageSquare
} from 'lucide-react';
import { cn } from '../utils/cn';

const MentorDashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  let userEmail = localStorage.getItem('loggedInEmail') || 'mentor@geonixa.com';
  
  // Ensure student emails are never displayed in the mentor portal
  if (userEmail.includes('@anurag')) {
    userEmail = 'maheshk@geonixa.com';
  }

  const menuItems = [
    { title: 'Attendance', icon: <ClipboardCheck size={20} />, path: '/mentor-dashboard' },
    { title: 'Students', icon: <Users size={20} />, path: '/mentor-dashboard/students' },
    { title: 'Course Content Upload', icon: <BookOpen size={20} />, path: '/mentor-dashboard/content' },
    { title: 'Classes Schedule', icon: <Video size={20} />, path: '/mentor-dashboard/classes' },
    { title: 'LMS Access', icon: <Key size={20} />, path: '/mentor-dashboard/access' },
    { title: 'Project Batch', icon: <Users size={20} />, path: '/mentor-dashboard/project-batch' },
    { title: 'Chat Support', icon: <MessageSquare size={20} />, path: '/mentor-dashboard/chat-support' },
    { title: 'Assessments', icon: <FileText size={20} />, path: '/mentor-dashboard/assessments' },
    { title: 'Top Performer', icon: <Award size={20} />, path: '/mentor-dashboard/top-performer' },
  ];

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="font-bold text-xl text-primary">Mentor Portal</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              end={item.path === '/mentor-dashboard'}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {item.icon}
              {item.title}
            </NavLink>
          ))}
        </nav>

        {/* Profile and Signout Widget */}
        <div className="p-4 border-t border-gray-100">
          <div className="border border-gray-200 rounded-xl p-3 flex items-center gap-3 mb-2 bg-white shadow-sm">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-semibold shrink-0 text-sm uppercase">
              {userEmail.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-gray-900 text-sm font-bold truncate">Mentor</p>
              <p className="text-gray-500 text-xs truncate">{userEmail}</p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              localStorage.removeItem('loggedInEmail');
              navigate('/login');
            }}
            className="flex items-center justify-between text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors w-full text-sm font-bold p-2 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <LogOut size={18} />
              Sign out
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MentorDashboardLayout;
