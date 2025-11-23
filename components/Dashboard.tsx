import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MeterReading } from '../types';
import { Plus, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  readings: MeterReading[];
  onQuickScan: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ readings, onQuickScan }) => {
  // Aggregate data for the chart (mock logic for demo)
  const chartData = [
    { name: 'Mon', reads: 12 },
    { name: 'Tue', reads: 19 },
    { name: 'Wed', reads: 15 },
    { name: 'Thu', reads: 22 },
    { name: 'Fri', reads: 8 }, // current day
  ];

  const todaysReads = 8;
  const target = 25;
  const progress = (todaysReads / target) * 100;

  return (
    <div className="p-4 space-y-6">
      {/* Welcome / Action */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-slate-400 text-sm">Welcome back,</p>
          <h2 className="text-2xl font-bold text-white">Technician Joe</h2>
        </div>
        <button 
          onClick={onQuickScan}
          className="bg-primary hover:bg-primaryDark text-white p-2 rounded-full shadow-lg shadow-cyan-500/20 active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Progress Card */}
      <div className="bg-gradient-to-br from-surface to-slate-900 border border-slate-700 p-5 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <TrendingUp size={80} className="text-white" />
        </div>
        <h3 className="text-slate-300 font-medium mb-1">Daily Target</h3>
        <div className="flex items-end space-x-2 mb-3">
          <span className="text-4xl font-bold text-white">{todaysReads}</span>
          <span className="text-lg text-slate-500 mb-1">/ {target} meters</span>
        </div>
        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-primary h-full rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface border border-slate-700 p-4 rounded-xl flex flex-col items-center justify-center text-center">
          <div className="p-2 bg-green-500/10 rounded-full mb-2">
            <CheckCircle2 className="text-green-500 w-5 h-5" />
          </div>
          <span className="text-2xl font-bold text-white">98%</span>
          <span className="text-xs text-slate-400">Accuracy Rate</span>
        </div>
        <div className="bg-surface border border-slate-700 p-4 rounded-xl flex flex-col items-center justify-center text-center">
          <div className="p-2 bg-amber-500/10 rounded-full mb-2">
            <AlertTriangle className="text-amber-500 w-5 h-5" />
          </div>
          <span className="text-2xl font-bold text-white">2</span>
          <span className="text-xs text-slate-400">Pending Review</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-surface border border-slate-700 p-5 rounded-2xl">
        <h3 className="text-white font-medium mb-4 text-sm">Weekly Activity</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                dy={10}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="reads" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 4 ? '#06b6d4' : '#334155'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};