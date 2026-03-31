import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, trendUp, gradient }) => {
  const gradients = {
    violet: 'from-violet-500 via-purple-500 to-fuchsia-500',
    blue: 'from-blue-500 via-cyan-500 to-teal-500',
    emerald: 'from-emerald-500 via-green-500 to-teal-500',
    orange: 'from-orange-500 via-amber-500 to-yellow-500',
    pink: 'from-pink-500 via-rose-500 to-red-500',
  };

  const selectedGradient = gradients[gradient] || gradients.violet;

  return (
    <div className="group relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 overflow-hidden">
      {/* Gradient accent */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${selectedGradient}`} />
      
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-300 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-white mt-2">{value}</p>
          </div>
          <div className={`p-4 bg-gradient-to-br ${selectedGradient} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        
        <div className="mt-4 flex items-center">
          <div className={`flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
            trendUp 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}>
            {trendUp ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1" />
            )}
            {trend}
          </div>
          <span className="text-purple-400 text-sm ml-2">vs last month</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;