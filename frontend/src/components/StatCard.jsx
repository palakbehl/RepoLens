import React from 'react';

export const StatCard = ({ title, value, icon: Icon, iconColorClass = 'text-brand', bgColorClass = 'bg-brand-light' }) => {
  return (
    <div className="bg-white border border-surface-border p-5 rounded-lg flex items-center justify-between shadow-sm">
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</span>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
      </div>
      {Icon && (
        <div className={`p-2.5 rounded ${bgColorClass}`}>
          <Icon className={`w-5 h-5 ${iconColorClass}`} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
