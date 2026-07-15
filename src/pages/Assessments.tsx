import React, { useState, useEffect } from 'react';
import { FileText, ArrowLeft, Award, PlayCircle, Plus, Trash2, X } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { WeeklyExamReport } from '../components/WeeklyExamReport';
import { WeeklyAssessmentFlow } from '../components/WeeklyAssessmentFlow';
import { getFromCloudflare, saveToCloudflare } from '../utils/cloudflare';

const defaultAssessments: { id: number, title: string, description: string }[] = [];

const questions = [
  { id: 1, text: "What does HTML stand for?", options: ["Hyper Text Markup Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language", "Hyper Tool Markup Language"], correct: 0 },
  { id: 2, text: "Choose the correct HTML element for the largest heading:", options: ["<h6>", "<head>", "<heading>", "<h1>"], correct: 3 },
  { id: 3, text: "What is the correct HTML element for inserting a line break?", options: ["<lb>", "<br>", "<break>", "<tr>"], correct: 1 },
  { id: 4, text: "Which character is used to indicate an end tag in HTML?", options: ["*", "^", "<", "/"], correct: 3 },
  { id: 5, text: "How can you make a numbered list?", options: ["<list>", "<ul>", "<dl>", "<ol>"], correct: 3 },
  { id: 6, text: "What does CSS stand for?", options: ["Creative Style Sheets", "Cascading Style Sheets", "Computer Style Sheets", "Colorful Style Sheets"], correct: 1 },
  { id: 7, text: "Where in an HTML document is the correct place to refer to an external style sheet?", options: ["In the <body> section", "At the end of the document", "In the <head> section", "In the <html> section"], correct: 2 },
  { id: 8, text: "Which HTML tag is used to define an internal style sheet?", options: ["<script>", "<style>", "<css>", "<link>"], correct: 1 },
  { id: 9, text: "Which CSS property is used to change the background color?", options: ["bgcolor", "color", "background-color", "bg-color"], correct: 2 },
  { id: 10, text: "How do you add a background color for all <h1> elements?", options: ["all.h1 {background-color:#FFFFFF;}", "h1.all {background-color:#FFFFFF;}", "h1 {background-color:#FFFFFF;}", "h1 {bgcolor:#FFFFFF;}"], correct: 2 },
  { id: 11, text: "Inside which HTML element do we put the JavaScript?", options: ["<js>", "<scripting>", "<script>", "<javascript>"], correct: 2 },
  { id: 12, text: "How do you write 'Hello World' in an alert box?", options: ["msg('Hello World');", "alertBox('Hello World');", "msgBox('Hello World');", "alert('Hello World');"], correct: 3 },
  { id: 13, text: "How to write an IF statement in JavaScript?", options: ["if i = 5 then", "if (i == 5)", "if i == 5 then", "if i = 5"], correct: 1 },
  { id: 14, text: "How does a FOR loop start in JavaScript?", options: ["for (i = 0; i <= 5; i++)", "for (i <= 5; i++)", "for i = 1 to 5", "for (i = 0; i <= 5)"], correct: 0 },
  { id: 15, text: "What is the correct way to write a JavaScript array?", options: ["var colors = 1 = (\"red\"), 2 = (\"green\"), 3 = (\"blue\")", "var colors = (1:\"red\", 2:\"green\", 3:\"blue\")", "var colors = [\"red\", \"green\", \"blue\"]", "var colors = \"red\", \"green\", \"blue\""], correct: 2 },
];

