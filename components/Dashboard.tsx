import React, { useState } from 'react';
import { CheckCircle, XCircle, Calendar as CalendarIcon, MapPin, Clock, LayoutList, CalendarDays, Plus, Video, CheckSquare, X, ArrowRight, Circle } from 'lucide-react';
import { Course, ScheduleItem, ClassSession, ViewState, Lecture, Task } from '../types';

interface DashboardProps {
  courses: Course[];
  schedule: ScheduleItem[];
  sessions: ClassSession[];
  lectures: Lecture[];
  setLectures: React.Dispatch<React.SetStateAction<Lecture[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onMarkAttendance: (scheduleItem: ScheduleItem, status: 'attended' | 'missed') => void;
  setView: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
    courses, schedule, sessions, onMarkAttendance, setView,
    lectures, setLectures, tasks, setTasks
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('cards');
  const [plannedLectureIds, setPlannedLectureIds] = useState<string[]>([]);
  const [isAddingQueue, setIsAddingQueue] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday
  const dateStr = today.toISOString().split('T')[0];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Data Filtering
  const todayClasses = schedule
    .filter(item => item.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const backlog = lectures.filter(l => l.isBacklog && !l.completed);
  const plannedBacklog = lectures.filter(l => plannedLectureIds.includes(l.id));

  // Helper Functions
  const getSessionStatus = (itemId: string) => {
    return sessions.find(s => s.scheduleItemId === itemId && s.date === dateStr)?.status;
  };

  const handleAddTask = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newTaskTitle.trim()) return;
      const newTask: Task = {
          id: Date.now().toString(),
          title: newTaskTitle,
          completed: false,
          category: 'General',
          dueDate: dateStr
      };
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
  };

