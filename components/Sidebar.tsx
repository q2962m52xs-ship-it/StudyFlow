import React from 'react';
import { CheckSquare, BrainCircuit, BarChart2, Clock, Book, Calendar, Layout } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Today', icon: Layout },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'courses', label: 'Courses', icon: Book },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'focus', label: 'Focus Timer', icon: Clock },
    { id: 'planner', label: 'AI Planner', icon: BrainCircuit },
    { id: 'stats', label: 'Analytics', icon: BarChart2 },
  ];

  const activeId = currentView.type === 'course_detail' || currentView.type === 'lecture' ? 'courses' : 
                   currentView.type === 'task_detail' ? 'tasks' : currentView.type;

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
      <div className="p-6 flex items-center space-x-2 border-b border-slate-100">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <BrainCircuit className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-bold text-slate-800">Study Flow</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView({ type: item.id as any })}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-primary-50 text-primary-700 font-medium shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-4 text-white">
          <p className="text-sm font-medium opacity-90 mb-1">Stay consistent!</p>
          <p className="text-xs opacity-75">Mark your attendance daily to keep your backlog clean.</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;