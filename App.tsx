import React, { useState } from 'react';
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

const App: React.FC = () => {
  const [currentView, setView] = useState<ViewState>({ type: 'dashboard' });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lectures, setLectures] = useState<LectureType[]>([]);
  
  // New State for Schedule and Attendance
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [classSessions, setClassSessions] = useState<ClassSession[]>([]);

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
      // Check if session already exists for this date/item
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
          // Create new
          const newSession: ClassSession = {
              id: Date.now().toString(),
              courseId: scheduleItem.courseId,
              scheduleItemId: scheduleItem.id,
              date: date,
              status: status
          };
          setClassSessions([...classSessions, newSession]);

          // If missed, add to backlog lecture
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
        return <Tasks tasks={tasks} setTasks={setTasks} setView={setView} />;
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

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      <Sidebar currentView={currentView} setView={setView} />
      
      <main className="flex-1 relative flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
           <span className="text-lg font-bold text-slate-800">Study Flow</span>
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