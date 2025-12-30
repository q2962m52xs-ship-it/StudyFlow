import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Circle, Tag, Sparkles, Loader2, Calendar } from 'lucide-react';
import { Task, Course } from '../types';
import { getTaskAdvice } from '../services/geminiService';

interface TaskDetailProps {
  task: Task;
  course?: Course;
  onUpdate: (task: Task) => void;
  onBack: () => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ task, course, onUpdate, onBack }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const toggleComplete = () => {
    onUpdate({ ...task, completed: !task.completed });
  };

  const handleGetAdvice = async () => {
    setLoadingAdvice(true);
    const result = await getTaskAdvice(task.title, task.description);
    setAdvice(result);
    setLoadingAdvice(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto h-full overflow-y-auto no-scrollbar pb-24 md:pb-6 animate-fade-in">
        <button 
            onClick={onBack}
            className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Tasks
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
                 <div className="flex-1">
                     <div className="flex items-center gap-3 mb-2">
                        {course && (
                            <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${course.color}`}>
                                {course.title}
                            </span>
                        )}
                        {!course && (
                             <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">
                                {task.category}
                             </span>
                        )}
                        {task.dueDate && (
                             <span className="flex items-center gap-1 text-slate-400 text-xs">
                                <Calendar className="w-3 h-3" /> {task.dueDate}
                             </span>
                        )}
                     </div>
                     <h1 className={`text-2xl font-bold transition-all ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                         {task.title}
                     </h1>
                 </div>
                 <button 
                    onClick={toggleComplete}
                    className={`transform transition-all active:scale-90 ${task.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-primary-500'}`}
                 >
                     {task.completed ? <CheckCircle className="w-10 h-10" /> : <Circle className="w-10 h-10" />}
                 </button>
            </div>

            <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Description</h3>
                <textarea 
                    value={task.description || ''}
                    onChange={(e) => onUpdate({...task, description: e.target.value})}
                    placeholder="Add details about this task..."
                    className="w-full min-h-[100px] p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary-300 outline-none text-slate-700 resize-y"
                />
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" /> AI Assistant
                    </h3>
                    {!advice && (
                        <button 
                            onClick={handleGetAdvice}
                            disabled={loadingAdvice}
                            className="text-sm bg-white text-indigo-600 px-3 py-1.5 rounded-lg font-medium shadow-sm hover:bg-indigo-50 transition-colors disabled:opacity-50"
                        >
                            {loadingAdvice ? <Loader2 className="w-4 h-4 animate-spin" /> : "How do I start?"}
                        </button>
                    )}
                </div>
                
                {loadingAdvice && (
                    <div className="text-indigo-400 text-sm animate-pulse">Thinking...</div>
                )}
                
                {advice && (
                    <div className="text-indigo-800 text-sm leading-relaxed prose prose-indigo">
                        {advice}
                    </div>
                )}

                {!advice && !loadingAdvice && (
                    <p className="text-indigo-400 text-sm">Stuck? Ask for a breakdown or advice on how to tackle this.</p>
                )}
            </div>
        </div>
    </div>
  );
};

export default TaskDetail;