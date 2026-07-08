import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  ClipboardCheck, FileText, LogOut, Menu, X 
} from 'lucide-react';
import { cn } from '../utils/cn';

const FacultyDashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = sessionStorage.getItem('loggedInEmail') || '';

  React.useEffect(() => {
    // Route Guard: strict access only for faculty
    if (userEmail !== 'munidhoni@72') {
      navigate('/login');
    }
  }, [userEmail, navigate]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { title: 'Attendance Report', icon: <ClipboardCheck size={20} />, path: '/faculty-dashboard/attendance-report' },
    { title: 'Marks Report', icon: <FileText size={20} />, path: '/faculty-dashboard/marks-report' },
  ];

  return (
    <div className="flex h-screen bg-[#F8F9FA] flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 shrink-0 z-40 relative">
        <span className="font-bold text-xl text-primary">Anurag LMS</span>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar - Desktop & Mobile */}
      <div className={cn(
        "fixed md:static inset-y-0 left-0 z-30",
        "w-64 bg-white border-r border-gray-200 flex flex-col h-[100dvh]",
        "transition-transform duration-300 ease-in-out md:transform-none",
        isMobileMenuOpen ? "translate-x-0 mt-[65px] md:mt-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 hidden md:block shrink-0">
          <span className="font-bold text-2xl text-primary">Faculty Portal</span>
        </div>

        <nav className="flex-1 px-4 py-4 md:py-6 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              end={item.path === '/faculty-dashboard'}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium mb-1",
                  isActive 
                    ? "bg-orange-50 text-primary" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )
              }
            >
              <div className={cn("transition-colors duration-200")}>
                {item.icon}
              </div>
              {item.title}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 shrink-0 pb-24 md:pb-4 bg-white relative z-50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold shrink-0">
              F
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">Faculty</p>
              <p className="text-xs text-gray-500 truncate" title="munidhoni@72">munidhoni@72</p>
            </div>
          </div>
          <button 
            onClick={() => {
              sessionStorage.removeItem('loggedInEmail');
              navigate('/login');
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg w-full transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 bg-[#F8F9FA] relative z-0">
        <div className="p-4 md:p-8 w-full max-w-full">
          <Outlet />
        </div>
      </div>
      
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm mt-[65px]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default FacultyDashboardLayout;
