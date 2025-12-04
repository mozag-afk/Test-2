
import React, { useState, useMemo } from 'react';
import { User, Task } from '../types';
import { 
  ArrowDownTrayIcon, 
  UserGroupIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  FunnelIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface ComplianceDashboardProps {
  users: User[];
  tasks: Task[];
  extraShifts: Record<string, boolean>;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({ users, tasks, extraShifts }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [technicianFilter, setTechnicianFilter] = useState('ALL');

  // Generate Stats
  const stats = useMemo(() => {
    const technicians = users.filter(u => u.role === 'TECHNICIAN' && u.active);
    
    // Filter tasks by month/year and valid outcomes (OK/NOK)
    const periodTasks = tasks.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth && 
             d.getFullYear() === selectedYear &&
             (t.outcome === 'OK' || t.outcome === 'NOK');
    });

    const report = technicians.map(tech => {
      const techTasks = periodTasks.filter(t => t.technicianId === tech.id);
      
      // Group by day to check quota
      const tasksByDay: Record<string, number> = {};
      techTasks.forEach(t => {
        const dayKey = new Date(t.date).toDateString();
        tasksByDay[dayKey] = (tasksByDay[dayKey] || 0) + 1;
      });

      const daysWorked = Object.keys(tasksByDay).length;
      let daysCompliant = 0;
      let daysNonCompliant = 0; // Worked but < 10
      let bonusTasks = 0; // Tasks above 10 per day

      Object.entries(tasksByDay).forEach(([dateStr, count]) => {
        if (count >= 10) {
          daysCompliant++;
          
          let dailyBonus = count - 10;
          
          // CHECK FOR EXTRA SATURDAY SHIFT
          const date = new Date(dateStr);
          if (date.getDay() === 6) { // Saturday
             const key = `${tech.id}_${date.toDateString()}`;
             if (extraShifts[key]) {
                 dailyBonus = dailyBonus * 1.5;
             }
          }

          bonusTasks += dailyBonus;
        } else {
          daysNonCompliant++;
        }
      });

      return {
        id: tech.id,
        name: tech.name,
        totalValidTasks: techTasks.length,
        daysCompliant,
        daysNonCompliant,
        bonusTasks,
        status: daysNonCompliant === 0 && daysCompliant > 0 ? 'PERFECT' : 
                daysNonCompliant > 0 ? 'WARNING' : 'NO_DATA'
      };
    });

    // Apply Filter
    const filteredReport = technicianFilter === 'ALL' 
      ? report 
      : report.filter(r => r.id === technicianFilter);

    // KPI Aggregates
    const fullyCompliantCount = filteredReport.filter(r => r.status === 'PERFECT').length;
    const warningCount = filteredReport.filter(r => r.status === 'WARNING').length;
    const totalBonusTasks = filteredReport.reduce((acc, curr) => acc + curr.bonusTasks, 0);

    return { report: filteredReport, fullyCompliantCount, warningCount, totalBonusTasks, totalTechs: filteredReport.length };
  }, [users, tasks, selectedMonth, selectedYear, technicianFilter, extraShifts]);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Technieker,Totaal OK/NOK,Dagen Voldaan,Dagen Niet Voldaan,Bonus Taken (>10/dag),Status\n"
      + stats.report.map(r => `${r.name},${r.totalValidTasks},${r.daysCompliant},${r.daysNonCompliant},${r.bonusTasks.toFixed(2)},${r.status}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `naleving_bonus_rapport_${selectedMonth + 1}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const months = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-zinc-900">Naleving & Bonus</h2>
           <p className="text-zinc-500">Overzicht prestaties en bonusberekening</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg bg-white text-zinc-700 hover:bg-zinc-50 font-medium transition-colors"
        >
          <ArrowDownTrayIcon className="w-5 h-5" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col md:flex-row gap-4">
         <div className="flex-1 min-w-[200px]">
           <div className="relative">
             <CalendarDaysIcon className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
             <select 
               value={selectedMonth}
               onChange={e => setSelectedMonth(Number(e.target.value))}
               className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
             >
               {months.map((m, i) => <option key={m} value={i}>{m} {selectedYear}</option>)}
             </select>
           </div>
         </div>
         
         <div className="flex-1 min-w-[200px]">
            <div className="relative">
             <FunnelIcon className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
             <select 
               value={technicianFilter}
               onChange={e => setTechnicianFilter(e.target.value)}
               className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
             >
               <option value="ALL">Alle techniekers</option>
               {users.filter(u => u.role === 'TECHNICIAN').map(u => (
                 <option key={u.id} value={u.id}>{u.name}</option>
               ))}
             </select>
           </div>
         </div>
         
         <div className="flex-1"></div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-zinc-500 text-sm font-medium mb-1">Techniekers</p>
                <p className="text-3xl font-bold text-zinc-900">{stats.totalTechs}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6" />
            </div>
        </div>

        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-green-800 text-sm font-medium mb-1">Volledig voldaan</p>
                <p className="text-3xl font-bold text-green-700">{stats.fullyCompliantCount}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6" />
            </div>
        </div>

        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-red-800 text-sm font-medium mb-1">Tekortkomingen</p>
                <p className="text-3xl font-bold text-red-700">{stats.warningCount}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
        </div>

        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-amber-800 text-sm font-medium mb-1">Totaal Bonus Taken</p>
                <p className="text-3xl font-bold text-amber-700">+{stats.totalBonusTasks.toFixed(1).replace('.0', '')}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                <SparklesIcon className="w-6 h-6" />
            </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 font-bold text-zinc-900">
            Detailoverzicht per technieker
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                        <th className="px-6 py-4 font-semibold text-zinc-600 text-sm">Technieker</th>
                        <th className="px-6 py-4 font-semibold text-zinc-600 text-sm">Totaal OK/NOK</th>
                        <th className="px-6 py-4 font-semibold text-zinc-600 text-sm">Dagen voldaan</th>
                        <th className="px-6 py-4 font-semibold text-zinc-600 text-sm">Dagen niet voldaan</th>
                        <th className="px-6 py-4 font-semibold text-amber-600 text-sm">Bonus (>10/dag)</th>
                        <th className="px-6 py-4 font-semibold text-zinc-600 text-sm text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                    {stats.report.length === 0 ? (
                         <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                                Geen data gevonden voor deze periode.
                            </td>
                         </tr>
                    ) : (
                        stats.report.map(r => (
                            <tr key={r.id} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-zinc-900">
                                    {r.name}
                                </td>
                                <td className="px-6 py-4 text-zinc-600">
                                    {r.totalValidTasks}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-green-50 text-green-700">
                                        {r.daysCompliant}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${r.daysNonCompliant > 0 ? 'bg-red-50 text-red-700' : 'text-zinc-400'}`}>
                                        {r.daysNonCompliant}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {r.bonusTasks > 0 ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-sm font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                            <SparklesIcon className="w-3 h-3" />
                                            +{r.bonusTasks.toFixed(1).replace('.0', '')}
                                        </span>
                                    ) : (
                                        <span className="text-zinc-400 px-3">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {r.status === 'PERFECT' && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                            <CheckCircleIcon className="w-4 h-4" /> OK
                                        </span>
                                    )}
                                    {r.status === 'WARNING' && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                            <ExclamationTriangleIcon className="w-4 h-4" /> Actie Vereist
                                        </span>
                                    )}
                                    {r.status === 'NO_DATA' && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-500">
                                            Geen activiteit
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};