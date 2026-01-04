import React, { useState } from 'react';
import { Plus, Book, ChevronRight, FileText, Calendar, ArrowLeft, Users, Paperclip, AlertCircle, Link as LinkIcon, Trash2, CheckCircle2, Video, CheckSquare, Circle, CheckCircle, StickyNote, Palette } from 'lucide-react';
import { Course, Lecture, ViewState, CourseStaff, CourseResource, Task } from '../types';

interface CoursesProps {
  courses: Course[];
  lectures: Lecture[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  setLectures: React.Dispatch<React.SetStateAction<Lecture[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Courses: React.FC<CoursesProps> = ({ courses, lectures, setCourses, setLectures, tasks, setTasks, currentView, setView }) => {
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [activeTab, setActiveTab] = useState<'backlog' | 'info' | 'resources' | 'tasks'>('backlog');

  // Backlog Filters
  const [filterType, setFilterType] = useState<'All' | 'Lecture' | 'Recitation'>('All');

  // Staff state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Lecturer' | 'TA' | 'Other'>('Lecturer');
  const [newStaffEmail, setNewStaffEmail] = useState('');

  // Resource state
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceType, setNewResourceType] = useState<'link' | 'file' | 'note'>('link');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceContent, setNewResourceContent] = useState('');

  // Course Task state
  const [newCourseTaskTitle, setNewCourseTaskTitle] = useState('');

  // Color Palette
  const availableColors = [
      'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 
      'bg-rose-500', 'bg-amber-500', 'bg-indigo-500', 
      'bg-cyan-500', 'bg-teal-500'
  ];

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;
    const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
    
    const newCourse: Course = {
      id: Date.now().toString(),
      title: newCourseTitle,
      color: randomColor,
      staff: [],
      resources: []
    };
    setCourses([...courses, newCourse]);
    setNewCourseTitle('');
    setIsAddingCourse(false);
  };

  const handleAddLecture = (courseId: string) => {
    const newLecture: Lecture = {
      id: Date.now().toString(),
      courseId,
      title: `Lecture ${lectures.filter(l => l.courseId === courseId).length + 1}`,
      date: new Date().toISOString().split('T')[0],
      content: '',
      isBacklog: false,
      completed: false
    };
    setLectures([...lectures, newLecture]);
    setView({ type: 'lecture', lectureId: newLecture.id, courseId });
  };

