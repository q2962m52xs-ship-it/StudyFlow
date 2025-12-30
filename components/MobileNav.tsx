import React from 'react';
import { CheckSquare, BrainCircuit, Layout, Calendar, Book } from 'lucide-react';
import { ViewState } from '../types';

interface MobileNavProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ currentView, setView }) => {
  const activeId = currentView.type === 'course_detail' || currentView.type === 'lecture' ? 'courses' : 
                   currentView.type === 'task_detail' ? 'tasks' : currentView.type;

  const menuItems = [
    { id: 'dashboard', label: 'Today', icon: Layout },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'courses', label: 'Courses', icon: Book },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'planner', label: 'AI', icon: BrainCircuit },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 pb-safe">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setView({ type: item.id as any })}
            className={`flex flex-col items-center space-y-1 ${
              isActive ? 'text-primary-600' : 'text-slate-400'
            }`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MobileNav;