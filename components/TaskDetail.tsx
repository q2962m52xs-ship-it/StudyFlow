import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Circle, Tag, Sparkles, Loader2, Calendar, X, Plus, Trash2, Paperclip, File, Download } from 'lucide-react';
import { Task, Course, TaskStatus, TaskPriority, Subtask, TaskAttachment } from '../types';
import { getTaskAdvice } from '../services/geminiService';

interface TaskDetailProps {
  task: Task;
  course?: Course;
  onUpdate: (task: Task) => void;
  onBack: () => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ task, course, onUpdate, onBack }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const completedSubtasks = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
  const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
  const progress = totalSubtasks === 0 ? 0 : (completedSubtasks / totalSubtasks) * 100;

  const updateStatus = (status: TaskStatus) => {
    onUpdate({ ...task, status });
  };

  const updatePriority = (priority: TaskPriority) => {
    onUpdate({ ...task, priority });
  };

  const handleAddSubtask = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newSubtaskTitle.trim()) return;
      const newSubtask: Subtask = {
          id: Date.now().toString(),
          title: newSubtaskTitle,
          completed: false
      };
      const updatedSubtasks = [...(task.subtasks || []), newSubtask];
      onUpdate({ ...task, subtasks: updatedSubtasks });
      setNewSubtaskTitle('');
  };

  const toggleSubtask = (id: string) => {
      const updatedSubtasks = task.subtasks.map(s => 
          s.id === id ? { ...s, completed: !s.completed } : s
      );
      onUpdate({ ...task, subtasks: updatedSubtasks });
  };

  const deleteSubtask = (id: string) => {
      const updatedSubtasks = task.subtasks.filter(s => s.id !== id);
      onUpdate({ ...task, subtasks: updatedSubtasks });
  };

  // Mock File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const newAttachment: TaskAttachment = {
              id: Date.now().toString(),
              name: file.name,
              type: 'file',
              url: '#' // In a real app, this would be the uploaded URL
          };
          const updatedAttachments = [...(task.attachments || []), newAttachment];
          onUpdate({ ...task, attachments: updatedAttachments });
      }
  };

  const deleteAttachment = (id: string) => {
      const updatedAttachments = (task.attachments || []).filter(a => a.id !== id);
      onUpdate({ ...task, attachments: updatedAttachments });
  };

  const handleGetAdvice = async () => {
    setLoadingAdvice(true);
    const result = await getTaskAdvice(task.title, task.description);
    setAdvice(result);
    setLoadingAdvice(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto h-full overflow-y-auto no-scrollbar pb-24 md:pb-6 animate-fade-in bg-slate-50">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Header / Nav */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                <h2 className="font-bold text-slate-800">Task Details</h2>
                <div className="w-6"></div> {/* Spacer */}
            </div>

            <div className="p-8">
                {/* Title & Status */}
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                    <div className="flex-1">
                        <input 
                            value={task.title}
                            onChange={(e) => onUpdate({ ...task, title: e.target.value })}
                            className="text-3xl font-bold text-slate-800 w-full outline-none placeholder:text-slate-300"
                            placeholder="Task Title"
                        />
                        <div className="flex flex-wrap gap-3 mt-4">
                            {/* Status Dropdown */}
                            <select 
                                value={task.status}
                                onChange={(e) => updateStatus(e.target.value as TaskStatus)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium outline-none cursor-pointer border-2 transition-colors ${
                                    task.status === 'Done' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                    task.status === 'Stuck' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                                    task.status === 'In Progress' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                                    'bg-slate-50 border-slate-100 text-slate-700'
                                }`}
                            >
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Stuck">Stuck</option>
                                <option value="Done">Done</option>
                            </select>

                            {/* Priority Dropdown */}
                            <select 
                                value={task.priority}
                                onChange={(e) => updatePriority(e.target.value as TaskPriority)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium outline-none cursor-pointer border-2 ${
                                    task.priority === 'High' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                                    task.priority === 'Medium' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                    'bg-emerald-50 border-emerald-100 text-emerald-700'
                                }`}
                            >
                                <option value="Low">Low Priority</option>
                                <option value="Medium">Medium Priority</option>
                                <option value="High">High Priority</option>
                            </select>

                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-sm text-slate-600">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <input 
                                    type="date"
                                    value={task.dueDate || ''}
                                    onChange={(e) => onUpdate({ ...task, dueDate: e.target.value })}
                                    className="bg-transparent outline-none"
                                />
                            </div>

                            {course && (
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-100 text-sm font-medium`}>
                                    <span className={`w-2 h-2 rounded-full ${course.color}`}></span>
                                    {course.title}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Subtasks Section */}
                <div className="mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-800">Subtasks</h3>
                        <span className="text-sm font-medium text-primary-600">{completedSubtasks}/{totalSubtasks}</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden mb-6">
                        <div 
                            className="h-full bg-primary-500 transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Add Subtask */}
                    <form onSubmit={handleAddSubtask} className="flex gap-2 mb-4">
                        <button type="button" className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                            <Plus className="w-5 h-5" />
                        </button>
                        <input 
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            placeholder="Add a new subtask..."
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 outline-none focus:border-primary-300"
                        />
                    </form>

                    {/* Subtask List */}
                    <div className="space-y-2">
                        {task.subtasks && task.subtasks.map(subtask => (
                            <div key={subtask.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 group">
                                <button 
                                    onClick={() => toggleSubtask(subtask.id)}
                                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                                        subtask.completed 
                                        ? 'bg-primary-500 border-primary-500 text-white' 
                                        : 'border-slate-300 hover:border-primary-400'
                                    }`}
                                >
                                    {subtask.completed && <CheckCircle className="w-4 h-4" />}
                                </button>
                                <span className={`flex-1 text-sm ${subtask.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                    {subtask.title}
                                </span>
                                <button onClick={() => deleteSubtask(subtask.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Attachments Section */}
                <div className="mb-8 bg-white border border-slate-200 p-6 rounded-2xl">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Paperclip className="w-5 h-5 text-slate-400" /> Attachments
                        </h3>
                        <label className="cursor-pointer text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add File
                            <input type="file" className="hidden" onChange={handleFileUpload} />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         {(task.attachments || []).length === 0 && (
                             <p className="text-sm text-slate-400 col-span-full italic">No files attached.</p>
                         )}
                         {(task.attachments || []).map(att => (
                             <div key={att.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                 <div className="flex items-center gap-3 overflow-hidden">
                                     <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-500 shadow-sm">
                                         <File className="w-4 h-4" />
                                     </div>
                                     <span className="text-sm text-slate-700 truncate">{att.name}</span>
                                 </div>
                                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button className="p-1.5 text-slate-400 hover:text-slate-600">
                                         <Download className="w-4 h-4" />
                                     </button>
                                     <button onClick={() => deleteAttachment(att.id)} className="p-1.5 text-slate-400 hover:text-rose-500">
                                         <Trash2 className="w-4 h-4" />
                                     </button>
                                 </div>
                             </div>
                         ))}
                    </div>
                </div>

                {/* Description & AI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-bold text-slate-800 mb-2">Description</h3>
                        <textarea 
                            value={task.description || ''}
                            onChange={(e) => onUpdate({...task, description: e.target.value})}
                            placeholder="Add details..."
                            className="w-full h-40 p-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary-300 outline-none resize-none text-slate-700"
                        />
                    </div>
                    
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                         <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-500" /> AI Assistant
                            </h3>
                            {!advice && (
                                <button 
                                    onClick={handleGetAdvice}
                                    disabled={loadingAdvice}
                                    className="text-xs bg-white text-indigo-600 px-3 py-1.5 rounded-lg font-bold shadow-sm hover:bg-indigo-50 transition-colors disabled:opacity-50"
                                >
                                    {loadingAdvice ? <Loader2 className="w-3 h-3 animate-spin" /> : "Get Advice"}
                                </button>
                            )}
                        </div>
                        
                        {advice ? (
                            <div className="text-indigo-800 text-sm leading-relaxed max-h-32 overflow-y-auto pr-2">
                                {advice}
                            </div>
                        ) : (
                             <p className="text-indigo-400 text-sm">Need help breaking this down? Ask AI.</p>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                     <button 
                        onClick={onBack}
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-slate-800 transition-colors"
                     >
                         Save & Close
                     </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default TaskDetail;