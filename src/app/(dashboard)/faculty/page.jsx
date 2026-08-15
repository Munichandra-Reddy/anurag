import { Users, FileText, CheckSquare, Award } from 'lucide-react';

export default function FacultyDashboard() {
  const stats = [
    { name: 'Total Students', value: '142', icon: Users, change: 'Across 3 sections' },
    { name: 'Assignments to Grade', value: '28', icon: FileText, change: '12 due today' },
    { name: 'Average Attendance', value: '89%', icon: CheckSquare, change: '+2% from last week' },
    { name: 'Top Performers', value: '15', icon: Award, change: 'CGPA > 9.0' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 font-heading">Faculty Dashboard</h1>
        <button className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-opacity">
          Mark Attendance
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <item.icon className="h-6 w-6 text-purple-600" aria-hidden="true" />
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
              <div className="text-sm text-gray-500">{item.change}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Today's Schedule</h2>
          <div className="space-y-4">
            {[
              { id: 1, time: '09:00 AM', course: 'CS301 - DSA', section: 'A', room: 'Room 201' },
              { id: 2, time: '11:00 AM', course: 'CS301 - DSA', section: 'B', room: 'Room 202' },
              { id: 3, time: '02:00 PM', course: 'CS303 - OS Lab', section: 'A', room: 'Lab 3' },
            ].map((schedule) => (
              <div key={schedule.id} className="flex gap-4 p-4 border border-gray-100 rounded-lg">
                <div className="flex-shrink-0 w-20 text-sm font-medium text-gray-500 pt-1">
                  {schedule.time}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{schedule.course}</h3>
                  <div className="mt-1 flex gap-4 text-sm text-gray-500">
                    <span>Section: {schedule.section}</span>
                    <span>{schedule.room}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Submissions</h2>
          <div className="space-y-4">
            {[
              { id: 1, student: 'Rahul Sharma', task: 'Assignment 2', status: 'Ungraded' },
              { id: 2, student: 'Priya Patel', task: 'Lab Record', status: 'Ungraded' },
              { id: 3, student: 'Amit Kumar', task: 'Assignment 2', status: 'Graded' },
              { id: 4, student: 'Neha Singh', task: 'Project Proposal', status: 'Ungraded' },
            ].map((sub) => (
              <div key={sub.id} className="flex items-center justify-between border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <div>
                  <h3 className="font-medium text-gray-900">{sub.student}</h3>
                  <p className="text-sm text-gray-500">{sub.task}</p>
                </div>
                <button className={`px-3 py-1 rounded-full text-xs font-medium ${
                  sub.status === 'Ungraded' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {sub.status}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
