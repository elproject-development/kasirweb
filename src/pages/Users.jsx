import React from 'react';
import { User } from 'lucide-react';

const Users = () => {
  const dummyUsers = [
    { id: 1, name: 'Admin', role: 'Administrator', email: 'admin@example.com' },
    { id: 2, name: 'Kasir 1', role: 'Cashier', email: 'kasir1@example.com' },
    { id: 3, name: 'Kasir 2', role: 'Cashier', email: 'kasir2@example.com' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Manajemen Pengguna</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {dummyUsers.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;