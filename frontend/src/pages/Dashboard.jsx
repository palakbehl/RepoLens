import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import MetricCard from '../components/MetricCard';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { Folder, ChevronRight, AlertCircle, Sparkles, ShieldAlert, Award } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export const Dashboard = () => {
  const { registerRefreshHandler } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    repos: [],
    analyses: [],
    trendHistory: [],
    mostActive: null,
    mostAtRisk: null,
    trends: {
      health: null,
      activity: null,
      doc: null,
      complexity: null
    },
    stats: {
      total: 0,
      avgHealth: 0,
      avgActivity: 0,
      avgDoc: 0,
      avgComplexity: 0,
      lowRisk: 0,
      mediumRisk: 0,
      highRisk: 0,
    },
  });

  const fetchData = async () => {
    try {
      setError(null);
      const repos = await apiService.getRepositories();
      
      const reposWithAnalysis = await Promise.all(
        repos.map(async (repo) => {
          try {
            const analysis = await apiService.getLatestAnalysis(repo.id);
            return { ...repo, analysis };
          } catch (e) {
            return { ...repo, analysis: null };
          }
        })
      );

      const analyses = reposWithAnalysis.filter(r => r.analysis !== null).map(r => ({
        repoName: r.name,
        repoId: r.id,
        language: r.primaryLanguage,
        ...r.analysis,
      }));

      // Fetch histories to compute trends
      const allHistories = await Promise.all(
        repos.map(async (repo) => {
          try {
            const hist = await apiService.getRepositoryHistory(repo.id);
            return hist.map(h => ({
              date: new Date(h.analyzedAt || h.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
              rawDate: new Date(h.analyzedAt || h.createdAt),
              health: h.healthScore,
              activity: h.activityScore,
              doc: h.documentationScore,
              complexity: h.complexityScore
            }));
          } catch (e) {
            return [];
          }
        })
      );

      const flatHistory = allHistories.flat();
      const groupedByDate = {};
      flatHistory.forEach(item => {
        if (!groupedByDate[item.date]) {
          groupedByDate[item.date] = { date: item.date, rawDate: item.rawDate, healthSum: 0, actSum: 0, docSum: 0, compSum: 0, count: 0 };
        }
        groupedByDate[item.date].healthSum += item.health;
        groupedByDate[item.date].actSum += item.activity;
        groupedByDate[item.date].docSum += item.doc;
        groupedByDate[item.date].compSum += item.complexity;
        groupedByDate[item.date].count += 1;
      });

      const trendHistory = Object.values(groupedByDate)
        .sort((a, b) => a.rawDate - b.rawDate)
        .map(g => ({
          date: g.date,
          health: Math.round(g.healthSum / g.count),
          activity: Math.round(g.actSum / g.count),
          documentation: Math.round(g.docSum / g.count),
          complexity: Math.round(g.compSum / g.count),
        }));

      // Calculate stats & intelligence lists
      const total = repos.length;
      let lowRisk = 0;
      let mediumRisk = 0;
      let highRisk = 0;
      
      let sumHealth = 0;
      let sumActivity = 0;
      let sumDoc = 0;
      let sumComplexity = 0;
      let analyzedCount = 0;

      let mostActive = null;
      let highestActivity = -1;
      let mostAtRisk = null;
      let lowestHealth = 101;

      analyses.forEach((analysis) => {
        analyzedCount++;
        sumHealth += analysis.healthScore;
        sumActivity += analysis.activityScore;
        sumDoc += analysis.documentationScore;
        sumComplexity += analysis.complexityScore;

        // Risk buckets: low risk (health >= 80), medium risk (50-79), high risk (<50)
        if (analysis.healthScore >= 80) lowRisk++;
        else if (analysis.healthScore >= 50) mediumRisk++;
        else highRisk++;

        // Most Active (highest activity)
        if (analysis.activityScore > highestActivity) {
          highestActivity = analysis.activityScore;
          mostActive = { name: analysis.repoName, score: analysis.activityScore, language: analysis.language, id: analysis.repoId };
        }

        // Most At-Risk (lowest health)
        if (analysis.healthScore < lowestHealth) {
          lowestHealth = analysis.healthScore;
          mostAtRisk = { name: analysis.repoName, score: analysis.healthScore, language: analysis.language, id: analysis.repoId };
        }
      });

      const avgHealth = analyzedCount > 0 ? Math.round(sumHealth / analyzedCount) : 0;
      const avgActivity = analyzedCount > 0 ? Math.round(sumActivity / analyzedCount) : 0;
      const avgDoc = analyzedCount > 0 ? Math.round(sumDoc / analyzedCount) : 0;
      const avgComplexity = analyzedCount > 0 ? Math.round(sumComplexity / analyzedCount) : 0;

      // Calculate trends
      let healthTrend = { text: '—', isPositive: true, subtext: 'first run' };
      let activityTrend = { text: '—', isPositive: true, subtext: 'first run' };
      let docTrend = { text: '—', isPositive: true, subtext: 'first run' };
      let complexityTrend = { text: '—', isPositive: true, subtext: 'first run' };

      if (trendHistory.length >= 2) {
        const latest = trendHistory[trendHistory.length - 1];
        const previous = trendHistory[trendHistory.length - 2];
        
        const diffHealth = latest.health - previous.health;
        healthTrend = {
          isPositive: diffHealth >= 0,
          text: diffHealth >= 0 ? `↑ ${Math.abs(diffHealth)}%` : `↓ ${Math.abs(diffHealth)}%`,
          subtext: 'vs previous run'
        };

        const diffActivity = latest.activity - previous.activity;
        activityTrend = {
          isPositive: diffActivity >= 0,
          text: diffActivity >= 0 ? `↑ ${Math.abs(diffActivity)}%` : `↓ ${Math.abs(diffActivity)}%`,
          subtext: 'vs previous run'
        };

        const diffDoc = latest.documentation - previous.documentation;
        docTrend = {
          isPositive: diffDoc >= 0,
          text: diffDoc >= 0 ? `↑ ${Math.abs(diffDoc)}%` : `↓ ${Math.abs(diffDoc)}%`,
          subtext: 'vs previous run'
        };

        const diffComp = latest.complexity - previous.complexity;
        complexityTrend = {
          isPositive: diffComp >= 0,
          text: diffComp >= 0 ? `↑ ${Math.abs(diffComp)}%` : `↓ ${Math.abs(diffComp)}%`,
          subtext: 'vs previous run'
        };
      }

      setData({
        repos: reposWithAnalysis,
        analyses,
        trendHistory,
        mostActive,
        mostAtRisk,
        trends: {
          health: healthTrend,
          activity: activityTrend,
          doc: docTrend,
          complexity: complexityTrend
        },
        stats: {
          total,
          avgHealth,
          avgActivity,
          avgDoc,
          avgComplexity,
          lowRisk,
          mediumRisk,
          highRisk,
        },
      });
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data. Please check if backend API is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    registerRefreshHandler(fetchData);
  }, []);

  if (loading) {
    return <LoadingSpinner message="Analyzing system health metrics..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-bold">Error: </span>
          <span>{error}</span>
        </div>
        <button
          onClick={fetchData}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  const hasAnalyses = data.analyses.length > 0;

  // Pie chart risk distribution
  const riskDistributionData = [
    { name: 'Low Risk (>=80)', value: data.stats.lowRisk, color: '#10B981' },
    { name: 'Medium Risk (50-79)', value: data.stats.mediumRisk, color: '#F59E0B' },
    { name: 'High Risk (<50)', value: data.stats.highRisk, color: '#EF4444' },
  ].filter(d => d.value > 0);

  const riskPieData = hasAnalyses ? riskDistributionData : [
    { name: 'No data', value: 1, color: '#E5E7EB' }
  ];

  // Explanations for Score ranges
  const getHealthExplanation = (score) => {
    if (score >= 80) return 'Repositories are in healthy shape overall with solid maintainability.';
    if (score >= 50) return 'Most repositories require maintenance and quality improvements.';
    return 'Critical code complexity, documentation, or activity deficits detected.';
  };

  const getActivityExplanation = (score) => {
    if (score >= 80) return 'High development frequency and active codebase updates.';
    if (score >= 50) return 'Periodic updates, but commit frequency has slowed down.';
    return 'Very few commits or issues resolved in the last few months.';
  };

  const getDocExplanation = (score) => {
    if (score >= 80) return 'READMEs and installation details are thoroughly covered.';
    if (score >= 50) return 'Most projects have basic readmes but lack setup instructions.';
    return 'Important setup, usage, or contribution details are completely missing.';
  };

  const getComplexityExplanation = (score) => {
    if (score >= 80) return 'Codebases are clean, modular, and easy to maintain.';
    if (score >= 50) return 'Moderate complexity. Refactoring monolithic files will prevent regression.';
    return 'High smell density and complex nested branches reduce maintainability.';
  };

  const tooltipStyle = {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '12px',
    padding: '8px 12px'
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of engineering quality, activity metrics, and analysis health</p>
      </div>

      {/* Polish Dashboard KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white border border-surface-border p-5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-500 transition-colors">Total Repositories</span>
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
                <Folder className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold font-mono text-gray-900 tracking-tight">{data.stats.total}</span>
              <span className="text-sm font-semibold text-gray-400">repos</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed pt-3 border-t border-gray-100/70 mt-4 group-hover:text-gray-600 transition-colors font-medium">
            Active repositories onboarded and monitored.
          </p>
        </div>

        <MetricCard
          title="Average Health Score"
          score={hasAnalyses ? data.stats.avgHealth : undefined}
          status={hasAnalyses ? undefined : 'No Data'}
          explanation={getHealthExplanation(data.stats.avgHealth)}
          trend={hasAnalyses ? data.trends?.health : undefined}
        />

        <MetricCard
          title="Average Activity Score"
          score={hasAnalyses ? data.stats.avgActivity : undefined}
          status={hasAnalyses ? undefined : 'No Data'}
          explanation={getActivityExplanation(data.stats.avgActivity)}
          trend={hasAnalyses ? data.trends?.activity : undefined}
        />

        <MetricCard
          title="Average Documentation Score"
          score={hasAnalyses ? data.stats.avgDoc : undefined}
          status={hasAnalyses ? undefined : 'No Data'}
          explanation={getDocExplanation(data.stats.avgDoc)}
          trend={hasAnalyses ? data.trends?.doc : undefined}
        />

        <MetricCard
          title="Average Complexity Score"
          score={hasAnalyses ? data.stats.avgComplexity : undefined}
          status={hasAnalyses ? undefined : 'No Data'}
          explanation={getComplexityExplanation(data.stats.avgComplexity)}
          trend={hasAnalyses ? data.trends?.complexity : undefined}
        />
      </div>

      {/* Intelligence Insights: Most Active & Most At Risk (Phase 8) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Active Repository Card */}
        <div className="bg-white border border-surface-border rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center space-x-4">
          <div className="p-3.5 bg-green-50 text-green-600 rounded">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Most Active Repository</span>
            {data.mostActive ? (
              <div className="flex items-center justify-between">
                <div>
                  <Link to={`/repositories/${data.mostActive.id}`} className="font-extrabold text-gray-900 hover:text-brand hover:underline">
                    {data.mostActive.name}
                  </Link>
                  <span className="text-xs text-gray-500 block mt-0.5">{data.mostActive.language || 'Multi-language'}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono text-green-600 block">{data.mostActive.score}/100</span>
                  <span className="text-[9px] text-gray-400 uppercase font-semibold tracking-wider block mt-0.5">Activity Score</span>
                </div>
              </div>
            ) : (
              <span className="text-sm text-gray-500 font-semibold">No active repositories tracked yet</span>
            )}
          </div>
        </div>

        {/* Most At Risk Repository Card */}
        <div className="bg-white border border-surface-border rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center space-x-4">
          <div className="p-3.5 bg-red-50 text-red-600 rounded">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Most At-Risk Repository</span>
            {data.mostAtRisk ? (
              <div className="flex items-center justify-between">
                <div>
                  <Link to={`/repositories/${data.mostAtRisk.id}`} className="font-extrabold text-gray-900 hover:text-brand hover:underline">
                    {data.mostAtRisk.name}
                  </Link>
                  <span className="text-xs text-gray-500 block mt-0.5">{data.mostAtRisk.language || 'Multi-language'}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono text-red-500 block">{data.mostAtRisk.score}/100</span>
                  <span className="text-[9px] text-gray-400 uppercase font-semibold tracking-wider block mt-0.5">Health Score</span>
                </div>
              </div>
            ) : (
              <span className="text-sm text-gray-500 font-semibold">No at-risk repositories tracked yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Repository Risk Distribution Pie */}
        <div className="bg-white border border-surface-border rounded-lg p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-200">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-4">Repository Risk Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            {hasAnalyses ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {riskPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={{ fontWeight: '600', fontFamily: 'monospace' }}
                    formatter={(value) => [`${value} repos`, 'Count']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '600', color: '#475569' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-gray-400 text-center font-medium">
                No analyses completed. Add and analyze repositories to populate.
              </div>
            )}
          </div>
        </div>

        {/* Health Score Trend */}
        <div className="bg-white border border-surface-border rounded-lg p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-200">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-4">Health Trend</h3>
          <div className="h-64">
            {data.trendHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trendHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: '500' }} stroke="#CBD5E1" axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: '500' }} stroke="#CBD5E1" axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={{ fontWeight: '600', fontFamily: 'monospace' }}
                    labelStyle={{ color: '#94A3B8', fontWeight: '500', marginBottom: '4px' }}
                  />
                  <Line type="monotone" dataKey="health" name="Avg Health" stroke="#10B981" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400 text-center font-medium">
                No health trends available.
              </div>
            )}
          </div>
        </div>

        {/* Activity Score Trend */}
        <div className="bg-white border border-surface-border rounded-lg p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-200">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-4">Activity Trend</h3>
          <div className="h-64">
            {data.trendHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trendHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: '500' }} stroke="#CBD5E1" axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: '500' }} stroke="#CBD5E1" axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={{ fontWeight: '600', fontFamily: 'monospace' }}
                    labelStyle={{ color: '#94A3B8', fontWeight: '500', marginBottom: '4px' }}
                  />
                  <Line type="monotone" dataKey="activity" name="Avg Activity" stroke="#0066CC" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400 text-center font-medium">
                No activity trends available.
              </div>
            )}
          </div>
        </div>

        {/* Documentation Score Trend */}
        <div className="bg-white border border-surface-border rounded-lg p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-200">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-4">Documentation Trend</h3>
          <div className="h-64">
            {data.trendHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trendHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: '500' }} stroke="#CBD5E1" axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: '500' }} stroke="#CBD5E1" axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={{ fontWeight: '600', fontFamily: 'monospace' }}
                    labelStyle={{ color: '#94A3B8', fontWeight: '500', marginBottom: '4px' }}
                  />
                  <Line type="monotone" dataKey="documentation" name="Avg Doc" stroke="#6366F1" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400 text-center font-medium">
                No documentation trends available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Repository Analysis table */}
      <div className="bg-white border border-surface-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Recent Analyses</h3>
          <Link
            to="/repositories"
            className="text-xs font-semibold text-brand hover:text-brand-dark flex items-center space-x-0.5"
          >
            <span>View all repositories</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          {hasAnalyses ? (
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-surface-border">
                <tr>
                  <th scope="col" className="px-6 py-3">Repository</th>
                  <th scope="col" className="px-6 py-3">Health Score</th>
                  <th scope="col" className="px-6 py-3">Last Analyzed</th>
                  <th scope="col" className="px-6 py-3">Language</th>
                  <th scope="col" className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {data.analyses.slice(0, 5).map((analysis) => (
                  <tr key={analysis.repoId} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                      {analysis.repoName}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        analysis.healthScore >= 80 ? 'bg-green-50 text-green-700 border border-green-200' :
                        analysis.healthScore >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {analysis.healthScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {new Date(analysis.analyzedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-600">
                      {analysis.language || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/repositories/${analysis.repoId}`}
                        className="text-xs font-semibold text-brand hover:text-brand-dark hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-sm text-gray-400 font-medium">
              No recent analyses found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
