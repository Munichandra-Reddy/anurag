import { MessageSquare, Star, Clock, UserCheck } from 'lucide-react';

export default function MentorDashboard() {
  const stats = [
    { name: 'Total Mentees', value: '24', icon: UserCheck, change: '2 new this week' },
    { name: 'Pending Meetings', value: '5', icon: Clock, change: 'Requires scheduling' },
    { name: 'Messages', value: '12', icon: MessageSquare, change: '4 unread' },
    { name: 'Average Rating', value: '4.8', icon: Star, change: 'Out of 5.0' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 font-heading">Mentor Dashboard</h1>
        <button className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-opacity">
          Schedule Meeting
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <item.icon className="h-6 w-6 text-orange-600" aria-hidden="true" />
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">My Mentees</h2>
          <div className="space-y-4">
            {[
              { id: 1, name: 'Siddharth V', year: '3rd Year, CSE', issue: 'Career Guidance', status: 'High Priority' },
              { id: 2, name: 'Ananya M', year: '2nd Year, ECE', issue: 'Academic Support', status: 'Normal' },
              { id: 3, name: 'Karthik R', year: '4th Year, CSE', issue: 'Project Discussion', status: 'Normal' },
              { id: 4, name: 'Meghana S', year: '1st Year, IT', issue: 'General Mentorship', status: 'Normal' },
            ].map((mentee) => (
              <div key={mentee.id} className="flex items-start gap-4 p-4 border border-gray-100 rounded-lg hover:border-orange-100 transition-colors cursor-pointer">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500 font-bold">
                  {mentee.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 truncate">{mentee.name}</h3>
                    {mentee.status === 'High Priority' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        High Priority
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{mentee.year}</p>
                  <p className="text-sm text-gray-600 mt-1">Focus: {mentee.issue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Meetings</h2>
          <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 pb-4">
            {[
              { id: 1, title: 'Resume Review', time: 'Today, 03:00 PM', with: 'Siddharth V' },
              { id: 2, title: 'Academic Progress Check', time: 'Tomorrow, 11:30 AM', with: 'Ananya M' },
              { id: 3, title: 'Major Project Guidance', time: 'Thursday, 04:00 PM', with: 'Karthik R' },
            ].map((meeting, index) => (
              <div key={meeting.id} className="relative pl-6">
                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-[var(--color-secondary)]"></div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{meeting.title}</h3>
                  <div className="mt-1 flex flex-col sm:flex-row sm:gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {meeting.time}
                    </span>
                    <span className="flex items-center gap-1 mt-1 sm:mt-0">
                      <UserCheck size={14} />
                      {meeting.with}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