  const handleAddCourseTask = (courseId: string, courseTitle: string) => {
    if (!newCourseTaskTitle.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: newCourseTaskTitle,
      status: 'Not Started',
      priority: 'Medium',
      category: courseTitle,
      courseId: courseId,
      dueDate: new Date().toISOString().split('T')[0],
      subtasks: []
    };
    setTasks([...tasks, newTask]);
    setNewCourseTaskTitle('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'Done' ? 'Not Started' : 'Done' } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const updateCourse = (updatedCourse: Course) => {
      setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
  };

  const updateCourseColor = (course: Course, color: string) => {
      updateCourse({ ...course, color });
  };

  const addStaff = (course: Course) => {
      if(!newStaffName) return;
      const staff: CourseStaff = { id: Date.now().toString(), name: newStaffName, role: newStaffRole, email: newStaffEmail };
      updateCourse({ ...course, staff: [...course.staff, staff] });
      setNewStaffName(''); setNewStaffEmail('');
  };

  const addResource = (course: Course) => {
      if (!newResourceTitle) return;
      
      // Validation based on type
      if (newResourceType !== 'note' && !newResourceUrl) return;
      if (newResourceType === 'note' && !newResourceContent) return;

      const res: CourseResource = { 
          id: Date.now().toString(), 
          title: newResourceTitle, 
          type: newResourceType, 
          url: newResourceType === 'note' ? undefined : newResourceUrl,
          content: newResourceType === 'note' ? newResourceContent : undefined
      };

      updateCourse({ ...course, resources: [...course.resources, res] });
      setNewResourceTitle(''); 
      setNewResourceUrl('');
      setNewResourceContent('');
  };

  const deleteResource = (course: Course, id: string) => {
      updateCourse({ ...course, resources: course.resources.filter(r => r.id !== id) });
  };

  const toggleLectureCompletion = (lectureId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setLectures(lectures.map(l => l.id === lectureId ? { ...l, completed: !l.completed } : l));
  };

  // Render Course Detail View
  if (currentView.type === 'course_detail') {
    const course = courses.find(c => c.id === currentView.courseId);
    if (!course) return <div>Course not found</div>;

    // Filter logic
    const courseLectures = lectures.filter(l => l.courseId === course.id);
    const backlog = courseLectures.filter(l => l.isBacklog && !l.completed);
    
    const filteredBacklog = backlog.filter(l => {
       if (filterType === 'All') return true;
       return l.title.toLowerCase().includes(filterType.toLowerCase()); 
    });

    const completedOrRegular = courseLectures.filter(l => !l.isBacklog || l.completed);
    const courseTasks = tasks.filter(t => t.courseId === course.id);

    const notes = course.resources.filter(r => r.type === 'note');
    const filesAndLinks = course.resources.filter(r => r.type !== 'note');

    return (
      <div className="p-6 max-w-5xl mx-auto h-full overflow-y-auto no-scrollbar pb-24 md:pb-6 flex flex-col">
        <div className="flex-shrink-0">
            <button 
            onClick={() => setView({ type: 'courses' })}
            className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors"
            >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Courses
            </button>

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${course.color} rounded-2xl flex items-center justify-center text-white shadow-md transition-colors`}>
                        <Book className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">{course.title}</h2>
                        <div className="flex items-center gap-4 text-slate-500 mt-1">
                            <span>{backlog.length} classes to catch up</span>
                            <span>•</span>
                            <span>{courseTasks.length} tasks</span>
                        </div>
                    </div>
                </div>

                {/* Color Picker */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                    <Palette className="w-4 h-4 text-slate-400 ml-1" />
                    <div className="flex gap-1">
                        {availableColors.map(color => (
                            <button
                                key={color}
                                onClick={() => updateCourseColor(course, color)}
                                className={`w-5 h-5 rounded-full ${color} transition-transform hover:scale-110 ${course.color === color ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('backlog')} className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'backlog' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                    Catch Up Queue
                </button>
                <button onClick={() => setActiveTab('tasks')} className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'tasks' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                    Tasks
                </button>
                <button onClick={() => setActiveTab('info')} className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'info' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                    Course Info
                </button>
                <button onClick={() => setActiveTab('resources')} className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'resources' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                    Resources & Notes
                </button>
            </div>
        </div>

        <div className="flex-1">
            {activeTab === 'backlog' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Header with Title and Filters */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                         <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                             <Video className="w-6 h-6 text-rose-500" /> Watch Queue
                         </h3>
                         
                         <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                             {['All', 'Lecture', 'Recitation'].map(type => (
                                 <button
                                    key={type}
                                    onClick={() => setFilterType(type as any)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                 >
                                     {type}
                                 </button>
                             ))}
                         </div>
                    </div>

                    {/* List */}
                    <div className="space-y-3">
                        {filteredBacklog.length === 0 ? (
                             <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-slate-400">All caught up! No lectures in queue.</p>
                             </div>
                        ) : (
                            filteredBacklog.map(lecture => (
                                <div 
                                    key={lecture.id}
                                    onClick={() => setView({ type: 'lecture', lectureId: lecture.id, courseId: course.id })}
                                    className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="flex flex-col">
                                        <div className="text-xs text-slate-500 font-medium mb-1">{lecture.date}</div>
                                        <div className="font-bold text-slate-800 text-lg">{lecture.title}</div>
                                        <div className="text-sm text-slate-400 mt-0.5">{course.title}</div>
                                    </div>
                                    
                                    <button 
                                        onClick={(e) => toggleLectureCompletion(lecture.id, e)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-slate-500 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-sm font-medium">Mark as Watched</span>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Completed / Regular Notes Section Divider */}
                    <div className="pt-8 border-t border-slate-100 mt-8">
                         <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800">My Notes</h3>
                            <button
                                onClick={() => handleAddLecture(course.id)}
                                className="flex items-center gap-2 text-sm bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Add Note
                            </button>
                        </div>
                         <div className="space-y-3">
                            {completedOrRegular.map(lecture => (
                                <div 
                                    key={lecture.id}
                                    onClick={() => setView({ type: 'lecture', lectureId: lecture.id, courseId: course.id })}
                                    className="bg-white p-4 rounded-xl border border-slate-100 hover:border-primary-200 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-800">{lecture.title}</h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                            <Calendar className="w-3 h-3" />
                                            {lecture.date}
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-400" />
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
            )}

            {activeTab === 'tasks' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <CheckSquare className="w-6 h-6 text-primary-500" /> Course Tasks
                        </h3>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex gap-3">
                        <input
                            type="text"
                            value={newCourseTaskTitle}
                            onChange={(e) => setNewCourseTaskTitle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddCourseTask(course.id, course.title)}
                            placeholder="Add a task for this course..."
                            className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400"
                        />
                        <button
                            onClick={() => handleAddCourseTask(course.id, course.title)}
                            className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {courseTasks.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <p>No specific tasks for this course yet.</p>
                            </div>
                        ) : (
                            courseTasks.map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => setView({ type: 'task_detail', taskId: task.id })}
                                    className={`group bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 cursor-pointer ${
                                    task.status === 'Done' ? 'opacity-60 bg-slate-50' : ''
                                    }`}
                                >
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                                        className={`flex-shrink-0 transition-colors ${
                                            task.status === 'Done' ? 'text-emerald-500' : 'text-slate-300 hover:text-primary-500'
                                        }`}
                                    >
                                        {task.status === 'Done' ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                    </button>
                                    
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium truncate ${task.status === 'Done' ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                                            {task.title}
                                        </p>
                                    </div>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity p-2"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                    
                                    <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'info' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-500" /> Course Staff
                        </h3>
                        <div className="space-y-4">
                            {course.staff.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div>
                                        <p className="font-bold text-slate-800">{member.name}</p>
                                        <p className="text-sm text-slate-500">{member.role} {member.email && `• ${member.email}`}</p>
                                    </div>
                                </div>
                            ))}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100 mt-2">
                                <input placeholder="Name" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} className="p-2 bg-slate-50 rounded-lg text-sm border border-slate-200" />
                                <select value={newStaffRole} onChange={e => setNewStaffRole(e.target.value as any)} className="p-2 bg-slate-50 rounded-lg text-sm border border-slate-200">
                                    <option>Lecturer</option>
                                    <option>TA</option>
                                    <option>Other</option>
                                </select>
                                <div className="flex gap-2">
                                    <input placeholder="Email (optional)" value={newStaffEmail} onChange={e => setNewStaffEmail(e.target.value)} className="p-2 bg-slate-50 rounded-lg text-sm border border-slate-200 w-full" />
                                    <button onClick={() => addStaff(course)} className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800"><Plus className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'resources' && (
                <div className="space-y-6 animate-fade-in">
                    
                    {/* Notes Section */}
                    {notes.length > 0 && (
                        <div>
                             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <StickyNote className="w-5 h-5 text-amber-500" /> Pinned Notes
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                {notes.map(note => (
                                    <div key={note.id} className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl shadow-sm relative group hover:-translate-y-1 transition-transform">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-amber-900">{note.title}</h4>
                                            <button 
                                                onClick={() => deleteResource(course, note.id)}
                                                className="text-amber-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-sm text-amber-800 whitespace-pre-wrap">{note.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Paperclip className="w-5 h-5 text-orange-500" /> Files & Links
                        </h3>
                         <div className="space-y-3 mb-6">
                            {filesAndLinks.map(res => (
                                <div key={res.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
                                    <a href={res.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 flex-1">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-slate-500">
                                            {res.type === 'link' ? <LinkIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                        </div>
                                        <span className="font-medium text-slate-700">{res.title}</span>
                                    </a>
                                    <button onClick={() => deleteResource(course, res.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-2">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {filesAndLinks.length === 0 && <p className="text-slate-400 text-sm">No files or links yet.</p>}
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl">
                            <h4 className="text-sm font-bold text-slate-700 mb-3">Add Resource</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div className="md:col-span-2 flex gap-3">
                                     <input 
                                        placeholder="Title (e.g. Midterm Cheat Sheet)" 
                                        value={newResourceTitle} 
                                        onChange={e => setNewResourceTitle(e.target.value)} 
                                        className="flex-1 p-2 bg-white rounded-lg text-sm border border-slate-200 outline-none focus:border-primary-400" 
                                    />
                                     <select 
                                        value={newResourceType} 
                                        onChange={e => setNewResourceType(e.target.value as any)} 
                                        className="p-2 bg-white rounded-lg text-sm border border-slate-200 outline-none focus:border-primary-400"
                                    >
                                        <option value="link">Link</option>
                                        <option value="file">File</option>
                                        <option value="note">Sticky Note</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                {newResourceType === 'note' ? (
                                    <textarea 
                                        placeholder="Write your note content here..."
                                        value={newResourceContent}
                                        onChange={e => setNewResourceContent(e.target.value)}
                                        className="p-2 bg-white rounded-lg text-sm border border-slate-200 w-full min-h-[80px] outline-none focus:border-primary-400"
                                    />
                                ) : (
                                    <input 
                                        placeholder="URL (https://...)" 
                                        value={newResourceUrl} 
                                        onChange={e => setNewResourceUrl(e.target.value)} 
                                        className="p-2 bg-white rounded-lg text-sm border border-slate-200 w-full outline-none focus:border-primary-400" 
                                    />
                                )}
                                <button 
                                    onClick={() => addResource(course)} 
                                    className="bg-primary-600 text-white px-4 rounded-lg hover:bg-primary-700 font-medium self-end"
                                    style={{ height: newResourceType === 'note' ? '80px' : '38px' }}
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    );
  }

  // Render Courses List View
  return (
    <div className="p-6 max-w-5xl mx-auto h-full overflow-y-auto no-scrollbar pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Courses</h2>
          <p className="text-slate-500">Manage your subjects and materials.</p>
        </div>
        <button
          onClick={() => setIsAddingCourse(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {isAddingCourse && (
        <form onSubmit={handleAddCourse} className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-3 animate-fade-in">
          <input
            autoFocus
            type="text"
            value={newCourseTitle}
            onChange={(e) => setNewCourseTitle(e.target.value)}
            placeholder="Course Name (e.g. Linear Algebra)"
            className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setIsAddingCourse(false)}
            className="text-slate-400 hover:text-slate-600 px-2"
          >
            Cancel
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => {
            const backlogCount = lectures.filter(l => l.courseId === course.id && l.isBacklog && !l.completed).length;
            
            return (
                <div 
                    key={course.id}
                    onClick={() => setView({ type: 'course_detail', courseId: course.id })}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                >
                    <div className={`absolute top-0 right-0 w-24 h-24 ${course.color} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`} />
                    
                    <div className={`w-12 h-12 ${course.color} rounded-xl flex items-center justify-center text-white mb-4 shadow-sm relative transition-colors`}>
                        <Book className="w-6 h-6" />
                        {backlogCount > 0 && (
                            <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                {backlogCount}
                            </div>
                        )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-800 mb-1">{course.title}</h3>
                    <p className="text-slate-500 text-sm mb-4">
                        {course.staff.length > 0 ? course.staff[0].name : 'No staff added'}
                    </p>
                    
                    <div className="flex items-center text-primary-600 text-sm font-medium group-hover:underline">
                        View Details <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                </div>
            )
        })}
        
        {courses.length === 0 && !isAddingCourse && (
            <div className="col-span-full text-center py-12 text-slate-400">
                No courses yet. Click + to add one.
            </div>
        )}
      </div>
    </div>
  );
};

export default Courses;