import React from 'react';
import { Eye, MoreVertical } from 'lucide-react';

const orders = [
  { id: 'ORD-001', customer: 'John Doe', email: 'john@email.com', amount: '$125.00', status: 'Completed', date: '2024-03-20' },
  { id: 'ORD-002', customer: 'Jane Smith', email: 'jane@email.com', amount: '$89.99', status: 'Processing', date: '2024-03-19' },
  { id: 'ORD-003', customer: 'Robert Johnson', email: 'robert@email.com', amount: '$210.50', status: 'Completed', date: '2024-03-18' },
  { id: 'ORD-004', customer: 'Emily Davis', email: 'emily@email.com', amount: '$45.00', status: 'Pending', date: '2024-03-17' },
  { id: 'ORD-005', customer: 'Michael Brown', email: 'michael@email.com', amount: '$320.75', status: 'Completed', date: '2024-03-16' },
  { id: 'ORD-006', customer: 'Sarah Wilson', email: 'sarah@email.com', amount: '$156.00', status: 'Shipped', date: '2024-03-15' },
];

const getStatusStyle = (status) => {
  switch (status) {
    case 'Completed':
      return {
        bg: 'bg-gradient-to-r from-emerald-50 to-green-50',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
        border: 'border-emerald-200'
      };
    case 'Processing':
      return {
        bg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
        text: 'text-blue-700',
        dot: 'bg-blue-500',
        border: 'border-blue-200'
      };
    case 'Pending':
      return {
        bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
        border: 'border-amber-200'
      };
    case 'Shipped':
      return {
        bg: 'bg-gradient-to-r from-purple-50 to-violet-50',
        text: 'text-purple-700',
        dot: 'bg-purple-500',
        border: 'border-purple-200'
      };
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        dot: 'bg-gray-500',
        border: 'border-gray-200'
      };
  }
};

const RecentOrdersTable = () => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg shadow-purple-500/10 border border-purple-500/20 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-purple-500/20 bg-slate-900/40">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Recent Orders</h3>
            <p className="text-sm text-purple-300 mt-1">Latest transactions from your store</p>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-purple-200 hover:bg-white/10 rounded-xl transition-colors border border-purple-500/20">
            <Eye className="w-4 h-4" />
            <span>View All</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-slate-900/40">
              <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-500/10">
            {orders.map((order) => {
              const statusStyle = getStatusStyle(order.status);
              return (
                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                      {order.id}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-white">{order.customer}</p>
                      <p className="text-xs text-purple-400">{order.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-purple-100">{order.amount}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                      <span className={`w-2 h-2 rounded-full ${statusStyle.dot} mr-2`} />
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-300">
                    {order.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="p-2 text-purple-400 hover:text-purple-200 hover:bg-white/10 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrdersTable;