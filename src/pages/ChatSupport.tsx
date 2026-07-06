import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, Send, User, ChevronRight, Loader2 } from 'lucide-react';
import { getFromCloudflare, saveToCloudflare } from '../utils/cloudflare';

interface ChatMessage {
  sender: 'student' | 'mentor';
  text: string;
  timestamp: string;
}

const ChatSupport: React.FC = () => {
  const location = useLocation();
  const isMentor = location.pathname.includes('/mentor-dashboard');
  const loggedInEmail = localStorage.getItem('loggedInEmail') || '';
  
  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Mentor state
  const [selectedStudentEmail, setSelectedStudentEmail] = useState<string | null>(null);
  
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentsData, chatsData] = await Promise.all([
          getFromCloudflare('registeredStudents'),
          getFromCloudflare('anuragLmsChats')
        ]);
        
        // Merge Students
        const localStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]');
        const allStudentsMap = new Map();
        [...localStudents, ...(studentsData || [])].forEach(s => {
          if (s && s.email) allStudentsMap.set(s.email, s);
        });
        setRegisteredStudents(Array.from(allStudentsMap.values()));

        // Merge Chats
        const localChats = JSON.parse(localStorage.getItem('anuragLmsChats') || '{}');
        const mergedChats = { ...localChats, ...(chatsData || {}) };
        setChats(mergedChats);
      } catch (error) {
        console.error("Failed to load data from Cloudflare", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [chats, selectedStudentEmail]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const activeEmail = isMentor ? selectedStudentEmail : loggedInEmail;
    if (!activeEmail) return;

    const newMsg: ChatMessage = {
      sender: isMentor ? 'mentor' : 'student',
      text: newMessage,
      timestamp: new Date().toISOString()
    };

    const studentChat = chats[activeEmail] || [];
    const updatedChats = {
      ...chats,
      [activeEmail]: [...studentChat, newMsg]
    };

    // Optimistic UI update and Local Storage sync
    setChats(updatedChats);
    setNewMessage('');
    localStorage.setItem('anuragLmsChats', JSON.stringify(updatedChats));

    // Save to Cloudflare asynchronously
    await saveToCloudflare('anuragLmsChats', updatedChats);
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
    const myChat = chats[loggedInEmail] || [];
    
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex items-center gap-3 text-gray-900 font-bold text-2xl shrink-0">
          <MessageSquare className="text-primary" size={28} /> 
          Chat Support
        </div>
        
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
              M
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Mentor Support</h3>
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Online
              </p>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8f9fa]">
            {myChat.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <MessageSquare size={48} className="text-gray-300 mb-4" />
                <p>No messages yet. Say hello to your mentor!</p>
              </div>
            )}
            
            {myChat.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] p-3 rounded-2xl ${
                  msg.sender === 'student' 
                    ? 'bg-primary text-white rounded-br-sm' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-[10px] mt-1 text-right ${msg.sender === 'student' ? 'text-white/70' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-100 shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input 
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
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
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MENTOR VIEW
  // -------------------------------------------------------------
  const studentsWithChats = Object.keys(chats);
  const activeChat = selectedStudentEmail ? (chats[selectedStudentEmail] || []) : [];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center gap-3 text-gray-900 font-bold text-2xl shrink-0">
        <MessageSquare className="text-primary" size={28} /> 
        Student Chat Support
      </div>
      
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex overflow-hidden">
        {/* Sidebar: Student List */}
        <div className="w-1/3 border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-900">Conversations</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {studentsWithChats.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                No students have sent messages yet.
              </div>
            )}
            {studentsWithChats.map(email => {
              const studentObj = registeredStudents.find((s: any) => s.email === email);
              const name = studentObj ? studentObj.name : email.split('@')[0];
              const lastMsg = chats[email][chats[email].length - 1];
              const isSelected = selectedStudentEmail === email;
              
              return (
                <button
                  key={email}
                  onClick={() => setSelectedStudentEmail(email)}
                  className={`w-full text-left p-4 border-b border-gray-50 hover:bg-orange-50 transition-colors flex items-center gap-3 ${isSelected ? 'bg-orange-50/50' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <User size={18} className="text-gray-500" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className={`font-bold text-sm truncate ${isSelected ? 'text-primary' : 'text-gray-900'}`}>{name}</h4>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{lastMsg.text}</p>
                  </div>
                  <ChevronRight size={16} className={isSelected ? 'text-primary' : 'text-gray-300'} />
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Main: Active Chat */}
        <div className="flex-1 flex flex-col bg-[#f8f9fa]">
          {selectedStudentEmail ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 bg-white flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {registeredStudents.find((s: any) => s.email === selectedStudentEmail)?.name || selectedStudentEmail.split('@')[0]}
                  </h3>
                  <p className="text-xs text-gray-500">{selectedStudentEmail}</p>
                </div>
              </div>
              
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeChat.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'mentor' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl ${
                      msg.sender === 'mentor' 
                        ? 'bg-primary text-white rounded-br-sm' 
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-[10px] mt-1 text-right ${msg.sender === 'mentor' ? 'text-white/70' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input 
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder={`Reply to ${registeredStudents.find((s: any) => s.email === selectedStudentEmail)?.name || 'student'}...`}
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
