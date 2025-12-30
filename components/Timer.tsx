import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { TimerMode, TIMER_SETTINGS } from '../types';

interface TimerProps {
  onSessionComplete: (durationMinutes: number) => void;
}

const Timer: React.FC<TimerProps> = ({ onSessionComplete }) => {
  const [mode, setMode] = useState<TimerMode>(TimerMode.FOCUS);
  const [timeLeft, setTimeLeft] = useState(TIMER_SETTINGS[TimerMode.FOCUS]);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (mode === TimerMode.FOCUS) {
        onSessionComplete(TIMER_SETTINGS[TimerMode.FOCUS] / 60);
        // Play notification sound here if we had assets
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode, onSessionComplete]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(TIMER_SETTINGS[mode]);
  };

  const changeMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(TIMER_SETTINGS[newMode]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((TIMER_SETTINGS[mode] - timeLeft) / TIMER_SETTINGS[mode]) * 100;
  
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 max-w-md mx-auto">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full">
        <div className="flex justify-center space-x-2 mb-8 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => changeMode(TimerMode.FOCUS)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === TimerMode.FOCUS 
              ? 'bg-white text-primary-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Focus
          </button>
          <button
            onClick={() => changeMode(TimerMode.SHORT_BREAK)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === TimerMode.SHORT_BREAK 
              ? 'bg-white text-emerald-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Short Break
          </button>
          <button
            onClick={() => changeMode(TimerMode.LONG_BREAK)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === TimerMode.LONG_BREAK 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Long Break
          </button>
        </div>

        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-slate-100"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
              className={`transition-all duration-1000 ease-linear ${
                mode === TimerMode.FOCUS ? 'text-primary-500' : 'text-emerald-500'
              }`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-bold text-slate-800 tabular-nums tracking-tight">
              {formatTime(timeLeft)}
            </span>
            <span className="text-slate-400 font-medium mt-2 uppercase tracking-widest text-xs">
              {isActive ? 'Running' : 'Paused'}
            </span>
          </div>
        </div>

        <div className="flex justify-center items-center space-x-6">
          <button
            onClick={resetTimer}
            className="p-4 rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          
          <button
            onClick={toggleTimer}
            className={`p-6 rounded-full text-white shadow-lg transform transition-all hover:scale-105 active:scale-95 ${
              isActive 
                ? 'bg-slate-800 hover:bg-slate-900' 
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </button>

          <div className="w-14"></div> {/* Spacer for symmetry */}
        </div>

        <div className="mt-8 text-center">
            {mode === TimerMode.FOCUS && (
                <div className="flex items-center justify-center text-slate-500 space-x-2">
                    <Brain className="w-4 h-4" />
                    <span className="text-sm">Time to focus deeply.</span>
                </div>
            )}
            {mode !== TimerMode.FOCUS && (
                <div className="flex items-center justify-center text-slate-500 space-x-2">
                    <Coffee className="w-4 h-4" />
                    <span className="text-sm">Take a breather.</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Timer;