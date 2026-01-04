import { Task, Course, Lecture, StudySession, ScheduleItem, ClassSession } from '../types';

export interface UserData {
  tasks: Task[];
  courses: Course[];
  lectures: Lecture[];
  sessions: StudySession[];
  schedule: ScheduleItem[];
  classSessions: ClassSession[];
}

const DEFAULT_DATA: UserData = {
  tasks: [],
  courses: [],
  lectures: [],
  sessions: [],
  schedule: [],
  classSessions: []
};

export const storage = {
  // Save specific user data
  saveUserData: (username: string, data: UserData) => {
    try {
      localStorage.setItem(`studyflow_data_${username.toLowerCase()}`, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save data", e);
    }
  },

  // Load specific user data
  getUserData: (username: string): UserData => {
    try {
      const data = localStorage.getItem(`studyflow_data_${username.toLowerCase()}`);
      return data ? { ...DEFAULT_DATA, ...JSON.parse(data) } : DEFAULT_DATA;
    } catch (e) {
      console.error("Failed to load data", e);
      return DEFAULT_DATA;
    }
  },

  // Simulate "Auth" by saving the current active user in session
  login: (username: string) => {
    localStorage.setItem('studyflow_current_user', username.toLowerCase());
    return { uid: username.toLowerCase(), displayName: username };
  },

  logout: () => {
    localStorage.removeItem('studyflow_current_user');
  },

  getCurrentUser: () => {
    const username = localStorage.getItem('studyflow_current_user');
    return username ? { uid: username, displayName: username.charAt(0).toUpperCase() + username.slice(1) } : null;
  }
};