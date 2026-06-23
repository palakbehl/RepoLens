import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, PlusCircle, Info, BarChart3 } from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Repositories', path: '/repositories', icon: Database },
    { name: 'Add Repository', path: '/repositories/add', icon: PlusCircle },
  ];



  return (
    <aside className="w-64 bg-white border-r border-surface-border flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Brand Logo */}
      <div className="h-16 px-6 border-b border-surface-border flex items-center space-x-2.5">
        <div className="bg-brand p-1.5 rounded text-white flex items-center justify-center">
          <BarChart3 className="w-5 h-5" />
        </div>
        <span className="text-xl font-bold tracking-tight text-gray-900">RepoLens</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded transition-colors ${
                isActive
                  ? 'bg-brand-light text-brand'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => {
              const Icon = item.icon;
              return (
                <>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </>
              );
            }}
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-surface-border space-y-1.5 bg-gray-50/50">
        <div className="flex items-center space-x-3 px-3 py-2 text-xs font-semibold text-gray-400 select-none">
          <Info className="w-4 h-4 text-gray-400" />
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
