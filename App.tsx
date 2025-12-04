
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Task } from './types';
import { store } from './services/store';
import { TaskForm } from './components/TaskForm';
import { TechnicianManagement } from './components/TechnicianManagement';
import { ComplianceDashboard } from './components/ComplianceDashboard';
import { 
  ArrowRightOnRectangleIcon, 
  PlusIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  SparklesIcon,
  TrophyIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

// --- TechArena Brand Component ---
const TechArenaLogo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const textSize = size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-xl';
  const iconSize = size === 'lg' ? 'h-8' : size === 'md' ? 'h-6' : 'h-5';
  
  return (
    <div className="flex items-center gap-2 font-black tracking-tighter select-none">
       {/* Recreating the logo aesthetic with CSS/SVG */}
       <div className="relative flex items-center">
          <span className={`${textSize} text-[#FFC107]`}>Tech</span>
          <span className={`${textSize} text-[#FF3D00] -ml-0.5`}>Arena</span>
       </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'DASHBOARD' | 'FORM' | 'TECHNICIANS' | 'COMPLIANCE'>('DASHBOARD');
  
  // Dashboard specific state
  const [dashboardView, setDashboardView] = useState<'WEEK' | 'MONTH'>('WEEK');
  const [displayMonth, setDisplayMonth] = useState(new Date()); // For month navigation
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('ALL'); // Admin Filter
  
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [extraShifts, setExtraShifts] = useState<Record<string, boolean>>({}); // Local state to trigger rerenders

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentUser = store.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setTasks(store.getTasks());
      setUsersList(store.getUsers());
      setExtraShifts(store.getExtraShifts());
    }
  }, []);

  // Sync displayMonth with selectedDate when switching to WEEK view
  // ensuring the strip shows the relevant days
  useEffect(() => {
    if (dashboardView === 'WEEK') {
        setDisplayMonth(selectedDate);
    }
  }, [dashboardView]);

  // Scroll selected date into view for horizontal strip
  useEffect(() => {
    if (dashboardView === 'WEEK' && scrollRef.current) {
        const selectedId = `date-${selectedDate.toISOString().split('T')[0]}`;
        const element = document.getElementById(selectedId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
  }, [selectedDate, dashboardView, displayMonth]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const loggedIn = store.login(loginEmail, loginPassword);
    if (loggedIn) {
      setUser(loggedIn);
      setTasks(store.getTasks());
      setUsersList(store.getUsers());
      setExtraShifts(store.getExtraShifts());
    } else {
      alert("Gebruiker niet gevonden of wachtwoord onjuist.");
    }
  };

  const handleLogout = () => {
    store.logout();
    setUser(null);
  };

  const handleSaveTask = (task: Task) => {
    store.saveTask(task);
    setTasks(store.getTasks());
    setView('DASHBOARD');
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
      store.deleteTask(taskId);
      setTasks(store.getTasks());
      setView('DASHBOARD');
      setEditingTask(null);
  };

  const handleSaveUser = (updatedUser: User) => {
    store.saveUser(updatedUser);
    setUsersList(store.getUsers());
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setView('FORM');
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setView('FORM');
  };

  const handleToggleExtraShift = () => {
    if (!user) return;
    store.toggleExtraShift(user.id, selectedDate);
    setExtraShifts(store.getExtraShifts()); // Update local state to trigger rerender
  };

  // --- Helper Functions ---

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const getDayStats = (date: Date, technicianTasks: Task[]) => {
    const daysTasks = technicianTasks.filter(t => isSameDay(new Date(t.date), date));
    const okCount = daysTasks.filter(t => t.outcome === 'OK').length;
    const nokCount = daysTasks.filter(t => t.outcome === 'NOK').length;
    const ppCount = daysTasks.filter(t => t.outcome === 'PP').length;
    const cancelCount = daysTasks.filter(t => t.outcome === 'CANCEL').length;
    const totalGoal = okCount + nokCount; // Only OK and NOK count towards quota
    return { total: daysTasks.length, goal: totalGoal, ok: okCount, nok: nokCount, pp: ppCount, cancel: cancelCount };
  };

  const getMonthDays = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  // --- Computed Data ---

  const monthDays = useMemo(() => {
    return getMonthDays(displayMonth.getFullYear(), displayMonth.getMonth());
  }, [displayMonth]);

  // Main filter for the dashboard: 
  // - If Technician: only show own tasks.
  // - If Admin: Show all OR filter by selectedTechnicianId
  const myTasksAll = useMemo(() => {
    if (!user) return [];
    
    if (user.role === 'TECHNICIAN') {
       return tasks.filter(t => t.technicianId === user.id);
    }

    // Admin Role
    if (selectedTechnicianId === 'ALL') {
      return tasks;
    } else {
      return tasks.filter(t => t.technicianId === selectedTechnicianId);
    }
  }, [user, tasks, selectedTechnicianId]);

  const selectedDayTasks = useMemo(() => {
    return myTasksAll.filter(t => isSameDay(new Date(t.date), selectedDate));
  }, [myTasksAll, selectedDate]);

  const stats = getDayStats(selectedDate, myTasksAll);
  const isToday = isSameDay(selectedDate, new Date());
  const isSaturday = selectedDate.getDay() === 6;
  const isExtraSaturday = user ? store.isExtraShift(user.id, selectedDate) : false;
  
  // Month View Calculations
  const monthStats = useMemo(() => {
    const start = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1);
    const end = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0);
    
    const tasksInMonth = myTasksAll.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });

    const ok = tasksInMonth.filter(t => t.outcome === 'OK').length;
    const nok = tasksInMonth.filter(t => t.outcome === 'NOK').length;
    const pp = tasksInMonth.filter(t => t.outcome === 'PP').length;
    const cancel = tasksInMonth.filter(t => t.outcome === 'CANCEL').length;
    
    // Calculate compliant days
    let compliantDays = 0;
    let bonusTasks = 0;
    const daysMap = new Map<string, number>();
    
    tasksInMonth.forEach(t => {
      if (t.outcome === 'OK' || t.outcome === 'NOK') {
        const dStr = new Date(t.date).toDateString();
        daysMap.set(dStr, (daysMap.get(dStr) || 0) + 1);
      }
    });

    daysMap.forEach((count, dateStr) => {
      if (count >= 10) {
        compliantDays++;
        
        let dailyBonus = count - 10;
        
        // Apply 1.5x multiplier if Saturday and Extra Shift
        const currentDate = new Date(dateStr);
        if (currentDate.getDay() === 6) {
             // For the user viewing (if Technician) or the filtered user (if Admin selected one)
             const userIdToCheck = user?.role === 'TECHNICIAN' ? user.id : selectedTechnicianId !== 'ALL' ? selectedTechnicianId : null;
             
             if (userIdToCheck && store.isExtraShift(userIdToCheck, currentDate)) {
                 dailyBonus = dailyBonus * 1.5;
             }
        }
        
        bonusTasks += dailyBonus;
      }
    });

    return {
      total: tasksInMonth.length,
      ok, nok, pp, cancel,
      compliantDays,
      bonusTasks,
      totalGoalTasks: ok + nok
    };
  }, [myTasksAll, displayMonth, extraShifts, user, selectedTechnicianId]); // Added extraShifts dependency


  // Admin Bonus Ranking Calculation (Calculates for ALL technicians)
  const bonusRanking = useMemo(() => {
    if (user?.role !== 'ADMIN') return [];

    const start = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1);
    const end = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0);

    return usersList
      .filter(u => u.role === 'TECHNICIAN' && u.active)
      .map(tech => {
        const techTasks = tasks.filter(t => {
          const d = new Date(t.date);
          return t.technicianId === tech.id &&
                 d >= start && d <= end &&
                 (t.outcome === 'OK' || t.outcome === 'NOK');
        });

        // Group by day
        const dayCounts: Record<string, number> = {};
        techTasks.forEach(t => {
          const day = new Date(t.date).toDateString();
          dayCounts[day] = (dayCounts[day] || 0) + 1;
        });

        let bonus = 0;
        Object.entries(dayCounts).forEach(([dateStr, count]) => {
          if (count > 10) {
             let dailyBonus = count - 10;
             const date = new Date(dateStr);
             // Check if Extra Saturday
             if (date.getDay() === 6 && store.isExtraShift(tech.id, date)) {
                 dailyBonus = dailyBonus * 1.5;
             }
             bonus += dailyBonus;
          }
        });

        return { ...tech, bonus };
      })
      .filter(t => t.bonus > 0)
      .sort((a, b) => b.bonus - a.bonus);
  }, [usersList, tasks, displayMonth, user, extraShifts]); // Added extraShifts dependency


  // --- Render ---

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Abstract Background for Login */}
        <div className="absolute inset-0 bg-zinc-950">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-red-600"></div>
        </div>

        <div className="w-full max-w-md bg-zinc-900 text-zinc-100 rounded-2xl p-8 shadow-2xl border border-zinc-800 relative z-10">
          <div className="flex justify-center mb-8">
             {/* Large Logo on Black Background */}
             <div className="p-4 bg-black rounded-xl border border-zinc-800 shadow-inner">
                <TechArenaLogo size="lg" />
             </div>
          </div>
          
          <p className="text-zinc-500 text-center mb-8 text-sm">Telecom Field Service Manager</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">E-mailadres</label>
                <input 
                  type="email" 
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-zinc-700"
                  placeholder="name@techarena.be"
                />
            </div>
            <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Wachtwoord</label>
                <input 
                  type="password" 
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-zinc-700"
                  placeholder="••••••••"
                />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-amber-50 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-red-900/20 transform active:scale-[0.98]">
              Aanmelden
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'FORM') {
    return (
      <TaskForm 
        currentUser={user} 
        initialTask={editingTask} 
        onSave={handleSaveTask} 
        onDelete={handleDeleteTask}
        onCancel={() => setView('DASHBOARD')} 
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-zinc-200 sticky top-0 h-screen shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        {/* Brand Header - Dark to match Logo */}
        <div className="p-6 bg-zinc-950 border-b border-zinc-800">
           <div className="flex items-center justify-center">
              <TechArenaLogo size="md" />
           </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-2">
            <button 
                onClick={() => setView('DASHBOARD')}
                className={`flex items-center gap-3 w-full p-3 font-medium rounded-xl transition-colors ${view === 'DASHBOARD' ? 'bg-amber-50 text-amber-700' : 'text-zinc-600 hover:bg-zinc-50'}`}
            >
                <CalendarDaysIcon className={`w-5 h-5 ${view === 'DASHBOARD' ? 'text-amber-600' : ''}`} /> 
                Dashboard
            </button>
            {user.role === 'ADMIN' && (
                <>
                <button 
                    onClick={() => setView('TECHNICIANS')}
                    className={`flex items-center gap-3 w-full p-3 font-medium rounded-xl transition-colors ${view === 'TECHNICIANS' ? 'bg-amber-50 text-amber-700' : 'text-zinc-600 hover:bg-zinc-50'}`}
                >
                    <UserGroupIcon className={`w-5 h-5 ${view === 'TECHNICIANS' ? 'text-amber-600' : ''}`} /> 
                    Techniekers
                </button>
                <button 
                    onClick={() => setView('COMPLIANCE')}
                    className={`flex items-center gap-3 w-full p-3 font-medium rounded-xl transition-colors ${view === 'COMPLIANCE' ? 'bg-amber-50 text-amber-700' : 'text-zinc-600 hover:bg-zinc-50'}`}
                >
                    <CheckCircleIcon className={`w-5 h-5 ${view === 'COMPLIANCE' ? 'text-amber-600' : ''}`} /> 
                    Naleving
                </button>
                </>
            )}
        </nav>
        <div className="p-4 border-t border-zinc-100">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center font-bold text-zinc-600">
                    {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{user.name}</p>
                    <p className="text-xs text-zinc-500 truncate capitalize">{user.role.toLowerCase()}</p>
                </div>
                <button onClick={handleLogout} className="text-zinc-400 hover:text-red-500 transition-colors">
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header - Dark to match Logo */}
        <header className="md:hidden bg-zinc-950 text-white p-4 sticky top-0 z-20 flex items-center justify-between shadow-md">
            <TechArenaLogo size="sm" />
            <button onClick={handleLogout} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700">
                <ArrowRightOnRectangleIcon className="w-5 h-5 text-zinc-300" />
            </button>
        </header>

        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
            
            {view === 'TECHNICIANS' && user.role === 'ADMIN' ? (
                <TechnicianManagement users={usersList} onSaveUser={handleSaveUser} />
            ) : view === 'COMPLIANCE' && user.role === 'ADMIN' ? (
                <ComplianceDashboard users={usersList} tasks={tasks} extraShifts={extraShifts} />
            ) : (
                <>
                {/* Dashboard Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900">
                            {isToday ? `Welkom terug, ${user.name.split(' ')[0]}` : `Overzicht`}
                        </h2>
                        <p className="text-zinc-500">
                           {user.role === 'ADMIN' 
                             ? 'Beheer en analyseer taken van techniekers.'
                             : 'Beheer je taken en bekijk je prestaties.'}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                         {/* Admin: Technician Filter */}
                         {user.role === 'ADMIN' && (
                             <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FunnelIcon className="h-4 w-4 text-zinc-500" />
                                </div>
                                <select 
                                    value={selectedTechnicianId}
                                    onChange={(e) => setSelectedTechnicianId(e.target.value)}
                                    className="pl-9 pr-8 py-2 w-full sm:w-48 rounded-md text-sm font-medium border border-zinc-200 shadow-sm focus:ring-2 focus:ring-amber-500 outline-none appearance-none bg-white"
                                >
                                    <option value="ALL">Alle Techniekers</option>
                                    <option disabled>──────────</option>
                                    {usersList.filter(u => u.role === 'TECHNICIAN').map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                             </div>
                         )}

                        <div className="flex items-center bg-white rounded-lg p-1 border border-zinc-200 shadow-sm">
                            <button 
                                onClick={() => setDashboardView('WEEK')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${dashboardView === 'WEEK' ? 'bg-zinc-100 text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                            >
                                <CalendarDaysIcon className="w-4 h-4 inline-block mr-2" />
                                Lijst
                            </button>
                            <button 
                                onClick={() => setDashboardView('MONTH')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${dashboardView === 'MONTH' ? 'bg-zinc-100 text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                            >
                                <CalendarDaysIcon className="w-4 h-4 inline-block mr-2" />
                                Kalender
                            </button>
                        </div>
                    </div>

                    {user.role === 'TECHNICIAN' && isToday && (
                        <button 
                            onClick={handleNewTask}
                            className="bg-gradient-to-r from-amber-50 to-red-600 hover:from-amber-400 hover:to-red-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-600/20 flex items-center gap-2 transition-transform active:scale-95 md:ml-auto"
                        >
                            <PlusIcon className="w-5 h-5" /> Nieuwe Taak
                        </button>
                    )}
                </div>

                {/* --- WEEK/LIST VIEW CONTENT --- */}
                {dashboardView === 'WEEK' && (
                    <>
                        {/* Daily Goal Card (Technician) */}
                        {user.role === 'TECHNICIAN' && (
                            <div className="relative overflow-hidden bg-zinc-900 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-zinc-800">
                                {/* Gradient Orb Effect */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500 to-red-600 opacity-20 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
                                
                                <div className="absolute top-0 right-0 p-6 opacity-5">
                                    <ClipboardDocumentCheckIcon className="w-64 h-64 transform rotate-12 -translate-y-12 translate-x-12" />
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-8">
                                        <div>
                                            <h3 className="text-amber-500 font-bold mb-1 uppercase tracking-wider text-xs">Dagdoelstelling</h3>
                                            <div className="text-3xl font-bold">
                                                {stats.goal >= 10 ? 'Doel bereikt! 🎉' : `${10 - stats.goal} taken te gaan`}
                                            </div>
                                        </div>
                                        <div className="bg-zinc-800/80 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium border border-zinc-700">
                                            {selectedDate.toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric' })}
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm mb-2 font-medium opacity-90 text-zinc-400">
                                            <span>Voortgang</span>
                                            <span>{Math.round((Math.min(stats.goal, 10) / 10) * 100)}%</span>
                                        </div>
                                        <div className="h-4 bg-zinc-800 rounded-full overflow-hidden backdrop-blur-sm border border-zinc-700">
                                            <div 
                                                className={`h-full transition-all duration-1000 ease-out ${stats.goal >= 10 ? 'bg-green-500' : 'bg-gradient-to-r from-amber-50 to-red-500'}`}
                                                style={{ width: `${Math.min((stats.goal / 10) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                                        <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-3 border border-zinc-700/50">
                                            <div className="text-2xl font-bold">{stats.goal}/10</div>
                                            <div className="text-xs text-zinc-400">Geldige Taken</div>
                                        </div>
                                        <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-3 border border-zinc-700/50">
                                            <div className="text-2xl font-bold text-green-400">{stats.ok}</div>
                                            <div className="text-xs text-zinc-400">OK</div>
                                        </div>
                                        <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-3 border border-zinc-700/50">
                                            <div className="text-2xl font-bold text-red-400">{stats.nok}</div>
                                            <div className="text-xs text-zinc-400">NOK</div>
                                        </div>
                                        <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-3 border border-zinc-700/50">
                                            <div className="text-2xl font-bold text-amber-400">{stats.pp}</div>
                                            <div className="text-xs text-zinc-400">PP / Overig</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NEW: Bonus Summary Section (Technician) */}
                        {user.role === 'TECHNICIAN' && (
                            <div className="mt-4 bg-gradient-to-br from-white to-amber-50 rounded-2xl p-5 border border-amber-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
                                        <SparklesIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-900 text-lg">Bonus Pot</h3>
                                        <p className="text-sm text-zinc-500">
                                            Jouw extra prestaties in <span className="font-semibold text-amber-700 capitalize">{displayMonth.toLocaleDateString('nl-BE', { month: 'long' })}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-xl border border-amber-100 shadow-sm">
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-amber-600 leading-none">
                                            +{monthStats.bonusTasks.toFixed(1).replace('.0', '')}
                                        </div>
                                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                                            Bonus Punten
                                        </div>
                                    </div>
                                    {monthStats.bonusTasks > 0 && (
                                         <div className="w-1 h-8 bg-amber-100 rounded-full"></div>
                                    )}
                                     {monthStats.bonusTasks > 0 && (
                                        <div className="text-xs font-medium text-amber-700">
                                            Goed bezig! 🚀
                                        </div>
                                     )}
                                </div>
                            </div>
                        )}
                        
                         {/* Daily Goal Card (Admin View - Aggregated or Specific) */}
                        {user.role === 'ADMIN' && (
                             <div className="relative overflow-hidden bg-white rounded-3xl p-6 md:p-8 text-zinc-900 shadow-md border border-zinc-200">
                                <div className="flex items-start justify-between mb-8">
                                    <div>
                                        <h3 className="text-amber-600 font-bold mb-1 uppercase tracking-wider text-xs">
                                            {selectedTechnicianId === 'ALL' ? 'Totaal Overzicht (Alle Techniekers)' : `Overzicht: ${usersList.find(u => u.id === selectedTechnicianId)?.name}`}
                                        </h3>
                                        <div className="text-3xl font-bold text-zinc-900">
                                            {stats.total} <span className="text-lg font-medium text-zinc-500">geregistreerde taken</span>
                                        </div>
                                    </div>
                                     <div className="bg-zinc-100 px-4 py-2 rounded-lg text-sm font-medium border border-zinc-200 text-zinc-600">
                                        {selectedDate.toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                                    <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                                        <div className="text-2xl font-bold text-zinc-900">{stats.goal}</div>
                                        <div className="text-xs text-zinc-500">OK + NOK</div>
                                    </div>
                                    <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                                        <div className="text-2xl font-bold text-green-600">{stats.ok}</div>
                                        <div className="text-xs text-green-700">OK</div>
                                    </div>
                                    <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                                        <div className="text-2xl font-bold text-red-600">{stats.nok}</div>
                                        <div className="text-xs text-red-700">NOK</div>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                                        <div className="text-2xl font-bold text-amber-600">{stats.pp}</div>
                                        <div className="text-xs text-amber-700">PP / Overig</div>
                                    </div>
                                </div>
                             </div>
                        )}

                        {/* Calendar Strip (Month Scrollable) */}
                        <div className="space-y-3 mt-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))}
                                        className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"
                                    >
                                        <ChevronLeftIcon className="w-4 h-4 text-zinc-600" />
                                    </button>
                                    <h3 className="font-bold text-zinc-900 capitalize text-sm sm:text-base">
                                        {displayMonth.toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' })}
                                    </h3>
                                    <button 
                                        onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))}
                                        className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"
                                    >
                                        <ChevronRightIcon className="w-4 h-4 text-zinc-600" />
                                    </button>
                                </div>
                                <button 
                                    onClick={() => {
                                        const now = new Date();
                                        setSelectedDate(now);
                                        setDisplayMonth(now);
                                    }} 
                                    className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100 hover:bg-amber-100 transition-colors"
                                >
                                    Vandaag
                                </button>
                            </div>
                            <div ref={scrollRef} className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                                {monthDays.map((date) => {
                                    const dayStats = getDayStats(date, myTasksAll);
                                    const isSelected = isSameDay(date, selectedDate);
                                    const dateId = `date-${date.toISOString().split('T')[0]}`;
                                    
                                    const isGoalMet = user.role === 'TECHNICIAN' || selectedTechnicianId !== 'ALL' 
                                        ? dayStats.goal >= 10 
                                        : dayStats.goal > 0;
                                    
                                    return (
                                        <button 
                                            key={date.toISOString()}
                                            id={dateId}
                                            onClick={() => setSelectedDate(date)}
                                            className={`
                                                flex flex-col items-center justify-center min-w-[70px] h-[90px] rounded-2xl transition-all border snap-start shrink-0
                                                ${isSelected 
                                                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg shadow-zinc-900/20 scale-105 z-10' 
                                                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-amber-300'
                                                }
                                            `}
                                        >
                                            <span className={`text-xs uppercase font-bold mb-1 ${isSelected ? 'text-amber-400' : 'text-zinc-400'}`}>
                                                {date.toLocaleDateString('nl-BE', { weekday: 'short' })}
                                            </span>
                                            <span className="text-xl font-bold mb-1">
                                                {date.getDate()}
                                            </span>
                                            <div className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20' : isGoalMet ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                                                {dayStats.goal} {user.role === 'TECHNICIAN' || selectedTechnicianId !== 'ALL' ? '/10' : 'taken'}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* --- MONTH/CALENDAR VIEW CONTENT --- */}
                {dashboardView === 'MONTH' && (
                    <div className="space-y-6">
                        {/* Summary Banner */}
                        <div className="bg-amber-50/80 rounded-2xl p-6 border border-amber-100 flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                                <CheckCircleIcon className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-amber-900">Naleving deze maand</h3>
                                <p className="text-amber-800">
                                    <span className="font-bold text-xl mr-1">{monthStats.compliantDays}</span> 
                                    dagen voldaan (min. 10 OK/NOK)
                                </p>
                            </div>
                            <div className="ml-auto text-right hidden sm:block">
                                <div className="text-2xl font-bold text-amber-900">{monthStats.totalGoalTasks}</div>
                                <div className="text-xs text-amber-700 uppercase font-medium">OK/NOK Totaal</div>
                            </div>
                        </div>

                         {/* Technician Bonus Overview (Personal) */}
                        {user.role === 'TECHNICIAN' && (
                           <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden p-6 relative">
                              <div className="absolute top-0 right-0 p-4 opacity-5">
                                 <SparklesIcon className="w-32 h-32 text-amber-500" />
                              </div>
                              <div className="relative z-10 flex items-center justify-between">
                                 <div>
                                    <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                                       <SparklesIcon className="w-5 h-5 text-amber-500" />
                                       Mijn Bonus deze maand
                                    </h3>
                                    <p className="text-zinc-500 text-sm mt-1 max-w-xs">
                                       Alle taken die je boven de dagelijkse doelstelling van 10 (OK/NOK) hebt uitgevoerd. <br/>
                                       <span className="text-purple-600 font-bold">Extra Zaterdag Shift = 1.5x Bonus</span>
                                    </p>
                                 </div>
                                 <div className="text-right bg-amber-50 px-6 py-3 rounded-2xl border border-amber-100">
                                     <div className="text-3xl font-bold text-amber-600">+{monthStats.bonusTasks.toFixed(1).replace('.0', '')}</div>
                                     <div className="text-xs font-bold text-amber-800 uppercase">Extra Taken</div>
                                 </div>
                              </div>
                           </div>
                        )}

                        {/* KPI Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
                                <ClipboardDocumentCheckIcon className="w-6 h-6 mx-auto text-blue-500 mb-2" />
                                <div className="text-2xl font-bold text-zinc-900">{monthStats.total}</div>
                                <div className="text-xs text-zinc-500 uppercase">Totaal</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm text-center">
                                <CheckCircleIcon className="w-6 h-6 mx-auto text-green-600 mb-2" />
                                <div className="text-2xl font-bold text-green-700">{monthStats.ok}</div>
                                <div className="text-xs text-green-600 uppercase">OK</div>
                            </div>
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm text-center">
                                <XCircleIcon className="w-6 h-6 mx-auto text-red-600 mb-2" />
                                <div className="text-2xl font-bold text-red-700">{monthStats.nok}</div>
                                <div className="text-xs text-red-600 uppercase">NOK</div>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-sm text-center">
                                <ExclamationCircleIcon className="w-6 h-6 mx-auto text-amber-600 mb-2" />
                                <div className="text-2xl font-bold text-amber-700">{monthStats.pp}</div>
                                <div className="text-xs text-amber-600 uppercase">PP</div>
                            </div>
                            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
                                <XCircleIcon className="w-6 h-6 mx-auto text-zinc-400 mb-2" />
                                <div className="text-2xl font-bold text-zinc-600">{monthStats.cancel}</div>
                                <div className="text-xs text-zinc-500 uppercase">Cancel</div>
                            </div>
                        </div>

                        {/* Calendar Widget */}
                        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden p-6">
                            <div className="flex items-center justify-between mb-6">
                                <button 
                                    onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))}
                                    className="p-2 hover:bg-zinc-100 rounded-full"
                                >
                                    <ChevronLeftIcon className="w-5 h-5 text-zinc-600" />
                                </button>
                                <h3 className="text-lg font-bold capitalize">
                                    {displayMonth.toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' })}
                                </h3>
                                <button 
                                    onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))}
                                    className="p-2 hover:bg-zinc-100 rounded-full"
                                >
                                    <ChevronRightIcon className="w-5 h-5 text-zinc-600" />
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-2 mb-2">
                                {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(d => (
                                    <div key={d} className="text-center text-xs font-medium text-zinc-400 uppercase">{d}</div>
                                ))}
                            </div>
                            
                            <div className="grid grid-cols-7 gap-2">
                                {/* Empty Start Blocks */}
                                {Array.from({ length: (new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1).getDay() + 6) % 7 }).map((_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square"></div>
                                ))}

                                {/* Days */}
                                {monthDays.map((date) => {
                                    const dStats = getDayStats(date, myTasksAll);
                                    const isSelected = isSameDay(date, selectedDate);
                                    const isGoalMet = dStats.goal >= 10;
                                    const hasData = dStats.total > 0;
                                    const isExtra = user && store.isExtraShift(user.id, date);

                                    return (
                                        <button
                                            key={date.toISOString()}
                                            onClick={() => setSelectedDate(date)}
                                            className={`
                                                aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all
                                                ${isSelected 
                                                    ? 'bg-zinc-900 text-white shadow-md scale-105 z-10' 
                                                    : 'bg-transparent hover:bg-zinc-50 text-zinc-700'
                                                }
                                                ${isExtra && !isSelected ? 'bg-purple-50 border border-purple-100' : ''}
                                            `}
                                        >
                                            <span className={`text-sm ${isSelected ? 'font-bold' : ''}`}>{date.getDate()}</span>
                                            
                                            {/* Status Dot */}
                                            {hasData && (
                                                <div className={`mt-1 w-1.5 h-1.5 rounded-full ${isGoalMet ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            )}
                                            {isExtra && (
                                                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-500"></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex justify-center gap-4 mt-6 text-xs font-medium text-zinc-500">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div> ≥10 OK/NOK
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div> &lt;10 OK/NOK
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div> Extra Shift
                                </div>
                            </div>
                        </div>

                        {/* Admin Bonus Overview (Leaderboard) */}
                        {user.role === 'ADMIN' && (
                           <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                              <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-white">
                                  <div className="flex items-center gap-2">
                                     <SparklesIcon className="w-5 h-5 text-amber-500" />
                                     <h3 className="font-bold text-zinc-900">Bonus Overzicht {displayMonth.toLocaleDateString('nl-BE', { month: 'long' })}</h3>
                                  </div>
                                  <div className="text-xs text-zinc-500 font-medium">Alle techniekers</div>
                              </div>
                              <div className="divide-y divide-zinc-50">
                                  {bonusRanking.length === 0 ? (
                                      <div className="p-8 text-center text-zinc-400 text-sm">
                                          Geen bonus taken geregistreerd voor deze maand.
                                      </div>
                                  ) : (
                                      bonusRanking.map((tech, index) => (
                                          <div key={tech.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                                              <div className="flex items-center gap-3">
                                                  <div className={`
                                                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border
                                                      ${index === 0 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                                                        index === 1 ? 'bg-zinc-100 text-zinc-600 border-zinc-200' : 
                                                        index === 2 ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-white text-zinc-400 border-zinc-100'}
                                                  `}>
                                                      {index < 3 ? <TrophyIcon className="w-4 h-4" /> : index + 1}
                                                  </div>
                                                  <span className="font-medium text-zinc-900">{tech.name}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                  <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                                                      +{tech.bonus.toFixed(1).replace('.0', '')} taken
                                                  </div>
                                              </div>
                                          </div>
                                      ))
                                  )}
                              </div>
                           </div>
                        )}
                    </div>
                )}

                {/* Common Tasks List & Header */}
                <div className="space-y-4 pb-20">
                    <div className="flex items-center justify-between mt-8">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                                Taken op {selectedDate.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })}
                                <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full text-xs font-medium">{selectedDayTasks.length}</span>
                            </h3>
                            {isExtraSaturday && (
                                <span className="text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <SparklesIcon className="w-3 h-3" /> 1.5x Bonus
                                </span>
                            )}
                        </div>
                        
                        {(user.role === 'TECHNICIAN' || (user.role === 'ADMIN' && selectedTechnicianId !== 'ALL')) && !isSameDay(selectedDate, new Date()) && stats.goal < 10 && stats.total > 0 && !isSaturday && (
                            <div className="flex items-center gap-1 text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                                <ExclamationCircleIcon className="w-4 h-4" />
                                Doel niet bereikt
                            </div>
                        )}

                        {/* Extra Saturday Button */}
                        {user.role === 'TECHNICIAN' && isSaturday && (
                            <button 
                                onClick={handleToggleExtraShift}
                                className={`
                                    text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all
                                    ${isExtraSaturday 
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 hover:bg-purple-700' 
                                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200'
                                    }
                                `}
                            >
                                <BriefcaseIcon className="w-4 h-4" />
                                {isExtraSaturday ? 'Extra Zaterdag Actief' : 'Extra Zaterdag Melden'}
                            </button>
                        )}
                    </div>

                    {selectedDayTasks.length === 0 ? (
                        <div className="bg-white rounded-2xl border-2 border-dashed border-zinc-200 p-10 flex flex-col items-center justify-center text-zinc-400">
                            <ClipboardDocumentCheckIcon className="w-12 h-12 mb-3 opacity-20" />
                            <p className="font-medium">Geen taken geregistreerd op deze dag.</p>
                            {isToday && user.role === 'TECHNICIAN' && (
                                <button onClick={handleNewTask} className="mt-4 text-amber-600 font-bold text-sm hover:underline">
                                    + Start je eerste taak
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {selectedDayTasks.map(task => (
                                <div 
                                    key={task.id}
                                    onClick={() => handleEditTask(task)}
                                    className="group bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
                                >
                                    <div className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg
                                        ${task.status === 'DRAFT' ? 'bg-amber-100 text-amber-600' : 
                                        task.outcome === 'OK' ? 'bg-green-100 text-green-600' :
                                        task.outcome === 'NOK' ? 'bg-red-100 text-red-600' :
                                        'bg-zinc-100 text-zinc-500'}
                                    `}>
                                        {task.status === 'DRAFT' ? 'Draft' : task.outcome}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono font-bold text-zinc-900">#{task.customerNumber}</span>
                                            {/* Show tech name if Admin viewing all */}
                                            {user.role === 'ADMIN' && selectedTechnicianId === 'ALL' && (
                                                 <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-bold truncate">
                                                    {task.technicianName}
                                                </span>
                                            )}
                                            <span className="text-[10px] px-2 py-0.5 bg-zinc-100 rounded-md text-zinc-500 uppercase tracking-wide font-medium truncate">
                                                {task.type}
                                            </span>
                                        </div>
                                        <div className="text-sm text-zinc-500 truncate">
                                            {task.notes || 'Geen opmerkingen'}
                                        </div>
                                    </div>

                                    <div className="text-right pl-2 border-l border-zinc-100">
                                        <div className="flex items-center gap-1 text-zinc-400 text-xs mb-1 justify-end">
                                            <ClockIcon className="w-3 h-3" />
                                            {new Date(task.updatedAt).toLocaleTimeString('nl-BE', {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                        {task.installProducts.length > 0 && (
                                            <div className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium inline-block">
                                                {task.installProducts.length} items
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                </>
            )}
        </div>
      </main>
    </div>
  );
}
