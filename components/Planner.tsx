import React, { useState } from 'react';
import { Sparkles, Calendar, Clock, BookOpen, Loader2, ArrowRight } from 'lucide-react';
import { generateStudyPlan } from '../services/geminiService';
import { PlannerResponse } from '../types';

const Planner: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [days, setDays] = useState('7');
  const [hours, setHours] = useState('2');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlannerResponse | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPlan(null);

    try {
      const result = await generateStudyPlan(subject, parseInt(days), parseInt(hours), details);
      setPlan(result);
    } catch (err) {
      setError('Failed to generate plan. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto h-full overflow-y-auto no-scrollbar pb-24 md:pb-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="text-indigo-500 w-6 h-6" />
          AI Study Planner
        </h2>
        <p className="text-slate-500">Powered by Gemini. Create a custom schedule in seconds.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleGenerate} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Calculus, Biology"
                  className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Days until Exam</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                    <input
                      type="number"
                      required
                      min="1"
                      max="60"
                      value={days}
                      onChange={e => setDays(e.target.value)}
                      className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hours / Day</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                    <input
                      type="number"
                      required
                      min="1"
                      max="12"
                      value={hours}
                      onChange={e => setHours(e.target.value)}
                      className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                    />
                  </div>
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Specific Goals / Details</label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="I need to focus on integrals..."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                </>
              ) : (
                <>
                    <Sparkles className="w-5 h-5" />
                    Generate Plan
                </>
              )}
            </button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </form>
        </div>

        {/* Results Display */}
        <div className="lg:col-span-2">
            {!plan && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl p-12 bg-slate-50/50">
                    <BrainCircuit className="w-16 h-16 mb-4 opacity-20" />
                    <p>Enter your details to generate a personalized study roadmap.</p>
                </div>
            )}

            {plan && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-800">{plan.planName}</h3>
                        <p className="text-slate-500 mt-1">Structured schedule for success</p>
                    </div>

                    <div className="space-y-4">
                        {plan.schedule.map((day, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-lg text-sm">
                                            {day.day}
                                        </div>
                                        <span className="font-medium text-slate-800">{day.focusArea}</span>
                                    </div>
                                </div>
                                <div className="pl-4 border-l-2 border-indigo-100 space-y-2">
                                    {day.topics.map((topic, tIdx) => (
                                        <div key={tIdx} className="flex items-start gap-2 text-slate-600 text-sm">
                                            <ArrowRight className="w-4 h-4 mt-0.5 text-indigo-400 flex-shrink-0" />
                                            <span>{topic}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// Simple internal component reference fix
const BrainCircuit = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 3 2.5 2.5 0 0 0-.54 3.39"/><path d="M19.5 8a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 3 2.5 2.5 0 0 0-.54 3.39"/><path d="M12 19.5v-6"/><path d="M2 12h5.5"/><path d="M16.5 12H22"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M7 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M17 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>
);

export default Planner;