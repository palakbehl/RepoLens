import React from 'react';
import StatusBadge from './StatusBadge';
import { getScoreColor } from '../utils/scoreHelpers';

export const MetricCard = ({ title, score, maxScore = 100, status, explanation, trend }) => {
  const barColor = score !== undefined ? getScoreColor(score).bar : 'bg-brand';

  return (
    <div className="bg-white border border-surface-border p-5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div className="space-y-4">
        {/* Title and Badge */}
        <div className="flex justify-between items-start flex-wrap gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-sans group-hover:text-gray-500 transition-colors">
            {title}
          </span>
          {(status || score !== undefined) && (
            <StatusBadge score={score} status={status} />
          )}
        </div>

        {/* Score Value & Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-bold font-mono text-gray-900 tracking-tight">
              {score !== undefined ? score : '—'}
            </span>
            {score !== undefined && (
              <span className="text-sm font-semibold text-gray-400">/{maxScore}</span>
            )}
          </div>

          {/* Progress Bar indicator */}
          {score !== undefined && (
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full ${barColor} transition-all duration-500`}
                style={{ width: `${(score / maxScore) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Trend Indicator */}
        {trend && (
          <div className="flex items-center space-x-1.5 text-xs font-semibold">
            <span className={trend.isPositive ? 'text-green-600' : 'text-red-500'}>
              {trend.text}
            </span>
            <span className="text-gray-400 font-medium">
              {trend.subtext || 'from last run'}
            </span>
          </div>
        )}
      </div>

      {/* Contextual short explanation */}
      {explanation && (
        <p className="text-xs text-gray-500 leading-relaxed pt-3 border-t border-gray-100/70 mt-4 group-hover:text-gray-600 transition-colors font-medium">
          {explanation}
        </p>
      )}
    </div>
  );
};

export default MetricCard;
