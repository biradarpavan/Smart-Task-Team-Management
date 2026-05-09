import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function AnalyticsModal({ isOpen, onClose, tasks }) {
  if (!isOpen) return null;

  // Calculate Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Done').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const statusData = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'To Do').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length },
    { name: 'Review', value: tasks.filter(t => t.status === 'Review').length },
    { name: 'Done', value: completedTasks },
  ];

  const COLORS = ['#94a3b8', '#3b82f6', '#eab308', '#22c55e'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Dashboard Analytics</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">✕</button>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Overview Cards */}
          <div className="space-y-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
              <h3 className="text-indigo-600 dark:text-indigo-400 font-semibold mb-2">Total Tasks</h3>
              <p className="text-4xl font-bold text-gray-800 dark:text-white">{totalTasks}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-100 dark:border-green-800/30">
              <h3 className="text-green-600 dark:text-green-400 font-semibold mb-2">Project Progress</h3>
              <div className="flex items-end space-x-2">
                <p className="text-4xl font-bold text-gray-800 dark:text-white">{progress}%</p>
                <span className="text-gray-500 dark:text-gray-400 mb-1">completed</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-4">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="h-64">
            <h3 className="text-center font-semibold text-gray-700 dark:text-gray-300 mb-4">Task Status Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
