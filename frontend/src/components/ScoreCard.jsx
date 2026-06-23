import React from 'react';

export const ScoreCard = ({ title, score, maxScore = 100, subtitle }) => {
  // Determine score health status
  const getStatusColor = (val) => {
    if (val >= 80) return { text: 'text-green-600', bg: 'bg-green-600', lightBg: 'bg-green-50', label: 'Good' };
    if (val >= 50) return { text: 'text-amber-500', bg: 'bg-amber-500', lightBg: 'bg-amber-50', label: 'Needs Improvement' };
    return { text: 'text-red-500', bg: 'bg-red-500', lightBg: 'bg-red-50', label: 'Poor' };
  };

  const status = getStatusColor(score);

  return (
    <div className="bg-white border border-surface-border p-5 rounded-lg shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <span className="text-sm font-semibold text-gray-500">{title}</span>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${status.lightBg} ${status.text}`}>
          {subtitle || status.label}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-baseline space-x-1">
          <span className="text-3xl font-extrabold text-gray-900">{score}</span>
          <span className="text-sm font-medium text-gray-400">/{maxScore}</span>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full ${status.bg}`}
            style={{ width: `${(score / maxScore) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
