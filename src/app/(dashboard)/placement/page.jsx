import { Building, TrendingUp, Users, Target } from 'lucide-react';

export default function PlacementDashboard() {
  const stats = [
    { name: 'Companies Visited', value: '45', icon: Building, change: '+12 from last year' },
    { name: 'Students Placed', value: '850', icon: Users, change: '92% of eligible' },
    { name: 'Highest Package', value: '53 LPA', icon: TrendingUp, change: 'Top 1% students' },
    { name: 'Average Package', value: '8.5 LPA', icon: Target, change: '+15% from last year' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 font-heading">Training & Placements</h1>
        <button className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-opacity">
          Add Drive
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <item.icon className="h-6 w-6 text-green-600" aria-hidden="true" />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Placement Drives</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  { id: 1, company: 'Google', role: 'Software Engineer', date: 'Oct 25', status: 'Registration Open' },
                  { id: 2, company: 'Microsoft', role: 'SDE Intern', date: 'Oct 28', status: 'Registration Open' },
                  { id: 3, company: 'Amazon', role: 'SDE 1', date: 'Nov 02', status: 'Upcoming' },
                  { id: 4, company: 'TCS', role: 'System Engineer', date: 'Nov 10', status: 'Upcoming' },
                ].map((drive) => (
                  <tr key={drive.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{drive.company}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{drive.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{drive.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        drive.status === 'Registration Open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {drive.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Training Progress</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-medium text-gray-900 mb-1">
                <span>Aptitude Training</span>
                <span>80%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-medium text-gray-900 mb-1">
                <span>Technical Skills (DSA)</span>
                <span>65%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-[var(--color-primary)] h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-medium text-gray-900 mb-1">
                <span>Soft Skills & Interview</span>
                <span>40%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-[var(--color-secondary)] h-2 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