  const toggleTask = (id: string) => {
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const toggleBacklogItemCompletion = (id: string) => {
      setLectures(lectures.map(l => l.id === id ? { ...l, completed: !l.completed } : l));
  };

  const addToPlan = (id: string) => {
      if (!plannedLectureIds.includes(id)) {
          setPlannedLectureIds([...plannedLectureIds, id]);
      }
      setIsAddingQueue(false);
  };

  const removeFromPlan = (id: string) => {
      setPlannedLectureIds(plannedLectureIds.filter(pid => pid !== id));
  };

  const getStyleForCalendarItem = (startTime: string, endTime: string) => {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startVal = startH + startM / 60;
      const endVal = endH + endM / 60;
      const duration = endVal - startVal;
      
      const top = (startVal - 8) * 80; // 80px per hour
      const height = duration * 80;
      return { top: `${top}px`, height: `${height}px` };
  };

  const getCourseColorStyle = (colorClass: string) => {
    const colorMap: Record<string, string> = {
      'bg-blue-500': 'bg-blue-100 border-blue-200 text-blue-900',
      'bg-emerald-500': 'bg-emerald-100 border-emerald-200 text-emerald-900',
      'bg-purple-500': 'bg-purple-100 border-purple-200 text-purple-900',
      'bg-rose-500': 'bg-rose-100 border-rose-200 text-rose-900',
      'bg-amber-500': 'bg-amber-100 border-amber-200 text-amber-900',
      'bg-indigo-500': 'bg-indigo-100 border-indigo-200 text-indigo-900',
    };
    return colorMap[colorClass] || 'bg-slate-100 border-slate-200 text-slate-900';
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white px-6 py-6 border-b border-slate-200 flex-shrink-0 flex items-center justify-between">
         <div>
            <h1 className="text-2xl font-bold text-slate-800">
                Good {today.getHours() < 12 ? 'Morning' : today.getHours() < 18 ? 'Afternoon' : 'Evening'}!
            </h1>
            <p className="text-slate-500 text-sm mt-1">{dayNames[dayOfWeek]}, {today.toLocaleDateString()}</p>
         </div>

         <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button 
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Card View"
            >
                <LayoutList className="w-5 h-5" />
            </button>
            <button 
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Day Calendar View"
            >
                <CalendarDays className="w-5 h-5" />
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 max-w-6xl mx-auto w-full">
        {/* VIEW MODE: CARDS (Default) */}
        {viewMode === 'cards' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Schedule & Catch Up */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Today's Schedule */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <CalendarIcon className="w-5 h-5 text-primary-500" /> Today's Classes
                        </h2>
                        <div className="space-y-4">
                            {todayClasses.length === 0 ? (
                                <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                                    <p className="text-slate-400">No classes scheduled for today.</p>
                                </div>
                            ) : (
                                todayClasses.map(item => {
                                    const course = courses.find(c => c.id === item.courseId);
                                    const status = getSessionStatus(item.id);
                                    if (!course) return null;
                                    const colorStyle = getCourseColorStyle(course.color);

                                    return (
                                        <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 ${course.color} rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                                                    <span className="font-bold">{item.startTime.split(':')[0]}</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800">{course.title}</h3>
                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                                                        <span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide">{item.type}</span>
                                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.startTime} - {item.endTime}</span>
                                                        {item.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.location}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50 mt-2 sm:mt-0">
                                                {status ? (
                                                    <div className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                                                        status === 'attended' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                                                    }`}>
                                                        {status === 'attended' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                        {status === 'attended' ? 'Attended' : 'Missed'}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button onClick={() => onMarkAttendance(item, 'attended')} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-sm font-medium transition-colors">
                                                            Attended
                                                        </button>
                                                        <button onClick={() => onMarkAttendance(item, 'missed')} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-sm font-medium transition-colors">
                                                            Missed
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Catch Up Plan */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Video className="w-5 h-5 text-rose-500" /> Catch Up Plan
                            </h2>
                            <button 
                                onClick={() => setIsAddingQueue(true)}
                                className="text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Add from Queue
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {plannedBacklog.length === 0 ? (
                                <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-sm text-slate-400">Nothing planned from the backlog for today.</p>
                                </div>
                            ) : (
                                plannedBacklog.map(item => {
                                    const course = courses.find(c => c.id === item.courseId);
                                    return (
                                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-rose-100 flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                 <div 
                                                    onClick={() => toggleBacklogItemCompletion(item.id)}
                                                    className="cursor-pointer text-slate-300 hover:text-emerald-500 transition-colors"
                                                 >
                                                     <Circle className="w-5 h-5" />
                                                 </div>
                                                 <div>
                                                     <div className="flex items-center gap-2 mb-0.5">
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded text-white font-bold mb-1 inline-block ${course?.color || 'bg-slate-500'}`}>
                                                            {course?.title}
                                                        </span>
                                                        <span className="text-xs text-slate-400">{item.date}</span>
                                                     </div>
                                                     <p className="font-medium text-slate-800 text-sm">{item.title}</p>
                                                 </div>
                                            </div>
                                            <button onClick={() => removeFromPlan(item.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Tasks */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 h-full flex flex-col">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <CheckSquare className="w-5 h-5 text-indigo-500" /> Tasks
                        </h2>
                        
                        <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                            <input 
                                type="text" 
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                                placeholder="Add a new task..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400"
                            />
                            <button type="submit" className="bg-slate-800 text-white rounded-lg p-2 hover:bg-slate-700">
                                <Plus className="w-4 h-4" />
                            </button>
                        </form>

                        <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar max-h-[500px]">
                            {tasks.filter(t => !t.completed).length === 0 && (
                                <p className="text-center text-slate-400 text-sm py-4">No pending tasks!</p>
                            )}
                            {tasks.filter(t => !t.completed).map(task => (
                                <div key={task.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg group">
                                    <button onClick={() => toggleTask(task.id)} className="mt-0.5 text-slate-300 hover:text-emerald-500 transition-colors">
                                        <Circle className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm text-slate-700 flex-1">{task.title}</span>
                                </div>
                            ))}
                             {tasks.filter(t => t.completed).length > 0 && (
                                <div className="pt-4 border-t border-slate-100 mt-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Completed</p>
                                    {tasks.filter(t => t.completed).map(task => (
                                        <div key={task.id} className="flex items-start gap-3 p-2 opacity-50">
                                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                                            <span className="text-sm text-slate-700 flex-1 line-through">{task.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* VIEW MODE: CALENDAR */}
        {viewMode === 'calendar' && (
            <div className="flex h-full gap-6">
                {/* Time Grid */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-y-auto relative h-[800px] flex">
                    {/* Time Axis */}
                    <div className="w-16 flex-shrink-0 border-r border-slate-100 bg-slate-50/50 pt-4">
                        {Array.from({ length: 14 }, (_, i) => i + 8).map(hour => (
                             <div key={hour} className="h-[80px] text-xs text-slate-400 text-center relative">
                                 <span className="-top-2 relative bg-slate-50/50 px-1">{hour}:00</span>
                                 <div className="absolute top-0 right-0 w-2 h-[1px] bg-slate-200"></div>
                             </div>
                        ))}
                    </div>
                    
                    {/* Event Space */}
                    <div className="flex-1 relative bg-white pt-4">
                        {/* Grid Lines */}
                        {Array.from({ length: 14 }, (_, i) => i + 8).map(hour => (
                             <div key={hour} className="h-[80px] border-t border-slate-50 w-full"></div>
                        ))}

                        {/* Events */}
                        {todayClasses.map(item => {
                            const course = courses.find(c => c.id === item.courseId);
                            if (!course) return null;
                            const colorStyle = getCourseColorStyle(course.color);
                            
                            return (
                                <div 
                                    key={item.id}
                                    style={getStyleForCalendarItem(item.startTime, item.endTime)}
                                    className={`absolute left-2 right-2 rounded-xl p-3 border shadow-sm flex flex-col justify-between ${colorStyle} overflow-hidden`}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-sm">{course.title}</span>
                                        <span className="text-xs opacity-75">{item.startTime}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs bg-white/50 px-1.5 rounded">{item.type}</span>
                                        {item.location && <span className="text-xs flex items-center gap-1 opacity-75"><MapPin className="w-3 h-3"/> {item.location}</span>}
                                    </div>
                                </div>
                            )
                        })}

                        {/* Current Time Indicator */}
                        <div className="absolute left-0 right-0 border-t-2 border-red-400 z-10 pointer-events-none flex items-center" style={{ top: `${(new Date().getHours() - 8 + new Date().getMinutes()/60) * 80}px` }}>
                             <div className="w-2 h-2 bg-red-400 rounded-full -ml-1"></div>
                        </div>
                    </div>
                </div>

                {/* Sidebar for Tasks & Backlog in Calendar Mode */}
                <div className="w-80 flex flex-col gap-6">
                     <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-slate-800">Tasks</h3>
                            <button onClick={() => setIsAddingQueue(true)} className="text-xs text-primary-600 font-medium">Add backlog</button>
                        </div>
                        <div className="space-y-2 overflow-y-auto flex-1">
                             {/* Mixed List of Tasks + Planned Backlog */}
                             {plannedBacklog.map(item => (
                                 <div key={item.id} className="p-2 border border-rose-100 bg-rose-50 rounded-lg text-sm flex items-center gap-2">
                                     <Video className="w-4 h-4 text-rose-500" />
                                     <span className="flex-1 truncate font-medium text-rose-900">{item.title}</span>
                                     <button onClick={() => removeFromPlan(item.id)}><X className="w-3 h-3 text-rose-400" /></button>
                                 </div>
                             ))}
                             {tasks.filter(t => !t.completed).map(task => (
                                 <div key={task.id} className="p-2 border border-slate-100 bg-white rounded-lg text-sm flex items-center gap-2 shadow-sm">
                                     <CheckSquare className="w-4 h-4 text-slate-400" />
                                     <span className="flex-1 truncate text-slate-700">{task.title}</span>
                                 </div>
                             ))}
                        </div>
                        
                        <form onSubmit={handleAddTask} className="mt-2 pt-2 border-t border-slate-100 flex gap-2">
                             <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="New task..." className="flex-1 bg-slate-50 text-sm px-2 rounded-lg outline-none" />
                             <button type="submit" className="text-primary-600"><Plus className="w-4 h-4" /></button>
                        </form>
                     </div>
                </div>
            </div>
        )}
      </div>

      {/* Add From Queue Modal */}
      {isAddingQueue && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col animate-fade-in">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800">Add from Watch Queue</h3>
                      <button onClick={() => setIsAddingQueue(false)}><X className="w-5 h-5 text-slate-400" /></button>
                  </div>
                  <div className="p-4 overflow-y-auto flex-1 space-y-3">
                      {backlog.filter(l => !plannedLectureIds.includes(l.id)).length === 0 && (
                          <p className="text-center text-slate-400 py-4">No unprocessed backlog items available.</p>
                      )}
                      {backlog.filter(l => !plannedLectureIds.includes(l.id)).map(item => {
                          const course = courses.find(c => c.id === item.courseId);
                          return (
                              <button 
                                key={item.id}
                                onClick={() => addToPlan(item.id)}
                                className="w-full bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100 p-3 rounded-xl flex items-center justify-between group transition-all text-left"
                              >
                                  <div>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded text-white font-bold mb-1 inline-block ${course?.color || 'bg-slate-500'}`}>
                                          {course?.title}
                                      </span>
                                      <p className="font-medium text-slate-800 text-sm">{item.title}</p>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500" />
                              </button>
                          )
                      })}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;