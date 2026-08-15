import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { 
  Clock, 
  FileText, 
  Award, 
  BookOpen, 
  CheckSquare, 
  UploadCloud, 
  FolderOpen, 
  Users, 
  Video, 
  MessageSquare,
  TrendingUp,
  Target
} from 'lucide-react';

export default async function StudentDashboard() {
  // Hardcoded for now until Auth is built
  const studentEmail = 'student1@anurag.edu.in';
  
  const student = await prisma.user.findUnique({
    where: { email: studentEmail },
    include: {
      profile: true,
      enrollments: {
        include: { course: true }
      },
      examSubmissions: {
        where: { isPosted: true },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  // Calculate overall progress based on DB enrollments
  let overallProgress = 0;
  if (student && student.enrollments.length > 0) {
    const totalProgress = student.enrollments.reduce((sum, enr) => sum + enr.progress, 0);
    overallProgress = Math.round(totalProgress / student.enrollments.length);
  }

  // Determine latest grade from posted exams
  let latestGrade = 'Pending review';
  if (student && student.examSubmissions.length > 0) {
    latestGrade = student.examSubmissions[0].grade;
  }

  // Dynamic stats from the database
  const stats = [
    { 
      name: 'Attendance', 
      value: student?.profile ? `${student.profile.attendance}%` : 'N/A', 
      icon: Clock, 
      change: 'Target: 75%' 
    },
    { 
      name: 'Weekly Exam Reports', 
      value: `Latest: ${latestGrade}`, 
      icon: FileText, 
      change: 'View all reports' 
    },
    { 
      name: 'Top Performer', 
      value: student?.profile ? `${student.profile.credits}` : '0', 
      icon: Award, 
      change: 'Credits earned' 
    },
  ];

  const features = [
    {
      title: 'Course Content & Tracker',
      description: 'Access study materials and track your course progress',
      icon: BookOpen,
      color: 'bg-blue-50 text-blue-600',
      href: '/student/courses'
    },
    {
      title: 'Quizzes & Assessments',
      description: 'Take pending quizzes and view assessment scores',
      icon: CheckSquare,
      color: 'bg-purple-50 text-purple-600',
      href: '/student/quizzes'
    },
    {
      title: 'Project Submission',
      description: 'Submit your ongoing assignments and projects',
      icon: UploadCloud,
      color: 'bg-green-50 text-green-600',
      href: '/student/projects/submit'
    },
    {
      title: 'Sample & Major Projects',
      description: 'Explore sample projects and manage your major project',
      icon: FolderOpen,
      color: 'bg-orange-50 text-orange-600',
      href: '/student/projects'
    },
    {
      title: 'Project Batch Rooms & Mentor',
      description: 'Collaborate with your batch and connect with mentors',
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600',
      href: '/student/batch-rooms'
    },

    {
      title: 'Internal Chat Support',
      description: 'Chat with peers, faculty, and support staff',
      icon: MessageSquare,
      color: 'bg-teal-50 text-teal-600',
      href: '/student/chat'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 font-heading">Student Dashboard</h1>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <item.icon className="h-6 w-6 text-[var(--color-primary)]" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{item.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <a href="#" className="text-sm font-medium text-[var(--color-secondary)] hover:text-red-700">
                {item.change}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Course Tracker Widget */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Course Tracker</h2>
          <span className="text-sm text-[var(--color-primary)] font-medium cursor-pointer hover:underline">View Full Tracker</span>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm font-medium text-gray-900 mb-1">
              <span>Overall Progress</span>
              <span>{overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-[var(--color-primary)] h-2 rounded-full" style={{ width: `${overallProgress}%` }}></div>
            </div>
          </div>
          
          {/* Display actual courses from DB */}
          {student?.enrollments.map((enr) => (
            <div key={enr.id} className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                <span>{enr.course.title} ({enr.course.code})</span>
                <span>{enr.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-[var(--color-secondary)] h-1.5 rounded-full" style={{ width: `${enr.progress}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Features Grid */}
      <h2 className="text-lg font-medium text-gray-900 mt-8 mb-4">Dashboard Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <Link href={feature.href} key={index}>
            <div 
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group h-full"
            >
              <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-[var(--color-secondary)] transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500">
                {feature.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
      
    </div>
  );
}
