import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

const data = [
  { name: 'Jan', sales: 4000, revenue: 2400, profit: 1200 },
  { name: 'Feb', sales: 3000, revenue: 1398, profit: 800 },
  { name: 'Mar', sales: 2000, revenue: 9800, profit: 4500 },
  { name: 'Apr', sales: 2780, revenue: 3908, profit: 2100 },
  { name: 'May', sales: 1890, revenue: 4800, profit: 2400 },
  { name: 'Jun', sales: 2390, revenue: 3800, profit: 1900 },
  { name: 'Jul', sales: 3490, revenue: 4300, profit: 2200 },
  { name: 'Aug', sales: 4200, revenue: 5100, profit: 2800 },
  { name: 'Sep', sales: 3800, revenue: 4600, profit: 2400 },
  { name: 'Oct', sales: 4500, revenue: 5200, profit: 2900 },
  { name: 'Nov', sales: 5100, revenue: 5800, profit: 3200 },
  { name: 'Dec', sales: 5800, revenue: 6500, profit: 3800 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-purple-500/20 p-4">
        <p className="text-sm font-semibold text-purple-100 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">${entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const SalesChart = () => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg shadow-purple-500/10 p-6 border border-purple-500/20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Sales Overview</h3>
          <p className="text-sm text-purple-300 mt-1">Monthly performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all">
            This Year
          </button>
          <button className="px-4 py-2 text-sm font-medium text-purple-300 hover:bg-white/10 rounded-xl transition-colors">
            Last Year
          </button>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 85, 247, 0.15)" vertical={false} />
          <XAxis dataKey="name" stroke="rgba(233, 213, 255, 0.7)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="rgba(233, 213, 255, 0.7)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Area 
            type="monotone" 
            dataKey="sales" 
            stroke="#8b5cf6" 
            strokeWidth={3} 
            fill="url(#salesGradient)" 
            name="Sales"
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#06b6d4" 
            strokeWidth={3} 
            fill="url(#revenueGradient)" 
            name="Revenue"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;