import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, Send, Users, ChevronRight, Loader2, User, Search } from 'lucide-react';
import { getFromCloudflare, saveToCloudflare } from '../utils/cloudflare';

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
  const loggedInEmail = sessionStorage.getItem('loggedInEmail') || '';
  
  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  
  const [personalChats, setPersonalChats] = useState<Record<string, ChatMessage[]>>({});
  const [groupChats, setGroupChats] = useState<Record<string, ChatMessage[]>>({});
  
  const [isLoading, setIsLoading] = useState(true);

  // Student state
  const [studentActiveTab, setStudentActiveTab] = useState<'batch' | 'mentor'>('batch');

  // Mentor state
  const [mentorActiveType, setMentorActiveType] = useState<'batch' | 'personal'>('batch');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedStudentEmail, setSelectedStudentEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentsData, groupChatsData, personalChatsData, batchesData] = await Promise.all([
          getFromCloudflare('registeredStudents'),
          getFromCloudflare('anuragLmsGroupChats'),
          getFromCloudflare('anuragLmsChats'), // original 1-to-1 chats
          getFromCloudflare('anuragLmsProjectBatchData')
        ]);
        
        // Merge Students
        const localStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]');
        const allStudentsMap = new Map();
        [...localStudents, ...(studentsData || [])].forEach(s => {
          if (s && s.email) allStudentsMap.set(s.email, s);
        });
        setRegisteredStudents(Array.from(allStudentsMap.values()));

        // Merge Batches
        const localBatches = JSON.parse(localStorage.getItem('anuragLmsProjectBatchData') || '[]');
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
        console.error("Failed to load data from Cloudflare", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [groupChats, personalChats, selectedBatchId, selectedStudentEmail, studentActiveTab, mentorActiveType]);

  const myBatch = !isMentor 
    ? batches.find(b => b.memberEmails.includes(loggedInEmail)) 
    : null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    let senderName = 'Unknown';
    if (isMentor) {
      senderName = 'Mentor';
    } else {
      const student = registeredStudents.find(s => s.email === loggedInEmail);
      if (student) senderName = student.name;
    }

    const newMsg: ChatMessage = {
      sender: isMentor ? 'mentor' : 'student',
      senderEmail: loggedInEmail,
      senderName: senderName,
      text: newMessage,
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
        const pChat = personalChats[selectedStudentEmail] || [];
        const updated = { ...personalChats, [selectedStudentEmail]: [...pChat, newMsg] };
        setPersonalChats(updated);
        localStorage.setItem('anuragLmsChats', JSON.stringify(updated));
        await saveToCloudflare('anuragLmsChats', updated);
      }
    }

    setNewMessage('');
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // -------------------------------------------------------------
  // STUDENT VIEW
  // -------------------------------------------------------------
  if (!isMentor) {
    const activeChat = studentActiveTab === 'batch' 
      ? (myBatch ? (groupChats[myBatch.id] || []) : [])
      : (personalChats[loggedInEmail] || []);
    
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6 pb-12 h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex items-center gap-3 text-gray-900 font-bold text-2xl shrink-0">
          <MessageSquare className="text-primary" size={28} /> 
          Chat Support
        </div>
        
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-gray-100 flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900">Conversations</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {/* Batch Chat Button */}
              {myBatch && (
                <button
                  onClick={() => setStudentActiveTab('batch')}
                  className={`w-full text-left p-4 border-b border-gray-50 hover:bg-orange-50 transition-colors flex items-center gap-3 ${studentActiveTab === 'batch' ? 'bg-orange-50/50' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Users size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className={`font-bold text-sm truncate ${studentActiveTab === 'batch' ? 'text-primary' : 'text-gray-900'}`}>{myBatch.batchNumber} Group Chat</h4>
                    <p className="text-xs text-gray-500 truncate mt-0.5">Chat with mentor & batch</p>
                  </div>
                  <ChevronRight size={16} className={studentActiveTab === 'batch' ? 'text-primary' : 'text-gray-300'} />
                </button>
              )}
              {/* Personal Mentor Chat Button */}
              <button
                onClick={() => setStudentActiveTab('mentor')}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-orange-50 transition-colors flex items-center gap-3 ${studentActiveTab === 'mentor' ? 'bg-orange-50/50' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User size={18} className="text-primary" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className={`font-bold text-sm truncate ${studentActiveTab === 'mentor' ? 'text-primary' : 'text-gray-900'}`}>Direct Message</h4>
                  <p className="text-xs text-gray-500 truncate mt-0.5">Chat directly with Mentor</p>
                </div>
                <ChevronRight size={16} className={studentActiveTab === 'mentor' ? 'text-primary' : 'text-gray-300'} />
              </button>
            </div>
          </div>
          
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-[#f8f9fa]">
            {studentActiveTab === 'batch' && !myBatch ? (
               <div className="h-full flex flex-col items-center justify-center text-center p-12">
                 <Users size={64} className="text-gray-300 mb-4" />
                 <h2 className="text-xl font-bold text-gray-900 mb-2">No Batch Assigned</h2>
                 <p className="text-gray-500 max-w-md">You need to be assigned to a project batch by your mentor before you can use the group chat support.</p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-100 bg-white flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                    {studentActiveTab === 'batch' ? <Users size={20} className="text-primary" /> : <User size={20} className="text-primary" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {studentActiveTab === 'batch' ? `${myBatch?.batchNumber} Group Chat` : 'Mentor Support'}
                    </h3>
                    <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> 
                      {studentActiveTab === 'batch' ? `Mentor & ${myBatch?.memberEmails.length} Students` : 'Online'}
                    </p>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {activeChat.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                      <MessageSquare size={48} className="text-gray-300 mb-4" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  )}
                  
                  {activeChat.map((msg, idx) => {
                    const isMe = msg.senderEmail === loggedInEmail;
                    return (
                      <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
                        <div className={`max-w-[70%] p-3 rounded-2xl ${
                          isMe 
                            ? 'bg-primary text-white rounded-br-sm' 
                            : (msg.sender === 'mentor' ? 'bg-orange-100 border border-orange-200 text-orange-900 rounded-bl-sm shadow-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm')
                        }`}>
                          {!isMe && <p className={`text-xs font-bold mb-1 opacity-70 ${msg.sender === 'mentor' ? 'text-orange-900' : 'text-primary'}`}>{msg.senderName}</p>}
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input 
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder={studentActiveTab === 'batch' ? "Message your batch..." : "Message your mentor..."}
                      className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    />
                    <button 
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      <Send size={20} className="ml-1" />
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
  // MENTOR VIEW
  // -------------------------------------------------------------
  let activeChat: ChatMessage[] = [];
  if (mentorActiveType === 'batch' && selectedBatchId) {
    activeChat = groupChats[selectedBatchId] || [];
  } else if (mentorActiveType === 'personal' && selectedStudentEmail) {
    activeChat = personalChats[selectedStudentEmail] || [];
  }

  const selectedBatchObj = mentorActiveType === 'batch' ? batches.find(b => b.id === selectedBatchId) : null;
  const selectedStudentObj = mentorActiveType === 'personal' ? registeredStudents.find(s => s.email === selectedStudentEmail) : null;

  const filteredBatches = batches.filter(b => 
    (b.batchNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredStudents = registeredStudents.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center gap-3 text-gray-900 font-bold text-2xl shrink-0">
        <MessageSquare className="text-primary" size={28} /> 
        Student Chat Support
      </div>
      
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-white shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Search batches or students..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Batch Chats Section */}
            <div className="p-4 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Project Batches</h3>
            </div>
            {filteredBatches.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">No batches found.</div>
            )}
            {filteredBatches.map(batch => {
              const lastMsg = groupChats[batch.id]?.[groupChats[batch.id].length - 1];
              const isSelected = mentorActiveType === 'batch' && selectedBatchId === batch.id;
              
              return (
                <button
                  key={batch.id}
                  onClick={() => { setMentorActiveType('batch'); setSelectedBatchId(batch.id); }}
                  className={`w-full text-left p-4 border-b border-gray-50 hover:bg-orange-50 transition-colors flex items-center gap-3 ${isSelected ? 'bg-orange-50/50' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Users size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className={`font-bold text-sm truncate ${isSelected ? 'text-primary' : 'text-gray-900'}`}>{batch.batchNumber || 'Unnamed Batch'}</h4>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {lastMsg ? `${lastMsg.senderName}: ${lastMsg.text}` : `${batch.memberEmails.length} Students`}
                    </p>
                  </div>
                  <ChevronRight size={16} className={isSelected ? 'text-primary' : 'text-gray-300'} />
                </button>
              )
            })}

            {/* Direct Messages Section */}
            <div className="p-4 border-b border-gray-100 bg-gray-50 sticky top-0 z-10 mt-2">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Direct Messages</h3>
            </div>
            {filteredStudents.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">No students found.</div>
            )}
            {/* We show all students or just those who messaged. Showing all lets mentor initiate. */}
            {filteredStudents.map(student => {
              const email = student.email;
              const lastMsg = personalChats[email]?.[personalChats[email].length - 1];
              const isSelected = mentorActiveType === 'personal' && selectedStudentEmail === email;
              
              return (
                <button
                  key={email}
                  onClick={() => { setMentorActiveType('personal'); setSelectedStudentEmail(email); }}
                  className={`w-full text-left p-4 border-b border-gray-50 hover:bg-orange-50 transition-colors flex items-center gap-3 ${isSelected ? 'bg-orange-50/50' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <User size={18} className="text-gray-500" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className={`font-bold text-sm truncate ${isSelected ? 'text-primary' : 'text-gray-900'}`}>{student.name}</h4>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {lastMsg ? lastMsg.text : 'Click to chat'}
                    </p>
                  </div>
                  <ChevronRight size={16} className={isSelected ? 'text-primary' : 'text-gray-300'} />
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Main: Active Chat */}
        <div className="flex-1 flex flex-col bg-[#f8f9fa]">
          {(mentorActiveType === 'batch' && selectedBatchId && selectedBatchObj) || (mentorActiveType === 'personal' && selectedStudentEmail && selectedStudentObj) ? (
            <>
              <div className="p-4 border-b border-gray-100 bg-white flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {mentorActiveType === 'batch' ? <Users size={20} /> : <User size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {mentorActiveType === 'batch' ? selectedBatchObj?.batchNumber : selectedStudentObj?.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {mentorActiveType === 'batch' ? `${selectedBatchObj?.memberEmails.length} Students` : selectedStudentEmail}
                  </p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeChat.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <MessageSquare size={48} className="mb-4 opacity-50" />
                    <p>Start chatting with {mentorActiveType === 'batch' ? selectedBatchObj?.batchNumber : selectedStudentObj?.name}</p>
                  </div>
                )}
                
                {activeChat.map((msg, idx) => {
                  const isMe = msg.senderEmail === loggedInEmail || (isMentor && msg.sender === 'mentor');
                  return (
                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
                      <div className={`max-w-[70%] p-3 rounded-2xl ${
                        isMe 
                          ? 'bg-primary text-white rounded-br-sm' 
                          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                      }`}>
                        {!isMe && mentorActiveType === 'batch' && (
                          <p className="text-xs font-bold mb-1 opacity-70 text-primary">{msg.senderName}</p>
                        )}
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input 
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder={`Message ${mentorActiveType === 'batch' ? selectedBatchObj?.batchNumber : selectedStudentObj?.name}...`}
                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    <Send size={20} className="ml-1" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <MessageSquare size={64} className="mb-4 opacity-50" />
              <p className="font-medium">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSupport;
