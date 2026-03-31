import React, { useState } from 'react';
import { LayoutDashboard, Globe, Users, Settings, X, BarChart3, Package, Bell, ShoppingCart, BookAlert, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, to: '/', color: 'from-violet-500 to-purple-600' },
    { name: 'Analytics', icon: BarChart3, to: null, color: 'from-blue-500 to-cyan-500' },
    { name: 'Pos', icon: ShoppingCart, to: '/pos', color: 'from-purple-500 to-pink-500' },
    { name: 'Produk', icon: Package, to: '/products', color: 'from-emerald-500 to-teal-500' },
    { name: 'Users', icon: Users, to: '/users', color: 'from-orange-500 to-amber-500' },
    { name: 'Settings', icon: Settings, to: '/settings', color: 'from-pink-500 to-rose-500' },
    { name: 'Laporan', icon: BookAlert, to: '/reports', color: 'from-purple-500 to-pink-500' },
    { name: 'Catatan', icon: Wallet, to: '/expenses', color: 'from-red-500 to-orange-500' },
  ];

  return (
    <>
      {/* Overlay untuk mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gradient-to-br from-slate-900/80 to-purple-900/80 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-all duration-300 ease-in-out z-30 w-72 lg:static lg:inset-0 ${
          collapsed ? 'lg:w-20' : 'lg:w-72'
        }`}
      >
        <div className="h-full bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 shadow-2xl shadow-purple-500/20 border-r border-purple-500/20">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
            <div className={`flex items-center ${collapsed ? 'lg:justify-center lg:w-full lg:space-x-0' : 'space-x-3'}`}>
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span
                className={`text-xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent ${
                  collapsed ? 'lg:hidden' : ''
                }`}
              >
                ELKasirWeb
              </span>
            </div>
            <button
              className="lg:hidden text-purple-300 hover:text-white transition-colors"
              onClick={() => setSidebarOpen(false)}
              type="button"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="mt-8 px-4">
            <p
              className={`text-purple-400/60 text-xs font-semibold uppercase tracking-wider mb-4 px-4 ${
                collapsed ? 'lg:hidden' : ''
              }`}
            >
            </p>
            {menuItems.map((item) => (
              item.to ? (
                <NavLink
                  key={item.name}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center px-4 py-3.5 mb-2 rounded-xl transition-all duration-300 ${
                      collapsed ? 'lg:justify-center lg:px-3' : ''
                    } ${
                      isActive
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                        : 'text-purple-200 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={`${collapsed ? 'mr-3 lg:mr-0' : 'mr-3'} h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-purple-400 group-hover:text-purple-300'}`} />
                      <span className={`font-medium ${collapsed ? 'lg:hidden' : ''}`}>{item.name}</span>
                      {isActive && (
                        <div className={`ml-auto w-2 h-2 bg-white rounded-full animate-pulse ${collapsed ? 'lg:hidden' : ''}`} />
                      )}
                    </>
                  )}
                </NavLink>
              ) : (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    // Placeholder menu item
                    setSidebarOpen(false);
                  }}
                  className={`group w-full flex items-center px-4 py-3.5 mb-2 rounded-xl transition-all duration-300 ${
                    collapsed ? 'lg:justify-center lg:px-3' : ''
                  } ${
                    location.pathname === item.to
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                      : 'text-purple-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className={`${collapsed ? 'mr-3 lg:mr-0' : 'mr-3'} h-5 w-5 shrink-0 text-purple-400 group-hover:text-purple-300`} />
                  <span className={`font-medium ${collapsed ? 'lg:hidden' : ''}`}>{item.name}</span>
                </button>
              )
            ))}

            <div className="mt-6 pt-4 border-t border-purple-500/20">
              <button
                className={`hidden lg:flex items-center ${collapsed ? 'justify-center' : 'justify-between'} w-full px-4 py-3 rounded-xl text-purple-200 hover:bg-white/10 hover:text-white transition-colors`}
                onClick={() => setCollapsed((v) => !v)}
                title={collapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
                type="button"
              >
                <span className="flex items-center gap-3">
                  {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                  {!collapsed && <span className="font-medium">Tutup Sidebar</span>}
                </span>
              </button>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;