import React, { useState, useEffect } from 'react';
import { Users, Video, ShieldCheck, Mail, Linkedin, Github, Edit, Check, X, Plus, Trash2, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getFromCloudflare, saveToCloudflare } from '../utils/cloudflare';

interface Batch {
  id: string;
  batchNumber: string;
  virtualRoom: string;
  assignedMentor: string;
  memberEmails: string[];
}

const ProjectBatch: React.FC = () => {
  const location = useLocation();
  const isMentor = location.pathname.includes('/mentor-dashboard');
  const loggedInEmail = localStorage.getItem('loggedInEmail') || '';

  const [batches, setBatches] = useState<Batch[]>([]);
  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mentor state
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Batch | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cloudBatches, cloudStudents] = await Promise.all([
          getFromCloudflare('anuragLmsProjectBatchData'),
          getFromCloudflare('registeredStudents')
        ]);
        
        // Merge Batches
        let finalBatches: Batch[] = [];
        const localBatches = JSON.parse(localStorage.getItem('anuragLmsProjectBatchData') || '[]');
        if (Array.isArray(localBatches)) {
          // If already array, merge by ID
          const batchMap = new Map();
          [...localBatches, ...(Array.isArray(cloudBatches) ? cloudBatches : [])].forEach(b => {
            if (b && b.id) batchMap.set(b.id, b);
          });
          finalBatches = Array.from(batchMap.values());
        } else if (localBatches && Object.keys(localBatches).length > 0) {
          // Legacy object format migration
          finalBatches = [{ ...localBatches, id: 'legacy_1' }];
        } else if (cloudBatches && Array.isArray(cloudBatches)) {
          finalBatches = cloudBatches;
        } else if (cloudBatches && Object.keys(cloudBatches).length > 0) {
          finalBatches = [{ ...cloudBatches, id: 'legacy_1' }];
        }
        setBatches(finalBatches);

        // Merge Students
        const localStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]');
        const allStudentsMap = new Map();
        [...localStudents, ...(cloudStudents || [])].forEach(s => {
          if (s && s.email) allStudentsMap.set(s.email, s);
        });
        setRegisteredStudents(Array.from(allStudentsMap.values()));

      } catch (error) {
        console.error("Failed to load data from Cloudflare", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const saveBatches = async (newBatches: Batch[]) => {
    setBatches(newBatches);
    localStorage.setItem('anuragLmsProjectBatchData', JSON.stringify(newBatches));
    await saveToCloudflare('anuragLmsProjectBatchData', newBatches);
  };

  const handleAddNewBatch = () => {
    const newBatch: Batch = {
      id: Date.now().toString(),
      batchNumber: `Batch ${batches.length + 1}`,
      virtualRoom: '',
      assignedMentor: '',
      memberEmails: []
    };
    setEditingBatchId(newBatch.id);
    setEditForm(newBatch);
  };

  const handleEditClick = (batch: Batch) => {
    setEditingBatchId(batch.id);
    setEditForm({ ...batch });
  };

  const handleCancelEdit = () => {
    setEditingBatchId(null);
    setEditForm(null);
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    
    let updatedBatches: Batch[];
    const exists = batches.some(b => b.id === editForm.id);
    
    if (exists) {
      updatedBatches = batches.map(b => b.id === editForm.id ? editForm : b);
    } else {
      updatedBatches = [editForm, ...batches]; // Put new batch at the top
    }
    
    saveBatches(updatedBatches);
    setEditingBatchId(null);
    setEditForm(null);
  };

  const handleDeleteBatch = (id: string) => {
    if (window.confirm("Are you sure you want to delete this batch?")) {
      const updatedBatches = batches.filter(b => b.id !== id);
      saveBatches(updatedBatches);
    }
  };

  const handleToggleMember = (email: string) => {
    if (!editForm) return;
    setEditForm(prev => {
      if (!prev) return prev;
      const isSelected = prev.memberEmails.includes(email);
      if (isSelected) {
        return { ...prev, memberEmails: prev.memberEmails.filter((e: string) => e !== email) };
      } else {
        return { ...prev, memberEmails: [...prev.memberEmails, email] };
      }
    });
  };

  // array of distinct colors to use for avatar bg
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500', 'bg-indigo-500'];

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
    // Find the batch the student is assigned to
    const myBatch = batches.find(b => b.memberEmails.includes(loggedInEmail));

    if (!myBatch) {
      return (
        <div className="w-full max-w-5xl space-y-8 pb-12">
          <div className="flex items-center gap-3 text-gray-900 font-bold text-2xl mb-8">
            <Users className="text-primary" size={28} /> 
            Project Batch Details
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users size={32} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Project Batch Assigned</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              You have not been assigned to a project batch yet. Once a mentor assigns you to a batch, your details will appear here.
            </p>
          </div>
        </div>
      );
    }

    const currentMembers = registeredStudents.filter((s: any) => myBatch.memberEmails.includes(s.email));

    return (
      <div className="w-full max-w-5xl space-y-8 pb-12">
        <div className="flex items-center gap-3 text-gray-900 font-bold text-2xl">
          <Users className="text-primary" size={28} /> 
          Project Batch Details
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Batch Info Card */}
          <div className="col-span-1 md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Batch Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Batch Number</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{myBatch.batchNumber || '—'}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex flex-col">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Virtual Room</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{myBatch.virtualRoom || '—'}</p>
                {myBatch.virtualRoom && (
                  <button className="mt-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors w-max">
                    <Video size={16} /> Join Meeting Room
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mentor Card */}
          <div className="col-span-1 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck size={40} className="text-primary" />
            </div>
            <p className="text-xs font-bold text-primary uppercase tracking-wider">Assigned Mentor</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">{myBatch.assignedMentor || '—'}</h3>
            {myBatch.assignedMentor && (
              <button className="mt-auto w-full py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors mt-6">
                Message Mentor
              </button>
            )}
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Batch Members ({currentMembers.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentMembers.map((member: any, idx: number) => {
              const initials = member.name.substring(0, 2).toUpperCase();
              const colorClass = colors[idx % colors.length];
              return (
                <div key={member.email} className="border border-gray-100 rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all group bg-white">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4 shadow-sm ${colorClass}`}>
                    {initials}
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors truncate">{member.name}</h3>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                    <a href={`mailto:${member.email}`} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Mail size={16} />
                    </a>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Linkedin size={16} />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Github size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MENTOR VIEW
  // -------------------------------------------------------------
  return (
    <div className="w-full max-w-5xl space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-gray-900 font-bold text-2xl">
          <Users className="text-primary" size={28} /> 
          Project Batch Management
        </div>
        {!editingBatchId && (
          <button 
            onClick={handleAddNewBatch}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm"
          >
            <Plus size={16} /> Add New Batch
          </button>
        )}
      </div>

      {editingBatchId && editForm && (
        <div className="bg-orange-50 border border-orange-200 p-6 rounded-2xl shadow-sm mb-8 relative">
          <div className="flex justify-between items-start mb-6 border-b border-orange-200/50 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {batches.some(b => b.id === editForm.id) ? 'Edit Batch Details' : 'Create New Batch'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">Configure batch settings and assign students.</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCancelEdit}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm"
              >
                <X size={16} /> Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-sm"
              >
                <Check size={16} /> Save Changes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Batch Number</label>
              <input 
                type="text"
                value={editForm.batchNumber}
                onChange={e => setEditForm({...editForm, batchNumber: e.target.value})}
                placeholder="e.g. Batch 1"
                className="w-full p-3 rounded-xl border border-gray-200 bg-white font-bold text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Virtual Room</label>
              <input 
                type="text"
                value={editForm.virtualRoom}
                onChange={e => setEditForm({...editForm, virtualRoom: e.target.value})}
                placeholder="e.g. Room 203"
                className="w-full p-3 rounded-xl border border-gray-200 bg-white font-bold text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Assigned Mentor</label>
              <input 
                type="text"
                value={editForm.assignedMentor}
                onChange={e => setEditForm({...editForm, assignedMentor: e.target.value})}
                placeholder="e.g. Mahesh"
                className="w-full p-3 rounded-xl border border-gray-200 bg-white font-bold text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-orange-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
              <p className="text-sm font-bold text-gray-700">Select students for this batch ({editForm.memberEmails.length} selected):</p>
              <input 
                type="text"
                placeholder="Search students..."
                onChange={(e) => {
                  const val = e.target.value.toLowerCase();
                  const btns = document.querySelectorAll('.student-select-btn');
                  btns.forEach((btn) => {
                    const text = btn.textContent?.toLowerCase() || '';
                    if (text.includes(val)) {
                      (btn as HTMLElement).style.display = 'flex';
                    } else {
                      (btn as HTMLElement).style.display = 'none';
                    }
                  });
                }}
                className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {registeredStudents.length === 0 && <p className="text-sm text-gray-500 py-2">No students registered yet.</p>}
              {registeredStudents.map((student: any) => {
                const isSelected = editForm.memberEmails.includes(student.email);
                return (
                  <button
                    key={student.email}
                    onClick={() => handleToggleMember(student.email)}
                    className={`student-select-btn flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      isSelected ? 'bg-primary/10 border-primary/30 text-primary shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {isSelected && <Check size={14} />}
                    {student.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {batches.length === 0 && !editingBatchId && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Batches Created</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            You haven't created any project batches yet. Create one to assign students.
          </p>
          <button 
            onClick={handleAddNewBatch}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm mx-auto"
          >
            <Plus size={18} /> Add New Batch
          </button>
        </div>
      )}

      {!editingBatchId && batches.map((batch) => {
        const currentMembers = registeredStudents.filter((s: any) => batch.memberEmails.includes(s.email));
        
        return (
          <div key={batch.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm relative group overflow-hidden">
            <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleEditClick(batch)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors shadow-sm"
              >
                <Edit size={14} /> Edit
              </button>
              <button 
                onClick={() => handleDeleteBatch(batch.id)}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors shadow-sm"
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="col-span-1 md:col-span-2">
                <h2 className="text-xl font-black text-gray-900 mb-2">{batch.batchNumber || 'Unnamed Batch'}</h2>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <Video size={16} className="text-blue-500" /> Room: <span className="font-bold text-gray-900">{batch.virtualRoom || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <ShieldCheck size={16} className="text-primary" /> Mentor: <span className="font-bold text-gray-900">{batch.assignedMentor || 'Unassigned'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 mt-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">Batch Members ({currentMembers.length})</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {currentMembers.length === 0 ? (
                  <p className="text-gray-500 text-sm italic col-span-full">No students assigned to this batch.</p>
                ) : (
                  currentMembers.map((member: any, idx: number) => {
                    const initials = member.name.substring(0, 2).toUpperCase();
                    const colorClass = colors[idx % colors.length];
                    return (
                      <div key={member.email} className="border border-gray-100 rounded-xl p-4 hover:border-primary/30 hover:shadow-md transition-all flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${colorClass} shrink-0`}>
                          {initials}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-gray-900 text-sm truncate">{member.name}</h4>
                          <p className="text-xs text-gray-500 truncate">{member.email}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  );
};

export default ProjectBatch;
