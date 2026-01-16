
import React, { useState, useRef } from 'react';
import { Plus, Search, Calendar, Tag, AlertCircle, CheckCircle2, Circle, LayoutGrid, List, X, Briefcase, Share2, Loader2, Camera, ClipboardPaste } from 'lucide-react';
import { Task, ViewState, TaskStatus, TaskPriority, Course } from '../types';
import { parseMoodleContent } from '../services/geminiService';

interface TasksProps {
  tasks: Task[];
  courses: Course[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setView: (view: ViewState) => void;
}

type GroupBy = 'Status' | 'Priority' | 'Course';

const Tasks: React.FC<TasksProps> = ({ tasks, courses, setTasks, setView }) => {
  const [groupBy, setGroupBy] = useState<GroupBy>('Status');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [moodleText, setMoodleText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCourseId, setNewTaskCourseId] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('Medium');

  const getColumns = (): string[] => {
    if (groupBy === 'Status') return ['Not Started', 'In Progress', 'Stuck', 'Done'];
    if (groupBy === 'Priority') return ['High', 'Medium', 'Low'];
    if (groupBy === 'Course') {
       const courseNames = Array.from(new Set(tasks.map(t => t.category || 'General'))) as string[];
       return courseNames.length > 0 ? courseNames : ['General'];
    }
    return [];
  };

  const columns = getColumns();

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const selectedCourse = courses.find(c => c.id === newTaskCourseId);
    const category = selectedCourse ? selectedCourse.title : 'General';

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      status: 'Not Started',
      priority: newTaskPriority,
      category: category,
      courseId: newTaskCourseId || undefined,
      dueDate: newTaskDate || new Date().toLocaleDateString('en-CA'),
      subtasks: [],
      attachments: []
    };

