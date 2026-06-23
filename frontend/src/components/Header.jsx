import React, { useState } from 'react';
import { Search, RefreshCw, CheckCircle2 } from 'lucide-react';

export const Header = ({ onRefresh, isRefreshing = false, lastUpdated = 'Just now' }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // Optional: filter search callback
  };

  return (
    <header className="h-16 border-b border-surface-border bg-white flex items-center justify-between px-8 sticky top-0 z-20">
      {/* Search Input */}
      <div className="relative w-72">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search repositories..."
          className="w-full bg-surface-alt border border-surface-border rounded pl-9 pr-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:bg-white transition-colors"
        />
      </div>

      {/* Action Area */}
      <div className="flex items-center space-x-4">
        {/* Last updated indicator */}
        <div className="flex items-center space-x-1.5 text-xs text-gray-500 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          <span>Last updated: {lastUpdated}</span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-1.5 px-3 py-1.5 border border-surface-border rounded bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 disabled:opacity-50 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${isRefreshing ? 'animate-spin text-brand' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
