import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Calendar } from 'lucide-react';

export const AnalysisHistory = ({ history = [], loading = false }) => {
  if (loading) {
    return <div className="text-center py-8 text-gray-500 text-sm">Loading history data...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400 border border-dashed border-surface-border rounded-lg bg-white">
        <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <h4 className="font-bold text-gray-700">No analysis history</h4>
        <p className="text-xs text-gray-500 mt-1">Run an analysis to generate history records.</p>
      </div>
    );
  }

  // Format history for Recharts (oldest first)
  const chartData = [...history]
    .map((item) => ({
      date: new Date(item.analyzedAt || item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      health: item.healthScore,
      activity: item.activityScore,
      documentation: item.documentationScore,
      complexity: item.complexityScore,
    }))
    .reverse();

  const tooltipStyle = {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '11px',
    padding: '6px 10px'
  };

  return (
    <div className="space-y-8">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score Trend */}
        <div className="bg-white border border-surface-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Health Score Trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: '500' }} stroke="#CBD5E1" axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: '500' }} stroke="#CBD5E1" axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={{ fontWeight: '600', fontFamily: 'monospace' }}
                  labelStyle={{ color: '#94A3B8', fontWeight: '500', marginBottom: '2px' }}
                />
                <Line type="monotone" dataKey="health" stroke="#10B981" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Score Trend */}
        <div className="bg-white border border-surface-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Activity Score Trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: '500' }} stroke="#CBD5E1" axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: '500' }} stroke="#CBD5E1" axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={{ fontWeight: '600', fontFamily: 'monospace' }}
                  labelStyle={{ color: '#94A3B8', fontWeight: '500', marginBottom: '2px' }}
                />
                <Line type="monotone" dataKey="activity" stroke="#0066CC" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Documentation Score Trend */}
        <div className="bg-white border border-surface-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Documentation Score Trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: '500' }} stroke="#CBD5E1" axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: '500' }} stroke="#CBD5E1" axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={{ fontWeight: '600', fontFamily: 'monospace' }}
                  labelStyle={{ color: '#94A3B8', fontWeight: '500', marginBottom: '2px' }}
                />
                <Line type="monotone" dataKey="documentation" stroke="#6366F1" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Analysis History Table */}
      <div className="bg-white border border-surface-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Analysis Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-surface-border">
              <tr>
                <th scope="col" className="px-6 py-3">Analysis Date</th>
                <th scope="col" className="px-6 py-3">Documentation Score</th>
                <th scope="col" className="px-6 py-3">Complexity Score</th>
                <th scope="col" className="px-6 py-3">Activity Score</th>
                <th scope="col" className="px-6 py-3">Health Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {history.map((record, index) => (
                <tr key={record.id || index} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {new Date(record.analyzedAt || record.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-mono">{record.documentationScore}/100</td>
                  <td className="px-6 py-4 font-mono">{record.complexityScore}/100</td>
                  <td className="px-6 py-4 font-mono">{record.activityScore}/100</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                      record.healthScore >= 80 ? 'bg-green-50 text-green-700 border border-green-200' :
                      record.healthScore >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {record.healthScore}/100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalysisHistory;
