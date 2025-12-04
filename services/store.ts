
import { User, Task, TASK_TYPES } from '../types';

const STORAGE_KEYS = {
  USERS: 'app_users',
  TASKS: 'app_tasks',
  CURRENT_USER: 'app_current_user',
  INIT: 'app_initialized_v8', // Bump version to clear old data
  EXTRA_SHIFTS: 'app_extra_shifts'
};

// Seed Data
const SEED_USERS: User[] = [
  { 
    id: '1', 
    email: 'admin@telenet.be', 
    name: 'Hoofdbeheerder', 
    role: 'ADMIN', 
    active: true, 
    password: 'password123',
    createdAt: new Date('2023-01-01').toISOString(),
    phone: '0470 12 34 56'
  },
  { 
    id: '2', 
    email: 'tech1@telenet.be', 
    name: 'Jan Technieker', 
    role: 'TECHNICIAN', 
    active: true,
    password: 'password123',
    createdAt: new Date('2023-06-15').toISOString(),
    phone: '0470 98 76 54'
  },
  { 
    id: '3', 
    email: 'tech2@telenet.be', 
    name: 'Piet Installateur', 
    role: 'TECHNICIAN', 
    active: true,
    password: 'password123',
    createdAt: new Date('2023-08-20').toISOString(),
    phone: '0470 55 55 55'
  },
];

const generateMockHistory = () => {
  // Return empty array as requested to clear all pre-filled tasks
  return [];
};

export const store = {
  getUsers: (): User[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
      return SEED_USERS;
    }
    return JSON.parse(stored);
  },

  saveUser: (user: User) => {
    const users = store.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getTasks: (): Task[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
    // Check if we need to re-seed (if version changed or empty)
    const isInit = localStorage.getItem(STORAGE_KEYS.INIT);
    
    if (!stored || !isInit) {
       const history = generateMockHistory();
       localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(history));
       localStorage.setItem(STORAGE_KEYS.INIT, 'true');
       return history;
    }
    
    return JSON.parse(stored);
  },

  saveTask: (task: Task) => {
    const tasks = store.getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.push(task);
    }
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  deleteTask: (taskId: string) => {
    let tasks = store.getTasks();
    tasks = tasks.filter(t => t.id !== taskId);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  // --- Extra Shift Logic ---
  getExtraShifts: (): Record<string, boolean> => {
    const stored = localStorage.getItem(STORAGE_KEYS.EXTRA_SHIFTS);
    return stored ? JSON.parse(stored) : {};
  },

  isExtraShift: (userId: string, date: Date): boolean => {
    const shifts = store.getExtraShifts();
    const key = `${userId}_${date.toDateString()}`;
    return !!shifts[key];
  },

  toggleExtraShift: (userId: string, date: Date) => {
    const shifts = store.getExtraShifts();
    const key = `${userId}_${date.toDateString()}`;
    if (shifts[key]) {
        delete shifts[key];
    } else {
        shifts[key] = true;
    }
    localStorage.setItem(STORAGE_KEYS.EXTRA_SHIFTS, JSON.stringify(shifts));
  },

  login: (email: string, password?: string): User | null => {
    const users = store.getUsers();
    // Ensure we initialize data on first login attempt too if needed
    store.getTasks(); 
    
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
        if (password && user.password !== password) {
            return null;
        }
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        return user;
    }
    return null;
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return stored ? JSON.parse(stored) : null;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};