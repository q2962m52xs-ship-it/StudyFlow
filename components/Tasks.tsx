import React, { useState } from 'react';
import { Plus, Search, Calendar, Tag, AlertCircle, CheckCircle2, Circle, LayoutGrid, List, X, Briefcase } from 'lucide-react';
import { Task, ViewState, TaskStatus, TaskPriority, Course } from '../types';

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

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCourseId, setNewTaskCourseId] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('Medium');

  // Helper to get columns based on grouping
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

    // Find course name if selected
    const selectedCourse = courses.find(c => c.id === newTaskCourseId);
    const category = selectedCourse ? selectedCourse.title : 'General';

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      status: 'Not Started',
      priority: newTaskPriority,
      category: category,
      courseId: newTaskCourseId || undefined,
      dueDate: newTaskDate || new Date().toISOString().split('T')[0],
      subtasks: [],
      attachments: []
    };

    setTasks([...tasks, newTask]);
    resetForm();
    setIsModalOpen(false);
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

  // Helper to map Tailwind bg color to a lighter tint and border
  const getCourseStyles = (courseId?: string) => {
      const course = courses.find(c => c.id === courseId);
      if (!course) return { bg: 'bg-white', border: 'border-slate-200', text: 'text-slate-700' };

      // Map primary colors to their tints
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
             
             <div className="relative">
                 <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                 <input 
                    type="text" 
                    placeholder="Search tasks..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white border focus:border-primary-300 rounded-lg text-sm outline-none w-full md:w-64 transition-all"
                 />
             </div>
             
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
                                        
                                        {task.description && (
                                            <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                                                {task.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5">
                                            <div className={`flex items-center gap-1 text-xs font-medium ${styles.text}`}>
                                                <Tag className="w-3 h-3" />
                                                <span className="truncate max-w-[80px]">{task.category}</span>
                                            </div>
                                            
                                            {task.subtasks.length > 0 && (
                                                <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
                                                    <List className="w-3 h-3" />
                                                    {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                                                </div>
                                            )}

                                            {task.dueDate && (
                                                <div className="flex items-center gap-1 text-xs text-slate-500 bg-white/50 px-1.5 py-0.5 rounded">
                                                    <Calendar className="w-3 h-3" /> {task.dueDate.split('-').slice(1).join('/')}
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