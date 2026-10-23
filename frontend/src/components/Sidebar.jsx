import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BrainCircuit,
  Bell,
  ShieldAlert,
  LogOut,
  Moon,
  Sun,
  Pill,
} from 'lucide-react';

const Sidebar = ({ darkMode, setDarkMode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'pharmacist', 'manager'] },
    { path: '/inventory', label: 'Inventory', icon: Package, roles: ['admin', 'pharmacist', 'manager'] },
    { path: '/sales', label: 'Sales / POS', icon: ShoppingCart, roles: ['admin', 'pharmacist'] },
    { path: '/forecast', label: 'AI Forecast', icon: BrainCircuit, roles: ['admin', 'pharmacist', 'manager'] },
    { path: '/alerts', label: 'Alert Center', icon: Bell, roles: ['admin', 'pharmacist', 'manager'] },
    { path: '/audit-logs', label: 'Audit Logs', icon: ShieldAlert, roles: ['admin'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen bg-white dark:bg-darkCard border-r border-slate-200 dark:border-slate-700/50 flex flex-col transition-colors duration-300">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 dark:border-slate-700/50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Pill className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight gradient-text">Smart Pharmacy</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">AI Inventory System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all-ease ${
                isActive
                  ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700/50 space-y-3">
        {/* User info */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate dark:text-slate-200">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all-ease"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {darkMode ? 'Light' : 'Dark'}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all-ease"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
