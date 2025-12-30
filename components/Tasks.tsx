import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, Circle, Tag, Calendar, ArrowRight } from 'lucide-react';
import { Task, ViewState } from '../types';

interface TasksProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setView: (view: ViewState) => void;
}

const Tasks: React.FC<TasksProps> = ({ tasks, setTasks, setView }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('General');

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      completed: false,
      category: newTaskCategory,
      dueDate: new Date().toISOString().split('T')[0]
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
  };

  const toggleTask = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto h-full overflow-y-auto no-scrollbar pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Tasks</h2>
          <p className="text-slate-500">Stay organized and productive.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600">
            {tasks.filter(t => t.completed).length} / {tasks.length} Completed
        </div>
      </div>

      <form onSubmit={addTask} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex gap-3">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400"
        />
        <select 
            value={newTaskCategory}
            onChange={(e) => setNewTaskCategory(e.target.value)}
            className="bg-slate-50 text-slate-600 text-sm rounded-lg px-3 outline-none border-none cursor-pointer hidden sm:block"
        >
            <option>General</option>
            <option>Math</option>
            <option>Science</option>
            <option>History</option>
            <option>Coding</option>
        </select>
        <button
          type="submit"
          className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      <div className="space-y-3">
        {tasks.length === 0 && (
            <div className="text-center py-12 text-slate-400">
                <p>No tasks yet. Add one above!</p>
            </div>
        )}
        {tasks.map(task => (
          <div
            key={task.id}
            onClick={() => setView({ type: 'task_detail', taskId: task.id })}
            className={`group bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 cursor-pointer ${
              task.completed ? 'opacity-60 bg-slate-50' : ''
            }`}
          >
            <button
              onClick={(e) => toggleTask(e, task.id)}
              className={`flex-shrink-0 transition-colors ${
                task.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-primary-500'
              }`}
            >
              {task.completed ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
            </button>
            
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${task.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                {task.title}
              </p>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" /> {task.category}
                </span>
                {task.dueDate && (
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {task.dueDate}
                    </span>
                )}
              </div>
            </div>

            <button
              onClick={(e) => deleteTask(e, task.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity p-2"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            
            <ArrowRight className="w-5 h-5 text-slate-200 group-hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tasks;