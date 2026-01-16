
import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Calendar, Settings, Video, CheckCircle2, Upload, Loader2, Camera, Pencil, Trash2, Edit3, Check } from 'lucide-react';
import { Course, ScheduleItem, ClassSession, Lecture } from '../types';
import { parseScheduleImage } from '../services/geminiService';

interface ScheduleProps {
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  schedule: ScheduleItem[];
  setSchedule: React.Dispatch<React.SetStateAction<ScheduleItem[]>>;
  sessions: ClassSession[];
  onMarkAttendance: (item: ScheduleItem, date: string, status: 'attended' | 'missed') => void;
  lectures: Lecture[];
  setLectures: React.Dispatch<React.SetStateAction<Lecture[]>>;
}

const Schedule: React.FC<ScheduleProps> = ({ courses, setCourses, schedule, setSchedule, sessions, onMarkAttendance, lectures, setLectures }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Edit Mode State
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State for Schedule Items
  const [formCourseId, setFormCourseId] = useState('');
  const [formDay, setFormDay] = useState('0');
  const [formStart, setFormStart] = useState('08:00');
  const [formEnd, setFormEnd] = useState('10:00');
  const [formType, setFormType] = useState<'Lecture' | 'Recitation' | 'Lab'>('Lecture');
  const [formLocation, setFormLocation] = useState('');

  // Filter states
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Semester Settings State
  const [semesterStart, setSemesterStart] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    return d.toLocaleDateString('en-CA');
  });
  const [semesterEnd, setSemesterEnd] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Helper for consistent date strings
  const getLocalDateString = (d: Date) => d.toLocaleDateString('en-CA');

  const getWeekNumber = () => {
      if (!semesterStart) return 1;
      const start = new Date(semesterStart + 'T00:00:00');
      const now = new Date(currentDate); 
      now.setHours(0,0,0,0);
      
      const diffTime = Math.abs(now.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      const weekNum = Math.floor(diffDays / 7) + 1;
      return weekNum > 0 ? weekNum : 1;
  };

  const startOfWeek = new Date(currentDate);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const weekRangeString = `${weekDays[0].getDate().toString().padStart(2, '0')}/${(weekDays[0].getMonth() + 1).toString().padStart(2, '0')} - ${weekDays[4].getDate().toString().padStart(2, '0')}/${(weekDays[4].getMonth() + 1).toString().padStart(2, '0')}`;

  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8);

  const backlog = lectures.filter(l => l.isBacklog && !l.completed);
  
  const filteredBacklog = backlog.filter(item => {
      let typeMatch = true;
      if (selectedTypes.length > 0) typeMatch = selectedTypes.some(type => item.title.toLowerCase().includes(type.toLowerCase()));
      let courseMatch = true;
      if (selectedCourses.length > 0) courseMatch = selectedCourses.includes(item.courseId);
      return typeMatch && courseMatch;
  });

  const generateBacklogItems = (item: ScheduleItem): Lecture[] => {
      const newLectures: Lecture[] = [];
      const now = new Date();
      const start = new Date(semesterStart + 'T00:00:00');
      
      const dayDiff = (item.dayOfWeek - start.getDay() + 7) % 7;
      const currentIterDate = new Date(start);
      currentIterDate.setDate(start.getDate() + dayDiff);

      while (currentIterDate < now) {
          const isToday = currentIterDate.toDateString() === now.toDateString();
          let isPast = true;

          if (isToday) {
              const [h, m] = item.startTime.split(':').map(Number);
              const classTime = new Date(currentIterDate);
              classTime.setHours(h, m, 0, 0);
              if (classTime > now) isPast = false;
          }

          if (isPast) {
              const dateStr = getLocalDateString(currentIterDate);
              newLectures.push({
                  id: Date.now().toString() + Math.random().toString(),
                  courseId: item.courseId,
                  title: `Missed ${item.type} (${dateStr})`,
                  date: dateStr,
                  content: `Automatically generated backlog.`,
                  isBacklog: true,
                  completed: false
              });
          }
          currentIterDate.setDate(currentIterDate.getDate() + 7);
      }
      return newLectures;
  };

  const getStyleForClass = (item: ScheduleItem) => {
    const [startH, startM] = item.startTime.split(':').map(Number);
    const [endH, endM] = item.endTime.split(':').map(Number);
    const startVal = startH + startM / 60;
    const endVal = endH + endM / 60;
    const duration = endVal - startVal;
    return { top: `${(startVal - 8) * 60}px`, height: `${duration * 60}px` };
  };

  const getCourseColorStyle = (colorClass: string) => {
    const colorMap: Record<string, string> = {
      'bg-blue-500': 'bg-blue-50 border-blue-200 text-blue-900',
      'bg-emerald-500': 'bg-emerald-50 border-emerald-200 text-emerald-900',
      'bg-purple-500': 'bg-purple-50 border-purple-200 text-purple-900',
      'bg-rose-500': 'bg-rose-50 border-rose-200 text-rose-900',
      'bg-amber-500': 'bg-amber-50 border-amber-200 text-amber-900',
      'bg-indigo-500': 'bg-indigo-50 border-indigo-200 text-indigo-900',
    };
    return colorMap[colorClass] || 'bg-slate-50 border-slate-200 text-slate-900';
  };

  // Form Reset and Open Handlers
  const resetForm = () => {
      setFormCourseId(courses[0]?.id || '');
      setFormDay('0');
      setFormStart('09:00');
      setFormEnd('11:00');
      setFormType('Lecture');
      setFormLocation('');
      setEditingItemId(null);
  };

  const openAddModal = () => {
      resetForm();
      setIsModalOpen(true);
  };

  const openEditModal = (item: ScheduleItem) => {
      setEditingItemId(item.id);
      setFormCourseId(item.courseId);
      setFormDay(item.dayOfWeek.toString());
      setFormStart(item.startTime);
      setFormEnd(item.endTime);
      setFormType(item.type);
      setFormLocation(item.location || '');
      setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCourseId) return;
    if (editingItemId) {
        setSchedule(schedule.map(item => item.id === editingItemId ? {
            ...item,
            courseId: formCourseId,
            dayOfWeek: Number(formDay),
            startTime: formStart,
            endTime: formEnd,
            type: formType,
            location: formLocation
        } : item));
    } else {
        const newItem: ScheduleItem = {
            id: Date.now().toString(),
            courseId: formCourseId,
            dayOfWeek: Number(formDay),
            startTime: formStart,
            endTime: formEnd,
            type: formType,
            location: formLocation
        };
        setSchedule([...schedule, newItem]);
        const backlogItems = generateBacklogItems(newItem);
        if (backlogItems.length > 0) setLectures(prev => [...prev, ...backlogItems]);
    }
    setIsModalOpen(false);
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex h-full bg-white relative">
      <input type="file" ref={fileInputRef} onChange={e => {
          // Image upload placeholder logic
      }} accept="image/*" className="hidden" />
      
      <div className="flex-1 flex flex-col h-full min-w-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-20 gap-2">
            <div className="flex items-center gap-2 lg:gap-4 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))} className="p-1 hover:bg-white rounded-lg text-slate-500"><ChevronLeft className="w-5 h-5" /></button>
                <div onClick={() => setIsSettingsOpen(true)} className="text-center px-2 cursor-pointer hover:bg-white rounded-lg">
                    <div className="text-xs text-slate-400 font-medium">Week {getWeekNumber()}</div>
                    <div className="text-sm font-bold text-slate-700">{weekRangeString}</div>
                </div>
                <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))} className="p-1 hover:bg-white rounded-lg text-slate-500"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => setIsEditingMode(!isEditingMode)} className={`px-3 py-2 rounded-xl text-sm font-medium border ${isEditingMode ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-600 hover:bg-slate-50'}`}><Edit3 className="w-4 h-4 mr-2 inline" />{isEditingMode ? 'Done' : 'Edit'}</button>
                <button onClick={openAddModal} className="bg-slate-900 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-800"><Plus className="w-4 h-4 mr-2 inline" />Add</button>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
            <div className="flex min-w-[600px]">
                <div className="w-14 flex-shrink-0 bg-white border-r border-slate-100 sticky left-0 z-10">
                    <div className="h-10 border-b border-slate-100"></div>
                    {timeSlots.map(hour => <div key={hour} className="h-[60px] text-[10px] font-medium text-slate-400 text-center">{hour}:00</div>)}
                </div>
                <div className="flex-1 grid grid-cols-5 divide-x divide-slate-100">
                    {weekDays.map((day, idx) => (
                        <div key={idx} className="relative min-w-[100px]">
                            <div className="h-10 border-b border-slate-100 bg-slate-50/80 flex items-center justify-center sticky top-0 z-10">
                                <span className={`text-xs font-semibold ${getLocalDateString(day) === getLocalDateString(new Date()) ? 'text-indigo-600' : 'text-slate-600'}`}>{dayNames[idx]}</span>
                            </div>
                            <div className="relative h-[840px] mt-2">
                                {schedule.filter(s => s.dayOfWeek === idx).map(item => {
                                    const course = courses.find(c => c.id === item.courseId);
                                    if (!course) return null;
                                    const dateStr = getLocalDateString(day);
                                    const session = sessions.find(s => s.scheduleItemId === item.id && s.date === dateStr);
                                    const colorStyle = getCourseColorStyle(course.color);
                                    return (
                                        <div key={item.id} style={getStyleForClass(item)} className={`absolute inset-x-1 rounded-2xl border shadow-sm flex flex-col p-2 group overflow-hidden ${colorStyle} ${isEditingMode ? 'border-dashed cursor-default' : 'cursor-pointer'}`}>
                                            <div className="flex-1 min-h-0">
                                                <div className="font-bold text-sm leading-tight truncate">{course.title}</div>
                                                <div className="flex justify-between text-[10px] opacity-70"><span>{item.type}</span><span>{item.startTime}</span></div>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-center">
                                                {isEditingMode ? (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setSchedule(schedule.filter(s => s.id !== item.id))} className="text-rose-600 hover:bg-rose-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                                                        <button onClick={() => openEditModal(item)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Pencil className="w-4 h-4" /></button>
                                                    </div>
                                                ) : (
                                                    <button onClick={(e) => { e.stopPropagation(); onMarkAttendance(item, dateStr, session?.status === 'attended' ? 'missed' : 'attended'); }} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${session?.status === 'attended' ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-black/10 text-black/10'}`}><Check className="w-5 h-5" /></button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* Add/Edit Class Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <form onSubmit={handleSaveItem} className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">{editingItemId ? 'Edit Class' : 'Add to Schedule'}</h3>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Course</label>
                        <select 
                            value={formCourseId} 
                            onChange={e => setFormCourseId(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                        >
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Day</label>
                            <select 
                                value={formDay} 
                                onChange={e => setFormDay(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                            >
                                {dayNames.slice(0, 5).map((d, i) => <option key={i} value={i}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                            <select 
                                value={formType} 
                                onChange={e => setFormType(e.target.value as any)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                            >
                                <option>Lecture</option>
                                <option>Recitation</option>
                                <option>Lab</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start</label>
                            <input type="time" value={formStart} onChange={e => setFormStart(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">End</label>
                            <input type="time" value={formEnd} onChange={e => setFormEnd(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                        </div>
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Location (Optional)</label>
                        <input 
                            type="text" 
                            value={formLocation} 
                            onChange={e => setFormLocation(e.target.value)} 
                            placeholder="e.g. Room 301"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" 
                        />
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all">
                        {editingItemId ? 'Update Class' : 'Save Class'}
                    </button>
                </div>
             </form>
        </div>
      )}
    </div>
  );
};

export default Schedule;
