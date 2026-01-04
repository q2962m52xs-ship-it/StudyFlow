import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Timer from './components/Timer';
import Tasks from './components/Tasks';
import Planner from './components/Planner';
import Stats from './components/Stats';
import Courses from './components/Courses';
import Lecture from './components/Lecture';
import TaskDetail from './components/TaskDetail';
import Dashboard from './components/Dashboard';
import Schedule from './components/Schedule';
import { Task, StudySession, Course, Lecture as LectureType, ViewState, ScheduleItem, ClassSession } from './types';
import { LogOut, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // App Data State
  const [currentView, setView] = useState<ViewState>({ type: 'dashboard' });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lectures, setLectures] = useState<LectureType[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [classSessions, setClassSessions] = useState<ClassSession[]>([]);

  // 1. Initial Load - Check for active session
  useEffect(() => {
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      handleLogin(currentUser);
    } else {
      setLoading(false);
    }
  }, []);

  // 2. Data Persistence - Auto save when state changes
  useEffect(() => {
    if (user) {
        storage.saveUserData(user.uid, {
            tasks,
            courses,
            lectures,
            sessions,
            schedule,
            classSessions
        });
    }
  }, [tasks, courses, lectures, sessions, schedule, classSessions, user]);

  const handleLogin = (userData: any) => {
      setUser(userData);
      const data = storage.getUserData(userData.uid);
      setTasks(data.tasks);
      setCourses(data.courses);
      setLectures(data.lectures);
      setSessions(data.sessions);
      setSchedule(data.schedule);
      setClassSessions(data.classSessions);
      setLoading(false);
  };

  const handleLogout = () => {
      storage.logout();
      setUser(null);
      // Reset state
      setTasks([]);
      setCourses([]);
      setLectures([]);
      setSchedule([]);
      setSessions([]);
      setClassSessions([]);
  };

  const handleSessionComplete = (minutes: number) => {
    const newSession: StudySession = {
        date: new Date().toISOString(),
        durationMinutes: minutes,
        category: 'Focus'
    };
    setSessions([...sessions, newSession]);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleLectureUpdate = (updatedLecture: LectureType) => {
    setLectures(lectures.map(l => l.id === updatedLecture.id ? updatedLecture : l));
  };

  const handleAddTasks = (newTasks: Task[]) => {
      setTasks(prev => [...prev, ...newTasks]);
  };

  const handleMarkAttendance = (scheduleItem: ScheduleItem, date: string, status: 'attended' | 'missed') => {
      const existingIndex = classSessions.findIndex(s => s.scheduleItemId === scheduleItem.id && s.date === date);
      
      if (existingIndex >= 0) {
          if (classSessions[existingIndex].status === status) {
             setClassSessions(classSessions.filter((_, i) => i !== existingIndex));
             return;
          }
           
          const updated = [...classSessions];
          updated[existingIndex] = { ...updated[existingIndex], status };
          setClassSessions(updated);
      } else {
          const newSession: ClassSession = {
              id: Date.now().toString(),
              courseId: scheduleItem.courseId,
              scheduleItemId: scheduleItem.id,
              date: date,
              status: status
          };
          setClassSessions([...classSessions, newSession]);

          if (status === 'missed') {
              const backlogLecture: LectureType = {
                  id: Date.now().toString(),
                  courseId: scheduleItem.courseId,
                  title: `Missed ${scheduleItem.type} (${date})`,
                  date: date,
                  content: `Missed ${scheduleItem.type} on ${date}. Needs review.`,
                  isBacklog: true,
                  completed: false
              };
              setLectures(prev => [...prev, backlogLecture]);
          }
      }
  };

  const renderContent = () => {
    switch (currentView.type) {
      case 'dashboard':
        return <Dashboard 
            courses={courses} 
            schedule={schedule} 
            sessions={classSessions} 
            lectures={lectures}
            setLectures={setLectures}
            tasks={tasks}
            setTasks={setTasks}
            onMarkAttendance={(item, status) => handleMarkAttendance(item, new Date().toISOString().split('T')[0], status)} 
            setView={setView} 
        />;
      case 'schedule':
        return <Schedule 
            courses={courses} 
            schedule={schedule} 
            setSchedule={setSchedule} 
            sessions={classSessions}
            onMarkAttendance={handleMarkAttendance}
            lectures={lectures}
            setLectures={setLectures}
        />;
      case 'focus':
        return <Timer onSessionComplete={handleSessionComplete} />;
      case 'tasks':
        return <Tasks tasks={tasks} setTasks={setTasks} setView={setView} courses={courses} />;
      case 'task_detail': {
        const task = tasks.find(t => t.id === currentView.taskId);
        if (!task) return <div>Task not found</div>;
        const course = courses.find(c => c.id === task.courseId);
        return <TaskDetail task={task} course={course} onUpdate={handleTaskUpdate} onBack={() => setView({ type: 'tasks' })} />;
      }
      case 'planner':
        return <Planner />;
      case 'stats':
        return <Stats sessions={sessions} />;
      case 'courses':
      case 'course_detail':
        return <Courses 
            courses={courses} 
            lectures={lectures} 
            setCourses={setCourses} 
            setLectures={setLectures}
            tasks={tasks}
            setTasks={setTasks}
            currentView={currentView}
            setView={setView} 
        />;
      case 'lecture': {
        const lecture = lectures.find(l => l.id === currentView.lectureId);
        const course = courses.find(c => c.id === currentView.courseId);
        if (!lecture || !course) return <div>Lecture not found</div>;
        return <Lecture 
            lecture={lecture} 
            course={course} 
            onUpdate={handleLectureUpdate} 
            onAddTasks={handleAddTasks}
            onBack={() => setView({ type: 'course_detail', courseId: course.id })} 
        />;
      }
      default:
        return <Dashboard 
            courses={courses} 
            schedule={schedule} 
            sessions={classSessions} 
            lectures={lectures}
            setLectures={setLectures}
            tasks={tasks}
            setTasks={setTasks}
            onMarkAttendance={(item, status) => handleMarkAttendance(item, new Date().toISOString().split('T')[0], status)} 
            setView={setView} 
        />;
    }
  };

  if (loading) {
      return (
          <div className="h-screen flex items-center justify-center bg-slate-50">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
          </div>
      );
  }

  if (!user) {
      return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="hidden md:flex flex-col border-r border-slate-200">
          <Sidebar currentView={currentView} setView={setView} />
          <div className="p-4 bg-white border-t border-slate-100">
             <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-700 truncate">{user.displayName}</p>
                    <p className="text-xs text-slate-500">Free Plan</p>
                </div>
             </div>
             <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-slate-500 hover:text-rose-600 transition-colors w-full px-4 py-2 rounded-lg hover:bg-rose-50 font-medium text-sm"
             >
                 <LogOut className="w-4 h-4" /> Sign Out
             </button>
          </div>
      </div>
      
      <main className="flex-1 relative flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
           <span className="text-lg font-bold text-slate-800">Study Flow</span>
           <button onClick={handleLogout} className="text-slate-400">
               <LogOut className="w-5 h-5" />
           </button>
        </div>

        <div className="flex-1 overflow-hidden">
            {renderContent()}
        </div>

        <MobileNav currentView={currentView} setView={setView} />
      </main>
    </div>
  );
};

export default App;