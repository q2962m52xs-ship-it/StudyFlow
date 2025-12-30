import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { StudySession } from '../types';
import { Trophy, Flame, Calendar, Clock } from 'lucide-react';

interface StatsProps {
  sessions: StudySession[];
}

const Stats: React.FC<StatsProps> = ({ sessions }) => {
  // Aggregate data for chart (Last 7 days mock or real)
  // For this demo, we'll generate some mock data if sessions are empty to show the UI
  const data = [
    { name: 'Mon', minutes: 120 },
    { name: 'Tue', minutes: 90 },
    { name: 'Wed', minutes: 45 },
    { name: 'Thu', minutes: 180 },
    { name: 'Fri', minutes: 60 },
    { name: 'Sat', minutes: 240 },
    { name: 'Sun', minutes: 150 },
  ];

  // In a real app, process 'sessions' prop to populate 'data'

  const totalMinutes = data.reduce((acc, curr) => acc + curr.minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div className="p-6 max-w-5xl mx-auto h-full overflow-y-auto no-scrollbar pb-24 md:pb-6">
       <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Analytics</h2>
        <p className="text-slate-500">Track your progress and build habits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <Clock className="w-6 h-6" />
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">Total Focus</p>
                <p className="text-2xl font-bold text-slate-800">{totalHours} <span className="text-sm font-normal text-slate-400">hrs</span></p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                <Flame className="w-6 h-6" />
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">Streak</p>
                <p className="text-2xl font-bold text-slate-800">5 <span className="text-sm font-normal text-slate-400">days</span></p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                <Trophy className="w-6 h-6" />
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">Sessions</p>
                <p className="text-2xl font-bold text-slate-800">12</p>
            </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                <Calendar className="w-6 h-6" />
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">Daily Avg</p>
                <p className="text-2xl font-bold text-slate-800">1.2 <span className="text-sm font-normal text-slate-400">hrs</span></p>
            </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Weekly Activity</h3>
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 5 ? '#3b82f6' : '#94a3b8'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Stats;