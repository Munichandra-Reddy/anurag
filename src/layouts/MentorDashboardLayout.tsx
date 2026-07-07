import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  ClipboardCheck, BookOpen, Video, 
  Key, FileText, LogOut, Users, Award, MessageSquare, Menu, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '../utils/cn';

const MentorDashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  let userEmail = localStorage.getItem('loggedInEmail') || 'mentor@geonixa.com';
  
  // Ensure student emails are never displayed in the mentor portal
  if (userEmail.includes('@anurag')) {
    userEmail = 'maheshk@geonixa.com';
  }

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAssessmentsExpanded, setIsAssessmentsExpanded] = useState(false);

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { title: 'Attendance', icon: <ClipboardCheck size={20} />, path: '/mentor-dashboard' },
    { title: 'Students', icon: <Users size={20} />, path: '/mentor-dashboard/students' },
    { title: 'Course Content Upload', icon: <BookOpen size={20} />, path: '/mentor-dashboard/content' },
    { title: 'Classes Schedule', icon: <Video size={20} />, path: '/mentor-dashboard/classes' },
    { title: 'LMS Access', icon: <Key size={20} />, path: '/mentor-dashboard/access' },
    { title: 'Project Batch', icon: <Users size={20} />, path: '/mentor-dashboard/project-batch' },
    { title: 'Chat Support', icon: <MessageSquare size={20} />, path: '/mentor-dashboard/chat-support' },
    { title: 'Exam Reports', icon: <FileText size={20} />, path: '/mentor-dashboard/assessments' },
    { title: 'Assessments', icon: <FileText size={20} />, path: '/mentor-dashboard/assessments' },
    { title: 'Top Performer', icon: <Award size={20} />, path: '/mentor-dashboard/top-performer' },
  ];

  return (
    <div className="flex h-screen bg-[#F8F9FA] flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 shrink-0 z-40 relative">
        <span className="font-bold text-xl text-primary">Mentor Portal</span>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 absolute md:relative z-50 h-full transition-transform duration-300 ease-in-out top-0 left-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-gray-200 shrink-0 justify-between">
          <span className="font-bold text-xl text-primary">Mentor Portal</span>
          <button className="md:hidden text-gray-400 hover:text-gray-600" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item, index) => {
            if (item.title === 'Exam Reports') {
              return (
                <div key={index}>
                  <button
                    onClick={() => setIsAssessmentsExpanded(!isAssessmentsExpanded)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      location.pathname.includes('/assessments')
                        ? "bg-primary/10 text-primary" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      {item.title}
                    </div>
                    {isAssessmentsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isAssessmentsExpanded && (
                    <div className="pl-11 pr-3 py-2 flex flex-col gap-2.5 mt-1 border-l-2 border-primary/20 ml-5">
                      {['weekly Exam Pattern', 'CIE Exam Pattern', 'SEM Exam Pattern', 'week1', 'week2', 'week3', 'week4', 'week5', 'week6', 'CIE1', 'week7', 'week8', 'week9', 'week10', 'week11', 'week12', 'CIE2', 'SEM'].map((subItem, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => navigate(`/mentor-dashboard/assessments?pattern=${encodeURIComponent(subItem)}`)}
                          className="text-left text-sm font-medium text-gray-500 hover:text-primary cursor-pointer transition-colors"
                        >
                          {subItem}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
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
            );
          })}
        </nav>

        {/* Profile and Signout Widget */}
        <div className="p-4 border-t border-gray-100 shrink-0">
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
      <main className="flex-1 overflow-y-auto relative z-0">
        <div className="max-w-[1200px] mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MentorDashboardLayout;
