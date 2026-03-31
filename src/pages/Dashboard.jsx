import React, { useState, useEffect } from 'react';
import { DollarSign, Users, ShoppingBag, TrendingUp, Sparkles } from 'lucide-react';
import StatCard from '../components/StatCard';
import SalesChart from '../components/SalesChart';
import RecentOrdersTable from '../components/RecentOrdersTable';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    totalOrders: 0,
    conversionRate: 0,
  });

  // Simulasi fetch data
  useEffect(() => {
    // Mock data
    setStats({
      totalRevenue: 125000,
      totalUsers: 12450,
      totalOrders: 3420,
      conversionRate: 2.4,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            Dashboard Overview
          </h2>
        </div>
        <p className="text-purple-300 ml-11">Welcome back! Here's what's happening with your business today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend="+12%"
          trendUp={true}
          gradient="violet"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          trend="+5%"
          trendUp={true}
          gradient="blue"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          icon={ShoppingBag}
          trend="+8%"
          trendUp={true}
          gradient="emerald"
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          icon={TrendingUp}
          trend="-0.2%"
          trendUp={false}
          gradient="orange"
        />
      </div>

      {/* Chart */}
      <div className="mb-8">
        <SalesChart />
      </div>

      {/* Recent Orders Table */}
      <RecentOrdersTable />
    </div>
  );
};

export default Dashboard;