    setTasks([...tasks, newTask]);
    resetForm();
    setIsModalOpen(false);
  };

  const handleMoodleImport = async (content: string, isImage: boolean = false, mimeType: string = "") => {
    setIsImporting(true);
    try {
      const extracted = await parseMoodleContent(content, isImage, mimeType);
      if (extracted.length > 0) {
        const newTasks: Task[] = extracted.map((item: any) => {
          const course = courses.find(c => c.title.toLowerCase() === item.courseName.toLowerCase());
          return {
            id: Date.now().toString() + Math.random(),
            title: item.title,
            status: 'Not Started',
            priority: item.priority as TaskPriority,
            category: item.courseName,
            courseId: course?.id,
            dueDate: item.dueDate,
            subtasks: [],
            attachments: []
          };
        });
        setTasks(prev => [...prev, ...newTasks]);
        alert(`Successfully imported ${newTasks.length} tasks!`);
        setIsImportModalOpen(false);
        setMoodleText('');
      } else {
        alert("No tasks could be identified. Try copying more content.");
      }
    } catch (e) {
      alert("Error parsing content. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result?.toString().split(',')[1];
        if (base64) handleMoodleImport(base64, true, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setNewTaskTitle('');
    setNewTaskCourseId('');
    setNewTaskDate('');
    setNewTaskPriority('Medium');
  };

  const getFilteredTasks = (columnValue: string) => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (groupBy === 'Status') return task.status === columnValue;
      if (groupBy === 'Priority') return task.priority === columnValue;
      if (groupBy === 'Course') return (task.category || 'General') === columnValue;
      return false;
    });
  };

  const getCourseStyles = (courseId?: string) => {
      const course = courses.find(c => c.id === courseId);
      if (!course) return { bg: 'bg-white', border: 'border-slate-200', text: 'text-slate-700' };
      const colorMap: Record<string, { bg: string, border: string, text: string }> = {
          'bg-blue-500': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
          'bg-emerald-500': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
          'bg-purple-500': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
          'bg-rose-500': { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
          'bg-amber-500': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
          'bg-indigo-500': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
          'bg-cyan-500': { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700' },
          'bg-teal-500': { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
      };
      return colorMap[course.color] || { bg: 'bg-white', border: 'border-slate-200', text: 'text-slate-700' };
  };

  const getPriorityBadge = (priority: TaskPriority) => {
      switch(priority) {
          case 'High': return 'bg-rose-100 text-rose-700';
          case 'Medium': return 'bg-amber-100 text-amber-700';
          case 'Low': return 'bg-emerald-100 text-emerald-700';
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-bold text-slate-800">My Tasks</h1>
            <p className="text-slate-500 text-sm">Manage your workload effectively</p>
         </div>

         <div className="flex flex-col md:flex-row gap-3">
             <div className="flex bg-slate-100 p-1 rounded-lg">
                 {['Status', 'Priority', 'Course'].map((g) => (
                     <button
                        key={g}
                        onClick={() => setGroupBy(g as GroupBy)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${groupBy === g ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                         By {g}
                     </button>
                 ))}
             </div>
             
             <button 
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
             >
                 <Share2 className="w-4 h-4" /> Import from Moodle
             </button>

             <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
             >
                 <Plus className="w-5 h-5" />
                 <span>New Task</span>
             </button>
         </div>
      </div>

      {/* Board Layout */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <div className="flex h-full gap-6 min-w-max">
              {columns.map(column => {
                  const columnTasks = getFilteredTasks(column);
                  return (
                      <div key={column} className="w-80 flex flex-col h-full">
                          <div className="flex items-center justify-between mb-4 px-1">
                              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                  {column} 
                                  <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{columnTasks.length}</span>
                              </h3>
                          </div>

                          <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-20 no-scrollbar">
                              {columnTasks.length === 0 && (
                                  <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                                      <p className="text-slate-400 text-sm">No tasks</p>
                                  </div>
                              )}
                              {columnTasks.map(task => {
                                  const styles = getCourseStyles(task.courseId);
                                  return (
                                    <div 
                                        key={task.id}
                                        onClick={() => setView({ type: 'task_detail', taskId: task.id })}
                                        className={`p-4 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group ${styles.bg} ${styles.border}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className={`text-[10px] font-bold px-2 py-1 rounded-md ${getPriorityBadge(task.priority)}`}>
                                                {task.priority}
                                            </div>
                                            {task.status === 'Done' ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            ) : (
                                                <Circle className={`w-5 h-5 text-slate-400`} />
                                            )}
                                        </div>
                                        
                                        <h4 className={`font-bold text-slate-800 mb-1 ${task.status === 'Done' ? 'line-through opacity-60' : ''}`}>
                                            {task.title}
                                        </h4>
                                        
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5">
                                            <div className={`flex items-center gap-1 text-xs font-medium ${styles.text}`}>
                                                <Tag className="w-3 h-3" />
                                                <span className="truncate max-w-[80px]">{task.category}</span>
                                            </div>
                                            {task.dueDate && (
                                                <div className="flex items-center gap-1 text-xs text-slate-500 bg-white/50 px-1.5 py-0.5 rounded">
                                                    <Calendar className="w-3 h-3" /> {task.dueDate}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                  );
                              })}
                          </div>
                      </div>
                  )
              })}
          </div>
      </div>

      {/* Moodle Import Modal */}
      {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in border border-slate-100">
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30">
                      <div>
                        <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                            <Share2 className="w-5 h-5" /> Import from Moodle
                        </h3>
                        <p className="text-xs text-indigo-600 font-medium">AI identifies tasks from text or screenshots</p>
                      </div>
                      <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-5 h-5" /></button>
                  </div>
                  
                  <div className="p-6 space-y-5">
                      <div className="flex gap-4">
                         <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-indigo-100 rounded-2xl hover:bg-indigo-50/50 transition-colors group"
                         >
                            <Camera className="w-8 h-8 text-indigo-400 group-hover:text-indigo-600" />
                            <div className="text-center">
                                <span className="block text-sm font-bold text-indigo-900">Upload Screenshot</span>
                                <span className="text-[10px] text-indigo-500">Of your Moodle assignments page</span>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                         </button>

                         <div className="flex-1 flex flex-col gap-3">
                             <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                                <ClipboardPaste className="w-8 h-8 text-slate-300" />
                                <div className="text-center">
                                    <span className="block text-sm font-bold text-slate-800">Paste Text Below</span>
                                    <span className="text-[10px] text-slate-400">Copy all text from dashboard</span>
                                </div>
                             </div>
                         </div>
                      </div>

                      <div className="space-y-2">
                        <textarea 
                            value={moodleText}
                            onChange={e => setMoodleText(e.target.value)}
                            placeholder="Paste Moodle dashboard text here..."
                            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all text-sm resize-none"
                        />
                      </div>

                      <button 
                        onClick={() => handleMoodleImport(moodleText)}
                        disabled={isImporting || !moodleText.trim()}
                        className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                          {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Import These Tasks</>}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Add Task Modal */}
      {isModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-800">Add New Task</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                  </div>
                  
                  <form onSubmit={handleAddTask} className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                          <input 
                              autoFocus
                              type="text" 
                              required
                              value={newTaskTitle}
                              onChange={e => setNewTaskTitle(e.target.value)}
                              placeholder="e.g. Finish Assignment 3"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Course</label>
                              <div className="relative">
                                  <Briefcase className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                                  <select 
                                      value={newTaskCourseId}
                                      onChange={e => setNewTaskCourseId(e.target.value)}
                                      className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 appearance-none"
                                  >
                                      <option value="">General Task</option>
                                      {courses.map(course => (
                                          <option key={course.id} value={course.id}>{course.title}</option>
                                      ))}
                                  </select>
                              </div>
                          </div>
                          
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                              <div className="relative">
                                  <AlertCircle className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                                  <select 
                                      value={newTaskPriority}
                                      onChange={e => setNewTaskPriority(e.target.value as TaskPriority)}
                                      className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 appearance-none"
                                  >
                                      <option value="Low">Low</option>
                                      <option value="Medium">Medium</option>
                                      <option value="High">High</option>
                                  </select>
                              </div>
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                          <div className="relative">
                              <Calendar className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                              <input 
                                  type="date" 
                                  value={newTaskDate}
                                  onChange={e => setNewTaskDate(e.target.value)}
                                  className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                              />
                          </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                          <button 
                              type="button" 
                              onClick={() => setIsModalOpen(false)}
                              className="flex-1 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                              type="submit" 
                              className="flex-1 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all"
                          >
                              Create Task
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Tasks;
