import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Calendar, Settings, Video, CheckCircle2, Filter, Upload, Loader2, Camera } from 'lucide-react';
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
  const [isAdding, setIsAdding] = useState(false);
  
  // Semester Settings State
  const [semesterStart, setSemesterStart] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    return d.toISOString().split('T')[0];
  });
  const [semesterEnd, setSemesterEnd] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Watch Queue Filters
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  // Adding state
  const [newCourseId, setNewCourseId] = useState(courses[0]?.id || '');
  const [newDay, setNewDay] = useState(0);
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('11:00');
  const [newType, setNewType] = useState<'Lecture' | 'Recitation' | 'Lab'>('Lecture');
  const [newLocation, setNewLocation] = useState('');

  // Image Scan State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Calculate Week Number
  const getWeekNumber = () => {
      if (!semesterStart) return 1;
      const start = new Date(semesterStart);
      const now = new Date(currentDate); 
      
      const diffTime = Math.abs(now.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      const weekNum = Math.floor(diffDays / 7) + 1;
      return weekNum > 0 ? weekNum : 1;
  };

  // Generate week days (Sunday to Thursday = 5 days)
  const startOfWeek = new Date(currentDate);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek); // Go to Sunday

  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const weekRangeString = `${weekDays[0].getDate().toString().padStart(2, '0')}/${(weekDays[0].getMonth() + 1).toString().padStart(2, '0')} - ${weekDays[4].getDate().toString().padStart(2, '0')}/${(weekDays[4].getMonth() + 1).toString().padStart(2, '0')}`;

  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00 to 21:00

  // Filter Backlog for Right Sidebar
  const backlog = lectures.filter(l => l.isBacklog && !l.completed);
  
  const filteredBacklog = backlog.filter(item => {
      // Type Filter (match "Lecture" or "Recitation" in title)
      let typeMatch = true;
      if (selectedTypes.length > 0) {
          typeMatch = selectedTypes.some(type => item.title.toLowerCase().includes(type.toLowerCase()));
      }

      // Course Filter
      let courseMatch = true;
      if (selectedCourses.length > 0) {
          courseMatch = selectedCourses.includes(item.courseId);
      }

      return typeMatch && courseMatch;
  });

  const getStyleForClass = (item: ScheduleItem) => {
    const [startH, startM] = item.startTime.split(':').map(Number);
    const [endH, endM] = item.endTime.split(':').map(Number);
    
    const startVal = startH + startM / 60;
    const endVal = endH + endM / 60;
    const duration = endVal - startVal;
    
    const top = (startVal - 8) * 60; 
    const height = duration * 60;

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

  const getRandomColor = () => {
    const colors = [
        'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 
        'bg-rose-500', 'bg-amber-500', 'bg-indigo-500', 
        'bg-cyan-500', 'bg-teal-500'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseId) return;
    const newItem: ScheduleItem = {
      id: Date.now().toString(),
      courseId: newCourseId,
      dayOfWeek: Number(newDay),
      startTime: newStart,
      endTime: newEnd,
      type: newType,
      location: newLocation
    };
    setSchedule([...schedule, newItem]);
    setIsAdding(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        setIsScanning(true);
        
        reader.onloadend = async () => {
            try {
                const base64String = reader.result?.toString().split(',')[1];
                if (base64String) {
                    const extractedClasses = await parseScheduleImage(base64String, file.type);
                    
                    if (extractedClasses && extractedClasses.length > 0) {
                        // Logic to merge into schedule AND create missing courses
                        const existingCoursesMap = new Map<string, Course>();
                        courses.forEach(c => existingCoursesMap.set(c.title.toLowerCase(), c));
                        
                        const coursesToAdd: Course[] = [];
                        
                        const newScheduleItems = extractedClasses.map((cls: any) => {
                            const lowerTitle = cls.courseTitle.toLowerCase();
                            let courseId = '';

                            if (existingCoursesMap.has(lowerTitle)) {
                                courseId = existingCoursesMap.get(lowerTitle)!.id;
                            } else {
                                // Check if we already queued it in this batch
                                const queued = coursesToAdd.find(c => c.title.toLowerCase() === lowerTitle);
                                if (queued) {
                                    courseId = queued.id;
                                } else {
                                    // Create new course
                                    const newCourse: Course = {
                                        id: Date.now().toString() + Math.random().toString(),
                                        title: cls.courseTitle,
                                        color: getRandomColor(),
                                        staff: [],
                                        resources: []
                                    };
                                    coursesToAdd.push(newCourse);
                                    courseId = newCourse.id;
                                }
                            }

                            return {
                                id: Date.now().toString() + Math.random(),
                                courseId: courseId,
                                dayOfWeek: cls.dayOfWeek,
                                startTime: cls.startTime,
                                endTime: cls.endTime,
                                type: cls.type,
                                location: cls.location
                            } as ScheduleItem;
                        });

                        // Batch updates
                        if (coursesToAdd.length > 0) {
                            setCourses(prev => [...prev, ...coursesToAdd]);
                        }
                        setSchedule(prev => [...prev, ...newScheduleItems]);
                        
                        const msg = coursesToAdd.length > 0 
                            ? `Success! Added ${coursesToAdd.length} new courses and ${newScheduleItems.length} classes to your schedule.`
                            : `Success! Added ${newScheduleItems.length} classes to your existing courses.`;
                        alert(msg);

                    } else {
                        alert("No classes found in the image. Please ensure the image is clear.");
                    }
                }
            } catch (error) {
                console.error(error);
                alert("Failed to analyze schedule. Please try again.");
            } finally {
                setIsScanning(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const toggleBacklogItem = (id: string) => {
      setLectures(lectures.map(l => l.id === id ? { ...l, completed: !l.completed } : l));
  };

  const toggleTypeFilter = (type: string) => {
      setSelectedTypes(prev => 
          prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
      );
  };

  const toggleCourseFilter = (courseId: string) => {
      setSelectedCourses(prev => 
          prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
      );
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex h-full bg-white relative">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*"
        capture="environment"
        className="hidden" 
      />
      
      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-20">
            <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <button onClick={() => changeWeek('prev')} className="p-1 hover:bg-white rounded-lg transition-colors shadow-sm text-slate-500">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div 
                    onClick={() => setIsSettingsOpen(true)}
                    className="text-center px-2 cursor-pointer hover:bg-white rounded-lg transition-colors"
                >
                    <div className="text-xs text-slate-400 font-medium">Week {getWeekNumber()}</div>
                    <div className="text-sm font-bold text-slate-700">{weekRangeString}</div>
                </div>
                <button onClick={() => changeWeek('next')} className="p-1 hover:bg-white rounded-lg transition-colors shadow-sm text-slate-500">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
            
            <h1 className="text-2xl font-bold text-slate-800">Schedule</h1>

            <div className="flex items-center gap-2">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-100 shadow-sm transition-colors"
                >
                    {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    <span className="hidden sm:inline">Scan Schedule</span>
                </button>

                <button 
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Add Class
                </button>
            </div>
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto relative no-scrollbar">
            <div className="flex min-w-[600px]">
                {/* Time Column */}
                <div className="w-16 flex-shrink-0 bg-white border-r border-slate-100 sticky left-0 z-10">
                    <div className="h-10 border-b border-slate-100"></div> {/* Header spacer */}
                    {timeSlots.map(hour => (
                        <div key={hour} className="h-[60px] text-xs text-slate-400 text-center -mt-2.5">
                            {hour.toString().padStart(2, '0')}:00
                        </div>
                    ))}
                </div>

                {/* Days Columns (Sun-Thu) */}
                <div className="flex-1 grid grid-cols-5 divide-x divide-slate-100">
                    {weekDays.map((day, index) => (
                        <div key={index} className="relative min-w-[100px]">
                            {/* Day Header */}
                            <div className="h-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-center sticky top-0 z-10">
                                <span className={`text-sm font-medium ${
                                    day.toDateString() === new Date().toDateString() ? 'text-primary-600 font-bold' : 'text-slate-600'
                                }`}>
                                    {dayNames[index]} {day.getDate()}
                                </span>
                            </div>

                            {/* Grid Lines */}
                            <div className="absolute inset-0 top-10 pointer-events-none">
                                {timeSlots.map(hour => (
                                    <div key={hour} className="h-[60px] border-b border-slate-50"></div>
                                ))}
                            </div>

                            {/* Events */}
                            <div className="relative h-[840px] mt-2">
                                {schedule
                                    .filter(item => item.dayOfWeek === index)
                                    .map(item => {
                                        const course = courses.find(c => c.id === item.courseId);
                                        if (!course) return null;
                                        
                                        const dateStr = day.toISOString().split('T')[0];
                                        const session = sessions.find(s => s.scheduleItemId === item.id && s.date === dateStr);
                                        const isChecked = session?.status === 'attended';
                                        const colorStyle = getCourseColorStyle(course.color);

                                        return (
                                            <div
                                                key={item.id}
                                                style={getStyleForClass(item)}
                                                className={`absolute inset-x-1 rounded-xl p-2 border shadow-sm transition-all hover:shadow-md flex flex-col justify-between group overflow-hidden ${colorStyle}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="text-xs font-bold leading-tight">{course.title}</div>
                                                        <div className="text-[10px] opacity-80">{item.type}</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex justify-between items-end mt-1">
                                                    <div className="text-[10px] font-mono opacity-70">
                                                        {item.startTime}-{item.endTime}
                                                    </div>
                                                    <button 
                                                        onClick={() => onMarkAttendance(item, dateStr, isChecked ? 'missed' : 'attended')}
                                                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors bg-white/50 hover:bg-white ${isChecked ? 'border-emerald-500 text-emerald-600' : 'border-slate-300 text-transparent'}`}
                                                        title="Mark Attendance"
                                                    >
                                                        {isChecked && (
                                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                            </svg>
                                                        )}
                                                    </button>
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

      {/* Right Sidebar: Watch Queue */}
      <div className="w-80 border-l border-slate-200 bg-white flex flex-col h-full shadow-xl shadow-slate-200/50 z-30 hidden lg:flex">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Video className="w-5 h-5 text-rose-500" />
                    Watch Queue
                </h3>
                <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {filteredBacklog.length}
                </span>
            </div>
            
            {/* Filter Section */}
            <div className="space-y-3">
                <div className="flex gap-2">
                    {['Lecture', 'Recitation'].map(type => (
                        <button
                            key={type}
                            onClick={() => toggleTypeFilter(type)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                selectedTypes.includes(type)
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
                
                {courses.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                         {courses.map(course => (
                             <button
                                key={course.id}
                                onClick={() => toggleCourseFilter(course.id)}
                                className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                                    selectedCourses.includes(course.id)
                                    ? `${course.color} text-white border-transparent`
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                }`}
                             >
                                 {course.title}
                             </button>
                         ))}
                    </div>
                )}
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredBacklog.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                    <p className="text-sm">
                        {backlog.length === 0 ? "You're all caught up!" : "No matches found."}
                    </p>
                </div>
            ) : (
                filteredBacklog.map(item => {
                    const course = courses.find(c => c.id === item.courseId);
                    return (
                        <div key={item.id} className="p-3 rounded-xl border border-rose-100 bg-white shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${course?.color || 'bg-slate-500'}`}>
                                        {course?.title}
                                    </span>
                                    <h4 className="font-bold text-slate-800 text-sm mt-1">{item.title}</h4>
                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                        <Calendar className="w-3 h-3" /> {item.date}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => toggleBacklogItem(item.id)}
                                className="w-full mt-2 flex items-center justify-center gap-2 text-xs font-medium py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
                            >
                                <CheckCircle2 className="w-3 h-3" /> Mark Watched
                            </button>
                        </div>
                    );
                })
            )}
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Settings className="w-5 h-5" /> Semester Settings
                    </h3>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Semester Start Date</label>
                        <input 
                            type="date" 
                            value={semesterStart} 
                            onChange={e => setSemesterStart(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                        <p className="text-xs text-slate-500 mt-1">Used to calculate week numbers.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Semester End Date (Optional)</label>
                        <input 
                            type="date" 
                            value={semesterEnd} 
                            onChange={e => setSemesterEnd(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                    </div>
                </div>

                <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="w-full mt-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800"
                >
                    Save Changes
                </button>
            </div>
        </div>
      )}

      {/* Add Class Modal Overlay */}
      {isAdding && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <form onSubmit={handleAddItem} className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Add to Schedule</h3>
                    <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Course</label>
                        <select 
                            value={newCourseId} 
                            onChange={e => setNewCourseId(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                        >
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Day</label>
                            <select 
                                value={newDay} 
                                onChange={e => setNewDay(Number(e.target.value))}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                            >
                                {dayNames.slice(0, 5).map((d, i) => <option key={i} value={i}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                            <select 
                                value={newType} 
                                onChange={e => setNewType(e.target.value as any)}
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
                            <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">End</label>
                            <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all">Save Class</button>
                </div>
             </form>
        </div>
      )}
    </div>
  );
};

export default Schedule;