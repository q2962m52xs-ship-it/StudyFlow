
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
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setView] = useState<ViewState>({ type: 'dashboard' });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lectures, setLectures] = useState<LectureType[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [classSessions, setClassSessions] = useState<ClassSession[]>([]);

  useEffect(() => {
    const currentUser = storage.getCurrentUser();
    if (currentUser) handleLogin(currentUser);
    else setLoading(false);
  }, []);

  useEffect(() => {
    if (user) storage.saveUserData(user.uid, { tasks, courses, lectures, sessions, schedule, classSessions });
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

  const handleMarkAttendance = (scheduleItem: ScheduleItem, date: string, status: 'attended' | 'missed') => {
      const existingIndex = classSessions.findIndex(s => s.scheduleItemId === scheduleItem.id && s.date === date);
      if (existingIndex >= 0) {
          const updated = [...classSessions];
          updated[existingIndex] = { ...updated[existingIndex], status };
          setClassSessions(updated);
      } else {
          setClassSessions([...classSessions, { id: Date.now().toString(), courseId: scheduleItem.courseId, scheduleItemId: scheduleItem.id, date, status }]);
      }

      if (status === 'attended') {
          setLectures(prev => prev.filter(l => !(l.courseId === scheduleItem.courseId && l.date === date && l.isBacklog)));
      } else {
          const alreadyExists = lectures.some(l => l.courseId === scheduleItem.courseId && l.date === date && l.isBacklog);
          if (!alreadyExists) {
            setLectures(prev => [...prev, { id: Date.now().toString(), courseId: scheduleItem.courseId, title: `Missed ${scheduleItem.type} (${date})`, date, content: `Missed ${scheduleItem.type} on ${date}.`, isBacklog: true, completed: false }]);
          }
      }
  };

  const renderContent = () => {
    switch (currentView.type) {
      case 'dashboard': return <Dashboard courses={courses} schedule={schedule} sessions={classSessions} lectures={lectures} setLectures={setLectures} tasks={tasks} setTasks={setTasks} onMarkAttendance={(item, status) => handleMarkAttendance(item, new Date().toLocaleDateString('en-CA'), status)} setView={setView} />;
      case 'schedule': return <Schedule courses={courses} setCourses={setCourses} schedule={schedule} setSchedule={setSchedule} sessions={classSessions} onMarkAttendance={handleMarkAttendance} lectures={lectures} setLectures={setLectures} />;
      case 'focus': return <Timer onSessionComplete={(m) => setSessions([...sessions, { date: new Date().toISOString(), durationMinutes: m, category: 'Focus' }])} />;
      case 'tasks': return <Tasks tasks={tasks} setTasks={setTasks} setView={setView} courses={courses} />;
      case 'task_detail': {
        const task = tasks.find(t => t.id === currentView.taskId);
        if (!task) return null;
        return <TaskDetail task={task} course={courses.find(c => c.id === task.courseId)} onUpdate={t => setTasks(tasks.map(x => x.id === t.id ? t : x))} onBack={() => setView({ type: 'tasks' })} />;
      }
      case 'courses':
      case 'course_detail': return <Courses courses={courses} lectures={lectures} setCourses={setCourses} setLectures={setLectures} tasks={tasks} setTasks={setTasks} currentView={currentView} setView={setView} />;
      default: return null;
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-primary-600" /></div>;
  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="hidden md:flex flex-col border-r border-slate-200"><Sidebar currentView={currentView} setView={setView} /></div>
      <main className="flex-1 relative flex flex-col h-full overflow-hidden">{renderContent()}<MobileNav currentView={currentView} setView={setView} /></main>
    </div>
  );
};

export default App;
