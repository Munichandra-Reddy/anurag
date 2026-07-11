import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, Send, Users, ChevronRight, Loader2 } from 'lucide-react';
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
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Mentor state
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentsData, chatsData, batchesData] = await Promise.all([
          getFromCloudflare('registeredStudents'),
          getFromCloudflare('anuragLmsGroupChats'),
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
          finalBatches = [{ ...batchesData, id: 'legacy_1' }];
        }
        setBatches(finalBatches);

        // Merge Chats
        const localChats = JSON.parse(localStorage.getItem('anuragLmsGroupChats') || '{}');
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [chats, selectedBatchId]);

  // Determine which batch is active
  const myBatch = !isMentor 
    ? batches.find(b => b.memberEmails.includes(loggedInEmail)) 
    : null;

  const activeChatId = isMentor ? selectedBatchId : (myBatch?.id || null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId) return;

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

    const batchChat = chats[activeChatId] || [];
    const updatedChats = {
      ...chats,
      [activeChatId]: [...batchChat, newMsg]
    };

    setChats(updatedChats);
    setNewMessage('');
    localStorage.setItem('anuragLmsGroupChats', JSON.stringify(updatedChats));
    await saveToCloudflare('anuragLmsGroupChats', updatedChats);
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
    if (!myBatch) {
      return (
        <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 h-[calc(100vh-8rem)] flex flex-col">
          <div className="flex items-center gap-3 text-gray-900 font-bold text-2xl shrink-0">
            <MessageSquare className="text-primary" size={28} /> 
            Batch Chat Support
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center p-12">
             <Users size={64} className="text-gray-300 mb-4" />
             <h2 className="text-xl font-bold text-gray-900 mb-2">No Batch Assigned</h2>
             <p className="text-gray-500 max-w-md">You need to be assigned to a project batch by your mentor before you can use the group chat support.</p>
          </div>
        </div>
      );
    }

    const activeChat = chats[myBatch.id] || [];
    
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex items-center gap-3 text-gray-900 font-bold text-2xl shrink-0">
          <MessageSquare className="text-primary" size={28} /> 
          Batch Chat Support
        </div>
        
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{myBatch.batchNumber} Group Chat</h3>
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Mentor & {myBatch.memberEmails.length} Students
              </p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8f9fa]">
            {activeChat.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <MessageSquare size={48} className="text-gray-300 mb-4" />
                <p>No messages yet. Start the conversation with your mentor and batch!</p>
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
                placeholder="Message your batch..."
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
  const activeChat = selectedBatchId ? (chats[selectedBatchId] || []) : [];
  const selectedBatchObj = batches.find(b => b.id === selectedBatchId);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center gap-3 text-gray-900 font-bold text-2xl shrink-0">
        <MessageSquare className="text-primary" size={28} /> 
        Batch Chat Support
      </div>
      
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex overflow-hidden">
        {/* Sidebar: Batches List */}
        <div className="w-1/3 border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-900">Project Batches</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {batches.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                No batches created yet.
              </div>
            )}
            {batches.map(batch => {
              const lastMsg = chats[batch.id]?.[chats[batch.id].length - 1];
              const isSelected = selectedBatchId === batch.id;
              
              return (
                <button
                  key={batch.id}
                  onClick={() => setSelectedBatchId(batch.id)}
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
          </div>
        </div>
        
        {/* Main: Active Chat */}
        <div className="flex-1 flex flex-col bg-[#f8f9fa]">
          {selectedBatchId && selectedBatchObj ? (
            <>
              <div className="p-4 border-b border-gray-100 bg-white flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {selectedBatchObj.batchNumber}
                  </h3>
                  <p className="text-xs text-gray-500">{selectedBatchObj.memberEmails.length} Students</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeChat.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <MessageSquare size={48} className="mb-4 opacity-50" />
                    <p>Start chatting with {selectedBatchObj.batchNumber}</p>
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
                        {!isMe && <p className="text-xs font-bold mb-1 opacity-70 text-primary">{msg.senderName}</p>}
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
                    placeholder={`Message ${selectedBatchObj.batchNumber}...`}
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
              <p className="font-medium">Select a project batch to start group chat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSupport;
