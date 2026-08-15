"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Users, 
  Briefcase, 
  UserPlus, 
  LogOut, 
  Menu, 
  X,
  Bell
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: 'Student Portal', href: '/student', icon: BookOpen },
    { name: 'Faculty Portal', href: '/faculty', icon: Users },
    { name: 'T&P Cell', href: '/placement', icon: Briefcase },
    { name: 'Mentorship', href: '/mentor', icon: UserPlus },
  ];

  const handleLogout = () => {
    router.push('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[var(--color-primary)] text-white transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 bg-black bg-opacity-20">
          <span className="text-xl font-bold font-heading truncate">Anurag LMS</span>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-300 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="overflow-y-auto h-[calc(100vh-4rem)]">
          <nav className="px-2 py-4 space-y-1">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Dashboards
            </p>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-[var(--color-secondary)] text-white' 
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon 
                    className="flex-shrink-0 mr-3 h-5 w-5 opacity-80 group-hover:opacity-100" 
                    aria-hidden="true" 
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="absolute bottom-0 w-full p-4 bg-black bg-opacity-20 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 opacity-80" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 border-b border-gray-200">
          <button
            className="text-gray-500 hover:text-gray-700 focus:outline-none lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div className="flex-1 flex justify-end items-center gap-4">
            <button className="text-gray-400 hover:text-gray-500 relative p-2">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-[var(--color-secondary)] ring-2 ring-white" />
            </button>
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <div className="text-sm font-medium text-gray-700 hidden sm:block">Welcome, User</div>
              <div className="h-8 w-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm">
                U
              </div>
            </div>
          </div>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