const Assessments: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const pattern = searchParams.get('pattern');

  const isMentor = location.pathname.includes('/mentor-dashboard');

  const [assessmentsData, setAssessmentsData] = useState<any[]>(defaultAssessments);
  const [completedAssessments, setCompletedAssessments] = useState<Record<number, { score: number, percentage: number, answers: Record<number, number> }>>({});

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const loggedInEmail = sessionStorage.getItem('loggedInEmail') || 'student@anurag.edu.in';
  const assessmentsKey = `anuragLmsAssessments_${loggedInEmail}`;

  useEffect(() => {
    const fetchData = async () => {
      // Load practice assessments
      const cloudAssessments = await getFromCloudflare('anuragLmsPracticeAssessments');
      if (cloudAssessments && Array.isArray(cloudAssessments)) {
        setAssessmentsData(cloudAssessments);
      } else {
        const localSaved = localStorage.getItem('anuragLmsAssessmentsListEmpty3');
        if (localSaved) setAssessmentsData(JSON.parse(localSaved));
      }

      // Load student completions
      if (!isMentor) {
        const cloudCompletions = await getFromCloudflare(assessmentsKey);
        if (cloudCompletions) {
          setCompletedAssessments(cloudCompletions);
        } else {
          const localCompletions = localStorage.getItem(assessmentsKey);
          if (localCompletions) setCompletedAssessments(JSON.parse(localCompletions));
        }
      }
    };
    fetchData();
  }, [isMentor, assessmentsKey]);

  const handleAddAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const newAssessment = {
      id: Date.now(),
      title: newTitle,
      description: newDescription
    };

    const updatedData = [...assessmentsData, newAssessment];
    setAssessmentsData(updatedData);
    await saveToCloudflare('anuragLmsPracticeAssessments', updatedData);
    
    setNewTitle('');
    setNewDescription('');
    setIsAdding(false);
  };

  const handleRemoveAssessment = async (id: number) => {
    const updatedData = assessmentsData.filter((a: any) => a.id !== id);
    setAssessmentsData(updatedData);
    await saveToCloudflare('anuragLmsPracticeAssessments', updatedData);
  };

  const handleSelectAssessment = (id: number) => {
    setSelectedAssessment(id);
    if (completedAssessments[id]) {
      setAnswers(completedAssessments[id].answers);
      setIsSubmitted(true);
    } else {
      setAnswers({});
      setIsSubmitted(false);
    }
  };

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    if (isSubmitted) return;
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }
    
    if (selectedAssessment !== null) {
      const score = questions.reduce((acc, q) => acc + (answers[q.id] === q.correct ? 1 : 0), 0);
      const percentage = Math.round((score / questions.length) * 100);
      
      const updated = {
        ...completedAssessments,
        [selectedAssessment]: { score, percentage, answers }
      };
      
      setCompletedAssessments(updated);
      await saveToCloudflare(assessmentsKey, updated);
      localStorage.setItem(assessmentsKey, JSON.stringify(updated)); // Fallback
    }
    
    setIsSubmitted(true);
  };

  const handleBack = () => {
    setSelectedAssessment(null);
  };

  if (selectedAssessment !== null) {
    const score = isSubmitted && completedAssessments[selectedAssessment] 
                  ? completedAssessments[selectedAssessment].score 
                  : questions.reduce((acc, q) => acc + (answers[q.id] === q.correct ? 1 : 0), 0);
    const percentage = isSubmitted && completedAssessments[selectedAssessment]
                  ? completedAssessments[selectedAssessment].percentage
                  : Math.round((score / questions.length) * 100);
    const currentTest = assessmentsData.find((a: any) => a.id === selectedAssessment);

    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium mb-6"
        >
          <ArrowLeft size={20} /> Back to Assessments
        </button>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{currentTest?.title}</h2>
            <p className="text-gray-500 mt-1">15 Objective Questions • HTML, CSS, JavaScript</p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center space-y-6 max-w-xl mx-auto mt-12">
            <Award size={64} className="mx-auto text-green-500" />
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Assessment Completed</h3>
              <p className="text-gray-500">Your test has been successfully submitted.</p>
            </div>
            <div className="flex items-center justify-center gap-12 py-8 border-y border-gray-100 mt-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">Score</p>
                <p className="text-4xl font-black text-gray-900">{score}<span className="text-2xl text-gray-400">/{questions.length}</span></p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">Percentage</p>
                <div className={`font-black text-4xl ${percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-orange-500' : 'text-red-500'}`}>
                  {percentage}%
                </div>
              </div>
            </div>
            <div className="pt-4">
              <button 
                onClick={handleBack}
                className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-sm hover:bg-primary/90 transition-colors"
              >
                Return to Assessments List
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {questions.map((q, index) => {
              const isAnswered = answers[q.id] !== undefined;
              const selectedOption = answers[q.id];
              
              return (
                <div key={q.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="font-bold text-gray-900 text-lg mb-4">
                    <span className="text-primary mr-2">{index + 1}.</span> 
                    {q.text}
                  </h3>
                  <div className="space-y-3">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedOption === optIdx;
                      let optionStyle = "border-gray-200 hover:border-primary/50 hover:bg-gray-50 text-gray-700";
                      
                      if (isSelected) {
                        optionStyle = "border-primary bg-primary/5 text-primary ring-1 ring-primary";
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group ${optionStyle}`}
                        >
                          <span className="font-medium text-sm">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSubmit}
                className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-sm hover:bg-primary/90 transition-colors"
              >
                Submit Assessment
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (pattern === 'weekly Exam Pattern') {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-6 pb-12">
        <div className="flex items-center gap-3 text-gray-900 font-bold text-2xl mb-8">
          <FileText className="text-orange-500" size={28} /> 
          Weekly Exam Pattern
        </div>
        
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <div className="space-y-4 text-lg">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="font-medium text-gray-700">Project</span>
              <span className="font-bold text-primary">5M</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="font-medium text-gray-700">Portfolio & Document</span>
              <span className="font-bold text-primary">5M</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="font-medium text-gray-700">Theory Assignment</span>
              <span className="font-bold text-primary">5M</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="font-medium text-gray-700">Attendence</span>
              <span className="font-bold text-primary">2M</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="font-medium text-gray-700">Mentor</span>
              <span className="font-bold text-primary">3M</span>
            </div>
            <div className="flex justify-between items-center pt-4">
              <span className="font-black text-gray-900 text-xl">Total</span>
              <span className="font-black text-primary text-2xl">20M</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pattern === 'CIE Exam Pattern') {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-6 pb-12">
        <div className="flex items-center gap-3 text-gray-900 font-bold text-2xl mb-8">
          <FileText className="text-orange-500" size={28} /> 
          CIE Exam Pattern
        </div>
        
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <div className="space-y-4 text-lg">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="font-medium text-gray-700">Project</span>
              <span className="font-bold text-primary">15M</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="font-medium text-gray-700">Theory Assignment</span>
              <span className="font-bold text-primary">10M</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="font-medium text-gray-700">Viva</span>
              <span className="font-bold text-primary">5M</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="font-medium text-gray-700">6 weeks Average</span>
              <span className="font-bold text-primary">20M</span>
            </div>
            <div className="flex justify-between items-center pt-4">
              <span className="font-black text-gray-900 text-xl">Total</span>
              <span className="font-black text-primary text-2xl">50M</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (pattern === 'SEM Exam Pattern') {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-6 pb-12">
        <div className="flex items-center gap-3 text-gray-900 font-bold text-2xl mb-8">
          <FileText className="text-orange-500" size={28} /> 
          SEM Exam Pattern
        </div>
        
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <div className="space-y-4 text-lg">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="font-medium text-gray-700">Project</span>
              <span className="font-bold text-primary">15M</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="font-medium text-gray-700">Theory Assignment</span>
              <span className="font-bold text-primary">10M</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="font-medium text-gray-700">Viva</span>
              <span className="font-bold text-primary">5M</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="font-medium text-gray-700">CIE1 or CIE2(best of one)</span>
              <span className="font-bold text-primary">20M</span>
            </div>
            <div className="flex justify-between items-center pt-4">
              <span className="font-black text-gray-900 text-xl">Total</span>
              <span className="font-black text-primary text-2xl">50M</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (pattern && pattern.startsWith('week') && pattern !== 'weekly Exam Pattern') {
    return <WeeklyExamReport pattern={pattern} isMentor={isMentor} loggedInEmail={loggedInEmail} />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">


      {isMentor && isAdding && (
        <div className="bg-white border-2 border-primary/20 p-6 rounded-2xl shadow-sm mb-6 relative">
          <button 
            onClick={() => setIsAdding(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-full"
          >
            <X size={18} />
          </button>
          
          <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Assessment</h3>
          
          <form onSubmit={handleAddAssessment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Title</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Frontend Basics Assessment 6"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
                placeholder="Provide a description..."
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm resize-none"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-orange-600 text-sm transition-colors shadow-sm"
              >
                Save Assessment
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-12">
        <WeeklyAssessmentFlow isMentor={isMentor} loggedInEmail={loggedInEmail} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {assessmentsData.length > 0 && (
          <h3 className="font-bold text-lg text-gray-900 border-b border-gray-200 pb-2 mt-4 mb-2">Practice Quizzes</h3>
        )}
        {assessmentsData.map((assessment: any) => (
          <div 
            key={assessment.id} 
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between group gap-4 md:gap-0"
          >
            <div className="w-full md:w-auto">
              <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">{assessment.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{assessment.description}</p>
              <div className="flex items-center gap-4 mt-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded-md">15 Questions</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded-md">Multiple Choice</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              {isMentor ? (
                <button 
                  onClick={() => handleRemoveAssessment(assessment.id)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="Remove Assessment"
                >
                  <Trash2 size={20} />
                </button>
              ) : (
                completedAssessments[assessment.id] ? (
                  <div className="shrink-0 flex flex-col items-start md:items-end gap-1.5 w-full md:w-auto">
                    <span className="flex items-center justify-center md:justify-start gap-1.5 px-5 py-2 bg-green-50 text-green-700 font-bold rounded-xl border border-green-100 text-sm shadow-sm w-full md:w-auto">
                      <Award size={18} /> Completed
                    </span>
                    <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-md border border-gray-100 w-full md:w-auto text-center md:text-right">
                      Score: {completedAssessments[assessment.id].score}/15
                    </span>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleSelectAssessment(assessment.id)}
                    className="shrink-0 flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-50 text-orange-600 font-bold rounded-xl hover:bg-orange-100 transition-colors border border-orange-100 shadow-sm w-full md:w-auto"
                  >
                    <PlayCircle size={18} /> Take Test
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Assessments;
