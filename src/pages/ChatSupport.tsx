import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, Send, Users, ChevronRight, Loader2, User, Search } from 'lucide-react';
import { getFromCloudflare, saveToCloudflare, getStudentsKey, getMentorKey } from '../utils/cloudflare';

interface ChatMessage {
  sender: 'student' | 'mentor';
  senderEmail: string;
  senderName: string;
  text: string;
  timestamp: string;
}

interface Batch {
  id: string;
  batchNumber: string;
  assignedMentor: string;
  memberEmails: string[];
}

const ChatSupport: React.FC = () => {
  const location = useLocation();
  const isMentor = location.pathname.includes('/mentor-dashboard');
  const loggedInEmail = (sessionStorage.getItem('loggedInEmail') || localStorage.getItem('loggedInEmail') || '').toLowerCase().trim();
  
  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  
  const [personalChats, setPersonalChats] = useState<Record<string, ChatMessage[]>>({});
  const [groupChats, setGroupChats] = useState<Record<string, ChatMessage[]>>({});
  
  const [isLoading, setIsLoading] = useState(true);

  // Student state
  const [studentActiveTab, setStudentActiveTab] = useState<'batch' | 'mentor'>('batch');

  // Mentor state
  const [mentorActiveType, setMentorActiveType] = useState<'batch' | 'personal'>('personal');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedStudentEmail, setSelectedStudentEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const studentsKey = getStudentsKey();
        const batchKey = getMentorKey('anuragLmsProjectBatchData');
        const [studentsData, groupChatsData, personalChatsData, batchesData] = await Promise.all([
          getFromCloudflare(studentsKey),
          getFromCloudflare('anuragLmsGroupChats'),
          getFromCloudflare('anuragLmsChats'),
          getFromCloudflare(batchKey)
        ]);
        
        // Merge Students
        const localStudents = JSON.parse(localStorage.getItem(studentsKey) || '[]');
        const allStudentsMap = new Map();
        [...localStudents, ...(studentsData || [])].forEach(s => {
          if (s && s.email) allStudentsMap.set(s.email.toLowerCase().trim(), s);
        });
        const studentList = Array.from(allStudentsMap.values());
        setRegisteredStudents(studentList);

        // Auto-select first student if mentor has none selected
        if (isMentor && studentList.length > 0 && !selectedStudentEmail) {
          const firstWithMsg = studentList.find(s => personalChatsData?.[s.email]?.length > 0);
          setSelectedStudentEmail(firstWithMsg ? firstWithMsg.email : studentList[0].email);
        }

        // Merge Batches
        const localBatches = JSON.parse(localStorage.getItem(batchKey) || '[]');
        let finalBatches: Batch[] = [];
        if (Array.isArray(localBatches)) {
          const batchMap = new Map();
          [...localBatches, ...(Array.isArray(batchesData) ? batchesData : [])].forEach(b => {
            if (b && b.id) batchMap.set(b.id, b);
          });
          finalBatches = Array.from(batchMap.values());
        } else if (localBatches && Object.keys(localBatches).length > 0) {
          finalBatches = [{ ...localBatches, id: 'legacy_1' }];
        } else if (batchesData && Array.isArray(batchesData)) {
          finalBatches = batchesData;
        } else if (batchesData && Object.keys(batchesData).length > 0) {
          finalBatches = [{ ...batchesData, id: 'legacy_1' } as any];
        }
        setBatches(finalBatches);

        // Merge Group Chats
        const localGroupChats = JSON.parse(localStorage.getItem('anuragLmsGroupChats') || '{}');
        setGroupChats({ ...localGroupChats, ...(groupChatsData || {}) });

        // Merge Personal Chats
        const localPersonalChats = JSON.parse(localStorage.getItem('anuragLmsChats') || '{}');
        setPersonalChats({ ...localPersonalChats, ...(personalChatsData || {}) });

      } catch (error) {
        console.error("Failed to load chat data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [isMentor]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [groupChats, personalChats, selectedBatchId, selectedStudentEmail, studentActiveTab, mentorActiveType]);

  const myBatch = !isMentor 
    ? batches.find(b => b.memberEmails && b.memberEmails.map(e => e.toLowerCase().trim()).includes(loggedInEmail)) 
    : null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    let senderName = 'Unknown';
    if (isMentor) {
      senderName = 'Mentor';
    } else {
      const student = registeredStudents.find(s => s.email.toLowerCase().trim() === loggedInEmail);
      if (student) senderName = student.name;
      else senderName = loggedInEmail.split('@')[0];
    }

    const newMsg: ChatMessage = {
      sender: isMentor ? 'mentor' : 'student',
      senderEmail: loggedInEmail,
      senderName: senderName,
      text: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    if (!isMentor) {
      if (studentActiveTab === 'batch' && myBatch) {
        const batchChat = groupChats[myBatch.id] || [];
        const updated = { ...groupChats, [myBatch.id]: [...batchChat, newMsg] };
        setGroupChats(updated);
        localStorage.setItem('anuragLmsGroupChats', JSON.stringify(updated));
        await saveToCloudflare('anuragLmsGroupChats', updated);
      } else if (studentActiveTab === 'mentor') {
        const pChat = personalChats[loggedInEmail] || [];
        const updated = { ...personalChats, [loggedInEmail]: [...pChat, newMsg] };
        setPersonalChats(updated);
        localStorage.setItem('anuragLmsChats', JSON.stringify(updated));
        await saveToCloudflare('anuragLmsChats', updated);
      }
    } else {
      if (mentorActiveType === 'batch' && selectedBatchId) {
        const batchChat = groupChats[selectedBatchId] || [];
        const updated = { ...groupChats, [selectedBatchId]: [...batchChat, newMsg] };
        setGroupChats(updated);
        localStorage.setItem('anuragLmsGroupChats', JSON.stringify(updated));
        await saveToCloudflare('anuragLmsGroupChats', updated);
      } else if (mentorActiveType === 'personal' && selectedStudentEmail) {
        const cleanTarget = selectedStudentEmail.toLowerCase().trim();
        const pChat = personalChats[cleanTarget] || [];
        const updated = { ...personalChats, [cleanTarget]: [...pChat, newMsg] };
        setPersonalChats(updated);
        localStorage.setItem('anuragLmsChats', JSON.stringify(updated));
        await saveToCloudflare('anuragLmsChats', updated);
      }
    }

    setNewMessage('');
  };

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // -------------------------------------------------------------
  // STUDENT VIEW (FULL SCREEN)
  // -------------------------------------------------------------
  if (!isMentor) {
    const activeChat = studentActiveTab === 'batch' 
      ? (myBatch ? (groupChats[myBatch.id] || []) : [])
      : (personalChats[loggedInEmail] || []);
    
    return (
      <div className="w-full h-full flex flex-col bg-white overflow-hidden">
        {/* Top Slim Header */}
        <div className="h-14 px-6 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 text-gray-900 font-bold text-base">
            <MessageSquare className="text-primary" size={20} /> 
            <span>Chat Support</span>
          </div>
          <span className="text-xs text-gray-500 font-medium">Student Portal Messaging</span>
        </div>
        
        {/* Full Screen Split Layout */}
        <div className="flex-1 flex overflow-hidden w-full h-[calc(100%-3.5rem)]">
          {/* Left Conversations Sidebar */}
          <div className="w-80 md:w-88 border-r border-gray-200 flex flex-col bg-white shrink-0 h-full">
            <div className="p-3.5 border-b border-gray-200 bg-gray-50/70">
              <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wider">Conversations</h3>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {/* Batch Chat Button */}
              {myBatch && (
                <button
                  onClick={() => setStudentActiveTab('batch')}
                  className={`w-full text-left p-3.5 hover:bg-gray-50 transition-colors flex items-center gap-3 cursor-pointer ${
                    studentActiveTab === 'batch' ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <Users size={18} />
                  </div>
                  <div className="flex-1 overflow-hidden min-w-0">
                    <h4 className={`font-semibold text-sm truncate ${studentActiveTab === 'batch' ? 'text-primary' : 'text-gray-900'}`}>
                      {myBatch.batchNumber} Group Chat
                    </h4>
                    <p className="text-xs text-gray-500 truncate mt-0.5">Chat with mentor & batch</p>
                  </div>
                  <ChevronRight size={16} className={studentActiveTab === 'batch' ? 'text-primary' : 'text-gray-300'} />
                </button>
              )}

              {/* Direct Mentor Chat Button */}
              <button
                onClick={() => setStudentActiveTab('mentor')}
                className={`w-full text-left p-3.5 hover:bg-gray-50 transition-colors flex items-center gap-3 cursor-pointer ${
                  studentActiveTab === 'mentor' ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                  <User size={18} />
                </div>
                <div className="flex-1 overflow-hidden min-w-0">
                  <h4 className={`font-semibold text-sm truncate ${studentActiveTab === 'mentor' ? 'text-primary' : 'text-gray-900'}`}>
                    Direct Message
                  </h4>
                  <p className="text-xs text-gray-500 truncate mt-0.5">Chat directly with Mentor</p>
                </div>
                <ChevronRight size={16} className={studentActiveTab === 'mentor' ? 'text-primary' : 'text-gray-300'} />
              </button>
            </div>
          </div>
          
          {/* Main Active Chat Area */}
          <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-hidden">
            {studentActiveTab === 'batch' && !myBatch ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <Users size={48} className="text-gray-300 mx-auto" />
                <h3 className="text-base font-semibold text-gray-800">No Batch Assigned Yet</h3>
                <p className="text-xs text-gray-500 max-w-sm">
                  You are not assigned to a project batch yet. You can chat directly with your course mentor using the Direct Message tab.
                </p>
              </div>
            ) : (
              <>
                {/* Active Chat Header */}
                <div className="h-16 px-6 border-b border-gray-200 bg-white flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                    {studentActiveTab === 'batch' ? <Users size={19} /> : <User size={19} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">
                      {studentActiveTab === 'batch' ? `${myBatch?.batchNumber} Group Chat` : 'Course Mentor'}
                    </h3>
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> 
                      {studentActiveTab === 'batch' ? `Mentor & ${myBatch?.memberEmails?.length || 0} Students` : 'Support Active'}
                    </p>
                  </div>
                </div>
                
                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {activeChat.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center space-y-2">
                      <MessageSquare size={40} className="text-gray-300 mx-auto" />
                      <p className="text-sm font-medium text-gray-600">No messages yet</p>
                      <p className="text-xs text-gray-400">Type a message below to start the conversation.</p>
                    </div>
                  )}
                  
                  {activeChat.map((msg, idx) => {
                    const isMe = msg.senderEmail.toLowerCase().trim() === loggedInEmail;
                    return (
                      <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] sm:max-w-[60%] p-3.5 rounded-lg shadow-2xs ${
                          isMe 
                            ? 'bg-primary text-white rounded-tr-none' 
                            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                        }`}>
                          {!isMe && (
                            <p className="text-xs font-bold mb-1 text-primary">
                              {msg.senderName}
                            </p>
                          )}
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          <p className={`text-[10px] mt-1.5 text-right font-mono ${isMe ? 'text-white/80' : 'text-gray-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Input Bar */}
                <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2.5 max-w-5xl mx-auto">
                    <input 
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder={studentActiveTab === 'batch' ? "Message your batch..." : "Message your mentor..."}
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-900"
                    />
                    <button 
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-xs cursor-pointer"
                    >
                      <span>Send</span>
                      <Send size={15} />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MENTOR VIEW (FULL SCREEN)
  // -------------------------------------------------------------
  let activeChat: ChatMessage[] = [];
  if (mentorActiveType === 'batch' && selectedBatchId) {
    activeChat = groupChats[selectedBatchId] || [];
  } else if (mentorActiveType === 'personal' && selectedStudentEmail) {
    activeChat = personalChats[selectedStudentEmail.toLowerCase().trim()] || [];
  }

  const selectedBatchObj = mentorActiveType === 'batch' ? batches.find(b => b.id === selectedBatchId) : null;
  const selectedStudentObj = mentorActiveType === 'personal' ? registeredStudents.find(s => s.email.toLowerCase().trim() === selectedStudentEmail?.toLowerCase().trim()) : null;

  const filteredBatches = batches.filter(b => 
    (b.batchNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredStudents = registeredStudents.filter(s => 
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.roll || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Top Header Bar */}
      <div className="h-14 px-6 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 text-gray-900 font-bold text-base">
          <MessageSquare className="text-primary" size={20} /> 
          <span>Student Chat Support</span>
        </div>
        <span className="text-xs text-gray-500 font-medium">Mentor Communications Center</span>
      </div>
      
      {/* Full Screen Split Layout */}
      <div className="flex-1 flex overflow-hidden w-full h-[calc(100%-3.5rem)]">
        {/* Left Conversations Sidebar */}
        <div className="w-80 md:w-96 border-r border-gray-200 flex flex-col bg-white shrink-0 h-full">
          {/* Search Box */}
          <div className="p-3 border-b border-gray-200 bg-white shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input 
                type="text"
                placeholder="Search batches, names, or roll numbers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-xs text-gray-900"
              />
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto">
            {/* Direct Messages Section */}
            <div className="px-4 py-2 bg-gray-50/80 border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between">
              <h3 className="font-bold text-gray-700 text-[11px] uppercase tracking-wider">Direct Messages</h3>
              <span className="text-[10px] text-gray-400 font-mono">{filteredStudents.length} Students</span>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-xs">No students found matching search.</div>
            ) : (
              filteredStudents.map(student => {
                const email = student.email.toLowerCase().trim();
                const studentMsgs = personalChats[email] || [];
                const lastMsg = studentMsgs[studentMsgs.length - 1];
                const isSelected = mentorActiveType === 'personal' && selectedStudentEmail?.toLowerCase().trim() === email;
                
                return (
                  <button
                    key={email}
                    onClick={() => { setMentorActiveType('personal'); setSelectedStudentEmail(email); }}
                    className={`w-full text-left p-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-center gap-3 cursor-pointer ${
                      isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-gray-700 font-bold text-xs uppercase">
                      {student.name ? student.name.charAt(0) : 'S'}
                    </div>
                    <div className="flex-1 overflow-hidden min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={`font-semibold text-xs truncate ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                          {student.name}
                        </h4>
                        {student.batch && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 border border-gray-200 shrink-0">
                            {student.batch}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {lastMsg ? lastMsg.text : <span className="text-gray-400 italic">No messages yet</span>}
                      </p>
                    </div>
                    <ChevronRight size={14} className={isSelected ? 'text-primary' : 'text-gray-300'} />
                  </button>
                );
              })
            )}

            {/* Batch Chats Section */}
            <div className="px-4 py-2 bg-gray-50/80 border-b border-gray-200 border-t sticky top-0 z-10 flex items-center justify-between mt-2">
              <h3 className="font-bold text-gray-700 text-[11px] uppercase tracking-wider">Project Batches</h3>
              <span className="text-[10px] text-gray-400 font-mono">{filteredBatches.length}</span>
            </div>

            {filteredBatches.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-xs">No batches found.</div>
            ) : (
              filteredBatches.map(batch => {
                const batchMsgs = groupChats[batch.id] || [];
                const lastMsg = batchMsgs[batchMsgs.length - 1];
                const isSelected = mentorActiveType === 'batch' && selectedBatchId === batch.id;
                
                return (
                  <button
                    key={batch.id}
                    onClick={() => { setMentorActiveType('batch'); setSelectedBatchId(batch.id); }}
                    className={`w-full text-left p-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-center gap-3 cursor-pointer ${
                      isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                      <Users size={18} />
                    </div>
                    <div className="flex-1 overflow-hidden min-w-0">
                      <h4 className={`font-semibold text-xs truncate ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                        {batch.batchNumber || 'Unnamed Batch'}
                      </h4>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {lastMsg ? `${lastMsg.senderName}: ${lastMsg.text}` : `${batch.memberEmails?.length || 0} Students`}
                      </p>
                    </div>
                    <ChevronRight size={14} className={isSelected ? 'text-primary' : 'text-gray-300'} />
                  </button>
                );
              })
            )}
          </div>
        </div>
        
        {/* Main Active Chat Area */}
        <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-hidden">
          {(mentorActiveType === 'batch' && selectedBatchId && selectedBatchObj) || (mentorActiveType === 'personal' && selectedStudentEmail) ? (
            <>
              {/* Active Conversation Header */}
              <div className="h-16 px-6 border-b border-gray-200 bg-white flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                  {mentorActiveType === 'batch' ? <Users size={19} /> : <User size={19} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm truncate">
                    {mentorActiveType === 'batch' 
                      ? selectedBatchObj?.batchNumber 
                      : (selectedStudentObj?.name || selectedStudentEmail)}
                  </h3>
                  <p className="text-xs text-gray-500 truncate mt-0.5 font-mono">
                    {mentorActiveType === 'batch' 
                      ? `${selectedBatchObj?.memberEmails?.length || 0} Batch Members` 
                      : `${selectedStudentEmail} ${selectedStudentObj?.roll ? `(${selectedStudentObj.roll})` : ''}`}
                  </p>
                </div>
              </div>
              
              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {activeChat.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center space-y-2">
                    <MessageSquare size={40} className="text-gray-300 mx-auto" />
                    <p className="text-sm font-medium text-gray-600">No messages in this conversation yet</p>
                    <p className="text-xs text-gray-400">Send a message below to start communicating.</p>
                  </div>
                )}
                
                {activeChat.map((msg, idx) => {
                  const isMe = msg.senderEmail.toLowerCase().trim() === loggedInEmail || msg.sender === 'mentor';
                  return (
                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] sm:max-w-[60%] p-3.5 rounded-lg shadow-2xs ${
                        isMe 
                          ? 'bg-primary text-white rounded-tr-none' 
                          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                      }`}>
                        {!isMe && (
                          <p className="text-xs font-bold mb-1 text-primary">
                            {msg.senderName}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <p className={`text-[10px] mt-1.5 text-right font-mono ${isMe ? 'text-white/80' : 'text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input Box */}
              <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2.5 max-w-5xl mx-auto">
                  <input 
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder={`Message ${mentorActiveType === 'batch' ? selectedBatchObj?.batchNumber : (selectedStudentObj?.name || 'student')}...`}
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-900"
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-xs cursor-pointer"
                  >
                    <span>Send</span>
                    <Send size={15} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center space-y-3">
              <MessageSquare size={48} className="text-gray-300 mx-auto" />
              <h3 className="text-base font-semibold text-gray-700">Select a Conversation</h3>
              <p className="text-xs text-gray-500 max-w-sm">
                Choose a student or project batch from the left list to view message history and send messages.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSupport;
