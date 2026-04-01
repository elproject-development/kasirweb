import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, User, Search, ChevronDown } from 'lucide-react';

const Header = ({ setSidebarOpen }) => {
  const location = useLocation();
  const isPosPage = location.pathname === '/pos';
  const [posSearchOnly, setPosSearchOnly] = useState(false);

  useEffect(() => {
    if (!isPosPage) return;
    try {
      const saved = localStorage.getItem('posSearchOnly');
      setPosSearchOnly(saved === 'true');
    } catch {
      setPosSearchOnly(false);
    }
  }, [isPosPage]);

  const handleTogglePosMode = () => {
    const next = !posSearchOnly;
    setPosSearchOnly(next);
    try {
      localStorage.setItem('posSearchOnly', String(next));
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent('posSearchOnlyChanged', { detail: { value: next } }));
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur-xl border-b border-purple-500/20 shadow-sm">
      <div className="flex items-center justify-between px-3 py-3 sm:px-6 sm:py-3">
       
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            className="lg:hidden p-2 text-purple-300 hover:bg-white/10 rounded-xl transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          {isPosPage && (
            <button
              type="button"
              onClick={handleTogglePosMode}
              className={`flex items-center gap-2 px-2.5 py-2 md:px-3 rounded-xl border transition-all duration-200 ease-out active:scale-[0.98] ${
                posSearchOnly
                  ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white border-purple-400/30 shadow-lg shadow-purple-500/30'
                  : 'bg-slate-800/60 text-purple-200 border-purple-500/20 hover:bg-slate-800'
              }`}
              title="Mode POS: Produk hanya muncul saat cari"
            >
              <Search
                className={`w-4 h-4 transition-transform duration-300 ease-out ${
                  posSearchOnly ? 'rotate-12 scale-110' : 'rotate-0 scale-100'
                }`}
              />
              <span className="hidden sm:inline text-xs font-semibold">Cari Saja</span>
              <span
                className={`relative inline-flex h-4 w-8 md:h-5 md:w-9 items-center rounded-full transition-colors duration-300 ease-out ${
                  posSearchOnly ? 'bg-white/30' : 'bg-white/10'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 md:h-4 md:w-4 transform rounded-full bg-white transition-[transform,box-shadow] duration-300 ease-out ${
                    posSearchOnly
                      ? 'translate-x-4 shadow-md shadow-purple-500/30'
                      : 'translate-x-1 shadow-sm shadow-black/20'
                  }`}
                />
              </span>
            </button>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Notification */}
          <button className="relative p-2.5 text-purple-300 hover:bg-white/10 rounded-full transition-all">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full animate-pulse" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;