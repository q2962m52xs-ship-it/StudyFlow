import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Sparkles, List, Loader2, Calendar, Clock } from 'lucide-react';
import { Lecture as LectureType, Course, Task } from '../types';
import { analyzeLectureNotes } from '../services/geminiService';

interface LectureProps {
  lecture: LectureType;
  course: Course;
  onUpdate: (updatedLecture: LectureType) => void;
  onAddTasks: (tasks: Task[]) => void;
  onBack: () => void;
}

const Lecture: React.FC<LectureProps> = ({ lecture, course, onUpdate, onAddTasks, onBack }) => {
  const [content, setContent] = useState(lecture.content);
  const [title, setTitle] = useState(lecture.title);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'summary'>('edit');

  // Debounce save or manual save
  const handleSave = () => {
    onUpdate({
        ...lecture,
        title,
        content
    });
  };

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setIsAnalyzing(true);
    handleSave(); // Save before analyzing

    try {
      const result = await analyzeLectureNotes(content);
      onUpdate({
        ...lecture,
        title,
        content,
        summary: result.summary
      });
      
      if (result.tasks && result.tasks.length > 0) {
        const newTasks: Task[] = result.tasks.map(t => ({
          id: Date.now() + Math.random().toString(),
          title: t,
          status: 'Not Started',
          priority: 'Medium',
          category: course.title,
          courseId: course.id,
          dueDate: new Date().toISOString().split('T')[0],
          subtasks: []
        }));
        onAddTasks(newTasks);
      }
      setActiveTab('summary');
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto h-full flex flex-col no-scrollbar pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-4">
            <button 
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                   <span className={`w-2 h-2 rounded-full ${course.color}`} />
                   {course.title}
                   <span>•</span>
                   <Calendar className="w-3 h-3" /> {lecture.date}
                </div>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSave}
                  className="text-2xl font-bold text-slate-800 bg-transparent border-none outline-none focus:ring-2 focus:ring-primary-100 rounded-lg px-1 -ml-1 w-full"
                />
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={handleSave}
                className="p-2 text-slate-400 hover:text-primary-600 transition-colors"
                title="Save"
            >
                <Save className="w-5 h-5" />
            </button>
            <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !content.trim()}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
            >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span className="hidden sm:inline">AI Analyze</span>
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-200 mb-6 flex-shrink-0">
         <button 
           onClick={() => setActiveTab('edit')}
           className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'edit' ? 'text-primary-600' : 'text-slate-500 hover:text-slate-800'}`}
         >
           Notes
           {activeTab === 'edit' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full" />}
         </button>
         <button 
           onClick={() => setActiveTab('summary')}
           className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'summary' ? 'text-primary-600' : 'text-slate-500 hover:text-slate-800'}`}
         >
           AI Summary
           {activeTab === 'summary' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full" />}
         </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
         {activeTab === 'edit' ? (
            <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start typing your lecture notes here..."
                className="w-full h-full p-6 resize-none outline-none text-slate-700 leading-relaxed text-lg"
            />
         ) : (
             <div className="p-8 h-full overflow-y-auto">
                 {lecture.summary ? (
                     <div className="prose prose-slate max-w-none">
                         <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                             <Sparkles className="w-5 h-5 text-purple-500" /> Key Insights
                         </h3>
                         <div className="bg-purple-50 p-6 rounded-xl text-slate-700 leading-relaxed mb-8 border border-purple-100">
                             {lecture.summary}
                         </div>
                         
                         <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                             <List className="w-5 h-5 text-blue-500" /> Generated Tasks
                         </h3>
                         <p className="text-sm text-slate-500 mb-4">These tasks have been added to your task list automatically.</p>
                         {/* We don't show the tasks list here dynamically since we just added them, 
                             but in a real app we might store them in the lecture object or fetch them. 
                             For now, just a placeholder explaining they are in the Tasks tab. */}
                         <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                             <p className="text-blue-800 font-medium">Check the "Tasks" tab to see actionable items extracted from this lecture.</p>
                         </div>
                     </div>
                 ) : (
                     <div className="flex flex-col items-center justify-center h-full text-slate-400">
                         <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                         <p>Click "AI Analyze" to generate a summary.</p>
                     </div>
                 )}
             </div>
         )}
      </div>
    </div>
  );
};

export default Lecture;