import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import MentorDashboardLayout from './layouts/MentorDashboardLayout';
import FacultyDashboardLayout from './layouts/FacultyDashboardLayout';
import Overview from './pages/Overview';
import Classes from './pages/Classes';
import Projects from './pages/Projects';
import LmsAccess from './pages/LmsAccess';
import Assessments from './pages/Assessments';
import ProjectBatch from './pages/ProjectBatch';
import CourseContent from './pages/CourseContent';
import Attendance from './pages/Attendance';
import MentorStudents from './pages/MentorStudents';
import ChatSupport from './pages/ChatSupport';
import TopPerformer from './pages/TopPerformer';
import AttendanceReport from './pages/AttendanceReport';
import MarksReport from './pages/MarksReport';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Student Dashboard */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="classes" element={<Classes />} />
          <Route path="projects" element={<Projects />} />
          <Route path="access" element={<LmsAccess />} />
          <Route path="assessments" element={<Assessments />} />
          <Route path="project-batch" element={<ProjectBatch />} />
          <Route path="chat-support" element={<ChatSupport />} />
          <Route path="content" element={<CourseContent />} />
          <Route path="top-performer" element={<TopPerformer />} />
          <Route path="*" element={<div className="p-8">Feature Coming Soon</div>} />
        </Route>

        {/* Mentor Dashboard */}
        <Route path="/mentor-dashboard" element={<MentorDashboardLayout />}>
          <Route index element={<Attendance />} />
          <Route path="students" element={<MentorStudents />} />
          <Route path="content" element={<CourseContent />} />
          <Route path="classes" element={<Classes />} />
          <Route path="access" element={<LmsAccess />} />
          <Route path="project-batch" element={<ProjectBatch />} />
          <Route path="chat-support" element={<ChatSupport />} />
          <Route path="assessments" element={<Assessments />} />
          <Route path="attendance-report" element={<AttendanceReport />} />
          <Route path="marks-report" element={<MarksReport />} />
          <Route path="top-performer" element={<TopPerformer />} />
          <Route path="*" element={<div className="p-8">Feature Coming Soon</div>} />
        </Route>

        {/* Faculty Dashboard */}
        <Route path="/faculty-dashboard" element={<FacultyDashboardLayout />}>
          <Route index element={<Navigate to="attendance-report" replace />} />
          <Route path="attendance-report" element={<AttendanceReport isFacultyView={true} />} />
          <Route path="marks-report" element={<MarksReport isFacultyView={true} />} />
          <Route path="*" element={<div className="p-8">Feature Coming Soon</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
