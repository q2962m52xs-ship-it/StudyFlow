
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: string;
  dueDate?: string;
  description?: string;
  courseId?: string;
}

export interface CourseStaff {
  id: string;
  name: string;
  role: 'Lecturer' | 'TA' | 'Other';
  email?: string;
}

export interface CourseResource {
  id: string;
  title: string;
  type: 'link' | 'file' | 'note';
  url?: string;
  content?: string;
}

export interface Course {
  id: string;
  title: string;
  color: string;
  description?: string;
  staff: CourseStaff[];
  resources: CourseResource[];
}

export interface ScheduleItem {
  id: string;
  courseId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "10:00"
  endTime: string; // "12:00"
  type: 'Lecture' | 'Recitation' | 'Lab';
  location?: string;
}

export interface ClassSession {
  id: string;
  courseId: string;
  scheduleItemId: string;
  date: string; // ISO Date YYYY-MM-DD
  status: 'attended' | 'missed';
}

export interface Lecture {
  id: string;
  courseId: string;
  title: string; // e.g., "Week 4: Derivatives"
  date: string;
  content: string;
  summary?: string;
  isBacklog: boolean; // True if created from a missed class
  completed: boolean; // True if the student has caught up
}

export interface StudySession {
  date: string; // ISO date string
  durationMinutes: number;
  category: string;
}

export interface PlannerItem {
  day: string;
  topics: string[];
  focusArea: string;
}

export interface PlannerResponse {
  planName: string;
  schedule: PlannerItem[];
}

export enum TimerMode {
  FOCUS = 'FOCUS',
  SHORT_BREAK = 'SHORT_BREAK',
  LONG_BREAK = 'LONG_BREAK',
}

export const TIMER_SETTINGS = {
  [TimerMode.FOCUS]: 25 * 60,
  [TimerMode.SHORT_BREAK]: 5 * 60,
  [TimerMode.LONG_BREAK]: 15 * 60,
};

export type ViewState = 
  | { type: 'dashboard' }
  | { type: 'schedule' }
  | { type: 'focus' }
  | { type: 'tasks' }
  | { type: 'task_detail'; taskId: string }
  | { type: 'planner' }
  | { type: 'stats' }
  | { type: 'courses' }
  | { type: 'course_detail'; courseId: string }
  | { type: 'lecture'; lectureId: string; courseId: string };
