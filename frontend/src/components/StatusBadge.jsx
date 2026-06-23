import React from 'react';
import { getScoreStatus, getScoreColor } from '../utils/scoreHelpers';

export const StatusBadge = ({ score, status }) => {
  let displayLabel = status;
  let colors = { text: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' };

  if (score !== undefined && score !== null) {
    const scoreStatus = getScoreStatus(score);
    displayLabel = scoreStatus.label;
    colors = getScoreColor(score);
  } else if (status) {
    const normalized = status.toLowerCase();
    if (normalized === 'excellent') {
      colors = { text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' };
      displayLabel = 'Excellent';
    } else if (normalized === 'good') {
      colors = { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
      displayLabel = 'Good';
    } else if (normalized.includes('improvement') || normalized === 'needs work' || normalized === 'warning') {
      colors = { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
      displayLabel = 'Needs Improvement';
    } else if (normalized === 'poor') {
      colors = { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' };
      displayLabel = 'Poor';
    } else if (normalized === 'critical') {
      colors = { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
      displayLabel = 'Critical';
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colors.bg} ${colors.text} ${colors.border} whitespace-nowrap`}>
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
