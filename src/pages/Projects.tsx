import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface Project {
  id: number;
  title: string;
  description: string;
  submittedUrl?: string;
  grade?: string;
  feedback?: string;
}

const defaultProjects: Project[] = [
  {
    id: 1,
    title: 'Build Responsive Personal Portfolio Website',
    description: 'Design and implement a single-page responsive portfolio showcasing personal milestones and projects, utilizing clean HTML5 structure and custom layouts.',
  },
  {
    id: 2,
    title: 'Interactive Weather Dashboard App (React)',
    description: 'Develop a React application that queries a weather API to display current forecasts and search histories, implementing custom search bars, storage saves, and state hooks.',
  },
  {
    id: 3,
    title: 'E-commerce Product Catalog with Redux',
    description: 'Build an e-commerce catalog featuring product listings, detailed views, and a shopping cart utilizing Redux for state management and local storage persistence.',
  },
  {
    id: 4,
    title: 'Full-Stack Task Management System',
    description: 'Create a comprehensive task management platform with user authentication, CRUD operations for tasks, and RESTful API integration using Node.js and Express.',
  },
  {
    id: 5,
    title: 'Social Media Feed Application',
    description: 'Construct a dynamic social media feed capable of rendering posts, comments, and likes in real-time. Integrate with a mock backend service and implement pagination.',
  }
];

const Projects: React.FC = () => {
  const location = useLocation();
  const isMentor = location.pathname.includes('/mentor-dashboard');
  
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('anuragLmsProjects');
    return saved ? JSON.parse(saved) : defaultProjects;
  });
  const [inputs, setInputs] = useState<Record<number, string>>({});

  const handleInputChange = (id: number, value: string) => {
    setInputs({ ...inputs, [id]: value });
  };

  const handleSubmit = (e: React.FormEvent, id: number) => {
    e.preventDefault();
    if (!inputs[id]) return;
    
    const updatedProjects = projects.map(p => {
      if (p.id === id) {
        return {
          ...p,
          submittedUrl: inputs[id],
          grade: 'A+',
          feedback: 'Fantastic design! Excellent use of modern styling and grid/flex layouts. Mobile layout is very clean.'
        };
      }
      return p;
    });
    
    setProjects(updatedProjects);
    localStorage.setItem('anuragLmsProjects', JSON.stringify(updatedProjects));
  };

  return (
    <div className="w-full max-w-4xl space-y-6 pb-12">
      <div className="flex items-center gap-3 text-gray-900 font-bold text-xl">
        <FileText className="text-orange-500" size={24} /> 
        Individual Syllabus Assignments
      </div>
      <p className="text-gray-600 text-sm mt-2">
        Submit assignment links for direct evaluation and grading by Course Mentor Anjali Sharma
      </p>

      <div className="space-y-6 mt-8">
        {projects.map(project => {
          const isCompleted = !!project.submittedUrl;
          
          return (
            <div key={project.id} className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{project.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">Individual Project · Mentor: Anjali Sharma</p>
                </div>
                <div>
                  {isCompleted ? (
                    <span className="bg-[#00a676] text-white px-4 py-1.5 text-sm font-semibold rounded-xl">
                      Completed
                    </span>
                  ) : (
                    <span className="text-orange-500 border border-orange-200 bg-orange-50 px-4 py-1.5 text-sm font-semibold rounded-xl">
                      In Progress
                    </span>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mt-5 leading-relaxed">
                {project.description}
              </p>

              {isCompleted ? (
                <div className="mt-6 border border-gray-200 bg-gray-50/30 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-[150px_1fr] gap-4 p-4 border-b border-gray-100">
                    <div className="text-sm text-gray-500">Submitted URL:</div>
                    <div className="text-sm font-bold truncate text-gray-900">
                      <a href={project.submittedUrl} target="_blank" rel="noreferrer">{project.submittedUrl}</a>
                    </div>
                  </div>
                  {isMentor && (
                    <>
                      <div className="grid grid-cols-[150px_1fr] gap-4 p-4 border-b border-gray-100">
                        <div className="text-sm text-gray-500">Evaluated Grade:</div>
                        <div className="text-sm font-bold text-orange-500">{project.grade}</div>
                      </div>
                      <div className="p-4 bg-gray-50">
                        <span className="text-sm font-bold text-gray-900">Feedback: </span>
                        <span className="text-sm text-gray-600">{project.feedback}</span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <form onSubmit={(e) => handleSubmit(e, project.id)} className="mt-6">
                  <div className="flex gap-3">
                    <input 
                      type="url" 
                      placeholder="https://github.com/student/..." 
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-gray-400"
                      value={inputs[project.id] || ''}
                      onChange={(e) => handleInputChange(project.id, e.target.value)}
                      required
                    />
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-primary text-white font-medium text-sm rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Projects;
